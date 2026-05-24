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
  Atom, BookOpen, Cpu, Brain, Globe, Compass, Music, Palette, Calculator, Code, Rocket, Landmark, Microscope, Telescope, Languages, Binary, Lightbulb, Sigma
} from "lucide-react";
import confetti from "canvas-confetti";
import { safeRandomUUID } from "../lib/uuid";
import { GamificationSidebar } from "./GamificationSidebar";
import { ReflectionSidebar } from "./ReflectionSidebar";
import { EvaluationSidebar } from "./EvaluationSidebar";

function EnergyRing({ progress, size = 110 }: { progress: number, size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, progress) / 100) * circumference;
  const bonusProgress = Math.max(0, progress - 100);
  const bonusOffset = circumference - (Math.min(100, 30) / 30) * circumference; // Normalized to 30% bonus target
  const actualBonusOffset = circumference - (Math.min(30, bonusProgress) / 30) * (circumference * 0.3); // Visible bonus segment

  return (
    <svg width={size} height={size} className="absolute pointer-events-none z-0 transform rotate-[-95deg]">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="rgba(30, 64, 175, 0.08)"
        strokeWidth="6"
      />
      {/* Main 0-100% progress */}
      <motion.circle
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke={progress >= 100 ? "#10b981" : "#3b82f6"}
        strokeWidth="6"
        strokeDasharray={circumference}
        className="transition-all duration-1000 ease-out"
        strokeLinecap="round"
      />
      {/* Bonus > 100% progress (Up to 130%) */}
      {bonusProgress > 0 && (
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (bonusProgress / 30) * circumference }}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#f59e0b"
          strokeWidth="8"
          strokeDasharray={circumference}
          className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

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
  } = useAuraJourney({ tripId, toast });

  const [evaluationSidebarVisible, setEvaluationSidebarVisible] = useState(false);

  const treeNodeTemplate = (node: any) => {
    const t = node.data;
    const isSub = t.type === 'sub';
    
    return (
      <div 
          className="flex items-center gap-3 py-1.5 w-full font-sans group"
          onClick={(e) => {
              e.stopPropagation();
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
        style={{ direction: "rtl" }}
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
      <div className="flex-none pt-12 pb-2 flex justify-center items-center z-30 pointer-events-none select-none px-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black text-indigo-900/40 uppercase tracking-[0.25em] text-center drop-shadow-sm font-sans mix-blend-multiply">
            {user.learningGoal}
          </h2>
          <div className="w-16 h-1 bg-indigo-900/10 mx-auto mt-2 rounded-full"></div>
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
                  {/* Energy Ring Visualization */}
                  {isUnlocked && (
                    <div className="absolute top-[24px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                       <EnergyRing progress={energy} />
                    </div>
                  )}

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
                    className={`w-16 h-12 rounded-xl flex items-center justify-center cursor-pointer relative transition-all duration-300 border shadow-md rotate-[25deg]
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
                        <span className="absolute -inset-[6px] rounded-xl bg-blue-500/40 z-10 pointer-events-none animate-ping opacity-75" />
                        <span className="absolute -inset-[12px] rounded-xl bg-blue-400/20 z-10 pointer-events-none animate-pulse blur-md" />
                        <span className="absolute -inset-[18px] rounded-xl bg-blue-300/10 z-10 pointer-events-none blur-lg" />
                        <span className="absolute inset-0 rounded-xl bg-blue-600/20 animate-pulse z-0 pointer-events-none" />
                      </>
                    )}

                    {/* Station Icon or Lock overlay */}
                    {isUnlocked ? (
                      <i 
                        className={`${st.icon && st.icon.startsWith("pi ") ? st.icon : "pi pi-flag-fill"} text-xl select-none inline-block -rotate-[25deg] text-white filter drop-shadow-sm z-20`}
                      ></i>
                    ) : (
                      <i
                        className={`pi pi-lock text-2xl -rotate-[25deg] ${isNextLocked ? "text-blue-600" : "text-gray-400"} z-20`}
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
        mainTasks={tasks.filter(t => t.type === 'main')}
        sideTasks={tasks.filter(t => t.type === 'side')}
        weeklyTasks={weeklyChallengeTasks}
        onUpdateWeeklyTasks={(updated) => {
          setWeeklyChallengeTasks(updated);
          localStorage.setItem("weekly_challenge_tasks_aura", JSON.stringify(updated));
        }}
        onRewardActivity={rewardActivity}
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
        weeklyChallengeName={weeklyChallengeName}
        weeklyChallengeRequired={weeklyChallengeRequired}
        completedWeeklyTasks={completedWeeklyTasks}
        totalWeeklyTasks={totalWeeklyTasks}
        setWeeklyChallengeModalVisible={setWeeklyChallengeModalVisible}
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 flex items-center justify-center text-white text-3xl shadow-lg shadow-indigo-500/20 mb-3 transition-transform duration-500 hover:scale-110">
                  <i className={`${currentStationObj?.icon && currentStationObj.icon.startsWith("pi ") ? currentStationObj.icon : "pi pi-flag-fill"} text-2xl`}></i>
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
                {currentStationObj?.targetDate && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50/60 border border-blue-100 text-blue-700 rounded-full text-[10px] font-black shadow-xs">
                    <i className="pi pi-calendar text-[9px]"></i>
                    <span>التاريخ المقدر: {currentStationObj.targetDate}</span>
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
                                    toggleTask(parentTask.id, parentTask.isCompleted, parentTask.type);
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
                                      toggleTask(parentTask.id, parentTask.isCompleted, parentTask.type);
                                    }}
                                    className={`font-black text-sm block leading-relaxed break-words cursor-pointer transition-all
                                      ${parentTask.isCompleted 
                                         ? "text-slate-400 line-through opacity-70" 
                                         : "text-slate-800 hover:text-blue-900"
                                      }`}
                                  >
                                    {parentTask.title}
                                  </span>

                                  {/* Progress pill/badge for child items */}
                                  {hasChildren && (
                                    <div className="flex items-center gap-2 mt-1.5 justify-start">
                                      <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full transition-all ${completedSubs === totalSubs ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                                        {completedSubs} من {totalSubs} مهام فرعية
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
                                            onClick={() => toggleTask(subTask.id, subTask.isCompleted, subTask.type)}
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
                                                   : "text-slate-600 group-hover/sub:text-indigo-950"
                                                }`}
                                            >
                                              {subTask.title}
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
                      onClick={() => toggleTask(t.id, t.isCompleted, t.type)}
                      className={`flex items-center gap-4 p-5 rounded-[24px] border cursor-pointer transition-all active:scale-[0.98]
                           ${
                             t.isCompleted
                               ? "bg-amber-50/40 border-amber-100 shadow-xs"
                               : "bg-white border-slate-100 hover:border-amber-200 hover:shadow-md"
                           }
                         `}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300
                            ${
                              t.isCompleted
                                ? "bg-amber-500 border-amber-500 text-white"
                                : "border-amber-100 bg-white"
                            }
                          `}
                      >
                        {t.isCompleted && (
                          <i className="pi pi-star-fill text-[12px] font-bold"></i>
                        )}
                      </div>
                      <span
                        className={`font-black text-sm transition-all
                             ${t.isCompleted ? "text-amber-800 line-through opacity-65" : "text-blue-950"}`}
                      >
                        {t.title}
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
                              className="flex items-center gap-4 cursor-pointer"
                              onClick={() => toggleSubStationTask(selectedStation!, sIdx, stTask.id)}
                            >
                              <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${stTask.isCompleted ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/20' : 'border-indigo-100 bg-slate-50'}`}>
                                {stTask.isCompleted && <i className="pi pi-check text-[10px] text-white font-black"></i>}
                              </div>
                              <span className={`font-black text-sm ${stTask.isCompleted ? 'text-slate-400 line-through opacity-60' : 'text-blue-950'}`}>
                                {stTask.title}
                              </span>
                            </div>
                            
                            {stTask.subTasks && stTask.subTasks.length > 0 && (
                              <div className="mt-4 mr-10 space-y-3 border-r-2 border-indigo-50 pr-4">
                                {stTask.subTasks.map(inner => (
                                  <div 
                                    key={inner.id} 
                                    className="flex items-center gap-3 cursor-pointer group"
                                    onClick={() => toggleSubStationInnerTask(selectedStation!, sIdx, stTask.id, inner.id)}
                                  >
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${inner.isCompleted ? 'bg-indigo-400 border-indigo-400' : 'border-indigo-100 bg-white group-hover:border-indigo-200'}`}>
                                      {inner.isCompleted && <i className="pi pi-check text-[8px] text-white font-black"></i>}
                                    </div>
                                    <span className={`text-xs font-bold ${inner.isCompleted ? 'text-slate-300 line-through' : 'text-slate-600'}`}>
                                      {inner.title}
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

            <TabPanel headerTemplate={createTabHeader("pi-pencil", "الخواطر")}>
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.3, ease: "easeOut" }}
                 className="pt-4 px-1 space-y-6"
               >
                  <div className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-6 space-y-4">
                     <h4 className="font-black text-blue-900 text-sm flex items-center gap-2">
                        <i className="pi pi-pencil"></i> تدوين خاطرة لهذه المحطة:
                     </h4>
                     <div className="relative group">
                        <textarea
                           className="w-full h-24 p-5 bg-white border border-blue-100 rounded-[28px] outline-none focus:ring-2 ring-blue-600/10 font-bold text-sm text-blue-950 resize-none transition-all placeholder:text-slate-300"
                           placeholder="ما هي أبرز استنتاجاتك من هذا الدرس؟"
                           value={noteText}
                           onChange={(e) => {
                              setNoteText(e.target.value);
                              setActiveNoteStationId(selectedStation!);
                           }}
                        />
                        <button 
                           onClick={saveJournalNote}
                           disabled={!noteText.trim()}
                           className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center shadow-lg shadow-blue-900/30 hover:bg-blue-950 transition-all disabled:opacity-20 cursor-pointer border-none"
                        >
                           <i className="pi pi-plus text-xs"></i>
                        </button>
                     </div>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 no-scrollbar pb-10">
                     {Array.isArray(user.notes?.[selectedStation!]) && [...user.notes[selectedStation!]].reverse().map((note: any, idx: number) => {
                        const originalIdx = user.notes[selectedStation!].length - 1 - idx;
                        const isEditing = editingNote?.index === originalIdx;
                        
                        return (
                          <div key={idx} className="bg-white border border-slate-100 rounded-[28px] p-5 relative group hover:shadow-md transition-all">
                             {isEditing ? (
                                <div className="space-y-3">
                                   <textarea 
                                      className="w-full bg-blue-50/30 border-2 border-blue-100 rounded-2xl p-4 text-xs font-bold text-blue-950 outline-none focus:border-blue-400 min-h-[100px] resize-none"
                                      value={editingNote.text}
                                      onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                                      autoFocus
                                   />
                                   <div className="flex justify-end gap-2">
                                      <button 
                                         onClick={cancelEditingNote}
                                         className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black border-none cursor-pointer hover:bg-slate-100"
                                      >إلغاء</button>
                                      <button 
                                         onClick={() => updateJournalNote(selectedStation!)}
                                         className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black border-none cursor-pointer hover:bg-blue-700 shadow-md shadow-blue-600/20"
                                      >حفظ التغيير</button>
                                   </div>
                                </div>
                             ) : (
                                <>
                                   <div className="flex justify-between items-center mb-3">
                                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                         {new Date(note.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                         {note.updatedAt && <span className="text-blue-300 text-[8px]">(معدل)</span>}
                                      </span>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                         <button 
                                            onClick={() => startEditingNote(originalIdx, note.text)}
                                            className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-blue-600 rounded-full border-none cursor-pointer transition-colors"
                                         >
                                            <i className="pi pi-pencil text-[10px]"></i>
                                         </button>
                                         <button 
                                            onClick={() => deleteJournalNote(selectedStation!, originalIdx)}
                                            className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-300 hover:text-rose-500 rounded-full border-none cursor-pointer transition-colors"
                                         >
                                            <i className="pi pi-trash text-[10px]"></i>
                                         </button>
                                      </div>
                                   </div>
                                   <p className="text-sm font-bold text-blue-950 leading-relaxed italic pr-2 border-r-4 border-blue-50/50">
                                      "{note.text}"
                                   </p>
                                </>
                             )}
                          </div>
                        );
                     })}
                     {(!user.notes?.[selectedStation!] || user.notes[selectedStation!].length === 0) && (
                        <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[32px] text-center">
                           <i className="pi pi-book text-4xl text-slate-100 mb-3 block"></i>
                           <p className="text-xs text-slate-300 font-bold italic">لم تدون أية خواطر بعد لهذه المحطة.</p>
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

      {/* Weekly Challenge Popup Dialog */}
      <Dialog
        visible={weeklyChallengeModalVisible}
        onHide={() => setWeeklyChallengeModalVisible(false)}
        header={
          <div className="flex items-center gap-3 text-blue-950 font-black pr-4 text-2xl font-sans" dir="rtl">
            <i className="pi pi-trophy text-amber-500 border-2 border-amber-950/10 p-1.5 rounded-lg"></i>
            <span className="font-black text-blue-950 tracking-tight">{weeklyChallengeName} 🏆</span>
          </div>
        }
        className="w-[98vw] max-w-4xl font-sans text-xl"
        closable
        dismissableMask
      >
        <AnimatePresence>
          {weeklyChallengeModalVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="space-y-6 pt-4 text-right font-sans" 
              dir="rtl"
            >
              <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/50 p-5 rounded-3xl border border-indigo-100/30 text-right">
                <h4 className="text-base font-black text-indigo-950 mb-1 flex items-center gap-2">
                  <i className="pi pi-compass text-indigo-600"></i>
                  <span>{weeklyChallengeName}</span>
                </h4>
                <p className="text-xs text-slate-500 font-bold leading-relaxed mb-4">
                  {weeklyChallengeRequired}
                </p>

                {/* Quick Task Add with Plus Icon inside the Modal */}
                <div className="bg-white/80 p-3.5 rounded-2xl border border-indigo-100/20 space-y-2">
                      <label className="text-sm font-black text-indigo-950 uppercase block">
                        أضف تحديات ومهام جديدة ➕:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 p-3 bg-white border border-slate-300 rounded-xl outline-none text-base font-medium text-indigo-950 focus:border-indigo-500 transition-all font-sans"
                          value={newWeeklyTaskTitle}
                          onChange={(e) => setNewWeeklyTaskTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') addWeeklyChallengeTask(); }}
                          placeholder="اكتب تحدي أو مهمة جديدة هنا..."
                          dir="rtl"
                        />
                        <button
                          type="button"
                          onClick={addWeeklyChallengeTask}
                          className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center border-none shadow-sm hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                          title="إضافة"
                        >
                          <i className="pi pi-plus text-lg font-bold"></i>
                        </button>
                      </div>
                </div>
              </div>

              <div>
                <h5 className="font-black text-sm text-blue-950 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <i className="pi pi-list text-blue-600 text-xs"></i>
                    <span>مهام وتحديات:</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {completedWeeklyTasks} / {totalWeeklyTasks}
                  </span>
                </h5>

                {weeklyChallengeTasks.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs border border-dashed">
                    ⚠️ أضف تحدياتك وابدأ فوراً.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
                    {weeklyChallengeTasks.map((t) => (
                      <div 
                        key={t.id} 
                        onClick={() => {
                          toggleWeeklyChallengeTask(t.id);
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                          t.isCompleted 
                            ? "bg-emerald-50/40 border-emerald-100/50" 
                            : "bg-white border-slate-100 hover:border-indigo-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            t.isCompleted 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {t.isCompleted && <i className="pi pi-check text-[10px] font-bold"></i>}
                          </div>
                          <span className={`text-[12px] font-bold leading-tight flex-1 truncate ${
                            t.isCompleted ? "text-slate-400 line-through" : "text-slate-700"
                          }`}>
                            {t.title}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => deleteWeeklyChallengeTask(t.id, e)}
                          className="p-1 px-2.5 rounded-lg text-[10px] text-red-400 font-bold hover:text-red-600 hover:bg-rose-50 border-none transition-colors cursor-pointer"
                          title="حذف المهمة"
                        >
                          حذف 🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 bg-indigo-50/50 border border-indigo-100/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <h6 className="font-black text-indigo-950 text-xs">مكافأة إتمام التحدي المخصص</h6>
                    <p className="text-[10px] text-indigo-500/80 mt-0.5">نقاط خبرة ثابتة عند إنجاز كافة المهام المخصصة</p>
                  </div>
                </div>
                <span className="text-lg font-black text-indigo-950 bg-white px-4 py-1.5 rounded-xl border border-indigo-50 shadow-xs">30 XP ثابتة</span>
              </div>

              {weeklyClaimed ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl font-bold text-center border border-emerald-100 flex items-center justify-center gap-2">
                  <i className="pi pi-verified text-lg"></i>
                  <span>✓ تمت المطالبة بالجائزة واستلام 30 XP بنجاح!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    label={isAllWeeklyTasksCompleted ? "المطالبة بالمكافأة واستلام 30 XP 🎁" : `أكمل كافة المهام للمطالبة بالجائزة (${completedWeeklyTasks}/${totalWeeklyTasks}) ⏳`}
                    disabled={!isAllWeeklyTasksCompleted}
                    onClick={claimWeeklyReward}
                    className={`w-full justify-center p-4 rounded-2xl font-black text-sm border-none shadow-md transition-all cursor-pointer ${
                      isAllWeeklyTasksCompleted 
                        ? "bg-gradient-to-r from-emerald-600 top-teal-700 text-white hover:brightness-110 active:scale-98" 
                        : "bg-slate-100 text-slate-400"
                    }`}
                  />
                </div>
              )}
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

      {/* PrimeReact Semi-circle SpeedDial Action Menu - 4 Combined Buttons */}
      <motion.div 
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex items-end justify-center w-20 h-20"
      >
        <SpeedDial 
          visible={dialVisible}
          onVisibleChange={(v) => {
            vibrate(HAPITCS.MAJOR_CLICK);
            setDialVisible(v);
          }}
          model={[
            {
              label: 'سجل التقييم 📝',
              command: () => {
                vibrate(HAPITCS.MAJOR_CLICK);
                setEvaluationSidebarVisible(true);
                setDialVisible(false);
              },
              template: (item: any, options: any) => (
                <div className="relative flex items-center justify-center w-14 h-14 cursor-pointer group" onClick={(e) => options.onClick(e)}>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max text-[11px] font-black bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none border border-white/10 z-50">
                    {item.label}
                  </div>
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-xl flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all text-xl border-2 border-white/40 ring-4 ring-indigo-500/10">
                    <i className="pi pi-list"></i>
                  </div>
                </div>
              )
            },
            {
              label: 'بوصلة الوضوح 🧭',
              command: () => {
                vibrate(HAPITCS.MAJOR_CLICK);
                setShowCompassPopup(true);
                setDialVisible(false);
              },
              template: (item: any, options: any) => (
                <div className="relative flex items-center justify-center w-14 h-14 cursor-pointer group" onClick={(e) => options.onClick(e)}>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max text-[11px] font-black bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none border border-white/10 z-50">
                    {item.label}
                  </div>
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-xl flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all text-xl border-2 border-white/40 ring-4 ring-purple-500/10">
                    <i className="pi pi-compass"></i>
                  </div>
                </div>
              )
            },
            {
              label: 'المحرك والجوائز 🏆',
              command: () => {
                vibrate(HAPITCS.MAJOR_CLICK);
                setGamificationSidebar(true);
                setDialVisible(false);
              },
              template: (item: any, options: any) => (
                <div className="relative flex items-center justify-center w-14 h-14 cursor-pointer group" onClick={(e) => options.onClick(e)}>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max text-[11px] font-black bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none border border-white/10 z-50">
                    {item.label}
                  </div>
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all text-xl border-2 border-white/40 ring-4 ring-orange-500/10">
                    <i className="pi pi-trophy"></i>
                  </div>
                </div>
              )
            },
            {
              label: 'تحليلات التقدم 📊',
              command: () => {
                vibrate(HAPITCS.MAJOR_CLICK);
                setReflectionActiveTab(1);
                setReflectionSidebar(true);
                setDialVisible(false);
              },
              template: (item: any, options: any) => (
                <div className="relative flex items-center justify-center w-14 h-14 cursor-pointer group" onClick={(e) => options.onClick(e)}>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max text-[11px] font-black bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 pointer-events-none border border-white/10 z-50">
                    {item.label}
                  </div>
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xl flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all text-xl border-2 border-white/40 ring-4 ring-emerald-500/10">
                    <i className="pi pi-chart-bar"></i>
                  </div>
                </div>
              )
            }
          ]}
          type="semi-circle"
          radius={120}
          direction="up"
          showIcon="pi pi-map"
          hideIcon="pi pi-times"
          buttonClassName="p-button-rounded !rounded-full bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 border-none w-24 h-24 shadow-[0_10px_40px_rgba(29,78,216,0.3)] hover:scale-105 active:scale-95 transition-all text-white text-3xl p-0 flex items-center justify-center shrink-0 ring-4 ring-white/20"
          buttonTemplate={(options) => {
            const energy = activeStationId ? stationEnergy[activeStationId] || 0 : 0;
            return (
              <button 
                onClick={options.onClick}
                className={`${options.className} relative flex flex-col items-center justify-center gap-1 overflow-hidden pointer-events-auto`}
              >
                {dialVisible ? (
                   <i className="pi pi-times text-2xl"></i>
                ) : (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] font-black">
                     <div className="flex items-center gap-0.5 text-amber-300">
                        <span>🪙</span>
                        <span>{gData.xp}</span>
                     </div>
                     <div className="flex items-center gap-0.5 text-blue-300">
                        <span>🧠</span>
                        <span>{gData.keys}</span>
                     </div>
                     <div className="flex items-center gap-0.5 text-rose-300">
                        <span>⛽</span>
                        <span>{gData.fuel}%</span>
                     </div>
                     <div className="flex items-center gap-0.5 text-emerald-300">
                        <span>⚡</span>
                        <span>{energy}%</span>
                     </div>
                     <div className="col-span-2 flex items-center justify-center mt-0.5">
                        <i className="pi pi-map text-xs text-white/50"></i>
                     </div>
                  </div>
                )}
                {/* Visual indicator for Energy in background of the button */}
                {!dialVisible && activeStationId && (
                   <div className="absolute inset-x-0 bottom-0 bg-blue-500/10" style={{ height: `${energy}%` }} />
                )}
              </button>
            )
          }}
        />
      </motion.div>
    </motion.div>
);
}
