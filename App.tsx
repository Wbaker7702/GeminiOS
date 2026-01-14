/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useEffect, useState } from 'react';
import { GeneratedContent } from './components/GeneratedContent';
import { Icon } from './components/Icon';
import { ParametersPanel } from './components/ParametersPanel';
import { Window } from './components/Window';
import { Taskbar } from './components/Taskbar';
import { BootScreen } from './components/BootScreen';
import { ContextMenu } from './components/ContextMenu';
import { SearchOverlay } from './components/SearchOverlay';
import { NotificationToast } from './components/NotificationToast';
import { APP_DEFINITIONS_CONFIG, INITIAL_MAX_HISTORY_LENGTH } from './constants';
import { streamAppContent } from './services/geminiService';
import { AppDefinition, InteractionData, Notification, ContextMenuItem } from './types';

interface OpenAppState {
  id: string; // instance unique id
  definition: AppDefinition;
  content: string;
  history: InteractionData[];
  isLoading: boolean;
  error: string | null;
  isMinimized: boolean;
  isParametersOpen: boolean;
  zIndex: number;
  appPath: string[];
}

const WALLPAPERS = [
  'bg-[#eef2f6]', // Classic Gray
  'bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100', // Aurora
  'bg-gradient-to-tr from-rose-100 to-teal-100', // Sunset
  'bg-gradient-to-bl from-gray-100 to-gray-300', // Minimal
  'bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900', // Deep Space (Dark)
];

const App: React.FC = () => {
  // System State
  const [isBooting, setIsBooting] = useState(true);
  const [wallpaperIndex, setWallpaperIndex] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // App Management State
  const [openApps, setOpenApps] = useState<OpenAppState[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [zIndexCounter, setZIndexCounter] = useState(100);
  const [maxHistoryLength, setMaxHistoryLength] = useState(INITIAL_MAX_HISTORY_LENGTH);
  const [isStatefulnessEnabled, setIsStatefulnessEnabled] = useState(false);
    const [appContentCache] = useState<Record<string, string>>({});

  // Global show desktop listener
  useEffect(() => {
    const handleShowDesktop = () => {
      setOpenApps(prev => prev.map(app => ({ ...app, isMinimized: true })));
      setActiveAppId(null);
      setIsSearchOpen(false);
    };
    window.addEventListener('show-desktop', handleShowDesktop);
    return () => window.removeEventListener('show-desktop', handleShowDesktop);
  }, []);

  const addNotification = (title: string, message: string, type: Notification['type'] = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    setTimeout(() => {
      addNotification('Welcome to Gemini OS', 'System initialized successfully.', 'success');
    }, 500);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeAppId) return;
    setContextMenu({ x: e.clientX, y: e.clientY, show: true });
    setIsSearchOpen(false);
  };

  const handleWallpaperChange = () => {
    setWallpaperIndex((prev) => (prev + 1) % WALLPAPERS.length);
    addNotification('Display Settings', 'Wallpaper updated successfully.');
  };

  const handleRefresh = () => {
    addNotification('System', 'Desktop refreshed.', 'info');
    setContextMenu(null);
  };

  const contextMenuItems: ContextMenuItem[] = [
    { label: 'Refresh', action: handleRefresh, shortcut: 'F5' },
    { label: 'Change Wallpaper', action: handleWallpaperChange },
    { label: 'System Properties', action: () => {
      const myComputerApp = APP_DEFINITIONS_CONFIG.find(app => app.id === 'my_computer');
      if (myComputerApp) handleAppOpen(myComputerApp);
    }},
  ];

  const bringToFront = (instanceId: string) => {
    setZIndexCounter(prev => prev + 1);
    setOpenApps(prev => prev.map(app => 
      app.id === instanceId ? { ...app, zIndex: zIndexCounter + 1, isMinimized: false } : app
    ));
    setActiveAppId(instanceId);
  };

  const internalHandleLlmRequest = useCallback(
    async (instanceId: string, historyForLlm: InteractionData[]) => {
      if (historyForLlm.length === 0) return;

      setOpenApps(prev => prev.map(app => 
        app.id === instanceId ? { ...app, isLoading: true, error: null, content: '' } : app
      ));

      let accumulatedContent = '';

      try {
        const stream = streamAppContent(historyForLlm, maxHistoryLength);
        for await (const chunk of stream) {
          accumulatedContent += chunk;
          setOpenApps(prev => prev.map(app => 
            app.id === instanceId ? { ...app, content: prev.find(a => a.id === instanceId)?.content + chunk } : app
          ));
        }
        
        // Finalize state
        setOpenApps(prev => prev.map(app => 
          app.id === instanceId ? { ...app, isLoading: false, content: accumulatedContent } : app
        ));
      } catch {
        setOpenApps(prev => prev.map(app => 
          app.id === instanceId ? { ...app, isLoading: false, error: 'Failed to stream content.', content: `<div class="p-4 text-red-600 bg-red-100 rounded-md">Error loading content.</div>` } : app
        ));
        addNotification('Application Error', 'Failed to generate content.', 'error');
      }
    },
    [maxHistoryLength]
  );

  const handleAppOpen = (appDef: AppDefinition, initialQuery?: string) => {
    const existing = openApps.find(a => a.definition.id === appDef.id);
    if (existing) {
      bringToFront(existing.id);
      // If there's a new query for an existing app, we might want to handle it, 
      // but for now, simple bring-to-front is safer to avoid state resets.
      // A more advanced implementation would inject the query into the existing history.
      return;
    }

    addNotification('Launching', `Opening ${appDef.name}...`, 'info');

    const instanceId = `${appDef.id}-${Date.now()}`;
    
    // Create the initial history. 
    // If an initialQuery is present (e.g., from Search Explorer), we simulate a user interaction 
    // to prompt the LLM to handle that query immediately.
    const history: InteractionData[] = [{
      id: appDef.id,
      type: 'app_open',
      elementText: appDef.name,
      elementType: 'icon',
      appContext: appDef.id,
    }];

    if (initialQuery) {
      history.push({
        id: 'initial_search_query',
        type: 'search_intent',
        value: initialQuery,
        elementText: 'Search Bar',
        elementType: 'input',
        appContext: appDef.id
      });
    }

    const newApp: OpenAppState = {
      id: instanceId,
      definition: appDef,
      content: '',
      history: history,
      isLoading: true,
      error: null,
      isMinimized: false,
      isParametersOpen: false,
      zIndex: zIndexCounter + 1,
      appPath: [appDef.id],
    };

    setZIndexCounter(prev => prev + 1);
    setOpenApps(prev => [...prev, newApp]);
    setActiveAppId(instanceId);

    internalHandleLlmRequest(instanceId, history);
  };

  const handleCloseApp = (instanceId: string) => {
    setOpenApps(prev => prev.filter(app => app.id !== instanceId));
    if (activeAppId === instanceId) setActiveAppId(null);
  };

  const handleMinimizeApp = (instanceId: string) => {
    setOpenApps(prev => prev.map(app => 
      app.id === instanceId ? { ...app, isMinimized: true } : app
    ));
    if (activeAppId === instanceId) setActiveAppId(null);
  };

  const handleInteraction = useCallback(
    async (instanceId: string, interactionData: InteractionData) => {
      const app = openApps.find(a => a.id === instanceId);
      if (!app) return;

      const newHistory = [
        interactionData,
        ...app.history.slice(0, maxHistoryLength - 1),
      ];

      const newPath = [...app.appPath, interactionData.id];
      const cacheKey = newPath.join('__');

      setOpenApps(prev => prev.map(a => 
        a.id === instanceId ? { ...a, history: newHistory, appPath: newPath, content: '', error: null } : a
      ));

      if (isStatefulnessEnabled && appContentCache[cacheKey]) {
        setOpenApps(prev => prev.map(a => 
          a.id === instanceId ? { ...a, content: appContentCache[cacheKey], isLoading: false } : a
        ));
      } else {
        internalHandleLlmRequest(instanceId, newHistory);
      }
    },
    [openApps, internalHandleLlmRequest, maxHistoryLength, isStatefulnessEnabled, appContentCache]
  );

  const handleToggleParameters = (instanceId: string) => {
    setOpenApps(prev => prev.map(a => 
      a.id === instanceId ? { ...a, isParametersOpen: !a.isParametersOpen } : a
    ));
  };

  const handleTaskbarClick = (appId: string) => {
    const instance = openApps.find(a => a.definition.id === appId);
    if (instance) {
      if (instance.isMinimized) {
        bringToFront(instance.id);
      } else if (activeAppId !== instance.id) {
        bringToFront(instance.id);
      } else {
        handleMinimizeApp(instance.id);
      }
    }
  };

  const handleLaunchFromSearch = (appDef: AppDefinition, initialQuery?: string) => {
    handleAppOpen(appDef, initialQuery);
  };

  return (
    <>
      {isBooting && <BootScreen onComplete={handleBootComplete} />}
      
      <div className={`w-screen h-screen relative overflow-hidden flex flex-col font-sans transition-colors duration-1000 ${WALLPAPERS[wallpaperIndex]}`}>
        
        {/* Desktop Background Layer */}
        <div 
          className="absolute inset-0 z-0 flex flex-wrap content-start p-8 gap-4 overflow-auto"
          onClick={() => {
            setActiveAppId(null);
            setContextMenu(null);
            setIsSearchOpen(false);
            setSelectedIconId(null);
          }}
          onContextMenu={handleContextMenu}
        >
          {APP_DEFINITIONS_CONFIG.map((app) => (
            <Icon 
              key={app.id} 
              app={app} 
              onOpen={() => handleAppOpen(app)} 
              onSelect={() => setSelectedIconId(app.id)}
              isSelected={selectedIconId === app.id}
            />
          ))}
        </div>

        {/* Windows Layer */}
        {openApps.map((app) => (
          <Window
            key={app.id}
            id={app.id}
            title={app.definition.name}
            zIndex={app.zIndex}
            isActive={activeAppId === app.id}
            isMinimized={app.isMinimized}
            onClose={() => handleCloseApp(app.id)}
            onFocus={() => bringToFront(app.id)}
            onMinimize={() => handleMinimizeApp(app.id)}
            isAppOpen={true}
            onToggleParameters={() => handleToggleParameters(app.id)}
            onExitToDesktop={() => handleCloseApp(app.id)}
            isParametersPanelOpen={app.isParametersOpen}
          >
            <div className="w-full h-full bg-white relative">
              {app.isParametersOpen ? (
                <ParametersPanel
                  currentLength={maxHistoryLength}
                  onUpdateHistoryLength={setMaxHistoryLength}
                  onClosePanel={() => handleToggleParameters(app.id)}
                  isStatefulnessEnabled={isStatefulnessEnabled}
                  onSetStatefulness={setIsStatefulnessEnabled}
                />
              ) : (
                <>
                  {app.isLoading && app.content.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                        <span className="text-xs font-bold text-gray-400 animate-pulse uppercase tracking-widest">Generating Interface...</span>
                      </div>
                    </div>
                  )}
                  {app.error && (
                    <div className="p-4 text-red-600 bg-red-50 border-b border-red-100 text-sm font-medium">
                      {app.error}
                    </div>
                  )}
                  <GeneratedContent
                    htmlContent={app.content}
                    onInteract={(data) => handleInteraction(app.id, data)}
                    appContext={app.definition.id}
                    isLoading={app.isLoading}
                  />
                </>
              )}
            </div>
          </Window>
        ))}

        {/* Notification Layer */}
        <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
          {notifications.map(n => (
            <div key={n.id} className="pointer-events-auto">
              <NotificationToast notification={n} onDismiss={removeNotification} />
            </div>
          ))}
        </div>

        {/* Context Menu */}
        {contextMenu && contextMenu.show && (
          <ContextMenu 
            x={contextMenu.x} 
            y={contextMenu.y} 
            items={contextMenuItems} 
            onClose={() => setContextMenu(null)} 
          />
        )}

        {/* Search Overlay */}
        <SearchOverlay 
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          apps={APP_DEFINITIONS_CONFIG}
          onLaunchApp={handleLaunchFromSearch}
        />

        {/* Taskbar Component */}
        <Taskbar 
          openApps={openApps.map(a => ({ definition: a.definition, isMinimized: a.isMinimized, id: a.id }))}
          activeAppId={openApps.find(a => a.id === activeAppId)?.definition.id || null}
          onAppClick={handleTaskbarClick}
          allApps={APP_DEFINITIONS_CONFIG}
          onLaunchApp={handleAppOpen}
          onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        />
      </div>
    </>
  );
};

export default App;
