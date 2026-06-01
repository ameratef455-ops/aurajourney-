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

  // Use live query to keep data in sync
  const task = useLiveQuery(() => 
    taskId ? db.tasks.get(taskId) : null
  , [taskId]);

  const reflectionsForTask = useLiveQuery(() => 
    taskId ? db.reflections.where("taskId").equals(taskId).toArray() : []
  , [taskId]);

  if (!task || !taskId) return null;

  const hasReflection = reflectionsForTask && reflectionsForTask.length > 0;

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

    if (taskJustCompleted) {
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f59e0b'] });
      toast.success("أنهيت جميع الأنشطة! حان وقت ختم المهمة وتقييمها 🏆✨");
      if (onCompleteTask) onCompleteTask(taskId);
    } else if (activityCompletedInThisTurn) {
      confetti({ zIndex: 999999999, particleCount: 80, spread: 60, origin: { y: 0.7 } });
      toast.success("أحسنت! أتممت هذا النشاط بنجاح 🔥");
    } else if (stepCompletedInThisTurn) {
      confetti({ zIndex: 999999999, particleCount: 30, spread: 40, origin: { y: 0.8 }, scalar: 0.7 });
    }

    await (db.tasks as any).update(taskId, {
      activities: updatedActivities
    });
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

    if (taskJustCompleted) {
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f59e0b'] });
      toast.success("أنهيت جميع الأنشطة! حان وقت ختم المهمة وتقييمها 🏆✨");
      if (onCompleteTask) onCompleteTask(taskId);
    } else if (activityCompletedInThisTurn) {
      confetti({ zIndex: 999999999, particleCount: 80, spread: 60, origin: { y: 0.7 } });
      toast.success("أحسنت! أتممت هذا النشاط بنجاح 🔥");
    }

    await (db.tasks as any).update(taskId, {
      activities: updatedActivities
    });
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={
        <div className="flex flex-col gap-1 pr-6" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none">تفاصيل المهمة</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{task.title}</p>
            </div>
          </div>
          {!hasReflection && task.isCompleted && (
            <button
              onClick={() => {
                vibrate(HAPITCS.MAJOR_CLICK);
                if (onOpenReflection) onOpenReflection(task);
                onHide();
              }}
              className="mr-auto ml-12 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-amber-200 border-none transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>قيم أداءك على هذه المهمة</span>
            </button>
          )}
        </div>
      }
      className="w-full max-w-3xl font-sans"
      modal
      dismissableMask
      baseZIndex={LAYERS.TASK_REVIEW + 10}
      contentClassName="p-0 bg-white"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col h-[70vh] border-t border-slate-100" 
        dir="rtl"
      >
        <ConfirmDialog />
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar: Activities */}
          <div className="w-80 border-l border-slate-100 bg-slate-50/50 flex flex-col">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">قائمة الأنشطة</h4>
                {task.isCompleted && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 scale-90">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase">مكتملة</span>
                  </div>
                )}
              </div>
              {!task.isCompleted && (
                <div className="relative group">
                  <input 
                    type="text"
                    value={newActivityTitle}
                    onChange={(e) => setNewActivityTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                    placeholder="أضف نشاطاً للمهمة..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                  />
                  <button 
                    onClick={handleAddActivity}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-all active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
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
          <div className="flex-1 overflow-y-auto bg-white p-8 md:p-12 custom-scrollbar">
            {editingActivityId ? (
              (() => {
                const act = (task.activities || []).find(a => a.id === editingActivityId);
                if (!act) return null;

                return (
                  <div className="max-w-2xl mx-auto space-y-12">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                            <Clock className="w-3 h-3" />
                            <span>{act.duration ? `${act.duration} دقيقة لكل جلسة` : 'نشاط تنفيذي'}</span>
                          </div>
                          {task.isCompleted && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200">
                              <Lock className="w-3 h-3" />
                              <span>المهمة مكتملة - عرض فقط</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{act.title}</h3>
                      </div>
                      {!task.isCompleted && (
                        <button 
                          onClick={() => handleDeleteActivity(act.id)}
                          className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center"
                          title="حذف النشاط"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
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
                                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[28px] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
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
                                  className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl group hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
                                >
                                  <div className="flex items-center gap-5">
                                    <button 
                                      onClick={() => toggleStep(act.id, step.id)}
                                      disabled={task.isCompleted}
                                      className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'cursor-not-allowed opacity-60' : ''} ${step.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-slate-200 bg-white hover:border-indigo-400'}`}
                                    >
                                      {step.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                    <span className={`text-base font-bold ${step.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
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
                                <div className="text-center py-16 px-10 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
                                  <Sparkles className="w-10 h-10 text-indigo-200 mx-auto mb-4" />
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
                              className={`w-full h-80 p-8 border border-slate-200 rounded-[40px] text-base font-bold text-slate-700 leading-relaxed focus:outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all resize-none shadow-inner ${task.isCompleted ? 'bg-slate-50/30 cursor-not-allowed' : 'bg-slate-50'}`}
                           />
                           {!task.isCompleted && (
                             <div className="flex items-center gap-2 text-indigo-400 px-4 bg-indigo-50/50 py-3 rounded-2xl self-start">
                               <Info className="w-4 h-4" />
                               <span className="text-[10px] font-black uppercase tracking-[0.2em]">يتم الحفظ التلقائي عند الخروج من الحقل</span>
                             </div>
                           )}
                        </div>
                      </TabPanel>
                    </TabView>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center text-indigo-200 mb-10 relative mt-16">
                   <div className="absolute inset-0 bg-indigo-100/30 rounded-[48px] animate-ping" />
                   <Sparkles className="w-14 h-14 relative z-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">هندسة الأنشطة</h3>
                <p className="text-base font-bold text-slate-500 leading-relaxed mb-12">
                  حول كل مهمة كبيرة لتسلسل من الأنشطة والخطوات الفرعية لتصل لمستوى احتراف فائق في رحلتك.
                </p>
                {!task.isCompleted && (
                  <button 
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#4f46e5', '#10b981', '#f59e0b'] });
                      toast.success("تم إنهاء المهمة! حان وقت التقييم 🏆✨");
                      if (onCompleteTask) onCompleteTask(taskId as string);
                    }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> إنهاء المهمة مباشرة
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
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
  );
}

