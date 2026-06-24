import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';
import { Sidebar } from 'primereact/sidebar';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import { 
  Info, 
  ListTodo, 
  Plus, 
  Trash2, 
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  Lock,
  Target,
  Play,
  Zap,
  MoreVertical,
  Activity,
  ArrowRight,
  X,
  ExternalLink,
  Briefcase,
  BookOpen,
  Youtube,
  Award,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TaskActivity, db, Task, Station } from '../db';
import { LanguageTools, YouGlishWidget } from './LanguageTools';
import { parseLearningResources } from '../types';
import { safeRandomUUID } from '../lib/uuid';
import { LAYERS } from '../constants/layers';
import { vibrate, HAPITCS } from '../lib/haptics';
import { toast } from 'react-hot-toast';
import { ActivityWizardModal } from './ActivityWizardModal';

const GemLogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C12 2 12.5 8.5 14.5 10.5C16.5 12.5 22 12 22 12C22 12 15.5 12.5 13.5 14.5C11.5 16.5 12 22 12 22C12 22 11.5 15.5 9.5 13.5C7.5 11.5 2 12 2 12C2 12 8.5 11.5 10.5 9.5C12.5 7.5 12 2 12 2Z"
      fill="url(#gemGrad)"
    />
    <defs>
      <linearGradient id="gemGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" />
        <stop offset="0.5" stopColor="#c084fc" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

interface TaskDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  taskId: string | null;
  onCompleteTask?: (taskId: string) => void;
  onOpenReflection?: (task: Task) => void;
  onUndoAction?: (actionType: 'activity' | 'task' | 'path', activityId?: string) => void;
}

export function TaskDetailsModal({ visible, onHide, taskId, onCompleteTask, onOpenReflection, onUndoAction }: TaskDetailsModalProps) {
  const [selectedActivity, setSelectedActivity] = useState<TaskActivity | null>(null);
  const [activeSubView, setActiveSubView] = useState<'guidance' | 'resources'>('guidance');
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [reviewOption, setReviewOption] = useState<'now' | 'schedule' | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());

  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [selectedForPostpone, setSelectedForPostpone] = useState<string[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [activityComment, setActivityComment] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const menuRef = useRef<Menu>(null);

  useEffect(() => {
    if (visible && taskId) {
      setIsTaskLoading(true);
      const timer = setTimeout(() => {
        setIsTaskLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [taskId, visible]);

  useEffect(() => {
    if (selectedActivity) {
      setActiveSubView('guidance');
      setActivityComment(selectedActivity.comment || '');
    } else {
      setActivityComment('');
    }
  }, [selectedActivity]);

  const task = useLiveQuery(() => 
    taskId ? db.tasks.get(taskId) : null
  , [taskId]);

  const station = useLiveQuery(() => 
    task?.stationId ? db.stations.get(task.stationId) : null
  , [task]);

  const performPostpone = async () => {
    if (!task || selectedForPostpone.length === 0) return;
    try {
      const userSettings = await db.userSettings.toCollection().first();
      const todayShort = new Date().toISOString().split('T')[0];
      const todayStationId = `deferred-${todayShort}`;
      let deferStation = await db.stations.get(todayStationId);
  
      if (!deferStation) {
        deferStation = {
          id: todayStationId,
          name: `أنشطة مؤجلة - ${todayShort}`,
          icon: "pi-clock",
          description: "الأنشطة التي قمت بتأجيلها و ترحيلها ليوم إجازتك.",
          generalNotes: "هذه المحطة تم توليدها تلقائيا للأنشطة المرحلة."
        } as Station;
        await db.stations.put(deferStation);

      }
      
      const activitiesToMove = (task.activities || []).filter(act => selectedForPostpone.includes(act.id));
      const remainingActivities = (task.activities || []).filter(act => !selectedForPostpone.includes(act.id));
      
      await (db.tasks as any).update(task.id, {
        activities: remainingActivities,
        isCompleted: task.isCompleted || (remainingActivities.length > 0 && remainingActivities.every((a:any) => a.isCompleted))
      });
      
      const deferredTask: Task = {
        id: safeRandomUUID(),
        stationId: deferStation.id,
        title: `مؤجل من: ${task.title}`,
        description: `أنشطة تم ترحيلها من مهمة ${task.title}`,
        type: "practical",
        isCompleted: false,
        
        
        activities: activitiesToMove,
        practicalPart: task.practicalPart,
      };
      
      await db.tasks.put(deferredTask);
      
      toast.success("تم ترحيل الأنشطة المحددة للمحطة المؤجلة بنجاح! 📦");
      setShowPostponeDialog(false);
      setSelectedForPostpone([]);
      vibrate(HAPITCS.SUCCESS);
    } catch (err) {
      console.error('Failed to postpone activities:', err);
      toast.error("فشل في تأجيل الأنشطة.");
    }
  };

  const handleScheduleReview = async () => {
    if (!selectedActivity || !scheduledDate) return;
    try {
      const scheduledAt = scheduledDate.toISOString();
      // Logic to add to calendar or notify
      await db.notifications.add({
        id: safeRandomUUID(),
        type: 'review_reminder',
        title: `موعد مراجعة: ${selectedActivity.title}`,
        message: `حان وقت مراجعة النشاط الذي قمت بجدولته.`,
        scheduledAt,
        isRead: false,
        relatedId: task?.id,
        relatedType: 'task'
      } as any);

      toast.success(`تمت جدولة المراجعة في: ${scheduledDate.toLocaleString('ar-EG')}`);
      setShowReviewPopup(false);
      setSelectedActivity(null);
    } catch (err) {
      console.error('Failed to schedule review:', err);
      toast.error("فشل في جدولة المراجعة");
    }
  };

  const handleReviewNow = () => {
    setReviewOption(null);
    setShowReviewPopup(false);
    setActiveSubView('guidance');
  };

  const toggleActivityComplete = async (activityId: string, comment?: string) => {
    if (!task) return;
    try {
      const currentActivities = task.activities || [];
      const updatedActivities = currentActivities.map(act => {
        if (act.id === activityId) {
          const updated = { ...act, isCompleted: !act.isCompleted, isSuspended: false };
          if (comment !== undefined) {
            updated.comment = comment;
          }
          return updated;
        }
        return act;
      });

      const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every((a: any) => a.isCompleted);
      const taskJustCompleted = allActivitiesCompleted && !task.isCompleted;

      await (db.tasks as any).update(task.id, { 
        activities: updatedActivities,
        isCompleted: task.isCompleted || allActivitiesCompleted 
      });

      // Update selectedActivity local state with new properties
      if (selectedActivity && selectedActivity.id === activityId) {
        const matching = updatedActivities.find(a => a.id === activityId);
        if (matching) setSelectedActivity(matching);
      }

      if (taskJustCompleted) {
        vibrate(HAPITCS.SUCCESS);
        confetti({
          zIndex: 999999999,
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success("تم إنجاز المهمة بنجاح! 🏆", {
          style: {
            borderRadius: '16px',
            background: '#10b981',
            color: '#fff',
            fontWeight: 'bold',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        });
        if (onCompleteTask) onCompleteTask(task.id!);
      } else {
        vibrate(HAPITCS.MAJOR_CLICK);
      }
    } catch (err) {
      console.error('Failed to update activity:', err);
      toast.error("حدث خطأ أثناء حفظ التغيير");
    }
  };

  const handleActivitySuspend = async (activity: TaskActivity) => {
    if (!task || !task.activities) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    
    // Update activity to be suspended
    const updatedActivities = task.activities.map(a => 
       a.id === activity.id ? { ...a, isSuspended: true } : a
    );
    
    await (db.tasks as any).update(task.id, {
        activities: updatedActivities
    });
    
    toast.success("تم تعليق النشاط بنجاح للبدء به", { icon: "🧭" });
  };
  
  const saveActivityComment = async (commentText: string) => {
    if (!task || !selectedActivity) return;
    try {
      const currentActivities = task.activities || [];
      const updatedActivities = currentActivities.map(act => {
        if (act.id === selectedActivity.id) {
          return { ...act, comment: commentText };
        }
        return act;
      });
      await (db.tasks as any).update(task.id, {
        activities: updatedActivities
      });
      setSelectedActivity(prev => prev ? { ...prev, comment: commentText } : null);
      toast.success("تم حفظ تعليق النشاط بنجاح! 💾");
    } catch (err) {
      console.error('Failed to save comment:', err);
      toast.error("فشل في حفظ التعليق");
    }
  };

  const getActivityTypeLabel = (act: TaskActivity) => {
     if (task?.stationId === "language_station") return "نشاط اكتساب لغوي 🗣️";
     switch(act.type) {
       case 'cognitive': return "نشاط معرفي 🧠";
       case 'applied': return "نشاط تطبيقي عملي 🛠️";
       case 'interactive': return "نشاط تفاعلي حواري 💬";
       default: return "نشاط تنفيذي متكامل 🧭";
     }
  };

  const handleEndActivity = async (activityId: string) => {
     vibrate(HAPITCS.SUCCESS);
     await toggleActivityComplete(activityId, activityComment);
     
     if (task && onOpenReflection) {
       onOpenReflection(task);
     }
  };

  const isLanguageLearning = task?.stationId === "language_station";

  if (!task && !isTaskLoading) return null;

  return (
    <Dialog
      visible={visible}
      onHide={() => {
        onHide();
        setSelectedActivity(null);
      }}
      modal
      maximized
      className="m-0 custom-dialog-no-padding custom-transparent-dialog-full"
      closable={false}
      showHeader={false}
      draggable={false}
      resizable={false}
    >
      {/* Review Scheduling Popup */}
      <Dialog
        visible={showReviewPopup}
        onHide={() => setShowReviewPopup(false)}
        header="مراجعة النشاط 🔁"
        className="w-full max-w-md font-sans"
        footer={
           <div className="flex gap-2 justify-end w-full" dir="rtl">
              {reviewOption === 'schedule' && (
                <button 
                  onClick={handleScheduleReview}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  تأكيد الجدولة
                </button>
              )}
              <button 
                onClick={() => setShowReviewPopup(false)}
                className="px-6 py-2 bg-white/5 text-slate-400 rounded-xl font-bold"
              >
                إلغاء
              </button>
           </div>
        }
      >
        <div className="p-4 space-y-6" dir="rtl">
          {!reviewOption ? (
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleReviewNow()}
                className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all text-right"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Play className="w-6 h-6 text-emerald-400" />
                  <span className="text-lg font-black text-white">راجعها دلوقتى</span>
                </div>
                <p className="text-sm text-slate-400">ابدأ عملية المراجعة والتقييم فوراً.</p>
              </button>
              
              <button
                onClick={() => setReviewOption('schedule')}
                className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/20 transition-all text-right"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-6 h-6 text-indigo-400" />
                  <span className="text-lg font-black text-white">جدولها بعدين</span>
                </div>
                <p className="text-sm text-slate-400">اختر موعداً مناسباً في التقويم لمراجعة هذا النشاط.</p>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-white font-bold mb-2 text-right">اختر الموعد والساعة:</h4>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-center">
                 <input 
                   type="datetime-local" 
                   value={scheduledDate ? scheduledDate.toISOString().slice(0, 16) : ''}
                   onChange={(e) => setScheduledDate(new Date(e.target.value))}
                   className="bg-transparent text-white border-none focus:outline-none text-center font-mono w-full"
                 />
              </div>
            </div>
          )}
        </div>
      </Dialog>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full bg-[#050816] flex flex-col font-sans relative overflow-hidden" 
        dir="rtl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent_70%)] opacity-50" />
        
        {/* Full Screen Header */}
        <div className="flex-none p-6 md:px-12 md:py-6 flex items-center justify-between border-b border-white/5 relative z-10 bg-[#080b18]/80 backdrop-blur-3xl">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (selectedActivity) {
                  setSelectedActivity(null);
                } else {
                  onHide();
                }
              }}
              className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center transition-all duration-300 cursor-pointer border border-white/10 group focus:outline-none"
            >
              {selectedActivity ? (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              ) : (
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase mb-0.5">
                {selectedActivity ? 'تفاصيل النشاط والتوجيه' : `بناء قدرات ومهارات - ${station ? station.name : 'جاري التحميل...'}`}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">
                  {selectedActivity ? selectedActivity.title : (task ? task.title : 'تفاصيل الغاية والمهمة 🎯')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {selectedActivity && (
                 <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    
                    <button
                      onClick={() => setActiveSubView('guidance')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 transition-all duration-300 cursor-pointer ${activeSubView === 'guidance' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">التوجيه</span>
                    </button>
                    <button
                      onClick={() => setActiveSubView('resources')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs md:text-sm flex items-center gap-2 transition-all duration-300 cursor-pointer ${activeSubView === 'resources' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <ListTodo className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">المصادر</span>
                    </button>
                 </div>
             )}

             {!selectedActivity && task?.isCompleted && (
               <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" />
                 <span className="font-black text-xs md:text-sm">مهمة مكتملة</span>
               </div>
             )}
             
             
          </div>
        </div>

        {/* Full Screen Content Area */}
        <div className="flex-1 overflow-y-auto w-full relative z-10 custom-scrollbar bg-black/10">
          {(!task || isTaskLoading) ? (
            <div className="h-full flex flex-col justify-center items-center">
               <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 flex items-center justify-center animate-spin border-t-4 border-indigo-500 shadow-2xl shadow-indigo-500/20"></div>
            </div>
          ) : selectedActivity ? (
            <div className="w-full h-full flex flex-col lg:flex-row relative">
               
               {/* Sidebar Toggle Button (Custom Logo /pwa-icon.svg) */}
               <button
                 onClick={() => {
                   vibrate(HAPITCS.MAJOR_CLICK);
                   setIsSidebarOpen(true);
                 }}
                 className="absolute left-6 top-6 z-30 w-14 h-14 bg-indigo-950/85 hover:bg-indigo-900 border border-indigo-500/30 rounded-2xl shadow-2xl flex items-center justify-center transition-all cursor-pointer overflow-hidden p-2.5 active:scale-95 hover:scale-105"
                 title="فتح اللوحة الجانبية"
               >
                 <img src="/pwa-icon.svg" alt="VIA Logo" className="w-full h-full object-contain" />
               </button>

               {/* Main Activity details area */}
               <div className="flex-1 p-6 md:p-12 lg:p-20 flex flex-col justify-center items-center text-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_50%)]" />
                 
                 <div className="relative z-10 max-w-3xl space-y-8 flex flex-col items-center">
                   {/* Badge for Type of activity */}
                   <motion.div 
                     initial={{ opacity: 0, y: -20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="px-6 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold text-sm shadow-md flex items-center gap-2"
                   >
                     <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                     <span>نوع النشاط: {getActivityTypeLabel(selectedActivity)}</span>
                   </motion.div>

                   {/* Title */}
                   <motion.h1 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
                   >
                     {selectedActivity.title}
                   </motion.h1>

                   {/* Duration */}
                   {selectedActivity.duration && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="flex items-center gap-2 text-slate-400 font-semibold bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-sm"
                     >
                       <Clock className="w-4 h-4 text-indigo-400" />
                       <span>المدة المتوقعة: {selectedActivity.duration} دقيقة</span>
                     </motion.div>
                   )}

                   {/* Description (if exists) */}
                   {selectedActivity.description && selectedActivity.description !== selectedActivity.guidance && (
                     <motion.p 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="text-slate-300 text-base md:text-lg max-w-xl leading-relaxed text-right font-medium"
                     >
                       {selectedActivity.description}
                     </motion.p>
                   )}
                 </div>
               </div>

               {/* Sidebar Panel */}
               {/* PrimeReact Sidebar Component matching maps.tsx */}
               <Sidebar
                 visible={isSidebarOpen}
                 onHide={() => setIsSidebarOpen(false)}
                 position="left"
                 modal={true}
                 showCloseIcon={false}
                 header={
                   <div className="flex justify-between items-center w-full px-2 pt-2" dir="rtl">
                     <div className="flex items-center gap-3">
                       <img src="/pwa-icon.svg" alt="VIA Logo" className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1.5 border border-white/10 shadow-lg" />
                       <div className="text-right">
                         <h3 className="text-base font-black text-white leading-none">لوحة التحكم 💎</h3>
                         <p className="text-[11px] text-slate-400 mt-1">التوجيه، المصادر، والتقييم</p>
                       </div>
                     </div>
                     <button
                       onClick={() => setIsSidebarOpen(false)}
                       className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 active:scale-95 text-indigo-400 group cursor-pointer shadow-sm"
                       title="إغلاق"
                     >
                       <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                     </button>
                   </div>
                 }
                 className="w-full sm:w-[380px] md:w-[420px] font-sans bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border-r border-white/10 shadow-2xl custom-left-sidebar"
               >
                 <div className="h-full flex flex-col pt-2" dir="rtl">
                   
                   {/* Sidebar Scrollable Body */}
                   <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-right">
                      
                      {/* 1. Execution & Guidance */}
                      <div className="p-5 bg-slate-900/40 backdrop-blur-md border border-amber-500/15 rounded-2xl relative overflow-hidden text-right space-y-4 shadow-xl">
                         <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                         <h4 className="text-sm font-black text-amber-400 flex items-center gap-2">
                           <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                           <span>التنفيذ والتوجيه المنهجي 🧭</span>
                         </h4>
                         <div className="text-slate-100 text-sm font-semibold leading-relaxed bg-[#020617]/70 p-4 rounded-xl border border-white/5 whitespace-pre-wrap shadow-inner text-right">
                           {selectedActivity.guidance || selectedActivity.description || "ابدأ هذا النشاط مستعيناً بالله وتوكل عليه."}
                         </div>
                         
                         {isLanguageLearning && (
                            <div className="pt-2">
                               <LanguageTools />
                            </div>
                         )}
                      </div>

                      {/* 2. Resources */}
                      <div className="p-5 bg-slate-900/40 backdrop-blur-md border border-blue-500/15 rounded-2xl text-right space-y-4 shadow-xl">
                         <h4 className="text-sm font-black text-blue-400 flex items-center gap-2">
                           <ListTodo className="w-4 h-4 text-blue-400" />
                           <span>مصادر النشاط المخصصة</span>
                         </h4>
                         <div className="grid grid-cols-1 gap-3">
                           {(selectedActivity.learningResources && parseLearningResources(selectedActivity.learningResources).length > 0) ? (
                             parseLearningResources(selectedActivity.learningResources).map((res) => (
                                <a 
                                  key={res.id}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-4 bg-[#020617]/80 border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 rounded-xl flex items-center justify-between transition-all duration-300 group"
                                >
                                   <div className="flex flex-col gap-1 min-w-0 text-right">
                                      <h5 className="text-xs font-black text-white group-hover:text-blue-300 transition-colors truncate">{res.name}</h5>
                                      <span className="text-[10px] text-slate-500 font-mono break-all opacity-60 truncate">{res.url}</span>
                                   </div>
                                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-all shrink-0">
                                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-all" />
                                   </div>
                                </a>
                             ))
                           ) : (
                             <div className="p-6 text-center text-xs text-slate-500 font-bold bg-black/20 rounded-xl border border-dashed border-white/5">
                                لا توجد مصادر خارجية لهذا النشاط حالياً
                              </div>
                           )}
                         </div>
                      </div>

                      {/* 3. Comment Section */}
                      <div className="p-5 bg-slate-900/40 backdrop-blur-md border border-indigo-500/15 rounded-2xl text-right space-y-4 shadow-xl">
                         <h4 className="text-sm font-black text-indigo-400 flex items-center gap-2">
                           <span className="text-base">📝</span>
                           <span>تعليق النشاط</span>
                         </h4>
                         <p className="text-[11px] text-slate-400 leading-relaxed">
                           دون انطباعك، الصعوبات، أو ما تود تذكره لاحقاً في هذا النشاط.
                         </p>
                         <textarea
                           value={activityComment}
                           onChange={(e) => setActivityComment(e.target.value)}
                           onBlur={() => {
                             if (selectedActivity.isCompleted) {
                               saveActivityComment(activityComment);
                             }
                           }}
                           placeholder="اكتب هنا تعليقك على هذا النشاط..."
                           className="w-full min-h-[120px] bg-slate-950/60 border border-white/10 rounded-xl p-4 text-xs text-white font-medium focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-600 resize-none text-right"
                           dir="rtl"
                         />
                         
                         <div className="flex justify-between items-center text-[10px] text-slate-400">
                           {selectedActivity.isCompleted ? (
                             <span>سيتم الحفظ التلقائي عند الخروج</span>
                           ) : (
                             <span>سيتم حفظ التعليق عند إنهاء النشاط</span>
                           )}
                           <button
                             onClick={() => saveActivityComment(activityComment)}
                             className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 font-bold cursor-pointer"
                           >
                             حفظ التعليق 💾
                           </button>
                         </div>
                      </div>

                   </div>

                   {/* Activity Controls Footer inside the Sidebar */}
                   <div className="p-4 bg-slate-950/90 border-t border-white/5 space-y-3">
                      {/* Case 1: Completed / Review - Show button "تعليق النشاط والتقييم" */}
                      {selectedActivity.isCompleted && (
                         <button
                           onClick={() => handleEndActivity(selectedActivity.id)}
                           className="w-full py-3 px-5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                         >
                           <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform text-indigo-300 animate-pulse" />
                           تعليق النشاط والتقييم 📝
                         </button>
                      )}

                      {/* Case 2: Not Started - Show "بدء التنفيذ والتركيز" */}
                      {!selectedActivity.isCompleted && !selectedActivity.isSuspended && (
                         <button
                           onClick={() => handleActivitySuspend(selectedActivity)}
                           className="w-full py-3 px-5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-500 hover:shadow-indigo-500/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer animate-pulse"
                         >
                           <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                           بدء التنفيذ والتركيز 🧭
                         </button>
                      )}

                      {/* Case 3: Suspended / In-progress - Show "تعليق النشاط والتقييم" */}
                      {selectedActivity.isSuspended && !selectedActivity.isCompleted && (
                         <button
                           onClick={() => handleEndActivity(selectedActivity.id)}
                           className="w-full py-3 px-5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                         >
                           <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                           تعليق النشاط والتقييم ✅
                         </button>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedActivity(null)}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-bold text-xs hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10"
                        >
                          عودة للمهمة
                        </button>
                      </div>
                   </div>
                 </div>
               </Sidebar>
               
</div>
          ) : (
            <div className="w-full h-full p-8 md:p-12 space-y-12 max-w-6xl mx-auto">
               
               {/* Context & Resources Strip */}
               <div className="space-y-6">
                 {task.description && (
                    <div className="p-6 md:p-8 bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-3xl text-right relative overflow-hidden group shadow-xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg mb-4">مضمون المهمة والغاية</span>
                      <h3 className="text-3xl font-black text-white">{task.title}</h3>
                      <p className="text-lg font-bold text-slate-300 mt-4 leading-relaxed">{task.description}</p>
                    </div>
                  )}

                  {task.practicalPart && (
                    <div className="p-6 md:p-8 bg-slate-900/30 backdrop-blur-md border border-emerald-500/15 rounded-3xl text-right shadow-xl">
                      <div className="flex items-center gap-4 text-emerald-300 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h4 className="text-xl font-black">الجزء التطبيقي السامي</h4>
                      </div>
                      <p className="text-slate-100 text-lg font-medium leading-relaxed bg-[#020617]/50 border border-white/5 p-6 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-inner">
                        {task.practicalPart}
                      </p>
                    </div>
                  )}

                  {task.learningResources && parseLearningResources(task.learningResources).length > 0 && (
                    <div className="p-6 md:p-8 bg-slate-900/30 backdrop-blur-md border border-blue-500/15 rounded-3xl text-right shadow-xl">
                      <div className="flex items-center gap-4 text-blue-300 mb-6">
                         <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                         </div>
                        <h4 className="text-xl font-black">مصادر التعلم المؤصلة</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parseLearningResources(task.learningResources).map((item) => {
                          const isUrl = item.url.startsWith('http://') || item.url.startsWith('https://');
                          return (
                            <a 
                              key={item.id}
                              href={isUrl ? item.url : undefined}
                              target={isUrl ? "_blank" : undefined}
                              rel="noopener noreferrer"
                              className={`p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 cursor-pointer ${isUrl ? 'bg-[#020617]/80 border-blue-500/20 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400/50 shadow-md' : 'bg-[#020617]/50 border-white/5 text-slate-400 pointer-events-none'}`}
                            >
                               <div className="flex flex-col gap-1 text-right">
                                  <span className="font-black text-base tracking-wide">{item.name.trim() || item.url}</span>
                                  {isUrl && <span className="text-xs opacity-50 font-mono break-all line-clamp-1 max-w-xs">{item.url}</span>}
                               </div>
                               {isUrl ? <ExternalLink className="w-4 h-4 text-blue-400" /> : <BookOpen className="w-4 h-4 text-slate-500" />}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {task.youtubeUrl && (
                    <div className="p-6 md:p-8 bg-slate-900/30 backdrop-blur-md border border-rose-500/15 rounded-3xl text-right shadow-xl">
                      <div className="flex items-center gap-4 text-rose-400 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                           <Youtube className="w-5 h-5 text-rose-400" />
                        </div>
                        <h4 className="text-xl font-black">المحتوى المرئي الداعم</h4>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-white/5 bg-black shadow-2xl">
                         {(() => {
                            let videoId = '';
                            try {
                               const urlObj = new URL(task.youtubeUrl);
                               if (urlObj.hostname.includes('youtube.com')) {
                                   videoId = urlObj.searchParams.get('v') || '';
                               } else if (urlObj.hostname.includes('youtu.be')) {
                                   videoId = urlObj.pathname.slice(1);
                               }
                            } catch { 
                               videoId = task.youtubeUrl.length === 11 ? task.youtubeUrl : '';
                            }
                            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : task.youtubeUrl;
                            
                            return (
                               <iframe 
                                 width="100%" 
                                 height="450" 
                                 src={embedUrl}
                                 title="YouTube video player" 
                                 frameBorder="0" 
                                 allowFullScreen
                                 className="w-full"
                               ></iframe>
                            );
                         })()}
                      </div>
                    </div>
                  )}
               </div>

               {/* Activities Grid */}
               <div className="space-y-8 pb-12">
                  <div className="flex items-center justify-between border-t border-white/10 pt-12">
                    <h3 className="text-3xl font-black text-white flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                         <Target className="w-8 h-8 text-indigo-400" />
                      </div>
                      الأنشطة التنفيذية
                    </h3>
                    <span className="text-slate-400 font-black text-lg bg-white/5 px-6 py-2 rounded-2xl border border-white/10">{(task.activities || []).length} نشاط</span>
                  </div>
                  
                  {(task.activities || []).length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[40px]">
                       <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-400 mb-6">
                         <ListTodo className="w-12 h-12 opacity-30" />
                       </div>
                       <h4 className="text-2xl font-black text-white mb-4">لا توجد أنشطة حالياً</h4>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {(task.activities || []).map((act: any, idx: number) => (
                         <div key={act.id} className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300 group hover:bg-slate-900/60 hover:scale-[1.01] shadow-lg relative overflow-hidden text-right">
                            <div className="space-y-4 mb-8">
                              <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-3">
                                    <span className="text-indigo-400 font-black text-xs bg-indigo-500/10 px-2.5 py-1 rounded-md"># {idx+1}</span>
                                    <h4 className={`text-lg md:text-xl font-black leading-snug ${act.isCompleted ? 'text-slate-500 line-through opacity-60' : 'text-white group-hover:text-indigo-300'} transition-all`}>
                                      {act.title}
                                    </h4>
                                 </div>
                                 {act.isCompleted && (
                                   <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                     <CheckCircle2 className="w-5 h-5" />
                                   </div>
                                 )}
                              </div>
                              
                              <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed line-clamp-2">{act.description}</p>

                              <div className="flex items-center gap-3">
                                 {act.isSuspended && !act.isCompleted && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl">
                                       <Zap className="w-4 h-4" />
                                       <span className="text-sm font-black tracking-wide">قيد التنفيذ 🧭</span>
                                    </div>
                                 )}
                                 
                                 {act.duration && !act.isCompleted && !act.isSuspended && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-slate-400 rounded-lg text-xs font-semibold">
                                       <Clock className="w-4 h-4" />
                                       <span>{act.duration} دقيقة</span>
                                    </div>
                                 )}
                              </div>
                            </div>
                            
                            <div className="mt-auto">
                               {act.isCompleted ? (
                                   <button
                                     onClick={() => {
                                       setSelectedActivity(act);
                                       setReviewOption(null);
                                       setShowReviewPopup(true);
                                     }}
                                     className="w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm md:text-base font-black border border-emerald-500/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                                   >
                                     <Sparkles className="w-4 h-4" />
                                     راجع النشاط
                                   </button>
                               ) : act.isSuspended ? (
                                  <button
                                     onClick={() => handleEndActivity(act.id)}
                                     className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm md:text-base font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-[0.98] transition-all duration-300 text-center flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    إنهاء وتقييم النشاط
                                  </button>
                               ) : (
                                  <button
                                     onClick={() => setSelectedActivity(act)}
                                     className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm md:text-base font-black border border-white/5 hover:border-indigo-500/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-slate-400" />
                                    ابدأ النشاط
                                  </button>
                               )}
                            </div>
                         </div>
                       ))}
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </motion.div>

      <Dialog
        visible={showPostponeDialog}
        onHide={() => setShowPostponeDialog(false)}
        showHeader={false}
        className="w-full max-w-sm rounded-[24px] overflow-hidden border border-white/10 shadow-2xl relative"
        modal
        dismissableMask
        contentClassName="p-0 bg-[#020617]"
      >
        <div className="p-7 text-center font-sans" dir="rtl">
          {/* Clock/Delay Icon Container */}
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-500/20 text-amber-400 mb-4 border border-amber-500/30">
            <Clock className="w-7 h-7" />
          </div>
          
          <h3 className="text-base font-black text-white mb-2">
            ترحيل وتأجيل الأنشطة 🗓️
          </h3>
          
          <p className="text-xs font-semibold text-slate-400 leading-relaxed mb-4 px-1">
            حدد بذكاء الأنشطة التي تود ترحيلها ليوم إجازتك، لتخفف الضغط وتكمل دراستك بطاقة متوازنة.
          </p>

          <div className="space-y-1.5 max-h-40 overflow-y-auto mb-6 text-right custom-scrollbar border border-white/10 p-2 rounded-xl bg-white/5">
            {(task?.activities || []).map(act => {
              const isSelected = selectedForPostpone.includes(act.id);
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setSelectedForPostpone(prev => isSelected ? prev.filter(id => id !== act.id) : [...prev, act.id]);
                  }}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer ${isSelected ? 'bg-amber-500/20 border border-amber-500/30 text-amber-200' : 'bg-transparent border border-transparent text-slate-300 hover:bg-white/5'}`}
                >
                   <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-slate-500'}`}>
                     {isSelected && <CheckCircle2 className="w-3 h-3" />}
                   </div>
                   <span className="text-xs font-bold truncate max-w-[200px]">{act.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPostponeDialog(false)}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={performPostpone}
              disabled={selectedForPostpone.length === 0}
              className={`flex-1 py-3 text-black rounded-xl text-sm font-black transition-all cursor-pointer ${selectedForPostpone.length === 0 ? 'bg-amber-500/50 opacity-50 cursor-not-allowed' : 'bg-amber-500 shadow-md shadow-amber-500/20 hover:brightness-110'}`}
            >
              تأكيد الترحيل
            </button>
          </div>
        </div>
      </Dialog>
      
    </Dialog>
  );
}
