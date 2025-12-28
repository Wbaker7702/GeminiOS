/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef } from 'react';
import { ContextMenuItem } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position if it goes offscreen (basic implementation)
  const style = {
    top: y,
    left: x,
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-[9999] min-w-[180px] bg-white/90 backdrop-blur-md border border-white/40 shadow-xl rounded-lg py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.action();
            onClose();
          }}
          className={`w-full text-left px-4 py-1.5 text-sm flex justify-between items-center hover:bg-blue-500 hover:text-white transition-colors
            ${item.danger ? 'text-red-600 hover:bg-red-500' : 'text-gray-700'}
          `}
        >
          <span>{item.label}</span>
          {item.shortcut && <span className="text-xs opacity-60 ml-4">{item.shortcut}</span>}
        </button>
      ))}
    </div>
  );
};
