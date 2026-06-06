import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from 'primereact/button';
import { BookOpen, Target, Sparkles, Lock, CheckCircle2, ChevronLeft, Zap } from 'lucide-react';
import { vibrate, HAPITCS } from '../lib/haptics';
import { db } from '../db';
import { toast } from 'react-hot-toast';

interface ReviewPathSessionProps {
  visible: boolean;
  user: any;
  onClose: () => void;
  onStartSession: (sessionType: 'original' | 'review1' | 'review2' | 'review3') => void;
}

export function ReviewPathSession({ visible, user, onClose, onStartSession }: ReviewPathSessionProps) {
  const completedTargets = user?.reviewSessionProgress || [];
  
  const targets = [
    { 
      id: 'original', 
      title: 'التقييم الأصلي للمسار', 
      description: 'اختبار الفهم العميق للأساسيات والهدف الجوهري',
      icon: <Target className="w-8 h-8" />,
      color: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/40'
    },
    { 
      id: 'review1', 
      title: 'خطة المراجعة الأولى', 
      description: 'تثبيت المعلومات واسترجاع المفاهيم الأولية',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/40'
    },
    { 
      id: 'review2', 
      title: 'خطة المراجعة الثانية', 
      description: 'الربط بين المفاهيم المتقدمة والتطبيقات العملية',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-amber-600 to-orange-600',
      shadow: 'shadow-amber-500/40'
    },
    { 
      id: 'review3', 
      title: 'خطة المراجعة النهائية', 
      description: 'الإتقان الكامل والاستعداد للمحطة التالية',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-rose-600 to-pink-600',
      shadow: 'shadow-rose-500/40'
    }
  ];

  const handleStart = (targetId: string, isLocked: boolean) => {
    if (isLocked) {
      vibrate(HAPITCS.GUIDANCE);
      toast.error('يجب إكمال المسار السابق لفتح هذا المسار 🔒', {
        style: { borderRadius: '24px', background: '#1e1b4b', color: '#fff', direction: 'rtl' }
      });
      return;
    }
    vibrate(HAPITCS.MAJOR_CLICK);
    onStartSession(targetId as any);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[5000] bg-slate-950 flex flex-col font-sans overflow-hidden"
          dir="rtl"
        >
          {/* Background Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#020617_100%)] opacity-80" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[150px]" />

          {/* Header */}
          <div className="relative z-10 p-6 md:p-10 flex justify-between items-center bg-slate-950/20 backdrop-blur-md border-b border-white/5">
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                 مسار المراجعة والتمكين 🛡️
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-1">تتبع رحلتك في مراجعة وتثبيت ما تعلمته</p>
            </div>
            <button 
              onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); onClose(); }}
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Main Content: Circular Path */}
          <div className="flex-1 relative z-10 flex items-center justify-center p-6 overflow-hidden">
            {/* Animated Connecting Lines (Simulated Path) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
               <svg width="800" height="600" viewBox="0 0 800 600" className="w-full h-full max-w-4xl max-h-[80vh]">
                  <motion.path
                    d="M 150,300 C 150,100 650,100 650,300 C 650,500 150,500 150,300"
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="4"
                    strokeDasharray="12 12"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: -24 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <defs>
                     <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                     </linearGradient>
                  </defs>
               </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-24 max-w-4xl w-full relative z-20">
              {targets.map((target, idx) => {
                const isCompleted = completedTargets.includes(target.id);
                const isLocked = idx > 0 && !completedTargets.includes(targets[idx-1].id);
                const isCurrent = !isCompleted && !isLocked;

                return (
                  <motion.div
                    key={target.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative">
                      {/* Subtle Pulse for Incomplete/Current Item */}
                      {isCurrent && (
                        <>
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className={`absolute -inset-6 rounded-full bg-blue-500 opacity-20 blur-3xl`}
                          />
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className={`absolute -inset-3 rounded-full border border-blue-400/30`}
                          />
                        </>
                      )}

                      <button
                        onClick={() => handleStart(target.id, isLocked)}
                        className={`
                          w-24 h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center 
                          transition-all duration-500 relative z-10 border-4 cursor-pointer
                          ${isCompleted 
                            ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/50 shadow-emerald-500/20' 
                            : isLocked 
                              ? 'bg-slate-900/50 border-slate-700/50 grayscale opacity-60' 
                              : `bg-gradient-to-br ${target.color} border-white/20 shadow-2xl ${target.shadow} hover:scale-110 active:scale-95`}
                        `}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
                        ) : isLocked ? (
                          <Lock className="w-6 h-6 md:w-8 md:h-8 text-slate-500" />
                        ) : (
                          <div className="text-white scale-75 md:scale-100">
                            {target.icon}
                          </div>
                        )}
                        
                        {isCompleted && (
                          <div className="mt-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <span className="text-[8px] md:text-[10px] font-black text-emerald-400">مكتمل ✅</span>
                          </div>
                        )}
                      </button>

                      <div className={`absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-sm md:text-lg ${isLocked ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-900'} shadow-xl border-4 border-slate-950 z-20`}>
                        {idx + 1}
                      </div>
                    </div>

                    <div className="mt-4 text-center max-w-[200px] md:max-w-xs">
                      <h3 className={`text-lg md:text-xl font-black mb-1 transition-colors ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                        {target.title}
                      </h3>
                      <p className={`text-[10px] md:text-sm font-bold leading-tight md:leading-relaxed ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                        {target.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 p-10 flex justify-center">
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-8 py-3 flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                   <span className="text-white text-xs font-black">مكتمل</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                   <span className="text-white text-xs font-black">المرحلة الحالية</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-600" />
                   <span className="text-white text-xs font-black">مغلق</span>
                </div>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
