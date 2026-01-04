/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AppDefinition } from '../types';

interface IconProps {
  app: AppDefinition;
  onOpen: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

export const Icon: React.FC<IconProps> = ({ app, onOpen, onSelect, isSelected }) => {
  return (
    <div
      className={`w-24 h-28 flex flex-col items-center justify-start text-center p-2 cursor-pointer select-none rounded-xl transition-all duration-200 active:scale-95 group ${
        isSelected ? 'bg-blue-500/30 border border-blue-400/50' : 'hover:bg-white/40 border border-transparent'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.stopPropagation();
          onOpen();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}
    >
      <div className="text-5xl mb-1.5 drop-shadow-md group-hover:drop-shadow-lg transition-all group-hover:-translate-y-1">
        {app.icon}
      </div>
      <div className={`text-[11px] font-bold break-words max-w-full leading-tight drop-shadow-sm px-1 rounded backdrop-blur-sm ${
        isSelected ? 'text-blue-900 bg-blue-100/50' : 'text-gray-700 bg-white/20'
      }`}>
        {app.name}
      </div>
    </div>
  );
};
