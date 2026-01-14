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
      <div className="text-5xl mb-2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_8px_12px_rgba(0,0,0,0.4)] transition-all group-hover:-translate-y-2 transform duration-300">
        {app.icon}
      </div>
      <div className={`text-[12px] font-medium tracking-wide break-words max-w-full leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-2 py-0.5 rounded-md transition-colors ${
        isSelected ? 'text-white bg-blue-600/80 shadow-sm' : 'text-white/90 group-hover:text-white'
      }`}>
        {app.name}
      </div>
    </div>
  );
};
