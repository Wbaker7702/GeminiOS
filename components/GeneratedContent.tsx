/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import React, {useEffect, useRef, useMemo} from 'react';
import {InteractionData} from '../types';
import DOMPurify from 'dompurify';

interface GeneratedContentProps {
  htmlContent: string;
  onInteract: (data: InteractionData) => void;
  appContext: string | null;
  isLoading: boolean;
}

export const GeneratedContent: React.FC<GeneratedContentProps> = ({
  htmlContent,
  onInteract,
  appContext,
  isLoading,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const processedHtmlContentRef = useRef<string | null>(null);

  // Sanitize content with DOMPurify
  const sanitizedContent = useMemo(() => {
    return DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: ['iframe', 'video', 'canvas'], // Allow interactive but not scriptable elements
      ADD_ATTR: ['target', 'allow', 'allowfullscreen', 'autoplay', 'muted', 'playsinline', 'controls', 'data-interaction-id', 'data-interaction-type', 'data-interaction-value', 'data-value-from', 'src', 'class', 'id', 'type', 'style', 'width', 'height'],
      WHOLE_DOCUMENT: false,
      FORCE_BODY: true,
    });
  }, [htmlContent]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      let targetElement = event.target as HTMLElement;

      while (
        targetElement &&
        targetElement !== container &&
        !targetElement.dataset.interactionId
      ) {
        targetElement = targetElement.parentElement as HTMLElement;
      }

      if (targetElement && targetElement.dataset.interactionId) {
        event.preventDefault();

        let interactionValue: string | undefined =
          targetElement.dataset.interactionValue;

        if (targetElement.dataset.valueFrom) {
          const inputElement = document.getElementById(
            targetElement.dataset.valueFrom,
          ) as HTMLInputElement | HTMLTextAreaElement;
          if (inputElement) {
            interactionValue = DOMPurify.sanitize(inputElement.value); // Sanitize input value
          }
        }

        const interactionData: InteractionData = {
          id: targetElement.dataset.interactionId,
          type: targetElement.dataset.interactionType || 'generic_click',
          value: interactionValue,
          elementType: targetElement.tagName.toLowerCase(),
          elementText: (
            targetElement.innerText ||
            (targetElement as HTMLInputElement).value ||
            ''
          )
            .trim()
            .substring(0, 75),
          appContext: appContext,
        };
        onInteract(interactionData);
      }
    };

    container.addEventListener('click', handleClick);

    // Process scripts only when loading is complete and content has changed
    if (!isLoading) {
      // Use sanitized content for processing check
      if (sanitizedContent !== processedHtmlContentRef.current) {
        const scripts = Array.from(container.getElementsByTagName('script')) as HTMLScriptElement[];
        scripts.forEach((oldScript) => {
          try {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr: Attr) =>
              newScript.setAttribute(attr.name, attr.value),
            );
            newScript.text = oldScript.innerHTML;

            if (oldScript.parentNode) {
              oldScript.parentNode.replaceChild(newScript, oldScript);
            } else {
              console.warn(
                'Script tag found without a parent node:',
                oldScript,
              );
            }
          } catch (e) {
            console.error(
              'Error processing/executing script tag.',
              {
                scriptContent:
                  oldScript.innerHTML.substring(0, 500) +
                  (oldScript.innerHTML.length > 500 ? '...' : ''),
                error: e,
              },
            );
          }
        });
        processedHtmlContentRef.current = sanitizedContent;
      }
    } else {
      processedHtmlContentRef.current = null;
    }

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [sanitizedContent, onInteract, appContext, isLoading]);

  return (
    <div
      ref={contentRef}
      className="w-full h-full overflow-y-auto"
      dangerouslySetInnerHTML={{__html: sanitizedContent}}
    />
  );
};