/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { AppDefinition } from '../types';

interface IconProps {
  app: AppDefinition;
  onInteract: () => void;
}

export const Icon: React.FC<IconProps> = ({ app, onInteract }) => {
  return (
    <div
      className="w-24 h-28 flex flex-col items-center justify-start text-center p-2 cursor-pointer select-none rounded-xl transition-all duration-200 hover:bg-white/40 active:scale-95 group"
      onClick={(e) => {
        e.stopPropagation();
        onInteract();
      }}
      onKeyDown={(e) => e.key === 'Enter' && onInteract()}
      tabIndex={0}
      role="button"
      aria-label={`Open ${app.name}`}
    >
      <div className="text-5xl mb-1.5 drop-shadow-md group-hover:drop-shadow-lg transition-all group-hover:-translate-y-1">
        {app.icon}
      </div>
      <div className="text-[11px] text-gray-700 font-bold break-words max-w-full leading-tight drop-shadow-sm bg-white/20 px-1 rounded backdrop-blur-sm">
        {app.name}
      </div>
    </div>
  );
};
