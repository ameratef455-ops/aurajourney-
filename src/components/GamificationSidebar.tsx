import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { motion, AnimatePresence } from "motion/react";
import { LAYERS } from "../constants/layers";
import { vibrate, HAPITCS } from "../lib/haptics";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
      className="w-[98vw] max-w-4xl font-sans text-xl"
      style={{ borderRadius: '28px' }}
      maskClassName="backdrop-blur-md bg-blue-950/20"
      closable
      dismissableMask
      header={
        <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans animate-fade-in" dir="rtl">
          <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/50">
            <i className="pi pi-trophy text-amber-500 text-lg"></i>
          </div>
          <span className="font-black text-blue-950 tracking-tight">المحرك وجوائز الأداء 🏆</span>
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
            className="space-y-4 pt-1 text-right font-sans" 
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
                    <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/15 p-5 rounded-2xl border border-blue-200/50 shadow-xs flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none">🪙</span>
                          <div>
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">نقاط الخبرة</p>
                            <h4 className="text-lg font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-650 bg-clip-text text-transparent">{gData.xp} XP</h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full select-none">المستوى {Math.floor(gData.xp / 300) + 1}</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>طريق الترقية</span>
                          <span className="bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent font-extrabold">{xpInCurrentLevel}/300 XP ({Math.round(xpPercent)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100/80 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xpPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Keys Card - Electric Blue */}
                    <div className="bg-gradient-to-br from-sky-50/60 to-blue-50/15 p-5 rounded-2xl border border-sky-200/50 shadow-xs flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none">🔑</span>
                          <div>
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">مفاتيح التركيز</p>
                            <h4 className="text-lg font-black bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 bg-clip-text text-transparent">{gData.keys} مفاتيح</h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-full select-none">رصيد الفك</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>الهدف لفتح المحطات</span>
                          <span className="bg-gradient-to-r from-sky-600 to-blue-700 bg-clip-text text-transparent font-extrabold">{gData.keys}/{keysTarget} مفتاح ({Math.round(keysPercent)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100/80 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${keysPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Streak Card - Royal Cobalt Blue */}
                    <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/15 p-5 rounded-2xl border border-blue-200/40 shadow-xs flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none">🔥</span>
                          <div>
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">الالتزام المالي</p>
                            <h4 className="text-lg font-black bg-gradient-to-r from-blue-600 via-blue-700 to-sky-600 bg-clip-text text-transparent">{gData.streak || 0} يوم متواصل</h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full select-none">الستريك</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>هدف الشهر</span>
                          <span className="bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent font-extrabold">{gData.streak || 0}/{streakTarget} يوم ({Math.round(streakPercent)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100/80 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${streakPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-600 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fuel Card - Aquamarine Cyan-Blue */}
                    <div className="bg-gradient-to-br from-blue-50/40 to-slate-50/20 p-5 rounded-2xl border border-blue-155/40 shadow-xs flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none">⛽</span>
                          <div>
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">البنزين اليومي</p>
                            <h4 className="text-lg font-black bg-gradient-to-r from-blue-650 via-sky-600 to-blue-750 bg-clip-text text-transparent">{gData.fuel || 0}% كامل</h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full select-none justify-self-end">طاقة السير</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>مؤشر الخزان الحقيقي</span>
                          <span className="bg-gradient-to-r from-blue-650 to-sky-600 bg-clip-text text-transparent font-extrabold">{gData.fuel || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100/80 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${fuelPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-600 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Battery Card - Violet Ice-Blue */}
                    <div className="bg-gradient-to-br from-blue-50/50 to-slate-50/10 p-5 rounded-2xl border border-blue-150/40 shadow-xs flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all duration-300 md:col-span-2 lg:col-span-2">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none">🔋</span>
                          <div>
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">بطارية الخطة النشطة</p>
                            <h4 className="text-lg font-black bg-gradient-to-r from-blue-600 via-indigo-650 to-blue-800 bg-clip-text text-transparent">{activeStationEnergy}% شحن</h4>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full select-none">مستوى الإنجاز</span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>اكتمال مهام المحطة</span>
                          <span className="bg-gradient-to-r from-blue-650 to-indigo-700 bg-clip-text text-transparent font-extrabold">{activeStationEnergy}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100/80 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${batteryPercent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-600 via-blue-750 to-indigo-800 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* High Quality Performance & Growth Curve Chart */}
                  <div className="mt-8 bg-gradient-to-br from-slate-50/80 to-blue-50/30 border border-slate-200/50 p-6 rounded-3xl relative">
                    <div className="flex justify-between items-center mb-6" dir="rtl">
                      <div>
                        <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                          <i className="pi pi-chart-line text-blue-600"></i> منحنى الأداء والنمو المتزن 📈
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">مؤشرات تصاعد التزامك ومستوى الطاقة في رحلة الأورا</p>
                      </div>
                      <div className="flex gap-4 text-[9px] font-bold text-slate-500 select-none">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-blue-600" /> نقاط الأداء XP</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-sky-500" /> البنزين والتركيز %</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" /> شحن البطارية %</span>
                      </div>
                    </div>

                    <div className="h-[220px] w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={[
                            { name: "البداية", "نقاط الأداء XP": Math.max(10, Math.round(gData.xp * 0.15)), "التركيز والوقود %": 30, "البطارية %": 10 },
                            { name: "مرحلة 1", "نقاط الأداء XP": Math.max(50, Math.round(gData.xp * 0.45)), "التركيز والوقود %": Math.max(40, (gData.fuel || 60) - 15), "البطارية %": Math.max(25, Math.round(activeStationEnergy * 0.35)) },
                            { name: "مرحلة 2", "نقاط الأداء XP": Math.max(110, Math.round(gData.xp * 0.75)), "التركيز والوقود %": Math.max(50, (gData.fuel || 60) - 5), "البطارية %": Math.max(50, Math.round(activeStationEnergy * 0.75)) },
                            { name: "الآن", "نقاط الأداء XP": gData.xp, "التركيز والوقود %": gData.fuel || 60, "البطارية %": activeStationEnergy }
                          ]}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01}/>
                            </linearGradient>
                            <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <YAxis stroke="#94a3b8" tickLine={false} style={{ fontSize: '10px' }} />
                          <Tooltip 
                            contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'right', direction: 'rtl' }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 0' }}
                          />
                          <Area type="monotone" dataKey="نقاط الأداء XP" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                          <Area type="monotone" dataKey="التركيز والوقود %" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFuel)" />
                          <Area type="monotone" dataKey="البطارية %" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBattery)" />
                        </AreaChart>
                      </ResponsiveContainer>
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
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-600 to-blue-700 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm animate-pulse-slow">المميزة والأقوى ⭐</div>
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
