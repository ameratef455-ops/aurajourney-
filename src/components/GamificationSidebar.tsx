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
  return (
    <Dialog
      baseZIndex={LAYERS.GAMIFICATION_SIDEBAR}
      visible={gamificationSidebar}
      onHide={() => setGamificationSidebar(false)}
      className="w-[98vw] max-w-4xl font-sans text-xl"
      closable
      dismissableMask
      header={
        <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans" dir="rtl">
          <i className="pi pi-trophy text-blue-900"></i>
          <span className="font-black text-blue-950 tracking-tight">المحرك وجوائز الأداء 🏆</span>
        </div>
      }
    >
      <AnimatePresence>
        {gamificationSidebar && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 40 }}
            transition={{ type: "spring", damping: 20, stiffness: 350 }}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50 flex flex-col items-center text-center shadow-sm">
                      <span className="text-3xl mb-1 select-none">🪙</span>
                      <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-1">
                        نقاط الخبرة
                      </p>
                      <h4 className="text-xl font-black text-blue-900">
                        {gData.xp} XP
                      </h4>
                    </div>
                    <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 flex flex-col items-center text-center shadow-sm">
                      <span className="text-3xl mb-1 select-none">🧠</span>
                      <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-1">
                        مفاتيح التركيز
                      </p>
                      <h4 className="text-xl font-black text-amber-600">
                        {gData.keys} مفتاح
                      </h4>
                    </div>
                    <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100/50 flex flex-col items-center text-center shadow-sm">
                      <span className="text-3xl mb-1 select-none">🔥</span>
                      <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-1">
                        الالتزام (Streak)
                      </p>
                      <h4 className="text-xl font-black text-orange-600">
                        {gData.streak || 0} يوم
                      </h4>
                    </div>
                    <div className="bg-rose-50/30 p-5 rounded-2xl border border-rose-100/50 flex flex-col items-center text-center shadow-sm">
                      <span className="text-3xl mb-1 select-none">⛽</span>
                      <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-1">
                        البنزين اليومي
                      </p>
                      <h4 className="text-xl font-black text-rose-600">
                        {gData.fuel || 0}%
                      </h4>
                    </div>
                    <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/50 flex flex-col items-center text-center shadow-sm">
                      <span className="text-3xl mb-1 select-none">🔋</span>
                      <p className="text-xs text-slate-400 font-bold tracking-wider uppercase mb-1">
                        بطارية الخطة
                      </p>
                      <h4 className="text-xl font-black text-emerald-600">
                        {activeStationEnergy}%
                      </h4>
                    </div>
                  </div>
                </div>
              </TabPanel>

              {/* Tab 2: Engine and Awards */}
              <TabPanel headerTemplate={createTabHeader("pi-shop", "المتجر والمقايضة")}>
                <div className="pt-4 space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-blue-950 text-sm flex items-center gap-2">
                        <i className="pi pi-sync text-indigo-600"></i> تبديل نقاط الخبرة (XP) بمفاتيح تركيز
                      </h3>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">
                        متاح للاستبدال
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-5 font-light leading-relaxed">
                      هل تحتاج إلى مفاتيح تركيز لفك قفل الخطة التالية؟ يمكنك مقايضة نقاط خبرتك (XP) للحصول على مفاتيح فوراً بالمعدلات التالية:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1: 5 Keys */}
                      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-black text-slate-800 text-xs">حزمة مبتدئ 🧠</span>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">5 مفاتيح</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">تمنحك 5 مفاتيح تركيز لتقدم مرن.</p>
                        </div>
                        <Button
                          label={`مقايضة: 5 مفاتيح بـ 60 XP`}
                          icon="pi pi-sync"
                          className="w-full justify-center py-2.5 rounded-lg font-bold bg-slate-150 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-350 transition-all text-[11px] outline-none cursor-pointer disabled:opacity-50"
                          disabled={gData.xp < 60}
                          onClick={() => buyKeys(5)}
                        />
                      </div>

                      {/* Option 2: 10 Keys */}
                      <div className="bg-white p-4 rounded-xl border-indigo-100 border bg-indigo-50/10 shadow-sm flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-black text-indigo-950 text-xs">الحزمة القياسية ⚡</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">10 مفاتيح</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">القيمة الأفضل لفتح محطات متكاملة.</p>
                        </div>
                        <Button
                          label={`مقايضة: 10 مفاتيح بـ 120 XP`}
                          icon="pi pi-sync"
                          className="w-full justify-center py-2.5 rounded-lg font-bold bg-gradient-to-r from-indigo-700 to-blue-800 text-white border-none shadow-md shadow-indigo-700/10 hover:brightness-110 transition-all text-[11px] outline-none cursor-pointer disabled:opacity-50"
                          disabled={gData.xp < 120}
                          onClick={() => buyKeys(10)}
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
