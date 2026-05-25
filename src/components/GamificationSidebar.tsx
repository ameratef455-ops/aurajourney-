import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS } from "../lib/haptics";

export interface GamificationSidebarProps {
  gamificationSidebar: boolean;
  setGamificationSidebar: (val: boolean) => void;
  gamificationActiveTab: number;
  setGamificationActiveTab: (val: number) => void;
  createTabHeader: (icon: string, label: string) => (options: any) => React.ReactNode;
  gData: { xp: number; keys: number; fuel?: number; streak?: number };
  buyKeys: () => void;
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
                        بطارية المحطة
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
                        <i className="pi pi-sync text-blue-500"></i> تبديل نقاط الخبرة
                      </h3>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
                        متاح للاستبدال
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-5 font-light leading-relaxed">
                      هل تحتاج إلى مفاتيح تركيز لفك قفل المحطة التالية؟ يمكنك مقايضة نقاط خبرتك. معدل الاستبدال: <b className="font-bold">10 مفاتيح مقابل 70 XP</b>.
                    </p>
                    <Button
                      label={`مقايضة: شراء 10 مفاتيح بـ 70 XP`}
                      icon="pi pi-sync"
                      className="w-full justify-center p-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 text-white border-none shadow-md shadow-blue-950/10 hover:brightness-110 transition-all text-xs outline-none cursor-pointer disabled:opacity-50"
                      disabled={gData.xp < 70}
                      onClick={buyKeys}
                    />
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
