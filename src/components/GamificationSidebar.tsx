import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { LAYERS } from "../constants/layers";
import { vibrate, HAPITCS } from "../lib/haptics";
import { GrowthTree } from "./GrowthTree";
import { db } from "../db";
import { useLiveQuery } from "dexie-react-hooks";
import { toast as hotToast } from "react-hot-toast";
import confetti from "canvas-confetti";

export interface GamificationSidebarProps {
  gamificationSidebar: boolean;
  setGamificationSidebar: (val: boolean) => void;
  gamificationActiveTab: number;
  setGamificationActiveTab: (val: number) => void;
  createTabHeader: (icon: string, label: string) => (options: any) => React.ReactNode;
  gData: { xp: number; keys: number; fuel?: number; streak?: number; claimedAchievements?: string[]; lastOracleClaimDate?: string };
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

  // Live Query for User Claimed Achievements & Custom States
  const settings = useLiveQuery(() => db.userSettings.toArray());
  const user = settings?.[0];
  const claimedAchievements = (user?.gameData as any)?.claimedAchievements || [];
  const lastOracleClaimDate = (user?.gameData as any)?.lastOracleClaimDate || "";
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyClaimedOracle = lastOracleClaimDate === todayStr;

  const [activeOracleQuote, setActiveOracleQuote] = useState<any>(null);

  const allAvailableTasks = useLiveQuery(() => db.tasks.toArray()) || [];
  const allStations = useLiveQuery(() => db.stations.toArray()) || [];

  // Creative Gamification Achievements List
  const achievements = [
    {
      id: "focus_rookie",
      title: "مستكشف المحطات 🗺️",
      description: "بلوغ المستوى الأول على الأقل وتجميع 300 نقطة خبرة (XP) فأكثر.",
      check: () => gData.xp >= 300,
      rewardText: "+50 XP",
      rewardAmount: 50,
      rewardType: "xp",
      icon: "pi-compass"
    },
    {
      id: "focus_pioneer",
      title: "رائد المفاتيح الكبرى 🔑",
      description: "امتلاك ما لا يقل عن 8 مفاتيح تركيز في خزينتك حالياً.",
      check: () => gData.keys >= 8,
      rewardText: "+80 XP",
      rewardAmount: 80,
      rewardType: "xp",
      icon: "pi-key"
    },
    {
      id: "focus_review_legend",
      title: "وسام ترويض الفجوات 🧠",
      description: "إنهاء خطة المراجعة الثلاثية لمهمة واحدة على الأقل.",
      check: () => {
        return allAvailableTasks.some(t => t.title && t.title.includes('المراجعة 3') && t.isCompleted);
      },
      rewardText: "+3 مفاتيح تركيز",
      rewardAmount: 3,
      rewardType: "keys",
      icon: "pi-shield"
    },
    {
      id: "focus_flame",
      title: "شعلة الالتزام الدائم 🔥",
      description: "الاستمرارية في العمل لـ 3 أيام متواصلة كستريك حافز ممتد.",
      check: () => (gData.streak || 0) >= 3,
      rewardText: "+120 XP",
      rewardAmount: 120,
      rewardType: "xp",
      icon: "pi-clone"
    },
    {
      id: "focus_master",
      title: "العلامة الحازم 🎓",
      description: "تجميع رصيد غني من الخبرات يتخطى 600 XP.",
      check: () => gData.xp >= 600,
      rewardText: "+5 مفاتيح تركيز",
      rewardAmount: 5,
      rewardType: "keys",
      icon: "pi-graduation-cap"
    },
    {
      id: "focus_capsule_hunter",
      title: "صائد الأقراص والكبسولات 💊",
      description: "شراء واستهلاك كبسولتين ذهنيتين على الأقل من متجر الفوائد وعملات XP.",
      check: () => ((user?.gameData as any)?.consumedCapsules || 0) >= 2,
      rewardText: "+120 XP",
      rewardAmount: 120,
      rewardType: "xp",
      icon: "pi-star-fill"
    },
    {
      id: "focus_diary_sage",
      title: "حكيم التدوين والتفكر 📝",
      description: "كتابة وتخزين ما لا يقل عن 5 ملاحظات أو وقفات فكرية بداخل دفتر السعي اليومي.",
      check: () => {
        const notes = user?.notes || {};
        let count = 0;
        Object.values(notes).forEach((v: any) => {
          if (Array.isArray(v)) count += v.length;
        });
        return count >= 5;
      },
      rewardText: "+150 XP",
      rewardAmount: 150,
      rewardType: "xp",
      icon: "pi-bookmark"
    },
    {
      id: "title_solver_of_3_task_riddles",
      title: "حل 3 ألغاز لثلاث مهام 🧩",
      description: "إنجاز 3 مهام تحتوي على ألغاز منطقية بنجاح.",
      check: () => {
        return allAvailableTasks.filter(t => t.riddleDetails && t.riddleAnswer && t.isCompleted).length >= 3;
      },
      rewardText: "لقب الخريطة + 150 XP",
      rewardAmount: 150,
      rewardType: "xp",
      icon: "pi-hashtag"
    },
    {
      id: "title_solver_of_plan_riddle",
      title: "إنهاء لغز الخطة 🗺️",
      description: "النجاح في إنهاء محطة رئيسية تحتوي على لغز كبير.",
      check: () => {
        return allStations.some(s => s.riddleDetails && s.riddleAnswer && (s as any).isCompleted);
      },
      rewardText: "لقب الخريطة + 200 XP",
      rewardAmount: 200,
      rewardType: "xp",
      icon: "pi-map"
    },
    {
      id: "title_hidden_riddle_master",
      title: "اللغز الخفي 👁️",
      description: "اكتشاف وإنهاء اللغز الخفي المخصص للمصادر الخفية في إحدى المهام.",
      check: () => {
        return allAvailableTasks.some(t => t.hiddenRiddleDetails && t.isCompleted);
      },
      rewardText: "لقب الخريطة + 250 XP",
      rewardAmount: 250,
      rewardType: "xp",
      icon: "pi-eye"
    }
  ];

  const dailyOracleQuotes = [
    { text: "التركيز ليس مجرد عمل، بل هو صلاة السعي الشمولية تجاه حلمك الأكبر.", challenge: "أنجز إحدى المهام الرئيسية لتثبت جدارتك واستحقاقك العملي!" },
    { text: "عقل منظم ينتج فكراً متيناً وتوجيهاً واضحاً يدفع الصعاب جانباً.", challenge: "راجع ملاحظات المحطة الموجهة وسجل تدوينة واحدة في دفتر اليوم!" },
    { text: "كل خطوة متناهية الصغر تخطوها اليوم، هي ركيزة صلبة في تشييد بنيان مستقبلك.", challenge: "افتت إحدى المهام المعقدة لثلاث خطوات بسيطة وأنجز أولاها!" },
    { text: "الاستمرارية تكتسح النبوغ الخامل دائماً، والستريك المتواصل درعك الأمثل.", challenge: "واظب على الحضور الشغول وحافظ على وقودك مشحوناً!" }
  ];

  const handleClaimAchievement = async (ach: typeof achievements[0]) => {
    if (!user) return;
    vibrate(HAPITCS.MAJOR_CLICK);

    const updatedClaimed = [...claimedAchievements, ach.id];
    let updatedXp = gData.xp;
    let updatedKeys = gData.keys;

    if (ach.rewardType === "xp") {
      updatedXp += ach.rewardAmount;
    } else if (ach.rewardType === "keys") {
      updatedKeys += ach.rewardAmount;
    }

    const currentTitles = (gData as any).unlockedTitles || [];
    let updatedTitles = currentTitles;
    
    if (ach.id.startsWith("title_")) {
      updatedTitles = [...currentTitles, ach.id];
    }

    const updatedGameData = {
      ...gData,
      xp: updatedXp,
      keys: updatedKeys,
      claimedAchievements: updatedClaimed,
      unlockedTitles: updatedTitles
    } as any;

    await db.userSettings.update(user.id, {
      gameData: updatedGameData
    });

    hotToast.success(`تم استلام جائزة: ${ach.title}! 🎁`);
  };

  const handleRevealOracle = async () => {
    if (!user) return;
    vibrate(HAPITCS.MAJOR_CLICK);

    const randomQuote = dailyOracleQuotes[Math.floor(Math.random() * dailyOracleQuotes.length)];
    setActiveOracleQuote(randomQuote);

    const updatedGameData = {
      ...gData,
      xp: gData.xp + 25,
      lastOracleClaimDate: todayStr
    } as any;

    await db.userSettings.update(user.id, {
      gameData: updatedGameData
    });

    hotToast.success("كشفت نبوءة طالع السير وربحت +25 XP! 🔮");
  };

  const buyTreasure = async (treasureType: string, costKeys: number) => {
    if (!user) return;
    if (gData.keys < costKeys) {
      hotToast.error("عذراً، رصيد المفاتيح (Keys) غير كافٍ لإتمام عملية الشراء! اقتني المزيد من المتجر أو عبر المهام 🔑");
      return;
    }
    vibrate(HAPITCS.SUCCESS);
    
    const currentOwned = (user.gameData as any)?.ownedTreasures || {};
    const updatedOwned = {
      ...currentOwned,
      [treasureType]: (currentOwned[treasureType] || 0) + 1
    };

    const updatedGameData = {
      ...gData,
      keys: gData.keys - costKeys,
      ownedTreasures: updatedOwned
    };

    await db.userSettings.update(user.id, {
      gameData: updatedGameData as any
    });

    hotToast.success(`مبارك! لقد استخرجت كنزاً أسطورياً بالاعتماد على المفاتيح التي جمعتها 💎`);
  };

  const buyCapsule = async (capsuleType: 'focusClarity' | 'hyperLearning', cost: number) => {
    if (!user) return;
    if (gData.xp < cost) {
      hotToast.error("عذراً، رصيد نقاط الخبرة (XP) غير كافٍ لإتمام عملية الشراء! 🪙");
      return;
    }
    vibrate(HAPITCS.SUCCESS);
    
    const currentOwned = (user.gameData as any)?.ownedCapsules || { focusClarity: 0, hyperLearning: 0 };
    const updatedOwned = {
      ...currentOwned,
      [capsuleType]: (currentOwned[capsuleType] || 0) + 1
    };

    const updatedGameData = {
      ...gData,
      xp: gData.xp - cost,
      ownedCapsules: updatedOwned
    };

    await db.userSettings.update(user.id, {
      gameData: updatedGameData as any
    });

    hotToast.success(`لقد اشتريت كبسولة نجاح جديدة! 💊 تم إضافتها إلى حقيبتك.`);
  };

  const consumeCapsule = async (capsuleType: 'focusClarity' | 'hyperLearning') => {
    if (!user) return;
    const currentOwned = (user.gameData as any)?.ownedCapsules || { focusClarity: 0, hyperLearning: 0 };
    
    if (!currentOwned[capsuleType] || currentOwned[capsuleType] <= 0) {
      hotToast.error("لا تملك أي كبسولات من هذا النوع في حقيبتك حالياً! 🎒");
      return;
    }

    vibrate(HAPITCS.COMPLETE);
    confetti({ zIndex: 999999999, particleCount: 80, spread: 60 });

    const updatedOwned = {
      ...currentOwned,
      [capsuleType]: currentOwned[capsuleType] - 1
    };

    let title = "";
    let message = "";
    if (capsuleType === 'focusClarity') {
      title = "كبسولة صفاء الذهن 🧘‍♂️";
      message = "تم تفعيل درع صفاء الذهن الخاص بك! تجميد الاستريك (السلسلة) نشط الآن لحمايتها بنجاح لمدة 48 ساعة متواصلة من الانقطاع التلقائي.";
    } else if (capsuleType === 'hyperLearning') {
      title = "كبسولة المعرفة والمراجع 📚";
      message = "تم تفعيل حاسة التعلم الفائق! كشفت الكبسولة روابط وملاحظات إضافية ذكية في محطات رحلتك الممتدة.";
    }

    const consumedCount = (gData as any).consumedCapsules || 0;
    
    const updatedGameData = {
      ...gData,
      ownedCapsules: updatedOwned,
      consumedCapsules: consumedCount + 1
    } as any;

    if (capsuleType === 'focusClarity') {
      updatedGameData.streakFreezedUntil = Date.now() + 48 * 60 * 60 * 1000;
    } else if (capsuleType === 'hyperLearning') {
      updatedGameData.hyperLearningActive = true;
    }

    await db.userSettings.update(user.id, {
      gameData: updatedGameData as any
    });

    hotToast.custom((t) => (
      <div className={`p-5 bg-slate-900 border border-purple-500 rounded-3xl flex flex-col gap-2 max-w-sm text-right text-white shadow-2xl ${t.visible ? 'animate-in fade-in zoom-in-95' : 'animate-out fade-out'}`} dir="rtl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🧪</span>
          <div>
            <h4 className="text-xs font-black text-purple-300">تم استهلاك {title}!</h4>
            <p className="text-[10px] text-slate-350 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    ), { duration: 6000 });
  };

  return (
    <Dialog
      maximized
      baseZIndex={LAYERS.GAMIFICATION_SIDEBAR}
      visible={gamificationSidebar}
      onHide={() => setGamificationSidebar(false)}
      className="font-sans"
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
        {gamificationSidebar && (
          <div 
            className="space-y-4 pt-1 text-right font-sans text-black css-side-panel" 
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
                  {/* The Growth Tree Visualizer */}
                  <div className="mb-8">
                    <GrowthTree xp={gData.xp} keys={gData.keys} />
                  </div>

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
                          <div 
                            style={{ width: `${xpPercent}%`, transition: 'width 1s ease-out' }}
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
                          <div 
                            style={{ width: `${keysPercent}%`, transition: 'width 1s ease-out' }}
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
                          <div 
                            style={{ width: `${streakPercent}%`, transition: 'width 1s ease-out' }}
                            className="h-full bg-gradient-to-r from-orange-500 via-rose-550 to-red-600 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medals Collection Card - Warm Lavender and Amber */}
                    <div className="bg-gradient-to-br from-purple-50 via-white to-amber-50 p-6 rounded-3xl border border-purple-200/60 shadow-[0_12px_28px_-4px_rgba(168,85,247,0.06)] flex flex-col justify-between hover:shadow-lg hover:scale-[1.01] transition-all duration-350">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-800 to-indigo-950 flex items-center justify-center shadow-md border border-purple-700">
                            <span className="text-2xl select-none">🏅</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">معدل اكتمال خزانة الأوسمة</p>
                            <div className="text-4xl font-extrabold bg-gradient-to-br from-purple-600 via-indigo-650 to-amber-600 bg-clip-text text-transparent font-sans tracking-tight leading-none mt-1">
                              {achievements.filter(ach => claimedAchievements.includes(ach.id)).length}/{achievements.length} <span className="text-xs font-black text-purple-500 font-sans">وسام</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full select-none shadow-xs">خزانة الأوسمة</span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                          <span>نسبة حيازة شارات الفخر والامتياز</span>
                          <span className="bg-gradient-to-r from-purple-600 to-amber-600 bg-clip-text text-transparent font-extrabold">{Math.min(100, Math.round((achievements.filter(ach => claimedAchievements.includes(ach.id)).length / achievements.length) * 100))}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/20">
                          <div 
                            style={{ width: `${Math.min(100, Math.round((achievements.filter(ach => claimedAchievements.includes(ach.id)).length / achievements.length) * 100))}%`, transition: 'width 1s ease-out' }}
                            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </TabPanel>

              {/* Tab 3: Achievements & Badges (New Custom Gamification design) */}
              <TabPanel headerTemplate={createTabHeader("pi-id-card", "الألقاب والبطولات")}>
                <div className="pt-2 space-y-6">
                  <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-purple-950 p-6 rounded-3xl text-white relative overflow-hidden shadow-xl border border-blue-900/40">
                    <div className="absolute top-0 right-1/4 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
                    <h3 className="font-extrabold text-white text-lg flex items-center gap-2 mb-1.5">
                      <i className="pi pi-verified text-purple-400"></i> خزانة الإنجازات وأوسمة السعي الشغول
                    </h3>
                    <p className="text-[11px] text-blue-100/70 max-w-2xl font-medium leading-relaxed">
                      شارات الشرف والامتياز تُمنح فقط لمن يحاربون التشتت بضراوة ويكملون خطط المراجعة ويسجلون تقييمهم بدقة. حقق الشروط للمطالبة بمكافآت XP المباشرة ومفاتيح التركيز الفريدة!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((ach) => {
                      const isCompleted = ach.check();
                      const isClaimed = claimedAchievements.includes(ach.id);

                      return (
                        <div 
                          key={ach.id} 
                          className={`p-5 rounded-3xl border transition-all duration-350 flex items-center justify-between group relative overflow-hidden ${
                            isClaimed 
                              ? "bg-slate-50/70 border-slate-200" 
                              : isCompleted 
                              ? "bg-gradient-to-br from-emerald-50/20 via-white to-indigo-50/10 border-emerald-200 shadow-sm hover:shadow-md" 
                              : "bg-white border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shadow-2xs border ${
                              isClaimed 
                                ? "bg-slate-100 border-slate-200 text-slate-400" 
                                : isCompleted 
                                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400" 
                                : "bg-slate-50 text-slate-350 border-slate-100"
                            }`}>
                              <i className={`pi ${ach.icon}`} />
                            </div>
                            <div className="space-y-0.5">
                              <span className={`font-black text-sm block ${isClaimed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {ach.title}
                              </span>
                              <p className="text-[11px] text-slate-400 font-light max-w-sm leading-snug">
                                {ach.description}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                              isClaimed 
                                ? "bg-slate-100 text-slate-400" 
                                : isCompleted 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : "bg-indigo-50/50 text-indigo-600 border border-indigo-100"
                            }`}>
                              {ach.rewardText}
                            </span>

                            {isClaimed ? (
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <i className="pi pi-check text-[8px]" /> تم الاستلام
                              </span>
                            ) : isCompleted ? (
                              <Button
                                label="استلم المكافأة 🎁"
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-1.5 rounded-xl border-none text-[10px] cursor-pointer shadow-sm active:scale-95 transition-all text-center"
                                onClick={() => handleClaimAchievement(ach)}
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <i className="pi pi-lock text-[8px]" /> مقفل
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabPanel>

              {/* Tab 4: Oracle Predictions (Daily Fortune Oracle design) */}
              <TabPanel headerTemplate={createTabHeader("pi-compass", "طالع السعي" )}>
                <div className="pt-2 space-y-6">
                  <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto py-6 font-sans">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 text-white flex items-center justify-center text-3xl shadow-lg mb-4 animate-bounce">
                      🔮
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-xl">صندوق طالع السعي اليومي ونبوءة العزم</h3>
                    <p className="text-xs text-slate-400 mt-2 max-w-sm">
                      انقر مرة واحدة كل 24 ساعة لكشف طالع نجاحك اليومي، وتلقّي التحدي الفكري الخاص بك واحصل على فوز ممتد كلياً بمقدار **+25 XP** كهدية عزم!
                    </p>

                    <div className="mt-8 w-full">
                      {alreadyClaimedOracle ? (
                        <div className="space-y-4">
                          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-150 text-right space-y-3">
                            <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-extrabold px-2.5 py-1 rounded-full">نبوءة اليوم المستكشفة 🌟</span>
                            <blockquote className="text-sm font-bold text-slate-700 leading-relaxed italic">
                              &quot;{activeOracleQuote?.text || "التركيز ليس مجرد عمل، بل هو صلاة السعي الشمولية تجاه حلمك الأكبر."}&quot;
                            </blockquote>
                            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5">
                              <span className="text-[10px] font-black text-emerald-600">🎯 تحدي اليوم المقترح:</span>
                              <span className="text-xs font-semibold text-slate-600">{activeOracleQuote?.challenge || "أنجز إحدى المهام الرئيسية لتثبت جدارتك واستحقاقك العملي!"}</span>
                            </div>
                          </div>
                          
                          <div className="bg-indigo-50/30 text-indigo-700 border border-indigo-100/30 p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black">
                            <i className="pi pi-clock-circle" /> لقد كشفت طالع اليوم مسبقاً! عود غداً لمعرفة نبوءتك القادمة والمطالبة بالجائزة.
                          </div>
                        </div>
                      ) : (
                        <Button
                          label="أكشف نبوءة طالع اليوم واحصل على +25 XP! 🔮"
                          className="w-full bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white font-extrabold py-4 px-6 rounded-2xl border-none shadow-md shadow-purple-600/20 hover:brightness-110 active:scale-95 transition-all text-xs outline-none cursor-pointer"
                          onClick={handleRevealOracle}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </TabPanel>

              {/* Tab 5: Shop & Trading */}
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

                  {/* Capsules Store Section */}
                  <div className="border-t border-slate-100 pt-8 mt-8 space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💊</span>
                      <h4 className="font-extrabold text-slate-900 text-lg">صيدلية السعي والكبسولات الذهنية 🧪</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      
                      {/* Capsule 1: focusClarity */}
                      <div className="bg-gradient-to-br from-indigo-50/20 via-white to-blue-50/20 p-5 rounded-3xl border border-blue-100/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-all divide-y divide-slate-50">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🧘‍♂️</span>
                            <span className="font-black text-slate-800 text-xs text-right">كبسولة صفاء الذهن</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed mb-3 font-sans">
                            تضمن الكبسولة وضع درع حماية لتجميد الستريك (السلسلة) تلقائياً لمدة 48 ساعة متواصلة لحمايتها كلياً من الانقطاع حتى لو لم تسجل حضوراً.
                          </p>
                        </div>
                        <div className="className-wrapper pt-3 mt-auto flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-400">التكلفة</span>
                            <span className="text-indigo-600">100 XP</span>
                          </div>
                          <Button 
                            label="شراء الكبسولة 🪙" 
                            disabled={gData.xp < 100}
                            className="w-full text-[9px] font-bold py-2 px-3 border-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all text-center"
                            onClick={() => buyCapsule('focusClarity', 100)}
                          />
                        </div>
                      </div>

                      {/* Capsule 2: hyperLearning */}
                      <div className="bg-gradient-to-br from-purple-50/20 via-white to-pink-50/20 p-5 rounded-3xl border border-purple-100/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-all divide-y divide-slate-50">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">📚</span>
                            <span className="font-black text-slate-800 text-xs text-right">كبسولة علم ومعرفة فائقة</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-light leading-relaxed mb-3 font-sans">
                            تنشيط فوري لروابط مساعدة ومصادر تعليمية ذكية إضافية غنية بالمحطات لتحفيز الفهم الشغوف.
                          </p>
                        </div>
                        <div className="className-wrapper pt-3 mt-auto flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-400">التكلفة</span>
                            <span className="text-purple-600">150 XP</span>
                          </div>
                          <Button 
                            label="شراء الكبسولة 🪙" 
                            disabled={gData.xp < 150}
                            className="w-full text-[9px] font-bold py-2 px-3 border-none bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all text-center"
                            onClick={() => buyCapsule('hyperLearning', 150)}
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Precious Treasures Section (Bought with Keys) */}
                  <div className="border-t border-slate-100 pt-8 mt-8 space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏆</span>
                      <h4 className="font-extrabold text-slate-900 text-lg">خزنة الكنوز الأسطورية (حصرية بالمفاتيح) 🗝️</h4>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-3xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl"></div>
                       <p className="text-xs text-amber-900/70 font-bold mb-5 relative z-10 font-sans leading-relaxed">
                         المفاتيح ليست فقط لفتح المحطات! يمكنك استغلالها للحصول على مقتنيات ثمينة وكنوز تذكارية تضاف إلى ملفك الشخصي كأوسمة نادرة للأبد.
                       </p>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                          
                          {/* Treasure 1 */}
                          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center text-center gap-3 hover:scale-105 transition-transform group">
                             <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 group-hover:rotate-12 transition-transform">
                                📜
                             </div>
                             <div>
                               <h5 className="font-black text-amber-950 text-sm">وثيقة الحكمة الخالدة</h5>
                               <p className="text-[9px] text-slate-500 mt-1 font-bold">تذكار رقمي يرمز لصبرك في التعلم المستمر.</p>
                             </div>
                             <Button 
                               label="15 مفتاح 🗝️" 
                               disabled={gData.keys < 15}
                               onClick={() => buyTreasure('wisdomScroll', 15)}
                               className="w-full text-[10px] font-black mt-2 py-2 border-none bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer rounded-xl transition-colors"
                             />
                          </div>

                          {/* Treasure 2 */}
                          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center text-center gap-3 hover:scale-105 transition-transform group">
                             <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30 group-hover:-rotate-12 transition-transform">
                                🌱
                             </div>
                             <div>
                               <h5 className="font-black text-emerald-950 text-sm">بذرة الإلهام المتجذرة</h5>
                               <p className="text-[9px] text-slate-500 mt-1 font-bold">نبتة أسطورية تزين حديقتك المعرفية.</p>
                             </div>
                             <Button 
                               label="25 مفتاح 🗝️" 
                               disabled={gData.keys < 25}
                               onClick={() => buyTreasure('inspirationSeed', 25)}
                               className="w-full text-[10px] font-black mt-2 py-2 border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer rounded-xl transition-colors"
                             />
                          </div>

                          {/* Treasure 3 */}
                          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center text-center gap-3 hover:scale-105 transition-transform group">
                             <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                👑
                             </div>
                             <div>
                               <h5 className="font-black text-blue-950 text-sm">تاج التفوق الموسيقي</h5>
                               <p className="text-[9px] text-slate-500 mt-1 font-bold">الجوهرة الأعظم. لا يقدر بثمن إلا للذين وصلوا للقمة.</p>
                             </div>
                             <Button 
                               label="50 مفتاح 🗝️" 
                               disabled={gData.keys < 50}
                               onClick={() => buyTreasure('crownOfExcellence', 50)}
                               className="w-full text-[10px] font-black mt-2 py-2 border-none bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer rounded-xl transition-colors"
                             />
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Redesigned Bag Inventory Section */}
                  <div className="border-t border-slate-100 pt-8 mt-8 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎒</span>
                        <h4 className="font-extrabold text-slate-900 text-base">حقيبة كبسولاتك والجرعات المخزنة</h4>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">استهلك وجرّب المفعول فوراً 🧪</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      
                      {/* Inv 1 */}
                      <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-200/50 text-right" dir="rtl">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">🧘‍♂️</span>
                          <div>
                            <span className="text-xs font-black text-slate-800 block">صفاء الذهن</span>
                            <span className="text-[10px] text-slate-400">المقتنى: {((user?.gameData as any)?.ownedCapsules?.focusClarity) || 0}</span>
                          </div>
                        </div>
                        { (Number((user?.gameData as any)?.ownedCapsules?.focusClarity) || 0) > 0 && (
                          <Button 
                            label="تفعيل 🧪" 
                            className="px-2.5 py-1 text-[9px] font-bold border-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-115 text-white rounded-lg cursor-pointer transition-all"
                            onClick={() => consumeCapsule('focusClarity')}
                          />
                        )}
                      </div>

                      {/* Inv 2 */}
                      <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-200/50 text-right" dir="rtl">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">📚</span>
                          <div>
                            <span className="text-xs font-black text-slate-800 block">المعرفة الفائقة</span>
                            <span className="text-[10px] text-slate-400">المقتنى: {((user?.gameData as any)?.ownedCapsules?.hyperLearning) || 0}</span>
                          </div>
                        </div>
                        { (Number((user?.gameData as any)?.ownedCapsules?.hyperLearning) || 0) > 0 && (
                          <Button 
                            label="تفعيل 🧪" 
                            className="px-2.5 py-1 text-[9px] font-bold border-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-115 text-white rounded-lg cursor-pointer transition-all"
                            onClick={() => consumeCapsule('hyperLearning')}
                          />
                        )}
                      </div>

                    </div>
                    
                    {/* Treasure Inventory (Static rendering of owned treasures) */}
                    {Object.keys(((user?.gameData as any)?.ownedTreasures || {})).length > 0 && (
                      <div className="mt-8 pt-4 border-t border-slate-100 mb-4">
                        <h4 className="font-extrabold text-amber-950 text-sm mb-4">💎 كنوزي الأسطورية المستخرجة</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {((user?.gameData as any)?.ownedTreasures?.wisdomScroll) > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-2xl border border-amber-200 text-center shadow-sm">
                              <span className="text-3xl block mb-1">📜</span>
                              <span className="text-xs font-black text-amber-900 block">وثيقة الحكمة</span>
                              <span className="text-[10px] text-amber-700 font-bold">العدد: {((user?.gameData as any)?.ownedTreasures?.wisdomScroll)}</span>
                            </div>
                          )}
                          {((user?.gameData as any)?.ownedTreasures?.inspirationSeed) > 0 && (
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-2xl border border-emerald-200 text-center shadow-sm">
                              <span className="text-3xl block mb-1">🌱</span>
                              <span className="text-xs font-black text-emerald-900 block">بذرة الإلهام</span>
                              <span className="text-[10px] text-emerald-700 font-bold">العدد: {((user?.gameData as any)?.ownedTreasures?.inspirationSeed)}</span>
                            </div>
                          )}
                          {((user?.gameData as any)?.ownedTreasures?.crownOfExcellence) > 0 && (
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200 text-center shadow-sm">
                              <span className="text-3xl block mb-1">👑</span>
                              <span className="text-xs font-black text-blue-900 block">تاج التفوق</span>
                              <span className="text-[10px] text-blue-700 font-bold">العدد: {((user?.gameData as any)?.ownedTreasures?.crownOfExcellence)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </TabPanel>
            </TabView>
          </div>
        )}
    </Dialog>
  );
}
