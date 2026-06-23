import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';
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
  Activity
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
  const [activeSubView, setActiveSubView] = useState<'details' | 'guidance' | 'resources'>('details');
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [reviewOption, setReviewOption] = useState<'now' | 'schedule' | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());

  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [selectedForPostpone, setSelectedForPostpone] = useState<string[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  
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
      setActiveSubView('details');
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
    setActiveSubView('details');
  };

  const toggleActivityComplete = async (activityId: string) => {
    if (!task) return;
    try {
      const currentActivities = task.activities || [];
      const updatedActivities = currentActivities.map(act => {
        if (act.id === activityId) {
          return { ...act, isCompleted: !act.isCompleted, isSuspended: false };
        }
        return act;
      });

      const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every((a: any) => a.isCompleted);
      const taskJustCompleted = allActivitiesCompleted && !task.isCompleted;

      await (db.tasks as any).update(task.id, { 
        activities: updatedActivities,
        isCompleted: task.isCompleted || allActivitiesCompleted 
      });

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
  
  const handleEndActivity = async (activityId: string) => {
     vibrate(HAPITCS.SUCCESS);
     await toggleActivityComplete(activityId);
     
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
        <div className="flex-none p-6 md:px-12 md:py-8 flex items-center justify-between border-b border-white/5 relative z-10 bg-black/40 backdrop-blur-3xl">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (selectedActivity) {
                  setSelectedActivity(null);
                } else {
                  onHide();
                }
              }}
              className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-all cursor-pointer border border-white/10 group focus:outline-none"
            >
              <i className={`pi ${selectedActivity ? 'pi-arrow-right' : 'pi-times'} text-xl group-hover:scale-110 transition-transform`} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase mb-1">
                {selectedActivity ? 'تفاصيل النشاط والتوجيه' : `بناء قدرات ومهارات - ${station ? station.name : 'جاري التحميل...'}`}
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">
                  {selectedActivity ? selectedActivity.title : (task ? task.title : 'تفاصيل الغاية والمهمة 🎯')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {selectedActivity && !selectedActivity.isCompleted && (
                 <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                      onClick={() => setActiveSubView('details')}
                      className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${activeSubView === 'details' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Activity className="w-4 h-4" />
                      التنفيذ
                    </button>
                    <button
                      onClick={() => setActiveSubView('guidance')}
                      className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${activeSubView === 'guidance' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Sparkles className="w-4 h-4" />
                      التوجيه
                    </button>
                    <button
                      onClick={() => setActiveSubView('resources')}
                      className={`px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${activeSubView === 'resources' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                      <ListTodo className="w-4 h-4" />
                      المصادر
                    </button>
                 </div>
             )}

             {!selectedActivity && task?.isCompleted && (
               <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" />
                 <span className="font-black text-sm">مهمة مكتملة</span>
               </div>
             )}
             
             <div className="flex items-center gap-2">
               <Menu 
                 model={[
                   {
                     label: 'التراجع والإلغاء المتقدم',
                     icon: 'pi pi-undo',
                     command: () => setShowUndoDialog(true)
                   }
                 ]} 
                 popup 
                 ref={menuRef} 
                 id="popup_menu" 
               />
               <button 
                 onClick={(e) => menuRef.current?.toggle(e)}
                 className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 flex items-center justify-center transition-all border border-white/10"
               >
                 <i className="pi pi-ellipsis-v text-lg" />
               </button>
             </div>
          </div>
        </div>

        {/* Full Screen Content Area */}
        <div className="flex-1 overflow-y-auto w-full relative z-10 custom-scrollbar bg-black/10">
          {(!task || isTaskLoading) ? (
            <div className="h-full flex flex-col justify-center items-center">
               <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 flex items-center justify-center animate-spin border-t-4 border-indigo-500 shadow-2xl shadow-indigo-500/20"></div>
            </div>
          ) : selectedActivity ? (
            <div className="w-full h-full flex flex-col">
               <div className="flex-1 p-8 md:p-16 max-w-5xl mx-auto w-full">
                  <AnimatePresence mode="wait">
                    {activeSubView === 'guidance' && (
                      <motion.div 
                        key="guidance"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-8"
                      >
                        <div className="p-10 bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 rounded-[50px] shadow-2xl relative overflow-hidden">
                           <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full" />
                           <div className="flex items-center gap-6 mb-8">
                             <div className="w-20 h-20 rounded-[30px] bg-amber-500/20 flex items-center justify-center border border-amber-500/30 shadow-2xl shadow-amber-500/20">
                                <Sparkles className="w-10 h-10 text-amber-300" />
                             </div>
                             <div>
                               <h3 className="text-3xl font-black text-white">التوجيه السامي 🧭</h3>
                               <p className="text-amber-400 font-bold">اتبع هذه التعليمات لضمان أفضل جودة للتنفيذ</p>
                             </div>
                           </div>
                           <div className="text-amber-50/90 text-xl md:text-2xl font-bold leading-relaxed bg-black/60 p-10 rounded-[40px] border border-white/5 whitespace-pre-wrap shadow-inner">
                             {selectedActivity.guidance || selectedActivity.description || "ابدأ هذا النشاط مستعيناً بالله وتوكل عليه."}
                           </div>
                        </div>
                      </motion.div>
                    )}

                    {activeSubView === 'resources' && (
                      <motion.div 
                        key="resources"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="space-y-8"
                      >
                         <div className="p-10 bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/20 rounded-[50px] shadow-2xl">
                            <div className="flex items-center gap-6 mb-8">
                              <div className="w-20 h-20 rounded-[30px] bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                 <ListTodo className="w-10 h-10 text-blue-300" />
                              </div>
                              <div>
                                <h3 className="text-3xl font-black text-white">مصادر النشاط المخصصة</h3>
                                <p className="text-blue-400 font-bold">أدوات ومراجع تدعمك في رحلة السعي</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               {(selectedActivity.learningResources && parseLearningResources(selectedActivity.learningResources).length > 0) ? (
                                 parseLearningResources(selectedActivity.learningResources).map((res) => (
                                    <a 
                                      key={res.id}
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-8 bg-black/60 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-[35px] flex items-center justify-between transition-all group"
                                    >
                                       <div className="flex flex-col gap-2">
                                          <h4 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">{res.name}</h4>
                                          <span className="text-sm text-slate-500 font-mono break-all opacity-60">{res.url}</span>
                                       </div>
                                       <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
                                          <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-all rotate-180" />
                                       </div>
                                    </a>
                                 ))
                               ) : (
                                 <div className="col-span-full p-12 text-center text-slate-500 font-bold bg-black/20 rounded-[40px] border border-dashed border-white/5">
                                    لا توجد مصادر خارجية لهذا النشاط حالياً
                                 </div>
                               )}
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {activeSubView === 'details' && (
                      <motion.div 
                        key="details"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-12"
                      >
                         <div className="p-10 bg-white/5 border border-white/10 rounded-[50px] shadow-2xl text-slate-300 text-xl font-bold leading-relaxed whitespace-pre-wrap">
                            {selectedActivity.description || "ابدأ المهمة الآن وركز في خطواتك القادمة بكل شغف."}
                         </div>

                         {isLanguageLearning && (
                           <div className="bg-indigo-500/5 p-10 rounded-[50px] border border-indigo-500/10">
                              <LanguageTools />
                           </div>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Activity Controls Footer */}
               <div className="sticky bottom-0 left-0 right-0 p-8 md:p-12 bg-black/60 backdrop-blur-3xl border-t border-white/5">
                   <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
                       {!selectedActivity.isCompleted && !selectedActivity.isSuspended && (
                          <button
                            onClick={() => handleActivitySuspend(selectedActivity)}
                            className="flex-1 w-full py-6 rounded-[30px] bg-indigo-600 text-white font-black text-2xl shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                          >
                             <Play className="w-8 h-8 group-hover:scale-110 transition-transform" />
                             بدء التنفيذ والتركيز 🧭
                          </button>
                       )}
                       {selectedActivity.isSuspended && !selectedActivity.isCompleted && (
                          <button
                            onClick={() => handleEndActivity(selectedActivity.id)}
                            className="flex-1 w-full py-6 rounded-[30px] bg-emerald-600 text-white font-black text-2xl shadow-2xl shadow-emerald-600/40 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                          >
                             <CheckCircle2 className="w-8 h-8 group-hover:scale-110 transition-transform" />
                             إنهاء النشاط والتقييم ✅
                          </button>
                       )}
                       <button
                         onClick={() => setSelectedActivity(null)}
                         className="px-10 py-6 rounded-[30px] bg-white/5 text-slate-400 font-bold text-xl hover:bg-white/10 transition-all"
                       >
                         عودة للمهمة
                       </button>
                   </div>
               </div>
            </div>
          ) : (
            <div className="w-full h-full p-8 md:p-12 space-y-12 max-w-6xl mx-auto">
               
               {/* Context & Resources Strip */}
               <div className="space-y-6">
                 {task.description && (
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] text-right relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg mb-4">مضمون المهمة والغاية</span>
                      <h3 className="text-3xl font-black text-white">{task.title}</h3>
                      <p className="text-lg font-bold text-slate-300 mt-4 leading-relaxed">{task.description}</p>
                    </div>
                  )}

                  {task.practicalPart && (
                    <div className="p-8 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-[40px] text-right">
                      <div className="flex items-center gap-4 text-emerald-300 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <i className="pi pi-briefcase text-lg text-emerald-400" />
                        </div>
                        <h4 className="text-xl font-black">الجزء التطبيقي السامي</h4>
                      </div>
                      <p className="text-lg font-bold text-emerald-50 bg-black/40 border border-white/5 p-8 rounded-3xl leading-relaxed whitespace-pre-wrap shadow-inner">
                        {task.practicalPart}
                      </p>
                    </div>
                  )}

                  {task.learningResources && parseLearningResources(task.learningResources).length > 0 && (
                    <div className="p-8 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-[40px] text-right">
                      <div className="flex items-center gap-4 text-blue-300 mb-6">
                         <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <i className="pi pi-book text-lg" />
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
                              className={`p-6 rounded-3xl border flex items-center justify-between transition-all cursor-pointer ${isUrl ? 'bg-black/40 border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400' : 'bg-black/40 border-white/10 text-slate-300 pointer-events-none'}`}
                            >
                               <div className="flex flex-col gap-1">
                                  <span className="font-black text-lg tracking-wide">{item.name.trim() || item.url}</span>
                                  {isUrl && <span className="text-xs opacity-50 font-mono break-all line-clamp-1">{item.url}</span>}
                               </div>
                               <i className={`pi ${isUrl ? 'pi-external-link' : 'pi-bookmark'} text-sm opacity-50`} />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {task.youtubeUrl && (
                    <div className="p-8 bg-white/5 border border-white/10 rounded-[40px] text-right">
                      <div className="flex items-center gap-4 text-rose-400 mb-6 focus-within:">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                           <i className="pi pi-youtube text-xl" />
                        </div>
                        <h4 className="text-xl font-black">المحتوى المرئي الداعم</h4>
                      </div>
                      <div className="rounded-[30px] overflow-hidden border border-white/10 bg-black shadow-2xl">
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
                         <div key={act.id} className="p-8 rounded-[40px] bg-white/5 border border-white/10 flex flex-col justify-between hover:border-indigo-500/40 transition-all group hover:bg-white/[0.07] hover:scale-[1.02]">
                            <div className="space-y-4 mb-8">
                              <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-3">
                                    <span className="text-indigo-400 font-black text-lg bg-indigo-500/10 px-3 py-1 rounded-lg"># {idx+1}</span>
                                    <h4 className={`text-2xl font-black leading-tight ${act.isCompleted ? 'text-slate-500 line-through opacity-60' : 'text-white group-hover:text-indigo-300'} transition-all`}>
                                      {act.title}
                                    </h4>
                                 </div>
                                 {act.isCompleted && (
                                   <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                     <CheckCircle2 className="w-5 h-5" />
                                   </div>
                                 )}
                              </div>
                              
                              <p className="text-slate-400 text-lg font-bold leading-relaxed line-clamp-2">{act.description}</p>

                              <div className="flex items-center gap-3">
                                 {act.isSuspended && !act.isCompleted && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl">
                                       <Zap className="w-4 h-4" />
                                       <span className="text-sm font-black tracking-wide">قيد التنفيذ 🧭</span>
                                    </div>
                                 )}
                                 
                                 {act.duration && !act.isCompleted && !act.isSuspended && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 text-slate-500 rounded-xl text-xs font-black">
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
                                     className="w-full py-5 rounded-[25px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-lg font-black transition-all cursor-pointer border border-emerald-500/20 flex items-center justify-center gap-3 group/rev"
                                   >
                                     <Sparkles className="w-6 h-6 group-hover/rev:scale-110 transition-transform" />
                                     راجع النشاط
                                   </button>
                               ) : act.isSuspended ? (
                                  <button
                                     onClick={() => handleEndActivity(act.id)}
                                     className="w-full py-5 rounded-[25px] bg-indigo-600 text-white text-lg font-black shadow-2xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all text-center flex items-center justify-center gap-3 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-6 h-6" />
                                    إنهاء وتقييم النشاط
                                  </button>
                               ) : (
                                  <button
                                     onClick={() => setSelectedActivity(act)}
                                     className="w-full py-5 rounded-[25px] bg-white/5 hover:bg-white/10 text-white text-lg font-black border border-white/10 transition-all flex items-center justify-center gap-3 group-hover:border-indigo-500/50 cursor-pointer"
                                  >
                                    <i className="pi pi-search text-sm" />
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
