import { Sidebar } from "primereact/sidebar";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { useState, useRef, useEffect } from "react";
import confetti from 'canvas-confetti';
import { ListChecks, Target, Trophy, Clock, Plus, Trash2, ChevronRight, ChevronDown, CheckCircle2, Circle, Edit2, MoreVertical, Info, Briefcase, Sparkles } from "lucide-react";
import { LAYERS } from "../constants/layers";
import { db, TaskActivity } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { format, getDay } from "date-fns";
import { ar } from "date-fns/locale";
import { safeRandomUUID } from "../lib/uuid";
import { TaskReflectionModal } from "./TaskReflectionModal";
import { toast as toastHot } from "react-hot-toast";
import { vibrate, HAPITCS } from "../lib/haptics";

export interface EvaluationSidebarProps {
  visible: boolean;
  onHide: () => void;
  stations: any[];
  mainTasks: any[];
  sideTasks: any[];
  subTasks: any[];
  practicalTasks?: any[];
  practicalSubStations?: Record<string, any[]>;
  onRewardActivity?: (isCompleted: boolean, activity?: any) => void;
  onCompleteTask?: (task: any) => void;
  onCompletePracticalTask?: (stationId: string, subStationIndex: number, taskId: string) => void;
  completeTaskAction?: (task: any, onComplete?: (taskId: string) => void) => Promise<any>;
  initialSelectedTask?: any;
  onOpenVisSession?: (task: any) => void;
}

export function EvaluationSidebar({
  visible,
  onHide,
  stations = [],
  mainTasks,
  sideTasks,
  subTasks = [],
  practicalTasks = [],
  practicalSubStations = {},
  onRewardActivity,
  onCompleteTask,
  onCompletePracticalTask,
  completeTaskAction,
  initialSelectedTask,
  onOpenVisSession
}: EvaluationSidebarProps) {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const settings = useLiveQuery(() => db.userSettings.toArray());
  const user = settings?.[0];

  const [isPostponeMode, setIsPostponeMode] = useState(false);
  const [selectedForPostpone, setSelectedForPostpone] = useState<string[]>([]);
  const [showRestDayDialog, setShowRestDayDialog] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<TaskActivity | null>(null);
  const [pendingParentId, setPendingParentId] = useState<string | undefined>(undefined);
  const [isPostponingSelected, setIsPostponingSelected] = useState(false);
  const [isPostponingEntireTask, setIsPostponingEntireTask] = useState(false);

  const handleDelayToDate = async (targetDateString: string, dayLabel: string) => {
    if (isPostponingEntireTask) {
      try {
        if (selectedTask._source === 'dexie') {
          await (db.tasks as any).update(selectedTask.id, {
            dueDate: targetDateString,
            isRestDayTask: true
          });
        }
        toast.current?.show({
          severity: "success",
          summary: "تأجيل المهمة 🗓️✨",
          detail: `أجلنالك المهمة كلها ليوم (${dayLabel}) الموافق ${targetDateString}!`,
          life: 5000
        });
        confetti({ particleCount: 80, spread: 50, origin: { y: 0.7 } });
      } catch (err) {
        console.error('Failed to move task:', err);
      }
    } else if (isPostponingSelected) {
      try {
        const activitiesToMove = selectedTask.activities.filter((act: any) => selectedForPostpone.includes(act.id));
        const remainingActivities = selectedTask.activities.filter((act: any) => !selectedForPostpone.includes(act.id));
        
        // Create a new rest day task for the selected activities
        if (activitiesToMove.length > 0) {
          if (selectedTask._source === 'dexie') {
            const newTask = {
              ...selectedTask,
              id: safeRandomUUID(),
              dueDate: targetDateString,
              isRestDayTask: true,
              activities: activitiesToMove
            };
            delete newTask._source;
            await (db.tasks as any).add(newTask);
            await (db.tasks as any).update(selectedTask.id, { activities: remainingActivities });
          }
          setSelectedTask((prev: any) => ({ ...prev, activities: remainingActivities }));
        }

        toast.current?.show({
          severity: "success",
          summary: "تم الترحيل بنجاح 🗓️✨",
          detail: `نقلنا الأنشطة ليوم إجازتك (${dayLabel}) الموافق ${targetDateString}!`,
          life: 5000
        });
        confetti({ particleCount: 80, spread: 50, origin: { y: 0.7 } });
      } catch (err) {
        console.error('Failed to move tasks:', err);
      }
    } else if (pendingActivity) {
      try {
        await executeAddActivity(pendingActivity, pendingParentId, targetDateString);
        
        toast.current?.show({
          severity: "success",
          summary: "تم الترحيل بنجاح 🗓️✨",
          detail: `تم ترحيل المهمة وتغيير موعدها إلى يوم إجازتك (${dayLabel}) الموافق ${targetDateString} بلون مميز في التقويم!`,
          life: 5000
        });

        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.7 }
        });
      } catch (err) {
        console.error('Failed to move task:', err);
      }
    }
    setShowRestDayDialog(false);
    setPendingActivity(null);
    setPendingParentId(undefined);
    setIsPostponingSelected(false);
    setIsPostponingEntireTask(false);
    setIsPostponeMode(false);
    setSelectedForPostpone([]);
  };

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
  const toast = useRef({
    show: (options: { severity?: string; summary?: string; detail?: string; life?: number }) => {
      const msg = options.detail || options.summary || "";
      const duration = options.life || 3000;
      if (options.severity === "error") {
        toastHot.error(msg, {
          duration,
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      } else if (options.severity === "success") {
        toastHot.success(msg, {
          duration,
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      } else if (options.severity === "warn") {
        toastHot(msg, {
          duration,
          icon: '⚠️',
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      } else {
        toastHot(msg, {
          duration,
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      }
    }
  }) as any;
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDuration, setNewActivityDuration] = useState<number | null>(30);
  const [newActivityType, setNewActivityType] = useState<string>("cognitive");
  const [newActivityPuzzleHint, setNewActivityPuzzleHint] = useState("");
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowStartConfirmation(true);
    } else {
      setShowStartConfirmation(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && initialSelectedTask) {
      handleTaskClick(initialSelectedTask, initialSelectedTask._source || 'dexie');
    }
  }, [visible, initialSelectedTask]);

  const reflections = useLiveQuery(() => db.reflections.toArray()) || [];

  const handleTaskClick = (task: any, source: 'dexie' | 'weekly' | 'practical') => {
    if (task.type === 'main') {
      const parentSubTasks = subTasks.filter(st => st.parentId === task.id);
      const hasUncompleted = parentSubTasks.some(st => !st.isCompleted);
      if (hasUncompleted) {
        toast.current?.show({
          severity: "warn",
          summary: "أنجز الفرعيات أولاً ⚠️",
          detail: "يرجى إكمال المهام الفرعية للرئيسية أولاً.",
          life: 4000
        });
        return;
      }
    }
    if (onOpenVisSession) {
      onOpenVisSession(task);
      return;
    }
    setSelectedTask({ ...task, _source: source });
    setDetailModalVisible(true);
  };

  const saveActivities = async (updatedActivities: TaskActivity[]) => {
    if (!selectedTask) return;

    if (selectedTask._source === 'dexie') {
      await (db.tasks as any).update(selectedTask.id, { activities: updatedActivities });
    }
    
    setSelectedTask((prev: any) => ({ ...prev, activities: updatedActivities }));
  };

  const executeAddActivity = async (newAct: TaskActivity, parentId?: string, forceRestDayDate?: string) => {
    const updatedActivities = selectedTask.activities ? [...selectedTask.activities] : [];
    
    if (!parentId) {
      updatedActivities.push(newAct);
    } else {
      const addToParent = (list: TaskActivity[]) => {
        for (const act of list) {
          if (act.id === parentId) {
            act.children = act.children ? [...act.children, newAct] : [newAct];
            return true;
          }
          if (act.children && addToParent(act.children)) return true;
        }
        return false;
      };
      addToParent(updatedActivities);
    }

    if (forceRestDayDate) {
      if (selectedTask._source === 'dexie') {
        await (db.tasks as any).update(selectedTask.id, { 
          activities: updatedActivities,
          dueDate: forceRestDayDate,
          isRestDayTask: true
        });
      }
      setSelectedTask((prev: any) => ({ 
        ...prev, 
        activities: updatedActivities,
        dueDate: forceRestDayDate,
        isRestDayTask: true
      }));
    } else {
      await saveActivities(updatedActivities);
    }

    setNewActivityTitle("");
    setNewActivityDuration(30);
    setNewActivityType("cognitive");
    setNewActivityPuzzleHint("");
  };

  const addActivity = async (parentId?: string) => {
    if (!newActivityTitle.trim()) return;

    const newAct: TaskActivity = {
      id: safeRandomUUID(),
      title: newActivityTitle.trim(),
      duration: newActivityDuration || undefined,
      type: newActivityType as any,
      puzzleHint: newActivityPuzzleHint,
      isCompleted: false,
      children: []
    };

    if (user && user.dailyDuration && user.dailyDuration > 0 && selectedTask) {
      const formattedDate = selectedTask.dueDate || format(new Date(), 'yyyy-MM-dd');
      
      const allTasks = await db.tasks.toArray();
      const dayTasks = allTasks.filter(t => t.dueDate === formattedDate);
      
      let totalTasksMins = 0;
      dayTasks.forEach(task => {
        let taskMins = 0;
        if (task.activities && task.activities.length > 0) {
          const sumMins = (list: any[]) => {
            let sum = 0;
            list.forEach((act) => {
              sum += (act.duration || 30);
              if (act.children) {
                sum += sumMins(act.children);
              }
            });
            return sum;
          };
          taskMins = sumMins(task.activities);
        } else if (task.id !== selectedTask.id) {
          if (task.type === "main") {
            taskMins = 45;
          } else if (task.type === "side") {
            taskMins = 30;
          } else {
            taskMins = 20;
          }
        }
        totalTasksMins += taskMins;
      });

      let totalPracticalMins = 0;
      const rawSubs = user.subStations || {};
      Object.keys(rawSubs).forEach(stId => {
        const stationSubs = Array.isArray(rawSubs[stId]) ? rawSubs[stId] : (rawSubs[stId] ? [rawSubs[stId]] : []);
        stationSubs.forEach((sub: any) => {
          (sub.tasks || []).forEach((pTask: any) => {
            if (pTask.dueDate === formattedDate) {
              totalPracticalMins += (pTask.duration || 30);
            }
          });
        });
      });

      const currentAllocatedMins = totalTasksMins + totalPracticalMins;
      const prospectiveMins = currentAllocatedMins + (newActivityDuration || 30);

      if (prospectiveMins > user.dailyDuration) {
        setPendingActivity(newAct);
        setPendingParentId(parentId);
        setShowRestDayDialog(true);
        return;
      }
    }

    executeAddActivity(newAct, parentId);
  };

  const deleteActivity = (id: string) => {
    const updatedActivities = selectedTask.activities ? [...selectedTask.activities] : [];
    
    const removeFromList = (list: TaskActivity[]) => {
      const index = list.findIndex(a => a.id === id);
      if (index !== -1) {
        list.splice(index, 1);
        return true;
      }
      for (const act of list) {
        if (act.children && removeFromList(act.children)) return true;
      }
      return false;
    };

    removeFromList(updatedActivities);
    saveActivities(updatedActivities);
  };

  const editActivity = (id: string, newTitle: string, newDur: number) => {
    const updatedActivities = selectedTask.activities ? [...selectedTask.activities] : [];
    
    const updateInList = (list: TaskActivity[]) => {
      for (const act of list) {
        if (act.id === id) {
          act.title = newTitle;
          act.duration = newDur;
          return true;
        }
        if (act.children && updateInList(act.children)) return true;
      }
      return false;
    };

    updateInList(updatedActivities);
    saveActivities(updatedActivities);
  };

  const toggleActivityCompletion = async (id: string) => {
    const updatedActivities = selectedTask.activities ? [...selectedTask.activities] : [];
    
    let targetAct: any = null;
    let actDepth: number = 0;
    const toggleInList = (list: TaskActivity[], depth: number = 0) => {
      for (const act of list) {
        if (act.id === id) {
          act.isCompleted = !act.isCompleted;
          targetAct = act;
          actDepth = depth;
          return true;
        }
        if (act.children && toggleInList(act.children, depth + 1)) return true;
      }
      return false;
    };

    toggleInList(updatedActivities);
    await saveActivities(updatedActivities);

    if (targetAct && targetAct.isCompleted && onRewardActivity) {
      onRewardActivity(true, { ...targetAct, _isRoot: actDepth === 0 });
    }

    // Check for task completion
    const checkAllCompleted = (list: TaskActivity[]): boolean => {
      if (!list || list.length === 0) return false;
      for (const act of list) {
        if (!act.isCompleted) return false;
        if (act.children && act.children.length > 0 && !checkAllCompleted(act.children)) return false;
      }
      return true;
    };

    if (checkAllCompleted(updatedActivities)) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#1d4ed8', '#1e3a8a', '#10b981'],
        zIndex: 30000000
      });
      
      // Automatically trigger completion which will open reflection in Maps
      if (onCompleteTask) {
         onCompleteTask({ ...selectedTask, activities: updatedActivities });
      }

      toast.current?.show({
        severity: "success",
        summary: "عاش يا بطل! 🚀",
        detail: "خلصت كل المهام، يلا بينا نقيم الأداء!",
        life: 3000
      });
    }
  };

  const completedWithoutReflection = [...mainTasks, ...sideTasks, ...subTasks].filter(t => t.isCompleted && !reflections.some(r => r.taskId === t.id));
  const [initialReflectionVisible, setInitialReflectionVisible] = useState(false);

  const handleManualHide = () => {
    if (completedWithoutReflection.length > 0) {
      confirmPopup({
        target: document.querySelector('.evaluation-close-btn') as HTMLElement,
        message: `لديك ${completedWithoutReflection.length} مهام مكتملة لم يتم تقييمها بعد. هل تريد الخروج فعلاً؟`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'نعم، أخرج',
        rejectLabel: 'سأقوم بالتقييم',
        className: 'rtl-dialog font-sans text-xs',
        accept: onHide,
      });
    } else {
      onHide();
    }
  };

  return (
    <>
      <TaskReflectionModal 
        visible={initialReflectionVisible}
        onHide={() => setInitialReflectionVisible(false)}
        onSubmit={async (data) => {
          if (selectedTask) {
             try {
                 const station = stations.find(s => s.id === selectedTask.stationId);
                 await db.reflections.add({
                    id: safeRandomUUID(),
                    taskId: selectedTask.id || '',
                    stationId: selectedTask.stationId || '',
                    stationName: station?.name || 'غير محدد',
                    taskTitle: selectedTask.title || '',
                    type: 'initial',
                    ...data,
                    createdAt: new Date().toISOString()
                 });
                 
                 // If the task wasn't formally completed yet, complete it now
                 if (completeTaskAction && !selectedTask.isCompleted && selectedTask.type !== 'practical') {
                     await completeTaskAction(selectedTask);
                 } else if (selectedTask.isPractical && onCompletePracticalTask && !selectedTask.isCompleted) {
                     onCompletePracticalTask(selectedTask.stationId, selectedTask.subStationIndex, selectedTask.id);
                 }
                 
                 vibrate(HAPITCS.SUCCESS);
                 toastHot.success("تم تسجيل التقييم وختم المهمة بنجاح! ✨");
                 setInitialReflectionVisible(false);
             } catch (err) {
                 console.error(err);
                 toastHot.error("فشل حفظ التقييم وختم المهمة");
             }
          }
        }}
        taskTitle={selectedTask?.title || ""}
      />
      <ConfirmPopup />

      {/* Elegant Full-Screen Confirmation Dialog to Enter the Evaluation/Review */}
      {showStartConfirmation && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-[#020617] via-slate-900 to-[#0A0F2C] text-white flex flex-col font-sans p-6 overflow-y-auto"
          style={{ zIndex: 65000000 }}
          dir="rtl"
        >
          {/* Accent lighting gradients for visual depth */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

          {/* Explicit Two-Step Progression Indicator */}
          <div className="w-full max-w-xl mx-auto flex items-center justify-between border-b border-white/5 pb-5 mt-2 shrink-0" dir="rtl">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black border border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.5)]">١</span>
              <span className="text-[11px] font-black text-white">الخطوة الأولى: أهداف التمكين والمخرجات</span>
            </div>
            <div className="h-[2px] flex-1 bg-white/10 mx-4 max-w-[80px]" />
            <div className="flex items-center gap-2 opacity-40">
              <span className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-black">٢</span>
              <span className="text-[11px] font-black text-white">الخطوة الثانية: تقييم تحصيل المهام</span>
            </div>
          </div>

          <div className="max-w-2xl w-full mx-auto my-auto flex flex-col items-center justify-center text-center space-y-8 py-6 relative z-10">
            
            {/* Soft pulsing halo illustration */}
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#2D52CC] to-[#4D7FFF] flex items-center justify-center text-white shadow-[0_0_40px_rgba(77,127,255,0.4)] animate-pulse border border-white/20">
              <Sparkles className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#4D7FFF]">بوابة التمكين والتقييم</span>
              <h1 className="text-3xl font-extrabold text-white leading-tight">
                سجل التقييم والتحصيل الأصلي 🛡️
              </h1>
              <p className="text-[#A0B4E8] text-xs max-w-md mx-auto leading-relaxed">
                أنت الآن بصدد الدخول لشاشة قياس الأداء وتوثيق التقدم المعرفي لرحلتك الاستكشافية.
              </p>
            </div>

            {/* Target Objectives Section */}
            <div className="w-full bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 space-y-4 text-right shadow-2xl relative">
              <div className="absolute top-0 left-6 w-16 h-[2px] bg-gradient-to-r from-transparent to-indigo-500" />
              <div className="flex items-center gap-2 text-indigo-400 border-b border-white/5 pb-3">
                <Target className="w-5 h-5 animate-pulse" />
                <h3 className="font-extrabold text-white text-base">الأهداف والمخرجات المستهدفة للمهمة:</h3>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed font-bold">
                {initialSelectedTask?.taskGoals || initialSelectedTask?.taskOutcomes || user?.planGoals || user?.planOutcomes || 'تثبيت المعارف الأساسية، رصد نقاط التعثر والتقدم، وقياس العائد المعرفي لضمان السيولة الذهنية الكاملة.'}
              </p>
            </div>

            {/* Motivation / Startup Message Section */}
            <div className="w-full bg-indigo-500/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 space-y-4 text-right shadow-2xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">رسالة بدء المهمة والتمكين الجوهري:</h3>
              </div>
              <p className="text-slate-300 text-sm italic font-medium leading-relaxed">
                {initialSelectedTask?.startMessage || user?.psychology?.motivation || 'تذكر: الاستمرارية المنضبطة هي سلاح الإتقان الجوهري. استعن بالله، ركز حواسك وابدأ رحلتك الآن نحو العلو المعرفي!'}
              </p>
            </div>

            {/* Buttons Group */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  vibrate(HAPITCS.SUCCESS);
                  setShowStartConfirmation(false);
                }}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white text-lg font-black shadow-[0_4px_25px_rgba(79,70,229,0.35)] transition-all hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] cursor-pointer"
              >
                بدء المهمة الآن 🚀
              </button>
              
              <button
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setShowStartConfirmation(false);
                  onHide();
                }}
                className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#A0B4E8] font-bold transition-all border border-white/5 cursor-pointer"
              >
                تراجع للوقت الحالي
              </button>
            </div>

          </div>
        </div>
      )}

      <Sidebar
        visible={visible && !initialSelectedTask}
        onHide={() => {
          confirmPopup({
            target: document.querySelector('.evaluation-close-btn') as HTMLElement,
            message: `هل أنت متأكد من الخروج من سجل التقييم؟`,
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'نعم، أخرج',
            rejectLabel: 'إلغاء',
            className: 'rtl-dialog font-sans text-xs',
            accept: onHide,
          });
        }}
        fullScreen
        dismissable={false}
        className="w-screen h-screen !p-0 border-none shadow-none bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950"
        showCloseIcon={false}
        modal={true}
        baseZIndex={LAYERS.EVALUATION_LOG}
      >
        <div 
          className="flex flex-col h-screen w-screen bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950 text-white overflow-hidden relative" 
          dir="rtl"
        >
          {/* Header */}
          <div className="p-6 bg-[#020617]/90 backdrop-blur border-b border-white/5 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-950/45 to-slate-900 px-5 py-2 rounded-2xl shadow-md border border-white/10">
                <h2 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
                  <ListChecks className="w-5 h-5 opacity-70 text-indigo-400" />
                  سجل التقييم والتمكين
                </h2>
              </div>
            </div>
            <button 
              onClick={handleManualHide}
              className="evaluation-close-btn w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 active:scale-95 text-[#A0B4E8] group cursor-pointer"
            >
              <i className="pi pi-times text-sm group-hover:rotate-90 transition-transform duration-300"></i>
            </button>
          </div>

          {/* Explicit Two-Step Progression - Step 2 */}
          <div className="py-3 px-6 bg-[#020617]/40 border-b border-white/5 shrink-0 flex items-center justify-center">
            <div className="w-full max-w-xl flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-2 opacity-60">
                <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-[9px] font-black border border-emerald-500/20">✔</span>
                <span className="text-[10px] font-bold text-slate-300">الخطوة الأولى: أهداف التمكين والمخرجات</span>
              </div>
              <div className="h-[2px] flex-1 bg-[#10b981]/20 mx-4 max-w-[80px]" />
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black border border-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.5)]">٢</span>
                <span className="text-[10px] font-black text-white">الخطوة الثانية: تقييم تحصيل المهامورصد الأداء</span>
              </div>
            </div>
          </div>

          {/* Content with Tabs */}
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-transparent">
            <TabView className="custom-evaluation-tabs">
              <TabPanel header="" leftIcon={<Target className="w-5 h-5" />}>
                <div 
                  className="space-y-4 pt-4 css-tab-content"
                >
                  {mainTasks.length > 0 ? mainTasks.map((task) => {
                    const station = stations.find(s => s.id === task.stationId);
                    return (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        type="main" 
                        hasReflection={reflections.some(r => r.taskId === task.id)}
                        onRate={() => {
                          setSelectedTask(task);
                          setInitialReflectionVisible(true);
                        }}
                        stationName={station?.name}
                        onClick={() => handleTaskClick(task, 'dexie')} 
                      />
                    );
                  }) : <EmptyState message="لا توجد مهام رئيسية حالياً" />}
                </div>
              </TabPanel>

              <TabPanel header="" leftIcon={<Clock className="w-5 h-5" />}>
                <div 
                  className="space-y-4 pt-4 css-tab-content"
                >
                  {sideTasks.length > 0 ? sideTasks.map((task) => {
                    const station = stations.find(s => s.id === task.stationId);
                    return (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        type="side" 
                        hasReflection={reflections.some(r => r.taskId === task.id)}
                        onRate={() => {
                          setSelectedTask(task);
                          setInitialReflectionVisible(true);
                        }}
                        stationName={station?.name}
                        onClick={() => handleTaskClick(task, 'dexie')} 
                      />
                    );
                  }) : <EmptyState message="لا توجد مهام جانبية حالياً" />}
                </div>
              </TabPanel>

              <TabPanel header="" leftIcon={<ListChecks className="w-5 h-5" />}>
                <div 
                  className="space-y-4 pt-4 css-tab-content"
                >
                  {subTasks.length > 0 ? subTasks.map((task) => {
                    const station = stations.find(s => s.id === task.stationId);
                    const parentMainTask = mainTasks.find(t => t.id === task.parentId);
                    return (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        type="sub" 
                        hasReflection={reflections.some(r => r.taskId === task.id)}
                        onRate={() => {
                          setSelectedTask(task);
                          setInitialReflectionVisible(true);
                        }}
                        stationName={station?.name}
                        parentTaskName={parentMainTask?.title}
                        onClick={() => handleTaskClick(task, 'dexie')} 
                      />
                    );
                  }) : <EmptyState message="لا توجد مهام فرعية حالياً" />}
                </div>
              </TabPanel>

              <TabPanel header="" leftIcon={<Briefcase className="w-5 h-5" />}>
                <div 
                  className="space-y-4 pt-4 css-tab-content"
                >
                  {/* Part 1: Standalone custom practical tasks */}
                  {practicalTasks.length > 0 && (
                    <div className="space-y-3 mb-6 bg-emerald-50/10 p-3 rounded-2xl border border-emerald-900/5">
                      <h4 className="text-xs font-black text-emerald-800 px-1 border-b border-emerald-900/10 pb-2 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>المهام التطبيقية المحددة بالمسار (+25 XP)</span>
                      </h4>
                      {practicalTasks.map((task) => {
                        const station = stations.find(s => s.id === task.stationId);
                        return (
                          <TaskItem 
                            key={task.id} 
                            task={task} 
                            type="side" 
                            hasReflection={reflections.some(r => r.taskId === task.id)}
                            onRate={() => {
                              setSelectedTask(task);
                              setInitialReflectionVisible(true);
                            }}
                            stationName={station?.name}
                            onClick={() => handleTaskClick(task, 'dexie')} 
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Part 2: Substation tasks */}
                  {Object.entries(practicalSubStations).flatMap(([stId, subs]) => 
                    subs.flatMap((sub, sIdx) => 
                      sub.tasks.map((task: any) => ({
                        ...task,
                        stationId: stId,
                        subStationIndex: sIdx,
                        type: 'practical'
                      }))
                    )
                  ).length > 0 ? (
                    <div className="space-y-3">
                      {practicalTasks.length > 0 && (
                        <h4 className="text-xs font-black text-blue-900 px-1 border-b border-blue-900/10 pb-2 mb-2">
                          البرامج والأنشطة التطبيقية للمحطات
                        </h4>
                      )}
                      {Object.entries(practicalSubStations).flatMap(([stId, subs]) => 
                        subs.flatMap((sub, sIdx) => {
                          const station = stations.find(s => s.id === stId);
                          return sub.tasks.map((task: any) => (
                            <TaskItem 
                              key={`${stId}-${sIdx}-${task.id}`}
                              task={{ ...task, isPractical: true }}
                              type="main" 
                              hasReflection={reflections.some(r => r.taskId === task.id)}
                              onRate={() => {
                                setSelectedTask({ ...task, stationId: stId, subStationIndex: sIdx });
                                setInitialReflectionVisible(true);
                              }}
                              stationName={station?.name}
                              onClick={() => handleTaskClick({ ...task, stationId: stId, subStationIndex: sIdx }, 'practical')}
                            />
                          ));
                        })
                      )}
                    </div>
                  ) : (practicalTasks.length === 0 ? <EmptyState message="لا توجد مهام تطبيقية حالياً" /> : null)}
                </div>
              </TabPanel>
            </TabView>
          </div>
        </div>

        <style>{`
          .custom-evaluation-tabs .p-tabview-nav {
            display: flex;
            background: rgba(255, 255, 255, 0.03);
            padding: 6px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            margin-bottom: 24px;
          }
          .custom-evaluation-tabs .p-tabview-nav li {
            flex: 1;
            display: flex;
            justify-content: center;
          }
          .custom-evaluation-tabs .p-tabview-nav li .p-tabview-nav-link {
            background: transparent;
            border: none;
            padding: 0;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #A0B4E8;
            border-radius: 16px;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
          }
          .custom-evaluation-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
            background: linear-gradient(135deg, #2563eb 0%, #4338ca 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.25);
            transform: translateY(-2px);
          }
          .custom-evaluation-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link::after {
            content: '';
            position: absolute;
            bottom: -8px;
            width: 6px;
            height: 6px;
            background: #3b82f6;
            border-radius: 50%;
            box-shadow: 0 0 10px #3b82f6;
          }
          .custom-evaluation-tabs .p-tabview-panels {
            background: transparent;
            padding: 0;
          }
          
          /* Adjust TaskItem inside EvaluationSidebar */
          .custom-evaluation-tabs .TaskItemContainer {
             background: rgba(255, 255, 255, 0.03) !important;
             border: 1px solid rgba(255, 255, 255, 0.08) !important;
             color: white !important;
          }
          .custom-evaluation-tabs .TaskItemContainer:hover {
             background: rgba(255, 255, 255, 0.06) !important;
             border-color: rgba(255, 255, 255, 0.15) !important;
          }
          .custom-evaluation-tabs .TaskItemContainer h4 {
             color: white !important;
          }
          .custom-evaluation-tabs .TaskItemContainer p {
             color: #A0B4E8 !important;
          }

          .p-confirm-popup {
            background: #0c183e !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4) !important;
            border-radius: 20px !important;
          }
          .p-confirm-popup .p-confirm-popup-content {
            background: transparent !important;
            color: white !important;
            padding: 1.5rem !important;
          }
          .p-confirm-popup .p-confirm-popup-footer {
            background: rgba(255, 255, 255, 0.05) !important;
            padding: 0.75rem 1rem !important;
            border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
          }
          .p-confirm-popup .p-confirm-popup-message {
            margin-right: 0.5rem !important;
            font-family: 'sans-serif' !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            line-height: 1.6 !important;
          }
          .p-confirm-popup .p-confirm-popup-icon {
            color: #fbbf24 !important;
          }
          .p-confirm-popup .p-button-text.p-button-secondary {
            color: #94a3b8 !important;
          }
          .p-confirm-popup .p-button.p-button-danger {
            background: #ef4444 !important;
            border: none !important;
            border-radius: 12px !important;
          }
        `}</style>
      </Sidebar>

      {/* Task Details & Activities Modal */}
      <Dialog
        visible={detailModalVisible}
        onHide={() => {
          setDetailModalVisible(false);
          if (initialSelectedTask) onHide();
        }}
        header={
          <div className="flex items-center gap-3 pr-2 text-white" dir="rtl">
            <div className="w-10 h-10 rounded-xl bg-white/5 text-indigo-400 border border-white/10 flex items-center justify-center shadow-sm">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{selectedTask?.title}</h3>
              <p className="text-[9px] text-[#A0B4E8] font-bold">تخطيط الأنشطة المطلوبة والمدة المتوقعة</p>
            </div>
          </div>
        }
        className="w-[95vw] max-w-xl font-sans border border-white/10 shadow-2xl overflow-hidden"
        contentClassName="bg-[#020617] text-white p-6"
        headerClassName="bg-[#020617] border-b border-white/5 pb-4 text-white p-4"
        closable
        dismissableMask
        blockScroll
        baseZIndex={LAYERS.ANALYTICS_DIALOG}
      >
        <style>{`
          .custom-dark-dropdown .p-dropdown-label {
            color: white !important;
            font-size: 11px;
            font-weight: 900;
            padding: 4px 8px;
            display: flex;
            align-items: center;
          }
          .custom-dark-dropdown .p-dropdown-trigger {
            color: white !important;
            width: 2rem;
          }
          .force-blue-gradient {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%) !important;
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3) !important;
          }
          .force-blue-gradient:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4) !important;
          }
        `}</style>
        <div className="space-y-6 pt-4" dir="rtl">
           {/* Add New Root Activity */}
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex gap-2">
                <InputText 
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder="اسم النشاط الجديد..."
                  className="flex-1 p-3 text-white text-xs font-bold border border-white/10 rounded-xl focus:border-indigo-500 bg-white/5 placeholder-slate-400"
                />
                <div className="w-24 shrink-0">
                  <InputNumber 
                    value={newActivityDuration}
                    onValueChange={(e) => setNewActivityDuration(e.value)}
                    placeholder="دقيقة"
                    suffix=" د"
                    className="w-full"
                    inputClassName="p-3 text-white text-xs font-black text-center border border-white/10 rounded-xl focus:border-indigo-500 bg-white/5"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                 <div className="flex-1">
                    <InputText 
                       value={newActivityPuzzleHint}
                       onChange={(e) => setNewActivityPuzzleHint(e.target.value)}
                       placeholder="تلميح اللغز للنشاط (اختياري)..."
                       className="w-full p-3 text-white text-xs font-bold border border-white/10 rounded-xl focus:border-purple-500 bg-white/5 placeholder-slate-400"
                    />
                 </div>
                 <div className="w-[140px] shrink-0 custom-dark-dropdown">
                    <Dropdown
                       value={newActivityType}
                       options={[
                          { label: 'نشاط معرفي 🧠', value: 'cognitive' },
                          { label: 'نشاط تطبيقي ⚡', value: 'applied' },
                          { label: 'نشاط تفاعلي 🤝', value: 'interactive' }
                       ]}
                       onChange={(e) => setNewActivityType(e.value)}
                       style={{ alignContent: 'center', height: '42px', padding: '0px' }}
                       className="w-full bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white flex items-center h-[42px]"
                       panelClassName="text-xs font-black bg-slate-900 border border-slate-700 text-white"
                    />
                 </div>
              </div>
              <Button 
                label="ضيف نشاط جديد"
                icon={<Plus className="w-4 h-4 ml-2" />}
                className="w-full rounded-xl py-3.5 font-black force-blue-gradient"
                onClick={() => addActivity()}
              />
           </div>

           {/* Activities Tree */}
           <div className="space-y-3">
              <div className="flex items-center justify-between">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ListChecks className="w-3 h-3" />
                    الأنشطة والمهام اللى جاية
                 </h4>
                 <button 
                   onClick={() => {
                      if (!selectedTask?.activities || selectedTask.activities.length === 0) {
                         setIsPostponingEntireTask(true);
                         setShowRestDayDialog(true);
                      } else if (isPostponeMode && selectedForPostpone.length > 0) {
                         setIsPostponingSelected(true);
                         setShowRestDayDialog(true);
                      } else {
                         setIsPostponeMode(!isPostponeMode);
                         setSelectedForPostpone([]);
                      }
                   }}
                   className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                     (isPostponeMode && selectedForPostpone.length > 0) || (!selectedTask?.activities?.length)
                       ? 'bg-indigo-600 text-white shadow-md'
                       : isPostponeMode 
                         ? 'bg-slate-200 text-slate-600'
                         : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                   }`}
                 >
                   {(!selectedTask?.activities?.length) ? "أجل المهمة" : (isPostponeMode && selectedForPostpone.length > 0 ? "أكد التأجيل" : "أجل")}
                 </button>
               </div>
               
               <div className="space-y-4 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
                  {selectedTask?.activities?.length > 0 ? (
                     selectedTask.activities.map((act: TaskActivity) => (
                       <ActivityNode 
                         key={act.id} 
                         node={act} 
                         onToggle={(id) => toggleActivityCompletion(id)}
                         onDelete={(id) => deleteActivity(id)}
                         onEdit={(id, title, dur) => editActivity(id, title, dur)}
                         onAddSub={(parentId, title, dur) => {
                           setNewActivityTitle(title);
                           setNewActivityDuration(dur);
                           addActivity(parentId);
                         }}
                         isPostponeMode={isPostponeMode}
                         onDirectPostpone={(id) => {
                           setSelectedForPostpone([id]);
                           setIsPostponingSelected(true);
                           setShowRestDayDialog(true);
                         }}
                         isSelectedForPostpone={selectedForPostpone.includes(act.id)}
                         onTogglePostpone={(id) => {
                           setSelectedForPostpone(prev => 
                             prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                           );
                         }}
                       />
                    ))
                 ) : (
                   <div className="text-center py-8 bg-white border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-xs text-slate-300 font-bold">لا يوجد أنشطة مضافة بعد لهذا الهدف.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </Dialog>

      <Dialog
        visible={showRestDayDialog}
        onHide={() => {
          setShowRestDayDialog(false);
          setPendingActivity(null);
          setPendingParentId(undefined);
          setIsPostponingSelected(false);
          setIsPostponeMode(false);
          setSelectedForPostpone([]);
          setIsPostponingEntireTask(false);
        }}
        header={
          <div className="flex items-center gap-2 text-rose-700 font-sans font-black pr-4 text-sm" dir="rtl">
            {isPostponingSelected ? "ترحل أنشطة ليوم إجازة 🗓️" : isPostponingEntireTask ? "أجل المهمة ليوم إجازة 🗓️" : "⚠️ خد بالك: عديت هدفك اليومي"}
          </div>
        }
        className="w-[90vw] max-w-md font-sans mx-4 shadow-2xl"
        closable
        dismissableMask
      >
        <div className="p-4 flex flex-col gap-4 text-right font-sans" dir="rtl">
          {isPostponingSelected ? (
            <>
              <p className="text-slate-700 text-sm font-bold leading-relaxed">
                إنت كده حددت {selectedForPostpone.length} أنشطة لتأجيلها.
              </p>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                هننقل الأنشطة دي لليوم اللي تختاره إلى اليوم الذي تختاره.
              </p>
            </>
          ) : isPostponingEntireTask ? (
            <>
              <p className="text-slate-700 text-sm font-bold leading-relaxed">
                هنأجل المهمة دي كلها ليوم الإجازة اللي هتختاره.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700 text-sm font-bold leading-relaxed">
                أهلاً! لو ضفت النشاط ده هتعدي الهدف اليومي بتاعك <strong>الهدف اليومي</strong> المسموح به للدراسة/التعلم والمقدر بـ ({user?.dailyDuration} دقيقة يوماً).
              </p>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                الهدف اليومي ده عشان متفرهدش نفسك. تحب نرحّل المهمة دي ليوم من أيام إجازتك وتشتغل عليها براحتك؟ طاقة متوازنة وتجنب الإرهاق. هل ترغب في ترحيل هذه المهمة مع كل أنشطتها إلى أحد <strong>أيام الإجازة</strong> المتاحة والعمل عليها براحة؟
              </p>
            </>
          )}
          
          <div className="mt-2">
            <h5 className="text-xs font-black text-indigo-900 mb-2">اختار يوم الإجازة أو حدد تاريخ معين:</h5>
            
            <div className="mb-4">
              <Calendar 
                onChange={(e) => {
                  if (e.value instanceof Date) {
                    const d = new Date(e.value);
                    d.setHours(12, 0, 0, 0);
                    const targetDateString = d.toISOString().split('T')[0];
                    handleDelayToDate(targetDateString, "تاريخ مخصص");
                  }
                }}
                placeholder="إختر تاريخ من التقويم مباشرة..."
                className="w-full custom-delay-calendar"
                inputClassName="!bg-white !border-slate-200 !text-slate-800 !text-xs !font-black !rounded-2xl !p-4 !h-12 shadow-sm"
                minDate={new Date()}
                showIcon
                icon={() => <i className="pi pi-calendar-plus text-indigo-500" />}
                appendTo="self"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
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
                      onClick={() => handleDelayToDate(targetDateString, dayLabel)}
                      className="w-full p-4 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/50 hover:border-rose-300 text-rose-950 rounded-2xl text-xs font-black text-right transition-all flex justify-between items-center cursor-pointer shadow-3xs"
                    >
                      <span>{dayLabel}</span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100/60 px-2 py-1 rounded-lg">{targetDateString}</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          <div className="flex gap-2.5 mt-4">
            <Button
              label="إلغاء إضافة النشاط"
              className="flex-1 bg-slate-100 hover:bg-slate-200 border-none rounded-2xl py-3.5 text-xs font-black text-slate-700 transition-all cursor-pointer"
              onClick={() => {
                setShowRestDayDialog(false);
                setPendingActivity(null);
                setPendingParentId(undefined);
              }}
            />
            <Button
              label="إضافة للهدف الحالي"
              className="flex-1 bg-indigo-900 hover:bg-indigo-950 border-none rounded-2xl py-3.5 text-xs font-black text-white transition-all cursor-pointer shadow-md shadow-indigo-900/10"
              onClick={() => {
                if (pendingActivity) {
                  executeAddActivity(pendingActivity, pendingParentId);
                }
                setShowRestDayDialog(false);
                setPendingActivity(null);
                setPendingParentId(undefined);
              }}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}

function ActivityNode({ node, onToggle, onDelete, onEdit, onAddSub, isPostponeMode, isSelectedForPostpone, onTogglePostpone, onDirectPostpone }: { 
  node: TaskActivity, 
  onToggle: (id: string) => void, 
  onDelete: (id: string) => void,
  onEdit: (id: string, title: string, dur: number) => void,
  onAddSub: (parentId: string, title: string, dur: number) => void,
  isPostponeMode?: boolean,
  isSelectedForPostpone?: boolean,
  onTogglePostpone?: (id: string) => void,
  onDirectPostpone?: (id: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editDur, setEditDur] = useState<number | null>(node.duration || 30);
  
  const menuRef = useRef<Menu>(null);
  
  const handleEditSave = () => {
     if (editTitle.trim()) {
        onEdit(node.id, editTitle.trim(), editDur ?? 30);
        setIsEditing(false);
     }
  };

  const confirmDelete = (event: React.MouseEvent) => {
    confirmPopup({
      target: event.currentTarget as HTMLElement,
      message: 'هل أنت متأكد من حذف هذا النشاط؟',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      className: 'font-sans text-xs',
      accept: () => onDelete(node.id),
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm overflow-hidden mb-1 cursor-pointer">
      <div className={`p-3 flex items-center justify-between group transition-colors ${node.isCompleted ? 'bg-emerald-50/30' : ''}`}
           onClick={(e) => {
             if (isPostponeMode && onTogglePostpone) {
               onTogglePostpone(node.id);
             }
           }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={(e) => {
              if (isPostponeMode && onTogglePostpone) {
                onTogglePostpone(node.id);
              } else {
                e.stopPropagation();
                if (node.isCompleted) {
                  confirmPopup({
                    target: e.currentTarget,
                    message: 'هل تنوي حقاً التراجع عن هذا الإنجاز؟ سيتم احتساب المهمة كغير مكتملة وتحتاج لمراجعة الموعد.',
                    icon: 'pi pi-exclamation-triangle',
                    acceptLabel: 'نعم، تراجع',
                    rejectLabel: 'إلغاء',
                    className: 'font-sans text-xs',
                    accept: () => onToggle(node.id)
                  });
                } else {
                  onToggle(node.id);
                }
              }
            }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${
              isPostponeMode 
                ? (isSelectedForPostpone ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-white border-2 border-slate-300 text-slate-300 group-hover:bg-slate-50')
                : (node.isCompleted ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-300 group-hover:bg-slate-50')
            }`}
          >
            {isPostponeMode ? (
              isSelectedForPostpone ? (
                <CheckCircle2 className="w-5 h-5 transition-transform duration-200" />
              ) : null
            ) : (
                node.isCompleted ? <CheckCircle2 className="w-5 h-5 transition-transform duration-200" /> : <Circle className="w-5 h-5 transition-transform duration-200" />
            )}
          </button>
          
          {node.children && node.children.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-slate-400 hover:text-indigo-600 transition-colors">
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}

          <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${node.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {node.title}
                </p>
                {node.duration && (
                  <span className="text-[10px] font-black text-slate-400">{node.duration} دقيقة</span>
                )}
          </div>
        </div>

        <div className="flex items-center gap-2">
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onDirectPostpone) onDirectPostpone(node.id);
              }}
              className="w-8 h-8 rounded-xl bg-orange-50 hover:bg-orange-100/80 border border-orange-200/40 text-orange-600 flex items-center justify-center transition-all"
              title="تأجيل"
            >
              <i className="pi pi-calendar-plus text-xs"></i>
            </button>

            <button 
              onClick={confirmDelete}
              className="w-8 h-8 rounded-xl force-blue-gradient flex items-center justify-center transition-all"
              title="حذف"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
      </div>

      {isExpanded && node.children && node.children.length > 0 && (
        <div className="pr-6 pb-2 space-y-2 border-r-2 border-slate-100 mr-4 mt-1">
           {node.children.map(child => (
             <ActivityNode 
               key={child.id} 
               node={child} 
               onToggle={onToggle}
               onDelete={onDelete}
               onEdit={onEdit}
               onAddSub={onAddSub}
               onDirectPostpone={onDirectPostpone}
             />
           ))}
        </div>
      )}
    </div>
  );
}

function TaskItem({ 
  task, 
  type, 
  stationName, 
  parentTaskName, 
  onClick,
  hasReflection,
  onRate
}: { 
  task: any, 
  type: 'main' | 'side' | 'weekly' | 'sub', 
  stationName?: string, 
  parentTaskName?: string,
  onClick?: () => void,
  hasReflection?: boolean,
  onRate?: () => void
}) {
  const op = useRef<OverlayPanel>(null);
  const colors = {
    main: 'from-blue-500 to-indigo-600',
    side: 'from-amber-400 to-orange-500',
    weekly: 'from-purple-500 to-fuchsia-600',
    sub: 'from-indigo-400 to-blue-500'
  };

  let displayXp: number | null = null;
  if (task.isPractical) {
    displayXp = 25;
  } else if (type === 'main') {
    displayXp = 30;
  } else if (type === 'side') {
    displayXp = 20;
  } else {
    displayXp = null;
  }

  return (
    <div 
      onClick={onClick}
      className="TaskItemContainer rounded-2xl p-4 flex items-center justify-between group transition-all cursor-pointer active:scale-98 mb-3"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[type]} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform shrink-0`}>
          {task.isCompleted || task.completed ? <i className="pi pi-check font-bold"></i> : <i className="pi pi-circle text-[10px]"></i>}
        </div>
        <div className="pr-1 flex-1 min-w-0">
          <h4 className="text-sm font-black text-slate-800 leading-none mb-1 truncate">{task.title}</h4>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-slate-400 font-bold">{(task.isCompleted || task.completed) ? 'مكتملة' : 'قيد الانتظار'}</p>
            {stationName && (
              <>
                <span className="text-[10px] text-slate-200">•</span>
                <span className="text-[10px] text-indigo-500 font-black truncate max-w-[120px]">{stationName}</span>
              </>
            )}
            {type === 'sub' && (
              <button 
                className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  op.current?.toggle(e);
                }}
              >
                <Info className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <OverlayPanel ref={op} className="p-0 overflow-hidden rounded-2xl border-none shadow-2xl" style={{ width: '220px' }}>
         <div className="p-4 bg-white space-y-3" dir="rtl">
            <div className="flex items-center gap-2">
               <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <i className="pi pi-map-marker text-xs"></i>
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 font-bold">الخطة</p>
                  <p className="text-xs font-black text-slate-800">{stationName || 'غير محدد'}</p>
               </div>
            </div>
            {parentTaskName && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                   <Target className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">المهمة الرئيسية</p>
                  <p className="text-xs font-black text-slate-800">{parentTaskName}</p>
                </div>
              </div>
            )}
         </div>
      </OverlayPanel>

      <div className="flex items-center gap-2 shrink-0">
        {(!hasReflection && (task.isCompleted || task.completed)) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onRate) onRate();
            }}
            className="p-1 px-3 bg-amber-500 hover:bg-amber-600 text-white transition-all rounded-xl flex items-center justify-center cursor-pointer shadow-lg shadow-amber-200 border-none hover:scale-105 gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black">قيم المهمة ✨</span>
          </button>
        )}
        {task.activities?.length > 0 && (
          <div className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1">
            <ListChecks className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-black text-slate-600">{task.activities.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-300">
        <Clock className="w-8 h-8" />
      </div>
      <p className="text-xs font-black text-slate-400 max-w-[200px] leading-relaxed">
        {message}
      </p>
    </div>
  );
}
