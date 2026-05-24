import { useState, useMemo, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { vibrate, HAPITCS } from "../lib/haptics";
import { safeRandomUUID } from "../lib/uuid";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { 
  Atom, BookOpen, Cpu, Brain, Globe, Compass, Music, Palette, Calculator, Code, Rocket, Landmark, Microscope, Telescope, Languages, Binary, Lightbulb, Sigma
} from "lucide-react";

export function useAuraJourney({ tripId, toast }: { tripId?: string | null, toast: any }) {
  const settings = useLiveQuery(() => db.userSettings.toArray());
  const stations = useLiveQuery(() => db.stations.orderBy("order").toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());

  const [gamificationSidebar, setGamificationSidebar] = useState(false);
  const [reflectionSidebar, setReflectionSidebar] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  // Locked station dialog detailed states
  const [lockedDialogVisible, setLockedDialogVisible] = useState(false);
  const [lockedDialogData, setLockedDialogData] = useState<{
    stationName: string;
    stationIcon: string;
    requiredKeys: number;
    currentKeys: number;
    prevStationName: string;
    prevStationEnergy: number;
  } | null>(null);

  // Tab indexes inside drawers
  const [reflectionActiveTab, setReflectionActiveTab] = useState(0);

  // Note state
  const [activeNoteStationId, setActiveNoteStationId] = useState<string>("");
  const [noteText, setNoteText] = useState("");

  // Time Capsule state
  const [capsuleText, setCapsuleText] = useState("");

  // Celebration state for unlocked/entered time capsule
  const [celebratedCapsule, setCelebratedCapsule] = useState<{
    stationId: string;
    message: string;
  } | null>(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubStationCancelConfirm, setShowSubStationCancelConfirm] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [showCapsulePopup, setShowCapsulePopup] = useState(false);
  const [showCompassPopup, setShowCompassPopup] = useState(false);
  const [showRestSpeedDial, setShowRestSpeedDial] = useState(false);
  const [weeklyChallengeModalVisible, setWeeklyChallengeModalVisible] = useState(false);
  const [weeklyClaimed, setWeeklyClaimed] = useState(() => {
    return localStorage.getItem("weekly_challenge_claimed_aura") === "true";
  });
  const [gamificationActiveTab, setGamificationActiveTab] = useState(0);

  const [weeklyChallengeName, setWeeklyChallengeName] = useState(() => {
    return localStorage.getItem("weekly_challenge_name_aura") || "تحدي الأسبوع المخصص 🏆";
  });
  const [weeklyChallengeRequired, setWeeklyChallengeRequired] = useState(() => {
    return localStorage.getItem("weekly_challenge_req_aura") || "أضف مهامك الشخصية لهذا الأسبوع وأنجزها بالكامل لتكسب مكافأة الـ 30 XP الثابتة!";
  });

  const [weeklyChallengeTasks, setWeeklyChallengeTasks] = useState<Array<{ id: string, title: string, isCompleted: boolean }>>(() => {
    try {
      const saved = localStorage.getItem("weekly_challenge_tasks_aura");
      return saved ? JSON.parse(saved) : [
        { id: "w-1", title: "مراجعة الخواطر والدروس المستفادة لهذا الأسبوع", isCompleted: false },
        { id: "w-2", title: "تطبيق ساعة تركيز كاملة خالية من المشتتات", isCompleted: false },
        { id: "w-3", title: "تخطيط أهداف الأسبوع القادم في سجل الرحلة", isCompleted: false }
      ];
    } catch (e) {
      return [];
    }
  });

  const [newWeeklyTaskTitle, setNewWeeklyTaskTitle] = useState("");

  // Dynamic per-station input titles inside Tab 5
  const [newStationTaskTitles, setNewStationTaskTitles] = useState<Record<string, string>>({});

  // SpeedDial visibility state for synchronized dual-row speed dial
  const [dialVisible, setDialVisible] = useState(false);
  
  // Sub-station creation state
  const [subStationModalVisible, setSubStationModalVisible] = useState(false);
  const [subStationTargetId, setSubStationTargetId] = useState<string | null>(null);
  const [subStationDuration, setSubStationDuration] = useState(30);
  const [subStationTasks, setSubStationTasks] = useState<{ id: string; title: string; subTasks: { id: string; title: string }[] }[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [activeSubTaskIdForInner, setActiveSubTaskIdForInner] = useState<string | null>(null);
  const [newSubInnerTaskTitle, setNewSubInnerTaskTitle] = useState("");

  // Station click pop animation state
  const [poppedStationId, setPoppedStationId] = useState<string | null>(null);

  // Tree expansion state for tasks
  const [expandedKeys, setExpandedKeys] = useState<any>({});

  // Task filtering states for station details
  const [mainTaskFilter, setMainTaskFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sideTaskFilter, setSideTaskFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [practicalFilter, setPracticalFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Tab panels header templates factory for icon-only look with more spacing and gradient backgrounds
  const createTabHeader = (icon: string, label: string) => (options: any) => (
    <div 
      onClick={options.onClick} 
      className={`${options.className} flex flex-col items-center justify-center py-3 px-6 group min-w-[70px] transition-all duration-300 active:scale-95 cursor-pointer relative`}
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${options.selected ? 'bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 text-white shadow-lg shadow-indigo-500/20 scale-110 rotate-[5deg]' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:scale-110'}`}>
        <i className={`pi ${icon} text-base`}></i>
      </div>
      <span className={`text-[10px] font-black mt-2 transition-all uppercase tracking-widest text-indigo-700 hidden sm:block ${options.selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'}`}>
        {label}
      </span>
      {options.selected && (
        <motion.div 
          layoutId="activeTabUnderline"
          className="absolute -bottom-0.5 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-800 rounded-full"
          initial={false}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </div>
  );

  // Note editing state
  const [editingNote, setEditingNote] = useState<{ index: number; text: string } | null>(null);

  const startEditingNote = (index: number, text: string) => {
    setEditingNote({ index, text });
  };

  const cancelEditingNote = () => {
    setEditingNote(null);
  };

  const updateJournalNote = async (stationId: string) => {
    if (!user || !editingNote || !editingNote.text.trim()) return;
    vibrate(HAPITCS.COMPLETE);
    
    const prevNotes = { ...(user.notes || {}) };
    if (Array.isArray(prevNotes[stationId])) {
      const updatedStationNotes = [...prevNotes[stationId]];
      updatedStationNotes[editingNote.index] = {
        ...updatedStationNotes[editingNote.index],
        text: editingNote.text,
        updatedAt: new Date().toISOString()
      };
      prevNotes[stationId] = updatedStationNotes;
    }

    await db.userSettings.update(user.id, {
      notes: prevNotes
    });
    
    setEditingNote(null);
    toast.current?.show({
      severity: "success",
      summary: "تم تحديث الخاطرة ✨",
      detail: "تعديلاتك باتت محفوظة الآن في سجل المحطة.",
      life: 2500,
    });
  };

  const addQuickTaskForStation = async (stationId: string, type: "main" | "side") => {
    const titleVal = newStationTaskTitles[stationId] || "";
    if (!titleVal.trim()) return;
    
    await db.tasks.add({
      id: safeRandomUUID(),
      stationId,
      title: titleVal.trim(),
      type,
      isCompleted: false,
    });
    
    setNewStationTaskTitles(prev => ({
      ...prev,
      [stationId]: ""
    }));
    
    toast.current?.show({
      severity: "success",
      summary: type === "main" ? "تمت إضافة مهمة أساسية 🔋" : "تمت إضافة مهمة جانبية 🧠",
      detail: `تم إدراج المهمة بنجاح في المحطة الجاري العمل عليها.`,
      life: 2500,
    });
  };

  const user = useMemo(() => {
    if (!settings) return null;
    if (tripId) {
      return settings.find((s) => s.id === tripId) || settings[0];
    }
    return settings[0];
  }, [settings, tripId]);

  const gData = user?.gameData || {
    fuel: 100,
    xp: 0,
    keys: 0,
    lastReflectionDate: "",
  };

  const today = new Date().toDateString();
  const hasReflectedToday = gData.lastReflectionDate === today;

  // Memoized background patterns list for academic subjects (20-30 scattered elements)
  const backgroundDecoIcons = useMemo(() => {
    if (!stations) return [];
    const iconsCount = 42; // Richer distribution across the full width
    const items = [];
    const iconTemplates = [
      Atom, BookOpen, Cpu, Brain, Globe, Compass, Music, Palette, Calculator, Code, Rocket, Landmark, Microscope, Telescope, Languages, Binary, Lightbulb, Sigma
    ];
    for (let i = 0; i < iconsCount; i++) {
      const template = iconTemplates[i % iconTemplates.length];
      // Disperse coordinates to side margins (0-18% and 82-100%) to stay away from the centered station path
      const xOffset = i % 2 === 0 
        ? `${2 + (i * 7) % 16}%` 
        : `${82 + (i * 7) % 16}%`;
      const yOffset = i * 120 + 40; 
      items.push({
        IconComponent: template,
        style: {
          position: "absolute" as const,
          top: `${yOffset}px`,
          left: xOffset,
          transform: `rotate(${(i * 35) % 360}deg) scale(${0.85 + (i % 4) * 0.15})`,
          opacity: 0.12, // extremely soft and premium backdrop watermark
          pointerEvents: "none" as const,
          zIndex: 0,
        },
        id: `deco-icon-${i}`
      });
    }
    return items;
  }, [stations]);

  // Compute energy per station
  const stationEnergy = useMemo(() => {
    if (!stations || !tasks || !user) return {};
    const map: Record<string, number> = {};
    for (const st of stations) {
      const stTasks = tasks.filter((t) => t.stationId === st.id);
      const mainAndSubTasks = stTasks.filter((t) => t.type === "main" || t.type === "sub");
      
      let baseEnergy = 0;
      if (mainAndSubTasks.length === 0) {
        baseEnergy = 100;
      } else {
        const completed = mainAndSubTasks.filter((t) => t.isCompleted).length;
        baseEnergy = Math.round((completed / mainAndSubTasks.length) * 100);
      }
      
      // Calculate Activity Bonus: Each completed activity in any task for this station adds 15%
      let activityBonus = 0;
      stTasks.forEach(task => {
        if (task.activities) {
          const countCompleted = (list: any[]) => {
            let total = 0;
            list.forEach(act => {
              if (act.isCompleted) total++;
              if (act.children) total += countCompleted(act.children);
            });
            return total;
          };
          activityBonus += countCompleted(task.activities) * 15;
        }
      });

      // If we have sub-stations, their completion contributes to the "total" station progress
      const rawSubStations = user.subStations?.[st.id];
      const subStations = Array.isArray(rawSubStations) ? rawSubStations : (rawSubStations ? [rawSubStations] : []);
      
      let totalValue = 0;
      if (subStations.length > 0) {
        let subProgress = 0;
        let totalSubActions = 0;
        let completedSubActions = 0;
        
        subStations.forEach(sub => {
          const sTasks = sub.tasks || [];
          totalSubActions += sTasks.length;
          completedSubActions += sTasks.filter(t => t.isCompleted).length;
        });

        if (subStations.some(s => s.isCompleted)) {
          subProgress = 100;
        } else if (totalSubActions > 0) {
          subProgress = (completedSubActions / totalSubActions) * 100;
        }

        totalValue = Math.round((Math.min(100, baseEnergy) * 0.8) + (Math.min(100, subProgress) * 0.2));
      } else {
        totalValue = Math.min(100, baseEnergy);
      }

      map[st.id] = totalValue + activityBonus;
    }
    return map;
  }, [stations, tasks, user]);

  const unlockedStations = useMemo(() => {
    if (!stations || !user) return [];
    const dbUnlocked = user.unlockedStationIds || [];
    const unlocked = [...dbUnlocked];
    
    // Always ensure at least the first station is unlocked
    if (stations.length > 0 && !unlocked.includes(stations[0].id)) {
      unlocked.unshift(stations[0].id);
    }
    
    return unlocked;
  }, [stations, user?.unlockedStationIds]);

  const unlockStation = async (stationId: string) => {
    if (!user) return;
    const requiredKeys = 10;
    
    const targetIdx = stations.findIndex(s => s.id === stationId);
    if (targetIdx > 0) {
      const prevSt = stations[targetIdx - 1];
      const prevEnergy = stationEnergy[prevSt.id] || 0;
      
      if (prevEnergy < 130) {
        toast.current?.show({
          severity: "error",
          summary: "المحطة السابقة غير مكتملة! ⚠️",
          detail: "يطلب العبور للمحطة التالية الوصول لنسبة 130% من الطاقة عبر المهام التطبيقية.",
          life: 4500,
        });
        return;
      }
    }

    if (gData.keys < requiredKeys) {
      toast.current?.show({
        severity: "error",
        summary: "نقص في المفاتيح! 🔑",
        detail: `تحتاج إلى ${requiredKeys} مفاتيح لفك قفل هذه المحطة.`,
        life: 3000,
      });
      return;
    }

    vibrate(HAPITCS.COMPLETE);
    const updatedUnlocked = [...(user.unlockedStationIds || [stations[0].id])];
    if (!updatedUnlocked.includes(stationId)) {
      updatedUnlocked.push(stationId);
    }

    await db.userSettings.update(user.id, {
      unlockedStationIds: updatedUnlocked,
      gameData: {
        ...gData,
        keys: gData.keys - requiredKeys
      }
    });

    setLockedDialogVisible(false);
    toast.current?.show({
      severity: "success",
      summary: "تم فك القفل بنجاح! 🔓",
      detail: "انطلقت المحطة الجديدة! تم خصم 10 مفاتيح تركيز.",
      life: 4000,
    });
    
    // Celebration for unlocking
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const activeStationId = useMemo(() => {
    if (unlockedStations.length === 0) return null;
    return unlockedStations[unlockedStations.length - 1];
  }, [unlockedStations]);

  const activeStation = useMemo(() => {
    return stations?.find(s => s.id === activeStationId);
  }, [stations, activeStationId]);

  const activeStationTasks = useMemo(() => {
    return tasks?.filter(t => t.stationId === activeStationId) || [];
  }, [tasks, activeStationId]);

  const totalTasksWithSub = activeStationTasks.length;
  const completedTasksCount = activeStationTasks.filter(t => t.isCompleted).length;
  const isAllTasksCompleted = totalTasksWithSub > 0 && completedTasksCount === totalTasksWithSub;

  const totalWeeklyTasks = weeklyChallengeTasks.length;
  const completedWeeklyTasks = weeklyChallengeTasks.filter(t => t.isCompleted).length;
  const isAllWeeklyTasksCompleted = totalWeeklyTasks > 0 && completedWeeklyTasks === totalWeeklyTasks;

  const claimWeeklyReward = async () => {
    if (weeklyClaimed) return;
    if (!isAllWeeklyTasksCompleted || !user) return;
    vibrate(HAPITCS.COMPLETE);
    const newXp = gData.xp + 30;
    await db.userSettings.update(user.id, {
      gameData: { ...gData, xp: newXp }
    });
    setWeeklyClaimed(true);
    localStorage.setItem("weekly_challenge_claimed_aura", "true");
    toast.current?.show({
      severity: "success",
      summary: "تهانينا! 🏆",
      detail: "تم استلام جائزة التحدي الأسبوعي (+30 XP) بنجاح!",
      life: 4000,
    });
    // Trigger celebratory confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const addWeeklyChallengeTask = () => {
    if (!newWeeklyTaskTitle.trim()) return;
    const newTask = {
      id: "w-" + Date.now(),
      title: newWeeklyTaskTitle.trim(),
      isCompleted: false
    };
    const updated = [...weeklyChallengeTasks, newTask];
    setWeeklyChallengeTasks(updated);
    localStorage.setItem("weekly_challenge_tasks_aura", JSON.stringify(updated));
    setNewWeeklyTaskTitle("");
    vibrate(HAPITCS.MAJOR_CLICK);
    toast.current?.show({
      severity: "success",
      summary: "تمت إضافة مهمة جديدة للتحدي! ✨",
      life: 2000
    });
  };

  const deleteWeeklyChallengeTask = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = weeklyChallengeTasks.filter(t => t.id !== id);
    setWeeklyChallengeTasks(updated);
    localStorage.setItem("weekly_challenge_tasks_aura", JSON.stringify(updated));
    vibrate(HAPITCS.MAJOR_CLICK);
  };

  const toggleWeeklyChallengeTask = (id: string) => {
    const updated = weeklyChallengeTasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t);
    setWeeklyChallengeTasks(updated);
    localStorage.setItem("weekly_challenge_tasks_aura", JSON.stringify(updated));
    vibrate(HAPITCS.MAJOR_CLICK);
  };

  // Manage initial active note selection
  useEffect(() => {
    if (activeStationId && !activeNoteStationId) {
      setActiveNoteStationId(activeStationId);
    }
  }, [activeStationId, activeNoteStationId]);

  // Loading existing notes - removed auto-loading single note text since we now support multiple
  useEffect(() => {
    if (user && activeNoteStationId) {
      setNoteText(""); // Clear text when switching stations
    }
  }, [user, activeNoteStationId]);

  // Check and trigger Time Capsule celebration on state updates!
  useEffect(() => {
    if (user && activeStationId) {
      const capsule = user.timeCapsules?.[activeStationId];
      if (capsule && !capsule.isRead) {
        setCelebratedCapsule({
          stationId: activeStationId,
          message: capsule.message,
        });
        vibrate(HAPITCS.COMPLETE);
      }
    }
  }, [user, activeStationId]);

  const closeCelebration = async () => {
    if (user && celebratedCapsule) {
      const updatedCapsules = { ...user.timeCapsules };
      if (updatedCapsules[celebratedCapsule.stationId]) {
        updatedCapsules[celebratedCapsule.stationId] = {
          ...updatedCapsules[celebratedCapsule.stationId],
          isRead: true,
        };
        await db.userSettings.update(user.id, {
          timeCapsules: updatedCapsules,
        });
      }
      setCelebratedCapsule(null);
    }
  };

  const toggleTask = async (
    taskId: string,
    isCompleted: boolean,
    type: string,
  ) => {
    if (gData.fuel <= 0 && !isCompleted) {
      vibrate(HAPITCS.GUIDANCE);
      toast.current?.show({
        severity: "warn",
        summary: "نفذ وقودك اليومي! ⛽",
        detail:
          "خزان دافعيتك صفر! يرجى أخذ راحة أو تسجيل حالة يومك من قسم البوصلة لإعادة التزود بالوقود.",
        life: 4000,
      });
      return; // Locked if no fuel
    }

    await db.tasks.update(taskId, { isCompleted: !isCompleted });

    // Check if confirming a main task and if all main tasks of that station are now completed, trigger high-energy confetti celebration!
    if (!isCompleted && type === "main") {
      try {
        const justCompletedTask = await db.tasks.get(taskId);
        if (justCompletedTask && justCompletedTask.stationId) {
          const allStationTasks = await db.tasks.where("stationId").equals(justCompletedTask.stationId).toArray();
          const mainTasks = allStationTasks.filter(t => t.type === "main");
          const allMainCompleted = mainTasks.every(t => t.id === taskId ? true : t.isCompleted);
          
          if (allMainCompleted) {
            const currentSubData = user.subStations?.[justCompletedTask.stationId];
            const hasSub = Array.isArray(currentSubData) ? currentSubData.length > 0 : !!currentSubData;
            
            if (!hasSub) {
              // Trigger sub-station modal!
              setSubStationTargetId(justCompletedTask.stationId);
              setSubStationModalVisible(true);
              setSubStationTasks([]);
              setSubStationDuration(30);
            }

            // Normal celebration logic
            confetti({
              particleCount: 140,
              spread: 80,
              origin: { y: 0.55 },
              colors: ['#1e40af', '#2563eb', '#3b82f6', '#f59e0b', '#fbbf24']
            });
            // Second burst: left side
            setTimeout(() => {
              confetti({
                particleCount: 80,
                angle: 60,
                spread: 60,
                origin: { x: 0.05, y: 0.65 }
              });
            }, 250);
            // Third burst: right side
            setTimeout(() => {
              confetti({
                particleCount: 80,
                angle: 120,
                spread: 60,
                origin: { x: 0.95, y: 0.65 }
              });
            }, 450);

            toast.current?.show({
              severity: "success",
              summary: "🎖️ اكتمال المحطة بنسبة 100%! 🧠",
              detail: "روعة! لقد أنجزت جميع المهام الأساسية في هذه المحطة. المحطة الآن جاهزة ومفتوحة للعبور للمحطات المستقبلية!",
              life: 5000,
            });
          }
        }
      } catch (err) {
        console.error("Error evaluating station completion", err);
      }
    }

    // Give rewards
    let newXp = gData.xp;
    let newKeys = gData.keys;

    if (!isCompleted) {
      // Completing a task
      vibrate(HAPITCS.COMPLETE);
      if (type === "main") {
        newXp += 30;
        toast.current?.show({
          severity: "success",
          summary: "إنجاز رائع! ⚡",
          detail: "أكملت مهمة أساسية مكثفة بنجاح! نلت +30 XP لمسيرتك.",
          life: 2500,
        });
      }
      if (type === "sub") {
        newXp += 15;
        toast.current?.show({
          severity: "success",
          summary: "خطوة بخطوة! 🧩",
          detail: "أكملت مهمة فرعية! نلت +15 XP لمسيرتك.",
          life: 2000,
        });
      }
      if (type === "side") {
        newXp += 25;
        newKeys += 1; // Direct bonus key reward for extra focus side task completion!
        toast.current?.show({
          severity: "success",
          summary: "مهارة استثنائية! ⭐",
          detail:
            "أنجزت مهارة بونص جانبية ومكثفة! ربحت +25 XP ومفتاح تركيز إضافي.",
          life: 3000,
        });
      }
    } else {
      // Un-completing
      vibrate(HAPITCS.MAJOR_CLICK);
      if (type === "main") {
        newXp = Math.max(0, newXp - 30);
      }
      if (type === "sub") {
        newXp = Math.max(0, newXp - 15);
      }
      if (type === "side") {
        newXp = Math.max(0, newXp - 25);
        newKeys = Math.max(0, newKeys - 1);
      }
      toast.current?.show({
        severity: "info",
        summary: "تم إلغاء المهمة",
        detail: "تم التراجع عن إكمال هذه المهمة وخُسمت نقاط الخبرة.",
        life: 2000,
      });
    }

    if (user) {
      await db.userSettings.update(user.id, {
        gameData: { ...gData, xp: newXp, keys: newKeys },
      });
    }
  };

  const rewardActivity = async (isCompleted: boolean) => {
    if (!user) return;
    vibrate(isCompleted ? HAPITCS.COMPLETE : HAPITCS.MAJOR_CLICK);
    
    const xpChange = isCompleted ? 20 : -20;
    const newXp = Math.max(0, gData.xp + xpChange);
    
    await db.userSettings.update(user.id, {
      gameData: { ...gData, xp: newXp }
    });

    if (isCompleted) {
      toast.current?.show({
        severity: "success",
        summary: "تطبيق ناجح! 🛠️",
        detail: "أنجزت مهمة تطبيقية بنجاح! نلت +20 XP وزادت طاقة المحطة بـ 15%.",
        life: 3000,
      });
    }
  };

  const undertakeReflection = async () => {
    if (hasReflectedToday || !user) return;
    vibrate(HAPITCS.COMPLETE);
    const newFuel = Math.max(0, gData.fuel - 7); // Works burns fuel
    await db.userSettings.update(user.id, {
      gameData: { ...gData, fuel: newFuel, lastReflectionDate: today },
    });
    toast.current?.show({
      severity: "info",
      summary: "تم تسجيل يوم عمل ⛽",
      detail:
        "عاش يا بطل! استقرينا على الانجاز وحرقنا 7% من الوقود اليومي لتغذية طموحاتنا.",
      life: 3000,
    });
  };

  const takeRestDay = async () => {
    if (hasReflectedToday || !user) return;
    vibrate(HAPITCS.GUIDANCE);
    const newFuel = Math.min(100, gData.fuel + 7); // Rests recover fuel
    await db.userSettings.update(user.id, {
      gameData: { ...gData, fuel: newFuel, lastReflectionDate: today },
    });
    toast.current?.show({
      severity: "success",
      summary: "مبارك، يوم راحة مبارك! ☀️",
      detail:
        "شحنّا خزانك بـ 7% من الوقود الإضافي لتتجنب الإرهاق النفسي والاحتراق وتعود أكثر قوة.",
      life: 3000,
    });
  };

  const saveJournalNote = async () => {
    if (!user || !activeNoteStationId || !noteText.trim()) return;
    vibrate(HAPITCS.COMPLETE);
    const prevNotes = user.notes || {};
    const stationNotes = Array.isArray(prevNotes[activeNoteStationId]) 
      ? prevNotes[activeNoteStationId] 
      : [];
    
    // Support migration if old note was a single object or string
    const migrationNotes = (!Array.isArray(prevNotes[activeNoteStationId]) && prevNotes[activeNoteStationId])
      ? [typeof prevNotes[activeNoteStationId] === 'string' 
          ? { text: prevNotes[activeNoteStationId], date: new Date().toISOString() } 
          : prevNotes[activeNoteStationId] as any]
      : [];

    await db.userSettings.update(user.id, {
      notes: { 
        ...prevNotes, 
        [activeNoteStationId]: [
          ...migrationNotes, 
          ...stationNotes, 
          { 
            text: noteText, 
            date: new Date().toISOString() 
          }
        ] 
      },
    });
    setNoteText("");
    toast.current?.show({
      severity: "success",
      summary: "تمت إضافة الخاطرة ✍️",
      detail:
        "تم حفظ ملاحظتك الجديدة في سجل هذه المحطة بنجاح.",
      life: 3000,
    });
  };

  const deleteJournalNote = async (stationId: string, noteIndex: number) => {
    if (!user) return;
    vibrate(HAPITCS.GUIDANCE);
    const prevNotes = { ...(user.notes || {}) };
    if (Array.isArray(prevNotes[stationId])) {
      prevNotes[stationId].splice(noteIndex, 1);
      if (prevNotes[stationId].length === 0) {
        delete prevNotes[stationId];
      }
    } else {
      delete prevNotes[stationId];
    }
    await db.userSettings.update(user.id, {
      notes: prevNotes,
    });
    toast.current?.show({
      severity: "warn",
      summary: "تم حذف الملاحظة 🗑️",
      detail: "تم إزالة الملاحظة من السجل.",
      life: 3000,
    });
  };

  const saveTimeCapsule = async (targetStationId: string) => {
    if (!user || !capsuleText.trim()) return;
    
    vibrate(HAPITCS.COMPLETE);
    const capsules = user.timeCapsules || {};
    capsules[targetStationId] = {
      message: capsuleText,
      writtenAt: new Date().toLocaleDateString("ar-EG"),
      isRead: false,
    };
    await db.userSettings.update(user.id, { timeCapsules: capsules });
    setCapsuleText("");
    toast.current?.show({
      severity: "success",
      summary: "تم إرسال الكبسولة ✉️",
      detail:
        "لقد قمنا بغلق كبسولتك الزمنية وشحنها في مسيرتك العلمية، وستفتح تلقائياً فور فك قفل المحطة القادمة.",
      life: 4000,
    });
  };

  const buyKeys = async () => {
    if (gData.xp >= 70) {
      vibrate(HAPITCS.MAJOR_CLICK);
      await db.userSettings.update(user!.id, {
        gameData: { ...gData, xp: gData.xp - 70, keys: gData.keys + 10 },
      });
      toast.current?.show({
        severity: "success",
        summary: "مقايضة ناجحة! 🧠",
        detail:
          "استثمرت 70 XP بنجاح وحصلت on 10 مفاتيح تركيز لفك قفل الدروس والمحطات الجديدة.",
        life: 3000,
      });
    }
  };

  const createSubStation = async () => {
    if (!user || !subStationTargetId) return;

    // Use tasks defined by the user in the modal
    const practicalTasks = subStationTasks.map(t => ({
      id: t.id,
      title: t.title,
      isCompleted: false,
      subTasks: (t.subTasks || []).map(st => ({ id: st.id, title: st.title, isCompleted: false }))
    }));

    if (practicalTasks.length === 0) {
      toast.current?.show({
        severity: "warn",
        summary: "قم بإضافة مهمة تطبيقية! ⚠️",
        detail: "يرجى إضافة مهمة تطبيقية واحدة على الأقل قبل التفعيل.",
        life: 3000,
      });
      return;
    }

    vibrate(HAPITCS.COMPLETE);
    const targetId = subStationTargetId;
    if (!targetId) return;

    const rawPrevSubs = user.subStations?.[targetId];
    const prevSubs = Array.isArray(rawPrevSubs) ? rawPrevSubs : (rawPrevSubs ? [rawPrevSubs] : []);
    
    const updatedSubs = [
      ...prevSubs,
      {
        stationId: targetId,
        tasks: practicalTasks,
        durationMinutes: subStationDuration,
        isCompleted: false,
        unlockedAt: new Date().toISOString(),
      }
    ];

    await db.userSettings.update(user.id, {
      subStations: { ...(user.subStations || {}), [targetId]: updatedSubs }
    });

    setSubStationModalVisible(false);
    setSubStationTargetId(null);
    setSubStationTasks([]);
    setSubStationDuration(30);

    toast.current?.show({
      severity: "success",
      summary: "تم تفعيل المحطة التطبيقية! 🛠️",
      detail: "الآن حان وقت التطبيق العملي للوصول للمحطة التالية.",
      life: 4000,
    });

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const deletePracticalPlan = async (stationId: string, index: number) => {
    if (!user) return;
    vibrate(HAPITCS.MAJOR_CLICK);

    const rawSubs = user.subStations?.[stationId];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    
    const updatedSubs = stationSubs.filter((_, idx) => idx !== index);
    
    await db.userSettings.update(user.id, {
      subStations: { ...user.subStations, [stationId]: updatedSubs }
    });
    
    toast.current?.show({
      severity: "info",
      summary: "تم حذف التطبيق العملي 🗑️",
      detail: "تم إزالة خطة التطبيق العملي بنجاح.",
      life: 3000,
    });
  };

  const addSubStationTask = () => {
    if (!newSubTaskTitle.trim()) return;
    const newTask = {
      id: safeRandomUUID(),
      title: newSubTaskTitle.trim(),
      subTasks: []
    };
    setSubStationTasks([...subStationTasks, newTask]);
    setNewSubTaskTitle("");
  };

  const addInnerSubTask = (mainTaskId: string) => {
    if (!newSubInnerTaskTitle.trim()) return;
    const updatedTasks = subStationTasks.map(t => {
      if (t.id === mainTaskId) {
        return {
          ...t,
          subTasks: [...t.subTasks, { id: safeRandomUUID(), title: newSubInnerTaskTitle.trim() }]
        };
      }
      return t;
    });
    setSubStationTasks(updatedTasks);
    setNewSubInnerTaskTitle("");
    setActiveSubTaskIdForInner(null);
  };

  const removeSubStationTask = (id: string) => {
    setSubStationTasks(subStationTasks.filter(t => t.id !== id));
  };

  const removeInnerSubTask = (mainTaskId: string, innerId: string) => {
    setSubStationTasks(subStationTasks.map(t => {
      if (t.id === mainTaskId) {
        return { ...t, subTasks: t.subTasks.filter(st => st.id !== innerId) };
      }
      return t;
    }));
  };

  const toggleSubStationTask = async (stationId: string, subStationIndex: number, taskId: string) => {
    if (!user) return;
    vibrate(HAPITCS.COMPLETE);
    const rawSubs = user.subStations?.[stationId];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    
    if (!stationSubs || !stationSubs[subStationIndex]) return;

    const subStation = stationSubs[subStationIndex];
    const sTasks = subStation.tasks || [];
    const updatedTasks = sTasks.map(t => {
      if (t.id === taskId) {
        return { ...t, isCompleted: !t.isCompleted };
      }
      return t;
    });

    const isNowCompleted = updatedTasks.every(t => t.isCompleted);
    const updatedStationSubs = [...stationSubs];
    updatedStationSubs[subStationIndex] = {
      ...subStation,
      tasks: updatedTasks,
      isCompleted: isNowCompleted
    };
    
    await db.userSettings.update(user.id, {
      subStations: {
        ...user.subStations,
        [stationId]: updatedStationSubs
      }
    });

    if (isNowCompleted && !subStation.isCompleted) {
       confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
       });
       toast.current?.show({
          severity: "success",
          summary: "إنجاز عظيم! 🏆",
          detail: "لقد أتممت أحد الأنشطة التطبيقية لهذه المحطة بنجاح.",
          life: 5000,
       });
    }
  };

  const toggleSubStationInnerTask = async (stationId: string, subStationIndex: number, mainTaskId: string, innerTaskId: string) => {
    if (!user) return;
    vibrate(HAPITCS.COMPLETE);
    const rawSubs = user.subStations?.[stationId];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    
    if (!stationSubs || !stationSubs[subStationIndex]) return;

    const subStation = stationSubs[subStationIndex];
    const sTasks = subStation.tasks || [];
    const updatedTasks = sTasks.map(t => {
      if (t.id === mainTaskId) {
          const updatedSubs = t.subTasks?.map(st => {
              if (st.id === innerTaskId) return { ...st, isCompleted: !st.isCompleted };
              return st;
          });
          const mainIsCompleted = updatedSubs?.every(st => st.isCompleted) || false;
          return { ...t, subTasks: updatedSubs, isCompleted: mainIsCompleted };
      }
      return t;
    });

    const isNowCompleted = updatedTasks.every(t => t.isCompleted);
    const updatedStationSubs = [...stationSubs];
    updatedStationSubs[subStationIndex] = {
      ...subStation,
      tasks: updatedTasks,
      isCompleted: isNowCompleted
    };

    await db.userSettings.update(user.id, {
        subStations: {
            ...user.subStations,
            [stationId]: updatedStationSubs
        }
    });
  };

  // SVG road path calculations
  const pathD = useMemo(() => {
    if (!stations) return "";
    const points = stations.map((_, i) => {
      // 250 and 750 are stable scaled absolute points inside the 1000px viewBox grid
      const x = i % 2 === 0 ? 250 : 750;
      const y = i * 220 + 130;
      return { x, y };
    });

    let lines = "";
    if (points.length > 0) {
      lines += `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const pPrev = points[i - 1];
        const pCurr = points[i];
        const cpY1 = pPrev.y + 110;
        const cpY2 = pCurr.y - 110;
        lines += ` C ${pPrev.x} ${cpY1}, ${pCurr.x} ${cpY2}, ${pCurr.x} ${pCurr.y}`;
      }
    }
    return lines;
  }, [stations]);

  // Find the target next station for writing a time capsule
  // Find the target next station for writing a time capsule
  const capsuleTargetStation = useMemo(() => {
    if (!stations || !activeStationId) return null;
    const currentIdx = stations.findIndex((s) => s.id === activeStationId);
    if (currentIdx !== -1 && currentIdx < stations.length - 1) {
      return stations[currentIdx + 1];
    }
    return null;
  }, [stations, activeStationId]);

  const mainTasksNodes = useMemo(() => {
    if (!tasks || !selectedStation) return [];
    const mainTasks = tasks.filter(t => t.stationId === selectedStation && t.type === 'main');
    return mainTasks.map(t => {
      const subs = tasks.filter(sub => sub.parentId === t.id && sub.type === 'sub');
      return {
        key: t.id,
        label: t.title,
        data: t,
        children: subs.map(sub => ({
          key: sub.id,
          label: sub.title,
          data: sub,
          leaf: true
        }))
      };
    });
  }, [tasks, selectedStation]);

  const filteredMainTasksNodes = useMemo(() => {
    if (mainTaskFilter === 'all') return mainTasksNodes;
    return mainTasksNodes.filter(node => {
      if (mainTaskFilter === 'completed') return node.data.isCompleted;
      return !node.data.isCompleted;
    });
  }, [mainTasksNodes, mainTaskFilter]);

  const filteredSideTasks = useMemo(() => {
    if (!tasks || !selectedStation) return [];
    const stTasks = tasks.filter(t => t.stationId === selectedStation && t.type === "side");
    if (sideTaskFilter === 'all') return stTasks;
    if (sideTaskFilter === 'completed') return stTasks.filter(t => t.isCompleted);
    return stTasks.filter(t => !t.isCompleted);
  }, [tasks, selectedStation, sideTaskFilter]);

  const filteredPracticalTasks = useMemo(() => {
    if (!user || !selectedStation) return [];
    const rawSubs = user.subStations?.[selectedStation];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    if (practicalFilter === 'all') return stationSubs;
    if (practicalFilter === 'completed') return stationSubs.filter(s => s.isCompleted);
    return stationSubs.filter(s => !s.isCompleted);
  }, [user?.subStations, selectedStation, practicalFilter]);

  return {
    settings,
    stations,
    tasks,
    gamificationSidebar,
    setGamificationSidebar,
    reflectionSidebar,
    setReflectionSidebar,
    selectedStation,
    setSelectedStation,
    lockedDialogVisible,
    setLockedDialogVisible,
    lockedDialogData,
    setLockedDialogData,
    reflectionActiveTab,
    setReflectionActiveTab,
    activeNoteStationId,
    setActiveNoteStationId,
    noteText,
    setNoteText,
    capsuleText,
    setCapsuleText,
    celebratedCapsule,
    setCelebratedCapsule,
    showExitConfirm,
    setShowExitConfirm,
    showSubStationCancelConfirm,
    setShowSubStationCancelConfirm,
    showNotesPopup,
    setShowNotesPopup,
    showCapsulePopup,
    setShowCapsulePopup,
    showCompassPopup,
    setShowCompassPopup,
    showRestSpeedDial,
    setShowRestSpeedDial,
    weeklyChallengeModalVisible,
    setWeeklyChallengeModalVisible,
    weeklyClaimed,
    setWeeklyClaimed,
    gamificationActiveTab,
    setGamificationActiveTab,
    weeklyChallengeName,
    setWeeklyChallengeName,
    weeklyChallengeRequired,
    setWeeklyChallengeRequired,
    weeklyChallengeTasks,
    setWeeklyChallengeTasks,
    newWeeklyTaskTitle,
    setNewWeeklyTaskTitle,
    newStationTaskTitles,
    setNewStationTaskTitles,
    dialVisible,
    setDialVisible,
    subStationModalVisible,
    setSubStationModalVisible,
    subStationTargetId,
    setSubStationTargetId,
    subStationDuration,
    setSubStationDuration,
    subStationTasks,
    setSubStationTasks,
    newSubTaskTitle,
    setNewSubTaskTitle,
    activeSubTaskIdForInner,
    setActiveSubTaskIdForInner,
    newSubInnerTaskTitle,
    setNewSubInnerTaskTitle,
    poppedStationId,
    setPoppedStationId,
    expandedKeys,
    setExpandedKeys,
    mainTaskFilter,
    setMainTaskFilter,
    sideTaskFilter,
    setSideTaskFilter,
    practicalFilter,
    setPracticalFilter,
    createTabHeader,
    editingNote,
    setEditingNote,
    startEditingNote,
    cancelEditingNote,
    updateJournalNote,
    addQuickTaskForStation,
    user,
    backgroundDecoIcons,
    stationEnergy,
    unlockedStations,
    unlockStation,
    toggleTask,
    activeStationId,
    activeStation,
    activeStationTasks,
    claimWeeklyReward,
    addWeeklyChallengeTask,
    deleteWeeklyChallengeTask,
    toggleWeeklyChallengeTask,
    closeCelebration,
    undertakeReflection,
    takeRestDay,
    saveJournalNote,
    deleteJournalNote,
    saveTimeCapsule,
    buyKeys,
    createSubStation,
    deletePracticalPlan,
    addSubStationTask,
    addInnerSubTask,
    removeSubStationTask,
    removeInnerSubTask,
    toggleSubStationTask,
    toggleSubStationInnerTask,
    rewardActivity,
    pathD,
    capsuleTargetStation,
    mainTasksNodes,
    filteredMainTasksNodes,
    filteredSideTasks,
    filteredPracticalTasks,
    gData,
    today,
    hasReflectedToday,
    totalTasksWithSub,
    completedTasksCount,
    isAllTasksCompleted,
    totalWeeklyTasks,
    completedWeeklyTasks,
    isAllWeeklyTasksCompleted
  };
}
