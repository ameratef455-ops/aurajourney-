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
  createTabHeader: (icon: string, label: string) => (options: any) => JSX.Element;
  gData: { xp: number; keys: number; fuel?: number };
  buyKeys: () => void;
  weeklyChallengeName: string;
  weeklyChallengeRequired: string;
  completedWeeklyTasks: number;
  totalWeeklyTasks: number;
  setWeeklyChallengeModalVisible: (val: boolean) => void;
}

export function GamificationSidebar({
  gamificationSidebar,
  setGamificationSidebar,
  gamificationActiveTab,
  setGamificationActiveTab,
  createTabHeader,
  gData,
  buyKeys,
  weeklyChallengeName,
  weeklyChallengeRequired,
  completedWeeklyTasks,
  totalWeeklyTasks,
  setWeeklyChallengeModalVisible,
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
              {/* Tab 1: Engine and Awards */}
              <TabPanel headerTemplate={createTabHeader("pi-trophy", "المحرك والجوائز")}>
                <div className="pt-4 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50 flex flex-col items-center text-center">
                      <span className="text-3xl mb-1 select-none">🪙</span>
                      <p className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">
                        نقاط الخبرة (XP)
                      </p>
                      <h4 className="text-2xl font-black text-blue-900">
                        {gData.xp} XP
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-2 font-light">
                        تكسبها من إنجاز المهام (+15 للأساسية و +25 للجانبية)
                      </p>
                    </div>
                    <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 flex flex-col items-center text-center">
                      <span className="text-3xl mb-1 select-none">🧠</span>
                      <p className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">
                        مفاتيح التركيز
                      </p>
                      <h4 className="text-2xl font-black text-amber-600">
                        {gData.keys} مفتاح
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-2 font-light">
                        مطلوبة لفك قفل المحطات المستقبلية (تكسبها من المهام الجانبية أو شرائها)
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-black text-blue-950 text-sm">
                        تبديل نقاط الخبرة 🔁
                      </h3>
                      <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold">
                        متاح للاستبدال
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4 font-light leading-relaxed">
                      هل تحتاج إلى مفاتيح تركيز لفك قفل المحطة التالية؟ يمكنك مقايضة نقاط خبرتك. معدل الاستبدال: <b className="font-bold">10 مفاتيح مقابل 70 XP</b>.
                    </p>
                    <Button
                      label={`مقايضة: شراء 10 مفاتيح بـ 70 XP`}
                      icon="pi pi-sync"
                      className="w-full justify-center p-3 rounded-xl font-bold bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 text-white border-none shadow-md shadow-blue-950/10 hover:brightness-110 transition-all text-xs outline-none cursor-pointer disabled:opacity-50"
                      disabled={gData.xp < 70}
                      onClick={buyKeys}
                    />
                  </div>
                </div>
              </TabPanel>

              {/* Tab 2: Weekly Challenge */}
              <TabPanel headerTemplate={createTabHeader("pi-calendar-plus", "تحدي الأسبوع")}>
                <div className="pt-4 space-y-4">
                  <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-5 rounded-2xl border border-indigo-100/30 text-right">
                    <div className="flex justify-between items-center mb-3">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-black">تحدي أسبوعي مخصّص 🎯</span>
                      <span className="text-amber-600 font-black text-xs">🎁 30 XP ثابتة</span>
                    </div>

                    <h3 className="font-extrabold text-indigo-950 text-base mb-1">{weeklyChallengeName}</h3>
                    <p className="text-slate-500 font-light text-xs leading-relaxed">
                      {weeklyChallengeRequired}
                    </p>

                    {/* Progress Indicator Card - Click opens Dialog */}
                    <div 
                      onClick={() => {
                        vibrate(HAPITCS.MAJOR_CLICK);
                        setWeeklyChallengeModalVisible(true);
                      }}
                      className="my-3 bg-white/90 border border-indigo-100/50 hover:border-indigo-300 p-4 rounded-xl cursor-pointer transition-all space-y-2 group shadow-sm text-right"
                    >
                      <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                        <span className="flex items-center gap-1.5 text-indigo-900 group-hover:text-indigo-700 transition-colors">
                          <i className="pi pi-list text-indigo-600 text-xs"></i>
                          <span>مهام التحدي الأسبوعي ({completedWeeklyTasks} / {totalWeeklyTasks}):</span>
                        </span>
                        <span className="text-amber-500 hover:scale-115 transition-transform">
                          <i className="pi pi-pencil text-[11px] font-black"></i>
                        </span>
                      </div>

                      {totalWeeklyTasks > 0 && (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-1 p-0.5">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${(completedWeeklyTasks / totalWeeklyTasks) * 100}%` }}
                          />
                        </div>
                      )}

                      <div className="text-[10px] text-indigo-400/90 font-bold text-center pt-1 leading-normal">
                        🎯 انقر هنا لفتح وإدارة مهام التحدي وإنجازها!
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
