/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing BIOS...');
  const [showLogo, setShowLogo] = useState(false);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const steps = [
      { pct: 10, msg: 'Loading Kernel...' },
      { pct: 30, msg: 'Mounting File System...' },
      { pct: 50, msg: 'Starting Services...' },
      { pct: 70, msg: 'Loading User Interface...' },
      { pct: 90, msg: 'Finalizing...' },
      { pct: 100, msg: 'Welcome' },
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(() => setOpacity(0), 500);
        setTimeout(onComplete, 1000);
        return;
      }

      const step = steps[currentStep];
      setStatus(step.msg);
      setProgress(step.pct);
      
      if (step.pct > 20) setShowLogo(true);
      
      currentStep++;
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (opacity === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black text-white flex flex-col items-center justify-center font-mono transition-opacity duration-1000"
      style={{ opacity }}
    >
      <div className={`transition-all duration-1000 transform ${showLogo ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="text-8xl mb-8 font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 animate-pulse">
          Gemini OS
        </div>
      </div>

      <div className="w-80 h-1.5 bg-gray-800 rounded-full overflow-hidden mb-6 relative shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(34,211,238,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="h-6 text-sm text-gray-400">
        {status}
      </div>
      
      <div className="absolute bottom-8 text-xs text-gray-600">
        v2.0.0-rc1
      </div>
    </div>
  );
};
