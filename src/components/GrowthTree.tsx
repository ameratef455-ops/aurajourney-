import React from 'react';
import { motion } from 'motion/react';

interface GrowthTreeProps {
  xp: number;
  keys: number;
  className?: string;
}

export const GrowthTree: React.FC<GrowthTreeProps> = ({ xp, keys, className = "" }) => {
  // Calculate greenness and brightness based on XP and Keys
  // 1 XP = 1% greenness (saturation)
  const saturation = Math.min(100, Math.max(0, xp));
  
  // 1 Key = 5% brightness
  const brightness = 100 + (keys * 5);
  
  // Base color with variable saturation
  const leafColor = `hsl(142, ${saturation}%, 45%)`;
  const glowAlpha = Math.min(0.6, (keys * 0.05));
  
  // Number of leaves increases with level
  const level = Math.floor(xp / 300) + 1;
  const leafCount = Math.min(12, 5 + level);
  
  // Particles system for growth feeling - number depends on keys + 5 minimum if any keys
  const particleCount = keys > 0 ? Math.min(25, 5 + keys * 2) : 0;
  const particles = Array.from({ length: particleCount }).map((_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 80, // Wider range
    y: 80 + (Math.random() - 0.5) * 100,
    size: 1.5 + Math.random() * 4,
    duration: 2.5 + Math.random() * 5,
    delay: Math.random() * 5
  }));
  
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 border border-blue-900/50 shadow-2xl flex flex-col items-center justify-center ${className}`}>
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 opacity-20 blur-[100px] pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: leafColor, filter: `brightness(${brightness}%)` }}
      />

      {/* Floating Sparkles/Particles inside the card */}
      {keys > 0 && particles.map((p, i) => (
        <motion.div
           key={p.id}
           className="absolute rounded-full pointer-events-none"
           style={{
             width: p.size,
             height: p.size,
             left: `${p.x + 25}%`,
             top: `${p.y}%`,
             backgroundColor: leafColor,
             boxShadow: `0 0 10px ${leafColor}`,
             filter: `brightness(${brightness}%)`
           }}
           animate={{
             y: [0, -150],
             opacity: [0, 1, 0],
             scale: [0, 1.5, 0.2],
             x: [0, (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 40)]
           }}
           transition={{
             duration: p.duration,
             repeat: Infinity,
             delay: p.delay,
             ease: "easeInOut"
           }}
        />
      ))}
      
      <div className="relative z-10 w-full flex flex-col items-center">
        <h3 className="text-white font-black text-xs mb-6 uppercase tracking-[0.2em] opacity-60">شجرة سعي المحطة</h3>
        
        <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-[0_0_15px_rgba(34,197,94,0.2)]">
          {/* Tree Trunk */}
          <path 
            d="M95 180 L105 180 L102 120 L98 120 Z" 
            fill="#3e2723" 
            className="transition-all duration-1000"
          />
          <path 
            d="M100 130 L120 110" 
            stroke="#3e2723" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />
          <path 
            d="M100 145 L80 125" 
            stroke="#3e2723" 
            strokeWidth="3" 
            strokeLinecap="round" 
          />

          {/* Leaves - Dynamic Group */}
          <g>
            {[...Array(leafCount)].map((_, i) => {
              const angle = (i / leafCount) * Math.PI * 2;
              const radius = 25 + (i % 3) * 5;
              const x = 100 + Math.cos(angle) * radius;
              const y = 100 + Math.sin(angle) * (radius - 5);
              const size = 15 + (i % 4) * 3;
              
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={size}
                  fill={leafColor}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                  stroke={brightness > 130 ? 'rgba(255,255,255,0.2)' : 'transparent'}
                  strokeWidth="1"
                  className="transition-colors duration-1000"
                  style={{
                    filter: `brightness(${brightness}%) drop-shadow(0 0 ${keys > 5 ? 8 : 0}px ${leafColor})`
                  }}
                />
              );
            })}
            
            {/* Core Leaf Cluster */}
            <motion.circle 
              cx="100" 
              cy="90" 
              r={30 + Math.min(20, keys)} 
              fill={leafColor} 
              className="transition-colors duration-1000"
              style={{
                filter: `brightness(${brightness}%)`
              }}
              animate={{ 
                scale: [1, 1.05 + (keys * 0.01), 1],
                filter: [`brightness(${brightness}%) drop-shadow(0 0 10px ${leafColor}00)`, `brightness(${brightness}%) drop-shadow(0 0 ${20 + keys * 2}px ${leafColor})`, `brightness(${brightness}%) drop-shadow(0 0 10px ${leafColor}00)`]
              }}
              transition={{ repeat: Infinity, duration: 4 - Math.min(2, keys * 0.1) }}
            />
          </g>
        </svg>
        
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">تزهر بجهدك الـ {xp} XP</span>
          </div>
          <p className="text-[9px] text-blue-300 font-medium opacity-50 text-center max-w-[180px]">كلما زادت رتبتك ومفاتيحك، زاد اخضرار وتألق شجرتك الخاصة.</p>
        </div>

        {/* Glow behind the tree based on keys */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full transition-all duration-1000 blur-3xl pointer-events-none"
          style={{ 
            backgroundColor: leafColor,
            opacity: glowAlpha,
            transform: `translate(-50%, -50%) scale(${1 + (keys * 0.05)})`
          }}
        />
      </div>
    </div>
  );
};
