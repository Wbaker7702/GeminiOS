/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { AppDefinition } from '../types';

interface TaskbarProps {
  openApps: { definition: AppDefinition; isMinimized: boolean; id: string }[];
  activeAppId: string | null;
  onAppClick: (appId: string) => void;
  allApps: AppDefinition[];
  onLaunchApp: (app: AppDefinition, initialQuery?: string) => void;
  onToggleSearch: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ 
  openApps, 
  activeAppId, 
  onAppClick, 
  allApps,
  onLaunchApp,
  onToggleSearch
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 h-14 px-2 py-1.5 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl flex items-center gap-1 z-[1000]">
      {/* Search Button */}
      <button
        onClick={onToggleSearch}
        className="relative group w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 hover:bg-white/40 active:scale-95"
        title="Search"
      >
        <span className="text-xl drop-shadow-sm opacity-80 group-hover:opacity-100">🔍</span>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Search Explorer
        </div>
      </button>

      <div className="w-px h-6 bg-gray-300/50 mx-2" />

      {/* Quick Launch / Open Apps */}
      <div className="flex items-center gap-1">
        {allApps.map((app) => {
          const isOpen = openApps.find(oa => oa.definition.id === app.id);
          const isActive = activeAppId === app.id;
          
          return (
            <button
              key={app.id}
              onClick={() => isOpen ? onAppClick(app.id) : onLaunchApp(app)}
              className={`relative group w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                isActive ? 'bg-white/50 shadow-sm' : 'hover:bg-white/30'
              }`}
              title={app.name}
            >
              <span className="text-2xl drop-shadow-sm">{app.icon}</span>
              
              {/* Active Indicator Dot */}
              {isOpen && (
                <span className={`absolute -bottom-0.5 w-1 h-1 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-blue-600 w-3 shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-gray-400'
                }`} />
              )}

              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {app.name}
              </div>
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-gray-300/50 mx-2" />

      {/* System Tray */}
      <div className="flex items-center gap-3 px-3">
        <button 
          onClick={() => {
            const settingsApp = allApps.find(a => a.id === 'settings_app');
            if (settingsApp) onLaunchApp(settingsApp);
          }}
          className="flex flex-col items-center justify-center leading-none select-none hover:bg-black/5 px-2 rounded cursor-pointer transition-colors"
        >
          <span className="text-xs font-bold text-gray-800">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </button>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('show-desktop'))}
          className="w-1 h-8 rounded-full bg-gray-300/50 hover:bg-gray-400/50 transition-colors"
          title="Show Desktop"
        />
      </div>
    </div>
  );
};
