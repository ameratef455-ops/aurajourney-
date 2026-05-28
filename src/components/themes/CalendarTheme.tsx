import { useState, useMemo } from "react";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isToday,
  isPast,
  isSameMonth
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
  onOpenEvaluation?: (task: any) => void;
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
  toggleSubStationTask,
  onOpenEvaluation
}: CalendarThemeProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStationId, setSelectedStationId] = useState<string | null>(activeStationId || (stations.length > 0 ? stations[0].id : null));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });


  const { totalHours, totalTasks, completedTasksCount, complianceRate } = useMemo(() => {
    let totalMins = 0;
    let totalT = 0;
    let completedT = 0;

    const rawSubs = user?.subStations?.[selectedStationId!] || [];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    weekDays.forEach((day) => {
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
  }, [tasks, selectedStationId, user?.subStations]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

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

  const [selectedDay, setSelectedDay] = useState(new Date());

  const monthStateMapping = useMemo(() => {
     const mapping: Record<string, 'today' | 'completed' | 'work' | 'missed' | 'rest'> = {};
     
     calendarDays.forEach((day) => {
         const formattedDate = format(day, 'yyyy-MM-dd');
         const isDayToday = isToday(day);
         const isDayPast = isPast(day) && !isDayToday;
         const isWorkDay = learningDays.includes(getDay(day));
         
         const dayDbTasks = (tasks || []).filter(t => t.stationId === selectedStationId && t.dueDate === formattedDate);
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

         const combined = [...dayDbTasks, ...dayPracticalTasks];
         const hasTasks = combined.length > 0;
         const allCompleted = hasTasks && combined.every(t => t.isCompleted);

         if (isDayToday) {
             mapping[formattedDate] = 'today';
         } else if (allCompleted) {
             mapping[formattedDate] = 'completed';
         } else if (isDayPast && hasTasks && !allCompleted) {
             mapping[formattedDate] = 'missed';
         } else if (isWorkDay) {
             mapping[formattedDate] = 'work';
         } else {
             mapping[formattedDate] = 'rest';
         }
     });
     return mapping;
  }, [calendarDays, tasks, user?.subStations, selectedStationId, learningDays]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const formattedDate = format(selectedDay, 'yyyy-MM-dd');
    const dayDbTasks = (tasks || []).filter(t => t.stationId === selectedStationId && t.dueDate === formattedDate);
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

    return [...dayDbTasks, ...dayPracticalTasks];
  }, [selectedDay, tasks, user?.subStations, selectedStationId]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
               {/* 1. Total Hours */}
               <div className="bg-gradient-to-br from-indigo-50/50 via-white to-indigo-100/10 p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center min-h-[160px]">
                  <div className="flex items-start justify-between w-full">
                     <div className="space-y-2 leading-none">
                        <span className="text-[13px] font-black text-indigo-500 uppercase tracking-widest block">إجمالي الساعات</span>
                        <div className="flex items-baseline gap-2 my-3">
                           <span className="text-5xl lg:text-6xl font-black text-indigo-950 tracking-tight">{totalHours}</span>
                           <span className="text-sm font-bold text-slate-500">ساعة</span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold block pt-1">مخصصة للتعلم هذا الأسبوع</span>
                     </div>
                     <div className="w-16 h-16 rounded-[24px] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner shrink-0">
                        <i className="pi pi-clock text-3xl"></i>
                     </div>
                  </div>
               </div>

               {/* 2. Tasks Completed */}
               <div className="bg-gradient-to-br from-emerald-50/50 via-white to-emerald-100/10 p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center min-h-[160px]">
                  <div className="flex items-start justify-between w-full">
                     <div className="space-y-2 leading-none">
                        <span className="text-[13px] font-black text-emerald-600 uppercase tracking-widest block">المهام المنجزة</span>
                        <div className="flex items-baseline gap-2 my-3">
                           <span className="text-5xl lg:text-6xl font-black text-emerald-950 tracking-tight">{completedTasksCount}</span>
                           <span className="text-sm font-bold text-slate-400">/ {totalTasks} مهام</span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold block pt-1">إجمالي المهام المكتملة بنجاح</span>
                     </div>
                     <div className="w-16 h-16 rounded-[24px] bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner shrink-0">
                        <i className="pi pi-check-square text-3xl"></i>
                     </div>
                  </div>
               </div>

               {/* 3. Commitment Rate */}
               <div className="bg-gradient-to-br from-blue-50/50 via-white to-blue-100/10 p-8 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-center min-h-[160px]">
                  <div className="flex items-start justify-between w-full">
                     <div className="space-y-2 leading-none">
                        <span className="text-[13px] font-black text-blue-600 uppercase tracking-widest block">الالتزام</span>
                        <div className="flex items-baseline gap-2 my-3">
                           <span className="text-5xl lg:text-6xl font-black text-blue-950 tracking-tight">{complianceRate}%</span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold block pt-1">نسبة التغطية ونسبة الإنجاز</span>
                     </div>
                     <div className="w-16 h-16 rounded-[24px] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
                        <i className="pi pi-chart-line text-3xl"></i>
                     </div>
                  </div>
               </div>
            </div>
            {/* Month Nav */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <CalendarIcon className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-800">توزيع المهام الشهري</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">
                       {format(currentMonth, 'MMMM yyyy', { locale: ar })}
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
                  <button onClick={prevMonth} className="p-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm" title="الشهر السابق">
                     <ChevronRight size={18} />
                   </button>
                   <button onClick={() => setCurrentMonth(new Date())} className="px-5 py-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0 font-black text-xs shadow-sm">
                     اليوم
                   </button>
                  <button onClick={nextMonth} className="p-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm" title="الشهر التالي">
                     <ChevronLeft size={18} />
                   </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* === LEFT/TOP: MONTH GRID === */}
              <div className="w-full lg:w-3/5 border-2 border-slate-100 bg-white rounded-[32px] p-6 lg:p-8 shadow-sm">
                 {/* Weekday Headers */}
                 <div className="grid grid-cols-7 gap-3 lg:gap-4 mb-6 text-center">
                   {['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].map(dayName => (
                     <span key={dayName} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dayName}</span>
                   ))}
                  </div>
                 
                 {/* Calendar Days */}
                 <div className="grid grid-cols-7 gap-3 lg:gap-4">
                   {calendarDays.map((day, dIdx) => {
                     const formattedDate = format(day, 'yyyy-MM-dd');
                     const state = monthStateMapping[formattedDate] || 'rest';
                     const isSelectedDayObj = selectedDay && isSameDay(day, selectedDay);
                     const isCurrentMonth = isSameMonth(day, currentMonth); const hasPostponedTasks = (tasks || []).some(t => t.stationId === selectedStationId && t.dueDate === formattedDate && t.isRestDayTask);
                     
                     // State Styling definitions
                     let styleClasses = "bg-white border-transparent text-slate-600 hover:border-slate-200";
                     let dotClasses = "hidden";
                     let labelClasses = "text-slate-600 font-black text-base";
                     
                     if (!isCurrentMonth) {
                        styleClasses = "bg-slate-50/20 opacity-30 border-transparent pointer-events-none";
                        labelClasses = "text-slate-400 font-bold";
                     } else {
                        switch (state) {
                          case 'today':
                            styleClasses = "bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e1b4b] border-indigo-500 text-white shadow-[0_10px_30px_rgba(30,41,59,0.3)] z-10 font-bold scale-105";
                            labelClasses = "text-white font-black text-lg";
                            dotClasses = "w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse mt-1";
                            break;
                          case 'completed':
                            styleClasses = "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-[0_4px_15px_rgba(16,185,129,0.25)] font-bold";
                            labelClasses = "text-white font-black text-lg";
                            dotClasses = "w-1.5 h-1.5 rounded-full bg-white mt-1 shadow-sm";
                            break;
                          case 'work':
                            styleClasses = "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 text-white shadow-[0_4px_15px_rgba(59,130,246,0.25)] font-bold";
                            labelClasses = "text-white font-black text-lg";
                            dotClasses = "w-1.5 h-1.5 rounded-full bg-blue-100 mt-1 shadow-sm";
                            break;
                          case 'missed':
                            styleClasses = "bg-rose-50 border-rose-100 text-rose-700/80 font-medium hover:bg-rose-100/30";
                            labelClasses = "text-rose-600 font-bold text-base";
                            dotClasses = "w-1.5 h-1.5 rounded-full bg-rose-400 mt-1";
                            break;
                          case 'rest':
                          default:
                            styleClasses = "bg-slate-50/50 border-slate-100/60 text-slate-300 opacity-60 hover:bg-slate-100/50 hover:border-slate-200 hover:text-slate-500 font-medium";
                            labelClasses = "text-slate-400 font-bold text-base";
                            dotClasses = "hidden";
                            break;
                        }
                        
                        if (isSelectedDayObj) {
                          if (state === 'today') {
                            styleClasses += " ring-4 ring-indigo-400 shadow-xl scale-110 z-10";
                          } else if (state === 'completed') {
                            styleClasses += " ring-4 ring-emerald-300 shadow-xl scale-110 z-10";
                          } else if (state === 'work') {
                            styleClasses += " ring-4 ring-blue-300 shadow-xl scale-110 z-10";
                          } else {
                            styleClasses = styleClasses.replace('border-transparent', '').replace('border-slate-100/60', '') + " border-indigo-400 bg-indigo-50/50 scale-110 shadow-lg ring-4 ring-indigo-200 z-10";
                          }
                        }
                     }

                     return (
                       <motion.button
                         key={dIdx}
                         whileHover={isCurrentMonth ? { scale: 1.05 } : {}}
                         whileTap={isCurrentMonth ? { scale: 0.95 } : {}}
                         onClick={() => {
                           if (isCurrentMonth) {
                             vibrate(HAPITCS.MAJOR_CLICK);
                             setSelectedDay(day);
                           }
                         }}
                         className={`aspect-square sm:aspect-auto sm:h-20 flex flex-col items-center justify-center rounded-2xl border-2 transition-all cursor-pointer relative p-1 ${styleClasses}`}
                       >
                         {isCurrentMonth && hasPostponedTasks && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 z-20">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" title="يوجد مهام مؤجلة"></span>
                            </span>
                          )}
                          <span className={labelClasses}>{format(day, 'd')}</span>
                         <div className={dotClasses}></div>
                       </motion.button>
                     );
                   })}
                 </div>
              </div>

              {/* === RIGHT/BOTTOM: SELECTED DAY TASKS === */}
              <div className="w-full lg:w-2/5 border-2 border-indigo-50/80 bg-gradient-to-b from-slate-50/50 to-white rounded-[32px] p-8 shadow-sm flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                   <div>
                     <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-1">
                       {selectedDay ? format(selectedDay, 'EEEE', { locale: ar }) : 'مهام اليوم'}
                     </h4>
                     <h3 className="text-3xl font-black text-indigo-950 tracking-tight">
                       {selectedDay ? format(selectedDay, 'd MMMM', { locale: ar }) : ''}
                     </h3>
                   </div>
                   {selectedDay && isToday(selectedDay) && (
                     <span className="px-4 py-2 bg-blue-100 text-blue-700 font-black text-xs rounded-xl border border-blue-200">
                       اليوم
                     </span>
                   )}
                 </div>

                 <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-3">
                   {selectedDayTasks.length > 0 ? (
                     selectedDayTasks.map(task => {
                       const taskType = task.type || 'sub';
                       let colorClasses = '';
                       let badgeText = '';
                       let typeBadgeColor = '';

                       if (task.isRestDayTask) {
                          if (task.isCompleted) {
                            colorClasses = 'bg-rose-50/10 border-rose-100/60 text-slate-400 line-through border-r-4 border-r-rose-400/60';
                            badgeText = 'يوم إجازة';
                            typeBadgeColor = 'bg-slate-100 text-slate-400';
                          } else {
                            colorClasses = 'bg-rose-50 hover:bg-rose-100/90 border-rose-200 text-rose-950 border-r-4 border-r-rose-500 shadow-3xs';
                            badgeText = 'يوم إجازة';
                            typeBadgeColor = 'bg-rose-100 text-rose-800 font-bold';
                          }
                        } else if (task.isCompleted) {
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
                             if (task.isRestDayTask) {
                               onOpenEvaluation?.(task);
                             } else if (task.type === 'practical') {
                               toggleSubStationTask(selectedStationId!, task.subIdx, task.actualId);
                             } else {
                               toggleTask(task.id, task.isCompleted, task.type);
                             }
                           }}
                           className={`p-4 rounded-[20px] border text-xs font-bold flex flex-col gap-2 transition-all cursor-pointer ${colorClasses}`}
                         >
                           <div className="flex items-start justify-between gap-3">
                             <div className="flex items-start gap-3 min-w-0">
                               <div className={`w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0 ${
                                 task.isCompleted ? 'text-emerald-600' : 'text-slate-300'
                               }`}>
                                 {task.isCompleted ? (
                                   <CheckCircle2 size={20} className="fill-emerald-100" />
                                 ) : (
                                   <Circle size={20} />
                                 )}
                               </div>
                               <span className="leading-snug font-black text-[13px]">{task.title}</span>
                             </div>
                           </div>
                           <div className="flex items-center justify-end">
                             <span className={`text-[9px] font-black px-2.5 py-1 rounded-md ${typeBadgeColor} uppercase tracking-wider`}>
                               {badgeText}
                             </span>
                           </div>
                         </motion.div>
                       );
                     })
                   ) : (
                     <div className="flex flex-col items-center justify-center py-16 opacity-50">
                       <i className="pi pi-box text-5xl text-slate-300 mb-4"></i>
                       <p className="text-sm font-bold text-slate-400">لا توجد مهام لهذا اليوم</p>
                     </div>
                   )}
                 </div>
              </div>
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
