import React from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dialog } from 'primereact/dialog';
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
  forceStationId,
  user
}: ReflectionSidebarProps) {
  const isLanguageLearning = user?.journeyTitle?.includes("لغات") || user?.journeyTitle?.includes("Language");

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

  const languageReflections = filteredReflections.filter(r => r.languageLearning);
  const totalSentences = languageReflections.reduce((acc, r) => acc + (r.languageLearning?.sentences?.length || 0), 0);
  const avgAccent = languageReflections.length > 0 
    ? (languageReflections.reduce((acc, r) => acc + (r.languageLearning?.accentRating || 0), 0) / languageReflections.length).toFixed(1) 
    : "0.0";

  const chartData = [
    { subject: 'الالتزام', score: avgCommitment, fullMark: 100 },
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
      className="w-screen h-screen font-sans m-0 p-0 rounded-none border-none"
      style={{ width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none', borderRadius: 0, margin: 0 }}
      contentClassName="bg-gradient-to-br from-[#0A0F2C] to-[#1A2250] p-0"
      headerClassName="bg-gradient-to-br from-[#0A0F2C] to-[#1A2250] border-b border-indigo-500/20"
      maximized
      closable
      dismissableMask
      header={
        <div className="flex w-full items-center justify-between gap-3 text-white font-black pr-4" dir="rtl">
          <div className="flex items-center gap-3">
            <i className="pi pi-chart-bar text-indigo-400 text-2xl border-2 border-indigo-500/20 p-1.5 rounded-xl bg-indigo-500/10"></i>
            <span className="text-xl font-black text-white tracking-tight">التحليلات والمؤشرات 📊</span>
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
      <div className="h-full px-4 md:px-8 overflow-y-auto no-scrollbar pt-6">
        <TabView 
          activeIndex={reflectionActiveTab} 
          onTabChange={(e) => setReflectionActiveTab(e.index)} 
          className="custom-spaced-tabs" 
          dir="rtl"
          pt={{ panelContainer: { className: 'bg-transparent border-none p-0' } }}
        >
        <TabPanel headerTemplate={createTabHeader("pi-chart-bar", "التحليلات والمؤشرات")}>
            {reflectionSidebar && (
              <div 
                className="space-y-6 pt-6 px-2 text-right font-sans css-tab-content" 
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
                <div className="bg-white/5 border border-white/10 text-right p-4 rounded-xl flex items-center gap-4 shrink-0">
                  <div className="text-3xl font-black text-indigo-400 font-mono">
                    {filteredReflections.length}
                  </div>
                  <div>
                    <h5 className="text-[10px] text-slate-400 font-extrabold uppercase">جلسات الانعكاس</h5>
                  </div>
                </div>
              </div>
            </div>

            {/* Radar Chart Visual */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col items-center min-h-[350px]">
              <h4 className="text-sm font-black text-indigo-100 self-start mb-4 flex items-center gap-2">
                 <i className="pi pi-compass text-indigo-400"></i>
                 تحليل القدرات الشامل
              </h4>
              <div className="w-full h-[300px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', textAlign: 'right', fontFamily: 'inherit' }}
                        formatter={(value: number) => [`${value}%`, 'النسبة']}
                      />
                      <Radar name="القدرات" dataKey="score" stroke="#818cf8" fill="#6366f1" fillOpacity={0.6} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
              </div>
            </div>

            {/* Bento Grid of key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* 1. Commitment Rate Metric Card */}
              <div className="bg-gradient-to-br from-indigo-500/10 via-white/5 to-indigo-500/5 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-3xl font-black text-indigo-200">{avgCommitment}</span>
                    <span className="text-sm font-extrabold text-indigo-400"> %</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-black text-indigo-100 flex items-center gap-1.5">
                    متوسط الالتزام والإنهاء
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    معدل التزامك العام بإنجاز المهام الأساسية والفرعية على في رحلتك الممتدة.
                  </p>
                  <div className="w-full h-1.5 bg-indigo-950 rounded-full overflow-hidden pt-0 shadow-3xs p-0.5 border border-indigo-500/20">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${avgCommitment}%` }}></div>
                  </div>
                  <div className="text-[10px] text-indigo-300 font-black mt-1">
                    تم إكمال {completedTasksCount} مهمة من أصل {totalTasksCount} مكتشفة.
                  </div>
                </div>
              </div>

              {/* 2. Mastery Rate Metric Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-white/5 to-amber-500/5 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-amber-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-3xl font-black text-amber-200">{avgMastery}</span>
                    <span className="text-sm font-extrabold text-amber-500"> / 10</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-black text-indigo-100 flex items-center gap-1.5">
                    متوسط إتقان المهارات
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-bold">
                    قوة الاستيعاب الذاتي والمكتسبات الإدراكية العملية من دراستك.
                  </p>
                  <div className="w-full h-1.5 bg-amber-950 rounded-full overflow-hidden pt-0 shadow-3xs p-0.5 border border-amber-500/20">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${(Number(avgMastery) / 10) * 100}%` }}></div>
                  </div>
                  <div className="text-[10px] text-amber-400 font-black mt-1">
                    المستوى الحالي للمقود: {Number(avgMastery) >= 8.5 ? 'احتراف متقدّم 🌟' : Number(avgMastery) >= 6 ? 'استيعاب متمكن 👍' : 'قيد التطوير والترسيخ 🌱'}
                  </div>
                </div>
              </div>

              {/* 3. Practical Application Rate Metric Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-white/5 to-emerald-500/5 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-3xl font-black text-emerald-200">{avgPractical}</span>
                    <span className="text-sm font-extrabold text-emerald-400"> %</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-black text-indigo-100 flex items-center gap-1.5">
                    معدل التطبيق العملي للدروس
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-bold">
                    فرصة نقل المعارف المفاهيمية وتحويلها المباشر إلى تفعيل ملموس.
                  </p>
                  <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden pt-0 shadow-3xs p-0.5 border border-emerald-500/20">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${avgPractical}%` }}></div>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-black mt-1">
                    تم تطبيق المهارات عملياً في {appliedCount} مهمة من {filteredReflections.length} جلسات دراسية.
                  </div>
                </div>
              </div>

              {/* Language Learning Analytics (Specific) */}
              {isLanguageLearning && (
                <>
                  {/* Sentences Learned Metric Card */}
                  <div className="bg-gradient-to-br from-blue-500/10 via-white/5 to-blue-500/5 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-blue-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-3xl font-black text-blue-200">{totalSentences}</span>
                        <span className="text-sm font-extrabold text-blue-400"> جملة</span>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <h4 className="text-sm font-black text-indigo-100 flex items-center gap-1.5">
                        إجمالي الجمل المتعلمة
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        مجموع العبارات والتعبيرات التي قمت بممارستها وتسجيلها في مذكراتك.
                      </p>
                      <div className="text-[10px] text-blue-300 font-black mt-2">
                        ساعد التكرار والممارسة في ترسيخ هذه الجمل في ذاكرتك طويلة المدى.
                      </div>
                    </div>
                  </div>

                  {/* Accent/Fluency Metric Card */}
                  <div className="bg-gradient-to-br from-rose-500/10 via-white/5 to-rose-500/5 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-rose-500/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-3xl font-black text-rose-200">{avgAccent}</span>
                        <span className="text-sm font-extrabold text-rose-400"> / 5</span>
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <h4 className="text-sm font-black text-indigo-100 flex items-center gap-1.5">
                        متوسط جودة اللكنة والنطق
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        مقياس تطور نطقك الصحيح ومخارج الحروف بناءً على تقييماتك الذاتية.
                      </p>
                      <div className="flex items-center gap-1 mt-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`h-2.5 rounded-full transition-all border border-rose-500/20 ${
                              s <= Math.round(Number(avgAccent)) 
                                ? "bg-rose-500 w-6" 
                                : "bg-rose-950 w-2.5"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-[10px] text-rose-300 font-black mt-2">
                        الهدف هو الوصول لتلقائية ونطق طبيعي يشبه أهل اللغة.
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
              </div>
            )}
        </TabPanel>

         <TabPanel headerTemplate={createTabHeader("pi-exclamation-triangle", "سجل التعثرات ⚠️")}>
            {reflectionSidebar && (
              <div 
                className="pt-6 px-2 space-y-6 text-right font-sans css-tab-content"
                dir="rtl"
              >
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-[32px] p-6 space-y-3">
                  <h4 className="font-black text-rose-400 text-sm flex items-center gap-2">
                    <i className="pi pi-history"></i> تاريخ عثرات الرحلة:
                  </h4>
                  <p className="text-xs text-rose-200/80 font-bold leading-relaxed">
                    هنا يُحفظ كل تعثر قمت بتسجيله بصراحة. الانعكاس حول الهفوات يساعدك على إدراك المسببات لتفاديها في المستقبل.
                  </p>
                </div>

                <div className="space-y-4 pr-1 no-scrollbar pb-10">
                  {allStumbles.filter((s:any) => selectedStationFilter === "all" || s.stationId === selectedStationFilter).length > 0 ? (
                    allStumbles.filter((s:any) => selectedStationFilter === "all" || s.stationId === selectedStationFilter).map((stumble: any) => (
                      <div 
                        key={stumble.id} 
                        className="p-5 bg-white/5 border border-white/10 rounded-[28px] shadow-3xs flex flex-col gap-2 relative overflow-hidden"
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
                        <p className="text-xs text-slate-200 bg-white/5 p-4 rounded-2xl border border-white/5 font-medium leading-relaxed mt-1">
                          {stumble.reason}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 bg-white/5 border border-dashed border-white/10 rounded-[40px] text-center px-10">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-3xs mx-auto mb-4">
                        <i className="pi pi-verified text-2xl font-black"></i>
                      </div>
                      <h4 className="text-sm font-black text-emerald-300 mb-1">مسيرة رائعة ومليئة بالالتزام! ⭐</h4>
                      <p className="text-xs text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                        لم يتم تسجيل أي تعثرات أو عثرات جانبية حتى الآن. استمر على هذا التركيز العالي!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </TabPanel>

        <TabPanel headerTemplate={createTabHeader("pi-table", "تقييم جداول Sheets 📊")}>
            {reflectionSidebar && (
              <div 
                className="pt-6 px-2 space-y-6 text-right font-sans css-tab-content pb-10"
                dir="rtl"
              >
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-800/40 rounded-[32px] p-6 space-y-3">
                  <h4 className="font-black text-indigo-300 text-sm flex items-center gap-2">
                    <i className="pi pi-file-excel text-indigo-400"></i> التقييم المجدول الشامل
                  </h4>
                  <p className="text-xs text-indigo-200 font-bold leading-relaxed">
                    يعرض هذا القسم تقييماتك في شكل جدول بيانات (Spreadsheet) لتحليل إحصائيات وعيك وانعكاساتك بشكل متكامل.
                  </p>
                </div>
                
                <div className="overflow-x-auto w-full no-scrollbar bg-white/5 rounded-2xl border border-white/10 shadow-lg">
                  <table className="w-full text-sm text-right text-slate-300 border-collapse cursor-crosshair">
                     <thead className="text-xs text-indigo-200 bg-indigo-950/40 border-b border-white/10 select-none">
                         <tr>
                             <th scope="col" className="px-4 py-3 font-black border border-white/10 w-12 text-center bg-indigo-950/60 font-mono">#</th>
                             <th scope="col" className="px-4 py-3 font-black border border-white/10">المهمة</th>
                             <th scope="col" className="px-4 py-3 font-black border border-white/10">التاريخ</th>
                             <th scope="col" className="px-4 py-3 font-black border border-white/10 text-center">معدل الفهم</th>
                             <th scope="col" className="px-4 py-3 font-black border border-white/10 text-center">الدالة المستخدمة</th>
                             <th scope="col" className="px-4 py-3 font-black border border-white/10">التطبيق العملي لها</th>
                         </tr>
                     </thead>
                     <tbody className="font-mono text-[13px]">
                         {filteredReflections.length > 0 ? filteredReflections.map((ref: any, idx: number) => (
                             <tr key={ref.id} className="bg-white/5 border-b border-white/5 hover:bg-white/15 transition-colors">
                                 <td className="px-4 py-3 border border-white/10 text-center font-bold text-indigo-400 bg-indigo-950/20">{idx + 1}</td>
                                 <td className="px-4 py-3 border border-white/10 font-sans font-bold text-slate-100">{tasks.find((t: any) => t.id === ref.taskId)?.title || 'مهمة محذوفة'}</td>
                                 <td className="px-4 py-3 border border-white/10 text-slate-400">{new Date(ref.createdAt).toLocaleDateString('ar-EG')}</td>
                                 <td className="px-4 py-3 border border-white/10 text-center text-amber-400">{ref.understandingRate || ref.mastery ? `${ref.understandingRate || (ref.mastery * 10)}%` : '-'}</td>
                                 <td className="px-4 py-3 border border-white/10 text-indigo-300 font-bold font-sans">
                                     {ref.sheetsEvaluation?.functionName ? (
                                         <code className="bg-slate-900/60 px-2 py-1 rounded text-red-400 border border-white/5 font-mono">
                                             {ref.sheetsEvaluation.functionName}
                                         </code>
                                     ) : '-'}
                                 </td>
                                 <td className="px-4 py-3 border border-white/10 text-slate-300 font-sans leading-relaxed">
                                     {ref.sheetsEvaluation?.usageDescription || '-'}
                                 </td>
                             </tr>
                         )) : (
                             <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans font-bold">لا توجد تقييمات مسجلة بعد.</td>
                             </tr>
                         )}
                     </tbody>
                  </table>
                </div>
              </div>
            )}
        </TabPanel>
      </TabView>
      </div>

      {/* Hidden container for PDF export that renders everything sequentially */}
      <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none -z-50">
        <div ref={fullPdfRef} className="bg-slate-50 w-[800px] p-8 text-right font-sans" dir="rtl">
           <div className="text-center mb-12 border-b-4 border-indigo-600 pb-10 pt-4">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl border border-slate-200">
                  <svg viewBox="0 0 100 100" className="w-16 h-16 text-indigo-900">
                    <path d="M50 25 L25 75 M50 25 L75 75 M25 75 L75 75" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="50" cy="25" r="9" fill="#1e3a8a" />
                    <circle cx="25" cy="75" r="9" fill="#1e3a8a" />
                    <circle cx="75" cy="75" r="9" fill="#1e3a8a" />
                  </svg>
                </div>
                <h1 className="text-4xl font-black text-blue-950 tracking-tight">VIA...رحلة حياة</h1>
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
                 <p className="text-sm font-bold text-slate-500 mb-1 hidden">مستوى التركيز العميق</p>
                 <p className="text-2xl font-black text-rose-500 hidden">{avgFocus} <span className="text-sm">/ 5</span></p>
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

           <h2 className="text-xl font-black text-indigo-700 mb-5 border-b border-indigo-150 pb-3 mt-8 flex items-center gap-2 animate-fade-in">
               <i className="pi pi-history text-indigo-600 text-lg"></i>
               <span>تحليلات المراجعة والوعي المقارن المستمر 🧠</span>
            </h2>
            <div className="space-y-6 mb-8 animate-fade-in">
               {reflections && reflections.length > 0 ? (
                 reflections.slice().reverse().map((ref, idx, arr) => {
                   const prevRef = idx > 0 ? arr[idx - 1] : null;
                   const focusDiff = prevRef ? ref.focus - prevRef.focus : 0;
                   const masteryDiff = prevRef ? ref.mastery - prevRef.mastery : 0;

                   return (
                     <div key={ref.id} className="bg-white p-5 border border-slate-150 rounded-2xl shadow-xs hover:shadow-md transition-all page-break-inside-avoid text-right">
                        {/* Header: Date and Task Title */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-indigo-50 pb-3 mb-4">
                           <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-bold font-mono block mb-1">
                                 {new Date(ref.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                 <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                 المهمة: <span className="text-indigo-600">"{ref.taskTitle}"</span>
                              </h4>
                           </div>
                           
                           <div className="flex items-center justify-end gap-2 font-mono" dir="ltr">
                              {/* Focus Badge */}
                              <div className="bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl flex items-center gap-1 text-rose-700 hidden" title="مستوى التركيز العميق (من 5)">
                                 <span className="text-[9px] font-black">التركيز:</span>
                                 <span className="text-xs font-black">{ref.focus}/5</span>
                                 {focusDiff !== 0 && (
                                    <span className={`text-[9px] font-black ${focusDiff > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                       {focusDiff > 0 ? `▲ +${focusDiff}` : `▼ ${focusDiff}`}
                                    </span>
                                 )}
                              </div>
                              {/* Mastery Badge */}
                              <div className="bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl flex items-center gap-1 text-amber-700" title="مستوى الإتقان المحرز (من 10)">
                                 <span className="text-[9px] font-black">الإتقان:</span>
                                 <span className="text-xs font-black">{ref.mastery}/10</span>
                                 {masteryDiff !== 0 && (
                                    <span className={`text-[9px] font-black ${masteryDiff > 0 ? 'text-emerald-650' : 'text-rose-500'}`}>
                                       {masteryDiff > 0 ? `▲ +${masteryDiff}` : `▼ ${masteryDiff}`}
                                    </span>
                                 )}
                              </div>
                           </div>
                        </div>

                        {/* Side-by-Side Comparison Grid: Strengths vs Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           {/* Strengths */}
                           <div className="bg-emerald-50/40 border border-emerald-100/50 p-4 rounded-xl text-right">
                              <h5 className="text-[10px] text-emerald-800 font-extrabold mb-2.5 flex items-center gap-1.5">
                                 <span className="text-sm">💪</span> نقاط القوة المكتشفة
                              </h5>
                              <p className="text-xs text-slate-705 font-bold leading-relaxed bg-white/70 p-3 rounded-lg border border-white">
                                 {ref.strengths || "لم يتم تسجيل نقاط قوة معينة في هذه الجلسة مسبقاً."}
                              </p>
                           </div>

                           {/* Weaknesses */}
                           <div className="bg-rose-50/40 border border-rose-100/55 p-4 rounded-xl text-right">
                              <h5 className="text-[10px] text-rose-800 font-extrabold mb-2.5 flex items-center gap-1.5">
                                 <span className="text-sm">🧨</span> نقاط الضعف ومجالات التحسين
                              </h5>
                              <p className="text-xs text-slate-705 font-bold leading-relaxed bg-white/70 p-3 rounded-lg border border-white">
                                 {ref.weaknesses || "لم يتم تسليط الضوء على مجالات تحسين معينة."}
                              </p>
                           </div>
                        </div>

                        {/* Acquired Skills and Practical Application */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {/* Acquired Skills & Learnings */}
                           <div className="bg-blue-50/40 border border-blue-100/50 p-4 rounded-xl text-right">
                              <h5 className="text-[10px] text-blue-800 font-extrabold mb-2.5 flex items-center gap-1.5">
                                 <span className="text-sm">🧠</span> المهارات المكتسبة والتعلم
                              </h5>
                              <p className="text-xs text-slate-705 font-bold leading-relaxed bg-white/70 p-3 rounded-lg border border-white">
                                 {ref.learnings || "التحصيل العام للمهارة تم بنجاح وسلاسة."}
                              </p>
                           </div>

                           {/* Practical Application */}
                           <div className="bg-teal-50/40 border border-teal-100/50 p-4 rounded-xl text-right flex flex-col justify-between">
                              <div>
                                 <h5 className="text-[10px] text-teal-800 font-extrabold mb-2.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                       <span className="text-sm">🛠️</span> التنزيل والتدريب العملي
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${ref.didPractical ? 'bg-teal-100 text-teal-800 border border-teal-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                       {ref.didPractical ? 'تم التطبيق عملاً' : 'لم يطبق بعد'}
                                    </span>
                                 </h5>
                                 <p className="text-xs text-slate-750 font-bold leading-relaxed bg-white/70 p-3 rounded-lg border border-white">
                                    {ref.didPractical 
                                       ? (ref.practicalIssues || "تم تأكيد التجريب والتطبيق العملي للمهمة وحصد النجاح بنجاح!") 
                                       : "اكتمل الجانب النظري في هذه المراجعة؛ ينصح بتمارين تطبيقية وتجريب ميداني."}
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                   );
                 })
               ) : (
                  <div className="bg-indigo-50/20 p-6 rounded-2xl border border-indigo-100/50 text-center text-slate-400 font-bold text-xs leading-relaxed">
                     لا توجد مراجعات مسجلة ومحفوظة حالياً لمقارنة تحليلات الوعي. أنجز المهام وسجل مراجعات التقييم لتنشيط هذا المعالج تلقائياً! 💡
                  </div>
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
