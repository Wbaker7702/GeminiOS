/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI} from '@google/genai';
import {APP_DEFINITIONS_CONFIG, getSystemPrompt} from '../constants';
import {InteractionData} from '../types';

if (!process.env.API_KEY) {
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

// Initializing GoogleGenAI with named parameter apiKey
const ai = new GoogleGenAI({apiKey: process.env.API_KEY || ''});

export async function* streamAppContent(
  interactionHistory: InteractionData[],
  currentMaxHistoryLength: number,
): AsyncGenerator<string, void, void> {
  if (!process.env.API_KEY) {
    yield `<div class="p-4 text-red-700 bg-red-100 rounded-lg">
      <p class="font-bold text-lg">Configuration Error</p>
      <p class="mt-2">The API_KEY is not configured. Please set the API_KEY environment variable.</p>
    </div>`;
    return;
  }

  if (interactionHistory.length === 0) {
    yield `<div class="p-4 text-orange-700 bg-orange-100 rounded-lg">
      <p class="font-bold text-lg">No interaction data provided.</p>
    </div>`;
    return;
  }

  const currentInteraction = interactionHistory[0];
  const pastInteractions = interactionHistory.slice(1);
  const appContext = currentInteraction.appContext;

  // -- Model Selection Strategy --
  // Default: 'gemini-flash-lite-latest' (Flash Lite) for fast, general UI generation.
  // Complex/Assistant: 'gemini-3-pro-preview' for advanced reasoning and chat.
  let model = 'gemini-flash-lite-latest';
  let config: any = {};

  if (appContext === 'gemini_assistant') {
    model = 'gemini-3-pro-preview';
    // Enable thinking for complex assistant queries
    config.thinkingConfig = { thinkingBudget: 2048 }; 
  } else if (appContext === 'camera_app') {
    // Pro model for potential image analysis capabilities in the studio
    model = 'gemini-3-pro-preview';
  }

  const systemPrompt = getSystemPrompt(currentMaxHistoryLength);

  const currentElementName =
    currentInteraction.elementText ||
    currentInteraction.id ||
    'Unknown Element';
  let currentInteractionSummary = `Current User Interaction: Clicked on '${currentElementName}' (Type: ${currentInteraction.type || 'N/A'}, ID: ${currentInteraction.id || 'N/A'}).`;
  if (currentInteraction.value) {
    currentInteractionSummary += ` Associated value: '${currentInteraction.value.substring(0, 100)}'.`;
  }

  const currentAppDef = APP_DEFINITIONS_CONFIG.find(
    (app) => app.id === appContext,
  );
  const currentAppContextStr = appContext
    ? `Current App Context: '${currentAppDef?.name || appContext}'.`
    : 'No specific app context for current interaction.';

  let historyPromptSegment = '';
  if (pastInteractions.length > 0) {
    const numPrevInteractionsToMention =
      currentMaxHistoryLength - 1 > 0 ? currentMaxHistoryLength - 1 : 0;
    historyPromptSegment = `\n\nPrevious User Interactions (up to ${numPrevInteractionsToMention} most recent):`;

    pastInteractions.forEach((interaction, index) => {
      const pastElementName =
        interaction.elementText || interaction.id || 'Unknown Element';
      const appDef = APP_DEFINITIONS_CONFIG.find(
        (app) => app.id === interaction.appContext,
      );
      const appName = interaction.appContext
        ? appDef?.name || interaction.appContext
        : 'N/A';
      historyPromptSegment += `\n${index + 1}. (App: ${appName}) Clicked '${pastElementName}' (Type: ${interaction.type || 'N/A'}, ID: ${interaction.id || 'N/A'})`;
      if (interaction.value) {
        historyPromptSegment += ` with value '${interaction.value.substring(0, 50)}'`;
      }
      historyPromptSegment += '.';
    });
  }

  const fullPrompt = `${systemPrompt}

${currentInteractionSummary}
${currentAppContextStr}
${historyPromptSegment}

Full Context for Current Interaction:
${JSON.stringify(currentInteraction, null, 1)}

Generate the HTML content for the window's content area only:`;

  try {
    const response = await ai.models.generateContentStream({
      model: model,
      contents: fullPrompt,
      config: config,
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    let errorMessage = 'An error occurred while generating content.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }
    yield `<div class="p-4 text-red-700 bg-red-100 rounded-lg">
      <p class="font-bold text-lg">Error Generating Content</p>
      <p class="mt-2">${errorMessage}</p>
    </div>`;
  }
}
