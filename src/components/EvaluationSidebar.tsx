import { Sidebar } from "primereact/sidebar";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { ConfirmPopup, confirmPopup } from "primereact/confirmpopup";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from 'canvas-confetti';
import { ListChecks, Target, Trophy, Clock, Plus, Trash2, ChevronRight, ChevronDown, CheckCircle2, Circle, Edit2, MoreVertical } from "lucide-react";
import { db, TaskActivity } from "../db";
import { safeRandomUUID } from "../lib/uuid";
import { TaskReflectionModal } from "./TaskReflectionModal";

export interface EvaluationSidebarProps {
  visible: boolean;
  onHide: () => void;
  mainTasks: any[];
  sideTasks: any[];
  weeklyTasks: any[];
  onUpdateWeeklyTasks?: (tasks: any[]) => void;
  onRewardActivity?: (isCompleted: boolean) => void;
}

export function EvaluationSidebar({
  visible,
  onHide,
  mainTasks,
  sideTasks,
  weeklyTasks,
  onUpdateWeeklyTasks,
  onRewardActivity
}: EvaluationSidebarProps) {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDuration, setNewActivityDuration] = useState<number | null>(30);
  const [reflectionVisible, setReflectionVisible] = useState(false);
  const [taskToReflect, setTaskToReflect] = useState<any>(null);

  const handleTaskClick = (task: any, source: 'dexie' | 'weekly') => {
    setSelectedTask({ ...task, _source: source });
    setDetailModalVisible(true);
  };

  const saveActivities = async (updatedActivities: TaskActivity[]) => {
    if (!selectedTask) return;

    if (selectedTask._source === 'dexie') {
      await db.tasks.update(selectedTask.id, { activities: updatedActivities });
    } else if (selectedTask._source === 'weekly' && onUpdateWeeklyTasks) {
       const updatedWeekly = weeklyTasks.map(t => 
         t.id === selectedTask.id ? { ...t, activities: updatedActivities } : t
       );
       onUpdateWeeklyTasks(updatedWeekly);
    }
    
    setSelectedTask((prev: any) => ({ ...prev, activities: updatedActivities }));
  };

  const addActivity = (parentId?: string) => {
    if (!newActivityTitle.trim()) return;

    const newAct: TaskActivity = {
      id: safeRandomUUID(),
      title: newActivityTitle.trim(),
      duration: newActivityDuration || undefined,
      isCompleted: false,
      children: []
    };

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

    saveActivities(updatedActivities);
    setNewActivityTitle("");
    setNewActivityDuration(30);
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
        colors: ['#2563eb', '#1d4ed8', '#1e3a8a', '#10b981']
      });
      setTaskToReflect(selectedTask);
      setReflectionVisible(true);
    }

    // Call reward callback if provided
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
  };

  return (
    <>
      <ConfirmPopup />
      <Sidebar
        visible={visible}
        onHide={onHide}
        position="right"
        className="w-full md:w-[450px] !bg-transparent p-0 border-none shadow-none"
        showCloseIcon={false}
        blockScroll
      >
        <div className="flex flex-col h-[calc(100vh-32px)] my-4 mx-4 bg-slate-50/95 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl relative" dir="rtl">
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-3xl animate-pulse"></div>
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <ListChecks className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">سجل التقييم</h2>
                  <p className="text-xs text-blue-200 font-medium">تتبع إنجازاتك ومهامك الجارية</p>
                </div>
              </div>
              <button 
                onClick={onHide}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10 active:scale-95"
              >
                <i className="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          {/* Content with Tabs */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <TabView className="custom-evaluation-tabs">
              <TabPanel header="الرئيسية" leftIcon={<Target className="w-4 h-4 ml-2" />}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 pt-4"
                >
                  {mainTasks.length > 0 ? mainTasks.map((task) => (
                    <TaskItem key={task.id} task={task} type="main" onClick={() => handleTaskClick(task, 'dexie')} />
                  )) : <EmptyState message="لا توجد مهام رئيسية حالياً" />}
                </motion.div>
              </TabPanel>

              <TabPanel header="الجانبية" leftIcon={<Clock className="w-4 h-4 ml-2" />}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 pt-4"
                >
                  {sideTasks.length > 0 ? sideTasks.map((task) => (
                    <TaskItem key={task.id} task={task} type="side" onClick={() => handleTaskClick(task, 'dexie')} />
                  )) : <EmptyState message="لا توجد مهام جانبية حالياً" />}
                </motion.div>
              </TabPanel>

              <TabPanel header="التحدي" leftIcon={<Trophy className="w-4 h-4 ml-2" />}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 pt-4"
                >
                  {weeklyTasks.length > 0 ? weeklyTasks.map((task) => (
                    <TaskItem key={task.id} task={task} type="weekly" onClick={() => handleTaskClick(task, 'weekly')} />
                  )) : <EmptyState message="لا توجد مهام تحدي للهذا الأسبوع" />}
                </motion.div>
              </TabPanel>
            </TabView>
          </div>
        </div>

        <style>{`
          .custom-evaluation-tabs .p-tabview-nav {
            display: flex;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 16px;
            border: 1px solid #e2e8f0;
            margin-bottom: 24px;
          }
          .custom-evaluation-tabs .p-tabview-nav li {
            flex: 1;
          }
          .custom-evaluation-tabs .p-tabview-nav li .p-tabview-nav-link {
            background: transparent;
            border: none;
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            color: #64748b;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .custom-evaluation-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
            background: white;
            color: #1e3a8a;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .custom-evaluation-tabs .p-tabview-panels {
            background: transparent;
            padding: 0;
          }
        `}</style>
      </Sidebar>

      {/* Task Details & Activities Modal */}
      <Dialog
        visible={detailModalVisible}
        onHide={() => setDetailModalVisible(false)}
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
                  placeholder="عنوان النشاط الجديد..."
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
                label="إضافة نشاط رئيسي"
                icon={<Plus className="w-4 h-4 ml-2" />}
                className="w-full rounded-xl py-3.5 font-black force-blue-gradient"
                onClick={() => addActivity()}
              />
           </div>

           {/* Activities Tree */}
           <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <ListChecks className="w-3 h-3" />
                 قائمة الأنشطة والمهام الفرعية
              </h4>
              
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
              learnings: data.learnings,
              didPractical: data.didPractical,
              practicalIssues: data.practicalIssues,
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.error('Failed to save reflection:', err);
          }
        }}
      />
    </>
  );
}

function ActivityNode({ node, onToggle, onDelete, onEdit, onAddSub }: { 
  node: TaskActivity, 
  onToggle: (id: string) => void, 
  onDelete: (id: string) => void,
  onEdit: (id: string, title: string, dur: number) => void,
  onAddSub: (parentId: string, title: string, dur: number) => void
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

  const menuItems = [
    { label: 'تعديل', icon: 'pi pi-pencil', command: () => setIsEditing(true) },
    { label: 'حذف', icon: 'pi pi-trash', className: 'text-rose-500', command: () => onDelete(node.id) }
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-1 shadow-sm overflow-hidden mb-1">
      <div className={`p-3 flex items-center justify-between group transition-colors ${node.isCompleted ? 'bg-emerald-50/30' : ''}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button 
            onClick={() => onToggle(node.id)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-sm ${node.isCompleted ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-300 group-hover:bg-slate-50'}`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={node.isCompleted ? 'completed' : 'pending'}
                initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                {node.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </motion.div>
            </AnimatePresence>
          </button>
          
          {node.children && node.children.length > 0 && (
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-slate-400 hover:text-indigo-600 transition-colors">
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
             />
           ))}
        </div>
      )}
    </div>
  );
}

function TaskItem({ task, type, onClick }: { task: any, type: 'main' | 'side' | 'weekly', onClick?: () => void }) {
  const colors = {
    main: 'from-blue-500 to-indigo-600',
    side: 'from-amber-400 to-orange-500',
    weekly: 'from-purple-500 to-fuchsia-600'
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:shadow-lg transition-all hover:border-indigo-200 cursor-pointer active:scale-98"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[type]} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
          {task.isCompleted || task.completed ? <i className="pi pi-check font-bold"></i> : <i className="pi pi-circle text-[10px]"></i>}
        </div>
        <div className="pr-1">
          <h4 className="text-sm font-black text-slate-800 leading-none mb-1">{task.title}</h4>
          <p className="text-[10px] text-slate-400 font-bold">{(task.isCompleted || task.completed) ? 'مكتملة' : 'قيد الانتظار'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {task.activities?.length > 0 && (
          <div className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1">
            <ListChecks className="w-3 h-3 text-slate-400" />
            <span className="text-[9px] font-black text-slate-500">{task.activities.length}</span>
          </div>
        )}
        {task.xp && (
          <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
            <span className="text-[10px] font-black text-indigo-600 tracking-tighter">+{task.xp} XP</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-300">
        <Clock className="w-8 h-8" />
      </div>
      <p className="text-xs font-black text-slate-400 max-w-[200px] leading-relaxed">
        {message}
      </p>
    </div>
  );
}
