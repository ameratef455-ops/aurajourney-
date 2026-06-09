import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { BookOpen, Target, Sparkles, Lock, CheckCircle2, ChevronLeft, Zap, Play } from 'lucide-react';
import { vibrate, HAPITCS } from '../lib/haptics';
import { db } from '../db';
import { toast } from 'react-hot-toast';

interface ReviewPathSessionProps {
  visible: boolean;
  user: any;
  task: any;
  onClose: () => void;
  onStartSession: (sessionType: 'original' | 'review1' | 'review2' | 'review3') => void;
}

export function ReviewPathSession({ visible, user, task, onClose, onStartSession }: ReviewPathSessionProps) {
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'execution'>('info');
  const completedTargets = user?.reviewSessionProgress || [];
  
  const targets = [
    { 
      id: 'original', 
      title: 'التقييم الأصلي', 
      description: 'اختبار الفهم العميق للأساسيات والهدف الجوهري',
      icon: <Target className="w-8 h-8" />,
      color: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/40'
    },
    { 
      id: 'review1', 
      title: 'مراجعة VIA 1', 
      description: 'تثبيت المعلومات واسترجاع المفاهيم الأولية',
      icon: <BookOpen className="w-8 h-8" />,
      color: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/40'
    },
    { 
      id: 'review2', 
      title: 'مراجعة VIA 2', 
      description: 'الربط بين المفاهيم المتقدمة والتطبيقات العملية',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'from-amber-600 to-orange-600',
      shadow: 'shadow-amber-500/40'
    },
    { 
      id: 'review3', 
      title: 'مراجعة VIA النهائية', 
      description: 'الإتقان الكامل والاستعداد للمحطة التالية',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-rose-600 to-pink-600',
      shadow: 'shadow-rose-500/40'
    }
  ];

  const handleStart = (target: any, isLocked: boolean) => {
    if (isLocked) {
      vibrate(HAPITCS.GUIDANCE);
      toast.error('يجب إكمال المسار السابق لفتح هذا المسار 🔒', {
        style: { borderRadius: '24px', background: '#1e1b4b', color: '#fff', direction: 'rtl' }
      });
      return;
    }
    
    confirmDialog({
      message: `هل تريد فتح تفاصيل "${target.title}"؟`,
      header: 'تأكيد الانتقال',
      icon: 'pi pi-info-circle',
      acceptLabel: 'نعم، افتح',
      rejectLabel: 'إلغاء',
      className: 'rtl-dialog custom-confirm',
      acceptClassName: 'p-button-primary rounded-xl px-6',
      rejectClassName: 'p-button-text text-gray-400',
      accept: () => {
        vibrate(HAPITCS.MAJOR_CLICK);
        setSelectedTarget(target);
      }
    });
  };

  const confirmStartSession = (target: any) => {
    confirmDialog({
      message: `هل أنت مستعد لبدء "${target.title}"؟`,
      header: 'تأكيد البدء',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، ابدأ الآن',
      rejectLabel: 'إلغاء',
      className: 'rtl-dialog custom-confirm',
      acceptClassName: 'p-button-primary rounded-xl px-6',
      rejectClassName: 'p-button-text text-gray-400',
      accept: () => {
        vibrate(HAPITCS.SUCCESS);
        onStartSession(target.id);
      }
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[4000] bg-slate-950/40 backdrop-blur-md flex flex-col font-sans overflow-x-hidden overflow-y-auto"
          dir="rtl"
        >
          <ConfirmDialog />
          {/* Background Gradients */}
          <div className="fixed inset-0 bg-slate-950/10 pointer-events-none" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#020617_100%)] opacity-30 pointer-events-none" />
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[150px] pointer-events-none" />

          {/* Header */}
          <div className="sticky top-0 z-50 px-6 py-8 md:px-10 flex justify-between items-center bg-slate-950/40 backdrop-blur-xl border-b border-white/10">
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                 {selectedTarget ? 'تفاصيل مسار via' : 'مسار via 🛡️'}
              </h1>
              <p className="text-slate-300 font-extrabold text-xs md:text-sm mt-1">
                {selectedTarget ? selectedTarget.title : 'تتبع رحلتك في مراجعة وتثبيت ما تعلمته عبر مسار via'}
              </p>
            </div>
            <button 
              onClick={() => { 
                vibrate(HAPITCS.MAJOR_CLICK); 
                if (selectedTarget) {
                  setSelectedTarget(null);
                } else {
                  onClose(); 
                }
              }}
              className="w-12 h-12 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 flex items-center justify-center transition-all border border-slate-200 shadow-lg shadow-black/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!selectedTarget ? (
              <motion.div 
                key="path"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 relative z-10 flex flex-col items-center justify-start p-6 pt-8 pb-12"
              >
                {/* Animated Connecting Lines */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none overflow-hidden">
                   <svg width="800" height="600" viewBox="0 0 800 600" className="w-full h-full max-w-4xl max-h-[80vh]">
                      <motion.path
                        d="M 150,300 C 150,100 650,100 650,300 C 650,500 150,500 150,300"
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="4"
                        strokeDasharray="12 12"
                        initial={{ strokeDashoffset: 0 }}
                        animate={{ strokeDashoffset: -24 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-x-24 md:gap-y-16 max-w-4xl w-full relative z-20">
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
                          {isCurrent && (
                            <>
                              <motion.div 
                                animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className={`absolute -inset-8 rounded-full bg-blue-400 opacity-20 blur-3xl`}
                              />
                              <motion.div 
                                animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                className={`absolute -inset-4 rounded-full border-2 border-blue-400/20`}
                              />
                            </>
                          )}

                          <button
                            onClick={() => handleStart(target, isLocked)}
                            className={`
                              w-28 h-28 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center 
                              transition-all duration-500 relative z-10 border-4 cursor-pointer
                              ${isCompleted 
                                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/50 shadow-emerald-500/20' 
                                : isLocked 
                                  ? 'bg-slate-900/50 border-slate-700/50 grayscale opacity-60' 
                                  : `bg-gradient-to-br ${target.color} border-white/20 shadow-2xl ${target.shadow} hover:scale-110 active:scale-95`}
                            `}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
                            ) : isLocked ? (
                              <Lock className="w-8 h-8 md:w-10 md:h-10 text-slate-500" />
                            ) : (
                              <div className="text-white scale-90 md:scale-110">
                                {target.icon}
                              </div>
                            )}
                            
                            {isCompleted && (
                              <div className="mt-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <span className="text-[10px] md:text-[11px] font-black text-emerald-400">مكتمل ✅</span>
                              </div>
                            )}
                          </button>

                          <div className={`absolute -top-2 -right-2 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-sm md:text-xl ${isLocked ? 'bg-slate-800 text-slate-500' : 'bg-white text-slate-900'} shadow-xl border-4 border-slate-950 z-20`}>
                            {idx + 1}
                          </div>
                        </div>

                        <div className="mt-6 text-center max-w-[220px] md:max-w-xs">
                          <h3 className={`text-xl md:text-2xl font-black mb-1.5 transition-colors ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                            {target.title}
                          </h3>
                          <p className={`text-xs md:text-sm font-bold leading-relaxed ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                            {target.description}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 relative z-10 p-4 md:p-6 flex flex-col items-center justify-start pt-32 pb-20"
              >
                <div className="max-w-4xl w-full space-y-6">
                   {/* Custom Tab Switcher */}
                   <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 w-fit mx-auto mb-4">
                      <button 
                        className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'info' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => setActiveTab('info')}
                      >
                         بيانات المهمة
                      </button>
                      <button 
                        className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'execution' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => setActiveTab('execution')}
                      >
                         الأنشطة التنفيذية
                      </button>
                   </div>

                   <AnimatePresence mode="wait">
                      {activeTab === 'info' ? (
                        <motion.div
                          key="info"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-10 relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                              <div className="relative z-10">
                                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                                   <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr ${selectedTarget.color} flex items-center justify-center text-white shadow-2xl shrink-0`}>
                                      {selectedTarget.icon}
                                   </div>
                                   <div className="text-center md:text-right">
                                      <h2 className="text-2xl md:text-4xl font-black text-white mb-1 line-clamp-2">{task?.title || 'عنوان المهمة'}</h2>
                                      <p className="text-blue-400 font-extrabold text-sm md:text-lg">{selectedTarget.title}</p>
                                   </div>
                                </div>
                                <div className="bg-white/5 p-5 md:p-8 rounded-[24px] border border-white/5 space-y-3">
                                   <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">وصف المهمة</h4>
                                   <p className="text-slate-200 text-base md:text-lg leading-relaxed font-medium">
                                      {task?.description || 'لا يوجد وصف متاح لهذه المهمة حالياً. يبدو أنك جاهز للانطلاق!'}
                                   </p>
                                </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-indigo-950/30 backdrop-blur-xl border border-indigo-500/20 rounded-[32px] p-6 md:p-8 shadow-xl flex flex-col">
                                 <h3 className="text-white font-black text-lg mb-4 flex items-center gap-3">
                                    <Target className="w-5 h-5 text-blue-400" />
                                    الاهداف المتوقعة
                                 </h3>
                                 <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex-1 min-h-[120px]">
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-bold">
                                       {task?.taskGoals || task?.taskOutcomes || user?.planGoals || user?.planOutcomes || 'الوصول للإتقان الكامل للمفاهيم الأساسية وتحقيق مخرجات التعلم المستهدفة.'}
                                    </p>
                                 </div>
                              </div>

                              <div className="bg-emerald-950/30 backdrop-blur-xl border border-emerald-500/20 rounded-[32px] p-6 md:p-8 shadow-xl flex flex-col">
                                 <h3 className="text-white font-black text-lg mb-4 flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    رسالة ترحيب
                                 </h3>
                                 <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex-1 min-h-[120px]">
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-bold">
                                       {task?.startMessage || user?.psychology?.motivation || 'أنت على بعد خطوات من إتقان هذه المهارة. استعن بالله وابدأ بتركيز!'}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="execution"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 md:p-10 shadow-2xl"
                        >
                           <h3 className="text-white font-black text-xl mb-6 flex items-center gap-3">
                              <Zap className="w-6 h-6 text-yellow-400" />
                              الأنشطة والخطوات التنفيذية
                           </h3>
                           
                           {task?.activities && task?.activities.length > 0 ? (
                             <div className="space-y-4">
                                {task.activities.map((act: any, idx: number) => (
                                  <div key={act.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                                     <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm">
                                              {idx + 1}
                                           </div>
                                           <h4 className="text-white font-black text-base">{act.title}</h4>
                                        </div>
                                        {act.duration && (
                                          <div className="px-3 py-1 bg-white/10 rounded-full text-blue-400 text-[10px] font-black tracking-widest uppercase">
                                             {act.duration} MINS
                                          </div>
                                        )}
                                     </div>
                                     {act.guidance && (
                                       <p className="text-slate-400 text-sm mb-4 bg-black/20 p-3 rounded-xl border border-white/5 italic">
                                          {act.guidance}
                                       </p>
                                     )}
                                     {act.steps && act.steps.length > 0 && (
                                       <div className="space-y-2">
                                          {act.steps.map((step: any) => (
                                            <div key={step.id} className="flex items-center gap-3 text-slate-300 text-xs py-1">
                                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                               {step.title}
                                            </div>
                                          ))}
                                       </div>
                                     )}
                                  </div>
                                ))}
                             </div>
                           ) : (
                             <div className="text-center py-20 bg-black/20 rounded-3xl border border-dashed border-white/10">
                                <Sparkles className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                <p className="text-slate-500 font-black">لا توجد أنشطة إجرائية مضافة لهذه المهمة.</p>
                             </div>
                           )}
                        </motion.div>
                      )}
                   </AnimatePresence>

                   <div className="flex flex-col gap-4 py-8">
                      <button 
                        onClick={() => confirmStartSession(selectedTarget)}
                        className={`w-full py-6 rounded-[24px] bg-gradient-to-tr ${selectedTarget.color} text-white text-xl md:text-2xl font-black shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-4 group`}
                      >
                         بدء الجلسة الآن 🚀
                         <Play className="w-6 h-6 fill-white group-hover:translate-x-[-4px] transition-transform" />
                      </button>
                      <button 
                        onClick={() => setSelectedTarget(null)}
                        className="w-full py-4 rounded-[20px] bg-white/5 text-slate-400 font-bold hover:text-white hover:bg-white/10 transition-all border border-white/5"
                      >
                         العودة للمسار
                      </button>
                   </div>
                   
                   {/* Spacer for bottom scrolling */}
                   <div className="h-20" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Info */}
          {!selectedTarget && (
            <div className="relative z-10 p-12 flex justify-center mt-auto">
               <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-10 py-4 flex items-center gap-8 shadow-2xl">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]" />
                     <span className="text-white text-xs font-black">مكتمل</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_#3b82f6] animate-pulse" />
                     <span className="text-white text-xs font-black">المرحلة الحالية</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-slate-600" />
                     <span className="text-white text-xs font-black">مغلق</span>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
