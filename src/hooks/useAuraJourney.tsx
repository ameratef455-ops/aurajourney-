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
  const [stationTabsIndex, setStationTabsIndex] = useState(0);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);

  // Note state
  const [activeNoteStationId, setActiveNoteStationId] = useState<string>("");
  const [noteText, setNoteText] = useState("");
  const [notePriority, setNotePriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Time Capsule state
  const [capsuleText, setCapsuleText] = useState("");

  // Celebration state for unlocked/entered time capsule
  const [celebratedCapsule, setCelebratedCapsule] = useState<{
    stationId: string;
    message: string;
    messages?: { message: string; writtenAt: string }[];
  } | null>(null);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubStationCancelConfirm, setShowSubStationCancelConfirm] = useState(false);
  const [showNotesPopup, setShowNotesPopup] = useState(false);
  const [showRoutinePopup, setShowRoutinePopup] = useState(false);
  const [showPracticalPopup, setShowPracticalPopup] = useState(false);
  const [showCapsulePopup, setShowCapsulePopup] = useState(false);
  const [showCompassPopup, setShowCompassPopup] = useState(false);
  const [showRestSpeedDial, setShowRestSpeedDial] = useState(false);
  const [gamificationActiveTab, setGamificationActiveTab] = useState(0);

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
      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${options.selected ? 'bg-gradient-to-br from-blue-600 via-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 scale-110 rotate-[5deg]' : 'bg-white/10 text-white group-hover:bg-white/20 group-hover:text-white group-hover:scale-110'}`}>
        <i className={`pi ${icon} text-base`}></i>
      </div>
      <span className={`text-[10px] font-black mt-2 transition-all uppercase tracking-widest text-white hidden sm:block ${options.selected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'}`}>
        {label}
      </span>
      <div 
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-opacity duration-300 ${options.selected ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );

  const [editingNote, setEditingNote] = useState<{ 
    index: number; 
    text: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  } | null>(null);

  const startEditingNote = (index: number, note: any) => {
    setEditingNote({ 
      index, 
      text: note.text,
      priority: note.priority || 'medium',
      tags: note.tags || []
    });
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
        priority: editingNote.priority,
        tags: editingNote.tags,
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
      detail: "تعديلاتك باتت محفوظة الآن في سجل الخطة.",
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
      detail: `تم إدراج المهمة بنجاح في الخطة الجاري العمل عليها.`,
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
    streak: 0,
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
      const mainTasks = stTasks.filter((t) => t.type === "main" && !t.parentId && !t.title.includes("المراجعة") && !t.title.includes("خطة المراجعة"));
      const subTasksListForSt = tasks.filter((t) => t.type === "sub" && mainTasks.some(m => m.id === t.parentId));
      
      const totalCount = mainTasks.length + subTasksListForSt.length;
      let baseEnergy = 0;
      if (totalCount === 0) {
        baseEnergy = 100;
      } else {
        const portion = 100 / totalCount;
        const completedMainCount = mainTasks.filter(t => t.isCompleted).length;
        const completedSubCount = subTasksListForSt.filter(t => t.isCompleted).length;
        baseEnergy = (completedMainCount + completedSubCount) * portion;
      }
      
      // Calculate Activity Bonus: Each completed activity (practical task) adds 15%
      let practicalBonus = 0;
      
      // 1. Task interior activities
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
          practicalBonus += countCompleted(task.activities) * 15;
        }
      });

      // 2. Sub-stations (Alternative practical plans)
      const rawSubStations = user.subStations?.[st.id];
      const subStationsList = Array.isArray(rawSubStations) ? rawSubStations : (rawSubStations ? [rawSubStations] : []);
      subStationsList.forEach(sub => {
        const sTasks = sub.tasks || [];
        practicalBonus += sTasks.filter(t => t.isCompleted).length * 15;
      });

      map[st.id] = Math.min(100, Math.round(baseEnergy)) + practicalBonus;
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
    if (!user || !tasks) return;
    const requiredKeys = 10;
    
    const targetIdx = stations.findIndex(s => s.id === stationId);
    if (targetIdx > 0) {
      const prevSt = stations[targetIdx - 1];
      const prevStTasks = tasks.filter(t => t.stationId === prevSt.id);
      
      // All main tasks completed
      const prevMainTasks = prevStTasks.filter(t => t.type === 'main');
      const allMainCompleted = prevMainTasks.length > 0 ? prevMainTasks.every(t => t.isCompleted) : true;
      
      // At least 2 practical/sub tasks completed
      const prevSubTasks = prevStTasks.filter(t => t.type === 'sub');
      const completedSubCount = prevSubTasks.filter(t => t.isCompleted).length;
      const subCompletedEnough = completedSubCount >= 2;

      const missingMain = prevMainTasks.filter(t => !t.isCompleted).length;
      
      if (!allMainCompleted || !subCompletedEnough) {
        toast.current?.show({
          severity: "error",
          summary: "الخطة السابقة غير مكتملة الشروط! ⚠️",
          detail: `لفتح الخطة التالية، يجب إنهاء جميع المهام الأساسية (المتبقي: ${missingMain}) ومهمتين تطبيقيتين على الأقل (المكتمل من التطبيقية: ${completedSubCount}/2).`,
          life: 5500,
        });
        return;
      }
    }

    if (gData.keys < requiredKeys) {
      toast.current?.show({
        severity: "error",
        summary: "نقص في المفاتيح! 🔑",
        detail: `تحتاج إلى ${requiredKeys} مفاتيح لفك قفل هذه الخطة.`,
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
      detail: "انطلقت الخطة الجديدة! تم خصم 10 مفاتيح تركيز.",
      life: 4000,
    });
    
    // Celebration for unlocking
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 30000000
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
          message: capsule.message || "",
          messages: capsule.messages || []
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
    if (user?.isFrozen) {
      vibrate(HAPITCS.ERROR);
      toast.current?.show({
        severity: "warn",
        summary: "الرحلة مجمدة ❄️",
        detail: "الرحلة في وضع التجميد حالياً لحماية إحصائياتك والستريك. يرجى إلغاء التجميد أولاً.",
        life: 3000
      });
      return;
    }
    // If we're trying to mark as completed via toggleTask, we block it 
    // unless it's already completed and we're un-completing it.
    if (!isCompleted) {
       // We DON'T complete tasks via toggleTask anymore as per user request.
       // The sidebar handles open, but completion only happens via "Seal Task".
       return; 
    }

    // Un-completing
    const task = await db.tasks.get(taskId);
    if (!task) return;

    // Reset activities recursively if they exist
    const resetActivities = (acts: any[]): any[] => {
      return acts.map(a => ({
          ...a,
          isCompleted: false,
          steps: a.steps?.map((s: any) => ({ ...s, isCompleted: false })),
          children: a.children ? resetActivities(a.children) : []
      }));
    };

    const updateData: any = { isCompleted: false, dueDate: null };
    if (task.activities) {
      updateData.activities = resetActivities(task.activities);
    }

    await (db.tasks as any).update(taskId, updateData);
    
    // Delete reflection data when reverting task
    await db.reflections.where("taskId").equals(taskId).delete();

    vibrate(HAPITCS.MAJOR_CLICK);
    
    let newXp = gData.xp;
    let newKeys = gData.keys;

    if (type === "side") {
      newKeys = Math.max(0, newKeys - 1);
    }
    
    toast.current?.show({
      severity: "info",
      summary: "تم إلغاء المهمة",
      detail: "تم التراجع عن إكمال هذه المهمة وتمت إعادة تصفير الأنشطة.",
      life: 2000,
    });

    if (user) {
      await db.userSettings.update(user.id, {
        gameData: { ...gData, xp: newXp, keys: newKeys },
      });
    }
  };

  const processWorkdayAndStreak = (currentGameData: any) => {
    if (user?.isFrozen) {
      return currentGameData;
    }
    const today = new Date();
    const todayStr = today.toDateString();

    let newFuel = 100;
    let newStreak = currentGameData.streak || 0;

    if (currentGameData.lastReflectionDate !== todayStr) {
      newFuel = 100;

      if (!currentGameData.lastReflectionDate) {
        newStreak = 1;
      } else {
        const lastRefDate = new Date(currentGameData.lastReflectionDate);
        let missedLearningDay = false;
        
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);

        while (checkDate > lastRefDate) {
          const dayOfWeek = checkDate.getDay();
          const isLearningDay = !user?.learningDays || user.learningDays.length === 0 || user.learningDays.includes(dayOfWeek);
          if (isLearningDay) {
            missedLearningDay = true;
            break;
          }
          checkDate.setDate(checkDate.getDate() - 1);
        }

        const isCapsuleFrozen = currentGameData?.streakFreezedUntil && currentGameData.streakFreezedUntil > Date.now();
        if (missedLearningDay) {
          if (isCapsuleFrozen) {
            newStreak = currentGameData.streak || 1;
          } else {
            newStreak = 1;
          }
        } else {
          // Only increment streak if today is a scheduled learning day
          const todayDay = today.getDay();
          const isTodayLearningDay = !user?.learningDays || user.learningDays.length === 0 || user.learningDays.includes(todayDay);
          
          if (isTodayLearningDay) {
            newStreak += 1;
          }
        }
      }
    }

    return {
      ...currentGameData,
      fuel: newFuel,
      lastReflectionDate: todayStr,
      streak: newStreak
    };
  };

  const completeTask = async (taskToComplete: any, onComplete?: (taskId: string) => void) => {
    if (!user) return { success: false, reason: 'unauthorized' };
    
    // Fetch latest task data from DB
    const dbTask = await db.tasks.get(taskToComplete.id);
    if (!dbTask) return { success: false, reason: 'not_found' };
    if ((dbTask as any).xpAwarded) return { success: false, reason: 'already_completed' };
    
    const task = { ...taskToComplete, ...dbTask };

    if (user.isFrozen) {
      toast.current?.show({
        severity: "warn",
        summary: "الرحلة مجمدة ❄️",
        detail: "الرحلة في وضع التجميد حالياً لحماية إحصائياتك والستريك. يرجى إلغاء التجميد أولاً.",
        life: 3000
      });
      return { success: false, reason: 'frozen' };
    }

    // Task level check for subtasks
    if (task.type === "main") {
      const allStationTasks = await db.tasks.where("stationId").equals(task.stationId).toArray();
      const subTasks = allStationTasks.filter(t => t.parentId === task.id && t.type === "sub");
      const hasUncompleted = subTasks.some(t => !t.isCompleted);

      if (hasUncompleted) {
        vibrate(HAPITCS.ERROR);
        toast.current?.show({
          severity: "warn",
          summary: "أنجز الفرعيات أولاً ⚠️",
          detail: "يرجى إكمال المهام الفرعية للرئيسية أولاً.",
          life: 4000
        });
        return { success: false, reason: 'subtasks' };
      }
    }

    // ACTIVITY VERIFICATION - Improved to allow parents to be headers
    if (task.activities && task.activities.length > 0) {
      const checkActivities = (acts: any[]): boolean => {
          return acts.every(a => {
            const hasChildren = a.children && a.children.length > 0;
            const isSelfDone = a.isCompleted === true || a.completed === true;
            const childrenDone = hasChildren ? checkActivities(a.children) : true;
            
            // A node is done if (it's explicitly checked) OR (it has children and all children are checked)
            return isSelfDone || (hasChildren && childrenDone);
          });
      };

      if (!checkActivities(task.activities)) {
          vibrate(HAPITCS.ERROR);
          // Return failure without showing a toast, because Maps.tsx will handle opening the modal
          return { success: false, reason: 'activities' };
      }
    }

    vibrate(HAPITCS.SUCCESS);
    // Mark as completed in DB - Using any to avoid circularity type error in Dexie KeyPaths
    await (db.tasks as any).update(task.id, { isCompleted: true, xpAwarded: true });

    if (onComplete) onComplete(task.id);

    // Rewards and Notifications
    if (task.type === "main") {
       confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#1e40af', '#2563eb', '#3b82f6', '#f59e0b', '#fbbf24'],
          zIndex: 30000000
       });
    }

    let shouldShowReviewNotification = false;

    // Atomically update user settings with new XP and keys
    await db.userSettings.where('id').equals(user.id).modify((u) => {
      // Create a clean local scope for calculation
      let xpToAdd = 0;
      let keysToAdd = 0;

      if (task.type === "practical") {
         keysToAdd = 1;
      }
      else if (task.type === "project") {
         keysToAdd = 1;
      }
      else if (task.type === "side") {
         keysToAdd = 1;
      }

      const currentXp = u.gameData.xp || 0;
      const currentKeys = (u.gameData.keys || 0) + keysToAdd;

      const baseGameData = { 
        ...u.gameData, 
        xp: currentXp, 
        keys: currentKeys 
      };
      
      const updatedGameData = processWorkdayAndStreak(baseGameData);
      
      if (task.type === 'sub' || task.type === 'side' || task.type === 'practical' || task.type === 'project') {
         updatedGameData.tasksCompletedSinceReview = (updatedGameData.tasksCompletedSinceReview || 0) + 1;
         if (updatedGameData.tasksCompletedSinceReview === 2) {
            shouldShowReviewNotification = true;
         }
      }

      u.gameData = updatedGameData;
    });

    // Notify user to rewards
    toast.current?.show({
      severity: "success",
      summary: task.type === 'main' ? "إنجاز رائع! ⚡" : task.type === 'practical' ? "تطبيق عملي ناجح! 🧪" : task.type === 'sub' ? "خطوة بخطوة! 🧩" : task.type === 'project' ? "مشروع الخطة ناجح! 📁" : "مهارة استثنائية! ⭐",
      detail: task.type === 'main' ? `أكملت مهمة أساسية بنجاح!` : task.type === 'practical' ? `أكملت تطبيقًا عمليًا بنجاح ومفتاح إضافي.` : task.type === 'sub' ? `أكملت مهمة فرعية!` : task.type === 'project' ? `أكملت مشروع الخطة بنجاح ومفتاح إضافي.` : `أنجزت مهارة بونص ومفتاح إضافي.`,
      life: 3000,
    });

    if (shouldShowReviewNotification) {
       await db.notifications.add({
          id: safeRandomUUID(),
          title: 'مراجعة المهام 🌟',
          message: 'لقد أنهيت مهمتين مؤخراً، قم بمراجعة إحداهما للحصول على أقصى الدفعة المعنوية وتحديث سجل التقييم.',
          isRead: false,
          type: 'info',
          createdAt: new Date().toISOString()
       });
    }

    return { success: true };
  };

  const rewardActivity = async (isCompleted: boolean, activity?: any) => {
    if (!user) return;
    vibrate(isCompleted ? HAPITCS.COMPLETE : HAPITCS.MAJOR_CLICK);
    
    // Every activity completed counts for 10 XP, and uncompleted deducts 10 XP
    const xpToAdd = isCompleted ? 10 : -10;
    
    await db.userSettings.where('id').equals(user.id).modify(u => {
       if (u.gameData) {
          u.gameData.xp = Math.max(0, (u.gameData.xp || 0) + xpToAdd);
       }
    });
    
    toast.current?.show({
      severity: isCompleted ? "success" : "info",
      summary: isCompleted ? "إنجاز نشاط! ⚡" : "تراجع عن النشاط ↩️",
      detail: isCompleted ? `أنجزت نشاطاً بنجاح! نلت +10 XP وزادت طاقة الخطة بـ 15%.` : `تم التراجع عن النشاط وخُصمت 10 XP.`,
      life: 3000,
    });
  };

  const undertakeReflection = async () => {
    if (hasReflectedToday || !user) return;
    if (user.isFrozen) {
      toast.current?.show({
        severity: "warn",
        summary: "الرحلة مجمدة ❄️",
        detail: "الرحلة في وضع التجميد حالياً لحماية إحصائياتك والستريك. يرجى إلغاء التجميد أولاً.",
        life: 3000
      });
      return;
    }
    vibrate(HAPITCS.COMPLETE);
    const updatedGameData = processWorkdayAndStreak(gData);
    await db.userSettings.update(user.id, {
      gameData: updatedGameData,
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
    if (user.isFrozen) {
      toast.current?.show({
        severity: "warn",
        summary: "الرحلة مجمدة ❄️",
        detail: "الرحلة في وضع التجميد حالياً لحماية إحصائياتك والستريك. يرجى إلغاء التجميد أولاً.",
        life: 3000
      });
      return;
    }
    vibrate(HAPITCS.GUIDANCE);
    const updatedXp = gData.xp || 0;
    await db.userSettings.update(user.id, {
      gameData: { ...gData, fuel: 100, lastReflectionDate: today, streak: 0, xp: updatedXp },
    });
    toast.current?.show({
      severity: "success",
      summary: "يوم راحة فكري مبارك! ☀️",
      detail:
        "أخذ قسط من الراحة والاستراحة يجدد ملكتك الإبداعية!",
      life: 3000,
    });
  };

  const saveJournalNote = async () => {
    if (!user || !activeNoteStationId || !noteText.trim()) return;
    vibrate(HAPITCS.COMPLETE);
    const prevNotes = { ...(user.notes || {}) };
    
    if (editingNoteIndex !== null && editingStationId) {
       // Old logic for editingNoteIndex (if still used) - better to use editingNote state
    } else {
      // Add new note
      const stationNotes = Array.isArray(prevNotes[activeNoteStationId]) 
        ? [...prevNotes[activeNoteStationId]] 
        : [];
      
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
              date: new Date().toISOString(),
              priority: notePriority
            }
          ] 
        },
      });
      toast.current?.show({
        severity: "success",
        summary: "تمت إضافة الخاطرة ✍️",
        detail: "تم حفظ ملاحظتك الجديدة في سجل هذه الخطة بنجاح.",
        life: 3000,
      });
    }
    
    setNoteText("");
    setNotePriority('medium');
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

  const deleteResource = async (index: number) => {
    if (!user || !user.id) return;
    if (!window.confirm("هل أنت متأكد من حذف هذا المصدر؟")) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    const updated = (user.resources || []).filter((_, i) => i !== index);
    await db.userSettings.update(user.id, { resources: updated });
    toast.current?.show({ severity: "info", summary: "تم الحذف", detail: "تم حذف المصدر بنجاح" });
  };

  const saveTimeCapsule = async (targetStationId: string, customText?: string) => {
    const textToSave = customText !== undefined ? customText : capsuleText;
    if (!user || !textToSave.trim()) return;
    
    vibrate(HAPITCS.COMPLETE);
    const capsules = { ...(user.timeCapsules || {}) };
    
    const existing = capsules[targetStationId] || {
      message: "",
      writtenAt: "",
      isRead: false,
      messages: []
    };
    
    const timestamp = new Date().toLocaleDateString("ar-EG") + " " + new Date().toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });
    
    const currentMessages = existing.messages || [];
    if (existing.message && currentMessages.length === 0) {
      currentMessages.push({
        message: existing.message,
        writtenAt: existing.writtenAt || new Date().toLocaleDateString("ar-EG")
      });
    }
    
    currentMessages.push({
      message: textToSave.trim(),
      writtenAt: timestamp
    });
    
    capsules[targetStationId] = {
      message: textToSave.trim(),
      writtenAt: timestamp,
      isRead: false,
      messages: currentMessages
    };
    
    await db.userSettings.update(user.id, { timeCapsules: capsules });
    
    if (customText === undefined) {
      setCapsuleText("");
    }
    
    toast.current?.show({
      severity: "success",
      summary: "تم إرسال الكبسولة ✉️",
      detail:
        "لقد قمنا بغلق كبسولتك الزمنية وشحنها في مسيرتك العلمية، وستفتح تلقائياً فور فك قفل الخطة القادمة.",
      life: 4000,
    });
  };

  const buyKeys = async (count: 5 | 10 = 10) => {
    const cost = count === 5 ? 60 : 120;
    if (gData.xp >= cost) {
      vibrate(HAPITCS.MAJOR_CLICK);
      await db.userSettings.update(user!.id, {
        gameData: { ...gData, xp: gData.xp - cost, keys: gData.keys + count },
      });
      toast.current?.show({
        severity: "success",
        summary: "مقايضة ناجحة! 🧠",
        detail:
          `استثمرت ${cost} XP بنجاح وحصلت على ${count} مفاتيح تركيز لفك قفل الدروس والمحطات الجديدة.`,
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
    setStationTabsIndex(2);

    toast.current?.show({
      severity: "success",
      summary: "تم تفعيل الخطة التطبيقية! 🛠️",
      detail: "الآن حان وقت التطبيق العملي للوصول للخطة التالية.",
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
    const rawSubs = user.subStations?.[stationId];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    
    if (!stationSubs || !stationSubs[subStationIndex]) return;

    const subStation = stationSubs[subStationIndex];
    const sTasks = subStation.tasks || [];
    
    const task = sTasks.find(t => t.id === taskId);
    if (!task) return;

    // Only allow un-completing via toggle
    if (!task.isCompleted) {
       // Should open sidebar/modal instead
       return;
    }

    vibrate(HAPITCS.MAJOR_CLICK);

    const updatedTasks = sTasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          isCompleted: false,
          subTasks: t.subTasks?.map(st => ({ ...st, isCompleted: false }))
        };
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
    
    toast.current?.show({
      severity: "info",
      summary: "تم التراجع عن المهمة",
      detail: "تمت إعادة تصفير المهمة وأنشطتها الفرعية كغير مكتملة.",
      life: 3000
    });
  };

  const toggleSubStationInnerTask = async (stationId: string, subStationIndex: number, mainTaskId: string, innerTaskId: string) => {
    if (!user) return;
    const rawSubs = user.subStations?.[stationId];
    const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
    
    if (!stationSubs || !stationSubs[subStationIndex]) return;

    const subStation = stationSubs[subStationIndex];
    const sTasks = subStation.tasks || [];
    const mainTask = sTasks.find(t => t.id === mainTaskId);
    if (!mainTask) return;
    
    const innerTask = mainTask.subTasks?.find(st => st.id === innerTaskId);
    if (!innerTask) return;

    // Only allow un-completing via toggle
    if (!innerTask.isCompleted) {
       return;
    }

    vibrate(HAPITCS.MAJOR_CLICK);

    const updatedTasks = sTasks.map(t => {
      if (t.id === mainTaskId) {
          const updatedSubs = t.subTasks?.map(st => {
              if (st.id === innerTaskId) return { ...st, isCompleted: false };
              return st;
          });
          return { ...t, subTasks: updatedSubs, isCompleted: false };
      }
      return t;
    });

    const updatedStationSubs = [...stationSubs];
    updatedStationSubs[subStationIndex] = {
      ...subStation,
      tasks: updatedTasks,
      isCompleted: false
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
    const mainTasks = tasks.filter(t => 
      t.stationId === selectedStation && 
      t.type === 'main' && 
      !t.parentId && 
      !t.title.includes("المراجعة") && 
      !t.title.includes("خطة المراجعة")
    );
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

  const completePracticalTask = async (stationId: string, subStationIndex: number, taskId: string) => {
    if (!user) return;

    // Check if sub-tasks are completed before allowing main practical task completion
    const rawSubsCheck = user.subStations?.[stationId];
    const stationSubsCheck = Array.isArray(rawSubsCheck) ? rawSubsCheck : (rawSubsCheck ? [rawSubsCheck] : []);
    const subStationCheck = stationSubsCheck[subStationIndex];
    if (subStationCheck) {
      const taskCheck = subStationCheck.tasks.find(t => t.id === taskId);
      if (taskCheck && taskCheck.subTasks && taskCheck.subTasks.some(st => !st.isCompleted)) {
        vibrate(HAPITCS.MAJOR_CLICK);
        toast.current?.show({
          severity: "warn",
          summary: "أكمل المهام الفرعية أولاً ⚠️",
          detail: "هذه المهمة التطبيقية تحتوي على نقاط فرعية لم تكتمل بعد.",
          life: 3000
        });
        return;
      }
    }

    vibrate(HAPITCS.COMPLETE);
    await db.userSettings.where('id').equals(user.id).modify(u => {
      const rawSubs = u.subStations?.[stationId];
      const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
      if (!stationSubs || !stationSubs[subStationIndex]) return;

      const subStation = stationSubs[subStationIndex];
      const sTasks = subStation.tasks || [];
      
      let wasAlreadyCompleted = true;
      
      const updatedTasks = sTasks.map(t => {
        if (t.id === taskId) {
          if (!t.isCompleted) wasAlreadyCompleted = false;
          return { ...t, isCompleted: true };
        }
        return t;
      });

      if (wasAlreadyCompleted) return;

      const isNowCompleted = updatedTasks.every(t => t.isCompleted);
      const updatedStationSubs = [...stationSubs];
      updatedStationSubs[subStationIndex] = {
        ...subStation,
        tasks: updatedTasks,
        isCompleted: isNowCompleted
      };
      
      const baseGameData = { ...u.gameData };
      if (!wasAlreadyCompleted) {
        // No XP addition
      }
      
      const updatedGameData = processWorkdayAndStreak(baseGameData);

      u.subStations = {
         ...(u.subStations || {}),
         [stationId]: updatedStationSubs
      };
      
      u.gameData = updatedGameData;
    });
    
    const refreshedUser = await db.userSettings.get(user.id);
    const rawSubs2 = refreshedUser?.subStations?.[stationId];
    const stationSubs2 = Array.isArray(rawSubs2) ? rawSubs2 : (rawSubs2 ? [rawSubs2] : []);
    const subStation = stationSubs2[subStationIndex];
    if (!subStation) return;
    
    const isNowCompleted = subStation.isCompleted;

    if (isNowCompleted) {
       confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 30000000
       });
       toast.current?.show({
          severity: "success",
          summary: "إنجاز عظيم! 🏆",
          detail: "لقد أتممت أحد الأنشطة التطبيقية لهذه الخطة بنجاح.",
          life: 5000,
       });
    } else {
      toast.current?.show({
        severity: "success",
        summary: "تطبيق ناجح! 🛠️",
        detail: "أنجزت مهمة تطبيقية بنجاح!",
        life: 3000,
      });
    }
  };

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
    editingNoteIndex,
    setEditingNoteIndex,
    editingStationId,
    setEditingStationId,
    stationTabsIndex,
    setStationTabsIndex,
    activeNoteStationId,
    setActiveNoteStationId,
    noteText,
    setNoteText,
    notePriority,
    setNotePriority,
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
    showRoutinePopup,
    setShowRoutinePopup,
    showPracticalPopup,
    setShowPracticalPopup,
    showCapsulePopup,
    setShowCapsulePopup,
    showCompassPopup,
    setShowCompassPopup,
    showRestSpeedDial,
    setShowRestSpeedDial,
    gamificationActiveTab,
    setGamificationActiveTab,
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
    completeTask,
    completePracticalTask,
    activeStationId,
    activeStation,
    activeStationTasks,
    closeCelebration,
    undertakeReflection,
    takeRestDay,
    saveJournalNote,
    deleteJournalNote,
    deleteResource,
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
    isAllTasksCompleted
  };
}
