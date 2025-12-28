/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { AppDefinition } from '../types';
import { MOCK_FILES } from '../constants';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppDefinition[];
  onLaunchApp: (app: AppDefinition, initialQuery?: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, apps, onLaunchApp }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Enter' && query) {
        // Default action on Enter: Search Web
        handleWebSearch();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, query]);

  if (!isOpen) return null;

  const filteredApps = query
    ? apps.filter(app => 
        app.name.toLowerCase().includes(query.toLowerCase()) || 
        (app.description && app.description.toLowerCase().includes(query.toLowerCase()))
      )
    : apps.slice(0, 6);

  const filteredFiles = query
    ? MOCK_FILES.filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        (file.content && file.content.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const handleFileClick = (appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (app) {
      onLaunchApp(app);
      onClose();
    }
  };

  const handleAppClick = (app: AppDefinition) => {
    onLaunchApp(app);
    onClose();
  };

  const handleWebSearch = () => {
    const webApp = apps.find(a => a.id === 'web_browser_app');
    if (webApp) {
      onLaunchApp(webApp, query);
      onClose();
    }
  };

  const handleAskGemini = () => {
    const assistantApp = apps.find(a => a.id === 'gemini_assistant');
    if (assistantApp) {
      onLaunchApp(assistantApp, query);
      onClose();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-[2000] flex justify-center pointer-events-none">
      <div 
        ref={containerRef}
        className="pointer-events-auto w-[650px] max-w-[95vw] bg-white/85 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div className="p-4 border-b border-gray-200/50 flex gap-3 items-center">
          <div className="text-gray-500 text-xl pl-2">🔎</div>
          <input
            ref={inputRef}
            type="text"
            className="flex-grow bg-transparent border-none outline-none text-xl text-gray-800 placeholder-gray-400 font-medium"
            placeholder="Search, Ask AI, or Browse..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="max-h-[500px] overflow-y-auto p-2">
          
          {/* Smart Actions (only show if query exists) */}
          {query && (
            <div className="mb-3">
               <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5">Explorer Actions</div>
               <button
                onClick={handleAskGemini}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 hover:border-blue-100 border border-transparent rounded-xl transition-all text-left group"
              >
                <span className="text-2xl bg-blue-100 w-10 h-10 flex items-center justify-center rounded-lg group-hover:scale-105 transition-transform">✨</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">Ask Gemini</span>
                  <span className="text-sm text-gray-500">Chat about "{query}"</span>
                </div>
              </button>
              <button
                onClick={handleWebSearch}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100/80 border border-transparent rounded-xl transition-all text-left mt-1"
              >
                <span className="text-2xl bg-gray-100 w-10 h-10 flex items-center justify-center rounded-lg">🌐</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">Search Web</span>
                  <span className="text-sm text-gray-500">Open Google for "{query}"</span>
                </div>
              </button>
            </div>
          )}

          {/* Apps Section */}
          {filteredApps.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5">Applications</div>
              <div className="grid grid-cols-1 gap-1">
                {filteredApps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/60 rounded-xl transition-colors text-left group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{app.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{app.name}</span>
                      {app.description && (
                        <span className="text-xs text-gray-500 truncate max-w-[300px]">{app.description}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {filteredFiles.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-1.5">Files</div>
              <div className="grid grid-cols-1 gap-1">
                {filteredFiles.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFileClick(file.appId)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/60 rounded-xl transition-colors text-left"
                  >
                    <span className="text-xl opacity-80">{file.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800 text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">{file.type}</span>
                    </div>
                    <div className="ml-auto text-xs text-gray-400">
                       via {apps.find(a => a.id === file.appId)?.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && filteredApps.length === 0 && filteredFiles.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              Press Enter to search web
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
