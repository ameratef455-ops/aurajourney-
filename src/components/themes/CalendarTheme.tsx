import { useState, useMemo } from "react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addWeeks, 
  subWeeks,
  getDay,
  isToday
} from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS } from "../../lib/haptics";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Plus, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Target, Info, CheckCircle2, Circle, Check, Shuffle, X } from "lucide-react";

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
}

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
  toggleSubStationTask
}: CalendarThemeProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedStationId, setSelectedStationId] = useState<string | null>(activeStationId || (stations.length > 0 ? stations[0].id : null));

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { totalHours, totalTasks, completedTasksCount, complianceRate } = useMemo(() => {
    let totalMins = 0;
    let totalT = 0;
    let completedT = 0;

    const rawSubs = user?.subStations?.[selectedStationId!] || [];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);

    calendarDays.forEach((day) => {
      const formattedDate = format(day, "yyyy-MM-dd");
      
      // 1. Database tasks (main, side, sub)
      const dayTasks = (tasks || []).filter(
        (t) => t.stationId === selectedStationId && t.dueDate === formattedDate
      );

      dayTasks.forEach((task) => {
        totalT++;
        if (task.isCompleted) {
          completedT++;
          
          let taskMins = 0;
          if (task.activities && task.activities.length > 0) {
            const sumMins = (list: any[]) => {
              let sum = 0;
              list.forEach((act) => {
                if (act.isCompleted) {
                  sum += (act.duration || 30);
                }
                if (act.children) {
                  sum += sumMins(act.children);
                }
              });
              return sum;
            };
            taskMins = sumMins(task.activities);
          }
          
          if (taskMins === 0) {
            if (task.type === "main") {
              taskMins = 45;
            } else if (task.type === "side") {
              taskMins = 30;
            } else {
              taskMins = 20; // sub
            }
          }
          totalMins += taskMins;
        }
      });

      // 2. Practical tasks (aligned with dueDate)
      stationSubs.forEach((sub: any) => {
        (sub.tasks || []).forEach((pTask: any) => {
          if (pTask.dueDate === formattedDate) {
            totalT++;
            if (pTask.isCompleted) {
              completedT++;
              totalMins += (pTask.duration || 30);
            }
          }
        });
      });
    });

    const hours = (totalMins / 60).toFixed(1);
    const rate = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;

    return {
      totalHours: parseFloat(hours),
      totalTasks: totalT,
      completedTasksCount: completedT,
      complianceRate: rate
    };
  }, [calendarDays, tasks, selectedStationId, user?.subStations]);

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  const selectedStation = stations.find(s => s.id === selectedStationId);
  const isSelectedUnlocked = selectedStation ? unlockedStations.includes(selectedStation.id) : false;

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

    // 2. Practical tasks in this station
    const rawSubs = user?.subStations?.[selectedStationId!] || [];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    stationSubs.forEach((sub: any, subIdx: number) => {
      (sub.tasks || []).forEach((t: any, taskIdx: number) => {
        const key = `practical-${subIdx}-${taskIdx}`;
        initial[key] = t.dueDate || "";
      });
    });

    setTempAssignments(initial);
    setIsArrangeModalOpen(true);
  };

  const modalTasksData = useMemo(() => {
    if (!selectedStationId) return { mains: [], subs: [], sides: [], practicals: [] };
    
    const dbTasksInStation = (tasks || []).filter(t => t.stationId === selectedStationId);
    const mains = dbTasksInStation.filter(t => t.type === 'main');
    const subs = dbTasksInStation.filter(t => t.type === 'sub');
    const sides = dbTasksInStation.filter(t => t.type === 'side');
    
    const practicals: any[] = [];
    const rawSubs = user?.subStations?.[selectedStationId] || [];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    stationSubs.forEach((sub: any, subIdx: number) => {
      (sub.tasks || []).forEach((t: any, taskIdx: number) => {
        practicals.push({
          id: `practical-${subIdx}-${taskIdx}`,
          title: t.title,
          isCompleted: t.isCompleted,
          type: 'practical',
          subIdx,
          taskIdx
        });
      });
    });

    return { mains, subs, sides, practicals };
  }, [tasks, selectedStationId, user?.subStations]);

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

    // Assign to each uncompleted practical task
    modalTasksData.practicals.filter(t => !t.isCompleted).forEach(task => {
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

  return (
    <div className="w-full max-w-full px-4 md:px-6 py-8 flex flex-col gap-8 mx-auto min-h-[85vh]" dir="rtl">
      {/* Stations Horizontal Scroller */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
             <Target className="w-5 h-5 text-blue-600 animate-pulse" /> اختار الخطة للمتابعة وعرض التقويم
           </h3>
           <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{stations.length} خطة إجمالاً</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2">
          {stations.map((st, i) => {
            const isUnlocked = unlockedStations.includes(st.id);
            const isSelected = st.id === selectedStationId;
            const isCompleted = stationEnergy[st.id] >= 130;

            return (
              <motion.button
                key={st.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setSelectedStationId(st.id);
                }}
                className={`shrink-0 flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer min-w-[120px] relative ${
                  isSelected 
                  ? 'bg-blue-900 border-blue-500 text-white shadow-xl shadow-blue-900/10' 
                  : (isUnlocked ? 'bg-white border-blue-50/50 text-slate-600 hover:border-blue-200' : 'bg-slate-50 border-transparent opacity-50 grayscale')
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/10' : 'bg-blue-50'}`}>
                  <i className={`${st.icon || 'pi pi-flag-fill'} ${isSelected ? 'text-blue-300' : 'text-blue-600'} text-xl`}></i>
                </div>
                <span className="text-xs font-black tracking-tight line-clamp-1 w-full text-center">{st.name}</span>
                {isCompleted && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <i className="pi pi-check text-[8px] text-white font-black"></i>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

    {/* Main Weekly View for Selected Station */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedStationId}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden w-full"
        >
          {/* Plan Header */}
          <div className="p-8 md:p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/10 shrink-0">
                <i className={`${selectedStation?.icon || 'pi pi-flag-fill'} text-5xl text-blue-300`}></i>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight">{selectedStation?.name}</h2>
                  <span className="px-3.5 py-1.5 bg-blue-500/25 rounded-full text-[11px] font-black tracking-widest text-blue-300 border border-blue-500/30 uppercase">
                    {isSelectedUnlocked ? 'خطة مفتوحة' : 'بإنتظار الفتح'}
                  </span>
                </div>
                {isSelectedUnlocked ? (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-white/70">طاقة الخطة الحالية:</span>
                      <span className="text-[10px] text-blue-300 font-semibold">مستوى التقدم والبطارية</span>
                    </div>
                    <div className="relative flex items-center justify-center w-14 h-14 rounded-full border border-blue-400/40 bg-gradient-to-br from-blue-600/20 to-indigo-600/30 shadow-inner shrink-0">
                      <span className="text-sm font-black text-blue-300">{stationEnergy[selectedStationId!] || 0}%</span>
                      {/* Premium pulsing border background animation */}
                      <span className="absolute -inset-1 rounded-full border border-blue-400/20 animate-pulse pointer-events-none"></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 font-bold">هذه الخطة مقفلة حالياً. أكمل الخطة النشطة لفتحها!</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
               <button 
                 onClick={() => onStationClick(selectedStationId!, isSelectedUnlocked, stations.findIndex(s => s.id === selectedStationId))}
                 className="px-8 py-4 bg-white/10 hover:bg-white/20 active:scale-95 rounded-2xl text-xs font-black transition-all flex items-center gap-2 border-none text-white cursor-pointer shadow-lg"
               >
                 <Info className="w-5 h-5 text-blue-300" /> تفاصيل الخطة الكاملة
               </button>
            </div>
          </div>

          <div className="p-8 md:p-12">
            {/* Weekly Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
               {/* 1. Total Hours */}
               <div className="bg-gradient-to-br from-indigo-50/50 via-white to-indigo-100/10 p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1.5 leading-none">
                     <span className="text-[11px] font-black text-indigo-500 uppercase tracking-wider block">إجمالي الساعات المستثمرة</span>
                     <div className="flex items-baseline gap-1 my-1">
                        <span className="text-3xl font-black text-indigo-950">{totalHours}</span>
                        <span className="text-xs font-bold text-slate-500">ساعة</span>
                     </div>
                     <span className="text-[10px] text-slate-400 font-semibold block">ساعات مخصصة للتعلم الفعلي هذا الأسبوع</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs shrink-0">
                     <i className="pi pi-clock text-2xl"></i>
                  </div>
               </div>

               {/* 2. Tasks Completed */}
               <div className="bg-gradient-to-br from-emerald-50/50 via-white to-emerald-100/10 p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1.5 leading-none">
                     <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider block">المهام المنجزة</span>
                     <div className="flex items-baseline gap-1 my-1">
                        <span className="text-3xl font-black text-emerald-950">{completedTasksCount}</span>
                        <span className="text-xs font-bold text-slate-400">/ {totalTasks} مهام</span>
                     </div>
                     <span className="text-[10px] text-slate-400 font-semibold block">مجموع ما تم إنجازه بنجاح</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
                     <i className="pi pi-check-square text-2xl"></i>
                  </div>
               </div>

               {/* 3. Commitment Rate */}
               <div className="bg-gradient-to-br from-blue-50/50 via-white to-blue-100/10 p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1.5 leading-none">
                     <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">معدل الالتزام والفاعلية</span>
                     <div className="flex items-baseline gap-1 my-1">
                        <span className="text-3xl font-black text-blue-950">{complianceRate}%</span>
                     </div>
                     <span className="text-[10px] text-slate-400 font-semibold block">نسبة التغطية الزمنية بالمحطة</span>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
                     <i className="pi pi-chart-line text-2xl"></i>
                  </div>
               </div>
            </div>
            {/* Week Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <CalendarIcon className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-800">توزيع المهام للأسبوع الحالي</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">
                       بين {format(weekStart, 'd MMMM yyyy', { locale: ar })} و {format(weekEnd, 'd MMMM yyyy', { locale: ar })}
                    </p>
                 </div>
              </div>
              <div className="flex gap-3 self-end sm:self-auto items-center">
                <button 
                  onClick={handleOpenArrangeModal}
                  className="px-6 py-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black transition-all border border-indigo-100 cursor-pointer flex items-center justify-center shadow-sm"
                >
                  <i className="pi pi-sort-amount-down ml-2"></i>
                  رتب التقويم
                </button>
                <div className="flex gap-2">
                   <button onClick={prevWeek} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all border-none cursor-pointer flex items-center justify-center shrink-0"><ChevronRight size={24} /></button>
                   <button onClick={nextWeek} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all border-none cursor-pointer flex items-center justify-center shrink-0"><ChevronLeft size={24} /></button>
                </div>
              </div>
            </div>

            {/* Weekly Grid - EXTRA SPACIOUS AND INTEGRATED */}
            <div className="flex overflow-x-auto snap-x gap-6 lg:gap-8 no-scrollbar pb-8 px-2 md:px-4">
               {calendarDays.map((day, dIdx) => {
                 const isLearningDay = learningDays.includes(getDay(day));
                 const dayIsToday = isToday(day);
                 const formattedDate = format(day, 'yyyy-MM-dd');
                 
                 // Fetch tasks assigned to this active station on this calendar day
                 const dayTasks = (tasks || []).filter(
                   t => t.stationId === selectedStationId && t.dueDate === formattedDate
                  );
                  const dayPracticalTasks: any[] = [];
                  const rawSubs = user?.subStations?.[selectedStationId!] || [];
                  const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
                  stationSubs.forEach((sub: any, subIdx: number) => {
                    (sub.tasks || []).forEach((t: any, taskIdx: number) => {
                      if (t.dueDate === formattedDate) {
                        dayPracticalTasks.push({
                          id: `practical-${subIdx}-${taskIdx}`,
                          actualId: t.id || `${subIdx}-${taskIdx}`,
                          title: t.title,
                          isCompleted: t.isCompleted,
                          type: 'practical',
                          subIdx,
                          taskIdx,
                          stationId: selectedStationId
                        });
                      }
                    });
                  });
                  const combinedDayTasks = [...dayTasks, ...dayPracticalTasks];
                  const _ignored = (1
                 );

                 return (
                    <div 
                      key={dIdx}
                      className={`snap-center shrink-0 w-[88vw] md:w-[380px] lg:w-[420px] flex flex-col justify-between gap-6 p-6 rounded-[36px] border-2 transition-all min-h-[400px] mb-4 lg:min-h-[600px] lg:h-[calc(100vh-280px)] relative group overflow-hidden ${
                        dayIsToday 
                        ? 'bg-gradient-to-b from-blue-50/50 to-indigo-50/15 border-blue-400 shadow-xl shadow-blue-500/10 md:scale-[1.02] z-10' 
                        : (isLearningDay ? 'bg-blue-50/40 border-blue-100 hover:border-blue-300 shadow-lg shadow-blue-100/40 hover:shadow-xl hover:shadow-blue-500/10' : 'bg-slate-50/60 border-transparent opacity-65')
                      }`}
                    >
                     {/* Day Stamp Header */}
                     <div className="flex-1 flex flex-col min-h-0">
                       <div className="flex justify-between items-start gap-2 max-h-min shrink-0">
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${dayIsToday ? 'text-blue-700' : 'text-slate-400'}`}>
                               {format(day, 'EEEE', { locale: ar })}
                            </span>
                            <span className={`text-xs font-bold text-slate-400 ${dayIsToday ? 'text-blue-400/90' : ''} mt-0.5`}>
                               {format(day, 'MMM d', { locale: ar })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`text-3xl md:text-4xl font-black ${dayIsToday ? 'text-blue-900 scale-110' : 'text-slate-800'}`}>
                               {format(day, 'd')}
                             </span>
                             {dayIsToday && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></div>}
                          </div>
                       </div>

                       {/* List of Scheduled Tasks for This Day */}
                       <div className="mt-8 space-y-3 flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                          {combinedDayTasks.length > 0 ? (
                            combinedDayTasks.map((task) => {
                              // Define task-type styled metadata or badges for visual hierarchy
                              const taskType = task.type || 'sub';
                              let colorClasses = '';
                              let badgeText = '';
                              let typeBadgeColor = '';

                              if (task.isCompleted) {
                                switch (taskType) {
                                  case 'main':
                                    colorClasses = 'bg-emerald-50/30 border-emerald-100/80 text-slate-400 line-through border-r-4 border-r-emerald-500';
                                    badgeText = 'رئيسي';
                                    typeBadgeColor = 'bg-slate-100 text-slate-400';
                                    break;
                                  case 'side':
                                    colorClasses = 'bg-emerald-50/20 border-emerald-100/60 text-slate-400 line-through border-r-4 border-r-amber-400/60';
                                    badgeText = 'جانبي';
                                    typeBadgeColor = 'bg-slate-100 text-slate-400';
                                    break;
                                  default: // sub
                                    colorClasses = 'bg-emerald-50/20 border-emerald-100/60 text-slate-400 line-through border-r-4 border-r-purple-400/60';
                                    badgeText = 'فرعي';
                                    typeBadgeColor = 'bg-slate-100 text-slate-400';
                                    break;
                                }
                              } else {
                                switch (taskType) {
                                  case 'main':
                                    colorClasses = 'bg-blue-50/80 hover:bg-blue-100/90 border-blue-200/70 text-blue-950 border-r-4 border-r-blue-600 shadow-3xs';
                                    badgeText = 'رئيسي';
                                    typeBadgeColor = 'bg-blue-100 text-blue-800';
                                    break;
                                  case 'side':
                                    colorClasses = 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-200/70 text-amber-950 border-r-4 border-r-amber-500 shadow-3xs';
                                    badgeText = 'جانبي';
                                    typeBadgeColor = 'bg-amber-100 text-amber-800';
                                    break;
                                  default: // sub
                                    colorClasses = 'bg-purple-50/80 hover:bg-purple-100/95 border-purple-200/70 text-purple-950 border-r-4 border-r-purple-500 shadow-3xs';
                                    badgeText = 'فرعي';
                                    typeBadgeColor = 'bg-purple-100 text-purple-800';
                                    break;
                                }
                              }

                              return (
                                <motion.div 
                                  key={task.id}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    vibrate(HAPITCS.MAJOR_CLICK);
                                    if (task.type === 'practical') {
                                      toggleSubStationTask(selectedStationId!, task.subIdx, task.actualId);
                                    } else {
                                      toggleTask(task.id, task.isCompleted, task.type);
                                    }
                                  }}
                                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col gap-2 transition-all cursor-pointer ${colorClasses}`}
                                >
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                        task.isCompleted ? 'text-emerald-600' : 'text-slate-300'
                                      }`}>
                                        {task.isCompleted ? (
                                          <CheckCircle2 size={16} className="fill-emerald-100" />
                                        ) : (
                                          <Circle size={16} />
                                        )}
                                      </div>
                                      <span className="truncate leading-tight font-black text-[12px]">{task.title}</span>
                                    </div>
                                  </div>
                                  {/* Task Type badge indicator */}
                                  <div className="flex items-center justify-end">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${typeBadgeColor} uppercase tracking-wider`}>
                                      {badgeText}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            })
                          ) : (
                            isLearningDay && (
                              <div className="text-xs text-slate-300 py-10 text-center font-bold border border-dashed border-slate-100 rounded-3xl">
                                لا توجد مهام حالياً
                              </div>
                            )
                          )}
                       </div>
                     </div>

                     {/* Action Zone/Plus Button - Replaced with indicator for type of day */}
                     <div className="mt-auto pt-3">
                        {isLearningDay ? (
                          <div className="text-xs font-black text-blue-500 text-center py-4 border border-blue-100 rounded-2xl bg-white shadow-sm shadow-blue-500/5">
                             يوم تعليمي
                          </div>
                        ) : (
                          <div className="text-xs font-black text-slate-400 text-center py-4 border border-dashed border-slate-200/50 rounded-2xl bg-slate-100/50">
                             🛋️ يوم راحة مقترح
                          </div>
                        )}
                     </div>
                   </div>
                 );
               })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
         <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
            <Target className="w-6 h-6" />
         </div>
         <div>
            <h4 className="text-sm font-black text-slate-800 mb-1">نصيحة الأسبوع لتنظيم الخطة</h4>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              ركز على إتمام المهام المضافة لزيادة طاقة الخطة. الأيام المميزة بالمحيط الأزرق هي أيام تعلمك المقررة، ويمكنك النقر على زر (+) عند كل يوم لإضافة ما تود إنجازه والبدء فوراً في إحراز التقدم!
            </p>
         </div>
      </div>

      {/* Arrange Calendar Modal */}
      <Dialog
        visible={isArrangeModalOpen}
        onHide={() => setIsArrangeModalOpen(false)}
        header={
          <div className="flex justify-between items-center w-full mt-2" dir="rtl">
            <span className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-indigo-500" />
              توزيع مهام الخطة
            </span>
          </div>
        }
        className="w-[96vw] max-w-2xl !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        blockScroll
      >
        <div className="w-full flex justify-between items-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-6 mt-2" dir="rtl">
           <div className="text-right">
              <h4 className="text-sm font-black text-indigo-900 mb-1">التوزيع الذكي</h4>
              <p className="text-xs text-indigo-600">سيقوم بتوزيع كل المهام غير المكتملة بالتساوي على أيام التعلم المحددة الخاصة بك.</p>
           </div>
           <button 
             onClick={handleAutoDistribute}
             className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex gap-2 items-center shrink-0"
           >
             <Shuffle className="w-4 h-4" /> توزيع تلقائي
           </button>
        </div>

        <div className="space-y-6" dir="rtl">
           {/* Section for unassigned tasks vs assigned? For simplicity let's just list all tasks with a date picker mapping to learning days */}
           {['mains', 'subs', 'sides', 'practicals'].map(cat => {
              const list = modalTasksData[cat as keyof typeof modalTasksData];
              if (!list || list.length === 0) return null;
              
              const typeLabels: any = {
                mains: { title: 'المهام الأساسية', icon: <Target className="w-4 h-4 text-emerald-500" /> },
                subs: { title: 'المهام الفرعية', icon: <Circle className="w-4 h-4 text-blue-500" /> },
                sides: { title: 'المهام الجانبية', icon: <Info className="w-4 h-4 text-purple-500" /> },
                practicals: { title: 'العمل التطبيقي', icon: <CheckCircle2 className="w-4 h-4 text-orange-500" /> }
              };

              return (
                <div key={cat} className="space-y-3">
                  <h5 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    {typeLabels[cat].icon} {typeLabels[cat].title}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {list.map(task => (
                      <div key={task.id} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col gap-2">
                        <span className={`text-xs font-bold ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {task.title}
                        </span>
                        <Dropdown 
                          value={tempAssignments[task.id] || ""}
                          onChange={(e) => setTempAssignments(prev => ({ ...prev, [task.id]: e.value }))}
                          options={[
                            { label: 'بدون موعد (غير مجدولة)', value: '' },
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
                          placeholder="اختر موعداً"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg shadow-sm focus:border-indigo-400 disabled:opacity-50 !h-10 flex items-center"
                          panelClassName="text-[11px] font-bold font-sans bg-white border border-slate-100 shadow-xl rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
           })}
        </div>
        
        <div className="w-full mt-8 flex gap-3 rtl:flex-row-reverse" dir="rtl">
          <button 
             onClick={handleSaveArrangementCall}
             className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all shadow-md active:scale-[0.98]"
          >
             حفظ التوزيع
          </button>
          <button 
             onClick={() => setIsArrangeModalOpen(false)}
             className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm transition-all active:scale-[0.98]"
          >
             إلغاء
          </button>
        </div>
      </Dialog>
    </div>
  );
}
