import { useState, useMemo, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuraJourney } from "../hooks/useAuraJourney";
import { db } from "../db";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS } from "../lib/haptics";
import { Button } from "primereact/button";
import { Sidebar } from "primereact/sidebar";
import { TabView, TabPanel } from "primereact/tabview";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { SpeedDial } from "primereact/speeddial";
import { DataView } from "primereact/dataview";
import { Tree } from "primereact/tree";
import { 
  Atom, BookOpen, Cpu, Brain, Globe, Compass, Music, Palette, Calculator, Code, Rocket, Landmark, Microscope, Telescope, Languages, Binary, Lightbulb, Sigma, Trophy
} from "lucide-react";
import confetti from "canvas-confetti";
import { safeRandomUUID } from "../lib/uuid";
import { GamificationSidebar } from "./GamificationSidebar";
import { ReflectionSidebar } from "./ReflectionSidebar";
import { EvaluationSidebar } from "./EvaluationSidebar";

export function Maps({ onBack, tripId }: { onBack?: () => void; tripId?: string | null }) {
  const toast = useRef<Toast>(null);
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

  const [showLinksPopup, setShowLinksPopup] = useState(false);
  const [evaluationSidebarVisible, setEvaluationSidebarVisible] = useState(false);
  const [selectedTaskForAnalytics, setSelectedTaskForAnalytics] = useState<any>(null);
  const [taskReflectionData, setTaskReflectionData] = useState<any>(null);
  const [showStumbleForm, setShowStumbleForm] = useState(false);
  const [stumbleReason, setStumbleReason] = useState("");
  const [reflectionForceStationId, setReflectionForceStationId] = useState<string | null>(null);
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [stationDialVisible, setStationDialVisible] = useState(false);

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
      const ref = await db.reflections.where("taskId").equals(task.id).first();
      setTaskReflectionData(ref || null);
    } else {
      setTaskReflectionData(null);
    }
  };

  const handleSaveStumble = async () => {
    if (!stumbleReason.trim() || !selectedStation) return;
    try {
      const currentStationObj = stations.find((s) => s.id === selectedStation);
      const stationName = currentStationObj?.name || 'محطة غير معروفة';
      
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

  const treeNodeTemplate = (node: any) => {
    const t = node.data;
    const isSub = t.type === 'sub';
    const totalSubs = node.children ? node.children.length : 0;
    const completedSubs = node.children ? node.children.filter((c: any) => c.data.isCompleted).length : 0;
    
    return (
      <div 
          className="flex items-center gap-3 py-1.5 w-full font-sans group"
          onClick={(e) => {
              e.stopPropagation();
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
              toggleTask(t.id, t.isCompleted, t.type);
          }}
      >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0
                ${
                  t.isCompleted
                    ? (isSub ? "bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20" : "bg-blue-900 border-blue-900 shadow-md shadow-blue-900/20") + " text-white"
                    : (isSub ? "border-indigo-200" : "border-blue-200") + " bg-white"
                }
              `}
          >
            {t.isCompleted && (
              <i className="pi pi-check text-[8px] font-black scale-110"></i>
            )}
          </div>
          <span
            className={`font-bold transition-all
                 ${t.isCompleted 
                    ? "text-slate-400 line-through opacity-65" 
                    : (isSub ? "text-slate-700 text-xs" : "text-blue-950 text-sm")
                 }`}
          >
            {t.title}
          </span>
          {t.isCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openTaskAnalytics(t);
              }}
              className="mr-auto p-1.5 text-indigo-600 hover:text-indigo-800 transition-colors rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-3xs"
              title="عرض تحليلات المهمة"
              type="button"
            >
              <i className="pi pi-chart-bar text-[10px] font-black"></i>
            </button>
          )}
      </div>
    );
  };

  const isMainTasksFullyCompleted = useMemo(() => {
    if (!selectedStation || !tasks) return false;
    const stTasks = tasks.filter(t => t.stationId === selectedStation && t.type === 'main');
    if (stTasks.length === 0) return true;
    return stTasks.every(t => t.isCompleted);
  }, [selectedStation, tasks]);

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
      <Toast
        ref={toast}
        position="top-center"
        className="font-sans text-xs text-right"
        style={{ direction: "rtl", zIndex: 999999999 }}
        baseZIndex={999999999}
      />

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

      {/* Dynamic Header - Fixed at the top frame */}
      <div className="flex-none pt-8 pb-4 flex justify-center items-center z-30 pointer-events-none select-none px-4 mt-4">
        <div className="text-center bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 px-6 py-3 rounded-[32px] shadow-xl border-4 border-white/30 backdrop-blur-md max-w-[90%]">
          <h2 className="text-xl md:text-2xl font-black text-white px-2">
            {user.learningGoal}
          </h2>
        </div>
      </div>

      {/* Standalone Back Button */}
      {onBack && (
        <button
          className="absolute top-8 right-6 z-40 bg-white/70 backdrop-blur-md text-slate-500 hover:text-blue-600 w-10 h-10 rounded-full border border-slate-200 shadow-sm flex items-center justify-center hover:bg-white transition-all active:scale-95 cursor-pointer"
          onClick={() => {
            vibrate(HAPITCS.MAJOR_CLICK);
            onBack();
          }}
          title="الرجوع للمسارات"
        >
          <i className="pi pi-arrow-right text-sm"></i>
        </button>
      )}

      {gData.fuel <= 0 && (
        <div className="absolute top-26 right-6 left-6 bg-red-50/90 backdrop-blur-md p-4 rounded-2xl border border-red-100 text-red-800 text-center font-bold text-xs z-30 animate-pulse shadow-sm">
          بنزينك خلص، خد أجازة بقعة وريح ⛽ (يرجى الضغط على زر "أجازة" لزيادة
          الوقود)
        </div>
      )}

      {/* SVG Canvas Map Container */}
      <div
        className="w-full h-full overflow-y-auto overflow-x-hidden pt-8 pb-16 relative scroll-smooth no-scrollbar bg-slate-50/50 maps-dotted-bg"
        dir="ltr"
        id="maps-viewport-scroll"
      >
          {/* Full-width decorative background icon constellations that cover the entire page */}
          <div 
            className="absolute inset-0 w-full pointer-events-none overflow-hidden z-0"
            style={{ height: `${stations.length * 220 + 200}px` }}
          >
            {backgroundDecoIcons.map(({ IconComponent, style, id }) => (
              <IconComponent 
                key={id} 
                style={style} 
                size={34} 
                className="text-indigo-900 pointer-events-none select-none" 
              />
            ))}
          </div>

          <div
            className="w-full max-w-[600px] mx-auto relative mt-4 z-10"
            style={{ height: `${stations.length * 220 + 100}px` }}
          >

          {/* SVG Background Connecting path */}
          {stations.length > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 animate-fade-in"
              viewBox={`0 0 1000 ${stations.length * 220 + 100}`}
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Thin light black dotted/dashed connector path */}
              <path
                d={pathD}
                stroke="rgba(30, 64, 175, 0.4)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="10 12"
              />
            </svg>
          )}

          {/* Map Nodes render */}
          {stations.map((st, i) => {
            const isUnlocked = unlockedStations.includes(st.id);
            const isActive = isUnlocked && st.id === activeStationId;
            const isCompleted =
              isUnlocked && !isActive && stationEnergy[st.id] === 100;
            const isNextLocked = !isUnlocked && i === unlockedStations.length;
            const isFutureLocked = !isUnlocked && i > unlockedStations.length;

            const xPercent = i % 2 === 0 ? "25%" : "75%";
            const yPx = i * 220 + 130;
            const energy = stationEnergy[st.id] || 0;
            const rawSubs = user.subStations?.[st.id];
            const stationSubData = Array.isArray(rawSubs) ? rawSubs : (rawSubs ? [rawSubs] : []);

            return (
              <div
                key={st.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-500"
                style={{ left: xPercent, top: `${yPx}px` }}
              >
                <div className="flex flex-col items-center relative">
                  {/* EnergyRing removed */}

                  {/* Floating Sub-stations indicators */}
                  {isUnlocked && stationSubData.length > 0 && (
                    <div 
                      className={`absolute -top-12 ${i % 2 === 0 ? '-right-10' : '-left-10'} flex flex-col gap-1.5 z-30`}
                    >
                      {stationSubData.map((ss, ssIdx) => (
                        <motion.div 
                          key={ssIdx}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: ssIdx * 0.1 }}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shadow-sm backdrop-blur-md
                            ${ss.isCompleted 
                              ? "bg-emerald-500 border-emerald-400 text-white" 
                              : "bg-white/80 border-indigo-100 text-indigo-400"
                            }
                          `}
                          title={ss.isCompleted ? "مهمة تطبيقية مكتملة" : "مهمة تطبيقية قيد التنفيذ"}
                        >
                          <i className={`pi ${ss.isCompleted ? 'pi-check' : 'pi-hammer'} text-[8px] font-black`}></i>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Aura Node Orb */}
                  <motion.div
                    id={`map-node-orb-${st.id}`}
                    whileHover={isUnlocked ? { scale: 1.12, y: -2 } : {}}
                    whileTap={isUnlocked ? { scale: 0.95 } : {}}
                    className={`w-24 h-20 rounded-3xl flex items-center justify-center cursor-pointer relative transition-all duration-300 border shadow-lg rotate-[25deg]
                            ${isActive ? "bg-gradient-to-br from-blue-600 to-indigo-800 border-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.6)] scale-110 z-20" : ""}
                            ${isCompleted ? "bg-gradient-to-br from-emerald-500 to-teal-700 border-emerald-400" : ""}
                            ${!isActive && !isCompleted && isUnlocked ? "bg-gradient-to-br from-blue-500 to-blue-700 border-blue-300 shadow-blue-500/10" : ""}
                            ${isNextLocked ? "bg-slate-200 text-slate-500 opacity-90 border-slate-300 shadow-sm" : ""}
                            ${isFutureLocked ? "bg-slate-100 text-slate-300 opacity-60 filter blur-[1px] grayscale border-slate-200 shadow-none select-none" : !isActive && !isCompleted && !isUnlocked ? "bg-slate-50 border-slate-200" : ""}
                          `}
                    onClick={() => {
                      if (isUnlocked) {
                        vibrate(HAPITCS.MAJOR_CLICK);
                        setPoppedStationId(st.id);
                        setTimeout(() => setSelectedStation(st.id), 300);
                      } else if (isNextLocked) {
                        vibrate(HAPITCS.GUIDANCE);
                        setSelectedStation(st.id);
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
                    }}
                  >
                    {/* Active Station Pulse Effect */}
                    {isActive && (
                      <>
                        <span className="absolute -inset-[6px] rounded-2xl bg-blue-500/40 z-10 pointer-events-none animate-ping opacity-75" />
                        <span className="absolute -inset-[12px] rounded-2xl bg-blue-400/20 z-10 pointer-events-none animate-pulse blur-md" />
                        <span className="absolute -inset-[18px] rounded-2xl bg-blue-300/10 z-10 pointer-events-none blur-lg" />
                        <span className="absolute inset-0 rounded-2xl bg-blue-600/20 animate-pulse z-0 pointer-events-none" />
                      </>
                    )}

                    {/* Station Icon or Lock overlay */}
                    {isUnlocked ? (
                      <div className="flex items-center justify-center z-20">
                        <i 
                          className={`${st.icon && st.icon.startsWith("pi ") ? st.icon : "pi pi-flag-fill"} text-2xl select-none inline-block -rotate-[25deg] bg-gradient-to-b from-blue-50 to-blue-300 bg-clip-text text-transparent filter drop-shadow-md`}
                        ></i>
                      </div>
                    ) : (
                      <i
                        className={`pi pi-lock text-3xl -rotate-[25deg] ${isNextLocked ? "text-blue-600" : "text-gray-400"} z-20`}
                      ></i>
                    )}

                    {/* Milestone indicators */}
                    {isCompleted && (
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-sm z-30">
                        <i className="pi pi-check text-[10px] font-bold"></i>
                      </span>
                    )}
                  </motion.div>

                  {/* Title Badge - Hidden by default, shown when station is active or explicitly selected */}
                  <div
                    className={`mt-4 px-4 py-2 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg text-center max-w-[180px] transition-all duration-300 transform
                            ${selectedStation === st.id 
                               ? "opacity-100 translate-y-0 scale-100 visible" 
                               : "opacity-0 translate-y-2 scale-90 invisible"
                            }
                          `}
                    dir="rtl"
                  >
                    <h4 className="font-bold text-xs text-blue-950 truncate">
                      {st.name}
                    </h4>
                    {isUnlocked ? (
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {energy}% طاقة
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                        {isNextLocked
                          ? `🔒 مقفلة (${i * 10} مفتاح)`
                          : "ضباب المستقبل"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluation Log Sidebar */}
      <EvaluationSidebar 
        visible={evaluationSidebarVisible}
        onHide={() => setEvaluationSidebarVisible(false)}
        stations={stations || []}
        mainTasks={tasks.filter(t => t.type === 'main')}
        sideTasks={tasks.filter(t => t.type === 'side')}
        subTasks={tasks.filter(t => t.type === 'sub')}
        practicalSubStations={user?.subStations || {}}
        onRewardActivity={rewardActivity}
        onCompleteTask={completeTask}
        onCompletePracticalTask={completePracticalTask}
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

      {/* Detail Tasks Dialog for Selected Station */}
      <Dialog
        visible={!!(selectedStation && unlockedStations.includes(selectedStation))}
        onHide={() => setSelectedStation(null)}
        header={
          <div className="flex justify-between items-center w-full relative" dir="rtl">
            <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest block text-right pr-2">
              تفاصيل المحطة والمهام
            </span>
          </div>
        }
        className="w-[96vw] max-w-[850px] font-sans !rounded-[40px] overflow-hidden"
        style={{ borderRadius: '40px', minHeight: '620px' }}
        maskClassName="backdrop-blur-md bg-blue-950/20"
        closable
        dismissableMask
        blockScroll
      >
        <AnimatePresence>
          {!!(selectedStation && unlockedStations.includes(selectedStation)) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="text-right font-sans" 
              dir="rtl"
            >
          {(() => {
            const currentStationObj = stations.find((s) => s.id === selectedStation);
            return (
              <div className="flex flex-col items-center justify-center text-center py-6 px-4 bg-gradient-to-b from-blue-50/50 to-transparent border-b border-dashed border-slate-100 rounded-b-[32px] mb-6">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-100 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/10 mb-3 transition-transform duration-500 hover:scale-110">
                  <i className={`${currentStationObj?.icon && currentStationObj.icon.startsWith("pi ") ? currentStationObj.icon : "pi pi-flag-fill"} text-3xl bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent`}></i>
                </div>
                <h2 className="text-2xl font-black text-blue-950 mb-2 leading-snug">
                  {currentStationObj?.name}
                </h2>
                {currentStationObj?.description ? (
                  <p className="text-xs text-slate-500 max-w-xl mb-3 leading-relaxed font-bold">
                    {currentStationObj.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 max-w-xl mb-3 leading-relaxed italic font-bold">
                    لا يوجد وصف متوفر لهذه المحطة حالياً.
                  </p>
                )}
                <div className="flex flex-wrap justify-center items-center gap-2 mt-1">
                  {currentStationObj?.id && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black shadow-xs">
                      <i className="pi pi-bolt text-[9px]"></i>
                      <span>بطارية المحطة: {stationEnergy[currentStationObj.id] || 0}%</span>
                    </div>
                  )}
                  {currentStationObj?.targetDate && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/60 border border-blue-100 text-blue-700 rounded-full text-[10px] font-black shadow-xs">
                      <i className="pi pi-calendar text-[9px]"></i>
                      <span>التاريخ المقدر: {currentStationObj.targetDate}</span>
                    </div>
                  )}
                </div>
                {(user?.dailyDuration || (Array.isArray(user?.learningDays) && user.learningDays.length > 0)) && (
                  <div className="mt-3.5 flex flex-wrap gap-2 justify-center items-center relative z-40">
                    {user?.dailyDuration ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-800 rounded-xl text-[10px] font-black">
                        <i className="pi pi-clock text-[10px]"></i>
                        <span>الهدف: {user.dailyDuration} دقيقة يوماً</span>
                      </div>
                    ) : null}
                    {Array.isArray(user?.learningDays) && user.learningDays.length > 0 ? (
                      <button 
                        onClick={() => {
                          const daysStr = user.learningDays.map((d: number) => ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][d]).join('، ');
                          toast.current?.show({
                            severity: 'info',
                            summary: 'أيام التعلم المحددة 🗓️',
                            detail: daysStr,
                            life: 4000
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-indigo-800 transition-colors rounded-xl text-[10px] font-black cursor-pointer shadow-xs"
                      >
                        <i className="pi pi-calendar text-[10px]"></i>
                        <span>أيام التعلم المحددة</span>
                      </button>
                    ) : null}

                    {/* Inline Station Internal Actions */}
                    <div className="flex gap-2 mr-1">
                      <button
                        title="مصادر التعلم"
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setShowLinksPopup(true);
                        }}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none"
                      >
                        <i className="pi pi-book text-xs"></i>
                      </button>
                      <button
                        title="الخواطر"
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setActiveNoteStationId(selectedStation!);
                          setShowNotesPopup(true);
                        }}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-500 text-white shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none"
                      >
                        <i className="pi pi-pencil text-xs"></i>
                      </button>
                      <button
                        title="تحليلات المحطة"
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setReflectionForceStationId(selectedStation);
                          setReflectionActiveTab(0); // 0 because analytics is first tab now in ReflectionSidebar
                          setReflectionSidebar(true);
                        }}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none"
                      >
                        <i className="pi pi-chart-bar text-xs"></i>
                      </button>
                      <button
                        title="وقعت اليوم؟"
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setStumbleReason("");
                          setShowStumbleForm(true);
                        }}
                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all outline-none"
                      >
                        <i className="pi pi-exclamation-triangle text-xs"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <TabView className="station-details-tabs flex-1 custom-spaced-tabs">
            <TabPanel headerTemplate={createTabHeader("pi-bolt", "الأساسية")}>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pt-4 px-1 space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => setMainTaskFilter('all')}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${mainTaskFilter === 'all' ? 'bg-white shadow-sm text-blue-900 border border-slate-200' : 'text-slate-400 border border-transparent'}`}
                    >الكل</button>
                    <button 
                      onClick={() => setMainTaskFilter('completed')}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${mainTaskFilter === 'completed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 border border-transparent'}`}
                    >المكتملة</button>
                    <button 
                      onClick={() => setMainTaskFilter('pending')}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${mainTaskFilter === 'pending' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 border border-transparent'}`}
                    >قيد التنفيذ</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredMainTasksNodes.length > 0 ? (
                    <div className="space-y-3 font-sans" dir="rtl">
                      {filteredMainTasksNodes.map((node: any) => {
                        const parentTask = node.data;
                        const hasChildren = node.children && node.children.length > 0;
                        const isExpanded = !!expandedKeys[node.key];
                        const totalSubs = node.children ? node.children.length : 0;
                        const completedSubs = node.children ? node.children.filter((c: any) => c.data.isCompleted).length : 0;
                        
                        return (
                          <div 
                            key={node.key} 
                            className="group/parent rounded-[24px] border border-slate-100/90 bg-white shadow-xs hover:border-blue-200 hover:shadow-md transition-all duration-300 overflow-hidden"
                          >
                            {/* Parent Task Header Row */}
                            <div 
                              onClick={() => {
                                if (hasChildren) {
                                  setExpandedKeys((prev: any) => ({
                                    ...prev,
                                    [node.key]: !prev[node.key]
                                  }));
                                }
                              }}
                              className="flex items-start justify-between gap-4 p-4 select-none cursor-pointer hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                {/* Custom Checkbox for Parent Task */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Stop chevron toggle!
                                    if (!parentTask.isCompleted && completedSubs < totalSubs) {
                                      vibrate(HAPITCS.MAJOR_CLICK);
                                      toast.current?.show({
                                        severity: "warn",
                                        summary: "أنجز الفرعيات أولاً ⚠️",
                                        detail: "يرجى إكمال المهام الفرعية للرئيسية أولاً.",
                                        life: 4000
                                      });
                                      return;
                                    }
                                    toggleTask(parentTask.id, parentTask.isCompleted, parentTask.type);
                                    if (!parentTask.isCompleted) {
                                      vibrate(HAPITCS.MAJOR_CLICK);
                                      setEvaluationSidebarVisible(true);
                                    }
                                  }}
                                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 mt-0.5
                                    ${
                                      parentTask.isCompleted
                                        ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-600/20 text-white"
                                        : "border-slate-300 bg-white hover:border-blue-400"
                                    }
                                  `}
                                >
                                  {parentTask.isCompleted && (
                                    <i className="pi pi-check text-[10px] font-black"></i>
                                  )}
                                </div>

                                <div className="space-y-1 flex-1 min-w-0 text-right">
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!parentTask.isCompleted && completedSubs < totalSubs) {
                                        vibrate(HAPITCS.MAJOR_CLICK);
                                        toast.current?.show({
                                          severity: "warn",
                                          summary: "أنجز الفرعيات أولاً ⚠️",
                                          detail: "يرجى إكمال المهام الفرعية للرئيسية أولاً.",
                                          life: 4000
                                        });
                                        return;
                                      }
                                      vibrate(HAPITCS.MAJOR_CLICK);
                                      setEvaluationSidebarVisible(true);
                                    }}
                                    className={`font-black text-sm block leading-relaxed break-words cursor-pointer transition-all
                                      ${parentTask.isCompleted 
                                         ? "text-slate-400 line-through opacity-70" 
                                         : "text-slate-800 hover:text-blue-900 underline decoration-blue-200/50"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span>{parentTask.title}</span>
                                      {parentTask.isCompleted && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openTaskAnalytics(parentTask);
                                          }}
                                          className="p-1 px-1.5 bg-indigo-50 border border-indigo-100/50 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 transition-all rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-3xs"
                                          title="عرض تحليلات المهمة"
                                        >
                                          <i className="pi pi-chart-bar text-[10px] font-black"></i>
                                        </button>
                                      )}
                                    </div>
                                  </span>

                                  {/* Progress pill/badge for child items */}
                                  {hasChildren && (
                                    <div className="flex items-center gap-2 mt-1.5 justify-start">
                                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full transition-all ${completedSubs === totalSubs ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                                        {completedSubs === 0 ? `${totalSubs} مهام فرعية` : `${completedSubs} من ${totalSubs} مهام فرعية`}
                                      </span>
                                      
                                      {/* Miniature visual progress strip */}
                                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full transition-all duration-500 rounded-full ${completedSubs === totalSubs ? "bg-emerald-500" : "bg-blue-500"}`}
                                          style={{ width: `${(completedSubs / totalSubs) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action icon (Expand Caret / Subtask indicators) */}
                              {hasChildren && (
                                <div className="flex items-center self-center justify-center shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-100 group-hover/parent:bg-blue-50 group-hover/parent:border-blue-100 transition-all">
                                  <motion.i 
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="pi pi-chevron-down text-slate-400 text-[10px] group-hover/parent:text-blue-500"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Animated Sub-tasks List */}
                            {hasChildren && (
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden bg-slate-50/50 border-t border-slate-100/50"
                                  >
                                    <div className="p-4 pr-10 space-y-3 relative text-right">
                                      {/* Curved Connection Guideline Line on the Right (RTL friendly) */}
                                      <div className="absolute right-[25px] top-0 bottom-8 w-[1.5px] border-r border-dashed border-indigo-200/60 pointer-events-none" />

                                      {node.children.map((child: any) => {
                                        const subTask = child.data;
                                        return (
                                          <div 
                                            key={subTask.id}
                                            onClick={() => {
                                              toggleTask(subTask.id, subTask.isCompleted, subTask.type);
                                              if (!subTask.isCompleted) {
                                                vibrate(HAPITCS.MAJOR_CLICK);
                                                setEvaluationSidebarVisible(true);
                                              }
                                            }}
                                            className="flex items-start gap-3 group/sub cursor-pointer relative py-1.5"
                                          >
                                            {/* Horizontal branches */}
                                            <div className="absolute right-[-15px] top-[18px] w-3.5 h-[1.5px] border-b border-dashed border-indigo-200/60 pointer-events-none" />

                                            {/* Custom circular sub checkbox */}
                                            <div 
                                              className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 mt-0.5 z-10
                                                ${
                                                  subTask.isCompleted
                                                    ? "bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-600/15 text-white scale-105"
                                                    : "border-slate-300 bg-white hover:border-indigo-400 active:scale-95"
                                                }
                                              `}
                                            >
                                              {subTask.isCompleted && (
                                                <i className="pi pi-check text-[6px] font-black"></i>
                                              )}
                                            </div>

                                            <span
                                              className={`font-semibold text-xs leading-relaxed break-words cursor-pointer transition-all flex-1 text-right py-0.5
                                                ${subTask.isCompleted 
                                                   ? "text-slate-400 line-through opacity-75" 
                                                   : "text-slate-600 group-hover/sub:text-indigo-950 underline decoration-indigo-200/30"
                                                }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                vibrate(HAPITCS.MAJOR_CLICK);
                                                setEvaluationSidebarVisible(true);
                                              }}
                                            >
                                              <div className="flex items-center gap-2 flex-wrap justify-start"><span>{subTask.title}</span>{subTask.isCompleted && (<button type="button" onClick={(e) => { e.stopPropagation(); openTaskAnalytics(subTask); }} className="p-1 bg-indigo-50/75 border border-indigo-100/30 hover:bg-indigo-100/90 text-indigo-600 transition-all rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-3xs" title="عرض تحليلات المهمة"><i className="pi pi-chart-bar text-[9px] font-black"></i></button>)}</div>
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-100 rounded-[32px] p-4 shadow-xs text-center py-12">
                      <i className="pi pi-inbox text-4xl text-slate-100 mb-3 block"></i>
                      <p className="text-xs text-slate-400 font-bold">لا يوجد مهام تتناسب مع هذا الفلتر.</p>
                    </div>
                  )}
                </div>


              </motion.div>
            </TabPanel>

            <TabPanel headerTemplate={createTabHeader("pi-sparkles", "الجانبية")}>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pt-4 px-1 space-y-6"
              >
                <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 w-fit">
                  <button 
                    onClick={() => setSideTaskFilter('all')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${sideTaskFilter === 'all' ? 'bg-white shadow-sm text-blue-900 border border-slate-200' : 'text-slate-400 border border-transparent'}`}
                  >الكل</button>
                  <button 
                    onClick={() => setSideTaskFilter('completed')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${sideTaskFilter === 'completed' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 border border-transparent'}`}
                  >المكتملة</button>
                  <button 
                    onClick={() => setSideTaskFilter('pending')}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${sideTaskFilter === 'pending' ? 'bg-gray-400 text-white shadow-md' : 'text-slate-400 border border-transparent'}`}
                  >قيد التنفيذ</button>
                </div>

                <div className="space-y-3">
                  {filteredSideTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center gap-4 p-5 rounded-[24px] border transition-all active:scale-[0.98]
                           ${
                             t.isCompleted
                               ? "bg-amber-50/40 border-amber-100 shadow-xs"
                               : "bg-white border-slate-100 hover:border-amber-200 hover:shadow-md"
                           }
                         `}
                    >
                      <div
                        onClick={() => {
                          toggleTask(t.id, t.isCompleted, t.type);
                          if (!t.isCompleted) {
                            vibrate(HAPITCS.MAJOR_CLICK);
                            setEvaluationSidebarVisible(true);
                          }
                        }}
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 cursor-pointer
                            ${
                              t.isCompleted
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "border-amber-100 bg-white hover:border-amber-300"
                            }
                          `}
                      >
                        {t.isCompleted && (
                          <i className="pi pi-star-fill text-[12px] font-bold"></i>
                        )}
                      </div>
                      <span
                        onClick={() => {
                          vibrate(HAPITCS.MAJOR_CLICK);
                          setEvaluationSidebarVisible(true);
                        }}
                        className={`font-black text-sm transition-all cursor-pointer flex-1 text-right
                             ${t.isCompleted ? "text-amber-800 line-through opacity-65" : "text-blue-950 hover:text-amber-700 underline decoration-amber-200/40"}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap"><span>{t.title}</span>{t.isCompleted && (<button type="button" onClick={(e) => { e.stopPropagation(); openTaskAnalytics(t); }} className="p-1 px-1.5 bg-amber-50 border border-amber-100/50 hover:bg-amber-100 hover:border-amber-200 text-amber-700 transition-all rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-3xs" title="عرض تحليلات المهمة"><i className="pi pi-chart-bar text-[10px] font-black"></i></button>)}</div>
                      </span>
                    </div>
                  ))}
                  {filteredSideTasks.length === 0 && (
                    <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[32px] text-center">
                       <i className="pi pi-sparkles text-4xl text-slate-200 mb-3 block"></i>
                       <p className="text-xs text-slate-300 font-bold italic">لا توجد مهام تناسب الفلتر الحالي.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabPanel>

            <TabPanel headerTemplate={createTabHeader("pi-hammer", "تطبيق عملي")}>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pt-4 px-1 space-y-6"
              >
                <div className="flex justify-between items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPracticalFilter('all')}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${practicalFilter === 'all' ? 'bg-white shadow-sm text-blue-900 border border-slate-200' : 'text-slate-400 border border-transparent'}`}
                    >الكل</button>
                    <button 
                      onClick={() => setPracticalFilter('completed')}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${practicalFilter === 'completed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 border border-transparent'}`}
                    >المكتملة</button>
                    <button 
                      onClick={() => setPracticalFilter('pending')}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${practicalFilter === 'pending' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 border border-transparent'}`}
                    >قيد التنفيذ</button>
                  </div>
                  
                  <button 
                    onClick={() => {
                        setSubStationTargetId(selectedStation!);
                        setSubStationModalVisible(true);
                        setSubStationTasks([]);
                        setSubStationDuration(30);
                    }}
                    className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center border-none shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-90 transition-all cursor-pointer"
                  >
                    <i className="pi pi-plus text-xs"></i>
                  </button>
                </div>

                <div className="space-y-6">
                  {filteredPracticalTasks.map((sub, sIdx) => (
                    <div key={sIdx} className="bg-slate-50/50 border border-slate-200 rounded-[32px] p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
                      
                      <div className="flex justify-between items-center mb-5 relative z-10 font-sans">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm border-2 border-white shadow-sm">
                            {sIdx + 1}
                          </span>
                          <h5 className="font-black text-base text-indigo-950 uppercase tracking-tighter">التطبيق العملي #{sIdx + 1}</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-400 bg-white/80 px-3 py-1.5 rounded-xl border border-indigo-50 shadow-xs">
                             {sub.durationMinutes} دقيقة ⏱️
                          </span>
                          <button 
                            type="button"
                            onClick={() => deletePracticalPlan(selectedStation!, sIdx)}
                            className="w-8 h-8 rounded-xl bg-rose-50 text-rose-550 hover:bg-rose-100 active:scale-90 transition-all flex items-center justify-center border-none cursor-pointer"
                            title="حذف التطبيق العملي"
                          >
                            <i className="pi pi-trash text-[11px]"></i>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4 relative z-10">
                        {sub.tasks.map((stTask) => (
                          <div key={stTask.id} className="bg-white border border-slate-100 rounded-[28px] p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99]">
                            <div 
                              className="flex items-center gap-4"
                            >
                              <div 
                                onClick={() => {
                                  toggleSubStationTask(selectedStation!, sIdx, stTask.id);
                                  if (!stTask.isCompleted) {
                                    vibrate(HAPITCS.MAJOR_CLICK);
                                    setEvaluationSidebarVisible(true);
                                  }
                                }}
                                className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${stTask.isCompleted ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20' : 'border-indigo-100 bg-slate-50 hover:border-indigo-300'}`}>
                                {stTask.isCompleted && <i className="pi pi-check text-[10px] text-white font-black"></i>}
                              </div>
                              <span 
                                onClick={() => {
                                  vibrate(HAPITCS.MAJOR_CLICK);
                                  setEvaluationSidebarVisible(true);
                                }}
                                className={`font-black text-sm cursor-pointer flex-1 text-right ${stTask.isCompleted ? 'text-slate-400 line-through opacity-60' : 'text-blue-950 hover:text-indigo-800 underline decoration-indigo-200/50'}`}>
                                <div className="flex items-center gap-2 flex-wrap"><span>{stTask.title}</span>{stTask.isCompleted && (<button type="button" onClick={(e) => { e.stopPropagation(); openTaskAnalytics(stTask); }} className="p-1 px-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-150 hover:border-indigo-300 text-indigo-700 transition-all rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-3xs" title="عرض تحليلات المهمة"><i className="pi pi-chart-bar text-[10px] font-black"></i></button>)}</div>
                              </span>
                            </div>
                            
                            {stTask.subTasks && stTask.subTasks.length > 0 && (
                              <div className="mt-4 mr-10 space-y-3 border-r-2 border-indigo-50 pr-4">
                                {stTask.subTasks.map(inner => (
                                  <div 
                                    key={inner.id} 
                                    className="flex items-center gap-3 group"
                                  >
                                    <div 
                                      onClick={() => {
                                        toggleSubStationInnerTask(selectedStation!, sIdx, stTask.id, inner.id);
                                        if (!inner.isCompleted) {
                                          vibrate(HAPITCS.MAJOR_CLICK);
                                          setEvaluationSidebarVisible(true);
                                        }
                                      }}
                                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${inner.isCompleted ? 'bg-indigo-400 border-indigo-400' : 'border-indigo-100 bg-white hover:border-indigo-300 group-hover:border-indigo-200'}`}>
                                      {inner.isCompleted && <i className="pi pi-check text-[8px] text-white font-black"></i>}
                                    </div>
                                    <span 
                                      onClick={() => {
                                        vibrate(HAPITCS.MAJOR_CLICK);
                                        setEvaluationSidebarVisible(true);
                                      }}
                                      className={`text-xs font-bold cursor-pointer flex-1 text-right ${inner.isCompleted ? 'text-slate-300 line-through' : 'text-slate-600 hover:text-indigo-900 underline decoration-indigo-200/30'}`}>
                                      <div className="flex items-center gap-2 flex-wrap justify-start"><span>{inner.title}</span>{inner.isCompleted && (<button type="button" onClick={(e) => { e.stopPropagation(); openTaskAnalytics(inner); }} className="p-1 bg-indigo-50/70 border border-indigo-100/30 hover:bg-indigo-100/80 text-indigo-600 transition-all rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-3xs hover:scale-105" title="عرض تحليلات المهمة"><i className="pi pi-chart-bar text-[9px] font-black"></i></button>)}</div>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {sub.isCompleted && (
                        <div className="mt-5 p-4 bg-emerald-500 text-white rounded-[24px] flex items-center gap-4 animate-fade-in relative z-10 shadow-lg shadow-emerald-500/10">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                            <i className="pi pi-verified text-xl"></i>
                          </div>
                          <p className="text-xs font-black leading-tight">هذا التطبيق العملي تم إنجازه بالكامل! عمل رائع 🚀</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredPracticalTasks.length === 0 && (
                    <div className="py-16 bg-slate-50 border border-dashed border-slate-200 rounded-[40px] text-center px-10">
                       <i className="pi pi-hammer text-5xl text-slate-100 mb-4 block"></i>
                       <p className="text-sm text-slate-300 font-black">لا توجد أنشطة تطبيقية تناسب هذا الفلتر حالياً.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabPanel>

          </TabView>
          
              <div className="pt-8 px-1 pb-6">
                <Button
                  label="فهمت، العودة للخريطة"
                  className="w-full bg-slate-100 text-slate-500 rounded-2xl py-5 font-black border-none hover:bg-slate-200 transition-all cursor-pointer text-lg"
                  onClick={() => setSelectedStation(null)}
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>

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
              className="fixed inset-0 bg-blue-950/70 backdrop-blur-md z-50 flex items-center justify-center p-6"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl p-8 z-55 shadow-2xl border border-blue-50 text-center"
              dir="rtl"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-emerald-50 shadow-md">
                <span className="text-4xl animate-bounce">✉️</span>
              </div>

              <h3 className="text-2xl font-black text-blue-950 mb-2">
                لقد فتحت كبسولتك الزمنية!
              </h3>
              <p className="text-xs text-emerald-700 font-bold mb-6">
                وصلت بنجاح للمحطة، واحتضنت رسالة ماضيك
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6 text-right relative">
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

              <Button
                label="استوعبت الرسالة ونظرت للمستقبل"
                className="w-full bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 text-white rounded-xl py-3.5 font-bold border-none shadow-lg shadow-blue-950/15 hover:brightness-110 transition-all text-sm cursor-pointer"
                onClick={closeCelebration}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Locked Station Dialog */}
      <Dialog
        visible={lockedDialogVisible}
        onHide={() => setLockedDialogVisible(false)}
        header={
          <div
            className="flex items-center gap-2 text-amber-600 font-extrabold pr-2 text-2xl font-sans"
            dir="rtl"
          >
            🔐 المحطة مغلقة!
          </div>
        }
        className="w-[98vw] max-w-2xl font-sans mx-4 !rounded-[32px] overflow-hidden border-none shadow-2xl text-xl"
        style={{ borderRadius: '32px' }}
        closable
        dismissableMask
      >
        <AnimatePresence>
          {lockedDialogVisible && lockedDialogData && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-8 px-8 pb-8 pt-4 text-right font-sans" 
              dir="rtl"
            >
            <div className="text-center py-10 px-8 bg-gradient-to-b from-amber-50/45 to-indigo-50/20 rounded-[24px] border border-amber-150/40 shadow-xs relative overflow-hidden">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-200/10 rounded-full blur-2xl pointer-events-none" />

              <div className="w-16 h-16 rounded-full bg-amber-100/60 border border-amber-200 flex items-center justify-center mx-auto mb-4 animate-bounce shrink-0 shadow-sm" style={{ animationDuration: '3s' }}>
                {lockedDialogData.stationIcon && lockedDialogData.stationIcon.startsWith("pi ") ? (
                  <i className={`${lockedDialogData.stationIcon} text-2xl text-amber-600`}></i>
                ) : (
                  <span className="text-3xl select-none leading-none">
                    {lockedDialogData.stationIcon || "📍"}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-xl text-blue-950 mt-2">
                {lockedDialogData.stationName}
              </h3>
              <p className="text-xs text-gray-450 font-medium max-w-[280px] mx-auto mt-2 leading-relaxed">
                هذه الوجهة مغلقة حالياً. تابع رحلتك لإنجاز المهام المطلوبة لتفعيلها!
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-black text-xs text-gray-450 uppercase tracking-widest mb-1 select-none">
                ⚙️ متطلبات فك القفل:
              </h4>

              {/* Condition 1: Previous Station must be 100% completed */}
              <div className="flex items-center gap-4 p-5 bg-slate-50/60 hover:bg-slate-50 border border-gray-150 rounded-[20px] transition duration-250">
                <div className="flex-none w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-xs">
                  {lockedDialogData.prevStationEnergy === 100 ? (
                    <i className="pi pi-check text-emerald-500 font-extrabold text-xs"></i>
                  ) : (
                    <i className="pi pi-lock text-rose-400 text-xs"></i>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-blue-950">
                    إكمال المحطة السابقة بنسبة 100%
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">
                    الوجهة السابقة: <span className="text-indigo-600 font-bold">{lockedDialogData.prevStationName}</span> ({lockedDialogData.prevStationEnergy}% مكتملة)
                  </p>
                </div>
              </div>

              {/* Condition 2: Focus Keys required count */}
              <div className="flex items-center gap-4 p-5 bg-slate-50/60 hover:bg-slate-50 border border-gray-150 rounded-[20px] transition duration-250">
                <div className="flex-none w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-xs">
                  {lockedDialogData.currentKeys >= lockedDialogData.requiredKeys ? (
                    <i className="pi pi-check text-emerald-500 font-extrabold text-xs"></i>
                  ) : (
                    <i className="pi pi-lock text-rose-400 text-xs text-center block"></i>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-blue-950">
                    امتلاك عدد كافٍ من مفاتيح التركيز 🔑
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5 leading-tight">
                    تحتاج إلى <span className="font-bold text-amber-600">{lockedDialogData.requiredKeys}</span> مفاتيح (لديك حالياً <span className="font-bold text-blue-900">{lockedDialogData.currentKeys}</span> مفاتيح)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <Button
                label={lockedDialogData.currentKeys >= 10 && lockedDialogData.prevStationEnergy === 100 ? "فك قفل المحطة الآن (10 مفاتيح) 🔓" : "فهمت المتطلبات ومستمر بالسعي 🎯"}
                className={`w-full ${lockedDialogData.currentKeys >= 10 && lockedDialogData.prevStationEnergy === 100 ? "bg-gradient-to-r from-emerald-600 to-teal-700" : "bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950"} text-white rounded-[20px] py-4 font-extrabold text-sm border-none shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer`}
                onClick={() => {
                  if (lockedDialogData.currentKeys >= 10 && lockedDialogData.prevStationEnergy === 100) {
                    const st = stations.find(s => s.name === lockedDialogData.stationName);
                    if (st) unlockStation(st.id);
                  } else {
                    setLockedDialogVisible(false);
                  }
                }}
              />
              {lockedDialogData.currentKeys < 10 && (
                <p className="text-[10px] text-center text-rose-500 font-bold">عذراً، لا تمتلك مفاتيح كافية لفك القفل حالياً.</p>
              )}
              {lockedDialogData.prevStationEnergy < 100 && (
                <p className="text-[10px] text-center text-rose-500 font-bold">يجب إنهاء المحطة السابقة بالكامل أولاً.</p>
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

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl space-y-3">
                <h4 className="text-xs font-black text-slate-800">إضافة مصدر جديد</h4>
                <div className="flex flex-col gap-2">
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
                        <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 flex-1 overflow-hidden min-w-0">
                          <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="pi pi-external-link text-xl"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-blue-950 truncate mb-1">
                              {res.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest truncate" dir="ltr">
                              {res.url.replace(/https?:\/\/(www\.)?/, '')}
                            </p>
                          </div>
                        </a>
                        <button 
                          onClick={async () => {
                            const updated = (user.resources || []).filter((_: any, i: number) => i !== idx);
                            await db.userSettings.update(user.id, { resources: updated });
                          }}
                          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors mr-2 cursor-pointer"
                        >
                          <i className="pi pi-trash"></i>
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

      {/* Confirmation Dialog on Station Close */}
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
                هل تريد إغلاق المحطة والعودة للخريطة؟
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
                    اختر المحطة لكتابة يومياتك:
                  </label>
                  <select
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-blue-950 focus:ring-2 ring-blue-900/10"
                    value={activeNoteStationId}
                    onChange={(e) => setActiveNoteStationId(e.target.value)}
                  >
                    <option value="" disabled>اختر محطة...</option>
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

                <Button
                  label="تثبيت الملاحظات فى السجل"
                  icon="pi pi-save"
                  className="w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-900 text-white rounded-2xl py-4 font-black shadow-xl shadow-blue-900/20 border-none hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer text-sm"
                  onClick={saveJournalNote}
                />
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="text-base font-black text-blue-950 mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  سجل الذكريات والتطور ⏳
                </h3>
                
                <div className="max-h-[350px] overflow-y-auto pr-1 no-scrollbar overflow-x-hidden">
                  <DataView 
                    value={Object.entries(user?.notes || {}).flatMap(([stId, notesArray]: [string, any]) => {
                      const arr = Array.isArray(notesArray) ? notesArray : [notesArray];
                      return arr.map((note, index) => {
                        const isObj = typeof note === 'object';
                        return {
                          stationId: stId,
                          stationName: stations.find(s => s.id === stId)?.name || 'محطة غير معروفة',
                          text: isObj ? note.text : note,
                          date: isObj ? note.date : new Date().toISOString(),
                          index: index
                        };
                      });
                    })}
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
                              <span className="font-bold text-[10px]">محطة {stationIndex}</span>
                            </div>
                            
                            <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
                              <div className="flex flex-col">
                                 <span className="text-[14px] font-black text-rose-600 leading-none">{day}</span>
                                 <span className="text-[8px] font-bold text-slate-400 uppercase">{month} {year}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button 
                                  onClick={() => { 
                                    setActiveNoteStationId(item.stationId); 
                                    setNoteText(item.text); 
                                    document.getElementById('notes-textarea-popup')?.focus();
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-xs"
                                >
                                  <i className="pi pi-pencil text-[12px]"></i>
                                </button>
                                <button 
                                  onClick={() => deleteJournalNote(item.stationId, item.index)}
                                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-xs"
                                >
                                  <i className="pi pi-trash text-[12px]"></i>
                                </button>
                              </div>
                            </div>
                            <div className="p-5 flex-1 bg-gradient-to-b from-white to-slate-50/30">
                              <h4 className="text-sm font-black text-blue-950 mb-2 truncate">{item.stationName}</h4>
                              <div className="w-6 h-1 bg-blue-100 rounded-full mb-3"></div>
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
            <i className="pi pi-send text-emerald-600 border-2 border-emerald-950/10 p-1.5 rounded-lg"></i>
            <span className="font-black text-blue-950 tracking-tight">كبسولات الزمن ✉️</span>
          </div>
        }
        className="w-[98vw] max-w-4xl font-sans text-xl"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {showCapsulePopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-6 pt-4 text-right font-sans" 
              dir="rtl"
            >
              {/* Unlocked / Opened capsules list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="pi pi-envelope"></i> الرسائل المفتوحة السابقة:
                </h4>

                {Object.entries(user.timeCapsules || {}).filter(
                  ([_, cap]: any) => (cap as any).isRead,
                ).length === 0 && (
                  <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                    <i className="pi pi-inbox text-2xl text-slate-300 mb-2 block"></i>
                    <p className="text-xs text-slate-400 font-bold">لا يوجد كبسولات تم فتحها حتى الآن.</p>
                  </div>
                )}

                <div className="max-h-[250px] overflow-y-auto pr-1 no-scrollbar space-y-3 font-sans">
                  {Object.entries(user.timeCapsules || {}).map(
                    ([sId, cap]: any) => {
                      const stName =
                        stations.find((s) => s.id === sId)?.name ||
                        "محطة سابقة";
                      if (!cap.isRead) return null;
                      return (
                        <div
                          key={sId}
                          className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-emerald-800">
                              🔓 كبسولة المحطة: {stName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {cap.writtenAt}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-blue-950 leading-relaxed italic">
                            "{cap.message}"
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 font-sans">
                {capsuleTargetStation ? (
                    <div className="bg-blue-50/30 border border-blue-100 rounded-3xl p-5 space-y-4">
                      <h4 className="font-black text-blue-950 text-sm flex items-center gap-1.5 uppercase tracking-tight">
                        <i className="pi pi-send text-blue-600"></i> كبسولة المستقبل: {capsuleTargetStation.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-white/50 p-2.5 rounded-xl border border-blue-50">
                        اكتب رسالة أو وعيد وتوصيات لنفسك المستقبلية. ستغلق هذه
                        الرسالة ولن تفتح إلا عند فك قفل المحطة القادمة!
                      </p>

                      <textarea
                        className="w-full h-16 p-3 bg-white border border-blue-100 rounded-2xl outline-none focus:ring-2 ring-blue-900/10 font-medium text-[11px] text-blue-950 resize-none placeholder:text-slate-300 transition-all font-sans"
                        placeholder="رتب وصيتك ونبّه نفسك بالمهم هنا..."
                        value={capsuleText}
                        onChange={(e) => setCapsuleText(e.target.value)}
                      />

                      <Button
                        label="غلق وشحن الكبسولة"
                        icon="pi pi-send"
                        className="w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-950 text-white rounded-2xl font-bold py-2.5 border-none shadow-lg shadow-blue-950/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 text-xs font-sans"
                        onClick={() => {
                          saveTimeCapsule(capsuleTargetStation.id);
                          setShowCapsulePopup(false);
                        }}
                        disabled={!capsuleText.trim()}
                      />
                    </div>
                ) : (
                  <div className="p-6 bg-slate-100 rounded-3xl text-center">
                    <i className="pi pi-verified text-3xl text-blue-600 mb-3 block"></i>
                    <p className="text-sm text-slate-600 font-black">🎉 لقد وصلت للمحطة النهائية!</p>
                    <p className="text-[10px] text-slate-400 mt-1">لا يوجد محطة تالية لإطلاق كبسولة زمنية لها.</p>
                  </div>
                )}
              </div>
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

              {taskReflectionData ? (
                <div className="space-y-5">
                  {/* Focus & Mastery metrics row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Focus metric */}
                    <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] text-indigo-950/70 font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Brain className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> تركيزك أثناء المهمة:
                      </p>
                      <div className="text-3xl font-black text-indigo-700 font-mono">
                        {taskReflectionData.focus} <span className="text-xs font-bold text-indigo-400">/ 5</span>
                      </div>
                      <div className="flex gap-1 mt-2.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`w-2.5 h-2.5 rounded-full ${
                              s <= taskReflectionData.focus ? "bg-indigo-600" : "bg-indigo-100"
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
                        {taskReflectionData.mastery} <span className="text-xs font-bold text-amber-400">/ 10</span>
                      </div>
                      <div className="w-32 h-2 bg-amber-200/50 rounded-full overflow-hidden mt-3 p-0.5">
                        <div
                          className="h-full bg-amber-600 rounded-full"
                          style={{ width: `${(taskReflectionData.mastery / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Date Badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 rounded-xl w-fit text-[11px] font-bold border border-slate-100">
                    <i className="pi pi-calendar text-[11px] text-slate-400"></i>
                    <span>تاريخ تسجيل الإنجاز: {new Date(taskReflectionData.createdAt).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-1.5">
                      <p className="text-[10px] text-emerald-800 font-black tracking-widest uppercase flex items-center gap-1.5">
                        <span className="text-emerald-500">💪</span> نقاط القوة المسجلة:
                      </p>
                      <p className="text-xs text-slate-700 bg-white/70 p-3.5 rounded-xl border border-emerald-50/30 font-medium leading-relaxed">
                        {taskReflectionData.strengths || "لم يتم تدوين نقاط قوة معينة."}
                      </p>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100 flex flex-col gap-1.5">
                      <p className="text-[10px] text-rose-800 font-black tracking-widest uppercase flex items-center gap-1.5">
                        <span className="text-rose-500">🧨</span> مجالات التحسين (الضعف):
                      </p>
                      <p className="text-xs text-slate-700 bg-white/70 p-3.5 rounded-xl border border-rose-50/30 font-medium leading-relaxed">
                        {taskReflectionData.weaknesses || "لم يتم تدوين مجالات تحسين معينة."}
                      </p>
                    </div>
                  </div>

                  {/* Key Learnings */}
                  <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/60 flex flex-col gap-2">
                    <p className="text-[11px] text-blue-900 font-black tracking-widest uppercase flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" /> أهم الخلاصات والأفكار المسجلة:
                    </p>
                    <p className="text-xs text-slate-800 bg-white/80 p-4 rounded-xl border border-blue-50/60 leading-relaxed font-bold">
                      {taskReflectionData.learnings || "لم تنشأ خلاصات مدونة."}
                    </p>
                  </div>

                  {/* Practical aspect */}
                  {taskReflectionData.didPractical && (
                    <div className="bg-teal-50/30 p-5 rounded-2xl border border-teal-100 flex flex-col gap-2">
                      <p className="text-[11px] text-teal-900/80 font-black tracking-widest uppercase flex items-center gap-2">
                        <i className="pi pi-verified text-teal-600 text-xs"></i> التطبيق العملي والعوائق:
                      </p>
                      <p className="text-xs text-slate-800 bg-white/80 p-4 rounded-xl border border-teal-50 font-medium leading-relaxed">
                        {taskReflectionData.practicalIssues || "تم تفعيل وتطبيق المعرفة بسلاسة ودون مشاكل تقنية."}
                      </p>
                    </div>
                  )}
                </div>
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
            <span className="font-black text-blue-950 tracking-tight">البوصلة 🧭</span>
          </div>
        }
        className="w-[98vw] max-w-4xl font-sans text-xl"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {showCompassPopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-6 pt-4 text-right font-sans" 
              dir="rtl"
            >
              <p className="text-slate-400 font-light text-xs -mt-2 leading-relaxed">
                قمرة القيادة لمعرفة دافعيتك والهدف النهائي ومخاوفك التي تسعى لتخطيها خلال هذه الرحلة.
              </p>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-5 rounded-2xl border border-blue-100/30">
                  <p className="text-[10px] text-indigo-900/60 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                    <i className="pi pi-question-circle text-indigo-600 text-[10px]"></i> السبب (ليه عايز تعمل ده؟):
                  </p>
                  <p className="text-blue-950 font-bold text-sm bg-white/80 p-3.5 rounded-xl border border-white leading-relaxed text-blue-980 shadow-xs">
                    {user.psychology.reason || "لم يتم تسجيله بعد"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/50 p-5 rounded-2xl border border-teal-100/30">
                  <p className="text-[10px] text-teal-900/60 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                    <i className="pi pi-flag text-teal-600 text-[10px]"></i> الهدف النهائي:
                  </p>
                  <p className="text-blue-950 font-bold text-sm bg-white/80 p-3.5 rounded-xl border border-white leading-relaxed shadow-xs">
                    {user.psychology.target || "لم يتم تسجيله بعد"}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-rose-50/70 to-red-50/50 p-5 rounded-2xl border border-rose-100/30">
                  <p className="text-[10px] text-rose-900/60 font-black uppercase tracking-widest flex items-center gap-2 mb-2">
                    <i className="pi pi-exclamation-triangle text-rose-600 text-[10px]"></i> المخاوف (التي تخاف الوقوع فيها):
                  </p>
                  <p className="text-red-950 font-bold text-sm bg-white/80 p-3.5 rounded-xl border border-white leading-relaxed text-red-800 shadow-xs">
                    {user.psychology.anxieties || "لم يتم تسجيله بعد"}
                  </p>
                </div>
              </div>
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
            className="flex items-center gap-2 text-rose-600 font-extrabold pr-4 text-2xl"
            dir="rtl"
          >
            <i className="pi pi-exclamation-triangle text-2xl text-rose-500 animate-bounce"></i>
            <span>تأكيد إلغاء خطة التطبيق العملي</span>
          </div>
        }
        className="w-[98vw] max-w-2xl font-sans mx-4 text-xl"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {showSubStationCancelConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-5 pt-2 text-right font-sans" 
              dir="rtl"
            >
                <p className="text-xl font-medium text-gray-800 leading-snug">
                  هل تريد حقاً تجاوز هذه المحطة بدون تطبيق عملي؟
                  <br />
                  <span className="text-base text-rose-600 block mt-3 font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">
                    ⚠️ التجاوز يفقدك جوائز التطبيق.
                  </span>
                </p>
              <div className="flex gap-2 pt-2">
                <Button
                  label="نعم، إلغاء الخطة"
                  icon="pi pi-trash"
                  className="flex-1 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white rounded-xl py-3 text-lg font-bold border-none hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  onClick={() => {
                    setShowSubStationCancelConfirm(false);
                    setSubStationModalVisible(false);
                    setSubStationTargetId(null);
                    setSubStationTasks([]);
                    setSubStationDuration(30);
                  }}
                />
                <Button
                  label="متابعة التفعيل"
                  icon="pi pi-times"
                  className="flex-1 bg-gray-100 text-gray-700 rounded-xl py-3 text-lg font-semibold border-none hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
                  onClick={() => setShowSubStationCancelConfirm(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
      
      {/* Zoom Controls code block completely removed */}

      {/* Main Map Side Actions (Compass & Rewards) */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="fixed bottom-10 left-[30%] z-40 pointer-events-auto"
      >
        <button
          onClick={() => {
            vibrate(HAPITCS.MAJOR_CLICK);
            setShowCompassPopup(true);
          }}
          title="بوصلة الوضوح"
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-sm border border-white/40 ring-2 ring-purple-500/20 cursor-pointer"
        >
          <i className="pi pi-compass"></i>
        </button>
      </motion.div>

      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="fixed bottom-10 right-[30%] z-40 pointer-events-auto"
      >
        <button
          onClick={() => {
            vibrate(HAPITCS.MAJOR_CLICK);
            setGamificationSidebar(true);
          }}
          title="المحرك والجوائز"
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-sm border border-white/40 ring-2 ring-orange-500/20 cursor-pointer"
        >
          <i className="pi pi-trophy"></i>
        </button>
      </motion.div>
    </motion.div>
);
}
