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
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
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

  const [activityTask, setActivityTask] = useState<any>(null);
  const [activeView, setActiveView] = useState<'calendar' | 'visual'>('calendar');

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

            <div className="flex gap-4 border-b border-slate-100 mb-6 px-2">
              <button
                onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setActiveView('calendar') }}
                className={`py-3 px-4 font-black text-xs transition-all relative ${activeView === 'calendar' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <div className="flex items-center gap-2">
                  <i className="pi pi-calendar" /> التقويم
                </div>
                {activeView === 'calendar' && (
                  <motion.div layoutId="calendarTabIndicator" className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-indigo-600 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => { vibrate(HAPITCS.MAJOR_CLICK); setActiveView('visual') }}
                className={`py-3 px-4 font-black text-xs transition-all relative ${activeView === 'visual' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <div className="flex items-center gap-2">
                  <i className="pi pi-sitemap" /> المخطط البصري
                </div>
                {activeView === 'visual' && (
                  <motion.div layoutId="calendarTabIndicator" className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-indigo-600 rounded-t-full" />
                )}
              </button>
            </div>

            <div className="relative min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeView === 'calendar' ? (
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
                ) : (
                <motion.div
                  key="visual-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                <div className="mt-6 flex flex-col gap-6 w-full p-6 bg-slate-50/30 rounded-2xl border border-slate-100">
                   {/* Visual Chart using a tree-like aesthetic */}
                   <div className="flex flex-col items-center w-full relative">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white z-10">
                         <Target size={28} />
                      </div>
                      <div className="absolute top-16 bottom-0 w-1 bg-blue-100 rounded-full" />
                      
                      <div className="flex flex-col gap-5 w-full max-w-2xl relative z-10">
                        {['mains', 'subs', 'sides'].map((cat, catIdx) => {
                          const catTasks = modalTasksData[cat as keyof typeof modalTasksData];
                          if (!catTasks || catTasks.length === 0) return null;
                          return (
                            <div key={cat} className="flex gap-4 w-full justify-center">
                              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 relative flex flex-col gap-3 transition-all hover:shadow-md">
                                <h4 className="text-[11px] font-black text-slate-800 text-right pb-2 border-b border-slate-50">
                                  {cat === 'mains' ? 'المهام الأساسية' : cat === 'subs' ? 'المهام الفرعية' : 'المهام الجانبية'}
                                </h4>
                                {catTasks.map(task => (
                                  <div key={task.id} className="flex justify-between items-center gap-3 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/60">
                                     <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                        <span className={`text-[10px] font-bold truncate text-right ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                          {task.title}
                                        </span>
                                        <div 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (task.isCompleted) {
                                              confirmPopup({
                                                target: e.currentTarget as HTMLElement,
                                                message: 'هل أنت متأكد من التراجع عن إكمال هذه المهمة؟ سيتم اعتبارها غير مكتملة وتحتاج لمراجعة الموعد.',
                                                icon: 'pi pi-exclamation-triangle',
                                                acceptLabel: 'نعم، تراجع',
                                                rejectLabel: 'إلغاء',
                                                className: 'font-sans text-xs',
                                                accept: () => toggleTask(task.id, task.isCompleted, task.type)
                                              });
                                            } else {
                                              toggleTask(task.id, task.isCompleted, task.type);
                                            }
                                          }} 
                                          className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer ${task.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}
                                        >
                                          {task.isCompleted && <i className="pi pi-check text-[7px] text-white"></i>}
                                        </div>
                                     </div>
                                     {task.isCompleted && renderTaskThreeDotsMenu && (
                                       <div className="shrink-0 flex items-center gap-1">
                                          {renderTaskThreeDotsMenu(task, {
                                            onReview: () => onOpenReview?.(task),
                                            onFlashcard: () => onOpenFlashcards?.(task),
                                            onAnalytics: () => onOpenAnalytics?.(task)
                                          })}
                                       </div>
                                     )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>
                </motion.div>
                )}
              </AnimatePresence>
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
              <Shuffle className="w-4.5 h-4.5 text-indigo-500" />
              وزع مهام الخطة على الإسبوع
            </span>
          </div>
        }
        className="w-[96vw] max-w-xl !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        blockScroll
      >
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-5 mt-2 gap-3" dir="rtl">
           <div className="text-right">
              <h4 className="text-xs font-black text-indigo-900 mb-0.5">التوزيع الذكي للمهام</h4>
              <p className="text-[10px] text-indigo-650 leading-relaxed font-semibold">هوزعلك كل المهام اللى لسه مخلصتش بالتساوى على أيام المذاكرة بتاعتك فى الأسبوع ده.</p>
           </div>
           <button 
             onClick={handleAutoDistribute}
             className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black transition-all shadow-sm flex gap-1.5 items-center shrink-0 border-none cursor-pointer"
           >
             <Shuffle className="w-3.5 h-3.5" /> وزع يا بطل
           </button>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar" dir="rtl">
           {['mains', 'sides'].map(cat => {
              const list = modalTasksData[cat as keyof typeof modalTasksData];
              if (!list || list.length === 0) return null;
              
              const typeLabels: any = {
                mains: { title: 'المهام الأساسية', icon: <Target className="w-3.5 h-3.5 text-emerald-500" /> },
                sides: { title: 'المهام الجانبية', icon: <Info className="w-3.5 h-3.5 text-purple-500" /> },
              };

              return (
                <div key={cat} className="space-y-2">
                  <h5 className="text-[11px] font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    {typeLabels[cat].icon} {typeLabels[cat].title}
                  </h5>
                  <div className="grid grid-cols-1 gap-2">
                    {list.map(task => (
                      <div key={task.id} className="p-2.5 bg-white border border-slate-150 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                        <span className={`text-[10px] font-bold ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'} truncate max-w-[180px]`}>
                          {task.title}
                        </span>
                        <Dropdown 
                          value={tempAssignments[task.id] || ""}
                          onChange={(e) => setTempAssignments(prev => ({ ...prev, [task.id]: e.value }))}
                          options={[
                            { label: 'من غير موعد (مش مجدولة)', value: '' },
                            ...calendarDays.sort((a,b) => a.getTime() - b.getTime()).map(d => {
                               const isLD = learningDays.includes(getDay(d));
                               const dateStr = format(d, "yyyy-MM-dd");
                               return {
                                 label: `${format(d, "EEEE, d MMM", { locale: ar })} ${isLD ? '⭐' : ''}`,
                                 value: dateStr
                                };
                            })
                          ]}
                          disabled={task.isCompleted}
                          placeholder="اختار يوم"
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-black rounded-lg shadow-sm focus:border-indigo-400 disabled:opacity-50 !h-8.5 flex items-center min-w-[140px]"
                          panelClassName="text-[10px] font-bold bg-white border border-slate-100 shadow-md rounded-lg"
                        />
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

      <Dialog
        visible={!!activityTask}
        onHide={() => setActivityTask(null)}
        header={
          <div className="flex justify-between items-center w-full" dir="rtl">
            <span className="text-xs font-black text-slate-800 flex items-center gap-2">
              <i className="pi pi-bolt text-blue-500" />
              أنشطة المهمة
            </span>
          </div>
        }
        className="w-[90vw] max-w-sm !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        blockScroll
      >
        {activityTask && (
          <div className="flex flex-col gap-5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100" dir="rtl">
            <h3 className="font-extrabold text-sm text-slate-800 text-center leading-relaxed">
              {activityTask.title}
            </h3>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  toggleTask(activityTask.id, activityTask.isCompleted, activityTask.type);
                  // Update local modal state so it reacts immediately visually
                  setActivityTask((prev: any) => ({ ...prev, isCompleted: !prev.isCompleted }));
                }}
                className={`py-3 rounded-xl font-bold text-[11px] transition-all flex justify-center items-center gap-2 ${
                  activityTask.isCompleted 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 border-none'
                }`}
              >
                {activityTask.isCompleted ? (
                  <><i className="pi pi-check" /> مكتملة</>
                ) : (
                  <><i className="pi pi-circle" /> خلصتها</>
                )}
              </button>

              <button
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  onOpenEvaluation?.(activityTask);
                  setActivityTask(null);
                }}
                className="py-3 rounded-xl font-bold text-[11px] transition-all flex justify-center items-center gap-2 bg-rose-50 text-rose-600 shadow-sm border border-rose-100 hover:bg-rose-100"
              >
                <i className="pi pi-calendar-plus" /> أجل المهمة
              </button>

              {activityTask.isCompleted && renderTaskThreeDotsMenu && (
                <div className="flex justify-center mt-2 p-2 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  {renderTaskThreeDotsMenu(activityTask, {
                    onReview: () => onOpenEvaluation?.(activityTask),
                    onFlashcard: () => onOpenEvaluation?.(activityTask),
                    onAnalytics: () => onOpenEvaluation?.(activityTask)
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
