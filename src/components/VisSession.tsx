import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Play, 
  BookOpen, 
  ListTodo, 
  AlignLeft, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Clock,
  ArrowRight,
  Info,
  Youtube,
  FileText
} from 'lucide-react';
import { Task, db, TaskActivity } from '../db';
import { parseLearningResources, LearningResourceItem } from '../types';
import { YouGlishWidget } from './LanguageTools';
import { vibrate, HAPITCS } from '../lib/haptics';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';

interface VisSessionProps {
  visible: boolean;
  onHide: () => void;
  task: Task | null;
  onCompleteTask?: (taskId: string) => void;
  onOpenReflection?: (task: Task) => void;
}

export function VisSession({ visible, onHide, task, onCompleteTask, onOpenReflection }: VisSessionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<TaskActivity | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      setSelectedActivity(null);
    }
  }, [visible]);

  if (!task) return null;

  const activities = task.activities || [];
  const resources = parseLearningResources(task.learningResources);

  const toggleActivity = async (activityId: string) => {
    if (task.isCompleted) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    
    const updatedActivities = activities.map(act => {
      if (act.id === activityId) {
        const newStatus = !act.isCompleted;
        const updatedSteps = (act.steps || []).map(s => ({ ...s, isCompleted: newStatus }));
        return { ...act, isCompleted: newStatus, steps: updatedSteps };
      }
      return act;
    });

    const allActivitiesCompleted = updatedActivities.length > 0 && updatedActivities.every(a => a.isCompleted);
    const taskJustCompleted = allActivitiesCompleted && !task.isCompleted;

    await (db.tasks as any).update(task.id, {
      activities: updatedActivities,
      isCompleted: allActivitiesCompleted
    });

    if (taskJustCompleted) {
      vibrate(HAPITCS.SUCCESS);
      confetti({ zIndex: 999999999, particleCount: 150, spread: 70, origin: { y: 0.6 } });
      toast.success("أحسنت! أنهيت جميع الأنشطة بنجاح 🏆");
      if (onCompleteTask) onCompleteTask(task.id);
      if (onOpenReflection) onOpenReflection(task);
    } else {
       toast.success("تم تحديث حالة النشاط");
    }
  };

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      maximized
      modal
      className="vis-session-dialog font-sans"
      showHeader={false}
      contentClassName="p-0 bg-[#05091a] text-white overflow-hidden"
    >
      <div className="flex flex-col h-screen overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a1025]/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={onHide}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">VIS SESSION</span>
              <h1 className="text-sm font-black text-white leading-none truncate max-w-[200px] md:max-w-md">{task.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {task.isCompleted && (
               <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                 <CheckCircle2 className="w-3 h-3" />
                 <span className="text-[10px] font-black uppercase">مكتملة</span>
               </div>
            )}
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex items-center justify-center bg-[#0a1025]/40 border-b border-white/5 shrink-0">
          {[
            { id: 0, label: 'ترحيب', icon: Sparkles },
            { id: 1, label: 'تفاصيل', icon: Info },
            { id: 2, label: 'التنفيذ', icon: ListTodo }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                vibrate(HAPITCS.GUIDANCE);
                setActiveIndex(tab.id);
              }}
              className={`px-8 py-4 flex items-center gap-2 transition-all border-b-2 font-black text-xs uppercase tracking-widest
                ${activeIndex === tab.id 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-white/40 hover:text-white/60'}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeIndex === 0 && (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="h-full flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center"
              >
                <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mb-10 shadow-2xl shadow-indigo-500/20 ring-4 ring-white/5">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
                  أهلاً بك في جلسة <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">بدء التنفيذ الفعلي</span>
                </h2>
                <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-sm max-w-2xl w-full">
                  <p className="text-xl md:text-2xl font-bold text-gray-300 leading-relaxed italic">
                    "{task.startMessage || "ابدأ رحلة التعلم اليوم بشغف وإصرار، كل خطوة صغيرة تقربك من هدفك الكبير."}"
                  </p>
                </div>
                <button 
                  onClick={() => setActiveIndex(1)}
                  className="mt-12 px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                  <span>استكشاف تفاصيل المهمة</span>
                </button>
              </motion.div>
            )}

            {activeIndex === 1 && (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto p-4 md:p-10"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Detailed Modal-like Card */}
                  <div className="bg-[#101935] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="h-32 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-900 p-8 flex items-end justify-between relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10">
                          <BookOpen className="w-40 h-40" />
                       </div>
                       <div className="relative z-10">
                         <div className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full inline-block mb-2">بطاقة المهمة الشاملة</div>
                         <h2 className="text-3xl font-black text-white">{task.title}</h2>
                       </div>
                       <div className="relative z-10 flex flex-col items-end">
                         <span className="text-white/60 text-xs font-bold mb-1 uppercase tracking-widest">مستوى الطاقة</span>
                         <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                               <div key={i} className={`w-1.5 h-6 rounded-full ${i <= 3 ? 'bg-amber-400' : 'bg-white/20'}`} />
                            ))}
                         </div>
                       </div>
                    </div>

                    <div className="p-8 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-6">
                             <div className="space-y-3">
                               <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                  <AlignLeft className="w-4 h-4" />
                                  وصف المسار والأهداف
                               </h4>
                               <p className="text-gray-300 text-lg leading-relaxed font-medium">
                                 {task.description || "لا يوجد وصف لهذه المهمة حالياً، ركز على الأهداف والأنشطة العملية لتحقيق أقصى استفادة."}
                               </p>
                             </div>

                             <div className="space-y-3">
                               <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                  <Sparkles className="w-4 h-4" />
                                  رسالة البدء والتحفيز
                               </h4>
                               <div className="p-5 bg-white/5 border-r-4 border-amber-500 rounded-2xl italic text-gray-400 font-medium">
                                  "{task.startMessage || "انطلق الآن لتحقيق التميز في هذه المهارة."}"
                               </div>
                             </div>

                             {task.endMessage && (
                               <div className="space-y-3">
                                 <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    رسالة الإنجاز المستهدفة
                                 </h4>
                                 <div className="p-5 bg-white/5 border-r-4 border-emerald-500 rounded-2xl italic text-gray-400 font-medium">
                                    "{task.endMessage}"
                                 </div>
                               </div>
                             )}
                          </div>

                          <div className="space-y-6">
                             <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                                <h4 className="text-xs font-black text-white/40 uppercase tracking-widest">إحصائيات التنفيذ</h4>
                                <div className="space-y-4">
                                   <div className="flex items-center justify-between">
                                      <span className="text-gray-500 text-xs font-bold">الأنشطة المخططة</span>
                                      <span className="text-white font-black">{activities.length}</span>
                                   </div>
                                   <div className="flex items-center justify-between">
                                      <span className="text-gray-500 text-xs font-bold">المصادر المتاحة</span>
                                      <span className="text-white font-black">{resources.length}</span>
                                   </div>
                                   <div className="flex items-center justify-between">
                                      <span className="text-gray-500 text-xs font-bold">النوع</span>
                                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-black uppercase">
                                         {task.type === 'main' ? 'أساسية' : task.type === 'sub' ? 'فرعية' : 'عملية'}
                                      </span>
                                   </div>
                                </div>
                             </div>

                             <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl">
                                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3">توجيه عام 💡</h4>
                                <p className="text-amber-200/60 text-xs leading-relaxed font-bold">
                                   استثمر المصادر التعليمية المرفقة بعناية قبل البدء بالتنفيذ الفعلي للأنشطة لضمان أفضل جودة للمخرجات.
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex justify-center pt-4 pb-10">
                     <button 
                      onClick={() => setActiveIndex(2)}
                      className="px-12 py-5 bg-white text-indigo-950 rounded-[28px] font-black text-lg transition-all shadow-2xl active:scale-95 flex items-center gap-3 hover:bg-gray-100"
                    >
                      <span>ابدأ رحلة التنفيذ العملي</span>
                      <ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeIndex === 2 && (
              <motion.div 
                key="execution"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex overflow-hidden lg:flex-row flex-col"
              >
                {/* Left: Activities List */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 border-l border-white/5 custom-scrollbar">
                  <div className="max-w-2xl mx-auto space-y-8">
                    <header className="space-y-2">
                       <h3 className="text-2xl font-black text-white">الأنشطة والمهام التنفيذية ⚡</h3>
                       <p className="text-sm font-medium text-gray-500">اختر النشاط الذي تود البدء به الآن لاستكشاف توجيهاته ومصادر التعلم الخاصة به.</p>
                    </header>

                    <div className="space-y-4">
                      {activities.map((act) => (
                        <div 
                          key={act.id}
                          onClick={() => {
                            vibrate(HAPITCS.GUIDANCE);
                            setSelectedActivity(act);
                          }}
                          className={`group w-full text-right p-6 rounded-[32px] border transition-all cursor-pointer relative overflow-hidden
                            ${selectedActivity?.id === act.id 
                              ? 'bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-600/20' 
                              : 'bg-white/5 border-white/10 hover:border-white/20 active:scale-[0.98]'}`}
                        >
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActivity(act.id);
                                }}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border-2
                                  ${act.isCompleted 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-white/20 bg-black/20 hover:border-white/40'}`}
                              >
                                {act.isCompleted && <CheckCircle2 className="w-5 h-5" />}
                              </button>
                              <div className="flex flex-col">
                                <span className={`text-base font-black transition-colors ${selectedActivity?.id === act.id ? 'text-white' : (act.isCompleted ? 'text-gray-500' : 'text-gray-200')}`}>
                                  {act.title}
                                </span>
                                {act.duration && (
                                  <span className={`text-[10px] font-bold mt-0.5 opacity-60 flex items-center gap-1 ${selectedActivity?.id === act.id ? 'text-white' : 'text-gray-300'}`}>
                                    <Clock className="w-3 h-3" />
                                    {act.duration} دقيقة
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 transition-all ${selectedActivity?.id === act.id ? 'text-white translate-x-0' : 'text-white/20 -translate-x-2'}`} />
                          </div>
                          
                          {/* Progress indicator */}
                          {act.steps && act.steps.length > 0 && (
                            <div className="mt-4 h-1 w-full bg-black/20 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-white transition-all duration-500" 
                                 style={{ width: `${(act.steps.filter(s => s.isCompleted).length / act.steps.length) * 100}%` }}
                               />
                            </div>
                          )}
                        </div>
                      ))}

                      {activities.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/5 border border-dashed border-white/10 rounded-[40px]">
                           <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/20">
                              <ListTodo className="w-8 h-8" />
                           </div>
                           <p className="text-gray-500 font-bold">لا يوجد أنشطة مفصلة لهذه المهمة حالياً.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Knowledge Forest & Guidance */}
                <div className="flex-1 bg-[#0a1025]/60 backdrop-blur-xl border-r border-white/5 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
                  <AnimatePresence mode="wait">
                    {selectedActivity ? (
                      <motion.div 
                        key={selectedActivity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-10"
                      >
                         <header className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border border-amber-500/20">
                                 توجيه وإدارة النشاط
                              </div>
                              <button 
                                onClick={() => setSelectedActivity(null)}
                                className="text-gray-500 hover:text-white transition-all"
                              >
                                <span className="text-xs font-bold">إخفاء التفاصيل</span>
                              </button>
                            </div>
                            <h3 className="text-3xl font-black text-white">{selectedActivity.title}</h3>
                         </header>

                         {/* Guidance Section */}
                         {selectedActivity.guidance && (
                            <div className="p-6 bg-gradient-to-br from-indigo-600/10 to-blue-600/10 border border-white/10 rounded-[32px] relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
                               <div className="flex gap-4">
                                  <Info className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                                  <div className="space-y-2">
                                     <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest">توجيه التنفيذ 🧭</h4>
                                     <p className="text-gray-200 text-base font-medium leading-relaxed">
                                        {selectedActivity.guidance}
                                     </p>
                                  </div>
                               </div>
                            </div>
                         )}

                         {/* Knowledge Forest Section */}
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                               <div className="h-[1px] flex-1 bg-white/5" />
                               <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em]">غابة المعرفة والمصادر 🍃</h4>
                               <div className="h-[1px] flex-1 bg-white/5" />
                            </div>

                            {/* Media Link/File at Top */}
                            <div className="space-y-4">
                               {resources.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {resources.map((res) => (
                                      <a 
                                        key={res.id}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between group transition-all"
                                      >
                                        <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-all">
                                              <FileText className="w-5 h-5" />
                                           </div>
                                           <span className="text-xs font-black text-white">{res.name || "رابط مصدر خارجي"}</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white transition-all" />
                                      </a>
                                    ))}
                                  </div>
                               ) : (
                                  <div className="text-center py-6 text-gray-600 text-xs font-bold bg-white/2 border border-dashed border-white/5 rounded-2xl">
                                     لا توجد ملفات أو روابط إضافية لهذه المهمة.
                                  </div>
                               )}
                            </div>

                            {/* Embeds Section */}
                            <div className="space-y-12 pt-6">
                               {/* YouTube */}
                               {task.youtubeUrl && (
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-2 text-rose-500">
                                        <Youtube className="w-5 h-5" />
                                        <h4 className="text-sm font-black">شرح فيديو مرئي</h4>
                                     </div>
                                     <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black aspect-video">
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
                                             videoId = task.youtubeUrl.length === 11 ? task.youtubeUrl : '';
                                          }
                                          const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : task.youtubeUrl;
                                          return (
                                            <iframe 
                                              width="100%" 
                                              height="100%" 
                                              src={embedUrl}
                                              title="YouTube" 
                                              frameBorder="0" 
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                              allowFullScreen
                                            ></iframe>
                                          );
                                        })()}
                                     </div>
                                  </div>
                               )}

                               {/* Google Drive */}
                               {task.googleDriveUrl && (
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-2 text-indigo-400">
                                        <i className="pi pi-google border border-white/10 p-0.5 rounded text-[10px]" />
                                        <h4 className="text-sm font-black">مادة تعليمية مدمجة (درايف)</h4>
                                     </div>
                                     <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white h-[600px]">
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
                                              title="Drive" 
                                              frameBorder="0" 
                                              allowFullScreen
                                            ></iframe>
                                          );
                                        })()}
                                     </div>
                                  </div>
                               )}

                               {/* YouGlish */}
                               {task.youglishKeyword && (
                                  <div className="space-y-4">
                                     <div className="flex items-center gap-2 text-amber-500">
                                        <Sparkles className="w-5 h-5" />
                                        <h4 className="text-sm font-black">تدريب النطق والاستماع (YouGlish)</h4>
                                     </div>
                                     <div className="bg-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl p-4 md:p-6 min-h-[450px]">
                                        <YouGlishWidget query={task.youglishKeyword} />
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                         <div className="w-20 h-20 rounded-full border border-dashed border-white/20 flex items-center justify-center">
                            <Sparkles className="w-10 h-10" />
                         </div>
                         <div className="space-y-2">
                           <h4 className="text-xl font-black">غابة المعرفة في انتظارك</h4>
                           <p className="text-sm font-medium">اختر نشاطاً لاستعراض التوجيهات ومصادر التعلم الخاصة به هنا.</p>
                         </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .vis-session-dialog .p-dialog-content {
          overflow: hidden !important;
        }
      `}</style>
    </Dialog>
  );
}
