import { Sidebar } from "primereact/sidebar";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { Toast } from "primereact/toast";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from 'canvas-confetti';
import { ListChecks, Target, Trophy, Clock, Plus, Trash2, ChevronRight, ChevronDown, CheckCircle2, Circle, Edit2, MoreVertical, Info, Briefcase } from "lucide-react";
import { LAYERS } from "../constants/layers";
import { db, TaskActivity } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { format, getDay } from "date-fns";
import { ar } from "date-fns/locale";
import { safeRandomUUID } from "../lib/uuid";
import { TaskReflectionModal } from "./TaskReflectionModal";
import { toast as toastHot } from "react-hot-toast";

export interface EvaluationSidebarProps {
  visible: boolean;
  onHide: () => void;
  stations: any[];
  mainTasks: any[];
  sideTasks: any[];
  subTasks: any[];
  practicalSubStations?: Record<string, any[]>;
  onRewardActivity?: (isCompleted: boolean) => void;
  onCompleteTask?: (task: any) => void;
  onCompletePracticalTask?: (stationId: string, subStationIndex: number, taskId: string) => void;
  initialSelectedTask?: any;
}

export function EvaluationSidebar({
  visible,
  onHide,
  stations = [],
  mainTasks,
  sideTasks,
  subTasks = [],
  practicalSubStations = {},
  onRewardActivity,
  onCompleteTask,
  onCompletePracticalTask,
  initialSelectedTask
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
  const [reflectionVisible, setReflectionVisible] = useState(false);
  const [taskToReflect, setTaskToReflect] = useState<any>(null);

  useEffect(() => {
    if (visible && initialSelectedTask) {
      handleTaskClick(initialSelectedTask, initialSelectedTask._source || 'dexie');
    }
  }, [visible, initialSelectedTask]);

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
  };

  const addActivity = async (parentId?: string) => {
    if (!newActivityTitle.trim()) return;

    const newAct: TaskActivity = {
      id: safeRandomUUID(),
      title: newActivityTitle.trim(),
      duration: newActivityDuration || undefined,
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

  const toggleActivityCompletion = (id: string) => {
    const updatedActivities = selectedTask.activities ? [...selectedTask.activities] : [];
    
    const toggleInList = (list: TaskActivity[]) => {
      for (const act of list) {
        if (act.id === id) {
          act.isCompleted = !act.isCompleted;
          return true;
        }
        if (act.children && toggleInList(act.children)) return true;
      }
      return false;
    };

    toggleInList(updatedActivities);
    saveActivities(updatedActivities);

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
      setTaskToReflect(selectedTask);
      setReflectionVisible(true);
      // Automatically open the evaluation log as requested
      toast.current?.show({
        severity: "success",
        summary: "عاش يا بطل! 🚀",
        detail: "خلصت كل المهام، يلا بينا نقيم الأداء!",
        life: 3000
      });
    }

    // Call reward callback removed from here to prevent duplicate rewards
    /*
    if (onRewardActivity) {
      const findStatus = (list: TaskActivity[]): boolean | null => {
        for (const act of list) {
          if (act.id === id) return act.isCompleted;
          if (act.children) {
            const res = findStatus(act.children);
            if (res !== null) return res;
          }
        }
        return null;
      };
      const status = findStatus(updatedActivities);
      if (status !== null) onRewardActivity(status);
    }
    */
  };

  return (
    <>
      <ConfirmPopup />
      <Sidebar
        visible={visible && !initialSelectedTask}
        onHide={onHide}
        position="bottom"
        className="w-full h-auto max-h-[90vh] md:w-[600px] md:mx-auto !bg-transparent p-0 border-none shadow-none"
        showCloseIcon={false}
        modal={true}
        baseZIndex={LAYERS.EVALUATION_LOG}
      >
        <div className="flex flex-col h-[85vh] md:h-[70vh] mb-0 mx-2 md:mx-auto bg-slate-50/100 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] relative" dir="rtl">
          {/* Header */}
          <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 px-5 py-2 rounded-2xl shadow-md border border-white/10">
                <h2 className="text-lg font-black tracking-tighter text-white uppercase flex items-center gap-2">
                  <ListChecks className="w-5 h-5 opacity-70" />
                  سجل التقييم
                </h2>
              </div>
            </div>
            <button 
              onClick={onHide}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all border border-slate-200 active:scale-95 text-slate-400 group"
            >
              <i className="pi pi-times text-sm group-hover:rotate-90 transition-transform duration-300"></i>
            </button>
          </div>

          {/* Content with Tabs */}
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-white">
            <TabView className="custom-evaluation-tabs">
              <TabPanel header="" leftIcon={<Target className="w-5 h-5" />}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4"
                >
                  {mainTasks.length > 0 ? mainTasks.map((task) => {
                    const station = stations.find(s => s.id === task.stationId);
                    return (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        type="main" 
                        stationName={station?.name}
                        onClick={() => handleTaskClick(task, 'dexie')} 
                      />
                    );
                  }) : <EmptyState message="لا توجد مهام رئيسية حالياً" />}
                </motion.div>
              </TabPanel>

              <TabPanel header="" leftIcon={<Clock className="w-5 h-5" />}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4"
                >
                  {sideTasks.length > 0 ? sideTasks.map((task) => {
                    const station = stations.find(s => s.id === task.stationId);
                    return (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        type="side" 
                        stationName={station?.name}
                        onClick={() => handleTaskClick(task, 'dexie')} 
                      />
                    );
                  }) : <EmptyState message="لا توجد مهام جانبية حالياً" />}
                </motion.div>
              </TabPanel>

              <TabPanel header="" leftIcon={<ListChecks className="w-5 h-5" />}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4"
                >
                  {subTasks.length > 0 ? subTasks.map((task) => {
                    const station = stations.find(s => s.id === task.stationId);
                    const parentMainTask = mainTasks.find(t => t.id === task.parentId);
                    return (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        type="sub" 
                        stationName={station?.name}
                        parentTaskName={parentMainTask?.title}
                        onClick={() => handleTaskClick(task, 'dexie')} 
                      />
                    );
                  }) : <EmptyState message="لا توجد مهام فرعية حالياً" />}
                </motion.div>
              </TabPanel>

              <TabPanel header="" leftIcon={<Briefcase className="w-5 h-5" />}>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4"
                >
                  {Object.entries(practicalSubStations).flatMap(([stId, subs]) => 
                    subs.flatMap((sub, sIdx) => 
                      sub.tasks.map((task: any) => ({
                        ...task,
                        stationId: stId,
                        subStationIndex: sIdx,
                        type: 'practical'
                      }))
                    )
                  ).length > 0 ? Object.entries(practicalSubStations).flatMap(([stId, subs]) => 
                    subs.flatMap((sub, sIdx) => {
                      const station = stations.find(s => s.id === stId);
                      return sub.tasks.map((task: any) => (
                        <TaskItem 
                          key={`${stId}-${sIdx}-${task.id}`}
                          task={task}
                          type="main" // Reuse main styling
                          stationName={station?.name}
                          onClick={() => handleTaskClick({ ...task, stationId: stId, subStationIndex: sIdx }, 'practical')}
                        />
                      ));
                    })
                  ) : <EmptyState message="لا توجد مهام تطبيقية حالياً" />}
                </motion.div>
              </TabPanel>
            </TabView>
          </div>
        </div>

        <style>{`
          .custom-evaluation-tabs .p-tabview-nav {
            display: flex;
            background: #f8fafc;
            padding: 6px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
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
            color: #94a3b8;
            border-radius: 16px;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
          }
          .custom-evaluation-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
            background: linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
            transform: translateY(-2px);
          }
          .custom-evaluation-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link::after {
            content: '';
            position: absolute;
            bottom: -8px;
            width: 6px;
            height: 6px;
            background: #2563eb;
            border-radius: 50%;
            box-shadow: 0 0 10px #2563eb;
          }
          .custom-evaluation-tabs .p-tabview-panels {
            background: transparent;
            padding: 0;
          }
          
          /* Adjust TaskItem for white background */
          .custom-evaluation-tabs .TaskItemContainer {
             background: #f8fafc;
             border: 1px solid #f1f5f9;
          }
          .custom-evaluation-tabs .TaskItemContainer:hover {
             background: #f1f5f9;
             border-color: #e2e8f0;
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
          <div className="flex items-center gap-3 pr-2" dir="rtl">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">{selectedTask?.title}</h3>
              <p className="text-[10px] text-slate-400 font-bold">تخطيط الأنشطة المطلوبة والمدة المتوقعة</p>
            </div>
          </div>
        }
        className="w-[95vw] max-w-xl font-sans"
        closable
        dismissableMask
        blockScroll
        baseZIndex={LAYERS.ANALYTICS_DIALOG}
      >
        <style>{`
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
           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex gap-2">
                <InputText 
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder="اسم النشاط الجديد..."
                  className="flex-1 p-3 text-xs font-bold border-slate-200 rounded-xl focus:border-indigo-500"
                />
                <div className="w-24">
                  <InputNumber 
                    value={newActivityDuration}
                    onValueChange={(e) => setNewActivityDuration(e.value)}
                    placeholder="دقيقة"
                    suffix=" د"
                    className="w-full"
                    inputClassName="p-3 text-xs font-black text-center border-slate-200 rounded-xl focus:border-indigo-500"
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

      <TaskReflectionModal 
        visible={reflectionVisible}
        onHide={() => setReflectionVisible(false)}
        taskTitle={taskToReflect?.title || ''}
        onSubmit={async (data) => {
          console.log('Task Reflection Data:', data);
          try {
            let stationName = 'غير محدد';
            if (taskToReflect?.stationId) {
              const station = await db.stations.get(taskToReflect.stationId);
              if (station) stationName = station.name;
            }

            await db.reflections.add({
              id: safeRandomUUID(),
              taskId: taskToReflect?.id || '',
              taskTitle: taskToReflect?.title || '',
              stationId: taskToReflect?.stationId || '',
              stationName: stationName,
              focus: data.focus,
              mastery: data.mastery,
              strengths: data.strengths,
              weaknesses: data.weaknesses,
              learnings: data.learnings || '',
              didPractical: !!data.didPractical,
              practicalIssues: data.practicalIssues || '',
              createdAt: new Date().toISOString(),
              type: 'initial'
            });

            // Reward once after evaluation is submitted
            if (onRewardActivity) {
              onRewardActivity(true);
            }

            if (taskToReflect._source === 'practical' && onCompletePracticalTask) {
              onCompletePracticalTask(taskToReflect.stationId, taskToReflect.subStationIndex, taskToReflect.id);
            } else if (onCompleteTask && taskToReflect) {
               onCompleteTask(taskToReflect);
            }
          } catch (err) {
            console.error('Failed to save reflection:', err);
          }
        }}
      />

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
            <h5 className="text-xs font-black text-indigo-900 mb-2">اختار يوم الإجازة اللي يريحك نأجل ليه المهمة:</h5>
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
                      onClick={async () => {
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
                      }}
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
            <AnimatePresence mode="wait">
              {isPostponeMode ? (
                isSelectedForPostpone ? (
                  <motion.div
                    key="selected"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </motion.div>
                ) : null
              ) : (
                  <motion.div
                    key={node.isCompleted ? 'completed' : 'pending'}
                    initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {node.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </motion.div>
              )}
            </AnimatePresence>
          </button>
          
          {node.children && node.children.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="text-slate-400 hover:text-indigo-600 transition-colors">
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          )}

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex gap-2 items-center">
                 <InputText 
                   value={editTitle} 
                   onChange={(e) => setEditTitle(e.target.value)}
                   className="p-1 px-3 text-[11px] h-9 font-bold border-slate-200 rounded-xl flex-1 bg-slate-50 focus:bg-white transition-colors"
                 />
                 <div className="w-24">
                   <InputNumber 
                     value={editDur} 
                     onValueChange={(e) => setEditDur(e.value)}
                     suffix=" دقيقة"
                     className="w-full"
                     inputClassName="p-0 text-[11px] h-9 font-black text-center border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                   />
                 </div>
                 <div className="flex gap-1.5 pr-1">
                   <button 
                     onClick={handleEditSave} 
                     className="w-9 h-9 rounded-xl force-blue-gradient flex items-center justify-center transition-all hover:brightness-110 active:scale-90"
                     title="حفظ"
                   >
                      <CheckCircle2 className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => {
                       setIsEditing(false);
                       setEditTitle(node.title);
                       setEditDur(node.duration || 30);
                     }}
                     className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-all active:scale-90"
                     title="إلغاء"
                   >
                      <i className="pi pi-times text-xs"></i>
                   </button>
                 </div>
              </div>
            ) : (
              <>
                <p className={`text-xs font-bold truncate ${node.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {node.title}
                </p>
                {node.duration && (
                  <span className="text-[10px] font-black text-slate-400">{node.duration} دقيقة</span>
                )}
              </>
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="w-8 h-8 rounded-xl force-blue-gradient flex items-center justify-center transition-all"
              title="تعديل"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            
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
        )}
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
  onClick 
}: { 
  task: any, 
  type: 'main' | 'side' | 'weekly' | 'sub', 
  stationName?: string, 
  parentTaskName?: string,
  onClick?: () => void 
}) {
  const op = useRef<OverlayPanel>(null);
  const colors = {
    main: 'from-blue-500 to-indigo-600',
    side: 'from-amber-400 to-orange-500',
    weekly: 'from-purple-500 to-fuchsia-600',
    sub: 'from-indigo-400 to-blue-500'
  };

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
        {task.activities?.length > 0 && (
          <div className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1">
            <ListChecks className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-black text-slate-600">{task.activities.length}</span>
          </div>
        )}
        {task.xp && (
          <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <span className="text-[10px] font-black text-emerald-400 tracking-tighter">+{task.xp} XP</span>
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
