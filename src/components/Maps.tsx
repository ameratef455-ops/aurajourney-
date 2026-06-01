import { useState, useMemo, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuraJourney } from "../hooks/useAuraJourney";
import { LAYERS } from "../constants/layers";
import { db } from "../db";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS } from "../lib/haptics";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { TabView, TabPanel } from "primereact/tabview";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { confirmPopup, ConfirmPopup } from "primereact/confirmpopup";
import { SpeedDial } from "primereact/speeddial";
import { DataView } from "primereact/dataview";
import { Tree } from "primereact/tree";
import { toast as toastHot } from "react-hot-toast";
import { 
  Atom, BookOpen, Cpu, Brain, Globe, Compass, Music, Palette, Calculator, Code, Rocket, Landmark, Microscope, Telescope, Languages, Binary, Lightbulb, Sigma, Trophy, History, TrendingUp, Calendar, Info,
  Sparkles, Volume2, MessageSquare, Mic, Shield, Play
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import confetti from "canvas-confetti";
import { safeRandomUUID } from "../lib/uuid";
import { GamificationSidebar } from "./GamificationSidebar";
import { ReflectionSidebar } from "./ReflectionSidebar";
import { EvaluationSidebar } from "./EvaluationSidebar";
import { NotificationsPopover } from "./NotificationsPopover";
import { FlashcardsModal }
from "./FlashcardsModal";
import { TaskReviewModal } from "./TaskReviewModal";
import { TaskReflectionModal } from "./TaskReflectionModal";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { RevertConfirmModal } from "./RevertConfirmModal";
import { CalendarTheme } from "./themes/CalendarTheme";
import { AdsCarousel } from "./AdsCarousel";
import { addDays, getDay, format } from "date-fns";
import { ar } from "date-fns/locale";

const ARABIC_DAYS_MAP: Record<number, string> = {
  0: "الأحد",
  1: "الإثنين",
  2: "الثلاثاء",
  3: "الأربعاء",
  4: "الخميس",
  5: "الجمعة",
  6: "السبت"
};

export function Maps({ onBack, tripId, userRole }: { onBack?: () => void; tripId?: string | null; userRole?: 'admin' | 'free' | 'premium' | 'guest' | null }) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStation, setPaymentStation] = useState<any>(null);
  const toast = useRef({
    show: (options: { severity?: string; summary?: string; detail?: string; life?: number }) => {
      const msg = options.detail || options.summary || "";
      const duration = options.life || 3000;
      if (options.severity === "error") {
        toastHot.error(msg, {
          duration,
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      } else if (options.severity === "success") {
        toastHot.success(msg, {
          duration,
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      } else if (options.severity === "warn") {
        toastHot(msg, {
          duration,
          icon: '⚠️',
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      } else {
        toastHot(msg, {
          duration,
          style: {
            borderRadius: '24px',
            background: '#0c183e',
            color: '#fff',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            fontWeight: 'bold',
            direction: 'rtl'
          },
        });
      }
    }
  }) as any;
  const { 
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
    ads,
    leaderboard,
    showCompletionModal,
    setShowCompletionModal,
    completionModalData,
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
  } = useAuraJourney({ tripId, toast });

  useEffect(() => {
    // Force load voices for TTS
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
  }, []);

  // CRUD Stations States
  const [isAddStationVisible, setIsAddStationVisible] = useState(false);
  const [isEditStationVisible, setIsEditStationVisible] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<any | null>(null);
  const [stationToDelete, setStationToDelete] = useState<any | null>(null);

  // Form Fields
  const [stationFormName, setStationFormName] = useState("");
  const [stationFormDescription, setStationFormDescription] = useState("");
  const [stationFormIcon, setStationFormIcon] = useState("pi pi-flag-fill");
  const [stationFormDate, setStationFormDate] = useState("");
  const [stationFormIsPremium, setStationFormIsPremium] = useState(false);
  const [stationFormCompletionMessage, setStationFormCompletionMessage] = useState("");

  const ICON_PRESETS = [
    "pi pi-flag-fill", 
    "pi pi-star-fill", 
    "pi pi-bolt", 
    "pi pi-book", 
    "pi pi-trophy", 
    "pi pi-briefcase", 
    "pi pi-bookmark-fill", 
    "pi pi-chart-pie", 
    "pi pi-calendar-plus"
  ];

  const handleOpenAddStation = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setStationFormName("");
    setStationFormDescription("");
    setStationFormIcon("pi pi-flag-fill");
    setStationFormDate(new Date().toISOString().split('T')[0]);
    setStationFormIsPremium(false);
    setStationFormCompletionMessage("");
    setIsAddStationVisible(true);
  };

  const handleOpenEditStation = (st: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setStationToEdit(st);
    setStationFormName(st.name || "");
    setStationFormDescription(st.description || "");
    setStationFormIcon(st.icon || "pi pi-flag-fill");
    setStationFormDate(st.targetDate || new Date().toISOString().split('T')[0]);
    setStationFormIsPremium(!!st.isPremium);
    setStationFormCompletionMessage(st.completionMessage || "");
    setIsEditStationVisible(true);
  };

  const handleOpenDeleteStation = (st: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setStationToDelete(st);
    setIsDeleteConfirmVisible(true);
  };

  const handleCreateStation = async () => {
    if (!stationFormName.trim()) {
      toastHot.error("يرجى إدخال اسم الخطة! ⚠️");
      return;
    }
    const currentMaxOrder = (stations || []).reduce((max, s: any) => s.order > max ? s.order : max, -1);
    const newStationId = safeRandomUUID();
    
    await db.stations.add({
      id: newStationId,
      name: stationFormName.trim(),
      description: stationFormDescription.trim(),
      icon: stationFormIcon || 'pi pi-flag-fill',
      targetDate: stationFormDate || new Date().toISOString().split('T')[0],
      order: currentMaxOrder + 1,
      isPremium: stationFormIsPremium,
      completionMessage: stationFormCompletionMessage.trim()
    });

    // Add a default task to make the plan functional
    await db.tasks.add({
      id: safeRandomUUID(),
      stationId: newStationId,
      title: "مهمة البداية الأولى 🚀",
      type: "main",
      isCompleted: false
    });

    setIsAddStationVisible(false);
    toastHot.success("تم إضافة الخطة الجديدة بنجاح! 🎉");
  };

  const handleUpdateStation = async () => {
    if (!stationToEdit) return;
    if (!stationFormName.trim()) {
      toastHot.error("يرجى إدخال اسم الخطة! ⚠️");
      return;
    }

    await db.stations.update(stationToEdit.id, {
      name: stationFormName.trim(),
      description: stationFormDescription.trim(),
      icon: stationFormIcon,
      targetDate: stationFormDate,
      isPremium: stationFormIsPremium,
      completionMessage: stationFormCompletionMessage.trim()
    });

    setIsEditStationVisible(false);
    setStationToEdit(null);
    toastHot.success("تم تحديث الخطة المحددة بنجاح! ✏️");
  };

  const handleDeleteStation = async () => {
    if (!stationToDelete) return;
    
    await db.stations.delete(stationToDelete.id);
    await db.tasks.where("stationId").equals(stationToDelete.id).delete();

    setIsDeleteConfirmVisible(false);
    setStationToDelete(null);
    toastHot.success("تم حذف الخطة ومهماتها بنجاح! 🗑️");
  };

  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [taskMenuOpenId, setTaskMenuOpenId] = useState<string | null>(null);
  const [isStationFabOpen, setIsStationFabOpen] = useState(false);
  const [isOuterFabOpen, setIsOuterFabOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'journey' | 'calendar' | 'tasks'>('journey');
  const [hasInitializedIndex, setHasInitializedIndex] = useState(false);
  const [showUnfreezeConfirm, setShowUnfreezeConfirm] = useState(false);
  const [noteFilterPriority, setNoteFilterPriority] = useState('all');

  useEffect(() => {
    if (stations && stations.length > 0 && !hasInitializedIndex) {
      let initialIndex = 0;
      if (activeStationId) {
        const idx = stations.findIndex(s => s.id === activeStationId);
        if (idx !== -1) initialIndex = idx;
      } else if (unlockedStations && unlockedStations.length > 0) {
        initialIndex = Math.min(unlockedStations.length - 1, stations.length - 1);
      }
      setActiveCardIndex(initialIndex);
      setHasInitializedIndex(true);
    }
  }, [stations, activeStationId, unlockedStations, hasInitializedIndex]);

  const renderTaskThreeDotsMenu = (task: any, customOptions: {
    onReview?: () => void;
    onFlashcard?: () => void;
    onAnalytics?: () => void;
  }) => {
    const hasAnyOption = customOptions.onReview || customOptions.onFlashcard || customOptions.onAnalytics;
    if (!hasAnyOption || !task.isCompleted) return null;

    return (
      <div className="flex items-center gap-1 shrink-0 mr-1.5 ml-1.5" dir="rtl">
        {customOptions.onReview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              vibrate(HAPITCS.MAJOR_CLICK);
              setReviewingTask(task);
            }}
            className="w-5.5 h-5.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-all cursor-pointer border-none shadow-3xs"
            title="تكرار المراجعة"
          >
            <i className="pi pi-replay text-[9px] font-black" />
          </button>
        )}
        {customOptions.onFlashcard && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              vibrate(HAPITCS.MAJOR_CLICK);
              setFlashcardTask(task);
            }}
            className="w-5.5 h-5.5 rounded-lg bg-sky-50 hover:bg-sky-100 flex items-center justify-center text-sky-600 transition-all cursor-pointer border-none shadow-3xs"
            title="كروت المراجعة"
          >
            <i className="pi pi-envelope text-[9px] font-black" />
          </button>
        )}
        {customOptions.onAnalytics && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              vibrate(HAPITCS.MAJOR_CLICK);
              setSelectedTaskForAnalytics(task);
            }}
            className="w-5.5 h-5.5 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 transition-all cursor-pointer border-none shadow-3xs"
            title="عرض التحليلات"
          >
            <i className="pi pi-chart-bar text-[9px] font-black" />
          </button>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (showNotesPopup && activeStationId) {
      setActiveNoteStationId(activeStationId);
    }
  }, [showNotesPopup, activeStationId, setActiveNoteStationId]);

  useEffect(() => {
    if (viewMode === 'tasks' && !selectedStation && activeStationId) {
      setSelectedStation(activeStationId);
    }
  }, [viewMode, selectedStation, activeStationId, setSelectedStation]);

  useEffect(() => {
    if (gData.fuel <= 0 && user && !user.isVacation && !user.isFrozen) {
      toastHot.custom((t) => (
        <div className="bg-white rounded-2xl shadow-2xl border border-rose-100 p-5 max-w-sm w-[90vw] mx-auto text-right" dir="rtl">
           <p className="text-xl text-rose-600 font-extrabold mb-3">بنزينك خلص يا بطل! ⛽</p>
           <p className="text-sm font-medium text-gray-500 mb-5 leading-relaxed">
             لازم تاخد أجازة دلوقتي عشان تستعيد نشاطك وطاقتك بالكامل، بدون ما تخسر الاستريك بتاعك!
           </p>
           <div className="flex justify-end gap-3">
              <button 
                onClick={() => toastHot.dismiss(t.id)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-200 border-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                 تجاهل
              </button>
              <button 
                onClick={async () => {
                   import('../lib/haptics').then(({ playTickSound }) => playTickSound());
                   vibrate(HAPITCS.MAJOR_CLICK);
                   const todayStr = new Date().toDateString();
                   const newStreak = (gData.streak || 0) + 1;
                   await db.userSettings.update(user.id, {
                     isVacation: true,
                     gameData: { ...gData, fuel: 100, lastReflectionDate: todayStr, streak: newStreak }
                   });
                   toastHot.dismiss(t.id);
                   toastHot.success("تم تفعيل الأجازة بنجاح، استرح وتجهز للعودة! 🌴", {
                     style: { background: '#10b981', color: 'white', borderRadius: '24px', fontWeight: 'bold' },
                     duration: 4000
                   });
                }}
                className="bg-rose-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 border-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                 خد أجازة الحين 🌴
              </button>
           </div>
        </div>
      ), { duration: Infinity, id: 'vacation-toast' });
    }
  }, [gData.fuel, user?.isVacation, user?.isFrozen, user?.id]);

  const [evaluationSidebarVisible, setEvaluationSidebarVisible] = useState(false);
  const [selectedTaskForEvaluation, setSelectedTaskForEvaluation] = useState<any>(null);
  const [selectedTaskForAnalytics, setSelectedTaskForAnalytics] = useState<any>(null);
  const [taskReflectionData, setTaskReflectionData] = useState<any>(null);
  
  const [reviewingTask, setReviewingTask] = useState<any>(null);
  const [revertingTask, setRevertingTask] = useState<any>(null);
  const [flashcardTask, setFlashcardTask] = useState<any>(null);
  const [taskDetailsVisible, setTaskDetailsVisible] = useState(false);

  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackType, setFeedbackType] = useState<'complaint' | 'rating' | 'suggestion'>('rating');

  const handleSubmitFeedback = async () => {
    if (!feedbackComment.trim()) {
      toastHot.error("يرجى كتابة تعليقك أولاً! ⚠️");
      return;
    }
    await db.feedbacks.add({
      id: safeRandomUUID(),
      userId: user?.id || 'anonymous',
      userName: user?.psychology?.target || user?.learningGoal || 'مستخدم',
      rating: feedbackRating,
      comment: feedbackComment.trim(),
      type: feedbackType,
      createdAt: new Date().toISOString()
    });
    setShowFeedbackModal(false);
    setFeedbackComment("");
    setFeedbackRating(5);
    toastHot.success("تم إرسال تعقيبك بنجاح، شكراً للمشاركة! ❤️");
  };
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<any>(null);
  const [reviewReflectionVisible, setReviewReflectionVisible] = useState(false);
  const [initialReflectionVisible, setInitialReflectionVisible] = useState(false);
  const [showStumbleForm, setShowStumbleForm] = useState(false);
  const [stumbleReason, setStumbleReason] = useState("");
  const [reflectionForceStationId, setReflectionForceStationId] = useState<string | null>(null);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [stationDialVisible, setStationDialVisible] = useState(false);
  const [showCalendarAddTask, setShowCalendarAddTask] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(null);
  const [calendarSelectedStationId, setCalendarSelectedStationId] = useState<string | null>(null);
  const [compassCapsuleText, setCompassCapsuleText] = useState("");
  const [isEditingPsychology, setIsEditingPsychology] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editAnxieties, setEditAnxieties] = useState("");

  const handleSavePsychology = async () => {
    import('../lib/haptics').then(({ playTickSound }) => playTickSound());
    vibrate(HAPITCS.MAJOR_CLICK);
    try {
      await db.userSettings.update(user.id, {
        psychology: {
          ...user.psychology,
          reason: editReason,
          target: editTarget,
          anxieties: editAnxieties,
        }
      });
      setIsEditingPsychology(false);
      toastHot.success("تم تحديث بيانات البوصلة بنجاح! 🧭", {
        style: { background: '#1e1b4b', color: 'white', borderRadius: '24px', fontWeight: 'bold' }
      });
    } catch (err) {
      console.error(err);
      toastHot.error("فشل حفظ التعديلات");
    }
  };

  const [isCapsuleBoxOpened, setIsCapsuleBoxOpened] = useState(false);

  // Routine Edit Mode States
  const [routineEditMode, setRoutineEditMode] = useState(false);
  const [editDailyDuration, setEditDailyDuration] = useState(0);
  const [editLearningDays, setEditLearningDays] = useState<number[]>([]);

  useEffect(() => {
    if (showRoutinePopup && user) {
      setEditDailyDuration(user.dailyDuration || 30);
      setEditLearningDays(user.learningDays || [0, 1, 2, 3, 4]);
      setRoutineEditMode(false);
    }
  }, [showRoutinePopup, user]);

  useEffect(() => {
    if (celebratedCapsule) {
      setIsCapsuleBoxOpened(false);
    }
  }, [celebratedCapsule]);

  const allStumbles = useLiveQuery(() => {
    try {
      if (!db.stumbles) return [];
      return db.stumbles.toArray();
    } catch {
      return [];
    }
  }) || [];

  const openTaskAnalytics = async (task: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setSelectedTaskForAnalytics(task);
    if (db.reflections) {
      const refs = await db.reflections.where("taskId").equals(task.id).toArray();
      const sorted = refs.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // If there's an initial and review, return both. If only one, return it as array.
      setTaskReflectionData(sorted.length > 0 ? sorted : null);
    } else {
      setTaskReflectionData(null);
    }
  };

  const handleSaveStumble = async () => {
    if (!stumbleReason.trim() || !selectedStation) return;
    try {
      const currentStationObj = stations.find((s) => s.id === selectedStation);
      const stationName = currentStationObj?.name || 'خطة غير معروفة';
      
      const newStumble = {
        id: safeRandomUUID(),
        stationId: selectedStation,
        stationName,
        reason: stumbleReason.trim(),
        createdAt: new Date().toISOString()
      };

      // 1. Add stumble to Dexie database
      await db.stumbles.add(newStumble);

      // 2. Protect streak - prevent streak from resetting by updating lastReflectionDate to today, but without changing the current streak itself.
      const todayStr = new Date().toDateString();
      if (user) {
        // Retrieve current game data
        const currentGData = user?.gameData || { xp: 0, keys: 0, fuel: 100, lastReflectionDate: "", streak: 0 };
        const updatedGData = {
          ...currentGData,
          lastReflectionDate: todayStr
        };
        await db.userSettings.update(user.id, {
          gameData: updatedGData
        });
      }

      toast.current?.show({
        severity: "success",
        className: "font-sans",
        summary: "تم تأمين السلسلة 🛡️",
        detail: "سجلنا تعثرك وحمينا سلسلتك المتتالية من الانكسار!",
        life: 4000
      });

      setShowStumbleForm(false);
      setStumbleReason("");
    } catch (err) {
      console.error("Failed to save stumble:", err);
      toast.current?.show({
        severity: "error",
        summary: "فشل الحفظ ❌",
        detail: "حدث خطأ غير متوقع أثناء تدوين الاستثناء.",
        life: 3000
      });
    }
  };

  const handleCompleteTask = (task: any) => {
    if (task.activities) {
      const checkActivities = (acts: any[]): boolean => {
          return acts.every(a => a.isCompleted && (!a.children || checkActivities(a.children)));
      };
      if (!checkActivities(task.activities)) {
          vibrate(HAPITCS.MAJOR_CLICK);
          toastHot.error("يُرجى إكمال جميع الأنشطة التنفيذية لهذه المهمة قبل محاولة ختمها وتقييمها. ⚠️");
          return;
      }
    }
    setReviewingTask(task);
    setInitialReflectionVisible(true);
  };

  const reflections = useLiveQuery(() => db.reflections.toArray()) || [];

  const treeNodeTemplate = (node: any) => {
    const t = node.data;
    const isSub = t.type === 'sub';
    const totalSubs = node.children ? node.children.length : 0;
    const completedSubs = node.children ? node.children.filter((c: any) => c.data.isCompleted).length : 0;
    
    const hasReflection = reflections.some(r => r.taskId === t.id);

    return (
      <div 
          className="flex items-center gap-3 py-1.5 w-full font-sans group"
          onClick={(e) => {
              e.stopPropagation();
              vibrate(HAPITCS.MAJOR_CLICK);
              setSelectedTaskForDetails(t);
              setTaskDetailsVisible(true);
          }}
      >
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (t.isCompleted) {
                setRevertingTask(t);
              } else {
                if (t.type === 'main' && !t.isCompleted && completedSubs < totalSubs) {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    toast.current?.show({
                      severity: "warn",
                      summary: "أنجز الفرعيات أولاً ⚠️",
                      detail: "يرجى إكمال المهام الفرعية للرئيسية أولاً.",
                      life: 4000
                    });
                    return;
                }
                handleCompleteTask(t);
              }
            }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer
                ${
                  t.isCompleted
                    ? (isSub ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-blue-900 border-blue-900 shadow-md shadow-blue-900/20") + " text-white"
                    : (isSub ? "border-indigo-200" : "border-blue-200") + " bg-white hover:border-blue-400"
                }
              `}
          >
            {t.isCompleted && (
              <i className="pi pi-check text-[8px] font-black scale-110"></i>
            )}
          </div>
          <div className="flex flex-col gap-0.5 justify-center">
            <span
              className={`font-bold transition-all leading-tight
                   ${t.isCompleted 
                      ? "text-slate-400 line-through opacity-65" 
                      : (isSub ? "text-slate-700 text-xs" : "text-blue-950 text-sm")
                   }`}
            >
              {t.title}
            </span>
            {t.description && (
              <span className={`text-[10px] font-sans transition-all leading-tight ${t.isCompleted ? 'text-slate-300 line-through opacity-50' : 'text-slate-500 font-medium'}`}>
                {t.description}
              </span>
            )}
          </div>
          <div className="mr-auto flex items-center gap-1">
            {!hasReflection && t.isCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setReviewingTask(t);
                  setInitialReflectionVisible(true);
                }}
                className="p-1 px-2.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 transition-all rounded-lg flex items-center justify-center cursor-pointer shadow-3xs hover:scale-105 gap-1.5"
                title="قيم أداءك على هذه المهمة"
                type="button"
              >
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-black">قيم أداءك</span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                vibrate(HAPITCS.MAJOR_CLICK);
                setSelectedTaskForDetails(t);
                setTaskDetailsVisible(true);
              }}
              className="p-1 px-1.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 transition-all rounded-lg flex items-center justify-center cursor-pointer shadow-3xs hover:scale-110"
              title="تفاصيل المهمة والأنشطة"
              type="button"
            >
              <Info className="w-3 h-3 font-black" />
            </button>
            {t.isCompleted && (
              <>
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReviewingTask(t);
                }}
                className="p-1.5 px-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 transition-all rounded-lg flex items-center justify-center cursor-pointer shadow-3xs hover:scale-105"
                title="مراجعة الأنشطة"
                type="button"
              >
                <i className="pi pi-compass text-[10px] font-black mr-1"></i>
                <span className="text-[10px] font-bold">راجع</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFlashcardTask(t);
                }}
                className="p-1.5 px-2 bg-sky-50 border border-sky-100 hover:bg-sky-100 text-sky-700 transition-all rounded-lg flex items-center justify-center cursor-pointer shadow-3xs hover:scale-105 gap-1"
                title="كروت المراجعة"
                type="button"
              >
                <i className="pi pi-clone text-[10px] font-black"></i>
                <span className="text-[10px] font-bold">كروت</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openTaskAnalytics(t);
                }}
                className="p-1.5 text-indigo-600 hover:text-indigo-800 transition-colors rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-3xs"
                title="عرض تحليلات المهمة"
                type="button"
              >
                <i className="pi pi-chart-bar text-[10px] font-black"></i>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const isMainTasksFullyCompleted = useMemo(() => {
    if (!selectedStation || !tasks) return false;
    const stTasks = tasks.filter(t => t.stationId === selectedStation && t.type === 'main');
    if (stTasks.length === 0) return true;
    return stTasks.every(t => t.isCompleted);
  }, [selectedStation, tasks]);

  const currentTheme = user?.theme || 'cards';
  const displayTheme = currentTheme === 'calendar' ? 'cards' : currentTheme;

  const handleStationClick = (id: string, isUnlocked: boolean, i: number, isPremium?: boolean) => {
    const station = stations.find(s => s.id === id);

    // Admin bypass all check
    if (userRole === 'admin') {
      setSelectedStation(id);
      setViewMode('tasks');
      return;
    }

    const isFreeUser = userRole === 'free' || userRole === 'guest' || userRole === null || userRole === undefined || user?.role === 'free';
    if (isPremium && isFreeUser) {
      vibrate(HAPITCS.FAILURE);
      setPaymentStation(station);
      setShowPaymentDialog(true);
      return;
    }

    if (isUnlocked) {
      vibrate(HAPITCS.MAJOR_CLICK);
      setPoppedStationId(id);
      setTimeout(() => {
        setSelectedStation(id);
        setViewMode('tasks');
      }, 300);
    } else if (i === unlockedStations.length) {
      vibrate(HAPITCS.FAILURE);
      setSelectedStation(id);
      const st = stations[i];
      const prevSt = stations[i - 1];
      const prevName = prevSt ? prevSt.name : "";
      const prevEnergy = prevSt
        ? stationEnergy[prevSt.id] || 0
        : 0;
      setLockedDialogData({
        stationName: st.name,
        stationIcon: st.icon && st.icon.startsWith("pi ") ? st.icon : "pi pi-flag-fill",
        requiredKeys: 10,
        currentKeys: gData.keys,
        prevStationName: prevName,
        prevStationEnergy: prevEnergy,
      });
      setLockedDialogVisible(true);
    }
  };

  const handleCalendarAddTask = async (title: string) => {
    const targetId = calendarSelectedStationId || activeStationId;
    if (!title.trim() || !targetId) return;
    await db.tasks.add({
      id: safeRandomUUID(),
      stationId: targetId,
      title: title.trim(),
      type: 'main',
      isCompleted: false
    });
    setShowCalendarAddTask(false);
    const targetStation = stations.find(s => s.id === targetId);
    toast.current?.show({
      severity: 'success',
      summary: 'تمت إضافة المهمة ✨',
      detail: `تمت إضافة المهمة إلى "${targetStation?.name || 'الخطة'}"`,
      life: 3000
    });
  };

  const handleArrangeCalendar = async (stationId: string, weekDays: Date[]) => {
    try {
      const stationTasks = await db.tasks.where('stationId').equals(stationId).toArray();
      const uncompletedTasks = stationTasks.filter(t => !t.isCompleted);
      
      const learningDaysRefs = user?.learningDays || [];
      const isLearningDay = (day: Date) => learningDaysRefs.length === 0 || learningDaysRefs.includes(day.getDay());

      const availableDates = weekDays.filter(day => isLearningDay(day)).map(d => {
        const dStr = new Date(d);
        dStr.setHours(12, 0, 0, 0);
        return dStr.toISOString().split('T')[0];
      });

      if (availableDates.length === 0 || uncompletedTasks.length === 0) {
        toast.current?.show({
          severity: "info",
          summary: "لا يوجد مهام 📭",
          detail: "لا توجد مهام غير مكتملة أو أيام تعليمية لترتيبها",
          life: 3000,
        });
        return;
      }

      vibrate(HAPITCS.COMPLETE);
      
      let dayIndex = 0;
      for (const t of uncompletedTasks) {
        let currentDateStr = t.dueDate;
        
        // Check if the current due date is already a learning day in the current week
        const oldDueIsPresentLearningDay = availableDates.includes(t.dueDate || "");
        
        // We only assign a new due date if:
        // 1. the task has no due date OR
        // 2. it's explicitly arranging tasks and ignoring old assignments
        const assignedDate = availableDates[dayIndex % availableDates.length];
        
        await (db.tasks as any).update(t.id, { dueDate: assignedDate });
        dayIndex++;
      }

      toast.current?.show({
        severity: "success",
        summary: "تم الترتيب! 📅",
        detail: "تم توزيع المهام على أيام التعلم لهذا الأسبوع بنجاح.",
        life: 3000,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveArrangement = async (stationId: string, assignments: Record<string, string>) => {
    try {
      if (!user) return;
      
      // Update Database tasks
      for (const [id, date] of Object.entries(assignments)) {
        if (!id.startsWith("practical-")) {
          await (db.tasks as any).update(id, { dueDate: date });
        }
      }

      // Update practical subStation tasks
      const rawSubs = user.subStations?.[stationId] || [];
      const stationSubs = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);
      
      const updatedSubs = stationSubs.map((sub: any, subIdx: number) => {
        const updatedTasks = (sub.tasks || []).map((t: any, taskIdx: number) => {
          const key = `practical-${subIdx}-${taskIdx}`;
          if (assignments[key] !== undefined) {
            return { ...t, dueDate: assignments[key] };
          }
          return t;
        });
        return { ...sub, tasks: updatedTasks };
      });

      await db.userSettings.update(user.id, {
        subStations: {
          ...(user.subStations || {}),
          [stationId]: updatedSubs
        }
      });

      toast.current?.show({
        severity: "success",
        summary: "تم حفظ الترتيب! 📅",
        detail: "تم تنظيم كافة المهام والعمل التطبيقي بنجاح.",
        life: 3000,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderAds = (position: 'top' | 'bottom') => {
    const positionAds = ads.filter(ad => ad.position === position || (!ad.position && position === 'top'));
    return <AdsCarousel ads={positionAds} />;
  };

  if (!stations || !tasks || !user) return null;

  // EnergyRing logic removed as per user request
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full h-full bg-white relative overflow-hidden flex flex-col font-sans"
    >

      {/* Styles for dashed moving road path and floating map */}
      <style>{`
        @keyframes marching-ants {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -24; }
        }
        .animate-marching-ants {
          animation: marching-ants 1.5s linear infinite;
        }
        @keyframes float-map {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-map {
          animation: float-map 5s ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .custom-tree-animation .p-treenode-children {
          animation: treeSlideIn 0.35s ease-out;
        }
        @keyframes treeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .p-tree .p-tree-container .p-treenode .p-treenode-content:focus {
          box-shadow: none;
        }

        /* FAB SpeedDial CSS - Fade In/Out */
        .p-speeddial-item {
          opacity: 0;
          transform: scale(0.8);
          transition: all 500ms cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        }
        .p-speeddial-opened .p-speeddial-item {
          opacity: 1;
          transform: scale(1);
        }
        .p-speeddial-action, .p-speeddial-list {
          transition: all 500ms cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          transition-delay: 0s !important;
        }
        .p-speeddial-button {
          transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 300ms ease, opacity 500ms ease !important;
        }

        /* Dialog & Dialog Mask 500ms transition alignment */
        .p-dialog-mask {
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .p-dialog {
          animation-duration: 500ms !important;
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .p-dialog-enter {
          opacity: 0 !important;
          transform: scale(0.9) translateY(40px) !important;
        }
        .p-dialog-enter-active {
          opacity: 1 !important;
          transform: scale(1) translateY(0) !important;
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .p-dialog-exit {
          opacity: 1 !important;
          transform: scale(1) translateY(0) !important;
        }
        .p-dialog-exit-active {
          opacity: 0 !important;
          transform: scale(0.9) translateY(40px) !important;
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
      `}</style>

      {/* Notifications and Support */}
      <div className="absolute top-8 left-6 z-40 flex items-center gap-3">
         <button
           onClick={() => {
             vibrate(HAPITCS.MAJOR_CLICK);
             setFeedbackType('rating');
             setShowFeedbackModal(true);
           }}
           className="bg-white/90 hover:bg-white text-rose-500 w-11 h-11 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
           title="قيمنا وشكاوى"
         >
           <i className="pi pi-heart-fill text-sm"></i>
         </button>
         <NotificationsPopover />
      </div>

      {/* Standalone Back Button */}
      {onBack && (
        <button
          className="absolute top-8 right-6 z-40 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-blue-600 w-11 h-11 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          onClick={() => {
            vibrate(HAPITCS.MAJOR_CLICK);
            onBack();
          }}
          title="الرجوع للمسارات"
        >
          <i className="pi pi-arrow-right text-sm"></i>
        </button>
      )}

      {user?.isFrozen && (
        <div className="absolute top-26 right-6 z-30">
        </div>
      )}

      {/* Centered Luxury Card Layout Container on a pure white canvas */}
      <div
        className="w-full h-full overflow-y-auto pt-24 pb-20 relative scroll-smooth no-scrollbar bg-white flex flex-col items-center justify-start"
        dir="rtl"
        id="maps-viewport-scroll"
      >
        <div className="w-full max-w-7xl px-4 md:px-8 mx-auto py-4 flex flex-col items-center justify-start z-10 relative">
          
          {/* Vacation Banner */}
          {user?.isVacation && (
            <div className="w-full bg-[#ecfdf5] border border-emerald-200 rounded-3xl p-4 mb-4 flex items-center justify-between shadow-[0_4px_20px_rgba(16,185,129,0.15)] relative overflow-hidden animate-pulse z-30" dir="rtl">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🌴</span>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-950">أنت الآن في أجازة</p>
                  <p className="text-[10px] text-emerald-800 font-bold mt-0.5">استمتع براحتك. الستريك {gData.streak || 0} أيام مستمر.</p>
                </div>
              </div>
              <button
                onClick={async () => {
                   import('../lib/haptics').then(({ playTickSound }) => playTickSound());
                   vibrate(HAPITCS.MAJOR_CLICK);
                   await db.userSettings.update(user.id, { isVacation: false });
                   toastHot.success("مرحباً بك مجدداً في رحلتك! 🔥");
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-black shadow-md border-none select-none hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                العودة للرحلة 🔥
              </button>
            </div>
          )}

          {/* Frozen / Pause Banner */}
          {user?.isFrozen && (
            <div className="w-full bg-[#ecfeff] border border-cyan-200 rounded-3xl p-4 mb-4 flex items-center justify-between shadow-[0_4px_20px_rgba(6,182,212,0.15)] relative overflow-hidden animate-pulse z-30" dir="rtl">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">❄️</span>
                <div className="text-right">
                  <p className="text-xs font-black text-cyan-950">هذه الرحلة مجمدة حالياً</p>
                  <p className="text-[10px] text-cyan-800 font-bold mt-0.5">الستريك ({gData.streak || 0} يوم) والوقود والبيانات محفوظة.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setShowUnfreezeConfirm(true);
                }}
                className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-black shadow-md border-none select-none hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                إلغاء التجميد 🔥
              </button>
            </div>
          )}

          {/* Journey Path Theme Wrapper */}
          <div className="w-full max-w-md px-5 mx-auto flex flex-col items-center justify-start relative z-10 mb-8">
          {displayTheme === 'cards' && (
            <div className="w-full flex flex-col items-center gap-12 relative pb-20 pt-10">
              {/* Top Ads */}
              <div className="w-full px-2">
                {renderAds('top')}
              </div>

              {stations.map((st, i) => {
                const isUnlocked = unlockedStations.includes(st.id);
                const isPremiumUser = userRole === 'premium' || userRole === 'admin';
                const isPremiumLocked = st.isPremium && !isPremiumUser;
                const isActive = isUnlocked && st.id === activeStationId;
                const isCompleted = isUnlocked && !isActive && stationEnergy[st.id] >= 100;
                const isLocked = !isUnlocked || isPremiumLocked;
                const isNextLocked = !isUnlocked && i === unlockedStations.length;

                return (
                  <motion.div
                    key={st.id}
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ 
                      duration: 0.8, 
                      delay: i * 0.05,
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    className="relative flex flex-col items-center w-full max-w-md"
                  >
                    {/* Connection Line */}
                    {i < stations.length - 1 && (
                      <div className="absolute top-24 bottom-[-48px] w-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner z-0">
                        <motion.div 
                          initial={{ height: 0 }}
                          whileInView={{ height: '100%' }}
                          transition={{ duration: 1, delay: 0.4 }}
                          className={`w-full ${isUnlocked ? 'bg-gradient-to-b from-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]' : 'bg-slate-200'}`} 
                        />
                      </div>
                    )}

                    {/* Station Node / Card Wrapper with Quick Access Buttons */}
                    <div className="relative w-full flex items-center justify-center">
                      {isUnlocked && (
                        <>
                          {/* Right Side Buttons - Dynamic Routine & Resources */}
                          <div className="absolute right-[-42px] sm:right-[-48px] top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-30">
                            {/* Learning Routine */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrate(HAPITCS.MAJOR_CLICK);
                                setShowRoutinePopup(true);
                              }}
                              className="w-8 h-8 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-500 hover:text-indigo-600 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110"
                              title="روتين التعلم"
                            >
                              <i className="pi pi-calendar text-[9px] font-black" />
                            </button>

                            {/* Learning Resources */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrate(HAPITCS.MAJOR_CLICK);
                                setSelectedStation(st.id);
                                setShowLinksPopup(true);
                              }}
                              className="w-8 h-8 rounded-full bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-blue-500 hover:text-blue-600 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110"
                              title="مصادر التعلم"
                            >
                              <i className="pi pi-book text-[9px] font-black" />
                            </button>
                          </div>

                          {/* Left Side Buttons - Notes, Analytics & Obstacles */}
                          <div className="absolute left-[-42px] sm:left-[-48px] top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-30">
                            {/* Notes / الخواطر والتدوين */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrate(HAPITCS.MAJOR_CLICK);
                                setActiveNoteStationId(st.id);
                                setShowNotesPopup(true);
                              }}
                              className="w-8 h-8 rounded-full bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-amber-500 hover:text-amber-600 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110"
                              title="الخواطر والتدوين"
                            >
                              <i className="pi pi-pencil text-[9px] font-black" />
                            </button>

                            {/* Reflection & Analytics / التقييم والتحليلات */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrate(HAPITCS.MAJOR_CLICK);
                                setReflectionForceStationId(st.id);
                                setReflectionActiveTab(0);
                                setReflectionSidebar(true);
                              }}
                              className="w-8 h-8 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-500 hover:text-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110"
                              title="التقييم والتحليلات"
                            >
                              <i className="pi pi-chart-bar text-[9px] font-black" />
                            </button>

                            {/* Obstacles & Challenges / عقبات وتعثرات */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrate(HAPITCS.MAJOR_CLICK);
                                setSelectedStation(st.id);
                                setStumbleReason("");
                                setShowStumbleForm(true);
                              }}
                              className="w-8 h-8 rounded-full bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-110"
                              title="عقبات وتعثرات"
                            >
                              <i className="pi pi-exclamation-triangle text-[9px] font-black" />
                            </button>
                          </div>
                        </>
                      )}

                      <motion.div
                        initial={{ scale: 1 }}
                        whileHover={isUnlocked ? { scale: 1.03, y: -8 } : {}}
                        whileTap={isUnlocked ? { scale: 0.97 } : {}}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        onClick={() => handleStationClick(st.id, isUnlocked, i, st.isPremium)}
                        className={`relative z-10 w-full p-6 rounded-[32px] flex items-center gap-5 cursor-pointer transition-all duration-500 border-2
                          ${isActive 
                            ? "bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 border-blue-400 shadow-[0_20px_40px_rgba(30,58,138,0.3)]" 
                            : isCompleted 
                              ? "bg-white border-blue-100 shadow-xl shadow-blue-500/5 hover:border-blue-300" 
                              : isUnlocked 
                                ? "bg-white border-blue-50 shadow-xl shadow-blue-500/5 hover:border-blue-200" 
                                : "bg-slate-50 border-slate-100 opacity-60 grayscale"}
                        `}
                      >
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform duration-700 ${isActive ? 'rotate-[5deg]' : ''}
                           ${isActive 
                             ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                             : isCompleted 
                               ? 'bg-blue-50 border-blue-100' 
                               : 'bg-slate-50 border-slate-100'}
                         `}>
                           {isLocked ? (
                             <div className="flex flex-col items-center gap-1">
                               <i className={`pi ${isPremiumLocked ? 'pi-star-fill' : 'pi-lock'} ${isNextLocked ? 'text-amber-500 animate-pulse' : isPremiumLocked ? 'text-amber-500' : 'text-slate-300'} text-lg`} />
                             </div>
                           ) : (
                             <i className={`${st.icon && st.icon.startsWith("pi ") ? st.icon : "pi pi-flag-fill"} text-2xl 
                               ${isActive ? 'text-blue-300' : isCompleted ? 'text-blue-600' : 'text-blue-500'}`} 
                             />
                           )}
                         </div>

                        <div className="flex-1 text-right overflow-hidden font-sans">
                          <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                               <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                                 الخطة {i + 1}
                               </span>
                               {st.isPremium && (
                                 <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black border animate-pulse-slow
                                   ${isActive ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                   <i className="pi pi-star-fill text-[7px]" />
                                   بريميوم
                                 </span>
                               )}
                             </div>
                             {isCompleted && <i className="pi pi-check-circle text-blue-600 text-xs text-sans font-black" />}
                          </div>
                          <h3 className={`text-sm font-black truncate mb-1.5 ${isActive ? 'text-white' : 'text-slate-900'}`}>{st.name}</h3>
                          
                          {/* Completed tasks list instead of progress percentages */}
                          {isUnlocked && (
                            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                              {(() => {
                                const stationTasks = tasks.filter(t => t.stationId === st.id);
                                const completedTasks = stationTasks.filter(t => t.isCompleted);
                                if (completedTasks.length > 0) {
                                  return (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-[10px] font-bold ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>المهام المنجزة:</span>
                                      <div className="flex items-center flex-wrap gap-1">
                                        {completedTasks.map((task) => (
                                          <motion.div
                                            key={task.id}
                                            initial={{ scale: 0, rotate: -30 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                            className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400 flex items-center justify-center shadow-[0_1px_3px_rgba(37,99,235,0.3)] animate-[bounce_0.5s_ease-out]"
                                            title={task.title || "مهمة مكتملة"}
                                          >
                                            <i className="pi pi-check text-[10px] text-white font-black" />
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <span className={`text-[10px] font-medium ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>لا توجد مهام مكتملة بعد 🎯</span>
                                );
                              })()}
                            </div>
                          )}
                        </div>

                        {isActive && (
                          <div className="absolute -left-2 -top-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Bottom Ads */}
              <div className="w-full px-2 mt-8">
                {renderAds('bottom')}
              </div>
            </div>
          )}
          </div>

          {/* Integrated Calendar and Tasks */}
          <div id="calendar-section" className="w-full mt-6">
             <CalendarTheme 
                stations={stations}
                unlockedStations={unlockedStations}
                activeStationId={activeStationId}
                stationEnergy={stationEnergy}
                onStationClick={handleStationClick}
                learningDays={user.learningDays || []}
                onAddTaskClick={(date, stationId) => {
                   setCalendarSelectedDate(date);
                   setCalendarSelectedStationId(stationId);
                   setShowCalendarAddTask(true);
                }}
                tasks={tasks}
                toggleTask={toggleTask}
                onArrangeCalendar={handleArrangeCalendar} 
                user={user} 
                onSaveArrangement={handleSaveArrangement} 
                toggleSubStationTask={toggleSubStationTask} 
                onOpenEvaluation={(task) => { 
                   setSelectedTaskForDetails(task); 
                   setTaskDetailsVisible(true); 
                }}
                onOpenReview={setReviewingTask}
                onOpenFlashcards={setFlashcardTask}
                onOpenAnalytics={setSelectedTaskForAnalytics}
                onShowLinks={(stationId) => {
                   setSelectedStation(stationId);
                   setShowLinksPopup(true);
                }}
                onShowNotes={(stationId) => {
                   setActiveNoteStationId(stationId);
                   setShowNotesPopup(true);
                }}
                onShowReflection={(stationId) => {
                   setReflectionForceStationId(stationId);
                   setReflectionActiveTab(0);
                   setReflectionSidebar(true);
                }}
                onShowStumble={(stationId) => {
                   setSelectedStation(stationId);
                   setStumbleReason("");
                   setShowStumbleForm(true);
                }}
                onShowRoutine={() => {
                   setShowRoutinePopup(true);
                }}
                renderTaskThreeDotsMenu={renderTaskThreeDotsMenu}
                toast={toast}
                selectedStation={selectedStation}
                setSelectedStation={setSelectedStation}
             />
          </div>
        </div>
      </div>

      {/* Evaluation Log Sidebar */}
      <EvaluationSidebar 
        visible={evaluationSidebarVisible}
        onHide={() => {
          setEvaluationSidebarVisible(false);
          setSelectedTaskForEvaluation(null);
        }}
        initialSelectedTask={selectedTaskForEvaluation}
        stations={stations || []}
        mainTasks={tasks.filter(t => t.type === 'main')}
        sideTasks={tasks.filter(t => t.type === 'side')}
        subTasks={tasks.filter(t => t.type === 'sub')}
        practicalSubStations={user?.subStations || {}}
        onRewardActivity={rewardActivity}
        onCompleteTask={handleCompleteTask}
        onCompletePracticalTask={completePracticalTask}
        completeTaskAction={completeTask}
      />

      {/* FAB 1 - Gamification Engine Details */}
      <GamificationSidebar
        gamificationSidebar={gamificationSidebar}
        setGamificationSidebar={setGamificationSidebar}
        gamificationActiveTab={gamificationActiveTab}
        setGamificationActiveTab={setGamificationActiveTab}
        createTabHeader={createTabHeader}
        gData={gData}
        buyKeys={buyKeys}
        leaderboard={leaderboard}
        activeStationEnergy={activeStationId ? stationEnergy[activeStationId] || 0 : 0}
      />

      {/* FAB 2 - Compass and Reflection Utilities Sidebar (Tabbed) */}
      <ReflectionSidebar 
        reflectionSidebar={reflectionSidebar}
        setReflectionSidebar={setReflectionSidebar}
        reflectionActiveTab={reflectionActiveTab}
        setReflectionActiveTab={setReflectionActiveTab}
        createTabHeader={createTabHeader}
        gData={gData}
        hasReflectedToday={hasReflectedToday}
        undertakeReflection={undertakeReflection}
        takeRestDay={takeRestDay}
        user={user}
        activeStationId={activeStationId}
        tasks={tasks}
        stations={stations}
        unlockedStations={unlockedStations}
        stationEnergy={stationEnergy}
        forceStationId={reflectionForceStationId}
      />

      
      {flashcardTask && (
        <FlashcardsModal
          visible={!!flashcardTask}
          onHide={() => setFlashcardTask(null)}
          task={flashcardTask}
        />
      )}

      <TaskReviewModal
        visible={reviewingTask !== null && !reviewReflectionVisible && !initialReflectionVisible}
        onHide={() => {
           setReviewingTask(null);
        }}
        task={reviewingTask}
        onFinishReview={() => {
           setReviewReflectionVisible(true);
        }}
        onUndo={(task) => {
          setRevertingTask(task);
        }}
      />

      <TaskDetailsModal
        visible={taskDetailsVisible}
        onHide={() => {
          setTaskDetailsVisible(false);
          setSelectedTaskForDetails(null);
        }}
        taskId={selectedTaskForDetails?.id || null}
        onCompleteTask={(taskId) => {
           const t = tasks.find(x => x.id === taskId);
           if (t) {
              completeTask(t);
           }
        }}
        onOpenReflection={(t) => {
          setReviewingTask(t);
          setInitialReflectionVisible(true);
        }}
      />

      <RevertConfirmModal
        visible={revertingTask !== null}
        onHide={() => setRevertingTask(null)}
        taskTitle={revertingTask?.title || ""}
        onConfirm={() => {
          if (revertingTask) {
            toggleTask(revertingTask.id, true, revertingTask.type);
            if (reviewingTask && reviewingTask.id === revertingTask.id) {
              setReviewingTask(null);
            }
          }
        }}
      />

      <TaskReflectionModal
        visible={initialReflectionVisible}
        onHide={() => {
           setInitialReflectionVisible(false);
           setReviewingTask(null);
        }}
        taskTitle={reviewingTask?.title || ""}
        isReview={false}
        onSubmit={async (data) => {
           const currentTask = reviewingTask;
           if (!currentTask) return;
           try {
              let stationName = 'غير محدد';
              if (currentTask.stationId) {
                const station = await db.stations.get(currentTask.stationId);
                if (station) stationName = station.name;
              }
  
              await db.reflections.add({
                id: safeRandomUUID(),
                taskId: currentTask.id || '',
                taskTitle: currentTask.title || '',
                stationId: currentTask.stationId || '',
                stationName: stationName,
                focus: data.focus,
                mastery: data.mastery,
                strengths: data.strengths || '',
                weaknesses: data.weaknesses || '',
                learnings: data.learnings || '',
                didPractical: !!data.didPractical,
                practicalIssues: data.practicalIssues || '',
                languageLearning: data.languageLearning,
                type: 'initial',
                createdAt: new Date().toISOString()
              });
              
              // Only mark as completed AFTER reflection is saved
              await completeTask(currentTask);

              toastHot.success("تم حفظ تقييم الإنجاز وختم المهمة بنجاح! ✨");
              setInitialReflectionVisible(false);
              setReviewingTask(null);
              vibrate(HAPITCS.SUCCESS);
           } catch (err) {
              console.error(err);
              toastHot.error("فشل حفظ التقييم وختم المهمة");
           }
        }}
      />

      <TaskReflectionModal
        visible={reviewReflectionVisible}
        onHide={() => {
           setReviewReflectionVisible(false);
           setReviewingTask(null);
        }}
        taskTitle={reviewingTask?.title || ""}
        isReview={true}
        onSubmit={async (data) => {
           const currentTask = reviewingTask;
           if (!currentTask) return;
           try {
              let stationName = 'غير محدد';
              if (currentTask.stationId) {
                const station = await db.stations.get(currentTask.stationId);
                if (station) stationName = station.name;
              }
  
              await db.reflections.add({
                id: safeRandomUUID(),
                taskId: currentTask.id || '',
                taskTitle: currentTask.title || '',
                stationId: currentTask.stationId || '',
                stationName: stationName,
                focus: data.focus,
                mastery: data.mastery,
                strengths: data.strengths || '',
                weaknesses: data.weaknesses || '',
                learnings: data.learnings || '',
                didPractical: !!data.didPractical,
                practicalIssues: data.practicalIssues || '',
                languageLearning: data.languageLearning,
                type: 'review',
                createdAt: new Date().toISOString()
              });

              if (user && user.gameData) {
                 await db.userSettings.where('id').equals(user.id).modify(u => {
                    if (u.gameData) {
                       u.gameData.tasksCompletedSinceReview = 0;
                    }
                 });
                 toast.current?.show({
                    severity: "success",
                    summary: "مراجعة مكتملة 🧠",
                    detail: "تم تسجيل انعكاس المهمة بنجاح، ونلت 15 XP كمكافأة!",
                    life: 3000,
                 });
              }
              
              toastHot.success("تم تسجيل تقييم المراجعة! 🔄");
              setReviewReflectionVisible(false);
              setReviewingTask(null);
           } catch (err) {
              console.error(err);
              toastHot.error("فشل حفظ التقييم");
           }
        }}
      />


      {/* Stumble Report Dialog */}
      <Dialog
        visible={showStumbleForm}
        onHide={() => setShowStumbleForm(false)}
        baseZIndex={30000}
        header={
          <div className="flex items-center gap-3 text-red-950 font-black pr-4 text-xl font-sans" dir="rtl">
            <i className="pi pi-exclamation-triangle text-rose-600 border-2 border-rose-950/10 p-1.5 rounded-lg"></i>
            <span className="font-black text-rose-950 tracking-tight">تسجيل تعثر ⚠️</span>
          </div>
        }
        className="w-[94vw] max-w-md font-sans !rounded-[40px] overflow-hidden topmost-dialog"
        closable
        dismissableMask
        maskClassName="backdrop-blur-sm bg-rose-950/10 topmost-mask"
      >
        <div className="space-y-4 pt-2 text-right font-sans" dir="rtl">
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            دون سبب عدم التزامك اليوم بصراحة، هذا يحمي تتابع استمرارك (الـ Streak) من الانكسار ريثما تعود بقوة غداً!
          </p>
          <div className="space-y-1.5">
            <label className="text-xs text-rose-950 font-black">سبب التعثر الرئيسي اليوم؟</label>
            <textarea
              className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-rose-600/10 font-bold text-xs text-slate-800 resize-none transition-all placeholder:text-slate-300"
              placeholder="مثال: ضيق الوقت، كسل مؤقت، كثرة الملهيات..."
              value={stumbleReason}
              onChange={(e) => setStumbleReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveStumble}
              disabled={!stumbleReason.trim()}
              className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-rose-700 disabled:opacity-30 cursor-pointer transition-all border-none"
            >
              حفظ وتأمين السلسلة
            </button>
            <button
              onClick={() => setShowStumbleForm(false)}
              className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl text-xs font-black hover:bg-slate-200 cursor-pointer transition-all border-none"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Dialog>

      {/* Celebratory Unlocked Time Capsule Modal Overlay */}
      <AnimatePresence>
        {celebratedCapsule && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-blue-950/75 backdrop-blur-md z-50 flex items-center justify-center p-6"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-8 z-55 shadow-2xl border border-blue-50 text-center"
              dir="rtl"
            >
              {!isCapsuleBoxOpened ? (
                <div 
                  onClick={() => {
                    vibrate(HAPITCS.COMPLETE);
                    confetti({
                      particleCount: 160,
                      spread: 85,
                      origin: { y: 0.55 },
                      colors: ['#3b82f6', '#f59e0b', '#10b981', '#fbbf24', '#f43f5e', '#a855f7'],
                      zIndex: 30000000
                    });
                    setIsCapsuleBoxOpened(true);
                  }}
                  className="cursor-pointer group relative py-8 px-4 bg-gradient-to-br from-indigo-50/60 to-blue-50/20 rounded-3xl border border-indigo-120/40 shadow-inner flex flex-col items-center justify-center space-y-4 hover:scale-105 active:scale-95 hover:border-amber-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-amber-400/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, -2, 2, -2, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 2.2, 
                      ease: "easeInOut" 
                    }}
                    className="text-7xl select-none filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.2)] group-hover:scale-110 group-hover:rotate-6 transition-all"
                  >
                    📦✨
                  </motion.div>

                  <div className="space-y-1.5 text-center">
                    <h4 className="text-sm font-black text-blue-900 group-hover:text-amber-600 transition-colors">
                      لديك كبسولة زمنية مغلقة من ماضيك!
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium px-4 leading-relaxed">
                      خلال رحلتك السابقة، تركت رسالة وتنبيهات لنفسك المستقبلية لتفتح الآن. انقر على الصندوق لفتحه واستلام رادع الماضي!
                    </p>
                  </div>

                  <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-[10px] shadow-sm select-none transition-all border-none cursor-pointer">
                    انقر لفتح الصندوق 🔑
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-50 shadow-md">
                    <span className="text-4xl animate-bounce">✉️</span>
                  </div>

                  <h3 className="text-2xl font-black text-blue-950 mb-2">
                    لقد فتحت كبسولتك الزمنية!
                  </h3>
                  <p className="text-xs text-emerald-700 font-bold mb-6">
                    وصلت بنجاح للخطة، واحتضنت رسالة ماضيك
                  </p>

                  <div className="max-h-[250px] overflow-y-auto no-scrollbar space-y-3 mb-6">
                    {celebratedCapsule.messages && celebratedCapsule.messages.length > 0 ? (
                      celebratedCapsule.messages.map((item: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-right relative shadow-xs">
                          <span className="absolute top-1 left-3 text-2xl font-black text-indigo-100 select-none">
                            ”
                          </span>
                          <p className="text-blue-950 font-bold text-xs leading-relaxed whitespace-pre-line">
                            {item.message}
                          </p>
                          <p className="text-[9px] text-gray-400 font-bold text-left mt-3">
                            — كُتبت في: {item.writtenAt}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-right relative">
                        <span className="absolute top-2 left-3 text-3xl font-black text-gray-200 select-none">
                          ”
                        </span>
                        <p className="text-blue-950 font-medium text-sm leading-relaxed whitespace-pre-line">
                          {celebratedCapsule.message}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold text-left mt-4">
                          — كُتبت بواسطة نفسك السابقة
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    label="استوعبت الرسالة ونظرت للمستقبل"
                    className="w-full bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 text-white rounded-xl py-3.5 font-bold border-none shadow-lg shadow-blue-950/15 hover:brightness-110 transition-all text-sm cursor-pointer"
                    onClick={closeCelebration}
                  />
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Payment and Subscription Dialog */}
      <Dialog
        visible={showPaymentDialog}
        onHide={() => setShowPaymentDialog(false)}
        header={
          <div className="flex items-center gap-3 text-amber-500 font-extrabold pr-4 text-xl font-sans" dir="rtl">
            <i className="pi pi-shield text-xl bg-amber-50 p-2 rounded-xl border border-amber-100"></i>
            <span>ترقية الرحلة لمستوى بريميوم 💎</span>
          </div>
        }
        className="w-[98vw] max-w-sm font-sans mx-4 !rounded-[40px] overflow-hidden"
        closable
        dismissableMask
        maskClassName="backdrop-blur-xl bg-slate-900/60"
      >
        <div className="p-2 space-y-6 text-right font-sans" dir="rtl">
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 rounded-[36px] text-center text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <span className="inline-block px-4 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-amber-500/30">Premium Station</span>
              <h3 className="text-2xl font-black mb-2 leading-tight">فتحة الخطة: {paymentStation?.name}</h3>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                 <span className="text-4xl font-black text-amber-400">50</span>
                 <span className="text-sm font-bold text-blue-200">جنيه مصري</span>
              </div>
              <p className="text-[11px] text-blue-100/60 mt-4 font-medium leading-relaxed">
                استثمر في عقلك، فالتعلم هو أعظم استثمار! افتح آفاقاً جديدة لنجاحك بتفعيل هذه الخطة الفاخرة. 🚀
              </p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                   <i className="pi pi-phone text-lg" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">تحويل فودافون كاش</p>
                   <p className="text-xl font-black text-emerald-950 tracking-tighter">01282920387</p>
                </div>
             </div>

             <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 bg-[#26A5E4] text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                   <i className="pi pi-send text-lg" />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider">تواصل معنا للتفعيل</p>
                   <p className="text-sm font-bold text-blue-950">أرسل صورة التحويل عبر تيليجرام</p>
                </div>
             </div>
          </div>

          <div className="pt-2">
            <Button
              label="تواصل عبر تيليجرام الآن 📱"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl py-4.5 font-black shadow-xl shadow-blue-900/20 border-none hover:brightness-110 active:scale-95 transition-all text-sm cursor-pointer"
              onClick={() => window.open('https://t.me/AmerAtef', '_blank')}
            />
            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold">بمجرد إرسال الصورة سيتم تفعيل الخطة لك فوراً ✨</p>
          </div>
        </div>
      </Dialog>

      {/* Locked Station Dialog */}
      <Dialog
        visible={lockedDialogVisible}
        onHide={() => setLockedDialogVisible(false)}
        header={
          <div
            className="flex items-center gap-3 text-amber-400 font-black pr-2 text-xl font-sans"
            dir="rtl"
          >
            <i className="pi pi-lock text-amber-400 border border-amber-500/30 p-2 rounded-xl bg-amber-505/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]"></i>
            <span className="font-black text-white tracking-tight">الخطة مغلقة 🔐</span>
          </div>
        }
        className="w-[98vw] max-w-md font-sans mx-4 !rounded-[36px] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(10,25,80,0.5)] bg-[#091024] topmost-dialog"
        closable
        dismissableMask
        maskClassName="backdrop-blur-md bg-slate-950/45"
      >
        <AnimatePresence>
          {lockedDialogVisible && lockedDialogData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-6 px-1 pb-6 pt-4 text-right font-sans" 
              dir="rtl"
            >
            <div className="text-center py-8 px-6 bg-gradient-to-br from-[#0c183e] via-[#091024] to-[#020512] rounded-[28px] border border-blue-500/20 shadow-lg relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />

              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 shadow-inner">
                {lockedDialogData.stationIcon && lockedDialogData.stationIcon.startsWith("pi ") ? (
                  <i className={`${lockedDialogData.stationIcon} text-2xl text-amber-400 filter drop-shadow`}></i>
                ) : (
                  <span className="text-3xl select-none leading-none">
                    {lockedDialogData.stationIcon || "📍"}
                  </span>
                )}
              </div>
              <h3 className="font-black text-lg text-white mt-2">
                {lockedDialogData.stationName}
              </h3>
              <p className="text-[11px] text-blue-200/60 font-medium max-w-[280px] mx-auto mt-2 leading-relaxed">
                هذه الوجهة الفكرية مغلقة حالياً. تابع رحلتك لإنجاز المهام المطلوبة لتفعيلها!
              </p>
            </div>

            <div className="space-y-3.5">
              <h4 className="font-black text-xs text-blue-300 uppercase tracking-wider mb-1 select-none flex items-center gap-1.5">
                <i className="pi pi-cog text-[10px] text-blue-400 animate-spin" style={{ animationDuration: '6s' }}></i>
                <span>متطلبات فك القفل:</span>
              </h4>

              {/* Condition 1: Previous Station must be 130% completed */}
              <div className="flex items-center gap-4 p-4 rounded-[24px] bg-gradient-to-br from-[#0b142d] to-[#040816] border border-white/5 shadow-xs transition duration-250">
                <div className="flex-none w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-sm">
                  {lockedDialogData.prevStationEnergy >= 130 ? (
                    <i className="pi pi-check text-emerald-400 font-extrabold text-sm"></i>
                  ) : (
                    <i className="pi pi-lock text-rose-400 text-xs"></i>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white">
                    إكمال الخطة السابقة بنسبة 130% (الأسواق + التطبيقية)
                  </p>
                  <p className="text-[10px] text-blue-200/50 font-medium mt-0.5 leading-tight">
                    الخطة السابقة: <span className="text-indigo-300 font-bold">{lockedDialogData.prevStationName}</span> ({lockedDialogData.prevStationEnergy}% مكتملة)
                  </p>
                </div>
              </div>

              {/* Condition 2: Focus Keys required count */}
              <div className="flex items-center gap-4 p-4 rounded-[24px] bg-gradient-to-br from-[#0b142d] to-[#040816] border border-white/5 shadow-xs transition duration-250">
                <div className="flex-none w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 shadow-sm">
                  {lockedDialogData.currentKeys >= lockedDialogData.requiredKeys ? (
                    <i className="pi pi-check text-emerald-400 font-extrabold text-sm"></i>
                  ) : (
                    <i className="pi pi-lock text-rose-400 text-xs text-center block"></i>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white">
                    امتلاك عدد كافٍ من مفاتيح التركيز 🔑
                  </p>
                  <p className="text-[10px] text-blue-200/50 font-medium mt-0.5 leading-tight">
                    تحتاج إلى <span className="font-bold text-amber-400">{lockedDialogData.requiredKeys}</span> مفاتيح (لديك حالياً <span className="font-bold text-blue-300">{lockedDialogData.currentKeys}</span> مفاتيح)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                label={lockedDialogData.currentKeys >= 10 && lockedDialogData.prevStationEnergy >= 130 ? "فك قفل الخطة الآن (10 مفاتيح) 🔓" : "استمرار الرحلة والسعي 🎯"}
                className={`w-full ${lockedDialogData.currentKeys >= 10 && lockedDialogData.prevStationEnergy >= 130 ? "bg-gradient-to-r from-emerald-600 to-teal-700 shadow-[0_4px_20px_rgba(16,185,129,0.3)]" : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 shadow-[0_4px_20px_rgba(37,99,235,0.25)]"} text-white rounded-2xl py-3.5 font-black text-xs border-none hover:brightness-110 active:scale-98 transition-all cursor-pointer`}
                onClick={() => {
                  if (lockedDialogData.currentKeys >= 10 && lockedDialogData.prevStationEnergy >= 130) {
                    const st = stations.find(s => s.name === lockedDialogData.stationName);
                    if (st) unlockStation(st.id);
                  } else {
                    setLockedDialogVisible(false);
                  }
                }}
              />
              {lockedDialogData.currentKeys < 10 && (
                <p className="text-[9px] text-center text-rose-400 font-black">عذراً، تحتاج إلى {10 - lockedDialogData.currentKeys} مفاتيح إضافية لفك القفل.</p>
              )}
              {lockedDialogData.prevStationEnergy < 130 && (
                <p className="text-[9px] text-center text-rose-400 font-black">يجب شحن بطارية الخطة السابقة إلى 130% أولاً بالمهام التطبيقية لتطوير السلسلة الفكرية.</p>
              )}
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Learning Resources Popup Dialog */}
      <Dialog
        visible={showLinksPopup}
        onHide={() => setShowLinksPopup(false)}
        header={
          <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans" dir="rtl">
            <i className="pi pi-book text-blue-600 border-2 border-blue-950/10 p-1.5 rounded-lg"></i>
            <span className="font-black text-blue-950 tracking-tight">مصادر التعلم 📚</span>
          </div>
        }
        className="w-[98vw] max-w-2xl font-sans text-xl topmost-dialog"
        closable
        dismissableMask
        baseZIndex={30000}
        maskClassName="topmost-mask"
      >
        <AnimatePresence>
          {showLinksPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-6 pt-4 text-right font-sans" 
              dir="rtl"
            >
              <p className="text-slate-400 font-medium text-xs -mt-2 leading-relaxed">
                الروابط والمصادر التي تعينك على التعلم في هذه الرحلة.
              </p>

                <div className="bg-white border-2 border-slate-100 p-5 rounded-[32px] space-y-4 shadow-inner">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                       <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                       {editingNoteIndex !== null ? 'تعديل الخاطرة المختارة' : 'إضافة خاطرة جديدة للسجل'}
                    </h4>
                    {editingNoteIndex !== null && (
                      <button 
                        onClick={() => {
                          setEditingNoteIndex(null);
                          setEditingStationId(null);
                          setNoteText("");
                        }}
                        className="text-[10px] font-bold text-rose-500 border-none bg-none cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                    placeholder="اسم الموقع أو المصدر (مثال: توثيق ريآكت)"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all"
                  />
                  <input
                    type="url"
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    placeholder="رابط الموقع (https://...)"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all text-left"
                    dir="ltr"
                  />
                  <Button
                    label="إضافة المصدر"
                    icon="pi pi-plus"
                    className="w-full bg-blue-600 text-white rounded-xl py-3 text-xs font-black border-none hover:bg-blue-700 transition-all mt-1"
                    disabled={!newResourceName.trim() || !newResourceUrl.trim()}
                    onClick={async () => {
                      if (!newResourceName.trim() || !newResourceUrl.trim()) return;
                      try {
                        const r = { name: newResourceName.trim(), url: newResourceUrl.trim() };
                        const updatedResources = [...(user.resources || []), r];
                        await db.userSettings.update(user.id, { resources: updatedResources });
                        setNewResourceName("");
                        setNewResourceUrl("");
                        toast.current?.show({
                          severity: "success",
                          summary: "نجاح",
                          detail: "تمت إضافة المصدر بنجاح",
                          life: 3000
                        });
                      } catch (err) {
                        toast.current?.show({
                          severity: "error",
                          summary: "خطأ",
                          detail: "لم نتمكن من حفظ المصدر",
                          life: 3000
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 no-scrollbar pb-4">
                {(!user.attachments?.length && !user.resources?.length) ? (
                  <div className="py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[40px] text-center">
                    <i className="pi pi-link text-4xl text-slate-100 mb-4 block"></i>
                    <p className="text-sm text-slate-400 font-bold italic">لا توجد مصادر مضافة بعد.</p>
                  </div>
                ) : (
                  <>
                    {(user.resources || []).map((res: any, idx: number) => (
                      <motion.div
                        key={`res-${idx}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:border-blue-400 hover:shadow-lg transition-all group"
                      >
                        <div className="flex-1 min-w-0 pr-1">
                          <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 flex-1 overflow-hidden">
                            <div className="w-11 h-11 shrink-0 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <i className="pi pi-external-link text-lg"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-blue-950 truncate mb-0.5">
                                {res.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold tracking-tight truncate" dir="ltr">
                                {res.url.replace(/https?:\/\/(www\.)?/, '')}
                              </p>
                            </div>
                          </a>
                        </div>
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!window.confirm("هل أنت متأكد من حذف هذا المصدر؟")) return;
                            try {
                              const updated = (user.resources || []).filter((_: any, i: number) => i !== idx);
                              await db.userSettings.update(user.id, { resources: updated });
                              toast.current?.show({ 
                                severity: "info", 
                                summary: "تم الحذف", 
                                detail: "تم حذف المصدر بنجاح",
                                life: 3000
                              });
                            } catch (err) {
                              console.error("Delete Resource Error:", err);
                              toast.current?.show({
                                severity: "error",
                                summary: "خطأ",
                                detail: "لم نتمكن من حذف المصدر",
                                life: 3000
                              });
                            }
                          }}
                          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm outline-none cursor-pointer z-10"
                          title="حذف المصدر"
                        >
                          <i className="pi pi-trash text-xs"></i>
                        </button>
                      </motion.div>
                    ))}
                    {(user.attachments || []).map((url: string, idx: number) => (
                      <motion.a
                        key={`att-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-3xl hover:border-blue-400 hover:shadow-lg transition-all group"
                      >
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <i className="pi pi-link text-xl"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-blue-950 truncate mb-1" dir="ltr">
                            {url.replace(/https?:\/\/(www\.)?/, '')}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            رابط المرفقات الأولي
                          </p>
                        </div>
                        <i className="pi pi-chevron-left text-slate-200 group-hover:text-blue-400 transition-colors"></i>
                      </motion.a>
                    ))}
                  </>
                )}
              </div>

              <div className="pt-4">
                <Button
                  label="إغلاق"
                  className="w-full bg-slate-100 text-slate-500 rounded-2xl py-4 font-black border-none hover:bg-slate-200 transition-all cursor-pointer"
                  onClick={() => setShowLinksPopup(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Learning Routine Popup Dialog */}
      <Dialog
        visible={showRoutinePopup}
        onHide={() => setShowRoutinePopup(false)}
        header={
          <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-xl font-sans" dir="rtl">
            <i className="pi pi-calendar text-indigo-600 border-2 border-indigo-950/10 p-1.5 rounded-lg"></i>
            <span className="font-black text-blue-950 tracking-tight">روتين التعلم 📅</span>
          </div>
        }
        className="w-[94vw] max-w-sm font-sans topmost-dialog !rounded-[32px] overflow-hidden shadow-2xl"
        closable
        dismissableMask
        baseZIndex={35000}
        maskClassName="topmost-mask backdrop-blur-md bg-blue-950/20"
      >
        <AnimatePresence>
          {showRoutinePopup && user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="flex flex-col gap-5 py-2 text-right font-sans" 
              dir="rtl"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-blue-950 mb-0.5 tracking-tight">منهجية وروتين التعلم</h2>
                  <p className="text-slate-400 font-bold text-[9px] leading-relaxed">مدة تعهدك اليومي وجدول تكرارك المخصص للحفاظ على تقدمك المتتالي.</p>
                </div>
                {!routineEditMode && (
                  <button 
                    onClick={() => setRoutineEditMode(true)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors border-none cursor-pointer"
                  >
                    <i className="pi pi-pencil text-xs"></i>
                  </button>
                )}
              </div>

              <div className="bg-slate-50/80 p-4 rounded-3xl border border-slate-100 flex flex-col gap-3">
                <label className="text-[11px] font-extrabold text-blue-950 flex items-center gap-2">
                  <span>🕒 الهدف اليومي</span>
                </label>
                
                <div className="flex items-center gap-3">
                  {routineEditMode ? (
                     <input 
                       type="number"
                       min="5"
                       step="5"
                       value={editDailyDuration}
                       onChange={(e) => setEditDailyDuration(Number(e.target.value))}
                       className="w-16 border border-indigo-200 rounded-xl p-2 bg-white text-center font-bold text-xs text-indigo-950 font-mono shadow-xs focus:outline-none focus:border-indigo-500"
                     />
                  ) : (
                     <div className="w-16 border border-slate-200 rounded-xl p-2 bg-white text-center font-bold text-xs text-blue-950 font-mono shadow-xs">
                       {user.dailyDuration || 0}
                     </div>
                  )}
                  <span className="text-[10px] font-bold text-slate-400">دقيقة في اليوم</span>
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-3xl border border-slate-100 flex flex-col gap-3">
                <label className="text-[11px] font-extrabold text-blue-950 flex items-center gap-2">
                  <span>📅 أيام التعلم الأسبوعية</span>
                </label>

                <div className="grid grid-cols-4 gap-1.5 focus:outline-none">
                  {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((dayName, dayVal) => {
                    const isSelected = routineEditMode ? editLearningDays.includes(dayVal) : (user.learningDays || []).includes(dayVal);
                    return (
                      <button
                        key={dayVal}
                        disabled={!routineEditMode}
                        onClick={() => {
                          if (routineEditMode) {
                            if (isSelected) setEditLearningDays(editLearningDays.filter(d => d !== dayVal));
                            else setEditLearningDays([...editLearningDays, dayVal]);
                          }
                        }}
                        className={`py-2 rounded-xl font-bold flex flex-col items-center justify-center transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-800 via-indigo-700 to-indigo-900 border-indigo-700 text-white shadow-sm scale-[1.02]'
                            : 'bg-white border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <span className="text-[10px] font-black">{dayName}</span>
                        <span className={`text-[8px] mt-0.5 block font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-300'}`}>
                          {isSelected ? 'تعلم' : 'راحة'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {routineEditMode ? (
                 <div className="flex gap-2 mt-2">
                   <Button 
                     label="حفظ التعديلات"
                     onClick={async () => {
                        await db.userSettings.update(user.id, {
                          dailyDuration: editDailyDuration,
                          learningDays: editLearningDays
                        });
                        setRoutineEditMode(false);
                        toastHot.success("تم تحديث الفترات بنجاح");
                     }}
                     className="flex-1 bg-indigo-600 text-white rounded-2xl py-3 font-black text-xs border-none hover:bg-indigo-700 transition-all cursor-pointer"
                   />
                   <Button 
                     label="إلغاء"
                     onClick={() => setRoutineEditMode(false)}
                     className="w-16 bg-slate-100 text-slate-500 rounded-2xl py-3 font-black text-[10px] border-none hover:bg-slate-200 transition-all cursor-pointer"
                   />
                 </div>
              ) : (
                 <Button 
                   label="حسناً، فهمت"
                   className="w-full bg-blue-600 text-white rounded-2xl py-3 font-black border-none hover:bg-blue-700 transition-all cursor-pointer text-[11px] mt-1 shadow-lg shadow-blue-600/15"
                   onClick={() => setShowRoutinePopup(false)}
                 />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
      <Dialog
        visible={showExitConfirm}
        onHide={() => setShowExitConfirm(false)}
        header={
          <div
            className="flex items-center gap-2 text-rose-600 font-extrabold pr-4 text-2xl"
            dir="rtl"
          >
            <i className="pi pi-exclamation-triangle text-2xl text-rose-500 animate-bounce"></i>
            <span>تأكيد العودة للخريطة</span>
          </div>
        }
        className="w-[98vw] max-w-2xl font-sans mx-4 text-xl"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-5 pt-2 text-right font-sans" 
              dir="rtl"
            >
              <p className="text-xl font-medium text-gray-800 leading-snug">
                هل تريد إغلاق الخطة والعودة للخريطة؟
                <br />
                <span className="text-base text-rose-500 block mt-3 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">
                  ⚠️ تأكد من حفظ تقدمك بالمهام لمنع فقدانها.
                </span>
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  label="نعم، رجوع للخريطة"
                  icon="pi pi-check"
                  className="flex-1 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white rounded-xl py-3 text-lg font-bold border-none hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  onClick={() => {
                    setShowExitConfirm(false);
                    setSelectedStation(null);
                  }}
                />
                <Button
                  label="تراجع ومتابعة العمل"
                  icon="pi pi-times"
                  className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-lg font-semibold border-none hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                  onClick={() => setShowExitConfirm(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Notes & Journal Popup - Standalone Dialog */}
      <Dialog
        visible={showNotesPopup}
        onHide={() => setShowNotesPopup(false)}
        header={
          <div
            className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans"
            dir="rtl"
          >
            <i className="pi pi-book text-blue-900 border-2 border-blue-950/10 p-1.5 rounded-lg"></i>
            <span>دفتر اليوميات ✍️</span>
          </div>
        }
        className="w-[98vw] max-w-4xl font-sans text-xl"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {showNotesPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-6 pt-4 text-right font-sans" 
              dir="rtl"
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    اختر الخطة لكتابة يومياتك:
                  </label>
                  <select
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-blue-950 focus:ring-2 ring-blue-900/10"
                    value={activeNoteStationId}
                    onChange={(e) => setActiveNoteStationId(e.target.value)}
                  >
                    <option value="" disabled>اختر خطة...</option>
                    {stations
                      .filter((s) => unlockedStations.includes(s.id))
                      .map((st) => (
                        <option key={st.id} value={st.id}>
                           {st.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    افكارك، تأملاتك، وصعوباتك اليوم:
                  </label>
                  <textarea
                    id="notes-textarea-popup"
                    className="w-full h-20 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 ring-blue-900/5 font-medium text-blue-980 font-sans text-sm resize-none transition-all placeholder:text-gray-300"
                    placeholder="اكتب أفكارك اليومية هنا لتذكر العقبات وتوثيق تطور عقليتك..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">الأهمية:</label>
                    <select 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-blue-950 focus:ring-2 ring-blue-900/10"
                      value={notePriority}
                      onChange={(e) => setNotePriority(e.target.value as any)}
                    >
                      <option value="low">منخفضة ⚪</option>
                      <option value="medium">متوسطة 🟡</option>
                      <option value="high">عالية 🔥</option>
                    </select>
                  </div>
                </div>

                  <Button
                    label={editingNoteIndex !== null ? "تحديث التغييرات ✨" : "تثبيت الملاحظات فى السجل ✍️"}
                    icon={editingNoteIndex !== null ? "pi pi-sync" : "pi pi-save"}
                    className={`w-full ${editingNoteIndex !== null ? "bg-emerald-600 shadow-emerald-900/20" : "bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-900 shadow-blue-900/20"} text-white rounded-2xl py-4 font-black shadow-xl border-none hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer text-sm`}
                    onClick={saveJournalNote}
                  />
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                  <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    سجل الذكريات والتطور ⏳
                  </h3>

                  {/* Note Filters */}
                  <div className="flex flex-wrap gap-2">
                    <select 
                      className="p-2 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black outline-none text-blue-900 cursor-pointer"
                      value={noteFilterPriority}
                      onChange={(e) => setNoteFilterPriority(e.target.value)}
                    >
                      <option value="all">كل الأولويات</option>
                      <option value="high">عالية 🔥</option>
                      <option value="medium">متوسطة 🟡</option>
                      <option value="low">منخفضة ⚪</option>
                    </select>
                  </div>
                </div>
                
                <div className="max-h-[350px] overflow-y-auto pr-1 no-scrollbar overflow-x-hidden">
                  <DataView 
                    value={Object.entries(user?.notes || {}).flatMap(([stId, notesArray]: [string, any]) => {
                      const arr = Array.isArray(notesArray) ? notesArray : [notesArray];
                      return arr.map((note, index) => {
                        const isObj = typeof note === 'object';
                        return {
                          stationId: stId,
                          stationName: stations.find(s => s.id === stId)?.name || 'خطة غير معروفة',
                          text: isObj ? note.text : note,
                          date: isObj ? note.date : new Date().toISOString(),
                          priority: isObj ? note.priority || 'medium' : 'medium',
                          index: index
                        };
                      });
                    }).filter(note => {
                      const matchesPriority = noteFilterPriority === 'all' || note.priority === noteFilterPriority;
                      const matchesStation = !activeNoteStationId || note.stationId === activeNoteStationId;
                      return matchesPriority && matchesStation;
                    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
                    layout="grid"
                    itemTemplate={(item) => {
                      const stationIndex = stations.findIndex(s => s.id === item.stationId) + 1;
                      const dateObj = new Date(item.date);
                      const day = dateObj.getDate();
                      const month = dateObj.toLocaleDateString('ar-EG', { month: 'short' });
                      const year = dateObj.getFullYear();

                      return (
                        <div className="p-3 w-full sm:w-1/2">
                          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden h-full flex flex-col group hover:border-blue-300 transition-all shadow-sm">
                            <div className="bg-rose-500 text-white px-4 py-2 flex items-center justify-between border-b-4 border-rose-700">
                              <span className="font-extrabold text-[10px] uppercase tracking-tighter">سجل اليوميات</span>
                            </div>
                            
                            <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
                              <div className="flex flex-col">
                                 <span className="text-[14px] font-black text-rose-600 leading-none">{day}</span>
                                 <span className="text-[8px] font-bold text-slate-400 uppercase">{month} {year}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => { 
                                    setEditingNoteIndex(item.index);
                                    setEditingStationId(item.stationId);
                                    setActiveNoteStationId(item.stationId); 
                                    setNoteText(item.text); 
                                    document.getElementById('notes-textarea-popup')?.focus();
                                  }}
                                  className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all shadow-xs ${
                                    editingNoteIndex === item.index && editingStationId === item.stationId 
                                      ? 'bg-emerald-500 text-white border-emerald-500' 
                                      : 'bg-white border border-slate-200 text-blue-600 hover:bg-blue-50'
                                  }`}
                                >
                                  <i className="pi pi-pencil text-[12px]"></i>
                                </button>
                                <button 
                                  onClick={(e) => {
                                    vibrate(HAPITCS.MAJOR_CLICK);
                                    confirmPopup({
                                      target: e.currentTarget as HTMLElement,
                                      message: 'هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء.',
                                      icon: 'pi pi-exclamation-triangle',
                                      acceptLabel: 'حذف',
                                      rejectLabel: 'إلغاء',
                                      className: 'font-sans text-xs',
                                      acceptClassName: 'bg-rose-500 border-none',
                                      accept: () => deleteJournalNote(item.stationId, item.index)
                                    });
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-xs"
                                >
                                  <i className="pi pi-trash text-[12px]"></i>
                                </button>
                              </div>
                            </div>
                            <div className="p-5 flex-1 bg-gradient-to-b from-white to-slate-50/30">
                              <p className="text-xs text-slate-600 leading-relaxed italic bg-white/50 p-2 rounded-xl border border-slate-100/50">
                                "{item.text}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                    emptyMessage="لا يوجد أية تدوينات مسجلة بعد."
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Time Capsules Popup Dialog */}
      <Dialog
        visible={showCapsulePopup}
        onHide={() => setShowCapsulePopup(false)}
        header={
          <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans" dir="rtl">
            <div className="p-2 bg-indigo-50/80 rounded-xl border border-indigo-200/50">
              <i className="pi pi-send text-indigo-600 text-lg"></i>
            </div>
            <span className="font-black text-blue-950 tracking-tight">قبو كبسولات الزمن الفضائي ☄️</span>
          </div>
        }
        className="w-[98vw] max-w-4xl font-sans text-xl"
        style={{ borderRadius: "28px" }}
        maskClassName="backdrop-blur-md bg-blue-950/25"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {showCapsulePopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="space-y-4 pt-1 text-right font-sans" 
              dir="rtl"
            >
              <p className="text-xs text-slate-500 font-bold leading-relaxed px-2">
                ✉️ الكبسولات الزمنية هي بوابتك للتواصل وعقد العهود مع نفسك المستقبلية. الملاحظات والوصايا التي تعبئها اليوم تشحن مباشرة إلى مدار المحطة التالية وتغلق بالكامل بفك قفل مسارها!
              </p>

              <TabView className="custom-tabview custom-spaced-tabs flex-1" dir="rtl">
                
                {/* Tab 1: Send Capsule */}
                <TabPanel headerTemplate={createTabHeader("pi-send", "كبسولة المستقبل")}>
                  <div className="pt-4 space-y-4">
                    {capsuleTargetStation ? (
                      <div className="bg-gradient-to-br from-indigo-50/60 to-blue-50/25 border border-indigo-100 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-indigo-950 text-sm flex items-center gap-1.5 uppercase tracking-tight">
                            <i className="pi pi-send text-indigo-600"></i> إعداد كبسولة لـ: <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/50">"{capsuleTargetStation.name}"</span>
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full select-none border border-indigo-100/30">مشفرة بالكامل 🔒</span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          رتب وصية نفسك، ضع مخاوفك، توصيات العمل، أو الأخطاء التي تريد تجنبها في خطتك القادمة. ستغلق هذه الرسالة بالكامل وتطير في الفضاء لتسلمها بمجرد الضغط على زر فك وتفعيل خطتك التالية!
                        </p>

                        <textarea
                          className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 font-bold text-xs text-slate-800 resize-none placeholder:text-slate-300 transition-all font-sans"
                          placeholder="رتب عهودك، تنبيهاتك، ومخاوفك التي تخاف تكرارها هنا..."
                          value={capsuleText}
                          onChange={(e) => setCapsuleText(e.target.value)}
                        />

                        <Button
                          label="توقيع وإغلاق الكبسولة للمستقبل 🚀"
                          icon="pi pi-lock"
                          className="w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white rounded-xl font-bold py-3.5 border-none shadow-md shadow-indigo-600/15 hover:brightness-110 active:scale-95 transition-all cursor-pointer text-xs font-sans"
                          onClick={() => {
                            vibrate(HAPITCS.COMPLETE);
                            saveTimeCapsule(capsuleTargetStation.id);
                            setShowCapsulePopup(false);
                          }}
                          disabled={!capsuleText.trim()}
                        />
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <i className="pi pi-verified text-2xl text-blue-500"></i>
                        </div>
                        <p className="text-sm text-slate-700 font-black">🎉 لقد وصلت قمة الخطة النهائية!</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">رحلتك كاملة ولا توجد خطة تالية لشحن كبسولات زمنية لها حالياً.</p>
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Tab 2: Unlocked Previous */}
                <TabPanel headerTemplate={createTabHeader("pi-envelope", "كبسولات مفكوكة")}>
                  <div className="pt-4 space-y-3">
                    {Object.entries(user.timeCapsules || {}).filter(
                      ([_, cap]: any) => (cap as any).isRead,
                    ).length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                        <i className="pi pi-envelope text-3xl text-slate-300 mb-2 block"></i>
                        <p className="text-xs text-slate-400 font-bold">لا يوجد كبسولات زمنية تم فك شفرتها بعد.</p>
                        <p className="text-[10px] text-slate-300 mt-1">تفتح الكبسولة تلقائياً فور فك وضيعة الخطة الموجهة إليها.</p>
                      </div>
                    ) : (
                      <div className="max-h-[350px] overflow-y-auto pr-1 no-scrollbar space-y-4 font-sans">
                        {Object.entries(user.timeCapsules || {}).map(
                          ([sId, cap]: any) => {
                            const stName = stations.find((s) => s.id === sId)?.name || "خطة سابقة";
                            if (!cap.isRead) return null;
                            const messagesList = cap.messages || (cap.message ? [{ message: cap.message, writtenAt: cap.writtenAt }] : []);

                            return (
                              <div
                                key={sId}
                                className="bg-gradient-to-br from-emerald-50/20 to-teal-50/10 border border-emerald-100 rounded-2xl p-5 shadow-xs"
                              >
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-50">
                                  <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                                    🔓 كبسولة محطة: "{stName}"
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold font-mono bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                    تم الفتح
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  {messagesList.map((m: any, mIdx: number) => (
                                    <div key={mIdx} className="bg-white p-3.5 rounded-xl border border-emerald-50/60 shadow-3xs relative">
                                      <span className="absolute top-1 left-3 text-3xl font-black text-emerald-100/40 select-none">”</span>
                                      <p className="text-xs font-semibold text-slate-800 leading-relaxed italic whitespace-pre-line text-right pr-2">
                                        "{m.message}"
                                      </p>
                                      <p className="text-[8px] text-slate-400 font-bold text-left mt-2.5">
                                        ⏱️ كُتبت في: {m.writtenAt}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </TabPanel>

                {/* Tab 3: Sealed Current */}
                <TabPanel headerTemplate={createTabHeader("pi-lock", "كبسولات مغلقة")}>
                  <div className="pt-4 space-y-3">
                    {(() => {
                      const sealedCapsules = Object.entries(user.timeCapsules || {}).filter(
                        ([_, cap]: any) => !(cap as any).isRead && ((cap as any).messages?.length > 0 || (cap as any).message)
                      );

                      if (sealedCapsules.length === 0) {
                        return (
                          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                            <i className="pi pi-lock text-3xl text-slate-300 mb-2 block"></i>
                            <p className="text-xs text-slate-400 font-bold">لا يوجد كبسولات نشطة في الفضاء حالياً.</p>
                            <p className="text-[10px] text-slate-300 mt-1">المسار المؤمن خالٍ من الرسائل المغلقة.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="max-h-[350px] overflow-y-auto pr-1 no-scrollbar space-y-4 font-sans">
                          {sealedCapsules.map(([sId, cap]: any) => {
                            const stName = stations.find((s) => s.id === sId)?.name || "خطة قادمة";
                            const msgCount = cap.messages?.length || 1;

                            return (
                              <div
                                key={sId}
                                className="bg-gradient-to-br from-indigo-50/30 to-blue-50/10 border border-indigo-100/60 rounded-2xl p-5 shadow-xs flex justify-between items-center"
                              >
                                <div>
                                  <h5 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                                    🔒 كبسولة مؤمنة لـ: "{stName}"
                                  </h5>
                                  <p className="text-[10px] text-slate-400 font-bold mt-1">تضم {msgCount} رسالة للـمستقبل - مغلقة ولا يمكن فكها الآن</p>
                                </div>
                                <span className="p-3 bg-indigo-500/10 text-indigo-600 border border-indigo-200/50 rounded-2xl flex items-center justify-center animate-pulse">
                                  <i className="pi pi-lock text-sm"></i>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </TabPanel>

              </TabView>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Task Analytics Dialog */}
      <Dialog
        visible={!!selectedTaskForAnalytics}
        onHide={() => {
          setSelectedTaskForAnalytics(null);
          setTaskReflectionData(null);
        }}
        header={
          <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans" dir="rtl">
            <i className="pi pi-chart-line text-indigo-600 border-2 border-indigo-950/10 p-1.5 rounded-lg"></i>
            <span className="font-black text-blue-950 tracking-tight">تحليلات وإنجازات المهمة 📊</span>
          </div>
        }
        className="w-[98vw] max-w-2xl font-sans"
        closable
        dismissableMask
        maskClassName="backdrop-blur-md bg-blue-950/20"
        baseZIndex={LAYERS.ANALYTICS_DIALOG}
      >
        <AnimatePresence>
          {selectedTaskForAnalytics && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-6 pt-2 text-right font-sans"
              dir="rtl"
            >
              <div className="border bg-slate-50/50 border-slate-100 p-4 rounded-2xl flex flex-col justify-between items-start gap-2">
                <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-extrabold px-2.5 py-1 rounded-full uppercase">المهمة المنجزة</span>
                <h3 className="font-black text-blue-950 text-base leading-snug">{selectedTaskForAnalytics.title}</h3>
              </div>

              <TabView className="mt-4" dir="rtl" pt={{ nav: { className: "flex gap-2 p-1 bg-slate-100 rounded-2xl border-none mb-4" } }}>
                <TabPanel
                  headerTemplate={(options) => (
                    <div
                      className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        options.selected
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={options.onClick}
                    >
                      <i className="pi pi-file-edit ml-1.5"></i>
                      التقييم الأصلي
                    </div>
                  )}
                >
                  <div className="space-y-6">
                    {taskReflectionData && taskReflectionData.length > 0 ? (
                      [taskReflectionData[0]].map((refData: any, idx: number) => (
                        <div key={idx} className="space-y-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative">
                          {/* Type Badge */}
                          <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border-2 border-white">
                             التقييم الأصلي 📝
                          </div>

                          {/* Focus & Mastery metrics row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {/* Focus metric */}
                            <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] text-indigo-950/70 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                <Brain className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> تركيزك أثناء المهمة:
                              </p>
                              <div className="text-3xl font-black text-indigo-700 font-mono">
                                {refData.focus} <span className="text-xs font-bold text-indigo-400">/ 5</span>
                              </div>
                              <div className="flex gap-1 mt-2.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <div
                                    key={s}
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      s <= refData.focus ? "bg-indigo-600" : "bg-indigo-100"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Mastery metric */}
                            <div className="bg-gradient-to-br from-amber-50/70 to-yellow-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] text-amber-950/75 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                <Trophy className="w-3.5 h-3.5 text-amber-600" /> مستوى الإتقان والفهم:
                              </p>
                              <div className="text-3xl font-black text-amber-700 font-mono">
                                {refData.mastery} <span className="text-xs font-bold text-amber-400">/ 10</span>
                              </div>
                              <div className="w-32 h-2 bg-amber-200/50 rounded-full overflow-hidden mt-3 p-0.5">
                                <div
                                  className="h-full bg-amber-600 rounded-full"
                                  style={{ width: `${(refData.mastery / 10) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Date Badge */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 rounded-xl w-fit text-[11px] font-bold border border-slate-100">
                            <i className="pi pi-calendar text-[11px] text-slate-400"></i>
                            <span>تاريخ تسجيل الإنجاز: {new Date(refData.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Strengths */}
                            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-1.5">
                              <p className="text-[10px] text-emerald-800 font-black tracking-widest uppercase flex items-center gap-1.5">
                                <span className="text-emerald-500">💪</span> نقاط القوة المسجلة:
                              </p>
                              <p className="text-xs text-slate-700 bg-white/70 p-3.5 rounded-xl border border-emerald-50/30 font-medium leading-relaxed">
                                {refData.strengths || "لم يتم تدوين نقاط قوة معينة."}
                              </p>
                            </div>

                            {/* Weaknesses */}
                            <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100 flex flex-col gap-1.5">
                              <p className="text-[10px] text-rose-800 font-black tracking-widest uppercase flex items-center gap-1.5">
                                <span className="text-rose-500">🧨</span> مجالات التحسين (الضعف):
                              </p>
                              <p className="text-xs text-slate-700 bg-white/70 p-3.5 rounded-xl border border-rose-50/30 font-medium leading-relaxed">
                                {refData.weaknesses || "لم يتم تدوين مجالات تحسين معينة."}
                              </p>
                            </div>
                          </div>

                          {/* Key Learnings */}
                          <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/60 flex flex-col gap-2">
                            <p className="text-[11px] text-blue-900 font-black tracking-widest uppercase flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-500" /> أهم الخلاصات والأفكار المسجلة:
                            </p>
                            <p className="text-xs text-slate-800 bg-white/80 p-4 rounded-xl border border-blue-50/60 leading-relaxed font-bold">
                              {refData.learnings || "لم تنشأ خلاصات مدونة."}
                            </p>
                          </div>

                          {/* Practical aspect */}
                          {refData.didPractical && (
                            <div className="bg-teal-50/30 p-5 rounded-2xl border border-teal-100 flex flex-col gap-2">
                              <p className="text-[11px] text-teal-900/80 font-black tracking-widest uppercase flex items-center gap-2">
                                <i className="pi pi-verified text-teal-600 text-xs"></i> التطبيق العملي والعوائق:
                              </p>
                              <p className="text-xs text-slate-800 bg-white/80 p-4 rounded-xl border border-teal-50 font-medium leading-relaxed">
                                {refData.practicalIssues || "تم تفعيل وتطبيق المعرفة بسلاسة ودون مشاكل تقنية."}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 px-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-3xs">
                          <i className="pi pi-check text-2xl font-black"></i>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-blue-950 mb-1">المهمة مكتملة بنجاح! 🚀</h4>
                          <p className="text-xs text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                            هذا النشاط مسجل كمكتمل في سجلاتك. لم تدوّن حالتها ضمن البوصلة أو التقييمات التفصيلية للمهارات حتى الآن، لكن تقدمك المتتالي سليم وتأثيرها محتسب في نقاط خبرتك العام.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabPanel>

                <TabPanel
                  headerTemplate={(options) => (
                    <div
                      className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                        options.selected
                          ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                      }`}
                      onClick={options.onClick}
                    >
                      <i className="pi pi-history ml-1.5"></i>
                      المراجعة
                    </div>
                  )}
                >
                  <div className="space-y-6">
                    {taskReflectionData && taskReflectionData.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                              <History className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">عدد المراجعات</p>
                            <p className="text-xl font-black text-slate-800">{taskReflectionData.filter((r:any) => r.type === 'review').length}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center col-span-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">الفجوات الزمنية بين المراجعات (بالأيام)</p>
                            <div className="flex flex-wrap gap-2 mt-1 justify-center">
                              {taskReflectionData.length > 1 ? taskReflectionData.slice(1).map((r: any, i: number) => {
                                const prev = taskReflectionData[i];
                                const diff = new Date(r.createdAt).getTime() - new Date(prev.createdAt).getTime();
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                return (
                                  <span key={i} className="text-xs font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-600 border border-slate-200">
                                    المراجعة {i + 1}: {days > 0 ? `${days} يوم` : 'نفس اليوم'}
                                  </span>
                                );
                              }) : <span className="text-xs font-bold text-slate-300">لا توجد مراجعات لاحتساب الفجوات</span>}
                            </div>
                          </div>
                        </div>

                        {taskReflectionData.length > 1 ? (
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h4 className="text-xs font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-indigo-500" /> مخطط تطور الإتقان والتركيز عبر المراجعات
                            </h4>
                            <div className="h-64 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={taskReflectionData.map((r: any, i: number) => ({
                                  name: i === 0 ? 'الأصلي' : `مراجعة ${i}`,
                                  mastery: r.mastery,
                                  focus: r.focus,
                                  fullDate: new Date(r.createdAt).toLocaleDateString('ar-EG')
                                }))}>
                                  <defs>
                                    <linearGradient id="colorMastery2" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorFocus2" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} 
                                    dy={10}
                                  />
                                  <YAxis 
                                    hide={true}
                                    domain={[0, 10]}
                                  />
                                  <RechartsTooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', direction: 'rtl'}}
                                    itemStyle={{fontSize: '11px', fontWeight: 'bold'}}
                                    labelStyle={{fontSize: '10px', color: '#94a3b8', marginBottom: '4px'}}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="mastery" 
                                    name="الإتقان"
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorMastery2)" 
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="focus" 
                                    name="التركيز"
                                    stroke="#8b5cf6" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorFocus2)" 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 px-4 bg-blue-50/50 border border-blue-100 rounded-3xl">
                            <p className="text-sm font-bold text-blue-900 mb-1">لم تقم بأي مراجعة بعد</p>
                            <p className="text-xs text-blue-700/70">قم بمراجعة هذه المهمة لاحقاً لرؤية الرسم البياني لتطور مستواك وتركيزك.</p>
                          </div>
                        )}

                        {taskReflectionData.length > 1 && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-black text-slate-800 pr-2">تاريخ المراجعات والتقييمات</h4>
                            {taskReflectionData.slice(1).map((refData: any, idx: number) => {
                              const original = taskReflectionData[0];
                              const masteryDiff = refData.mastery - original.mastery;
                              const isMasteryUp = masteryDiff > 0;
                              const isMasterySame = masteryDiff === 0;

                              return (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">المراجعة {idx + 1}</span>
                                      <span className="text-[10px] text-slate-400 font-bold">{new Date(refData.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className={`flex flex-col items-center justify-center p-2 rounded-xl text-center min-w-[70px] ${isMasteryUp ? 'bg-emerald-50 text-emerald-700' : isMasterySame ? 'bg-slate-50 text-slate-600' : 'bg-rose-50 text-rose-700'}`}>
                                        <span className="text-[9px] uppercase font-black opacity-70">الإتقان</span>
                                        <span className="text-sm font-black">{refData.mastery} <span className="text-[10px]">/ 10</span></span>
                                        <span className={`text-[10px] font-black ${isMasteryUp ? 'text-emerald-500' : isMasterySame ? 'text-slate-400' : 'text-rose-500'}`}>
                                          {isMasteryUp ? `+${masteryDiff} تحسن` : isMasterySame ? 'مستقر' : `${Math.abs(masteryDiff)}- تراجع`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {(refData.strengths || refData.weaknesses || refData.learnings) && (
                                    <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-150 flex flex-col gap-3 text-right">
                                      <span className="text-indigo-600 mr-1 block text-[11px] font-black">📋 خلاصة هذه المراجعة:</span>
                                      
                                      {refData.strengths && (
                                        <div className="flex gap-2 items-start text-xs font-semibold text-slate-700 leading-relaxed pr-1">
                                          <span className="text-sm shrink-0">💪</span>
                                          <div>
                                            <span className="font-black text-emerald-700 block text-[10px] uppercase mb-0.5">نقاط القوة والأداء المميز:</span>
                                            <span>{refData.strengths}</span>
                                          </div>
                                        </div>
                                      )}

                                      {refData.weaknesses && (
                                        <div className="flex gap-2 items-start text-xs font-semibold text-slate-700 leading-relaxed pr-1 border-t border-slate-200/50 pt-2.5">
                                          <span className="text-sm shrink-0">🧨</span>
                                          <div>
                                            <span className="font-black text-rose-700 block text-[10px] uppercase mb-0.5">نقاط الضعف (مجالات التطوير):</span>
                                            <span>{refData.weaknesses}</span>
                                          </div>
                                        </div>
                                      )}

                                      {refData.learnings && (
                                        <div className="flex gap-2 items-start text-xs font-semibold text-slate-700 leading-relaxed pr-1 border-t border-slate-200/50 pt-2.5">
                                          <span className="text-sm shrink-0">💡</span>
                                          <div>
                                            <span className="font-black text-blue-700 block text-[10px] uppercase mb-0.5">المهارات والأفكار المكتسبة:</span>
                                            <span>{refData.learnings}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-10 px-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col items-center gap-4">
                        <p className="text-sm font-black text-blue-950">لا توجد بيانات مراجعة</p>
                      </div>
                    )}
                  </div>
                </TabPanel>

                {taskReflectionData && taskReflectionData.some((r: any) => r.languageLearning) && (
                  <TabPanel
                    headerTemplate={(options) => (
                      <div
                        className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all ${
                          options.selected
                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                        }`}
                        onClick={options.onClick}
                      >
                        <Languages className="w-3.5 h-3.5 ml-1.5 inline-block" />
                        تحليل اللغات
                      </div>
                    )}
                  >
                    <div className="space-y-6">
                      {taskReflectionData
                        .filter((r: any) => r.languageLearning)
                        .map((ref: any, idx: number) => (
                          <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-6 relative">
                            <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border-2 border-white">
                                {idx === 0 ? "التقييم اللغوي الأصلي 📝" : `مراجعة لغوية ${idx} 🔄`}
                            </div>

                            {/* Accent Rating */}
                            <div className="bg-gradient-to-br from-amber-50/70 to-yellow-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] text-amber-950/75 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> تقييم اللكنة (Accent):
                              </p>
                              <div className="text-3xl font-black text-amber-700 font-mono">
                                {ref.languageLearning.accentRating} <span className="text-xs font-bold text-amber-400">/ 5</span>
                              </div>
                              <div className="flex gap-1 mt-2.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <div
                                    key={s}
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      s <= ref.languageLearning.accentRating ? "bg-amber-500" : "bg-amber-100"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Sentences */}
                            {ref.languageLearning.sentences && ref.languageLearning.sentences.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-xs font-black text-indigo-900 pr-2 flex items-center gap-2">
                                  <Languages className="w-4 h-4" /> الجمل المكتسبة:
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                  {ref.languageLearning.sentences.map((s: any, sIdx: number) => (
                                    <div key={sIdx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex flex-col gap-1">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-slate-800">{s.text || "تسجيل صوتي 🎙️"}</p>
                                        <div className="flex gap-1">
                                          {s.audioData && (
                                            <Button 
                                              icon={<Play className="w-3.5 h-3.5" />} 
                                              className="p-button-text p-button-rounded text-rose-500 w-8 h-8" 
                                              title="تشغيل المقطع الصوتي"
                                              onClick={() => {
                                                const audio = new Audio(s.audioData);
                                                audio.play();
                                              }}
                                            />
                                          )}
                                          <Button 
                                            icon={<Volume2 className="w-3.5 h-3.5" />} 
                                            className="p-button-text p-button-rounded text-indigo-500 w-8 h-8" 
                                            disabled={!s.text}
                                            onClick={() => {
                                              if (!s.text) return;
                                              window.speechSynthesis.cancel();
                                              const u = new SpeechSynthesisUtterance(s.text);
                                              const isAr = /[\u0600-\u06FF]/.test(s.text);
                                              u.lang = isAr ? 'ar-SA' : 'en-US';
                                              const vcs = window.speechSynthesis.getVoices();
                                              if (vcs.length > 0) {
                                                const preferred = vcs.find(v => 
                                                  (isAr ? v.lang.includes('ar') : v.lang.includes('en')) && v.localService
                                                ) || vcs.find(v => isAr ? v.lang.includes('ar') : v.lang.includes('en'));
                                                if (preferred) u.voice = preferred;
                                              }
                                              window.speechSynthesis.speak(u);
                                            }}
                                          />
                                        </div>
                                      </div>
                                      {s.notes && (
                                        <p className="text-[10px] text-slate-500 font-medium bg-white/60 p-2 rounded-lg border border-slate-50 italic">
                                          {s.notes}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Issues & Notes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="bg-sky-50/30 p-4 rounded-2xl border border-sky-100 flex flex-col gap-1.5">
                                <p className="text-[10px] text-sky-800 font-black tracking-widest uppercase flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-sky-500" /> مشاكل النطق:
                                </p>
                                <p className="text-xs text-slate-700 bg-white/70 p-3.5 rounded-xl border border-sky-50/30 font-medium leading-relaxed">
                                  {ref.languageLearning.pronunciationIssues || "لا يوجد ملاحظات نطق."}
                                </p>
                              </div>
                              <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-1.5">
                                <p className="text-[10px] text-indigo-800 font-black tracking-widest uppercase flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> ملاحظات اللهجة:
                                </p>
                                <p className="text-xs text-slate-700 bg-white/70 p-3.5 rounded-xl border border-indigo-50/30 font-medium leading-relaxed">
                                  {ref.languageLearning.dialectNotes || "لا يوجد ملاحظات لهجة."}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </TabPanel>
                )}
              </TabView>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

      {/* Compass Popup Dialog */}
      <Dialog
        visible={showCompassPopup}
        onHide={() => setShowCompassPopup(false)}
        header={
          <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans" dir="rtl">
            <i className="pi pi-compass text-indigo-600 border-2 border-indigo-950/10 p-1.5 rounded-lg"></i>
            <span className="font-black text-blue-950 tracking-tight">البوصلة والكبسولة 🧭</span>
          </div>
        }
        className="w-[98vw] max-w-4xl font-sans text-xl !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        closable
        dismissableMask
        maskClassName="backdrop-blur-md bg-slate-900/40"
      >
        <AnimatePresence>
          {showCompassPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="text-right font-sans h-[65vh] min-h-[500px] flex flex-col" 
              dir="rtl"
            >
              <TabView className="custom-spaced-tabs flex-1 flex flex-col pt-2" pt={{ nav: { className: "flex gap-2 p-1.5 bg-slate-100 rounded-2xl border-none mb-4 mx-2" }, panelContainer: { className: "p-0 flex-1 overflow-y-auto w-full no-scrollbar" } }}>
                <TabPanel headerTemplate={createTabHeader("pi-compass", "أساسيات البوصلة")}>
                  <div className="space-y-4 px-2 pb-6">
                    <div className="text-slate-500 font-bold text-xs leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span>قمرة القيادة لمعرفة دافعيتك والهدف النهائي ومخاوفك التي تسعى لتخطيها خلال هذه الرحلة.</span>
                      {!isEditingPsychology ? (
                        <button
                          onClick={() => {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setEditReason(user.psychology.reason || "");
                            setEditTarget(user.psychology.target || "");
                            setEditAnxieties(user.psychology.anxieties || "");
                            setIsEditingPsychology(true);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <i className="pi pi-pencil text-[10px]"></i> تعديل البيانات
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={handleSavePsychology}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <i className="pi pi-check text-[10px]"></i> حفظ
                          </button>
                          <button
                            onClick={() => {
                              vibrate(HAPITCS.MAJOR_CLICK);
                              setIsEditingPsychology(false);
                            }}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition-all border-none cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-5 rounded-2xl border border-blue-100/30">
                      <p className="text-[10px] text-indigo-900/60 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                        <i className="pi pi-question-circle text-indigo-600 text-[10px]"></i> السبب (ليه عايز تعمل ده؟):
                      </p>
                      {isEditingPsychology ? (
                        <textarea
                          className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-xs font-bold text-slate-800 resize-none font-sans"
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          placeholder="اكتب الأسباب والدافعية من هذه الرحلة..."
                        />
                      ) : (
                        <p className="text-blue-950 font-bold text-sm bg-white/80 p-3.5 rounded-xl border border-white leading-relaxed text-blue-980 shadow-xs">
                          {user.psychology.reason || "لم يتم تسجيله بعد"}
                        </p>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/50 p-5 rounded-2xl border border-teal-100/30">
                      <p className="text-[10px] text-teal-900/60 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                        <i className="pi pi-flag text-teal-600 text-[10px]"></i> الهدف النهائي:
                      </p>
                      {isEditingPsychology ? (
                        <textarea
                          className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/10 text-xs font-bold text-slate-800 resize-none font-sans"
                          value={editTarget}
                          onChange={(e) => setEditTarget(e.target.value)}
                          placeholder="ما هو الهدف النهائي الذي تطمح للوصول إليه؟..."
                        />
                      ) : (
                        <p className="text-blue-950 font-bold text-sm bg-white/80 p-3.5 rounded-xl border border-white leading-relaxed shadow-xs">
                          {user.psychology.target || "لم يتم تسجيله بعد"}
                        </p>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-rose-50/70 to-red-50/50 p-5 rounded-2xl border border-rose-100/30">
                      <p className="text-[10px] text-rose-900/60 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                        <i className="pi pi-exclamation-triangle text-rose-600 text-[10px]"></i> المخاوف (التي تخاف الوقوع فيها):
                      </p>
                      {isEditingPsychology ? (
                        <textarea
                          className="w-full h-24 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/10 text-xs font-bold text-slate-800 resize-none font-sans"
                          value={editAnxieties}
                          onChange={(e) => setEditAnxieties(e.target.value)}
                          placeholder="ما هي التحديات أو المخاوف التي تود تفاديها؟..."
                        />
                      ) : (
                        <p className="text-red-950 font-bold text-sm bg-white/80 p-3.5 rounded-xl border border-white leading-relaxed text-red-800 shadow-xs">
                          {user.psychology.anxieties || "لم يتم تسجيله بعد"}
                        </p>
                      )}
                    </div>
                  </div>
                </TabPanel>

                <TabPanel headerTemplate={createTabHeader("pi-clock", "الكبسولة الزمنية")}>
                  <div className="px-2 pb-6 space-y-6">

              {/* Time Capsule Integration inside the Compass popup */}
              <div className="border-t border-slate-100 pt-6 mt-6">
                <div className="bg-gradient-to-br from-[#faf8ff] to-[#f4f2ff] p-6 rounded-3xl border border-indigo-100/50 space-y-4">
                  <h4 className="font-black text-indigo-950 text-base flex items-center gap-2">
                    <span className="text-xl">✉️</span> الكبسولة الزمنية لمستقبلك
                  </h4>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                     هنا يمكنك كتابة كبسولات ورسائل وتنبيهات لنفسك المستقبلية. ستُقفل هذه الكبسولات تلقائيًا وتُبث في الفضاء لتُفتح فقط عندما تفتح قفل خطتك القادمة!
                  </p>

                  {/* If there is a next station */}
                  {(() => {
                    const activeIdx = stations.findIndex(s => s.id === activeStationId);
                    const nextSt = (activeIdx !== -1 && activeIdx < stations.length - 1) ? stations[activeIdx + 1] : null;

                    if (nextSt) {
                      const capsuleForNext = user.timeCapsules?.[nextSt.id];
                      const messageList = capsuleForNext?.messages || [];

                      return (
                        <div className="space-y-4">
                          <div className="bg-white/85 p-4 rounded-2xl border border-indigo-50/80 space-y-2.5">
                            <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                              🎯 الكبسولة موجهة للخطة القادمة: <span className="text-blue-600">"{nextSt.name}"</span>
                            </span>
                            
                            <textarea
                              className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 resize-none placeholder:text-slate-300 transition-all font-sans"
                              placeholder="اكتب رسالة لنفسك لتقرأها فور بدء خطة العمل القادمة..."
                              value={compassCapsuleText}
                              onChange={(e) => setCompassCapsuleText(e.target.value)}
                            />

                            <button
                              onClick={async () => {
                                if (!compassCapsuleText.trim()) return;
                                await saveTimeCapsule(nextSt.id, compassCapsuleText);
                                setCompassCapsuleText("");
                              }}
                              disabled={!compassCapsuleText.trim()}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer border-none flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
                            >
                              <i className="pi pi-send"></i> إرسال وشحن الكبسولة الزمنية
                            </button>
                          </div>

                          {/* Render lists of sealed capsules for next plan */}
                          {messageList.length > 0 && (
                            <div className="space-y-3 pt-1">
                              <h5 className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                                🔒 الكبسولات المشحونة والمؤمنة حالياً لهذه الخطة ({messageList.length}):
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {messageList.map((msg: any, mIdx: number) => (
                                  <div key={mIdx} className="bg-slate-50/70 border border-dashed border-slate-200/80 p-3 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-500">
                                    <span className="flex items-center gap-1.5 text-indigo-900/70">
                                      🔒 ملاحظة مؤمنة {mIdx + 1}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {msg.writtenAt}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-4 bg-yellow-50 border border-yellow-101 rounded-2xl text-center">
                          <i className="pi pi-verified text-2xl text-yellow-600 mb-2 block"></i>
                          <p className="text-xs text-yellow-800 font-black">🎉 لقد وصلت للخطة النهائية!</p>
                          <p className="text-[10px] text-yellow-600 mt-1 font-bold">لا توجد خطة قادمة متبقية لإرسال كبسولة زمنية لها.</p>
                        </div>
                      );
                    }
                  })()}

                  {/* Render unlocked capsules from previous plans so they can review their journey */}
                  {(() => {
                    const unlockedCapsules = Object.entries(user.timeCapsules || {}).filter(
                      ([_, cap]: any) => (cap as any).isRead
                    );

                    if (unlockedCapsules.length > 0) {
                      return (
                        <div className="border-t border-slate-100 pb-2 pt-4 space-y-3">
                          <h5 className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                            🔓 كبسولات مفتوحة من محطاتك السابقة ومسجلة بالتاريخ ({unlockedCapsules.length}):
                          </h5>
                          <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-3">
                            {unlockedCapsules.map(([sId, cap]: any) => {
                              const st = stations.find(s => s.id === sId);
                              const msgs = cap.messages || (cap.message ? [{ message: cap.message, writtenAt: cap.writtenAt }] : []);

                              return (
                                <div key={sId} className="bg-emerald-50/30 border border-emerald-100/50 p-4 rounded-2xl space-y-2">
                                  <span className="text-[11px] font-black text-emerald-950 bg-emerald-100/50 px-2.5 py-1 rounded-lg">
                                    🎖️ الخطة: "{st?.name || 'خطة سابقة'}"
                                  </span>
                                  <div className="space-y-2 pt-2">
                                    {msgs.map((item: any, itemIdx: number) => (
                                      <div key={itemIdx} className="bg-white p-3 rounded-xl border border-emerald-50 shadow-3xs flex flex-col gap-1.5">
                                        <p className="text-xs font-bold text-slate-800 leading-relaxed italic text-right">
                                          "{item.message}"
                                        </p>
                                        <span className="text-[9px] text-slate-400 font-bold self-start mt-1">
                                          ⏱️ {item.writtenAt}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabView>
        </motion.div>
      )}
    </AnimatePresence>
  </Dialog>

      {/* Sub Station Creation Modal */}
      <Dialog
        visible={subStationModalVisible}
        onHide={() => {
          setShowSubStationCancelConfirm(true);
        }}
        header={
          <div className="flex items-center gap-3 text-indigo-950 font-black pr-4 text-2xl font-sans" dir="rtl">
            <i className="pi pi-hammer border-2 border-indigo-100 p-1.5 rounded-xl bg-indigo-50"></i>
            <span>تفعيل الخطة التطبيقية 🛠️</span>
          </div>
        }
        className="w-[98vw] max-w-4xl font-sans text-xl"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-xl bg-indigo-950/20"
        closable
        dismissableMask
        blockScroll
      >
        <AnimatePresence>
          {subStationModalVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-6 pt-4 text-right font-sans" 
              dir="rtl"
            >
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50/60 p-5 rounded-2xl border border-indigo-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
                <p className="text-xs text-indigo-950 font-bold leading-relaxed relative z-10">
                  رائع! لقد أتممت الجانب النظري بنجاح. 🏆
                  <br />
                  <span className="text-[11px] font-medium text-indigo-600 block mt-2 opacity-85 leading-relaxed">
                    الآن، حان وقت تفعيل التطبيق العملي لتحويل المعلومات إلى مهارات راسخة. هذا النشاط هو الأساس الحقيقي لدافعيتك.
                  </span>
                </p>
              </div>

              <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-100">
                <style>{`
                  .force-blue-gradient {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%) !important;
                    color: white !important;
                    border: none !important;
                    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3) !important;
                  }
                  .force-blue-gradient:hover {
                    transform: scale(1.1) !important;
                    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4) !important;
                  }
                `}</style>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-indigo-950/60 uppercase tracking-widest block pr-1">
                    ⏱️ المدة الزمنية المتوقعة للتطبيق (دقيقة):
                  </label>
                  <div className="flex items-center gap-4 bg-white p-2.5 rounded-[20px] border border-indigo-100/60 shadow-xs">
                    <button 
                      type="button"
                      onClick={() => setSubStationDuration(prev => Math.max(5, prev - 5))}
                      className="w-10 h-10 rounded-xl bg-indigo-50/85 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 active:scale-90 transition-all border-none cursor-pointer"
                    >
                      <i className="pi pi-minus font-bold text-xs"></i>
                    </button>
                    <input 
                      type="number" 
                      className="flex-1 bg-transparent border-none outline-none font-black text-2xl text-indigo-900 text-center animate-none"
                      value={subStationDuration}
                      onChange={(e) => setSubStationDuration(parseInt(e.target.value) || 0)}
                    />
                    <button 
                      type="button"
                      onClick={() => setSubStationDuration(prev => prev + 5)}
                      className="w-10 h-10 rounded-xl bg-indigo-50/85 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 active:scale-90 transition-all border-none cursor-pointer"
                    >
                      <i className="pi pi-plus font-bold text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* Practical Tasks Input & List */}
                <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-250/20">
                  <label className="text-[10px] font-black text-indigo-950/60 uppercase tracking-widest pr-1">
                    📝 إضافة مهمة تطبيقية (المهام الحالية: {subStationTasks.length}):
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="اكتب مهمة تطبيقية جديدة هنا..."
                      className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-blue-950 focus:border-indigo-400 transition-all font-sans placeholder:text-slate-300"
                      value={newSubTaskTitle}
                      onChange={(e) => setNewSubTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubStationTask())}
                    />
                    <button 
                      type="button"
                      onClick={addSubStationTask}
                      disabled={!newSubTaskTitle.trim()}
                      className="px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all text-xs border-none cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      إضافة
                    </button>
                  </div>
                </div>

                {subStationTasks.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pt-1">
                    {subStationTasks.map((t, idx) => (
                      <div 
                        key={t.id} 
                        className="bg-white border border-slate-100/90 rounded-xl p-3 flex justify-between items-center shadow-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-1 text-right flex-1">
                          <span className="w-5 h-5 rounded-md bg-indigo-100/50 text-indigo-700 flex items-center justify-center font-black text-[10px] shrink-0 border border-indigo-100/30">
                            {idx + 1}
                          </span>
                          <p className="font-bold text-xs text-blue-950 leading-relaxed truncate flex-1">{t.title}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeSubStationTask(t.id)}
                          className="w-8 h-8 rounded-xl force-blue-gradient transition-all flex items-center justify-center cursor-pointer shrink-0"
                          title="حذف المهمة"
                        >
                          <i className="pi pi-trash text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 bg-white border border-dashed border-slate-200/60 rounded-xl text-center">
                    <p className="text-[10px] text-slate-450 font-bold px-4 leading-relaxed">لا توجد مهام تطبيقية، يرجى إضافة مهمة واحدة على الأقل لتفعيل التطبيق العملي.</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  label="تفعيل التطبيق 🚀"
                  className="w-full bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-900 text-white rounded-2xl py-4.5 font-black shadow-lg shadow-indigo-950/15 border-none hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans text-sm"
                  onClick={createSubStation}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>


      {/* Confirmation Dialog on Applied Task Close */}
      <Dialog
        visible={showSubStationCancelConfirm}
        onHide={() => setShowSubStationCancelConfirm(false)}
        header={
          <div
            className="flex items-center gap-2 text-indigo-950 font-extrabold pr-4 text-2xl"
            dir="rtl"
          >
            <i className="pi pi-question-circle text-2xl text-indigo-600 animate-pulse"></i>
            <span>تأكيد الخروج من إعداد الخطة</span>
          </div>
        }
        className="w-[98vw] max-w-2xl font-sans mx-4 text-xl"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {showSubStationCancelConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-5 pt-2 text-right font-sans" 
              dir="rtl"
            >
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  هل تود الخروج من إعداد الخطة التطبيقية الحالية؟ تقدمك وخياراتك لن تضيع، حيث يمكنك تفعيل وإكمال الخطة لاحقاً متى أردت ذلك.
                  <br />
                  <span className="text-[11px] text-indigo-600 block mt-3 font-semibold bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100/35 leading-relaxed">
                    ℹ️ سيتم حفظ مسودة المهام التطبيقية التي أضفتها لحين تفعيل المسار.
                  </span>
                </p>
              <div className="flex gap-2 pt-2">
                <Button
                  label="نعم، خروج وحفظ المسودة"
                  icon="pi pi-check"
                  className="flex-1 bg-gradient-to-r from-indigo-700 to-indigo-900 text-white rounded-xl py-3 text-xs font-bold border-none hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  onClick={() => {
                    setShowSubStationCancelConfirm(false);
                    setSubStationModalVisible(false);
                    setSubStationTargetId(null);
                    setSubStationTasks([]);
                    setSubStationDuration(30);
                  }}
                />
                <Button
                  label="إكمال الإعداد الآن"
                  icon="pi pi-times"
                  className="flex-1 bg-slate-100 text-slate-700 rounded-xl py-3 text-xs font-semibold border border-slate-200/50 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                  onClick={() => setShowSubStationCancelConfirm(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
      
      {/* Zoom Controls code block completely removed */}

      {/* Main Map Side Actions (Compass & Rewards) - Only visible when NO station is selected to keep map clean? Or always visible? User said return them to station... */}
      <AnimatePresence>
        {!selectedStation && (
          <>
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed bottom-10 left-8 z-40 pointer-events-auto"
            >
              <button
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setShowCompassPopup(true);
                }}
                title="بوصلة الوضوح"
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-sm border border-white/40 ring-2 ring-purple-500/20 cursor-pointer"
              >
                <i className="pi pi-compass text-lg"></i>
              </button>
            </motion.div>

            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed bottom-10 right-8 z-40 pointer-events-auto"
            >
              <button
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  setGamificationSidebar(true);
                }}
                title="المحرك والجوائز"
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-sm border border-white/40 ring-2 ring-orange-500/20 cursor-pointer"
              >
                <i className="pi pi-trophy text-lg"></i>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Luxurious Mission Control Dialog */}
      <Dialog
        visible={viewMode === 'tasks' && !!selectedStation}
        onHide={() => {
          setSelectedStation(null);
          setViewMode('journey');
        }}
        header={
          <div className="flex items-center gap-3 text-white pr-4" dir="rtl">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-400/20 shadow-inner">
               <Rocket className="w-5 h-5 text-blue-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight">{stations.find(s => s.id === selectedStation)?.name}</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">غرفة التحكم في العمليات</span>
            </div>
          </div>
        }
        className="w-[95vw] max-w-4xl font-sans rounded-[32px] overflow-hidden border-none shadow-[0_0_80px_rgba(30,58,138,0.5)] bg-slate-950"
        contentClassName="no-scrollbar"
        headerStyle={{ background: 'linear-gradient(to right, #020617, #0f172a)', borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '24px' }}
        contentStyle={{ background: 'linear-gradient(to bottom, #0f172a, #020617)', color: 'white', padding: '0' }}
        dismissableMask
        closable
      >
        <div className="flex flex-col md:flex-row min-h-[500px] h-[75vh]" dir="rtl">
          {/* Main Tasks Tree (Collapsible) */}
          <div className="flex-1 p-6 overflow-y-auto no-scrollbar border-l border-white/5">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                   <span className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                   المهام الرئيسية والهيكل التنفيذي
                </h3>
             </div>
             
             <Tree 
                value={filteredMainTasksNodes} 
                className="bg-transparent border-none p-0 custom-tree-animation"
                nodeTemplate={treeNodeTemplate}
                expandedKeys={expandedKeys}
                onToggle={(e) => setExpandedKeys(e.value)}
                filter
                filterBy="label"
                filterPlaceholder="ابحث في المهام..."
                contentClassName="p-2 hover:bg-white/5 rounded-xl transition-all"
             />
          </div>

          {/* Side Tasks Panel */}
          <div className="w-full md:w-80 p-6 bg-black/30 backdrop-blur-md overflow-y-auto no-scrollbar">
             <h3 className="text-sm font-black text-indigo-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
                <i className="pi pi-star-fill text-xs" />
                المبادرات الجانبية
             </h3>
             
             {filteredSideTasks.length > 0 ? (
               <div className="space-y-3">
                  {filteredSideTasks.map((t: any) => (
                    <div 
                      key={t.id}
                      onClick={() => {
                        if (t.isCompleted) setReviewingTask(t);
                        else toggleTask(t.id, t.isCompleted, t.type);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group
                        ${t.isCompleted 
                          ? 'bg-indigo-950/20 border-indigo-500/30 opacity-60' 
                          : 'bg-white/5 border-white/10 hover:border-indigo-500/40 hover:bg-white/10 shadow-lg'}
                      `}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all
                             ${t.isCompleted ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-white/10 text-indigo-400'}
                          `}>
                             {t.isCompleted ? <i className="pi pi-check text-[10px]" /> : <i className="pi pi-star text-[10px]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className={`text-xs font-bold truncate ${t.isCompleted ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                                {t.title}
                             </p>
                             <p className="text-[10px] text-indigo-400/60 mt-0.5 font-black uppercase tracking-widest">SIDE MISSION</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                  <i className="pi pi-inbox text-2xl mb-2 text-indigo-300" />
                  <p className="text-xs font-bold text-indigo-200">لا توجد مهام إضافية</p>
               </div>
             )}
          </div>
        </div>
      </Dialog>

      {/* Unfreeze confirmation dialog */}
      <Dialog
        visible={showUnfreezeConfirm}
        onHide={() => setShowUnfreezeConfirm(false)}
        baseZIndex={35000}
        header={
          <div className="flex items-center gap-3 text-emerald-600 font-bold pr-4 text-xl font-sans" dir="rtl">
            🔥 تفعيل السعي
          </div>
        }
        className="w-[98vw] max-w-sm font-sans mx-4 text-xl shadow-2xl"
        closable
        dismissableMask
      >
        <div className="space-y-6 pt-2 text-right font-sans" dir="rtl">
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            هل أنت متأكد من إلغاء تجميد هذه الرحلة واستعادة طاقتها وسعيك الإيجابي مجدداً؟
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              label="تراجع"
              className="p-button-text text-gray-500 font-bold text-xs cursor-pointer hover:bg-slate-50 rounded-xl px-4 py-2 border-none bg-transparent"
              onClick={() => setShowUnfreezeConfirm(false)}
            />
            <Button
              label="نعم، إلغاء التجميد 🔥"
              className="bg-emerald-600 hover:bg-emerald-700 hover:brightness-110 border-none text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-all"
              onClick={async () => {
                if (user) {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStr = yesterday.toDateString();
                  
                  await db.userSettings.update(user.id, {
                    isFrozen: false,
                    gameData: {
                      ...gData,
                      lastReflectionDate: yesterdayStr
                    }
                  });
                  setShowUnfreezeConfirm(false);
                  toastHot.success("تم إلغاء التجميد بنجاح! طاقة السعي عادت لرحلتك. 🔥");
                }
              }}
            />
          </div>
        </div>
      </Dialog>

      {/* Calendar Add Task Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-2 text-blue-950 font-black pr-4 text-sm font-sans" dir="rtl">
            ➕ إضافة مهمة ليوم {calendarSelectedDate ? format(calendarSelectedDate, 'EEEE d MMMM', { locale: ar }) : ''}
          </div>
        }
        visible={showCalendarAddTask}
        onHide={() => setShowCalendarAddTask(false)}
        className="w-[90vw] max-w-sm font-sans mx-4 shadow-2xl"
        closable
        dismissableMask
      >
        <div className="p-4 flex flex-col gap-4 text-right font-sans" dir="rtl">
           <p className="text-sm font-bold text-slate-500">سيتم إضافة هذه المهمة للخطة النشطة حالياً: <span className="font-black text-blue-900 leading-snug">"{activeStation?.name}"</span></p>
           <input 
             id="calendar-task-input"
             autoFocus
             className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/10 text-sm font-bold text-slate-800 placeholder-slate-300 transition-all font-sans"
             placeholder="ما هي المهمة التي تود إنجازها؟"
             onKeyDown={(e) => {
               if (e.key === 'Enter') handleCalendarAddTask((e.target as HTMLInputElement).value);
             }}
           />
           <Button 
             label="إضافة المهمة" 
             className="w-full bg-blue-900 border-none rounded-2xl py-4 font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-white cursor-pointer"
             onClick={() => {
               const input = document.getElementById('calendar-task-input') as HTMLInputElement;
               if (input) handleCalendarAddTask(input.value);
             }}
           />
        </div>
      </Dialog>

      {/* Add Plan Card Dialog */}
      <Dialog
        visible={isAddStationVisible}
        onHide={() => setIsAddStationVisible(false)}
        header={
          <div className="flex items-center gap-2 text-indigo-950 font-black pr-4 text-xs font-sans" dir="rtl">
            <i className="pi pi-plus text-indigo-600 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100"></i>
            <span>إضافة خطة جديدة 🚀</span>
          </div>
        }
        className="w-[96vw] max-w-sm !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        closable
        dismissableMask
      >
        <div className="p-4 flex flex-col gap-4 text-right font-sans" dir="rtl">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 font-sans font-sans">اسم الخطة المستهدفة *</label>
            <input 
              value={stationFormName}
              onChange={(e) => setStationFormName(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all font-sans"
              placeholder="مثال: أسواق الطاقة المتجددة"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 font-sans">وصف موجز للخطة</label>
            <textarea 
              value={stationFormDescription}
              onChange={(e) => setStationFormDescription(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all font-sans min-h-[80px]"
              placeholder="تفاصيل الهدف الأساسي، السعي، أو المنهجية المتبعة..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 font-sans">التاريخ المستهدف</label>
              <input 
                type="date"
                value={stationFormDate}
                onChange={(e) => setStationFormDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 transition-all select-none font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] font-black text-slate-400 font-sans">رمز الأيقونة</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-2xl p-2 h-[46px] justify-between font-sans">
                <i className={`${stationFormIcon} text-indigo-600 text-sm`} />
                <span className="text-[9px] font-black text-slate-400 truncate font-sans">{stationFormIcon.replace('pi ', '')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-2xl font-sans">
            <label className="text-[9px] font-black text-indigo-950 uppercase tracking-tight mb-1 font-sans">اختر أيقونة من الاختيارات المتاحة:</label>
            <div className="flex flex-wrap gap-2 justify-center py-1">
              {ICON_PRESETS.map((icon) => (
                <button
                  key={`create-station-${icon}`}
                  type="button"
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setStationFormIcon(icon);
                  }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${stationFormIcon === icon ? 'bg-indigo-600 text-white scale-110 shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}
                >
                  <i className={`${icon} text-xs`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3.5 rounded-2xl font-sans">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-700">خطة بريميوم (بفلوس)؟ 💎</span>
              <span className="text-[8px] text-slate-400 font-bold">سيتم قفلها للمشتركين المجانيين</span>
            </div>
            <button
               type="button"
               onClick={() => {
                 vibrate(HAPITCS.MINOR_CLICK);
                 setStationFormIsPremium(!stationFormIsPremium);
               }}
               className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${stationFormIsPremium ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
            >
               <motion.div 
                 layout
                 className="w-4 h-4 bg-white rounded-full shadow-sm"
               />
            </button>
          </div>

          {!stationFormIsPremium && (
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] font-black text-slate-400 font-sans">رسالة إتمام المحطة المجانية 🎁</label>
              <textarea 
                value={stationFormCompletionMessage}
                onChange={(e) => setStationFormCompletionMessage(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all font-sans min-h-[60px]"
                placeholder="رسالة تظهر للمستخدم المجاني عند إنهاء المحطة (مثلاً لتشجيعه على البريميوم)..."
              />
            </div>
          )}

          <div className="border-t border-slate-100 my-1 font-sans" />

          <Button 
            label="حفظ وإضافة الخطة" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-650 border-none rounded-2xl py-3.5 font-black text-xs shadow-lg shadow-indigo-900/10 active:scale-95 transition-all text-white cursor-pointer"
            onClick={handleCreateStation}
          />
        </div>
      </Dialog>

      {/* Edit Plan Card Dialog */}
      <Dialog
        visible={isEditStationVisible}
        onHide={() => {
          setIsEditStationVisible(false);
          setStationToEdit(null);
        }}
        header={
          <div className="flex items-center gap-2 text-indigo-950 font-black pr-4 text-xs font-sans" dir="rtl">
            <i className="pi pi-pencil text-indigo-600 bg-indigo-50 p-1.5 rounded-lg border border-indigo-100"></i>
            <span>تعديل بيانات الخطة ✏️</span>
          </div>
        }
        className="w-[96vw] max-w-sm !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        closable
        dismissableMask
      >
        <div className="p-4 flex flex-col gap-4 text-right font-sans" dir="rtl">
          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10px] font-black text-slate-400 font-sans">اسم الخطة المستهدفة *</label>
            <input 
              value={stationFormName}
              onChange={(e) => setStationFormName(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all font-sans"
              placeholder="مثال: أسواق الطاقة المتجددة"
            />
          </div>

          <div className="flex flex-col gap-1.5 font-sans">
            <label className="text-[10px] font-black text-slate-400 font-sans">وصف موجز للخطة</label>
            <textarea 
              value={stationFormDescription}
              onChange={(e) => setStationFormDescription(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all font-sans min-h-[80px]"
              placeholder="تفاصيل الهدف الأساسي، السعي، أو المنهجية المتبعة..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] font-black text-slate-400 font-sans">التاريخ المستهدف</label>
              <input 
                type="date"
                value={stationFormDate}
                onChange={(e) => setStationFormDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 transition-all select-none font-sans"
              />
            </div>

            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] font-black text-slate-400 font-sans">رمز الأيقونة</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-2xl p-2 h-[46px] justify-between font-sans">
                <i className={`${stationFormIcon} text-indigo-600 text-sm`} />
                <span className="text-[9px] font-black text-slate-400 truncate font-sans">{stationFormIcon.replace('pi ', '')}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-100 p-3 rounded-2xl font-sans">
            <label className="text-[9px] font-black text-indigo-950 uppercase tracking-tight mb-1 font-sans">اختر أيقونة من الاختيارات المتاحة:</label>
            <div className="flex flex-wrap gap-2 justify-center py-1">
              {ICON_PRESETS.map((icon) => (
                <button
                  key={`edit-station-${icon}`}
                  type="button"
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setStationFormIcon(icon);
                  }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${stationFormIcon === icon ? 'bg-indigo-600 text-white scale-110 shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                  <i className={`${icon} text-xs`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3.5 rounded-2xl font-sans">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-700">خطة بريميوم (بفلوس)؟ 💎</span>
              <span className="text-[8px] text-slate-400 font-bold">سيتم قفلها للمشتركين المجانيين</span>
            </div>
            <button
               type="button"
               onClick={() => {
                 vibrate(HAPITCS.MINOR_CLICK);
                 setStationFormIsPremium(!stationFormIsPremium);
               }}
               className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${stationFormIsPremium ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'}`}
            >
               <motion.div 
                 layout
                 className="w-4 h-4 bg-white rounded-full shadow-sm"
               />
            </button>
          </div>

          {!stationFormIsPremium && (
            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] font-black text-slate-400 font-sans">رسالة إتمام المحطة المجانية 🎁</label>
              <textarea 
                value={stationFormCompletionMessage}
                onChange={(e) => setStationFormCompletionMessage(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:ring-2 ring-indigo-500/10 text-xs font-bold text-slate-800 placeholder-slate-300 transition-all font-sans min-h-[60px]"
                placeholder="رسالة تظهر للمستخدم المجاني عند إنهاء المحطة (مثلاً لتشجيعه على البريميوم)..."
              />
            </div>
          )}

          <div className="border-t border-slate-100 my-1 font-sans" />

          <Button 
            label="تحديث وحفظ التغييرات" 
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 border-none rounded-2xl py-3.5 font-black text-xs shadow-lg shadow-teal-900/10 active:scale-95 transition-all text-white cursor-pointer font-sans"
            onClick={handleUpdateStation}
          />
        </div>
      </Dialog>

      {/* Delete Plan Card Confirm Dialog */}
      <Dialog
        visible={isDeleteConfirmVisible}
        onHide={() => {
          setIsDeleteConfirmVisible(false);
          setStationToDelete(null);
        }}
        header={
          <div className="flex items-center gap-2 text-rose-950 font-black pr-4 text-xs font-sans" dir="rtl">
            <i className="pi pi-exclamation-triangle text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-100 animate-bounce"></i>
            <span>تأكيد حذف الخطة نهائياً ⚠️</span>
          </div>
        }
        className="w-[96vw] max-w-sm !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        closable
        dismissableMask
      >
        <div className="p-4 flex flex-col gap-4 text-right font-sans" dir="rtl">
          <p className="text-xs font-black text-slate-700 leading-relaxed font-sans">
            هل أنت متأكد من رغبتك في حذف الخطة <span className="text-rose-600 font-extrabold font-sans">"{stationToDelete?.name}"</span> نهائياً؟
          </p>
          <p className="text-[10px] text-rose-500 font-bold bg-rose-50/50 border border-rose-100 p-3 rounded-2xl font-sans font-sans">
            تنبيه: سيؤدي هذا الإجراء لحذف الخطة وكافة المهام والكبسولات المرتبطة بها بشكل نهائي وغير قابل للاستعادة!
          </p>
          
          <div className="border-t border-slate-100 my-1 font-sans font-sans font-sans" />

          <div className="grid grid-cols-2 gap-3.5 pt-1 font-sans font-sans font-sans">
            <Button 
              label="نعم، حذف نهائياً" 
              className="bg-rose-600 hover:bg-rose-700 border-none rounded-2xl py-3.5 text-white font-black text-xs cursor-pointer shadow-md shadow-rose-900/10 transition-all font-sans"
              onClick={handleDeleteStation}
            />
            <Button 
              label="تراجع وإلغاء" 
              className="bg-slate-100 hover:bg-slate-200 border-none rounded-2xl py-3.5 text-slate-700 font-black text-xs cursor-pointer shadow-3xs transition-all font-sans"
              onClick={() => {
                setIsDeleteConfirmVisible(false);
                setStationToDelete(null);
              }}
            />
          </div>
        </div>
      </Dialog>

      {/* Complaints and Rating (قيمنا وشكاوى) Dialog */}
      <Dialog
        visible={showFeedbackModal}
        onHide={() => setShowFeedbackModal(false)}
        header={
          <div className="flex items-center gap-2 text-rose-950 font-black pr-4 text-xs font-sans" dir="rtl">
            <i className="pi pi-heart-fill text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-100"></i>
            <span>تعليقاتك تهمنا ❤️ (شكاوى واقتراحات)</span>
          </div>
        }
        className="w-[96vw] max-w-sm !rounded-[32px] overflow-hidden"
        style={{ borderRadius: '32px' }}
        maskClassName="backdrop-blur-sm bg-slate-900/40"
        closable
        dismissableMask
      >
        <div className="p-4 flex flex-col gap-5 text-right font-sans" dir="rtl">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">ما هو نوع تعليقك؟</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rating', label: 'تقييم ⭐️', color: 'indigo' },
                { id: 'complaint', label: 'شكوى ⚠️', color: 'rose' },
                { id: 'suggestion', label: 'اقتراح 💡', color: 'emerald' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { vibrate(HAPITCS.MINOR_CLICK); setFeedbackType(t.id as any); }}
                  className={`p-2.5 rounded-xl border-2 text-[10px] font-black transition-all ${feedbackType === t.id ? `bg-${t.color}-600 border-${t.color}-600 text-white shadow-lg` : `bg-white border-slate-100 text-slate-400 hover:border-${t.color}-200`}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">تقييمك للتجربة</label>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => { vibrate(HAPITCS.MINOR_CLICK); setFeedbackRating(star); }}
                  className={`text-2xl transition-all ${feedbackRating >= star ? 'text-amber-400 scale-110 drop-shadow-sm' : 'text-slate-200 grayscale opacity-50'}`}
                >
                  <i className="pi pi-star-fill"></i>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">اكتب تعليقك أو شكواك هنا</label>
            <textarea
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="اكتب لنا أي شيء يدور في خاطرك، نعدك بالاستجابة والتحسين المستمر..."
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-800 placeholder-slate-300 outline-none focus:ring-2 ring-rose-500/10 min-h-[100px] transition-all resize-none"
            />
          </div>

          <Button
            label="إرسال التعليق الآن 🚀"
            className="w-full bg-gradient-to-r from-rose-600 to-indigo-650 border-none rounded-2xl py-4 font-black text-xs shadow-xl shadow-indigo-900/10 active:scale-95 transition-all text-white cursor-pointer"
            onClick={handleSubmitFeedback}
          />
        </div>
      </Dialog>
      <Dialog
        visible={showCompletionModal}
        onHide={() => setShowCompletionModal(false)}
        className="w-[96vw] max-w-sm !rounded-[40px] overflow-hidden"
        dismissableMask
        closable
        showHeader={false}
      >
        <div className="relative p-8 text-center space-y-6 bg-slate-900 overflow-hidden" dir="rtl">
           {/* Animated Background Decor */}
           <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px]" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500 rounded-full blur-[80px]" />
           </div>

           <div className="relative space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/30 rotate-3 text-white">
                 <Shield className="w-10 h-10" />
              </div>
              
              <h2 className="text-2xl font-black text-white leading-tight">
                 {completionModalData?.title}
              </h2>
           </div>

           <div className="p-6 bg-white/5 border border-white/10 rounded-[32px] backdrop-blur-md">
              <p className="text-sm font-bold text-slate-300 leading-relaxed">
                 {completionModalData?.message}
              </p>
           </div>

           <div className="space-y-3">
              <Button 
                label="فهمت، استكمال الرحلة ✨" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 border-none rounded-2xl py-4 font-black shadow-lg shadow-indigo-900/20 active:scale-95 transition-all text-white cursor-pointer text-xs"
                onClick={() => {
                  vibrate(HAPITCS.MINOR_CLICK);
                  setShowCompletionModal(false);
                }}
              />
              <p className="text-[10px] text-slate-500 font-bold">شكراً لالتزامك بالتطوير الذاتي!</p>
           </div>
        </div>
      </Dialog>
    </motion.div>
  );
}
