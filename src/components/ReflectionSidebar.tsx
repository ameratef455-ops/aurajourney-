import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Brain, Trophy, Activity, Wrench, Sparkles } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useRef } from 'react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export interface ReflectionSidebarProps {
  reflectionSidebar: boolean;
  setReflectionSidebar: (val: boolean) => void;
  reflectionActiveTab: number;
  setReflectionActiveTab: (val: number) => void;
  createTabHeader: (icon: string, label: string) => (options: any) => React.ReactNode;
  gData: { xp: number; keys: number; fuel: number };
  hasReflectedToday: boolean;
  undertakeReflection: () => void;
  takeRestDay: () => void;
  user: any;
  activeStationId: string | null;
  tasks: any[];
  stations: any[];
  unlockedStations: string[];
  stationEnergy: Record<string, number>;
  forceStationId?: string | null;
}

export function ReflectionSidebar({
  reflectionSidebar,
  setReflectionSidebar,
  reflectionActiveTab,
  setReflectionActiveTab,
  createTabHeader,
  tasks = [],
  stations = [],
  activeStationId,
  forceStationId
}: ReflectionSidebarProps) {
  // Use dexie to fetch reflections
  const reflections = useLiveQuery(async () => {
    try {
      if (!db.reflections) return [];
      return await db.reflections.orderBy('createdAt').reverse().toArray();
    } catch (e) {
      console.warn("Reflections store not ready yet:", e);
      return [];
    }
  }) || [];

  const allStumbles = useLiveQuery(() => {
    try {
      if (!db.stumbles) return [];
      return db.stumbles.orderBy('createdAt').reverse().toArray();
    } catch { 
      return []; 
    }
  }) || [];

  const selectedStationFilter = forceStationId || "all";

  // Filter based on selectedStationFilter
  const filteredReflections = React.useMemo(() => {
    if (selectedStationFilter === "all") {
      return reflections;
    }
    return reflections.filter(r => r.stationId === selectedStationFilter);
  }, [reflections, selectedStationFilter]);

  const filteredTasks = React.useMemo(() => {
    if (selectedStationFilter === "all") {
      return tasks;
    }
    return tasks.filter(t => t.stationId === selectedStationFilter);
  }, [tasks, selectedStationFilter]);

  // 1. Average Focus (Scale / 5)
  const avgFocus = filteredReflections.length > 0 
    ? (filteredReflections.reduce((acc, r) => acc + r.focus, 0) / filteredReflections.length).toFixed(1) 
    : "0.0";

  // 2. Average Mastery (Scale / 10)
  const avgMastery = filteredReflections.length > 0 
    ? (filteredReflections.reduce((acc, r) => acc + r.mastery, 0) / filteredReflections.length).toFixed(1) 
    : "0.0";

  // 3. Average Practical Application (How many times didPractical is true Out Of total reflections)
  const appliedCount = filteredReflections.filter(r => r.didPractical).length;
  const avgPractical = filteredReflections.length > 0 
    ? Math.round((appliedCount / filteredReflections.length) * 100) 
    : 0;

  // 4. Average Commitment/Completion Rate across all tasks (completed / total tasks)
  const completedTasksCount = filteredTasks.filter(t => t.isCompleted).length;
  const totalTasksCount = filteredTasks.length;
  const avgCommitment = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  const chartData = [
    { subject: 'الالتزام', score: avgCommitment, fullMark: 100 },
    { subject: 'التركيز', score: Math.round(Number(avgFocus) * 20), fullMark: 100 },
    { subject: 'الإتقان', score: Math.round(Number(avgMastery) * 10), fullMark: 100 },
    { subject: 'التطبيق العملي', score: avgPractical, fullMark: 100 },
  ];

  const fullPdfRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!fullPdfRef.current) return;
    try {
      const dataUrl = await toPng(fullPdfRef.current, { 
        cacheBust: true, 
        backgroundColor: '#f8fafc', 
        pixelRatio: 2,
        fontEmbedCSS: ''
      });
      
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (img.height * pdfWidth) / img.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('AuraJourney_Full_Report.pdf');
    } catch (err) {
      console.error('Failed to export PDF:', err);
    }
  };

  return (
    <Dialog
      visible={reflectionSidebar}
      onHide={() => setReflectionSidebar(false)}
      className="w-[98vw] max-w-4xl font-sans"
      closable
      dismissableMask
      header={
        <div className="flex w-full items-center justify-between gap-3 text-blue-950 font-black pr-4" dir="rtl">
          <div className="flex items-center gap-3">
            <i className="pi pi-chart-bar text-indigo-600 text-2xl border-2 border-indigo-950/10 p-1.5 rounded-xl bg-indigo-50/50"></i>
            <span className="text-xl font-black text-blue-950 tracking-tight">تحليلات ومؤشرات التقدم والوعي 📊</span>
          </div>
          <button 
             onClick={handleExportPDF}
             className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 ml-8 border-none cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
             <i className="pi pi-file-pdf font-black text-lg"></i>
             تصدير التقرير
          </button>
        </div>
      }
    >
      <div className="bg-slate-50 p-4 rounded-3xl">
        <TabView activeIndex={reflectionActiveTab} onTabChange={(e) => setReflectionActiveTab(e.index)} className="reflection-tabs custom-spaced-tabs reflection-compact" dir="rtl">
        <TabPanel headerTemplate={createTabHeader("pi-chart-bar", "التحليلات والمؤشرات")}>
          <AnimatePresence mode="wait">
            {reflectionSidebar && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="space-y-6 pt-6 px-2 text-right font-sans" 
                dir="rtl"
              >
            {/* Header intro card with visual glow */}
            <div className="relative overflow-hidden bg-gradient-to-l from-indigo-950 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-white/5 shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl font-black"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 transition-all text-indigo-200 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-400" /> لوحة التحكم الذكية
                  </span>
                  <p className="text-sm font-bold text-slate-300 leading-relaxed max-w-2xl">
                    متابعة حية لمفاتيح وعيك الذاتي ومعدلات التعلم العملي المطبقة والالتزام على إثر المحطات العلمية التي خضتها.
                  </p>
                </div>
                {/* Total Reflections badge */}
                <div className="bg-white/5 border border-white/10 text-right p-4 rounded-xl flex items-center gap-4 shrink-0">
                  <div className="text-3xl font-black text-indigo-400 font-mono">
                    {filteredReflections.length}
                  </div>
                  <div>
                    <h5 className="text-[10px] text-slate-400 font-extrabold uppercase">جلسات الوعي والتحليلات</h5>
                    <p className="text-[10px] text-indigo-200 font-bold">جلسة مسجلة</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Chart Visual */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col items-center min-h-[350px]">
              <h4 className="text-sm font-black text-blue-950 self-start mb-4 flex items-center gap-2">
                 <i className="pi pi-compass text-indigo-500"></i>
                 تحليل القدرات الشامل
              </h4>
              <div className="w-full h-[300px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'right', fontFamily: 'inherit' }}
                        formatter={(value: number) => [`${value}%`, 'النسبة']}
                      />
                      <Radar name="القدرات" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
              </div>
            </div>

            {/* Bento Grid of 4 key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* 1. Commitment Rate Metric Card */}
              <div className="bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/20 border border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100/60 border border-indigo-100 flex items-center justify-center text-indigo-700">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-3xl font-black text-indigo-950">{avgCommitment}</span>
                    <span className="text-sm font-extrabold text-indigo-400"> %</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                    متوسط الالتزام والإنهاء
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    معدل التزامك العام بإنجاز المهام الأساسية والفرعية على في رحلتك الممتدة.
                  </p>
                  <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden pt-0 shadow-3xs p-0.5">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${avgCommitment}%` }}></div>
                  </div>
                  <div className="text-[10px] text-indigo-500 font-black mt-1">
                    تم إكمال {completedTasksCount} مهمة من أصل {totalTasksCount} مكتشفة.
                  </div>
                </div>
              </div>

              {/* 2. Focus Rate Metric Card */}
              <div className="bg-gradient-to-br from-purple-50/40 via-white to-purple-50/20 border border-purple-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-purple-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-purple-100/60 border border-purple-100 flex items-center justify-center text-purple-700">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-3xl font-black text-purple-950">{avgFocus}</span>
                    <span className="text-sm font-extrabold text-purple-400"> / 5</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                    متوسط التركيز الذهني
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    معدل حضورك العقلي واندماجك الواعي أثناء إنجاز المبادئ والمهام.
                  </p>
                  <div className="flex items-center gap-1 mt-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        className={`h-2.5 rounded-full transition-all ${
                          s <= Math.round(Number(avgFocus)) 
                            ? "bg-purple-600 w-6" 
                            : "bg-purple-100 w-2.5"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-purple-500 font-black mt-2">
                    تم تقييمه من واقع تحليلات وانعكاساتك الذاتية للخطة.
                  </div>
                </div>
              </div>

              {/* 3. Mastery Rate Metric Card */}
              <div className="bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 border border-amber-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-amber-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-amber-100/60 border border-amber-100 flex items-center justify-center text-amber-700">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-3xl font-black text-amber-950">{avgMastery}</span>
                    <span className="text-sm font-extrabold text-amber-400"> / 10</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                    متوسط إتقان المهارات
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    قوة الاستيعاب الذاتي والمكتسبات الإدراكية العملية من دراستك.
                  </p>
                  <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden pt-0 shadow-3xs p-0.5">
                    <div className="h-full bg-amber-600 rounded-full transition-all duration-1000" style={{ width: `${(Number(avgMastery) / 10) * 100}%` }}></div>
                  </div>
                  <div className="text-[10px] text-amber-600 font-black mt-1">
                    المستوى الحالي للمقود: {Number(avgMastery) >= 8.5 ? 'احتراف متقدّم 🌟' : Number(avgMastery) >= 6 ? 'استيعاب متمكن 👍' : 'قيد التطوير والترسيخ 🌱'}
                  </div>
                </div>
              </div>

              {/* 4. Practical Application Rate Metric Card */}
              <div className="bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100/60 border border-emerald-100 flex items-center justify-center text-emerald-700">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-3xl font-black text-emerald-950">{avgPractical}</span>
                    <span className="text-sm font-extrabold text-emerald-400"> %</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                    معدل التطبيق العملي للدروس
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-bold">
                    فرصة نقل المعارف المفاهيمية وتحويلها المباشر إلى تفعيل ملموس.
                  </p>
                  <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden pt-0 shadow-3xs p-0.5">
                    <div className="h-full bg-emerald-600 rounded-full transition-all duration-1000" style={{ width: `${avgPractical}%` }}></div>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-black mt-1">
                    تم تطبيق المهارات عملياً في {appliedCount} مهمة من {filteredReflections.length} جلسات دراسية.
                  </div>
                </div>
              </div>

            </div>

          </motion.div>
            )}
          </AnimatePresence>
        </TabPanel>

        <TabPanel headerTemplate={createTabHeader("pi-exclamation-triangle", "سجل التعثرات ⚠️")}>
          <AnimatePresence mode="wait">
            {reflectionSidebar && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pt-6 px-2 space-y-6 text-right font-sans"
                dir="rtl"
              >
                <div className="bg-rose-50/50 border border-rose-100 rounded-[32px] p-6 space-y-3">
                  <h4 className="font-black text-rose-900 text-sm flex items-center gap-2">
                    <i className="pi pi-history"></i> تاريخ عثرات الرحلة:
                  </h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    هنا يُحفظ كل تعثر قمت بتسجيله بصراحة. الانعكاس حول الهفوات يساعدك على إدراك المسببات لتفاديها في المستقبل.
                  </p>
                </div>

                <div className="space-y-4 pr-1 no-scrollbar pb-10">
                  {allStumbles.filter((s:any) => selectedStationFilter === "all" || s.stationId === selectedStationFilter).length > 0 ? (
                    allStumbles.filter((s:any) => selectedStationFilter === "all" || s.stationId === selectedStationFilter).map((stumble: any) => (
                      <div 
                        key={stumble.id} 
                        className="p-5 bg-white border border-rose-100/70 rounded-[28px] shadow-3xs flex flex-col gap-2 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 h-1 w-full bg-rose-500/30"></div>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span className="flex items-center gap-1">
                            <i className="pi pi-calendar text-[10px] text-slate-300"></i>
                            {new Date(stumble.createdAt).toLocaleDateString('ar-EG', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 bg-rose-50/10 p-4 rounded-2xl border border-rose-50/30 font-medium leading-relaxed mt-1">
                          {stumble.reason}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[40px] text-center px-10">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-3xs mx-auto mb-4">
                        <i className="pi pi-verified text-2xl font-black"></i>
                      </div>
                      <h4 className="text-sm font-black text-blue-950 mb-1">مسيرة رائعة ومليئة بالالتزام! ⭐</h4>
                      <p className="text-xs text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                        لم يتم تسجيل أي تعثرات أو عثرات جانبية حتى الآن. استمر على هذا التركيز العالي!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TabPanel>
      </TabView>
      </div>

      {/* Hidden container for PDF export that renders everything sequentially */}
      <div className="absolute top-[-9999px] left-[-9999px]">
        <div ref={fullPdfRef} className="bg-slate-50 w-[800px] p-8 text-right font-sans" dir="rtl">
           <div className="text-center mb-12 border-b-4 border-indigo-600 pb-10 pt-4">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                  <i className="pi pi-sparkles text-4xl text-white"></i>
                </div>
                <h1 className="text-6xl font-black text-blue-950 tracking-tighter">AURA JOURNEY</h1>
                <div className="w-32 h-1.5 bg-indigo-500 mt-2 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">تقرير التقدم واليوميات الشامل</h2>
              <p className="text-slate-500 font-medium">تم إنشاء التقرير بتاريخ: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
           </div>
           
           <h2 className="text-xl font-black text-indigo-700 mb-4 border-b border-indigo-100 pb-2">التحليلات والمؤشرات</h2>
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-sm font-bold text-slate-500 mb-1">متوسط الالتزام</p>
                 <p className="text-2xl font-black text-indigo-600">{avgCommitment}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-sm font-bold text-slate-500 mb-1">مستوى التركيز العميق</p>
                 <p className="text-2xl font-black text-rose-500">{avgFocus} <span className="text-sm">/ 5</span></p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-sm font-bold text-slate-500 mb-1">التقدم الميداني والتطبيق</p>
                 <p className="text-2xl font-black text-teal-600">{avgPractical}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <p className="text-sm font-bold text-slate-500 mb-1">متوسط الإتقان</p>
                 <p className="text-2xl font-black text-amber-500">{avgMastery} <span className="text-sm">/ 10</span></p>
              </div>
           </div>

           <div className="mb-8">
             <div className="w-full h-[400px] bg-white rounded-xl border border-slate-200 flex items-center justify-center p-4">
                  <RadarChart width={700} height={380} cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="القدرات" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} strokeWidth={2} />
                  </RadarChart>
             </div>
           </div>

           <h2 className="text-xl font-black text-indigo-700 mb-4 border-b border-indigo-100 pb-2 mt-8">جلسات الانعكاس واليوميات</h2>
           <div className="space-y-4 mb-8">
              {reflections && reflections.length > 0 ? reflections.slice().reverse().map(ref => (
                 <div key={ref.id} className="bg-indigo-50/30 p-4 border border-indigo-100 rounded-xl mb-3 page-break-inside-avoid">
                    <p className="text-xs text-slate-500 font-bold mb-2">{new Date(ref.createdAt).toLocaleString('ar-EG')}</p>
                    <p className="text-sm font-medium leading-relaxed">أهم الدروس: {ref.learnings}</p>
                 </div>
              )) : (
                 <p className="text-slate-400">لا توجد انعكاسات مسجلة.</p>
              )}
           </div>

           <h2 className="text-xl font-black text-rose-700 mb-4 border-b border-rose-100 pb-2 mt-8">سجل التعثرات</h2>
           <div className="space-y-4">
              {allStumbles && allStumbles.length > 0 ? allStumbles.slice().reverse().map(st => (
                 <div key={st.id} className="bg-rose-50 p-4 border border-rose-100 rounded-xl mb-3 page-break-inside-avoid">
                    <p className="text-xs text-rose-400 font-bold mb-2">{new Date(st.createdAt).toLocaleString('ar-EG')}</p>
                    <p className="text-sm font-medium leading-relaxed text-rose-900">{st.reason}</p>
                 </div>
              )) : (
                 <p className="text-slate-400">لا يوجد تعثرات مسجلة.</p>
              )}
           </div>
        </div>
      </div>
    </Dialog>
  );
}
