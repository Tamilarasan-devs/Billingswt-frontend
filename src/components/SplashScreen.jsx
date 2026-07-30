import React, { useEffect, useState } from 'react';

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Smooth, realistic-looking progress simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // random increment for a more organic loading feel
        return Math.min(prev + Math.floor(Math.random() * 15) + 5, 100);
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      
      {/* Background Subtle Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900"></div>

      {/* Main Content Container */}
      <div className="flex flex-col items-center animate-fade-in-up w-full max-w-sm px-6">
        
        {/* Minimalist Corporate Icon */}
        <div className="w-20 h-20 mb-8 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-900/10">
           <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
             <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
             <line x1="3" y1="10" x2="21" y2="10"></line>
             <line x1="7" y1="15" x2="7.01" y2="15"></line>
             <line x1="11" y1="15" x2="13" y2="15"></line>
           </svg>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
          Billing Software
        </h1>
        <p className="text-slate-500 font-medium mb-10 text-sm tracking-wide">
          Enterprise Management System
        </p>

        {/* Sleek Progress Bar */}
        <div className="w-64 h-[3px] bg-slate-100 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-blue-600 transition-all duration-200 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading Text */}
        <div className="flex justify-between w-64 text-[11px] font-bold text-slate-400 tracking-widest">
          <span>INITIALIZING SYSTEM</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Absolute Bottom Footer - Powered by Unotech */}
      <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
         <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2">Powered By</span>
         
         <div className="flex items-center gap-2 opacity-90">
           {/* Unotech Abstract Logo */}
           <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
           </svg>
           <span className="font-extrabold tracking-widest text-slate-900 text-sm">UNOTECH</span>
         </div>
      </div>
    </div>
  );
};

export default SplashScreen;
