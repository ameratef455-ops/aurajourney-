import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Timer, 
  Radio,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { vibrate, HAPITCS } from '../lib/haptics';

interface ViaSessionModalProps {
  visible: boolean;
  onHide: () => void;
  taskTitle: string;
  onComplete: () => void;
}

export function ViaSessionModal({ visible, onHide, taskTitle, onComplete }: ViaSessionModalProps) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setIsActive(!isActive);
  };

  const handleReset = () => {
    vibrate(HAPITCS.GUIDANCE);
    setIsActive(false);
    setSeconds(0);
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      showHeader={false}
      className="w-[96vw] max-w-lg rounded-[40px] overflow-hidden border-none shadow-2xl"
      contentClassName="p-0 bg-slate-950 text-white"
      modal
      dismissableMask={false}
    >
      <div className="flex flex-col h-full min-h-[500px] p-8 relative overflow-hidden" dir="rtl">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Radio className="w-5 h-5 text-white animate-pulse" />
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tight">جلسة VIA النشطة</h2>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Active Focus Session</p>
             </div>
          </div>
          <button 
            onClick={onHide}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
          >
             <i className="pi pi-times text-xs"></i>
          </button>
        </div>

        {/* Task Info */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 relative z-10">
           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">المهمة الحالية:</span>
           <h3 className="text-lg font-black text-white leading-tight">{taskTitle}</h3>
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center mb-8 relative z-10">
           <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
              <div className="text-7xl font-mono font-black tracking-tighter text-white relative z-10 tabular-nums">
                 {formatTime(seconds)}
              </div>
           </div>
           <div className="flex items-center gap-2 mt-4 text-blue-400 font-bold text-xs">
              <Timer className="w-4 h-4" />
              <span>الوقت المنقضي</span>
           </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 relative z-10 mb-6">
           <button 
             onClick={handleStartStop}
             className={`flex-1 py-4.5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 transition-all border-none cursor-pointer shadow-xl ${
               isActive 
               ? 'bg-white text-slate-950 hover:bg-slate-100 shadow-white/10' 
               : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
             }`}
           >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isActive ? 'إيقاف مؤقت' : 'استئناف الجلسة'}
           </button>
           
           <button 
             onClick={handleReset}
             className="w-16 py-4.5 rounded-[24px] bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
           >
              <RotateCcw className="w-5 h-5" />
           </button>
        </div>

        {/* Finish Button */}
        <button 
          onClick={() => {
            vibrate(HAPITCS.COMPLETE);
            onComplete();
          }}
          className="w-full py-4 rounded-[24px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10 hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer relative z-10"
        >
           <CheckCircle2 className="w-5 h-5" />
           <span>إنهاء الجلسة والتقييم ✨</span>
        </button>

        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-4 text-white/30 text-[9px] font-bold">
           <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-500/50" />
              <span>نمط التركيز العميق V.I.A</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-white/10" />
           <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500/50" />
              <span>تعزيز الذاكرة النشطة</span>
           </div>
        </div>
      </div>
    </Dialog>
  );
}
