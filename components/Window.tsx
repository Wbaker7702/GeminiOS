/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  isAppOpen: boolean;
  isParametersPanelOpen?: boolean;
  onToggleParameters: () => void;
  onExitToDesktop: () => void;
  zIndex: number;
  isActive: boolean;
  isMinimized: boolean;
}

const MenuItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => (
  <span
    className={`menu-item cursor-pointer px-2 py-0.5 rounded hover:bg-black/5 hover:text-blue-600 transition-all ${className}`}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onClick?.();
    }}
    tabIndex={0}
    role="button"
  >
    {children}
  </span>
);

export const Window: React.FC<WindowProps> = ({
  id,
  title,
  children,
  onClose,
  onFocus,
  onMinimize,
  isAppOpen,
  onToggleParameters,
  onExitToDesktop,
  isParametersPanelOpen,
  zIndex,
  isActive,
  isMinimized,
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 850, height: 600 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastWindowedRect = useRef({ x: 100, y: 100, width: 850, height: 600 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Randomize initial position slightly so windows don't overlap perfectly
    const offset = Math.floor(Math.random() * 50);
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const initialPos = {
      x: Math.max(20, (vw - size.width) / 2 + offset),
      y: Math.max(20, (vh - size.height) / 2 + offset - 40),
    };
    setPosition(initialPos);
    lastWindowedRect.current = { ...initialPos, ...size };
  }, []);

  const handleToggleMaximize = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onFocus();
    if (isMaximized) {
      setPosition({ x: lastWindowedRect.current.x, y: lastWindowedRect.current.y });
      setSize({ width: lastWindowedRect.current.width, height: lastWindowedRect.current.height });
    } else {
      lastWindowedRect.current = { x: position.x, y: position.y, width: size.width, height: size.height };
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 0 }); // -Taskbar height handled by container
    }
    setIsMaximized(!isMaximized);
  }, [isMaximized, position, size, onFocus]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onFocus();
    if (isMaximized) return;
    
    if ((e.target as HTMLElement).closest('.title-bar-handle')) {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.preventDefault();
    }
  }, [position, isMaximized, onFocus]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMaximized) return;
    onFocus();
    setIsResizing(true);
  }, [isMaximized, onFocus]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      } else if (isResizing) {
        const newWidth = Math.max(400, e.clientX - position.x);
        const newHeight = Math.max(300, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, position]);

  if (isMinimized) return null;

  const dynamicStyles = isMaximized 
    ? { top: 0, left: 0, width: '100vw', height: 'calc(100vh - 72px)', borderRadius: '0px' }
    : { top: position.y, left: position.x, width: size.width, height: size.height };

  return (
    <div
      ref={windowRef}
      onMouseDown={onFocus}
      style={{
        ...dynamicStyles,
        position: 'absolute',
        zIndex: zIndex,
      }}
      className={`bg-white border flex flex-col overflow-hidden font-sans transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isActive 
          ? 'shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-gray-400/50 scale-[1.005]' 
          : 'shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-gray-300 opacity-95 grayscale-[20%]'
      } ${isMaximized ? 'rounded-none' : 'rounded-xl'}`}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={() => handleToggleMaximize()}
        className="title-bar-handle bg-gray-100/95 border-b border-gray-200 text-gray-800 h-10 px-4 flex justify-between items-center select-none cursor-default flex-shrink-0 active:bg-gray-200/50"
      >
        <div className="flex items-center gap-2">
          {/* Traffic Lights */}
          <div className="flex gap-2 mr-2 group/controls">
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }} 
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group-hover/controls:after:content-['×'] after:text-[8px] after:text-red-900 after:font-bold" 
            />
            <button 
              onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center group-hover/controls:after:content-['−'] after:text-[8px] after:text-yellow-900 after:font-bold" 
            />
            <button 
              onClick={handleToggleMaximize} 
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center group-hover/controls:after:content-['+'] after:text-[8px] after:text-green-900 after:font-bold" 
            />
          </div>
          <span className="text-xs font-bold tracking-tight opacity-80 uppercase ml-1">{title}</span>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-gray-50/90 py-1.5 px-3 border-b border-gray-200 select-none flex gap-4 flex-shrink-0 text-[11px] font-semibold text-gray-500 items-center">
        {!isParametersPanelOpen && (
          <MenuItem onClick={onToggleParameters}>PARAMETERS</MenuItem>
        )}
        <div className="flex-grow" />
        {isAppOpen && (
          <MenuItem onClick={onExitToDesktop} className="text-blue-500 hover:text-blue-700">CLOSE APP</MenuItem>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-hidden relative bg-white">
        {children}
      </div>

      {/* Resize Handles (only if not maximized) */}
      {!isMaximized && (
        <>
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-50 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
        </>
      )}
    </div>
  );
};
