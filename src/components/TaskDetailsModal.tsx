import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useLiveQuery } from 'dexie-react-hooks';
import confetti from 'canvas-confetti';
import { 
  Info, 
  ListTodo, 
  AlignLeft, 
  Plus, 
  Trash2, 
  CheckCircle2,
  ChevronRight,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { TaskActivity, db, Task } from '../db';
import { LanguageTools, YouGlishWidget } from './LanguageTools';
import { parseLearningResources } from '../types';
import { safeRandomUUID } from '../lib/uuid';
import { LAYERS } from '../constants/layers';
import { vibrate, HAPITCS } from '../lib/haptics';
import { toast } from 'react-hot-toast';

interface TaskDetailsModalProps {
  visible: boolean;
  onHide: () => void;
  taskId: string | null;
  onCompleteTask?: (taskId: string) => void;
  onOpenReflection?: (task: Task) => void;
}

export function TaskDetailsModal({ visible, onHide, taskId, onCompleteTask, onOpenReflection }: TaskDetailsModalProps) {
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const stepInputRef = useRef<HTMLInputElement>(null);

  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  const [selectedForPostpone, setSelectedForPostpone] = useState<string[]>([]);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  React.useEffect(() => {
    if (visible && taskId) {
      setIsTaskLoading(true);
      const timer = setTimeout(() => {
        setIsTaskLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [taskId, visible]);

  // Use live query to keep data in sync
  const task = useLiveQuery(() => 
    taskId ? db.tasks.get(taskId) : null
  , [taskId]);

  const reflectionsForTask = useLiveQuery(() => 
    taskId ? db.reflections.where("taskId").equals(taskId).toArray() : []
  , [taskId]);

  const station = useLiveQuery(() => 
    task?.stationId ? db.stations.get(task.stationId) : null
  , [task?.stationId]);

  const settings = useLiveQuery(() => db.userSettings.toArray());
  const user = settings?.[0];
  const isLanguageLearning = user?.learningGoal?.includes('لغ');

  if (!visible || !taskId) return null;

  const hasReflection = reflectionsForTask && reflectionsForTask.length > 0;

  const getNextDateForDayOfWeek = (dayIndex: number) => {
    const resultDate = new Date();
    const currentDayIndex = resultDate.getDay();
    let daysToAdd = (dayIndex - currentDayIndex + 7) % 7;
    if (daysToAdd === 0) {
      daysToAdd = 7;
    }
    resultDate.setDate(resultDate.getDate() + daysToAdd);
    const yyyy = resultDate.getFullYear();
    const mm = String(resultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(resultDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handlePostponeAction = async (targetDateString: string, dayLabel: string) => {
    try {
      vibrate(HAPITCS.MAJOR_CLICK);
      const activitiesToMove = (task.activities || []).filter(act => selectedForPostpone.includes(act.id));
      const remainingActivities = (task.activities || []).filter(act => !selectedForPostpone.includes(act.id));

      if (activitiesToMove.length === 0) {
        toast.error("يرجى اختيار نشاط واحد على الأقل للتأجيل!");
        return;
      }

      if (remainingActivities.length === 0) {
        // Move the entire task
        await (db.tasks as any).update(taskId, {
          dueDate: targetDateString,
          isRestDayTask: true
        });
        toast.success(`تم تأجيل المهمة بالكامل ليوم (${dayLabel}) الموافق ${targetDateString}! 🗓️`);
      } else {
        // Move selected activities to a new rest-day task
        const newTask = {
          ...task,
          id: safeRandomUUID(),
          dueDate: targetDateString,
          isRestDayTask: true,
          activities: activitiesToMove,
          isCompleted: false
        };
        await (db.tasks as any).add(newTask);
        await (db.tasks as any).update(taskId, {
          activities: remainingActivities,
          isCompleted: remainingActivities.length > 0 && remainingActivities.every(a => a.isCompleted)
        });
        toast.success(`تم نقل الأنشطة المحددة بنجاح ليوم إجازتك (${dayLabel}) الموافق ${targetDateString}! 🗓️`);
      }

      confetti({ zIndex: 999999999, particleCount: 85, spread: 55, origin: { y: 0.7 } });
      setShowPostponeDialog(false);
      onHide();
    } catch (err) {
      console.error('Failed to postpone activities:', err);
      toast.error("حدث خطأ أثناء التأجيل");
    }
  };

  const handleAddActivity = async () => {
    if (!newActivityTitle.trim() || task.isCompleted) return;
    vibrate(HAPITCS.MAJOR_CLICK);

    const newActivity: TaskActivity = {
      id: safeRandomUUID(),
      title: newActivityTitle.trim(),
      isCompleted: false,
      description: "",
      steps: []
    };

    const currentActivities = task.activities || [];
    await (db.tasks as any).update(taskId, {
      activities: [...currentActivities, newActivity]
    });

    setNewActivityTitle("");
    toast.success("تم إضافة النشاط بنجاح! ✨");
  };

  const handleUpdateActivity = async (activityId: string, updates: Partial<TaskActivity>) => {
    if (task.isCompleted) return;
    const currentActivities = task.activities || [];
    const updatedActivities = currentActivities.map(act => 
      act.id === activityId ? { ...act, ...updates } : act
    );

    await (db.tasks as any).update(taskId, {
      activities: updatedActivities
    });
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (task.isCompleted) return;
    
    confirmDialog({
      message: 'هل أنت متأكد من حذف هذا النشاط؟',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      className: 'rtl-dialog',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        vibrate(HAPITCS.MAJOR_CLICK);
        const updatedActivities = (task.activities || []).filter(act => act.id !== activityId);
        
        // Re-calculate task completion if activities change
        const allCompleted = updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted);

        await (db.tasks as any).update(taskId, {
          activities: updatedActivities,
          isCompleted: allCompleted
        });
        setEditingActivityId(null);
        toast.success("تم حذف النشاط");
      }
    });
  };

  const handleAddStepWithVal = async (activityId: string) => {
    if (!stepInputRef.current || task.isCompleted) return;
    const title = stepInputRef.current.value;
    if (!title.trim()) return;

    vibrate(HAPITCS.MAJOR_CLICK);
    const currentActivities = task.activities || [];
    const updatedActivities = currentActivities.map(act => {
      if (act.id === activityId) {
        const steps = act.steps || [];
        const newSteps = [...steps, { id: safeRandomUUID(), title: title.trim(), isCompleted: false }];
        // If adding a new step, un-complete the activity and task
        return {
          ...act,
          steps: newSteps,
          isCompleted: false
        };
      }
      return act;
    });

    await (db.tasks as any).update(taskId, {
      activities: updatedActivities,
      isCompleted: false
    });
    stepInputRef.current.value = "";
  };

  const toggleActivityComplete = async (activityId: string) => {
    if (task.isCompleted) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    const currentActivities = task.activities || [];
    let activityCompletedInThisTurn = false;

    const updatedActivities = currentActivities.map(act => {
      if (act.id === activityId) {
        const newStatus = !act.isCompleted;
        if (newStatus) activityCompletedInThisTurn = true;
        // Optionally update steps too
        const updatedSteps = (act.steps || []).map(s => ({ ...s, isCompleted: newStatus }));
        return { ...act, isCompleted: newStatus, steps: updatedSteps };
      }
      return act;
    });

    const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted);
    const taskJustCompleted = allActivitiesCompleted && !task.isCompleted;
    const taskUndone = !allActivitiesCompleted && task.isCompleted;

    await (db.tasks as any).update(taskId, {
      activities: updatedActivities,
      isCompleted: allActivitiesCompleted
    });

    if (taskJustCompleted) {
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f59e0b'] });
      toast.success("أنهيت جميع الأنشطة! حان وقت ختم المهمة وتقييمها 🏆✨");
      if (onCompleteTask) onCompleteTask(taskId);
      if (onOpenReflection) onOpenReflection(task);
    } else if (taskUndone) {
      await db.reflections.where("taskId").equals(taskId).delete();
      toast("تم التراجع عن إكمال المهمة وتصفير سجل التقييم.", { icon: "🧹" });
    } else if (activityCompletedInThisTurn) {
      confetti({ zIndex: 999999999, particleCount: 80, spread: 60, origin: { y: 0.7 } });
      toast.success("أحسنت! أتممت هذا النشاط بنجاح 🔥");
    }
  };

  const toggleStep = async (activityId: string, stepId: string) => {
    if (task.isCompleted) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    const currentActivities = task.activities || [];
    let activityCompletedInThisTurn = false;
    let stepCompletedInThisTurn = false;

    const updatedActivities = currentActivities.map(act => {
      if (act.id === activityId) {
        const steps = (act.steps || []).map(s => 
          s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s
        );
        
        const stepJustFinished = steps.find(s => s.id === stepId)?.isCompleted;
        if (stepJustFinished) stepCompletedInThisTurn = true;

        // Auto-complete activity if all steps are completed
        const allStepsCompleted = steps.length > 0 && steps.every(s => s.isCompleted);
        if (allStepsCompleted && !act.isCompleted) {
          activityCompletedInThisTurn = true;
        }
        
        return { ...act, steps, isCompleted: allStepsCompleted };
      }
      return act;
    });

    // Check if ALL activities in the updated set are completed
    const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted);
    const taskJustCompleted = allActivitiesCompleted && !task.isCompleted;
    const taskUndone = !allActivitiesCompleted && task.isCompleted;

    await (db.tasks as any).update(taskId, {
      activities: updatedActivities,
      isCompleted: allActivitiesCompleted
    });

    if (taskJustCompleted) {
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f59e0b'] });
      toast.success("أنهيت جميع الأنشطة! حان وقت ختم المهمة وتقييمها 🏆✨");
      if (onCompleteTask) onCompleteTask(taskId);
      if (onOpenReflection) onOpenReflection(task);
    } else if (taskUndone) {
      await db.reflections.where("taskId").equals(taskId).delete();
      toast("تم التراجع عن إكمال المهمة وتصفير سجل التقييم.", { icon: "🧹" });
    } else if (activityCompletedInThisTurn) {
      confetti({ zIndex: 999999999, particleCount: 80, spread: 60, origin: { y: 0.7 } });
      toast.success("أحسنت! أتممت هذا النشاط بنجاح 🔥");
    } else if (stepCompletedInThisTurn) {
      confetti({ zIndex: 999999999, particleCount: 30, spread: 40, origin: { y: 0.8 }, scalar: 0.7 });
    }
  };

  const removeStep = async (activityId: string, stepId: string) => {
    if (task.isCompleted) return;
    const currentActivities = task.activities || [];
    let activityCompletedInThisTurn = false;

    const updatedActivities = currentActivities.map(act => {
      if (act.id === activityId) {
        const steps = (act.steps || []).filter(s => s.id !== stepId);
        const allStepsCompleted = steps.length > 0 && steps.every(s => s.isCompleted);
        if (allStepsCompleted && !act.isCompleted) {
          activityCompletedInThisTurn = true;
        }
        return { ...act, steps, isCompleted: allStepsCompleted };
      }
      return act;
    });

    const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted);
    const taskJustCompleted = allActivitiesCompleted && !task.isCompleted;
    const taskUndone = !allActivitiesCompleted && task.isCompleted;

    await (db.tasks as any).update(taskId, {
      activities: updatedActivities,
      isCompleted: allActivitiesCompleted
    });

    if (taskJustCompleted) {
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f59e0b'] });
      toast.success("أنهيت جميع الأنشطة! حان وقت ختم المهمة وتقييمها 🏆✨");
      if (onCompleteTask) onCompleteTask(taskId);
      if (onOpenReflection) onOpenReflection(task);
    } else if (taskUndone) {
      await db.reflections.where("taskId").equals(taskId).delete();
      toast("تم التراجع عن إكمال المهمة وتصفير سجل التقييم.", { icon: "🧹" });
    } else if (activityCompletedInThisTurn) {
      confetti({ zIndex: 999999999, particleCount: 80, spread: 60, origin: { y: 0.7 } });
      toast.success("أحسنت! أتممت هذا النشاط بنجاح 🔥");
    }
  };

  return (
    <>
      <Dialog
        maximized
        visible={visible}
        onHide={onHide}
        transitionOptions={{ timeout: 400 }}
        header={
          <div className="flex justify-between items-center w-full pr-6 pl-6" dir="rtl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm border border-indigo-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white leading-none">تفاصيل المهمة</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest truncate max-w-[200px]">
                  {task ? task.title : 'جاري التحميل...'}
                </p>
              </div>
            </div>
            {task && !isTaskLoading && (
              <div className="flex items-center gap-2.5">
                {!task.isCompleted && (task.activities || []).length > 0 && (
                  <button
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setSelectedForPostpone((task.activities || []).filter(a => !a.isCompleted).map(a => a.id));
                      setShowPostponeDialog(true);
                    }}
                    className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl text-xs font-black shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer"
                    type="button"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>أجل الأنشطة 🗓️</span>
                  </button>
                )}
                {!hasReflection && task.isCompleted && (
                  <button
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      if (onOpenReflection) onOpenReflection(task);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-[11px] font-black shadow-xl shadow-amber-500/20 border-none transition-all flex items-center gap-2 cursor-pointer animate-bounce mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>قيم المهمة الآن ✨</span>
                  </button>
                )}
              </div>
            )}
          </div>
        }
        className="w-full font-sans m-0 p-0 rounded-none border-none"
        style={{ width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none', borderRadius: 0, margin: 0 }}
        modal
        dismissableMask
        baseZIndex={LAYERS.TASK_REVIEW + 10}
        contentClassName="p-0 bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950 text-white overflow-hidden"
        headerClassName="bg-[#020617] border-b border-white/5"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.99, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col h-full overflow-hidden" 
          dir="rtl"
        >
          <ConfirmDialog />
          {isTaskLoading || !task ? (
            <div className="flex-1 flex overflow-hidden p-8 animate-pulse bg-gradient-to-br from-[#0A0F2C]/5 to-[#2D52CC]/5" dir="rtl">
              {/* Sidebar Skeleton */}
              <div className="w-80 border-l border-indigo-950/5 pr-4 pl-8 py-4 space-y-6 shrink-0 hidden md:block" style={{ borderLeftWidth: '1px' }}>
                <div className="h-4 bg-indigo-950/10 rounded-md w-1/2"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="h-14 bg-indigo-950/5 rounded-2xl w-full border border-indigo-950/5 p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3 w-3/4">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-950/10 shrink-0"></div>
                        <div className="h-3 bg-indigo-950/10 rounded-md w-3/4"></div>
                      </div>
                      <div className="w-4 h-4 rounded-full bg-indigo-950/5 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Main Content Skeleton */}
              <div className="flex-1 p-8 md:p-12 space-y-8 overflow-y-auto">
                <div className="p-6 bg-indigo-950/5 border border-indigo-950/5 rounded-3xl space-y-4">
                  <div className="h-3 bg-indigo-950/10 rounded-md w-12 animate-pulse"></div>
                  <div className="h-6 bg-gradient-to-r from-[#0a0f2c]/10 to-[#2d52cc]/10 rounded-lg w-2/3 animate-pulse"></div>
                  <div className="h-3 bg-indigo-950/10 rounded-md w-1/3 animate-pulse"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-indigo-950/10 rounded-md w-1/4 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-indigo-950/5 rounded-md w-full animate-pulse"></div>
                    <div className="h-3 bg-indigo-950/5 rounded-md w-[95%] animate-pulse"></div>
                    <div className="h-3 bg-indigo-950/5 rounded-md w-[80%] animate-pulse"></div>
                  </div>
                </div>
                <div className="h-[200px] bg-[#0A0F2C]/5 rounded-[32px] flex items-center justify-center p-8 border border-[#2D52CC]/10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0a0f2c]/10 to-[#2d52cc]/10 flex items-center justify-center animate-spin">
                       <i className="pi pi-spinner text-indigo-600 text-lg"></i>
                    </div>
                    <span className="text-xs font-bold text-indigo-950/60 leading-relaxed">جاري تزامن وتوريث خطوات السعي والأنشطة الإجرائية...</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
          {/* Sidebar: Activities */}
          <div className="w-80 border-l border-white/10 bg-[#020617] flex flex-col">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">قائمة الأنشطة</h4>
                {task.isCompleted && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 scale-90">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase">مكتملة</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {(task.activities || []).map(act => (
                <button
                  key={act.id}
                  onClick={() => {
                    vibrate(HAPITCS.GUIDANCE);
                    setEditingActivityId(act.id);
                  }}
                  className={`w-full text-right p-4 rounded-2xl transition-all flex items-center justify-between group border
                    ${editingActivityId === act.id 
                      ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-100' 
                      : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 text-slate-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full transition-all ${act.isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : (editingActivityId === act.id ? 'bg-indigo-400' : 'bg-slate-300')}`} />
                    <span className={`font-bold text-sm truncate max-w-[140px] ${editingActivityId === act.id ? 'text-indigo-900' : ''}`}>
                      {act.title}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all ${editingActivityId === act.id ? 'text-indigo-600 translate-x-0' : 'opacity-0 translate-x-2'}`} />
                </button>
              ))}

              {(task.activities || []).length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center mt-6">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-4 shadow-sm border border-slate-100">
                    <ListTodo className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                    ابدأ بوضع محطات<br/>عملية لمهمتك
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-transparent p-8 md:p-12 custom-scrollbar">
            {editingActivityId ? (
              (() => {
                const act = (task.activities || []).find(a => a.id === editingActivityId);
                if (!act) return null;

                return (
                  <div className="max-w-2xl mx-auto space-y-12">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30">
                            <Clock className="w-3 h-3" />
                            <span>{act.duration ? `${act.duration} دقيقة لكل جلسة` : 'نشاط تنفيذي'}</span>
                          </div>
                          {task.isCompleted && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10">
                              <Lock className="w-3 h-3" />
                              <span>المهمة مكتملة - عرض فقط</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-4xl font-black text-white leading-tight tracking-tight">{act.title}</h3>
                        {act.description && (
                          <p className="text-slate-300 text-sm leading-relaxed mt-4">
                            {act.description}
                          </p>
                        )}
                        {act.guidance && (
                          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mt-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
                            <div className="flex items-start gap-3">
                              <i className="pi pi-compass text-indigo-400 text-lg mt-0.5 shrink-0" />
                              <div>
                                <h5 className="text-[11px] font-black text-indigo-200 uppercase tracking-widest mb-1 opacity-80">توجيه النشاط</h5>
                                <p className="text-indigo-100/90 text-sm font-medium leading-relaxed">
                                  {act.guidance}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                      {!task.isCompleted && (
                        <button 
                          onClick={() => toggleActivityComplete(act.id)}
                          className={`w-12 h-12 rounded-2xl transition-all flex items-center justify-center ${act.isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-slate-600' : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'}`}
                          title={act.isCompleted ? "التراجع عن الإكمال" : "إكمال النشاط"}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      {!task.isCompleted && (
                        <button 
                          onClick={() => handleDeleteActivity(act.id)}
                          className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center"
                          title="حذف النشاط"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      </div>
                    </div>

                    <TabView className="custom-task-tabs">
                      <TabPanel header={
                        <div className="flex items-center gap-2 py-1">
                          <ListTodo className="w-4 h-4" />
                          <span>الخطوات</span>
                        </div>
                      }>
                        <div className="py-8 space-y-8">
                           {!task.isCompleted && (
                             <div className="relative">
                                <input 
                                  ref={stepInputRef}
                                  type="text"
                                  placeholder="صف الخطوة القادمة..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddStepWithVal(act.id);
                                    }
                                  }}
                                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[28px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-white placeholder:text-slate-500"
                                />
                                <button 
                                  onClick={() => handleAddStepWithVal(act.id)}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center transition-all hover:bg-slate-900 shadow-lg active:scale-90"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                             </div>
                           )}

                           <div className="space-y-4">
                              {(act.steps || []).map(step => (
                                <div 
                                  key={step.id}
                                  className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl group hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                                >
                                  <div className="flex items-center gap-5">
                                    <button 
                                      onClick={() => toggleStep(act.id, step.id)}
                                      disabled={task.isCompleted}
                                      className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'cursor-not-allowed opacity-60' : ''} ${step.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-white/20 bg-transparent hover:border-indigo-400'}`}
                                    >
                                      {step.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                    <span className={`text-base font-bold ${step.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                      {step.title}
                                    </span>
                                  </div>
                                  {!task.isCompleted && (
                                    <button 
                                      onClick={() => removeStep(act.id, step.id)}
                                      className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              
                              {(act.steps || []).length === 0 && (
                                <div className="text-center py-16 px-10 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                                  <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">قسم النشاط لخطوات صغيرة لضمان سهولة الإنجاز</p>
                                </div>
                              )}
                           </div>
                        </div>
                      </TabPanel>

                      <TabPanel header={
                        <div className="flex items-center gap-2 py-1">
                          <AlignLeft className="w-4 h-4" />
                          <span>التوجيه</span>
                        </div>
                      }>
                        <div className="py-8 space-y-6">
                           <textarea 
                              defaultValue={act.description || ""}
                              onBlur={(e) => handleUpdateActivity(act.id, { description: e.target.value })}
                              readOnly={task.isCompleted}
                              placeholder={task.isCompleted ? "لا يوجد وصف لهذا النشاط" : "ما هي الملاحظات أو المصادر الهامة لهذا النشاط؟"}
                              className={`w-full h-80 p-8 border border-white/10 rounded-[40px] text-base font-bold leading-relaxed focus:outline-none focus:ring-8 focus:ring-indigo-500/10 focus:bg-white/10 transition-all resize-none shadow-inner placeholder:text-slate-500 ${task.isCompleted ? 'bg-white/5 cursor-not-allowed text-slate-400' : 'bg-white/5 text-white'}`}
                           />
                           {!task.isCompleted && (
                             <div className="flex items-center gap-2 text-indigo-300 px-4 bg-indigo-500/20 py-3 rounded-2xl self-start">
                               <Info className="w-4 h-4" />
                               <span className="text-[10px] font-black uppercase tracking-[0.2em]">يتم الحفظ التلقائي عند الخروج من الحقل</span>
                             </div>
                           )}
                        </div>
                      </TabPanel>

                      <TabPanel header={
                        <div className="flex items-center gap-2 py-1">
                          <i className="pi pi-info-circle w-4 h-4" />
                          <span>ملاحظات الموجه</span>
                        </div>
                      }>
                        <div className="py-8">
                           <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 min-h-[200px]">
                             <h4 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                                  <i className="pi pi-info-circle" />
                               </div>
                               ملاحظات الموجه العامة للمحطة
                             </h4>
                             {station?.generalNotes ? (
                               <p className="text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                                 {station.generalNotes}
                               </p>
                             ) : (
                               <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                  <i className="pi pi-inbox text-4xl mb-2" />
                                  <p className="font-bold">لا توجد ملاحظات موجه لهذه المحطة</p>
                               </div>
                             )}
                           </div>
                        </div>
                      </TabPanel>
                    </TabView>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col justify-between max-w-2xl mx-auto py-4 font-sans animate-fade-in" dir="rtl">
                <div className="space-y-6">
                  {/* Task Header & Title Info */}
                  <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2 mt-4 text-right">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md">مضمون المهمة</span>
                    <h3 className="text-2xl font-black text-white">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">{task.description}</p>
                    )}
                  </div>

                  {/* Practical Part (الجزء التطبيقي) */}
                  {task.practicalPart && (
                    <div className="p-5 bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/35 rounded-3xl space-y-2 text-right shadow-md animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <i className="pi pi-briefcase text-xs shrink-0 text-emerald-400" />
                        <h4 className="text-xs font-black">🛠️ الجزء التطبيقي الفعلي للمهمة:</h4>
                      </div>
                      <p className="text-xs font-bold text-emerald-50 bg-white/5 border border-white/5 p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap shadow-3xs">
                        {task.practicalPart}
                      </p>
                    </div>
                  )}

                  {/* 1. Pre-Task Start Message (رسالة قبل بدء المهمة) */}
                  {task.startMessage && (
                    <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-3xl space-y-2 text-right shadow-3xs animate-fade-in">
                      <div className="flex items-center gap-2 text-indigo-300">
                        <Sparkles className="w-4 h-4 animate-pulse shrink-0" />
                        <h4 className="text-xs font-black">📢 رسالة انطلاق وتوجيه قبل البدء:</h4>
                      </div>
                      <p className="text-xs font-bold text-white bg-white/5 border border-white/5 p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap shadow-3xs">
                        {task.startMessage}
                      </p>
                    </div>
                  )}

                  {/* 2. Learning Resources (مصادر التعلم المخصصة للمهمة) */}
                  {task.learningResources && parseLearningResources(task.learningResources).length > 0 ? (
                    <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-3xl space-y-3 text-right shadow-3xs animate-fade-in">
                      <div className="flex items-center gap-2 text-blue-300">
                        <i className="pi pi-book text-xs shrink-0" />
                        <h4 className="text-xs font-black">📚 مصادر ومراجع التعلم المقترحة:</h4>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {(() => {
                          const items = parseLearningResources(task.learningResources);
                          return items.map((item) => {
                            const isUrl = item.url.startsWith('http://') || item.url.startsWith('https://');
                            const displayName = item.name.trim() || item.url;
                            return (
                              <a 
                                key={item.id}
                                href={isUrl ? item.url : undefined}
                                target={isUrl ? "_blank" : undefined}
                                rel="noopener noreferrer"
                                className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all
                                  ${isUrl 
                                    ? 'bg-white/5 border-blue-500/30 text-blue-300 hover:bg-white/10 hover:border-blue-400 hover:scale-105 active:scale-95 shadow-3xs' 
                                    : 'bg-white/5 border-white/10 text-slate-300'
                                  }`}
                              >
                                <i className={`pi ${isUrl ? 'pi-external-link' : 'pi-bookmark'} text-[10px]`}></i>
                                <span>{displayName}</span>
                              </a>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : null}

                  {/* YouTube Embedded Video for the Task */}
                  {task.youtubeUrl && (
                    <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-3 shadow-3xs animate-fade-in">
                      <div className="flex items-center gap-2 text-rose-400">
                        <i className="pi pi-youtube text-lg shrink-0" />
                        <h4 className="text-xs font-black">فيديو داعم للمهمة:</h4>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-white/10">
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
                               // fail silently on bad url, we will just use the string if it's already an ID
                               videoId = task.youtubeUrl.length === 11 ? task.youtubeUrl : '';
                            }
                            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : task.youtubeUrl;
                            
                            return (
                               <iframe 
                                 width="100%" 
                                 height="250" 
                                 src={embedUrl}
                                 title="YouTube video player" 
                                 frameBorder="0" 
                                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                 allowFullScreen
                                 className="w-full"
                               ></iframe>
                            );
                         })()}
                      </div>
                    </div>
                  )}

                  {/* Google Drive Embedded */}
                  {task.googleDriveUrl && (
                    <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-3 shadow-3xs animate-fade-in">
                      <div className="flex items-center gap-2 text-blue-400">
                        <i className="pi pi-google border p-0.5 rounded text-[10px] shrink-0" />
                        <h4 className="text-xs font-black">جوجل درايف داعم للمهمة:</h4>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-white/10 h-[400px]">
                         {(() => {
                            let embedUrl = task.googleDriveUrl;
                            if (embedUrl.includes('/view')) {
                              embedUrl = embedUrl.replace(/\/view.*$/, '/preview');
                            } else if (embedUrl.includes('/edit')) {
                              embedUrl = embedUrl.replace(/\/edit.*$/, '/preview');
                            }
                            return (
                               <iframe 
                                 width="100%" 
                                 height="100%" 
                                 src={embedUrl}
                                 title="Google Drive Document" 
                                 frameBorder="0" 
                                 allowFullScreen
                                 className="w-full h-full"
                               ></iframe>
                            );
                         })()}
                      </div>
                    </div>
                  )}

                  {/* Language Tools for Foreign Language Learning Journeys */}
                  {isLanguageLearning && (
                     <div className="space-y-4">
                        <LanguageTools />
                        
                        <div className="p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-3xl space-y-3 text-right shadow-3xs animate-fade-in animate-none">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-200">
                              <span className="text-base shrink-0">🌐</span>
                              <h4 className="text-xs font-black">تدريب النطق والاستماع (YouGlish):</h4>
                            </div>
                            <a 
                              href={`https://youglish.com/pronounce/${encodeURIComponent(task.youglishKeyword || task.title || '')}/english`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
                            >
                              <i className="pi pi-external-link text-[10px]"></i>
                              <span>زيارة موقع YouGlish</span>
                            </a>
                          </div>
                          
                          <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 p-3 pt-4 flex flex-col items-center">
                            <p className="text-xs text-slate-500 font-bold mb-3 text-center">
                              تدرب على نطق الكلمة المخصصة: <span className="text-indigo-600 font-extrabold">{task.youglishKeyword || task.title}</span>
                            </p>
                            <YouGlishWidget query={task.youglishKeyword || task.title || ""} />
                          </div>
                        </div>
                     </div>
                  )}

                  {/* 3. Post-Task Completed Message (رسالة نهاية بعد انتهاء المهمة) */}
                  {task.endMessage && task.isCompleted && (
                    <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/30 border border-emerald-100/50 rounded-3xl space-y-2 text-right shadow-3xs animate-fade-in">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <i className="pi pi-verified text-xs shrink-0" />
                        <h4 className="text-xs font-black">🏆 رسالة الإنجاز والدعم بعد الختام:</h4>
                      </div>
                      <p className="text-xs font-black text-emerald-950 bg-white/95 p-3.5 rounded-xl leading-relaxed whitespace-pre-wrap shadow-3xs">
                        {task.endMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Guide hint */}
                <div className="text-center p-5 border border-dashed border-white/10 rounded-2xl bg-white/5 mt-auto">
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                    💡 اختر أحد الأنشطة العملية من الجدول الجانبي للبدء في تقسيمها، إدارتها، وتدوين إنجازاتك.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>

      <style>{`
        .custom-task-tabs .p-tabview-nav {
          border-bottom: 2px solid #f1f5f9;
          gap: 3rem;
          padding-bottom: 2px;
          display: flex;
          justify-content: center;
        }
        .custom-task-tabs .p-tabview-nav li .p-tabview-nav-link {
          background: transparent;
          border: none;
          padding: 1rem 0;
          color: #94a3b8;
          font-weight: 900;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: none !important;
        }
        .custom-task-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          color: #4f46e5;
          border-bottom: 4px solid #4f46e5;
        }
        .custom-task-tabs .p-tabview-panels {
          padding: 0;
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </Dialog>

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
        
        {/* Title */}
        <h3 className="text-base font-black text-white mb-2">
          ترحيل وتأجيل الأنشطة 🗓️
        </h3>
        
        {/* Description */}
        <p className="text-xs font-semibold text-slate-400 leading-relaxed mb-4 px-1">
          حدد بذكاء الأنشطة التي تود ترحيلها ليوم إجازتك، لتخفف الضغط وتكمل دراستك بطاقة متوازنة.
        </p>

        {/* Activities list to select */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto mb-6 text-right custom-scrollbar border border-white/10 p-2 rounded-xl bg-white/5">
          {(task.activities || []).map(act => {
            const isSelected = selectedForPostpone.includes(act.id);
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => {
                  vibrate(HAPITCS.GUIDANCE);
                  if (isSelected) {
                    setSelectedForPostpone(selectedForPostpone.filter(id => id !== act.id));
                  } else {
                    setSelectedForPostpone([...selectedForPostpone, act.id]);
                  }
                }}
                className={`w-full text-right p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer text-xs font-bold
                  ${isSelected
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/5 border-transparent text-slate-300 hover:border-white/20'}`}
              >
                <span>{act.title}</span>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
                  ${isSelected ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-500 bg-transparent'}`}>
                  {isSelected && <i className="pi pi-check text-[9px] font-black" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Learning Days Selection */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-black text-slate-300 text-right pr-1">اختار يوم الإجازة اللي يريحك ترحل ليه:</h4>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const learningDaysRefs = user?.learningDays || [];
              const fullWeekDays = [0, 1, 2, 3, 4, 5, 6];
              const restDayIndices = fullWeekDays.filter(dayNum => !learningDaysRefs.includes(dayNum));
              const finalRestDaysList = restDayIndices.length > 0 ? restDayIndices : [5, 6];
              const dayNameMapping: Record<number, string> = {
                0: "الأحد",
                1: "الإثنين",
                2: "الثلاثاء",
                3: "الأربعاء",
                4: "الخميس",
                5: "الجمعة",
                6: "السبت"
              };
              return finalRestDaysList.map(dayNum => {
                const dayLabel = dayNameMapping[dayNum] || `يوم ${dayNum}`;
                const targetDateString = getNextDateForDayOfWeek(dayNum);
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handlePostponeAction(targetDateString, dayLabel)}
                    className="py-2.5 px-2 bg-indigo-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 text-indigo-300 text-xs font-extrabold rounded-lg border border-indigo-500/30 transition-all text-center cursor-pointer shadow-3xs active:scale-95"
                  >
                    {dayLabel} ({targetDateString})
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => setShowPostponeDialog(false)}
          className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-extrabold text-xs rounded-xl shadow-xs border border-white/10 transition-all active:scale-[0.98] cursor-pointer"
        >
          تراجع وإلغاء
        </button>
      </div>
    </Dialog>
    </>
  );
}

