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
import { Plus, ChevronRight, ChevronLeft, Calendar as CalendarIcon, Target, Info, CheckCircle2, Circle } from "lucide-react";

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
  toggleTask
}: CalendarThemeProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedStationId, setSelectedStationId] = useState<string | null>(activeStationId || (stations.length > 0 ? stations[0].id : null));

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));

  const selectedStation = stations.find(s => s.id === selectedStationId);
  const isSelectedUnlocked = selectedStation ? unlockedStations.includes(selectedStation.id) : false;

  return (
    <div className="w-full max-w-7xl px-4 py-8 flex flex-col gap-8 mx-auto" dir="rtl">
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
                    <span className="text-sm font-bold text-white/70">طاقة الخطة الحالية:</span>
                    <div className="flex items-center gap-3">
                       <div className="w-36 h-3 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-400 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (stationEnergy[selectedStationId!] || 0) / 1.3)}%` }} 
                          />
                       </div>
                       <span className="text-sm font-black text-blue-300">{stationEnergy[selectedStationId!] || 0}%</span>
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
              <div className="flex gap-3 self-end sm:self-auto">
                <button onClick={prevWeek} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all border-none cursor-pointer flex items-center justify-center"><ChevronRight size={24} /></button>
                <button onClick={nextWeek} className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all border-none cursor-pointer flex items-center justify-center"><ChevronLeft size={24} /></button>
              </div>
            </div>

            {/* Weekly Grid - EXTRA SPACIOUS AND INTEGRATED */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-8">
               {calendarDays.map((day, dIdx) => {
                 const isLearningDay = learningDays.includes(getDay(day));
                 const dayIsToday = isToday(day);
                 const formattedDate = format(day, 'yyyy-MM-dd');
                 
                 // Fetch tasks assigned to this active station on this calendar day
                 const dayTasks = (tasks || []).filter(
                   t => t.stationId === selectedStationId && t.dueDate === formattedDate
                 );

                 return (
                   <div 
                     key={dIdx}
                     className={`flex flex-col justify-between gap-6 p-6 rounded-[36px] border-2 transition-all min-h-[420px] md:min-h-[520px] lg:min-h-[580px] xl:min-h-[640px] relative group overflow-hidden ${
                       dayIsToday 
                       ? 'bg-gradient-to-b from-blue-50/50 to-indigo-50/15 border-blue-400 shadow-xl shadow-blue-500/10 scale-[1.02] z-10' 
                       : (isLearningDay ? 'bg-white border-slate-100 hover:border-blue-200 shadow-lg shadow-slate-100/40 hover:shadow-xl hover:shadow-blue-500/5' : 'bg-slate-50/60 border-transparent opacity-65')
                     }`}
                   >
                     {/* Day Stamp Header */}
                     <div>
                       <div className="flex justify-between items-start gap-2">
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
                       <div className="mt-8 space-y-3 max-h-[220px] md:max-h-[340px] lg:max-h-[380px] xl:max-h-[440px] overflow-y-auto no-scrollbar scroll-smooth">
                          {dayTasks.length > 0 ? (
                            dayTasks.map((task) => {
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
                                    toggleTask(task.id, task.isCompleted, task.type);
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

                     {/* Action Zone/Plus Button */}
                     <div className="mt-auto pt-3">
                        {isLearningDay ? (
                          <button 
                            onClick={() => {
                              vibrate(HAPITCS.MAJOR_CLICK);
                              onAddTaskClick(day, selectedStationId!);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-600/20 transition-all border-none font-sans text-xs font-black cursor-pointer group"
                          >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            <span>إضافة مهمة</span>
                          </button>
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
    </div>
  );
}
