import { useState, useMemo } from "react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  getDay,
  isToday,
  isPast,
  addWeeks,
  subWeeks
} from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS } from "../../lib/haptics";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { confirmPopup, ConfirmPopup } from "primereact/confirmpopup";
import { 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Target, 
  Info, 
  CheckCircle2, 
  Circle, 
  Shuffle, 
  BookOpen, 
  Pencil, 
  BarChart2, 
  AlertTriangle,
  Flame
} from "lucide-react";

interface Station {
  id: string;
  name: string;
  icon: string;
  targetDate?: string;
  description?: string;
}

interface CalendarThemeProps {
  stations: Station[];
  unlockedStations: string[];
  activeStationId: string | null;
  stationEnergy: Record<string, number>;
  onStationClick: (id: string, isUnlocked: boolean, i: number) => void;
  learningDays: number[];
  onAddTaskClick: (date: Date, stationId: string) => void;
  tasks: any[];
  toggleTask: (taskId: string, isCompleted: boolean, type: string) => void;
  onArrangeCalendar: (stationId: string, weekDays: Date[]) => void;
  user: any;
  onSaveArrangement: (stationId: string, assignments: Record<string, string>) => Promise<void>;
  toggleSubStationTask: (stationId: string, subStationIndex: number, taskId: string) => void;
  onOpenEvaluation?: (task: any) => void;
  onOpenReview?: (task: any) => void;
  onOpenFlashcards?: (task: any) => void;
  onOpenAnalytics?: (task: any) => void;
  
  // Callbacks for merged items from former Tasks tab
  onShowLinks?: (stationId: string) => void;
  onShowNotes?: (stationId: string) => void;
  onShowReflection?: (stationId: string) => void;
  onShowStumble?: (stationId: string) => void;
  onShowRoutine?: () => void;
  renderTaskThreeDotsMenu?: (task: any, customOptions: any) => React.ReactNode;
  toast?: any;
  selectedStation?: string | null;
  setSelectedStation?: (stationId: string | null) => void;
}

const ARABIC_DAYS_MAP: Record<number, string> = {
  0: "الأحد",
  1: "الإثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت"
};

export function CalendarTheme({ 
  stations, 
  unlockedStations, 
  activeStationId, 
  stationEnergy, 
  onStationClick,
  learningDays,
  onAddTaskClick,
  tasks,
  toggleTask,
  onArrangeCalendar,
  user,
  onSaveArrangement,
  toggleSubStationTask,
  onOpenEvaluation,
  onOpenReview,
  onOpenFlashcards,
  onOpenAnalytics,
  onShowLinks,
  onShowNotes,
  onShowReflection,
  onShowStumble,
  onShowRoutine,
  renderTaskThreeDotsMenu,
  toast,
  selectedStation,
  setSelectedStation
}: CalendarThemeProps) {
  
  const [localSelectedStationId, setLocalSelectedStationId] = useState<string | null>(
    activeStationId || (stations.length > 0 ? stations[0].id : null)
  );

  const selectedStationId = selectedStation !== undefined && selectedStation !== null ? selectedStation : localSelectedStationId;

  const setSelectedStationId = (id: string | null) => {
    if (setSelectedStation) {
      setSelectedStation(id);
    }
    setLocalSelectedStationId(id);
  };

  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const selectedStationObj = stations.find(s => s.id === selectedStationId);
  const isSelectedUnlocked = selectedStationObj ? unlockedStations.includes(selectedStationObj.id) : false;

  const [isArrangeModalOpen, setIsArrangeModalOpen] = useState(false);
  const [tempAssignments, setTempAssignments] = useState<Record<string, string>>({});

  const handleOpenArrangeModal = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    const initial: Record<string, string> = {};
    
    // 1. Database tasks in this station
    const stationDbTasks = (tasks || []).filter(t => t.stationId === selectedStationId);
    stationDbTasks.forEach(task => {
      initial[task.id] = task.dueDate || "";
    });

    setTempAssignments(initial);
    setIsArrangeModalOpen(true);
  };

  const modalTasksData = useMemo(() => {
    if (!selectedStationId) return { mains: [], subs: [], sides: [] };
    
    const dbTasksInStation = (tasks || []).filter(t => t.stationId === selectedStationId);
    const mains = dbTasksInStation.filter(t => t.type === 'main');
    const subs = dbTasksInStation.filter(t => t.type === 'sub');
    const sides = dbTasksInStation.filter(t => t.type === 'side');
    
    return { mains, subs, sides };
  }, [tasks, selectedStationId]);

  const weekStateMapping = useMemo(() => {
     const mapping: Record<string, 'today' | 'completed' | 'has_tasks' | 'missed' | 'work_no_tasks' | 'rest'> = {};
     
     calendarDays.forEach((day) => {
         const formattedDate = format(day, 'yyyy-MM-dd');
         const isDayToday = isToday(day);
         const isDayPast = isPast(day) && !isDayToday;
         
         const dayDbTasks = (tasks || []).filter(t => t.stationId === selectedStationId && t.dueDate === formattedDate);
         
         const hasTasks = dayDbTasks.length > 0;
         const allCompleted = hasTasks && dayDbTasks.every(t => t.isCompleted);
         const isRestDay = !learningDays.includes(getDay(day));

         if (isDayToday) {
             mapping[formattedDate] = 'today';
         } else if (allCompleted) {
             mapping[formattedDate] = 'completed';
         } else if (isDayPast && hasTasks && !allCompleted) {
             mapping[formattedDate] = 'missed';
         } else if (hasTasks) {
             mapping[formattedDate] = 'has_tasks';
         } else if (isRestDay) {
             mapping[formattedDate] = 'rest';
         } else {
             mapping[formattedDate] = 'work_no_tasks';
         }
     });
     return mapping;
  }, [calendarDays, tasks, selectedStationId, learningDays]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const formattedDate = format(selectedDay, 'yyyy-MM-dd');
    const dayDbTasks = (tasks || []).filter(t => t.stationId === selectedStationId && t.dueDate === formattedDate);
    return dayDbTasks;
  }, [selectedDay, tasks, selectedStationId]);

  const handleAutoDistribute = () => {
    vibrate(HAPITCS.COMPLETE);
    const updated = { ...tempAssignments };
    const learningWeekDays = calendarDays
      .filter(day => learningDays.includes(getDay(day)))
      .map(d => format(d, "yyyy-MM-dd"));
    
    if (learningWeekDays.length === 0) return;
    
    let index = 0;
    
    // Assign to each uncompleted main task
    modalTasksData.mains.filter(t => !t.isCompleted).forEach(task => {
      updated[task.id] = learningWeekDays[index % learningWeekDays.length];
      index++;
    });

    // Assign to each uncompleted sub task
    modalTasksData.subs.filter(t => !t.isCompleted).forEach(task => {
      updated[task.id] = learningWeekDays[index % learningWeekDays.length];
      index++;
    });

    // Assign to each uncompleted side task
    modalTasksData.sides.filter(t => !t.isCompleted).forEach(task => {
      updated[task.id] = learningWeekDays[index % learningWeekDays.length];
      index++;
    });

    setTempAssignments(updated);
  };

  const handleSaveArrangementCall = async () => {
    if (!selectedStationId) return;
    vibrate(HAPITCS.COMPLETE);
    await onSaveArrangement(selectedStationId, tempAssignments);
    setIsArrangeModalOpen(false);
  };

  const nextWeek = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setCurrentWeek(prev => addWeeks(prev, 1));
  };
  const prevWeek = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setCurrentWeek(prev => subWeeks(prev, 1));
  };
  const jumpToToday = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setCurrentWeek(new Date());
    setSelectedDay(new Date());
  };

  // Derive target station ID correctly if needed

  const targetStationId = selectedStationId;
  const activeStObj = selectedStationObj;
  const stTasks = tasks?.filter(t => t.stationId === targetStationId) || [];
  const mainTasks = stTasks.filter(t => t.type === 'main');
  const completedMain = mainTasks.filter(t => t.isCompleted).length;
  const sideTasks = stTasks.filter(t => t.type === 'side');
  const completedSide = sideTasks.filter(t => t.isCompleted).length;

  return (
    <div className="w-full max-w-full px-4 md:px-6 py-6 flex flex-col gap-8 mx-auto min-h-[85vh]" dir="rtl">
      {/* 2. Unified Calendar Panel */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedStationId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-[32px] shadow-lg border border-slate-100 overflow-hidden w-full"
        >
          <div className="p-6 md:p-8">
            {/* Weekly Calendar switcher/navigator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <CalendarIcon className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-slate-800">توزيع المهام طول الإسبوع</h3>
                        <p className="text-[11px] font-bold text-slate-400 mt-1">
                           أسبوع: {format(weekStart, 'd MMMM', { locale: ar })} - {format(weekEnd, 'd MMMM yyyy', { locale: ar })}
                        </p>
                     </div>
                  </div>

                  <div className="flex gap-2 self-end sm:self-auto items-center">
                    <button 
                      onClick={handleOpenArrangeModal}
                      className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[11px] transition-all border border-indigo-100 cursor-pointer flex items-center justify-center shadow-3xs"
                    >
                      <i className="pi pi-sort-amount-down ml-1.5" />
                      رتب المواعيد
                    </button>
                    <div className="flex gap-1">
                      <button onClick={prevWeek} className="p-2 rounded-xl bg-white border border-slate-150 hover:border-blue-200 text-slate-705 cursor-pointer flex items-center justify-center shrink-0" title="الإسبوع اللي فات">
                         <ChevronRight size={15} />
                      </button>
                      <button onClick={jumpToToday} className="px-3.5 py-2 rounded-xl bg-white border border-slate-150 hover:border-blue-200 text-slate-705 cursor-pointer font-black text-[10px]">
                         النهاردة
                      </button>
                      <button onClick={nextWeek} className="p-2 rounded-xl bg-white border border-slate-150 hover:border-blue-200 text-slate-705 cursor-pointer flex items-center justify-center shrink-0" title="الإسبوع اللي جاي">
                         <ChevronLeft size={15} />
                      </button>
                    </div>
                  </div>
            </div>

            <div className="relative min-h-[400px]">
                 <motion.div
                   key="calendar-view"
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   transition={{ duration: 0.2 }}
                 >
                <div className="flex flex-col gap-6 mt-4">
                  <div className="w-full border border-slate-100 bg-slate-50/20 rounded-2xl p-5 shadow-3xs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, colIdx) => {
                        const daysInCol = calendarDays.slice(colIdx * 2, colIdx * 2 + 2);
                        if (daysInCol.length === 0) return null;
                        return (
                          <div key={colIdx} className="flex flex-col gap-3">
                            {daysInCol.map((day, dayIdx) => {
                              const formattedDate = format(day, 'yyyy-MM-dd');
                              const state = weekStateMapping[formattedDate] || 'rest';
                              const dayTasks = (tasks || []).filter(t => t.stationId === selectedStationId && t.dueDate === formattedDate);
                              const hasPostponedTasks = dayTasks.some(t => t.isRestDayTask);
                              const hasSideTask = dayTasks.some(t => t.type === 'side');
                              const isRestDay = !learningDays.includes(getDay(day));
                              
                              let styleClasses = "bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-950 border-slate-700/50 hover:border-slate-600 shadow-md";
                              let labelClasses = "text-slate-200 font-black text-sm";
                              let dayNameClasses = "text-[9px] text-slate-400 font-bold mb-1";
                              let topMark = null;

                              if (state === 'work_no_tasks' && !isToday(day)) {
                                styleClasses = "bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 border-indigo-900/40 hover:brightness-110";
                                labelClasses = "text-slate-200 font-black text-sm";
                                dayNameClasses = "text-[9px] text-slate-300/80 font-bold mb-1";
                              } else if (state === 'rest' && !isToday(day)) {
                                styleClasses = isRestDay ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 hover:border-blue-200 shadow-sm" : "bg-white border-slate-150 hover:bg-slate-50";
                                labelClasses = "text-slate-700 font-black text-sm";
                                dayNameClasses = "text-[9px] text-slate-400 font-semibold mb-1";
                              } else {
                                switch (state) {
                                  case 'today':
                                    styleClasses = "bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)] scale-[1.01]";
                                    labelClasses = "text-white font-black text-sm";
                                    dayNameClasses = "text-[9px] text-indigo-200 font-extrabold mb-1";
                                    break;
                                  case 'completed':
                                    styleClasses = "bg-gradient-to-br from-indigo-950 via-blue-950 to-emerald-950 border-emerald-500/50";
                                    labelClasses = "text-emerald-50 font-black text-sm";
                                    dayNameClasses = "text-[9px] text-emerald-400/80 font-bold mb-1";
                                    topMark = <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="أيام خلصت" />;
                                    break;
                                  case 'has_tasks':
                                    styleClasses = "bg-gradient-to-br from-indigo-950 via-blue-950 to-rose-950 border-rose-500/50";
                                    labelClasses = "text-rose-50 font-black text-sm";
                                    dayNameClasses = "text-[9px] text-rose-400/80 font-bold mb-1";
                                    topMark = <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" title="يوم عليه مهام شغالة" />;
                                    break;
                                  case 'missed':
                                    styleClasses = "bg-rose-950/30 border-rose-900/50 hover:bg-rose-900/40";
                                    labelClasses = "text-rose-400 font-bold text-sm";
                                    dayNameClasses = "text-[9px] text-rose-500/60 font-semibold mb-1";
                                    break;
                                  default:
                                    break;
                                }
                              }
        
                              const arDayName = format(day, 'E', { locale: ar }); 
        
                              return (
                                <div
                                  key={dayIdx}
                                  className={`p-3 flex flex-col rounded-xl border transition-all relative min-h-[100px] ${styleClasses}`}
                                >
                                  {topMark}
                                  {hasPostponedTasks && (
                                      <span className="absolute top-2 right-2 flex h-2 w-2 z-20">
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" title="عندك مهام متأجلة"></span>
                                      </span>
                                  )}
                                  <div className="flex flex-col items-center justify-center mb-3">
                                    <span className={dayNameClasses}>{arDayName}</span>
                                    <div className="flex items-center gap-1">
                                      <span className={labelClasses}>{format(day, 'd')}</span>
                                      {hasSideTask && <span className="text-[10px] text-amber-400 animate-pulse">⭐</span>}
                                    </div>
                                    <span className={`text-[8px] font-black mt-1 uppercase tracking-tighter ${isRestDay ? 'text-blue-600' : 'text-indigo-400 opacity-60'}`}>
                                      {isRestDay ? 'راحة' : 'عمل'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-col gap-1.5 w-full">
                                    {dayTasks.map(task => (
                                      <div 
                                        key={task.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          vibrate(HAPITCS.MAJOR_CLICK);
                                          if (task.isRestDayTask) {
                                            toast?.current?.show({ 
                                              severity: 'info', 
                                              summary: 'مهمة متأجلة', 
                                              detail: 'المهمة ديه متأجلة كانت مفروض تخلص قبل كدة.',
                                              life: 3000 
                                            });
                                          }
                                          onOpenEvaluation?.(task);
                                        }}
                                        className={`w-full text-right px-2 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all border ${
                                          task.isCompleted 
                                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 line-through decoration-emerald-500/30' 
                                            : 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <Circle size={8} className={task.isCompleted ? "fill-emerald-400 text-emerald-400 shrink-0" : "text-slate-400 shrink-0"} />
                                          <span className="truncate">{task.title}</span>
                                        </div>
                                      </div>
                                    ))}
                                    {dayTasks.length === 0 && (
                                       <div className="text-center text-[9px] text-slate-500 font-semibold italic mt-2 opacity-60">{isRestDay ? 'راحة' : 'يوم عمل'}</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="border-t border-slate-150/65 my-1" />

      {/* Arrange Calendar Modal */}
      <Dialog
        visible={isArrangeModalOpen}
        onHide={() => setIsArrangeModalOpen(false)}
        header={
          <div className="flex justify-between items-center w-full mt-2" dir="rtl">
            <span className="text-xs font-black text-slate-800 flex items-center gap-2">
              <CalendarIcon className="w-4.5 h-4.5 text-blue-500" />
              تحديد مواعيد المهام
            </span>
          </div>
        }
        className="w-[96vw] max-w-xl !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        blockScroll
        onShow={() => vibrate(HAPITCS.MAJOR_CLICK)}
      >
        <div className="w-full flex-col bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 mb-5 mt-2 gap-3 flex" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h4 className="text-xs font-black text-blue-900 mb-0.5">جدولة المحطة</h4>
              <p className="text-[10px] text-blue-700 leading-relaxed font-semibold">قم باختيار المواعيد المناسبة لكل مهمة لضمان الالتزام بجدولك الزمني.</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <label className="text-[9px] font-black text-indigo-400 uppercase">تاريخ موحد للمهام</label>
              <Calendar 
                onChange={(e) => {
                  if (e.value instanceof Date) {
                    const d = new Date(e.value);
                    d.setHours(12, 0, 0, 0);
                    const dateStr = d.toISOString().split('T')[0];
                    const updated = { ...tempAssignments };
                    [...modalTasksData.mains, ...modalTasksData.sides].forEach(t => {
                      updated[t.id] = dateStr;
                    });
                    setTempAssignments(updated);
                    vibrate(HAPITCS.SUCCESS);
                  }
                }}
                placeholder="تحديد تاريخ للكل"
                readOnlyInput
                className="w-32 custom-calendar-mini"
                inputClassName="!bg-white !border-indigo-200 !text-indigo-700 !text-[10px] !font-black !rounded-lg !p-1.5 !h-8"
                showIcon
                minDate={new Date()}
                icon={() => <i className="pi pi-calendar-plus text-indigo-500 text-xs" />}
                appendTo={typeof document !== 'undefined' ? document.body : null}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 no-scrollbar pb-48" dir="rtl">
           {['mains', 'sides'].map(cat => {
              const list = modalTasksData[cat as keyof typeof modalTasksData];
              if (!list || list.length === 0) return null;
              
              const typeLabels: any = {
                mains: { title: 'المهام الأساسية', icon: <Target className="w-3.5 h-3.5 text-emerald-500" /> },
                sides: { title: 'المهام الجانبية', icon: <Info className="w-3.5 h-3.5 text-purple-500" /> },
              };

              return (
                <div key={cat} className="space-y-3">
                  <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    {typeLabels[cat].icon} {typeLabels[cat].title}
                  </h5>
                  <div className="grid grid-cols-1 gap-3">
                    {list.map(task => (
                      <div key={task.id} className="p-3 bg-white border border-slate-150 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-blue-200 transition-colors">
                        <span className={`text-xs font-bold ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {task.title}
                        </span>
                        
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">موعد التنفيذ</label>
                            {tempAssignments[task.id] && (
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 flex items-center gap-1">
                                <span className="font-extrabold">{format(new Date(tempAssignments[task.id]), 'EEEE', { locale: ar })}</span>
                                <span className="text-slate-300">|</span>
                                <span>{format(new Date(tempAssignments[task.id]), 'd MMMM', { locale: ar })}</span>
                              </span>
                            )}
                          </div>
                          <div className="relative group">
                            <Calendar 
                              value={tempAssignments[task.id] ? new Date(tempAssignments[task.id]) : null}
                              onChange={(e) => {
                                if (e.value instanceof Date) {
                                  // Normalize to midday to avoid timezone issues
                                  const d = new Date(e.value);
                                  d.setHours(12, 0, 0, 0);
                                  setTempAssignments(prev => ({ ...prev, [task.id]: d.toISOString().split('T')[0] }));
                                  vibrate(HAPITCS.SUCCESS);
                                } else {
                                  setTempAssignments(prev => ({ ...prev, [task.id]: "" }));
                                }
                              }}
                              dateFormat="dd/mm/yy"
                              placeholder="إختر تاريخ"
                              readOnlyInput
                              className="w-full custom-calendar-mini transition-all"
                              inputClassName="!bg-white !border-indigo-100 !text-indigo-700 !text-[10px] !font-black !rounded-lg !p-1.5 !h-8 shadow-sm hover:!border-indigo-300"
                              panelClassName="p-3 bg-white border border-slate-100 shadow-xl rounded-2xl font-sans"
                              minDate={new Date()}
                              showIcon
                              icon={() => <i className="pi pi-calendar-plus text-indigo-500 text-xs" />}
                              appendTo={typeof document !== 'undefined' ? document.body : null}
                            />
                            {/* Blue gradient highlight on hover via CSS sibling */}
                            <style>{`
                              .custom-calendar-blue .p-inputtext:hover {
                                border-color: #3b82f6 !important;
                                background: linear-gradient(to right, #f8fafc, #eff6ff) !important;
                              }
                              .p-datepicker {
                                border-radius: 20px !important;
                                box-shadow: 0 10px 40px rgba(0,0,0,0.08) !important;
                                border: 1px solid #f1f5f9 !important;
                                padding: 16px !important;
                              }
                              .p-datepicker .p-datepicker-header {
                                background: transparent !important;
                                border-bottom: 1px solid #f1f5f9 !important;
                                margin-bottom: 8px !important;
                                padding: 8px 0 !important;
                              }
                              .p-datepicker .p-datepicker-title .p-datepicker-month, .p-datepicker .p-datepicker-title .p-datepicker-year {
                                font-weight: 900 !important;
                                color: #1e293b !important;
                                font-family: sans-serif !important;
                              }
                              .p-datepicker table td > span.p-highlight {
                                background: linear-gradient(135deg, #3b82f6, #6366f1) !important;
                                color: white !important;
                                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
                              }
                              .p-datepicker table td > span:hover {
                                background: #f1f5f9 !important;
                                border-radius: 50% !important;
                              }
                            `}</style>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
           })}
        </div>
        
        <div className="w-full mt-6 flex gap-2 rtl:flex-row-reverse pb-1" dir="rtl">
          <button 
             onClick={handleSaveArrangementCall}
             className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition-all shadow-sm border-none cursor-pointer"
          >
             إحفظ التوزيع
          </button>
          <button 
             onClick={() => setIsArrangeModalOpen(false)}
             className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-205 text-slate-600 font-bold text-xs transition-all border-none cursor-pointer"
          >
             إلغاء
          </button>
        </div>
      </Dialog>
    </div>
  );
}
