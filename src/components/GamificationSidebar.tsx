import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { motion, AnimatePresence } from "motion/react";
import { LAYERS } from "../constants/layers";
import { vibrate, HAPITCS } from "../lib/haptics";

export interface GamificationSidebarProps {
  gamificationSidebar: boolean;
  setGamificationSidebar: (val: boolean) => void;
  gamificationActiveTab: number;
  setGamificationActiveTab: (val: number) => void;
  createTabHeader: (icon: string, label: string) => (options: any) => React.ReactNode;
  gData: { xp: number; keys: number; fuel?: number; streak?: number };
  buyKeys: (count: 5 | 10) => void;
  activeStationEnergy?: number;
}

export function GamificationSidebar({
  gamificationSidebar,
  setGamificationSidebar,
  gamificationActiveTab,
  setGamificationActiveTab,
  createTabHeader,
  gData,
  buyKeys,
  activeStationEnergy = 0
}: GamificationSidebarProps) {
  
  // Calculate percentage progressions for stats
  const xpInCurrentLevel = gData.xp % 300;
  const xpPercent = Math.min(100, (xpInCurrentLevel / 300) * 100);
  
  const keysTarget = 20;
  const keysPercent = Math.min(100, (gData.keys / keysTarget) * 100);
  
  const streakTarget = 30;
  const streakPercent = Math.min(100, ((gData.streak || 0) / streakTarget) * 100);
  
  const fuelPercent = Math.min(100, gData.fuel || 0);
  const batteryPercent = Math.min(100, activeStationEnergy);

  return (
    <Dialog
      baseZIndex={LAYERS.GAMIFICATION_SIDEBAR}
      visible={gamificationSidebar}
      onHide={() => setGamificationSidebar(false)}
      className="w-[98vw] max-w-4xl font-sans"
      style={{ borderRadius: '28px' }}
      maskClassName="backdrop-blur-md bg-blue-950/20"
      closable
      dismissableMask
      header={
        <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans" dir="rtl">
          <div className="p-2 bg-gradient-to-br from-blue-900 to-indigo-950 rounded-xl border border-blue-900 shadow-sm">
            <i className="pi pi-trophy text-white text-lg"></i>
          </div>
          <span className="font-black text-black tracking-tight">المحرك وجوائز الأداء 🏆</span>
        </div>
      }
    >
      <AnimatePresence>
        {gamificationSidebar && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="space-y-4 pt-1 text-right font-sans text-black" 
            dir="rtl"
          >
            <TabView
              activeIndex={gamificationActiveTab}
              onTabChange={(e) => setGamificationActiveTab(e.index)}
              className="custom-tabview custom-spaced-tabs flex-1"
            >
              {/* Tab 1: Stats and Percentages */}
              <TabPanel headerTemplate={createTabHeader("pi-chart-pie", "تقدمك")}>
                <div className="pt-4 space-y-6">
                  {/* Unified Gorgeous Blue Gradients Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    
                    {/* XP Card - Deep Ocean Blue */}
                    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 rounded-3xl border border-blue-200/60 shadow-[0_12px_28px_-4px_rgba(59,130,246,0.06)] flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center shadow-md border border-blue-800">
                            <span className="text-2xl select-none">🪙</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">نقاط الخبرة الكلية</p>
                            <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 bg-clip-text text-transparent font-sans tracking-tight leading-none mt-1">
                              {gData.xp} <span className="text-xs font-black text-indigo-500 font-sans">XP</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full select-none shadow-xs">المستوى {Math.floor(gData.xp / 300) + 1}</span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>طريق الترقية للمستوى التالي</span>
                          <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent font-extrabold">{xpInCurrentLevel}/300 XP ({Math.round(xpPercent)}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-indigo-700 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Keys Card - Electric Blue */}
                    <div className="bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-6 rounded-3xl border border-sky-200/60 shadow-[0_12px_28px_-4px_rgba(14,165,233,0.06)] flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-800 to-sky-900 flex items-center justify-center shadow-md border border-blue-700">
                            <span className="text-2xl select-none">🔑</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">مفاتيح التركيز الحالية</p>
                            <div className="text-4xl font-extrabold bg-gradient-to-br from-sky-500 via-cyan-600 to-blue-700 bg-clip-text text-transparent font-sans tracking-tight leading-none mt-1">
                              {gData.keys} <span className="text-xs font-black text-sky-500 font-sans">مفاتيح</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1 rounded-full select-none shadow-xs">رصيد الفك</span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>الهدف لفتح المحطات القادمة</span>
                          <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent font-extrabold">{gData.keys}/{keysTarget} مفاتيح ({Math.round(keysPercent)}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${keysPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.3)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Streak Card - Royal Cobalt Blue */}
                    <div className="bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-6 rounded-3xl border border-indigo-200/60 shadow-[0_12px_28px_-4px_rgba(139,92,246,0.06)] flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-950 via-amber-955 to-orange-955 flex items-center justify-center shadow-md border border-orange-850">
                            <span className="text-2xl select-none">🔥</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">عدد الأيام المتواصلة</p>
                            <div className="text-4xl font-extrabold bg-gradient-to-br from-orange-500 via-rose-500 to-red-650 bg-clip-text text-transparent font-sans tracking-tight leading-none mt-1">
                              {gData.streak || 0} <span className="text-xs font-black text-rose-500 font-sans">يوم</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full select-none shadow-xs">الستريك الحالي</span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>الهدف الشهري للالتزام</span>
                          <span className="bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent font-extrabold">{gData.streak || 0}/{streakTarget} يوم ({Math.round(streakPercent)}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${streakPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-orange-500 via-rose-550 to-red-600 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fuel Card - Aquamarine Focus-Blue */}
                    <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 p-6 rounded-3xl border border-teal-200/60 shadow-[0_12px_28px_-4px_rgba(20,184,166,0.06)] flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all duration-350">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-750 to-sky-850 flex items-center justify-center shadow-md border border-blue-600">
                            <span className="text-2xl select-none">⛽</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">مخزون التركيز والوقود</p>
                            <div className="text-4xl font-extrabold bg-gradient-to-br from-cyan-600 via-teal-500 to-blue-750 bg-clip-text text-transparent font-sans tracking-tight leading-none mt-1">
                              {gData.fuel || 0}% <span className="text-xs font-black text-cyan-500 font-sans">مخزن</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full select-none shadow-xs">طاقة السير</span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>معدل طاقة السعي الحقيقية</span>
                          <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent font-extrabold">{gData.fuel || 0}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${fuelPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-600 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                          />
                        </div>
                      </div>
                    </div>



                  </div>
                </div>
              </TabPanel>

              {/* Tab 2: Shop & Trading */}
              <TabPanel headerTemplate={createTabHeader("pi-shop", "المتجر والمقايضة")}>
                <div className="pt-2 space-y-6">
                  
                  {/* Digital Wallet Overview */}
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl border border-blue-900/40">
                    <div className="absolute top-0 right-1/4 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-600/15 blur-3xl rounded-full" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div>
                        <h3 className="font-extrabold text-white text-lg flex items-center gap-2 mb-1.5">
                          <i className="pi pi-wallet text-blue-400"></i> محفظتك الرقمية والتبادل الذكي
                        </h3>
                        <p className="text-[11px] text-blue-100/70 max-w-xl font-medium leading-relaxed">
                          استخدم نقاط خبرتك (XP) بحكمة ومقايضتها للحصول على مفاتيح تركيز إضافية تتيح لك فك قفل خططك التعليمية بسهولة وسرعة ودون الانتظار طويلاً!
                        </p>
                      </div>

                      {/* Current Balance Chip */}
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 pr-4 rounded-2xl shrink-0 backdrop-blur-md">
                        <div className="text-right">
                          <p className="text-[9px] text-blue-200/60 font-black uppercase">الرصيد المتاح</p>
                          <p className="text-base font-black bg-gradient-to-r from-blue-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">{gData.xp} XP</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-xl select-none">🌐</div>
                      </div>
                    </div>
                  </div>

                  {/* Redesigned Trading Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Option 1: 5 Keys */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.02] rounded-full blur-2xl" />
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                          <div className="flex items-center gap-2">
                             <div className="w-10 h-10 rounded-xl bg-blue-400/5 border border-blue-300/10 flex items-center justify-center text-lg shadow-3xs select-none">🧠</div>
                            <div>
                              <span className="font-black text-slate-800 text-sm block">حزمة مبتدئ للتركيز</span>
                              <span className="text-[9px] text-slate-400 font-extrabold uppercase">الباقة البسيطة</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-blue-600 bg-blue-50/80 border border-blue-100 px-3 py-1 rounded-xl">5 مفاتيح</span>
                        </div>
                        <p className="text-xs text-slate-500 font-light leading-relaxed">
                          خيار مرن وسريع يمنحك 5 مفاتيح تركيز فورا لفك قفل المحطة أو الأقسام الجزئية في رحلتك الدافعة بنقاط مقدور عليها.
                        </p>
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-50 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>تكلفة المبادلة</span>
                          <span className="text-blue-700 font-extrabold">60 XP</span>
                        </div>
                        <Button
                          label={`مقايضة: 5 مفاتيح بـ 60 XP`}
                          icon="pi pi-sync"
                          className="w-full justify-center py-3.5 rounded-2xl font-black bg-slate-100 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white text-slate-700 border border-slate-120 hover:border-transparent transition-all text-xs outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-3xs group-hover:border-blue-200/50"
                          disabled={gData.xp < 60}
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            buyKeys(5);
                          }}
                        />
                      </div>
                    </div>

                    {/* Option 2: 10 Keys */}
                    <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 bg-indigo-50/5 shadow-sm hover:shadow-lg hover:border-indigo-300 hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-1 w-24 h-24 bg-indigo-500/[0.04] rounded-full blur-2xl" />
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">المميزة والأقوى ⭐</div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-indigo-50/50 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg shadow-3xs select-none">⚡</div>
                            <div>
                              <span className="font-black text-indigo-950 text-sm block">الحزمة القياسية الكبرى</span>
                              <span className="text-[9px] text-indigo-400 font-extrabold uppercase">التبادل الأقصى</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-xl">10 مفاتيح</span>
                        </div>
                        <p className="text-xs text-slate-500 font-light leading-relaxed">
                          القيمة الموفرة والأمثل لك، تمنحك 10 مفاتيح تركيز كدفعة واحدة تتيح لك حرية التنقل وفتح محطات متكاملة وجانبية فورا.
                        </p>
                      </div>

                      <div className="mt-6 pt-3 border-t border-indigo-50 flex flex-col gap-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                          <span>تكلفة المبادلة</span>
                          <span className="text-indigo-900 font-bold">120 XP (دون زيادة)</span>
                        </div>
                        <Button
                          label={`مقايضة: 10 مفاتيح بـ 120 XP`}
                          icon="pi pi-sync"
                          className="w-full justify-center py-3.5 rounded-2xl font-black bg-gradient-to-r from-indigo-600 to-blue-800 text-white border-none shadow-md shadow-indigo-600/25 hover:brightness-110 active:scale-95 transition-all text-xs outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={gData.xp < 120}
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            buyKeys(10);
                          }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </TabPanel>
            </TabView>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
