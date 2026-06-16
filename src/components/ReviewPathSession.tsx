import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { BookOpen, Target, Sparkles, Lock, CheckCircle2, ChevronLeft, Zap, Play, RotateCcw } from 'lucide-react';
import { vibrate, HAPITCS } from '../lib/haptics';
import { db } from '../db';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface ReviewPathSessionProps {
  visible: boolean;
  user: any;
  task: any;
  onClose: () => void;
  onStartSession: (sessionType: 'original' | 'review1' | 'review2' | 'review3') => void;
  onRevertSession?: (sessionType: 'original' | 'review1' | 'review2' | 'review3') => void;
  onOpenReflection?: (task: any) => void;
  onOpenFlashcards?: (task: any) => void;
  onOpenAnalytics?: (task: any) => void;
}

export function ReviewPathSession({ 
  visible, 
  user, 
  task, 
  onClose, 
  onStartSession, 
  onRevertSession, 
  onOpenReflection,
  onOpenFlashcards,
  onOpenAnalytics
}: ReviewPathSessionProps) {
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

  const [showConfirmStart, setShowConfirmStart] = useState<any>(null);
  const [showConfirmRevert, setShowConfirmRevert] = useState<any>(null);

  const [localActivities, setLocalActivities] = useState<any[]>(task?.activities || []);

  const [activeGuidedActivity, setActiveGuidedActivity] = useState<any | null>(null);
  const [forceReviewDetails, setForceReviewDetails] = useState(false);
  const [guideStep, setGuideStep] = useState<1 | 2 | 3>(1);
  const [activityNotes, setActivityNotes] = useState("");
  const [activityLearnings, setActivityLearnings] = useState("");

  const startGuidedActivity = (act: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setActiveGuidedActivity(act);
    setForceReviewDetails(false);
    setGuideStep(1);
    setActivityNotes(act.notes || "");
    setActivityLearnings(act.learnings || "");
  };

  const suspendGuidedActivity = async () => {
    if (!task || !activeGuidedActivity) return;
    vibrate(HAPITCS.SUCCESS);

    const updatedActivities = localActivities.map(act => {
      if (act.id === activeGuidedActivity.id) {
        return { 
          ...act, 
          isSuspended: true, 
          isCompleted: false, 
          notes: activityNotes,
          learnings: activityLearnings
        };
      }
      return act;
    });

    setLocalActivities(updatedActivities);

    await (db.tasks as any).update(task.id, {
      activities: updatedActivities,
      isCompleted: updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted)
    });

    if (user && user.id && activityNotes.trim()) {
      await db.userSettings.where('id').equals(user.id).modify(u => {
        const prevNotes = { ...(u.notes || {}) };
        const stationId = task.stationId || 'general';
        const stationNotes = Array.isArray(prevNotes[stationId]) ? [...prevNotes[stationId]] : [];
        stationNotes.push({
          text: `[نشاط معلق: ${activeGuidedActivity.title}] ${activityNotes.trim()}`,
          date: new Date().toISOString(),
          priority: 'medium'
        });
        u.notes = { ...prevNotes, [stationId]: stationNotes };
      });
    }

    toast.success("تم تعليق النشاط وبدء العمل بنجاح 🧭 النشاط معلّق الآن!");
    setActiveGuidedActivity(null);
  };

  const finalizeCompletedActivity = async (activityId: string) => {
    if (!task) return;
    vibrate(HAPITCS.SUCCESS);

    const updatedActivities = localActivities.map(act => {
      if (act.id === activityId) {
        const updatedSteps = (act.steps || []).map((s: any) => ({ ...s, isCompleted: true }));
        return { 
          ...act, 
          isCompleted: true, 
          isSuspended: false,
          steps: updatedSteps,
          notes: activeGuidedActivity && activeGuidedActivity.id === activityId ? activityNotes : (act.notes || "")
        };
      }
      return act;
    });

    setLocalActivities(updatedActivities);

    const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted);

    await (db.tasks as any).update(task.id, {
      activities: updatedActivities,
      isCompleted: allActivitiesCompleted
    });

    const currentAct = localActivities.find(a => a.id === activityId);
    if (user && user.id && activityNotes.trim()) {
      await db.userSettings.where('id').equals(user.id).modify(u => {
        const prevNotes = { ...(u.notes || {}) };
        const stationId = task.stationId || 'general';
        const stationNotes = Array.isArray(prevNotes[stationId]) ? [...prevNotes[stationId]] : [];
        stationNotes.push({
          text: `[نشاط مكتمل: ${currentAct?.title || activeGuidedActivity?.title || 'عام'}] ${activityNotes.trim()}`,
          date: new Date().toISOString(),
          priority: 'high'
        });
        u.notes = { ...prevNotes, [stationId]: stationNotes };
      });
    }

    if (user && user.id) {
      await db.userSettings.where('id').equals(user.id).modify(u => {
        if (u.gameData) {
          u.gameData.xp = (u.gameData.xp || 0) + 10;
        }
      });
    }

    if (allActivitiesCompleted) {
      vibrate(HAPITCS.SUCCESS);
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast.success("أحسنت! أنهيت جميع الأنشطة بنجاح 🏆 نلت +10 XP!");
      if (onOpenReflection) {
        onOpenReflection(task);
      }
      onClose();
    } else {
      toast.success("تم إتمام وإنهاء النشاط بنجاح! 🎉 نلت +10 XP!");
    }

    setActiveGuidedActivity(null);
    setForceReviewDetails(false);
  };

  const completeGuidedActivity = async () => {
    if (!task || !activeGuidedActivity) return;
    // By user logic: When clicking complete/done from within the interactive stepper flow,
    // we suspend it first, so user can finish it after clicking again!
    await suspendGuidedActivity();
  };

  React.useEffect(() => {
    if (task?.activities) {
      setLocalActivities(task.activities);
    }
  }, [task?.activities]);

  const toggleActivity = async (activityId: string) => {
    if (!task) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    
    const actToToggle = localActivities.find(a => a.id === activityId);
    let xpDiff = 0;
    if (actToToggle) {
      const isNowCompleted = !actToToggle.isCompleted;
      xpDiff = isNowCompleted ? 10 : -10;
    }

    const updatedActivities = localActivities.map(act => {
      if (act.id === activityId) {
        const newStatus = !act.isCompleted;
        const updatedSteps = (act.steps || []).map((s: any) => ({ ...s, isCompleted: newStatus }));
        return { ...act, isCompleted: newStatus, steps: updatedSteps };
      }
      return act;
    });

    setLocalActivities(updatedActivities);

    const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted);
    const taskJustCompleted = allActivitiesCompleted && !task.isCompleted;

    await (db.tasks as any).update(task.id, {
      activities: updatedActivities,
      isCompleted: allActivitiesCompleted
    });

    if (user && user.id && xpDiff !== 0) {
      await db.userSettings.where('id').equals(user.id).modify(u => {
        if (u.gameData) {
          u.gameData.xp = Math.max(0, (u.gameData.xp || 0) + xpDiff);
        }
      });
    }

    if (taskJustCompleted) {
      vibrate(HAPITCS.SUCCESS);
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast.success("أحسنت! أنهيت جميع الأنشطة بنجاح 🏆");
      if (onOpenReflection) {
        onOpenReflection(task);
      }
      onClose();
    } else {
      if (xpDiff > 0) {
        toast.success("تم إنجاز النشاط بنجاح! +10 XP");
      } else {
        toast("تم التراجع عن النشاط. -10 XP");
      }
    }
  };

  const handleStart = async (target: any, isLocked: boolean) => {
    if (isLocked) {
      vibrate(HAPITCS.GUIDANCE);
      toast.error('يجب إكمال المسار السابق لفتح هذا المسار 🔒', {
        style: { borderRadius: '24px', background: '#0A0F2C', color: '#fff', direction: 'rtl' }
      });
      return;
    }

    if (target.id === 'original' && task?.type === 'main') {
      try {
        const subtasks = await db.tasks.where('parentId').equals(task.id).filter(t => t.type === 'sub').toArray();
        const hasUncompletedSubs = subtasks.some(t => !t.isCompleted);
        
        if (hasUncompletedSubs) {
          vibrate(HAPITCS.ERROR);
          toast.error("لا يمكن الاستمرار في التقييم الأصلي للمهمة الرئيسية إلا بعد الانتهاء من جميع المهام الفرعية التابعة لها! 🔒", {
            style: { borderRadius: '24px', background: '#ef4444', color: '#fff', direction: 'rtl', fontWeight: 'bold' }
          });
          return;
        }
      } catch (err) {
        console.error("Error fetching subtasks", err);
      }
    }

    vibrate(HAPITCS.MAJOR_CLICK);
    setSelectedTarget(target);
  };

  const confirmStartSession = (target: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setShowConfirmStart(target);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[6200000] bg-[#0A0F2C]/95 backdrop-blur-md flex flex-col font-sans overflow-x-hidden overflow-y-auto"
          dir="rtl"
        >
          {/* Final puzzle modal open after completing all activities */}

          {/* Custom Elegant confirmation pop-up */}
          {showConfirmStart && (
            <div 
              className="fixed inset-0 bg-[#0A0F2C]/95 backdrop-blur-md text-white flex flex-col font-sans p-6 overflow-y-auto"
              style={{ zIndex: 65000100 }}
              dir="rtl"
            >
              <div className="max-w-md w-full mx-auto my-auto flex flex-col items-center justify-center text-center space-y-6 py-6 bg-[#1A2B6B] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#2D52CC]/20 rounded-full blur-[40px] pointer-events-none" />
                
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2D52CC] to-[#4D7FFF] flex items-center justify-center text-white shadow-xl animate-bounce">
                  <Play className="w-8 h-8 fill-white" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">تأكيد الانطلاق 🚀</h2>
                  <p className="text-[#A0B4E8] text-sm leading-relaxed">
                    هل أنت جاهز لتفعيل خطة <strong>{showConfirmStart.title}</strong> والبدء بالتركيز الكامل الآن؟
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-4">
                  <button
                    onClick={() => {
                      vibrate(HAPITCS.SUCCESS);
                      const targetId = showConfirmStart.id;
                      setShowConfirmStart(null);
                      onStartSession(targetId);
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#2D52CC] to-[#4D7FFF] text-white font-black shadow-[0_4px_20px_rgba(77,127,255,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    نعم، ابدأ الآن!
                  </button>
                  
                  <button
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setShowConfirmStart(null);
                    }}
                    className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#A0B4E8] font-bold transition-all border border-white/5 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Elegant revert confirmation pop-up */}
          {showConfirmRevert && (
            <div 
              className="fixed inset-0 bg-[#0A0F2C]/95 backdrop-blur-md text-white flex flex-col font-sans p-6 overflow-y-auto"
              style={{ zIndex: 65000200 }}
              dir="rtl"
            >
              <div className="max-w-md w-full mx-auto my-auto flex flex-col items-center justify-center text-center space-y-6 py-6 bg-[#1A2B6B] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                <div className="absolute top-0 right-1/4 w-32 h-32 bg-rose-500/10 rounded-full blur-[40px] pointer-events-none" />
                
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-red-500 flex items-center justify-center text-white shadow-xl animate-pulse">
                  <RotateCcw className="w-8 h-8 text-white" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white">تأكيد التراجع ↩️</h2>
                  <p className="text-[#A0B4E8] text-sm leading-relaxed">
                    هل أنت متأكد من رغبتك في التراجع عن إكمال <strong>{showConfirmRevert.title}</strong>؟ سيتم إعادة فتح هذه المرحلة وإلغاء إكمالها.
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full pt-4">
                  <button
                    onClick={() => {
                      vibrate(HAPITCS.SUCCESS);
                      const targetId = showConfirmRevert.id;
                      setShowConfirmRevert(null);
                      if (onRevertSession) {
                        onRevertSession(targetId);
                      }
                      setSelectedTarget(null); // Return to list
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-white font-black shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    نعم، تراجع عن الإكمال
                  </button>
                  
                  <button
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setShowConfirmRevert(null);
                    }}
                    className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 text-[#A0B4E8] font-bold transition-all border border-white/5 cursor-pointer"
                  >
                    إلغاء التراجع
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Interactive Guided Activity Flow */}
          {activeGuidedActivity && (
            <div 
              className="fixed inset-0 bg-gradient-to-b from-[#0A0F2C] via-[#0E1540] to-[#04081E] text-white flex flex-col font-sans p-6 md:p-12 overflow-y-auto"
              style={{ zIndex: 65000300 }}
              dir="rtl"
            >
              <div className="max-w-4xl w-full mx-auto my-auto relative flex flex-col space-y-8 py-4">
                <div className="absolute top-10 right-1/4 w-64 h-64 bg-[#2D52CC]/10 rounded-full blur-[100px] pointer-events-none" />
                
                {/* Header with Title */}
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <div className="space-y-2 text-right">
                    <span className="text-xs font-black text-[#5C8DFF] uppercase tracking-wider">
                    {activeGuidedActivity.isSuspended ? 'النشاط التطبيقي معلَّق حالياً 🧭' : 'النشاط التطبيقي ⚡'}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white">{activeGuidedActivity.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setActiveGuidedActivity(null);
                    }}
                    className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
                  >
                    ✕
                  </button>
                </div>

                {activeGuidedActivity.isSuspended && !forceReviewDetails ? (
                  /* Suspended State Screen to finish or review details */
                  <div className="flex-grow space-y-8 text-center py-12 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse shadow-2xl shadow-amber-500/10 mb-2">
                      <Zap className="w-12 h-12 text-amber-400" />
                    </div>
                    
                    <div className="space-y-4 max-w-xl">
                      <h3 className="text-2xl font-black text-amber-400">النشاط قيد التنفيذ والتدبر 🧭</h3>
                      <p className="text-slate-300 text-sm leading-relaxed font-bold bg-black/44 p-6 rounded-[2rem] border border-white/5 mt-2">
                        لقد بدأت هذا النشاط وقمت بتعليقه مسبقاً للتركيز على العمل الفعلي والتدبر الصادق. بمجرد انتهائك، اضغط على زر "إنهاء وإتمام النشاط" ليتم نقله إلى سجل إنجازاتك المعرفية!
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg pt-6">
                      <button
                        type="button"
                        onClick={() => {
                          vibrate(HAPITCS.SUCCESS);
                          finalizeCompletedActivity(activeGuidedActivity.id);
                        }}
                        className="flex-1 py-5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-sm font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer border-none"
                      >
                        إنهاء وإتمام النشاط الآن 🏆
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setForceReviewDetails(true);
                        }}
                        className="flex-1 py-5 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm font-black border border-white/10 transition-all cursor-pointer active:scale-95"
                      >
                        عرض الخطوات والمصادر 📖
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Step Wizard Dialog Flow */
                  <>
                    {/* Clean progress indicator without step names */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white/5 rounded-2xl border border-white/5 font-sans">
                      <span className="text-xs font-black text-indigo-300">الخطوة {guideStep} من ٣</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((stepNum) => (
                          <div 
                            key={stepNum} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${stepNum === guideStep ? 'w-8 bg-[#4D7FFF]' : 'w-2 bg-white/20'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-h-[40vh] py-4">
                      {guideStep === 1 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6 text-right"
                        >
                          <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 shrink-0" />
                            <span className="text-base">التوجيه والتعليمات الخاصة بهذا النشاط:</span>
                          </div>
                          
                          <div className="bg-black/45 p-6 md:p-8 rounded-[2rem] border border-white/5 italic text-slate-200 text-base md:text-lg leading-relaxed whitespace-pre-wrap min-h-[180px]">
                            {activeGuidedActivity.guidance || "لا توجد توجيهات محددة لهذا النشاط، اتبع منهج السعي واقترب من المعرفة بثقة."}
                          </div>

                          {activeGuidedActivity.steps && activeGuidedActivity.steps.length > 0 && (
                            <div className="space-y-3 mt-6 font-sans text-right">
                              <h4 className="text-white text-sm font-black mb-2">خطوات التنفيذ المقترحة:</h4>
                              {activeGuidedActivity.steps.map((st: any) => (
                                <div key={st.id} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 text-sm text-slate-300">
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#4D7FFF] shadow-[0_0_8px_#4d7fff]" />
                                  <span>{st.title}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {guideStep === 2 && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6 text-right"
                        >
                          <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[#4D7FFF] font-bold flex items-center gap-2">
                            <BookOpen className="w-5 h-5 shrink-0" />
                            <span className="text-base">مصادر النشاط</span>
                          </div>

                          {/* Render Resources */}
                          <div className="bg-white/5 p-6 md:p-8 rounded-[2rem] border border-white/5 space-y-4">
                            <h4 className="text-white text-sm font-bold">مصادر التعلم الداعمة للنشاط:</h4>
                            {activeGuidedActivity?.learningResources ? (
                              <div className="text-slate-300 text-sm bg-black/40 p-5 rounded-2xl border border-white/5 font-mono whitespace-pre-wrap leading-relaxed">
                                {activeGuidedActivity.learningResources}
                              </div>
                            ) : (
                              <p className="text-slate-500 text-sm italic">لا توجد مصادر خاصة مضافة لهذا النشاط تحديداً.</p>
                            )}
                            
                            {(activeGuidedActivity?.youtubeUrl || activeGuidedActivity?.googleDriveUrl) && (
                              <div className="flex flex-wrap gap-3 pt-4">
                                {activeGuidedActivity.youtubeUrl && (
                                  <a 
                                    href={activeGuidedActivity.youtubeUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-xl font-bold border border-red-500/30 transition-all flex items-center gap-2 w-fit no-underline"
                                  >
                                    🎥 فيديو يوتيوب للنشاط
                                  </a>
                                )}
                                {activeGuidedActivity.googleDriveUrl && (
                                  <a 
                                    href={activeGuidedActivity.googleDriveUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs rounded-xl font-bold border border-blue-500/30 transition-all flex items-center gap-2 w-fit no-underline"
                                  >
                                    📂 مستند نشاط درايف
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {guideStep === 3 && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6 text-right"
                        >
                          <div className="bg-gradient-to-b from-[#1A2B6B] to-[#0A102E] border border-blue-500/20 p-8 md:p-12 rounded-[2.5rem] text-center space-y-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-1/4 w-32 h-32 bg-[#4D7FFF]/10 rounded-full blur-[40px] pointer-events-none" />
                            <div className="w-20 h-20 rounded-full mx-auto bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-xl shadow-blue-500/5">
                              <Target className="w-10 h-10 text-blue-300" />
                            </div>
                            <h4 className="text-white text-2xl font-black">الآن، حان وقت العمل الفعلي! ✨</h4>
                            <p className="text-[#A0B4E8] text-sm font-bold leading-relaxed max-w-[80%] mx-auto">
                              قم بتعليق هذا النشاط لتنفيذه في العالم الواقعي أو التطبيق العملي. بمجرد انتهائك يمكنك العودة هنا وإتمام النشاط بشكل نهائي لتسجيل إنجازك.
                            </p>
                            
                            <button
                              onClick={completeGuidedActivity}
                              className="w-full max-w-sm mx-auto py-5 rounded-2xl bg-gradient-to-r from-blue-700 via-[#2D52CC] to-blue-500 hover:brightness-110 text-white transition-all text-base font-black shadow-[0_4px_30px_rgba(45,82,204,0.3)] cursor-pointer border-none flex items-center justify-center gap-2"
                            >
                              <Target className="w-6 h-6 text-white" />
                              <span>تعليق وبدء تنفيذ النشاط 🧭</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 justify-end pt-6 border-t border-white/5">
                      <button
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setActiveGuidedActivity(null);
                        }}
                        className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs font-bold border-none cursor-pointer"
                      >
                        خروج
                      </button>

                      {guideStep > 1 && (
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setGuideStep((prev) => (prev - 1) as any);
                          }}
                          className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all text-xs font-bold border border-white/10 cursor-pointer"
                        >
                          السابق
                        </button>
                      )}

                      {guideStep < 3 && (
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setGuideStep((prev) => (prev + 1) as any);
                          }}
                          className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#2D52CC] to-[#4D7FFF] hover:brightness-110 text-white transition-all text-xs font-black shadow-lg cursor-pointer border-none"
                        >
                          التالي
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <ConfirmDialog />
          {/* Background Gradients */}
          <div className="fixed inset-0 bg-slate-950/10 pointer-events-none" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,#1A2B6B_0%,#0A0F2C_100%)] opacity-40 pointer-events-none" />
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[150px] pointer-events-none" />

          {/* Header */}
          <div className="sticky top-0 z-50 px-6 py-8 md:px-10 flex justify-between items-center bg-[#080d26]/80 backdrop-blur-xl border-b border-[#1A2B6B]/40">
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                 {selectedTarget ? 'تفاصيل مسار via' : 'مسار via 🛡️'}
              </h1>
              <p className="text-[#A0B4E8] font-extrabold text-xs md:text-sm mt-1">
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
              className="w-12 h-12 rounded-2xl bg-[#1A2B6B] hover:bg-[#2D52CC] text-[#A0B4E8] hover:text-white flex items-center justify-center transition-all border border-white/10 shadow-lg shadow-black/20 cursor-pointer"
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

                {task && (
                  <div className="max-w-4xl w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-2xl z-20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#2D52CC]/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="text-right flex-1">
                      <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">المهمة الحالية 🎯</span>
                      <h2 className="text-xl md:text-2xl font-black text-white mt-1.5 mb-1">{task.title}</h2>
                      {task.description && (
                        <p className="text-[#A0B4E8] text-xs line-clamp-1 opacity-85">{task.description}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 shrink-0">

                      
                      {onOpenFlashcards && (
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            onOpenFlashcards(task);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 hover:brightness-110 text-white text-xs font-black shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
                          title="كروت المراجعة"
                        >
                          <i className="pi pi-clone text-[11px]" />
                          <span>كروت المراجعة</span>
                        </button>
                      )}
                      
                      {onOpenAnalytics && (
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            onOpenAnalytics(task);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white text-xs font-black shadow-lg transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer border-none"
                          title="تحليلات الأداء"
                        >
                          <i className="pi pi-chart-bar text-[11px]" />
                          <span>الإحصائيات</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

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
                              <div className="mt-1 flex flex-col items-center gap-0.5">
                                <div className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  <span className="text-[10px] md:text-[11px] font-black text-emerald-400">مكتمل ✅</span>
                                </div>
                                <span className="text-[9px] text-[#A0B4E8] font-bold opacity-80">خيارات التراجع ↩️</span>
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
                        className={`px-8 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${activeTab === 'info' ? 'bg-gradient-to-r from-[#2D52CC] to-[#4D7FFF] text-white shadow-lg shadow-[#2D52CC]/25' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => setActiveTab('info')}
                      >
                         بيانات المهمة
                      </button>
                      <button 
                        className={`px-8 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${activeTab === 'execution' ? 'bg-gradient-to-r from-[#2D52CC] to-[#4D7FFF] text-white shadow-lg shadow-[#2D52CC]/25' : 'text-slate-400 hover:text-white'}`}
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
                                   <div className="text-center md:text-right flex-1">
                                      <h2 className="text-2xl md:text-4xl font-black text-white mb-1 line-clamp-2">{task?.title || 'عنوان المهمة'}</h2>
                                      <p className="text-blue-400 font-extrabold text-sm md:text-lg mb-3">{selectedTarget.title}</p>
                                      
                                      {/* Quick Actions buttons inside detail mode */}
                                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                        
                                        {onOpenFlashcards && (
                                          <button
                                            onClick={() => {
                                              vibrate(HAPITCS.MAJOR_CLICK);
                                              onOpenFlashcards(task);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:brightness-110 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer border-none"
                                          >
                                            <i className="pi pi-clone text-[10px]" />
                                            <span>كروت المراجعة</span>
                                          </button>
                                        )}
                                        
                                        {onOpenAnalytics && (
                                          <button
                                            onClick={() => {
                                              vibrate(HAPITCS.MAJOR_CLICK);
                                              onOpenAnalytics(task);
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:brightness-110 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer border-none"
                                          >
                                            <i className="pi pi-chart-bar text-[10px]" />
                                            <span>الإحصائيات</span>
                                          </button>
                                        )}
                                      </div>
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
                              الأنشطة والخطوات التنفيذية (انقر للإنجاز)
                           </h3>

                           {task?.isCompleted && (
                             <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-4">
                               <div className="flex items-center gap-3 text-emerald-400 text-right">
                                 <CheckCircle2 className="w-6 h-6 shrink-0" />
                                 <div>
                                   <div className="font-extrabold text-white text-base">رائع! هذه المهمة مكتملة بالكامل 🏆</div>
                                   <div className="text-xs font-semibold text-[#A0B4E8]">أنجزت كافة الخطوات التنفيذية لتعزيز الفهم والتمكين.</div>
                                 </div>
                               </div>

                             </div>
                           )}

                           {localActivities && localActivities.length > 0 ? (
                             <div className="space-y-4">
                                {localActivities.map((act: any, idx: number) => (
                                  <div 
                                    key={act.id} 
                                    onClick={() => startGuidedActivity(act)}
                                    className={`group/act relative cursor-pointer border rounded-2xl p-5 bg-white/5 transition-all duration-300 hover:bg-white/10 ${act.isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : act.isSuspended ? 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/10' : 'border-white/5'}`}
                                  >
                                     <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-all duration-300 ${act.isCompleted ? 'bg-emerald-500 text-white' : act.isSuspended ? 'bg-amber-500 text-black shadow-md font-bold' : 'bg-blue-600 text-white'}`}>
                                              {idx + 1}
                                           </div>
                                           <div className="text-right">
                                             <div className="flex flex-wrap items-center gap-2 mb-1">
                                               <h4 className={`font-black text-base transition-colors ${act.isCompleted ? 'text-slate-400 line-through' : act.isSuspended ? 'text-amber-400 font-black' : 'text-white'}`}>{act.title}</h4>
                                               <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                                                 act.type === 'applied' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                 act.type === 'interactive' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                               }`}>
                                                 {act.type === 'applied' ? '⚡ تطبيقي' : act.type === 'interactive' ? '🤝 تفاعلي' : '🧠 معرفي'}
                                               </span>
                                             </div>
                                             {act.isSuspended && (
                                               <span className="inline-block mt-1 text-[10px] text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/25 animate-pulse">
                                                 ⏳ نشاط معلّق (تحت التنفيذ والتدبر الآن)
                                               </span>
                                             )}
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {act.isSuspended && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                finalizeCompletedActivity(act.id);
                                              }}
                                              className="px-3 py-1.5 bg-gradient-to-l from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-black text-[10px] font-black rounded-lg cursor-pointer border-none shadow-md hover:scale-105 transition-all flex items-center gap-1"
                                              title="إنهاء النشاط وتأكيد الاكتمال"
                                            >
                                              <span>إنهاء النشاط 🏆</span>
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startGuidedActivity(act);
                                            }}
                                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${act.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : act.isSuspended ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'border-white/30 hover:border-white/60 bg-white/5'}`}
                                          >
                                             {act.isCompleted ? (
                                               <CheckCircle2 className="w-4 h-4 text-white fill-emerald-500 shrink-0" />
                                             ) : act.isSuspended ? (
                                               <i className="pi pi-play text-[9px] animate-pulse" />
                                             ) : (
                                               <i className="pi pi-lock-open text-[9px]" />
                                             )}
                                          </button>
                                        </div>
                                     </div>

                                     {/* Notes and Knowledge Forest tags */}
                                     {(act.notes || act.learnings) && (
                                       <div className="flex gap-2 my-2">
                                         {act.notes && (
                                           <div className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                                             📝 تم تدوين المفكرة
                                           </div>
                                         )}
                                         {act.learnings && (
                                           <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                             🌳 غابة المعرفة: مكتمل
                                           </div>
                                         )}
                                       </div>
                                     )}

                                     {act.guidance && (
                                       <p className="text-slate-400 text-sm mb-4 bg-black/20 p-3 rounded-xl border border-white/5 italic">
                                          {act.guidance}
                                       </p>
                                     )}
                                     {act.steps && act.steps.length > 0 && (
                                       <div className="space-y-2">
                                          {act.steps.map((step: any) => (
                                            <div key={step.id} className="flex items-center gap-3 text-slate-300 text-xs py-1">
                                               <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step.isCompleted || act.isCompleted ? 'bg-emerald-400' : 'bg-blue-500'}`} />
                                               <span className={act.isCompleted ? 'text-slate-500 line-through' : ''}>{step.title}</span>
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
                      {completedTargets.includes(selectedTarget.id) ? (
                        <>
                           <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[20px] flex items-center gap-3 text-emerald-400 mb-2 justify-center">
                             <CheckCircle2 className="w-5 h-5" />
                             <span className="text-sm font-bold">لقد أكملت هذه المرحلة بنجاح! 🎉</span>
                           </div>
                           
                           <button 
                             onClick={() => {
                               vibrate(HAPITCS.MAJOR_CLICK);
                               setShowConfirmRevert(selectedTarget);
                             }}
                             className="w-full py-5 rounded-[24px] bg-gradient-to-r from-red-600/90 to-rose-600/90 text-white text-lg font-black shadow-2xl hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer border-none"
                           >
                             <RotateCcw className="w-5 h-5 text-white" />
                             <span>تراجع عن إكمال هذه المرحلة ↩️</span>
                           </button>

                           <button 
                             onClick={() => confirmStartSession(selectedTarget)}
                             className="w-full py-4 rounded-[20px] bg-white/5 text-[#A0B4E8] font-bold hover:text-white hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-2 cursor-pointer"
                           >
                             <Play className="w-4 h-4 fill-current" />
                             <span>تصفح الجلسة وتفاصيلها مجدداً 🔗</span>
                           </button>
                        </>
                      ) : null }
                      {/* We removed start session button */}
                      <button 
                        onClick={() => setSelectedTarget(null)}
                        className="w-full py-4 rounded-[20px] bg-white/5 text-slate-400 font-bold hover:text-white hover:bg-white/10 transition-all border border-white/5 cursor-pointer"
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
    </AnimatePresence>,
    document.body
  );
}
