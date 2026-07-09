import { useState, useEffect } from "react";

const LOADING_MESSAGES = [
  "Preparing Vault",
  "Fetching Treasures",
  "Authenticating",
  "Securing Connection",
  "Almost There..."
];

export function BrandLoader({ className = "", fullScreen = false }: { className?: string; fullScreen?: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeState, setFadeState] = useState("fade-in");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState("fade-out");
      
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        setFadeState("fade-in");
      }, 300); // matches duration-300 transition time
    }, 2500); // Cycle text every 2.5 seconds to give reading time

    return () => clearInterval(interval);
  }, []);

  const content = (
    <div className={`flex flex-col items-center justify-center p-8 space-y-8 ${className}`}>
      {/* Modern Circular Rings Loader */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Outer Glowing Ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-amber-500 border-b-yellow-500 animate-[spin_1.5s_linear_infinite] shadow-[0_0_15px_rgba(245,158,11,0.4)]"></div>
        
        {/* Middle Reverse Ring */}
        <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-l-amber-400 border-r-amber-600 animate-[spin_2s_linear_infinite_reverse] opacity-80"></div>
        
        {/* Inner Pulsing Ring */}
        <div className="absolute inset-4 rounded-full border border-amber-200/50 dark:border-amber-700/50 animate-pulse bg-amber-50/5 dark:bg-amber-900/10"></div>

        {/* Center Text (HC) */}
        <div className="absolute flex items-center justify-center font-display font-black text-3xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 drop-shadow-sm z-10">
          HC
        </div>
      </div>

      {/* Loading Text & Bouncing Dots */}
      <div className="flex flex-col items-center space-y-2 min-h-[50px] justify-center">
        <h3 className={`text-sm font-bold tracking-widest uppercase text-slate-600 dark:text-slate-400 transform transition-all duration-300 ease-in-out ${
          fadeState === "fade-in" 
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 -translate-y-2 scale-95"
        }`}>
          {LOADING_MESSAGES[messageIndex]}
        </h3>
        <div className="flex space-x-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-all duration-300">
        {content}
      </div>
    );
  }

  return content;
}
