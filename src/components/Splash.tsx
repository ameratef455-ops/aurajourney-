import { motion } from 'motion/react';
import { useEffect } from 'react';

interface SplashProps {
  onComplete: () => void;
}

export function Splash({ onComplete }: SplashProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center gap-8"
      >
        <div className="w-20 h-20 border-2 border-blue-900 flex items-center justify-center rounded-full">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-8 h-8 bg-blue-900 rounded-full" 
          />
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-blue-950 tracking-tight mb-2">Aura Journey</h1>
          <p className="text-xl text-gray-400 font-light tracking-wide">رحلة حياة</p>
        </div>
      </motion.div>
    </div>
  );
}
