import React from 'react';
import { Dialog } from 'primereact/dialog';
import { TabView, TabPanel } from 'primereact/tabview';
import { Button } from 'primereact/button';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, TaskReflection } from '../db';
import { Brain, Trophy, Lightbulb, Tool, ListChecks, CheckCircle2, Wrench, Shield, Briefcase, MinusCircle, PlusCircle } from 'lucide-react';

export interface ReflectionSidebarProps {
  reflectionSidebar: boolean;
  setReflectionSidebar: (val: boolean) => void;
  reflectionActiveTab: number;
  setReflectionActiveTab: (val: number) => void;
  createTabHeader: (icon: string, label: string) => (options: any) => JSX.Element;
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
}

export function ReflectionSidebar({
  reflectionSidebar,
  setReflectionSidebar,
  reflectionActiveTab,
  setReflectionActiveTab,
  createTabHeader,
  gData,
  hasReflectedToday,
  undertakeReflection,
  takeRestDay,
  user,
  activeStationId,
  tasks,
  stations,
  unlockedStations,
  stationEnergy
}: ReflectionSidebarProps) {
  const reflections = useLiveQuery(async () => {
    try {
      if (!db.reflections) return [];
      return await db.reflections.orderBy('createdAt').reverse().toArray();
    } catch (e) {
      console.warn("Reflections store not ready yet:", e);
      return [];
    }
  }) || [];

  const avgFocus = reflections.length > 0 ? (reflections.reduce((acc, r) => acc + r.focus, 0) / reflections.length).toFixed(1) : 0;
  const avgMastery = reflections.length > 0 ? (reflections.reduce((acc, r) => acc + r.mastery, 0) / reflections.length).toFixed(1) : 0;

  return (
    <Dialog
      visible={reflectionSidebar}
      onHide={() => setReflectionSidebar(false)}
      className="w-[98vw] max-w-4xl font-sans"
      closable
      dismissableMask
      header={
        <div className="flex items-center gap-3 text-blue-950 font-black pr-4" dir="rtl">
          <i className="pi pi-compass text-blue-900 text-2xl"></i>
          <span className="text-xl font-black text-blue-950 tracking-tight">البوصلة، أدوات الانعكاس والتحليلات 📊</span>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {reflectionSidebar && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="space-y-4 pt-1 text-right font-sans" 
            dir="rtl"
          >
            <p className="text-gray-400 font-bold text-[10px] mb-4 pr-1">
              قمرة القيادة الخاصة بوعيك النفسي، التقدم العام والتحليلات البيانية.
            </p>

            <div className="no-scrollbar">
              <TabView
                activeIndex={reflectionActiveTab}
                onTabChange={(e) => setReflectionActiveTab(e.index)}
                className="custom-tabview"
              >
                {/* Tab 1: Fuel & Rest */}
                <TabPanel headerTemplate={createTabHeader("pi-bolt", "الوقود")}>
                  <div className="space-y-6 pt-4">
                    <div className="bg-white border-2 border-blue-900 overflow-hidden rounded-2xl p-5 relative shadow-sm">
                      <div className="w-full flex justify-between items-center mb-3">
                        <h3 className="font-black text-blue-950 text-sm">
                          خزان الالتزام اليومي 🚀
                        </h3>
                        <span className="font-bold text-blue-900 text-lg">
                          {gData.fuel}%
                        </span>
                      </div>

                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4 p-0.5">
                        <div
                          className="h-full bg-blue-900 transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(30,58,138,0.3)]"
                          style={{ width: `${gData.fuel}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-gray-500 mb-5 leading-relaxed font-bold">
                        بنزين الالتزام يمثل دافعيتك. عندما تعمل وتسجل نشاطاً يقل
                        الوقود بنسبة <b className="font-black text-blue-900">%7</b>.
                        وعندما تأخذ راحة يزيد بنسبة <b className="font-black text-blue-900">%7</b>.
                      </p>

                      {!hasReflectedToday ? (
                        <div className="flex gap-2">
                          <Button
                            label="يوم عمل (-7%)"
                            icon="pi pi-bolt"
                            className="flex-1 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-xl py-3.5 font-black border-none hover:brightness-110 active:scale-95 transition-all shadow-md"
                            onClick={undertakeReflection}
                            disabled={gData.fuel <= 0}
                          />
                          <Button
                            label="أجازة (+7%)"
                            icon="pi pi-sun"
                            className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl py-3.5 font-black border-none hover:opacity-95 active:scale-95 transition-all shadow-md"
                            onClick={takeRestDay}
                          />
                        </div>
                      ) : (
                        <div className="text-center text-xs font-black text-blue-800 bg-blue-50 py-3 border border-dashed border-blue-200 rounded-xl">
                          ✨ تم تسجيل حالتك اليومية! عد غداً لشحن خزان وقودك مجدداً.
                        </div>
                      )}
                    </div>
                  </div>
                </TabPanel>

                {/* Tab 2: Insights & Charts */}
                <TabPanel headerTemplate={createTabHeader("pi-chart-bar", "إحصائيات")}>
                  <div className="space-y-6 pt-4">
                    {/* Summary Numbers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
                        <h5 className="text-[9px] text-slate-400 font-black uppercase mb-1">نسبة إنجاز المسار</h5>
                        <p className="text-2xl font-black text-blue-950">
                          {Math.round((stations.filter(s => unlockedStations.includes(s.id) && stationEnergy[s.id] === 100).length / stations.length) * 100)}%
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
                        <h5 className="text-[9px] text-slate-400 font-black uppercase mb-1">مجموع نقاط XP</h5>
                        <p className="text-2xl font-black text-indigo-600">{gData.xp}</p>
                      </div>
                    </div>

                    <TabView className="inner-stats-tabs mt-4">
                      {/* Acquired Info Tab */}
                      <TabPanel header="المعلومات المكتسبة" leftIcon="pi pi-lightbulb ml-2">
                        <div className="space-y-4 pt-4">
                          {reflections.length > 0 ? reflections.map((ref) => (
                            <div key={ref.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-sm font-black text-slate-800">{ref.taskTitle}</h4>
                                  <p className="text-[10px] text-indigo-500 font-bold">محطة: {ref.stationName}</p>
                                </div>
                                <span className="text-[9px] font-black text-slate-300">{new Date(ref.createdAt).toLocaleDateString('ar-EG')}</span>
                              </div>
                              
                              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                <label className="text-[9px] font-black text-blue-600 block mb-1">💡 ما تم تعلمه:</label>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">{ref.learnings || 'لم يتم تسجيل بيانات'}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50/30 p-2 rounded-xl border border-emerald-100">
                                  <label className="text-[9px] font-black text-emerald-600 block mb-1">💪 نقاط القوة:</label>
                                  <p className="text-[10px] text-slate-600 font-medium">{ref.strengths || 'N/A'}</p>
                                </div>
                                <div className="bg-rose-50/30 p-2 rounded-xl border border-rose-100">
                                  <label className="text-[9px] font-black text-rose-600 block mb-1">🧨 نقاط الضعف:</label>
                                  <p className="text-[10px] text-slate-600 font-medium">{ref.weaknesses || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          )) : <div className="text-center py-10 text-slate-400 font-bold text-xs">لا يوجد انعكاسات مسجلة بعد</div>}
                        </div>
                      </TabPanel>

                      {/* Professionalism Tab */}
                      <TabPanel header="مستوى الاحترافية" leftIcon="pi pi-star ml-2">
                        <div className="space-y-6 pt-6">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150"><Brain className="w-12 h-12" /></div>
                                <h4 className="text-xs font-black text-indigo-400 uppercase mb-2">متوسط التركيز</h4>
                                <div className="text-4xl font-black text-indigo-700">{avgFocus} <span className="text-sm">/ 5</span></div>
                                <div className="mt-4 flex justify-center">
                                  {[1,2,3,4,5].map(i => (
                                    <div key={i} className={`w-2 h-2 rounded-full mx-0.5 ${i <= Number(avgFocus) ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-5 scale-150"><Trophy className="w-12 h-12" /></div>
                                <h4 className="text-xs font-black text-amber-500 uppercase mb-2">متوسط الإتقان</h4>
                                <div className="text-4xl font-black text-amber-700">{avgMastery} <span className="text-sm">/ 10</span></div>
                                <div className="mt-4 w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-amber-600 rounded-full" style={{ width: `${(Number(avgMastery)/10)*100}%` }} />
                                </div>
                              </div>
                           </div>

                           <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                             <h4 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-500" />
                                طاقة المحطات المتراكمة 🔋
                             </h4>
                             <div className="space-y-4">
                                {stations.map((st) => {
                                  const energy = stationEnergy[st.id] || 0;
                                  const isUnlocked = unlockedStations.includes(st.id);
                                  return (
                                    <div key={st.id} className="space-y-1.5 text-right">
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-black text-slate-700 truncate max-w-[200px] flex items-center gap-1.5">
                                          <i className={`${st.icon && st.icon.startsWith("pi ") ? st.icon : "pi pi-flag-fill"} text-slate-400`}></i>
                                          {st.name}
                                        </span>
                                        <span className="font-black text-slate-400">{isUnlocked ? `${energy}%` : "🔒"}</span>
                                      </div>
                                      <div className="w-full h-2 bg-slate-50 border border-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-700 ${energy >= 100 ? "bg-emerald-500" : "bg-indigo-600"}`} style={{ width: `${isUnlocked ? energy : 0}%` }} />
                                      </div>
                                    </div>
                                  );
                                })}
                             </div>
                           </div>
                        </div>
                      </TabPanel>

                      {/* Practical Tab */}
                      <TabPanel header="التطبيق العملي" leftIcon="pi pi-briefcase ml-2">
                        <div className="space-y-4 pt-4">
                          {reflections.filter(r => r.didPractical).length > 0 ? reflections.filter(r => r.didPractical).map((ref) => (
                            <div key={ref.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
                              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-50 rounded-bl-3xl flex items-center justify-center z-10">
                                 <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              </div>
                              
                              <div className="mb-4 pl-2 pr-8">
                                <h4 className="text-sm font-black text-slate-900 mb-2 leading-tight">{ref.taskTitle || 'مهمة بدون عنوان'}</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-[9px] bg-slate-100 px-2.5 py-1 rounded-full font-black text-slate-500 flex items-center gap-1 shadow-sm border border-slate-200/50">
                                    <i className="pi pi-map-marker text-[8px]"></i>
                                    {ref.stationName}
                                  </span>
                                  <span className="text-[9px] bg-emerald-100 px-2.5 py-1 rounded-full font-black text-emerald-700 flex items-center gap-1 shadow-sm border border-emerald-200/50">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    تم التطبيق العملي
                                  </span>
                                  <span className="text-[9px] bg-blue-50 px-2.5 py-1 rounded-full font-black text-blue-600 flex items-center gap-1 shadow-sm border border-blue-100/50">
                                    <i className="pi pi-calendar text-[8px]"></i>
                                    {new Date(ref.createdAt).toLocaleDateString('ar-EG')}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 relative">
                                <div className="absolute -top-2 left-4 px-2 bg-indigo-100 text-indigo-700 rounded text-[8px] font-black uppercase">التفاصيل العملية</div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-700 pt-1">
                                   <Wrench className="w-3.5 h-3.5" />
                                   المشاكل والحلول المسجلة:
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                  {ref.practicalIssues || 'لم يتم تسجيل عوائق تقنية.'}
                                </p>
                              </div>
                            </div>
                          )) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center text-slate-300">
                               <Briefcase className="w-16 h-16 opacity-10 mb-4" />
                               <p className="text-xs font-black">لم يتم تسجيل أي تجارب عملية مكتملة بعد.</p>
                            </div>
                          )}
                        </div>
                      </TabPanel>
                    </TabView>
                  </div>
                </TabPanel>
              </TabView>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .inner-stats-tabs .p-tabview-nav {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          margin-bottom: 0 !important;
          border-bottom: 2px solid #f1f5f9 !important;
          border-radius: 0 !important;
        }
        .inner-stats-tabs .p-tabview-nav li {
          margin-bottom: -2px;
        }
        .inner-stats-tabs .p-tabview-nav li .p-tabview-nav-link {
          background: transparent !important;
          border: none !important;
          border-bottom: 2px solid transparent !important;
          font-size: 11px !important;
          font-weight: 900 !important;
          color: #94a3b8 !important;
          padding: 12px 16px !important;
          border-radius: 0 !important;
          display: flex;
          align-items: center;
        }
        .inner-stats-tabs .p-tabview-nav li.p-highlight .p-tabview-nav-link {
          color: #1e3a8a !important;
          border-bottom-color: #1e3a8a !important;
          box-shadow: none !important;
        }
        .inner-stats-tabs .p-tabview-panels {
          background: transparent !important;
          padding: 0 !important;
        }
      `}</style>
    </Dialog>
  );
}
