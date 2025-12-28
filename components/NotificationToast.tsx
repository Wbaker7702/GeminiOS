/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect } from 'react';
import { Notification } from '../types';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const typeStyles = {
    info: 'bg-white border-blue-100 border-l-4 border-l-blue-500',
    success: 'bg-white border-green-100 border-l-4 border-l-green-500',
    warning: 'bg-white border-yellow-100 border-l-4 border-l-yellow-500',
    error: 'bg-white border-red-100 border-l-4 border-l-red-500',
  };

  const iconStyles = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div 
      className={`${typeStyles[notification.type]} shadow-lg rounded-r-lg p-4 mb-3 w-80 transform transition-all duration-300 hover:scale-[1.02] cursor-pointer flex items-start gap-3 backdrop-blur-sm bg-opacity-95`}
      onClick={() => onDismiss(notification.id)}
      role="alert"
    >
      <div className="text-xl select-none">{iconStyles[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">{notification.title}</h4>
        <p className="text-xs text-gray-600 leading-relaxed break-words">{notification.message}</p>
      </div>
      <button 
        className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
        onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
      >
        ×
      </button>
    </div>
  );
};
