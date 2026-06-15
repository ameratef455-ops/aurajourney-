import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS, playTickSound } from "../lib/haptics";
import { db } from "../db";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { Sidebar } from "primereact/sidebar";
import { useLiveQuery } from "dexie-react-hooks";
import { toast as toastHot } from "react-hot-toast";
import { NotificationsPopover } from "./NotificationsPopover";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskEditorModal } from "./TaskEditorModal";
import { Plus, User, LogOut, Settings as SettingsIcon, Share2, Download, X, Compass, Sparkles } from "lucide-react";
import { GrowthTree } from "./GrowthTree";
import confetti from "canvas-confetti";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const handleInstallPWA = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    alert("Install PWA requested. (Will prompt if PWA criteria are met)");
  };

  const handleExportData = async (type: 'gamification' | 'journeys' | 'system') => {
    try {
      let data: any = {};
      const filename = `via_${type}_export_${new Date().toISOString().slice(0,10)}.json`;

      if (type === 'gamification') {
        // Gamification includes EVERYTHING: journeys + settings + system
        const settings = await db.userSettings.toArray();
        const stations = await db.stations.toArray();
        const tasks = await db.tasks.toArray();
        const reflections = await db.reflections.toArray();
        const stumbles = await db.stumbles.toArray();
        data = { 
          settings, 
          stations, 
          tasks, 
          reflections, 
          stumbles,
          exportType: 'full_gamification_backup'
        };
      } else if (type === 'journeys') {
        // Journeys includes stations, tasks, and setup wizard details
        const stations = await db.stations.toArray();
        const tasks = await db.tasks.toArray();
        const settings = await db.userSettings.toArray();
        
        // Extract setup wizard details from settings
        const wizardDetails = settings.map(s => ({
          learningGoal: s.learningGoal,
          psychology: s.psychology,
          unlockedStationIds: s.unlockedStationIds,
          subStations: s.subStations
        }));

        data = { 
          stations, 
          tasks, 
          wizardDetails,
          exportType: 'detailed_journeys'
        };
      } else {
        const reflections = await db.reflections.toArray();
        const stumbles = await db.stumbles.toArray();
        const notifications = await db.notifications.toArray();
        data = { reflections, stumbles, notifications };
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toastHot.success(`تم تصدير ملف ${type} بنجاح!`);
    } catch (err) {
      toastHot.error("فشل تصدير البيانات");
    }
  };

  return (
    <Sidebar 
      visible={isOpen} 
      onHide={onClose} 
      position="left"
      className="w-full md:w-80 font-sans bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white border-r border-indigo-500/20 shadow-2xl custom-left-sidebar"
      header={
        <div className="flex items-center gap-3 text-white font-black">
          <i className="pi pi-user p-2 bg-white/10 rounded-lg text-blue-200 text-sm"></i>
          البروفايل والاعدادات
        </div>
      }
    >
      <div className="flex flex-col gap-3 py-2 pr-2 pl-4" dir="rtl">
        
        {/* Profile Card */}
        <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl mb-2">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black">
            <User className="w-5 h-5 pointer-events-none" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm">أهلاً بك!</h3>
            <p className="text-[10px] font-bold text-slate-400">بياناتك محفوظة محلياً</p>
          </div>
        </div>

        {/* Buttons */}
        <button
          onClick={handleInstallPWA}
          className="flex items-center justify-center gap-4 w-full p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/10 transition-all active:scale-95 text-right outline-none cursor-pointer group shadow-sm"
        >
          <span className="font-bold text-sm text-slate-200 font-sans tracking-wide flex-1 text-center">تثبيت التطبيق</span>
          <Download className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={() => {
            vibrate(HAPITCS.MAJOR_CLICK);
            const appUrl = window.location.origin;
            if (navigator.share) {
              navigator.share({
                title: "VIA",
                text: "انضم إلي في رحلتي التعليمية والتطبيقية على VIA! 🚀",
                url: appUrl,
              }).catch(console.error);
            } else {
              navigator.clipboard.writeText(appUrl);
              toastHot.success("تم نسخ رابط التطبيق! 🔗");
            }
          }}
          className="flex items-center justify-center gap-4 w-full p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/10 transition-all active:scale-95 text-right outline-none cursor-pointer group shadow-sm"
        >
          <span className="font-bold text-sm text-slate-200 font-sans tracking-wide flex-1 text-center">مشاركة العمل</span>
          <Share2 className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
        </button>

        <div className="h-0.5 bg-white/10 my-2 rounded-full w-full" />

        <h3 className="text-xs font-black text-indigo-300 px-2 uppercase tracking-wider">تصدير البيانات</h3>
        
        <button
          onClick={() => handleExportData('journeys')}
          className="flex items-center gap-4 w-full p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/10 transition-all active:scale-95 text-right outline-none cursor-pointer group"
        >
          <Compass className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-xs text-slate-200 font-sans">تصدير الرحلات</span>
        </button>

        <button
          onClick={() => handleExportData('gamification')}
          className="flex items-center gap-4 w-full p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/10 transition-all active:scale-95 text-right outline-none cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-xs text-slate-200 font-sans">تصدير Gamification</span>
        </button>

        <button
          onClick={() => handleExportData('system')}
          className="flex items-center gap-4 w-full p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/80 border border-white/10 transition-all active:scale-95 text-right outline-none cursor-pointer group"
        >
          <SettingsIcon className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-xs text-slate-200 font-sans">تصدير النظام</span>
        </button>

      </div>
    </Sidebar>
  );
}

const getTripIcon = (goal: string) => {
  const g = goal.toLowerCase();
  if (g.includes('لغة') || g.includes('language') || g.includes('إنجليزي') || g.includes('english')) return 'pi-book';
  if (g.includes('برمجة') || g.includes('code') || g.includes('programming') || g.includes('تطوير')) return 'pi-code';
  if (g.includes('رسم') || g.includes('art') || g.includes('تصميم') || g.includes('design')) return 'pi-palette';
  if (g.includes('طبخ') || g.includes('cook') || g.includes('طعام')) return 'pi-apple';
  if (g.includes('رياضة') || g.includes('sport') || g.includes('جيم') || g.includes('صح')) return 'pi-heart-fill';
  if (g.includes('موسيقى') || g.includes('music') || g.includes('عزف')) return 'pi-volume-up';
  return 'pi-map';
};

function TripsList({ onEdit, onOpen }: { onEdit: (id: string) => void; onOpen: (id: string) => void }) {
  const trips = useLiveQuery(() => db.userSettings.toArray());
  const allStations = useLiveQuery(() => db.stations ? db.stations.orderBy('order').toArray() : []) || [];
  
  const [activeMenuTripId, setActiveMenuTripId] = useState<string | null>(null);
  const [deleteTripId, setDeleteTripId] = useState<string | null>(null);
  const [freezeConfirmTrip, setFreezeConfirmTrip] = useState<any | null>(null);
  const [resetTrip, setResetTrip] = useState<any | null>(null);
  const [resetMode, setResetMode] = useState<"all" | "selected">("all");
  const [selectedResetStations, setSelectedResetStations] = useState<string[]>([]);

  if (!trips || trips.length === 0) return null;

  const handleDeleteConfirm = async () => {
    if (deleteTripId) {
      await db.userSettings.delete(deleteTripId);
      await db.stations.clear(); // Clear stations
      await db.tasks.clear(); // Clear tasks too
      setDeleteTripId(null);
      window.location.reload();
    }
  };

  const handleResetConfirm = async () => {
    if (!resetTrip) return;
    vibrate(HAPITCS.MAJOR_CLICK);
    playTickSound();

    if (resetMode === "all") {
      const allTasks = await db.tasks.toArray();
      await Promise.all(allTasks.map(t => (db.tasks as any).update(t.id, { isCompleted: false, activities: [] })));
      await db.reflections.clear();
      await db.stumbles.clear();

      const firstStation = allStations && allStations.length > 0 ? allStations[0] : null;
      const newUnlocked = firstStation ? [firstStation.id] : [];
      
      await db.userSettings.update(resetTrip.id, {
        isVacation: false,
        gameData: { fuel: 100, xp: 0, keys: 0, lastReflectionDate: "", streak: 0 },
        unlockedStationIds: newUnlocked,
        subStations: {}, // Clear all practical sub-stations
        timeCapsules: {}, // Keep time capsules or clear? Better clear entirely.
        notes: {}
      });
      toastHot.success("تم تصفير الرحلة بالكامل بنجاح!");
    } else {
      if (selectedResetStations.length === 0) return;
      
      for (const stId of selectedResetStations) {
         const stTasks = await db.tasks.where("stationId").equals(stId).toArray();
         await Promise.all(stTasks.map(t => (db.tasks as any).update(t.id, { isCompleted: false, activities: [] })));
         // Also clear reflections and stumbles for selected stations
         await db.reflections.where("stationId").equals(stId).delete();
         await db.stumbles.where("stationId").equals(stId).delete();
      }

      const firstStation = allStations && allStations.length > 0 ? allStations[0] : null;
      const currentUnlocked = resetTrip.unlockedStationIds || [];
      const newUnlocked = currentUnlocked.filter((id: string) => !selectedResetStations.includes(id) || id === firstStation?.id);
      
      // Make sure first is always unlocked
      if (firstStation && !newUnlocked.includes(firstStation.id)) {
        newUnlocked.push(firstStation.id);
      }
      
      const newSubStations = { ...(resetTrip.subStations || {}) };
      for (const stId of selectedResetStations) {
         delete newSubStations[stId];
      }

      await db.userSettings.update(resetTrip.id, {
        isVacation: false,
        gameData: { ...resetTrip.gameData, fuel: 100 },
        unlockedStationIds: Array.from(new Set(newUnlocked)),
        subStations: newSubStations
      });
      toastHot.success("تم تصفير الخطط المحددة بنجاح!");
    }

    setResetTrip(null);
    setSelectedResetStations([]);
    setResetMode("all");
    
    // Slight delay so they can see the toast
    setTimeout(() => {
        window.location.reload();
    }, 1200);
  };

  const handleToggleFreeze = async (trip: any) => {
    vibrate(HAPITCS.MAJOR_CLICK);
    const currentlyFrozen = !!trip.isFrozen;
    const updates: any = {
      isFrozen: !currentlyFrozen
    };
    
    if (currentlyFrozen) {
      // Unfreeze: set lastReflectionDate to yesterday so streak restarts correctly
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      if (trip.gameData) {
        updates.gameData = {
          ...trip.gameData,
          lastReflectionDate: yesterdayStr
        };
      }
    }
    
    await db.userSettings.update(trip.id, updates);
  };

  const startEdit = (trip: any) => {
    onEdit(trip.id);
  };

  return (
    <div className="w-full max-w-2xl mt-8 mx-auto" dir="rtl">
      <div className="flex justify-center mb-8 mt-12">
         <span className="px-8 py-3 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-full font-black text-sm shadow-lg flex items-center gap-3 border border-white/20">
            <i className="pi pi-compass text-lg animate-spin" style={{ animationDuration: '4s' }}></i>
            الرحلات النشطة الحالية
         </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map((trip) => {
          const isFrozen = !!trip.isFrozen;
          const isVacation = !!trip.isVacation;
          
          let cardOuterClass = "bg-gradient-to-br from-blue-800 via-indigo-700 to-blue-950 shadow-2xl shadow-blue-900/20 hover:shadow-blue-500/40 active:scale-[0.98]";
          if (isFrozen) cardOuterClass = "bg-gradient-to-br from-[#22d3ee] via-[#38bdf8] to-[#2563eb] shadow-[0_0_25px_rgba(34,211,238,0.25)] hover:shadow-cyan-400/50 border border-cyan-300/20";
          if (isVacation) cardOuterClass = "bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-emerald-400/50 border border-emerald-300/30";

          let cardInnerClass = "bg-gradient-to-br from-blue-900/90 to-blue-950";
          if (isFrozen) cardInnerClass = "bg-gradient-to-br from-slate-900/95 via-sky-950/90 to-[#0c1830]/95";
          if (isVacation) cardInnerClass = "bg-gradient-to-br from-emerald-950/95 via-teal-900/95 to-cyan-950/95";

          return (
            <div
              key={trip.id}
              onClick={() => onOpen(trip.id)}
              className={`group relative p-[1px] rounded-3xl transition-all duration-500 cursor-pointer aspect-square flex w-full overflow-hidden ${cardOuterClass}`}
            >
              {/* Glow Effect Layer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />
              
              <div 
                className={`p-6 rounded-[23px] flex flex-col justify-between items-center text-center w-full h-full relative overflow-hidden backdrop-blur-sm ${cardInnerClass}`}
              >
                {/* Decorative elements */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-400/30 transition-all duration-500" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-400/30 transition-all duration-500" />

                {/* Frozen/Vacation Badge */}
                {isFrozen && (
                  <div className="absolute top-4 right-4 bg-cyan-950/80 border border-cyan-400/30 px-2.5 py-1 rounded-full text-[9px] font-black text-cyan-300 flex items-center gap-1.5 z-20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>❄️ رحلة مجمدة</span>
                  </div>
                )}
                {isVacation && (
                  <div className="absolute top-4 right-4 bg-emerald-950/80 border border-emerald-400/30 px-2.5 py-1 rounded-full text-[9px] font-black text-emerald-300 flex items-center gap-1.5 z-20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>🌴 فى أجازة</span>
                  </div>
                )}

                {/* Three dots absolute position */}
                <div 
                  className="absolute top-4 left-4 z-30" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 text-white/70 transition border border-white/10 cursor-pointer shadow-lg"
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setActiveMenuTripId(activeMenuTripId === trip.id ? null : trip.id);
                    }}
                    title="خيارات"
                  >
                    <i className="pi pi-ellipsis-v text-xs"></i>
                  </button>
                  <AnimatePresence>
                  {activeMenuTripId === trip.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenuTripId(null)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute left-0 mt-2 w-44 bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl z-20 py-2 text-right overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            startEdit(trip);
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-white hover:bg-white/10 transition border-none bg-transparent font-bold cursor-pointer"
                        >
                          <i className="pi pi-pencil text-indigo-400"></i>
                          <span>تعديل المحطات</span>
                        </button>
                        <div className="h-px bg-white/5 mx-2" />
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            setResetTrip(trip);
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-amber-500 hover:bg-white/10 transition border-none bg-transparent font-bold cursor-pointer"
                        >
                          <i className="pi pi-refresh text-amber-400"></i>
                          <span>ابدأ الرحلة من جديد</span>
                        </button>
                        <div className="h-px bg-white/5 mx-2" />
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            setFreezeConfirmTrip(trip);
                          }}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition border-none bg-transparent font-bold cursor-pointer ${
                            isFrozen ? "text-emerald-400 hover:bg-white/10" : "text-cyan-400 hover:bg-white/10"
                          }`}
                        >
                          <i className={`pi ${isFrozen ? 'pi-play' : 'pi-stop-circle'} ${isFrozen ? 'text-emerald-400' : 'text-cyan-400'}`}></i>
                          <span>{isFrozen ? "إلغاء التجميد" : "تجميد الرحلة"}</span>
                        </button>
                        <div className="h-px bg-white/5 mx-2" />
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            setDeleteTripId(trip.id);
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-rose-500 hover:bg-white/10 transition border-none bg-transparent font-bold cursor-pointer"
                        >
                          <i className="pi pi-trash text-rose-400"></i>
                          <span>حذف الرحلة</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                  </AnimatePresence>
                </div>

                {/* Trip Icon / Visual with Glow */}
                <div className={`mt-4 w-20 h-20 rounded-2xl bg-white flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10 ${
                  isFrozen ? "shadow-[0_0_20px_rgba(34,211,238,0.4)] border border-cyan-200" : "shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                }`}>
                  <i className={`pi ${getTripIcon(trip.learningGoal)} text-3xl ${isFrozen ? 'text-cyan-600' : 'text-blue-900'}`}></i>
                </div>

                {/* Learning Goal */}
                <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 relative z-10">
                  <span className="font-black text-white text-xl md:text-2xl leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {trip.learningGoal}
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        baseZIndex={30000}
        header={
          <div
            className="flex items-center gap-2 text-rose-600 font-extrabold pr-4 text-2xl"
            dir="rtl"
          >
            ⚠️ تأكيد الحذف
          </div>
        }
        visible={!!deleteTripId}
        onHide={() => setDeleteTripId(null)}
        className="w-[98vw] max-w-sm font-sans mx-4 text-xl"
        closable
        dismissableMask
      >
        <div className="space-y-6 pt-2 text-right font-sans" dir="rtl">
          <p className="text-xl font-medium text-blue-950 leading-relaxed">
            هل أنت متأكد من حذف هذه الرحلة نهائياً؟
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              label="تراجع"
              className="p-button-text text-gray-500 font-bold text-lg"
              onClick={() => setDeleteTripId(null)}
            />
            <Button
              label="نعم، احذف"
              className="bg-rose-600 border-none text-white font-bold px-4 py-2.5 rounded-xl text-lg"
              onClick={handleDeleteConfirm}
            />
          </div>
        </div>
      </Dialog>

      {/* Freeze Confirmation Dialog */}
      <Dialog
        baseZIndex={30500}
        header={
          <div
            className={`flex items-center gap-2 font-extrabold pr-4 text-2xl ${
              freezeConfirmTrip?.isFrozen ? "text-emerald-500" : "text-cyan-500"
            }`}
            dir="rtl"
          >
            {freezeConfirmTrip?.isFrozen ? "🔥 تفعيل السعي" : "❄️ تجميد السلسلة"}
          </div>
        }
        visible={!!freezeConfirmTrip}
        onHide={() => setFreezeConfirmTrip(null)}
        className="w-[98vw] max-w-sm font-sans mx-4 text-xl"
        closable
        dismissableMask
      >
        <div className="space-y-6 pt-2 text-right font-sans" dir="rtl">
          <p className="text-xl font-semibold text-blue-950 leading-relaxed">
            {freezeConfirmTrip?.isFrozen
              ? "هل أنت متأكد من إلغاء تجميد هذه الرحلة واستعادة طاقتها وسعيك الإيجابي؟"
              : "هل أنت متأكد من تجميد هذه الرحلة؟ سيتم الحفاظ على إحصائياتك والستريك لتجنب خسارتها لغاية إلغاء التجميد."}
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              label="تراجع"
              className="p-button-text text-gray-500 font-bold text-lg cursor-pointer hover:bg-slate-50 rounded-xl"
              onClick={() => setFreezeConfirmTrip(null)}
            />
            <Button
              label={freezeConfirmTrip?.isFrozen ? "نعم، إلغاء التجميد 🔥" : "نعم، تجميد ❄️"}
              className={`${
                freezeConfirmTrip?.isFrozen ? "bg-emerald-600 hover:bg-emerald-700 hover:brightness-110" : "bg-cyan-600 hover:bg-cyan-700 hover:brightness-110"
              } border-none text-white font-bold px-4 py-2.5 rounded-xl text-lg cursor-pointer transition-all`}
              onClick={async () => {
                if (freezeConfirmTrip) {
                  await handleToggleFreeze(freezeConfirmTrip);
                  setFreezeConfirmTrip(null);
                }
              }}
            />
          </div>
        </div>
      </Dialog>

      {/* Reset Journey Dialog */}
      <Dialog
        baseZIndex={30500}
        header={
          <div className="flex items-center gap-3 font-extrabold pr-4 text-2xl text-blue-400 drop-shadow-md" dir="rtl">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
               <i className="pi pi-refresh text-xl text-blue-300"></i>
            </div>
            بدء الرحلة من جديد
          </div>
        }
        visible={!!resetTrip}
        onHide={() => {
            setResetTrip(null);
            setResetMode("all");
            setSelectedResetStations([]);
        }}
        className="w-[98vw] max-w-lg font-sans mx-4 border-none shadow-[0_0_50px_rgba(14,165,233,0.3)] bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl overflow-hidden"
        contentStyle={{ background: 'transparent', color: 'white' }}
        headerStyle={{ background: 'transparent', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        closable
        dismissableMask
      >
        <div className="space-y-6 pt-5 text-right font-sans" dir="rtl">
          <p className="text-[15px] font-medium text-blue-100/90 leading-relaxed drop-shadow-sm">
            حدد نطاق التصفير؛ هل ترغب في تهيئة الرحلة بالكامل للبدء من نقطة الصفر، أم تفضل اختيار محطات محددة لإعادة المحاولة فيها؟
          </p>

          <div className="space-y-4 mb-6 relative">
            <label className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-300 ${resetMode === 'all' ? 'bg-blue-500/10 border-blue-400/50 shadow-inner glow' : 'hover:bg-white/5 border-white/10'}`}>
                <input 
                  type="radio" 
                  name="resetMode" 
                  value="all"
                  checked={resetMode === "all"}
                  onChange={() => { playTickSound(); setResetMode("all"); }}
                  className="w-5 h-5 text-blue-500 cursor-pointer accent-blue-500"
                />
                <div>
                   <p className="font-bold text-sm text-white">تصفير الرحلة بالكامل</p>
                   <p className="text-xs text-blue-200/70 mt-1.5">مسح شامل لجميع إنجازاتك والبدء بطاقة ومستوى جديدين كلياً.</p>
                </div>
            </label>

            <label className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition-all duration-300 ${resetMode === 'selected' ? 'bg-blue-500/10 border-blue-400/50 shadow-inner glow' : 'hover:bg-white/5 border-white/10'}`}>
                <input 
                  type="radio" 
                  name="resetMode" 
                  value="selected"
                  checked={resetMode === "selected"}
                  onChange={() => { playTickSound(); setResetMode("selected"); }}
                  className="w-5 h-5 text-blue-500 cursor-pointer accent-blue-500"
                />
                <div>
                   <p className="font-bold text-sm text-white">تصفير خطط ومحطات محددة</p>
                   <p className="text-xs text-blue-200/70 mt-1.5">اختر محطات معينة لمسح مهامها وتحليلاتها وتجربة إنجازها مجدداً.</p>
                </div>
            </label>
          </div>

          {resetMode === "selected" && allStations.length > 0 && (
             <div className="bg-black/20 rounded-2xl p-5 max-h-56 overflow-y-auto mb-4 border border-white/5 backdrop-blur-md shadow-inset">
                <p className="text-xs font-bold text-blue-300/80 mb-4 block uppercase tracking-wider">حدد المحطات المراد تصفيرها:</p>
                <div className="space-y-2">
                   {allStations.map((st: any) => (
                      <label key={st.id} className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-3 rounded-xl transition-colors border border-transparent hover:border-white/10">
                        <input 
                           type="checkbox"
                           className="w-4 h-4 cursor-pointer accent-blue-400"
                           checked={selectedResetStations.includes(st.id)}
                           onChange={(e) => {
                             playTickSound();
                             if (e.target.checked) setSelectedResetStations([...selectedResetStations, st.id]);
                             else setSelectedResetStations(selectedResetStations.filter(id => id !== st.id));
                           }}
                        />
                        <div className="flex items-center gap-3">
                           <span className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-300 border border-blue-500/20">
                             <i className={`pi ${st.icon || 'pi-map-marker'} text-[10px]`}></i>
                           </span>
                           <span className="text-sm font-bold text-blue-50 drop-shadow-sm">{st.name}</span>
                        </div>
                      </label>
                   ))}
                </div>
             </div>
          )}

          <div className="flex gap-4 justify-end pt-4 border-t border-white/5 mt-6">
            <Button
              label="تراجع"
              className="p-button-text text-blue-200/60 font-bold text-sm cursor-pointer hover:text-white hover:bg-white/5 rounded-xl px-5 py-3 border-none bg-transparent transition-all"
              onClick={() => {
                setResetTrip(null);
                setResetMode("all");
                setSelectedResetStations([]);
              }}
            />
            <Button
              label="تأكيد التصفير وبدء السعي 🔥"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-black px-6 py-3 rounded-xl text-sm cursor-pointer transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
              onClick={handleResetConfirm}
              disabled={resetMode === "selected" && selectedResetStations.length === 0}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

interface LandingProps {
  onStart: () => void;
  onEdit: (tripId: string) => void;
  onOpen: (tripId: string) => void;
}

export function Landing({ onStart, onEdit, onOpen }: LandingProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menu = useRef<Menu>(null);

  const [isReviewDialogVisible, setIsReviewDialogVisible] = useState(false);
  const [selectedReviewTripId, setSelectedReviewTripId] = useState<string>("");
  const [selectedReviewTaskId, setSelectedReviewTaskId] = useState<string>("");
  const [createdReviewPlans, setCreatedReviewPlans] = useState<any[]>([]);
  const [reviewDetailsVisible, setReviewDetailsVisible] = useState(false);
  const [reviewDetailsTaskId, setReviewDetailsTaskId] = useState<string | null>(null);

  const allAvailableTasks = useLiveQuery(() => db.tasks.toArray()) || [];

  const trips = useLiveQuery(() => db.userSettings.toArray()) || [];
  
  // Get data for the tree from the first trip if available
  const mainTrip = trips[0];
  const treeXp = mainTrip?.gameData?.xp || 0;
  const treeKeys = mainTrip?.gameData?.keys || 0;

  const handleStart = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    onStart();
  };

  const handleSettings = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setSettingsOpen(true);
  };

  const handleCreateReviewPlans = async () => {
    if (!selectedReviewTripId || !selectedReviewTaskId) return;
    vibrate(HAPITCS.COMPLETE);
    
    const selectedTask = allAvailableTasks.find(t => t.id === selectedReviewTaskId);
    const taskTitle = selectedTask ? selectedTask.title : "المهمة الأساسية";

    // Get station ID to attach to
    const stationsList = await db.stations.toArray();
    const stationId = selectedTask?.stationId || stationsList[0]?.id || "review-station";

    const plan1Id = "rev-1-" + Date.now();
    const plan2Id = "rev-2-" + Date.now();
    const plan3Id = "rev-3-" + Date.now();

    const plan1 = {
      id: plan1Id,
      stationId,
      title: `المراجعة 1: الفهم الاستيعابي والتدوين الجريء لـ (${taskTitle}) 🧠`,
      type: "main" as const,
      isCompleted: false,
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      description: `تركز هذه الخطة الأولى على جلاء الغموض والاستدعاء النشط للمفاهيم الأساسية والأفكار الجوهرية الخاصة بمهارة "${taskTitle}" لكسر سرعة منحنى النسيان.`,
      learningResources: selectedTask?.learningResources || "كتيب الملاحظات والروابط المنظمة المضافة.",
      youtubeUrl: selectedTask?.youtubeUrl || "",
      googleDriveUrl: selectedTask?.googleDriveUrl || "",
      youglishKeyword: selectedTask?.youglishKeyword || "",
      activities: [
        {
          id: "act-1-1-" + Date.now(),
          title: "جلسة التدوين الذهبي والاستذكار الفعال غيباً",
          duration: 15,
          isCompleted: false,
          steps: [{ id: "step-1-1-1", title: "كتابة الخلاصة المفاهيمية الأساسية للموضوع غيباً تماماً ومقارنتها بالمرجع", isCompleted: false }]
        },
        {
          id: "act-1-2-" + Date.now(),
          title: "تفنيد ومراجعة الكروت وحل الأسئلة المربكة",
          duration: 15,
          isCompleted: false,
          steps: [{ id: "step-1-2-1", title: "فحص 5 كروت ومكافحة الالتباس في المفاهيم المقاومة", isCompleted: false }]
        }
      ]
    };

    const plan2 = {
      id: plan2Id,
      stationId,
      title: `المراجعة 2: التلميع التطبيقي وصقل المنتج التنفيذي لـ (${taskTitle}) 🛠️`,
      type: "main" as const,
      isCompleted: false,
      dueDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
      description: `تهدف هذه الخطة العملية لتفقد المخرجات التشغيلية وصناعة مخرجات عملية صلبة تؤكد تمكنك التام من تطبيق "${taskTitle}".`,
      learningResources: selectedTask?.learningResources || "مجلد المشاريع والتمرينات التطبيقية للمحطة السابقة.",
      youtubeUrl: selectedTask?.youtubeUrl || "",
      googleDriveUrl: selectedTask?.googleDriveUrl || "",
      youglishKeyword: selectedTask?.youglishKeyword || "",
      activities: [
        {
          id: "act-2-1-" + Date.now(),
          title: "إعادة بناء وتحديث الكود أو المخرج السابق وتجويده",
          duration: 25,
          isCompleted: false,
          steps: [{ id: "step-2-1-1", title: "مراجعة الكفاءة وتعديل عيوب التشغيل والسرعة مع إثبات فاعليتها", isCompleted: false }]
        },
        {
          id: "act-2-2-" + Date.now(),
          title: "الممارسة الإضافية أو إدخال تحسين ذكي ذو أولوية",
          duration: 20,
          isCompleted: false,
          steps: [{ id: "step-2-2-1", title: "إضافة لمسة إبداعية جديدة تثبت السيطرة المطلقة على النماذج", isCompleted: false }]
        }
      ]
    };

    const plan3 = {
      id: plan3Id,
      stationId,
      title: `المراجعة 3: تدوين الدروس والتمكين الأسبوعي والأثر لـ (${taskTitle}) 🌟`,
      type: "main" as const,
      isCompleted: false,
      dueDate: new Date(Date.now() + 259200000).toISOString().slice(0, 10),
      description: `مخصصة لتقييم الوعي بالصعوبات، غلق ملف مراجعة "${taskTitle}" وحصاد الجهد وتعديل المسار بمزيد من الثقة.`,
      learningResources: selectedTask?.learningResources || "استمارة غلق الفجوات المعرفية وملاحظات التفكر.",
      youtubeUrl: selectedTask?.youtubeUrl || "",
      googleDriveUrl: selectedTask?.googleDriveUrl || "",
      youglishKeyword: selectedTask?.youglishKeyword || "",
      activities: [
        {
          id: "act-3-1-" + Date.now(),
          title: "تفكر ذاتي متعمق وكتابة استبصار الدروس",
          duration: 15,
          isCompleted: false,
          steps: [{ id: "step-3-1-1", title: "تسجيل فقرة واحدة متينة في سعي اليوم تلخص أين أجدت وأين تعثرت", isCompleted: false }]
        },
        {
          id: "act-3-2-" + Date.now(),
          title: "قياس الفروقات الفردية واختبار التمكين الذاتي النهائي",
          duration: 10,
          isCompleted: false,
          steps: [{ id: "step-3-2-1", title: "تعبئة مقياس الإتقان الروحي والموضوعي لـ 10 درجات وتأكيد غلق المحطة", isCompleted: false }]
        }
      ]
    };

    await db.tasks.put(plan1);
    await db.tasks.put(plan2);
    await db.tasks.put(plan3);

    // Give a gamification surprise! +35 XP
    const mainSettings = await db.userSettings.toArray();
    const userToAward = mainSettings[0];
    if (userToAward && userToAward.gameData) {
      const updatedXp = (userToAward.gameData.xp || 0) + 35; // +35 XP bonus for starting a review plan
      await db.userSettings.update(userToAward.id, {
        gameData: { ...userToAward.gameData, xp: updatedXp }
      } as any);
    }

    setCreatedReviewPlans([plan1, plan2, plan3]);
    confetti({ zIndex: 999999999, particleCount: 150, spread: 80, origin: { y: 0.6 } });
    toastHot.success("تم تشييد خطط المراجعة الثلاث بنجاح! 🚀 (+35 XP)");
  };

  const menuItems = [
    {
      label: 'اصنع رحلتك',
      icon: 'pi pi-map',
      template: (item: any, options: any) => {
        return (
          <button 
            onClick={(e) => {
              vibrate(HAPITCS.MAJOR_CLICK);
              options.onClick(e);
            }} 
            className="w-full flex items-center justify-between gap-4 p-4 mb-2 bg-gradient-to-r from-blue-800 to-blue-950 text-white rounded-2xl border-none cursor-pointer hover:brightness-110 transition-all font-sans"
          >
            <span className="text-sm font-black tracking-tight">{item.label}</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <i className={`${item.icon} text-xs`}></i>
            </div>
          </button>
        )
      },
      command: handleStart
    }
  ];

  return (
    <div className="w-full max-h-[85vh] overflow-y-auto py-12 px-6 flex flex-col items-center justify-start text-center z-10 space-y-12 max-w-2xl relative scroll-smooth no-scrollbar">
      <header className="fixed top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-40 bg-white/80 backdrop-blur-md border-b border-slate-100" dir="rtl">
        <div className="flex-1 flex justify-start pl-2">
        </div>
        
        <div className="flex-none flex justify-center items-center gap-3 md:gap-4">
            <div className="flex flex-col items-start px-2">
              <h1 className="text-2xl md:text-3xl font-fredoka tracking-wide text-blue-950 font-black leading-none" dir="ltr">
                 VIA
              </h1>
              <span className="text-xs md:text-sm text-indigo-800 font-extrabold mt-0.5 tracking-wider" style={{ fontFamily: 'Tajawal, sans-serif' }}>رحلة حياة</span>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 border-2 border-blue-900 flex items-center justify-center rounded-full bg-white shadow-sm overflow-hidden p-2.5 shrink-0">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-blue-900">
                <circle cx="12" cy="6" r="2.5" fill="currentColor" />
                <circle cx="6" cy="18" r="2.5" fill="currentColor" />
                <circle cx="18" cy="18" r="2.5" fill="currentColor" />
                <path d="M12 8.5L7.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 8.5L16.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M8.5 18H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
           
           <div className="flex items-center gap-2 md:gap-4 shrink-0 pr-4">
             <Menu model={menuItems} popup ref={menu} id="create_menu" className="font-sans text-xs font-bold rounded-3xl shadow-2xl border-none bg-transparent p-0 overflow-visible" />
             <button
               onClick={(e) => {
                 vibrate(HAPITCS.MAJOR_CLICK);
                 menu.current?.toggle(e);
               }}
               className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gradient-to-r from-blue-800 to-blue-950 text-white rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer"
             >
               <Plus className="w-6 h-6" />
             </button>
             
             <div className="hidden md:block h-6 w-px bg-slate-200"></div>

             <div className="hidden md:block">
               <NotificationsPopover className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-blue-900 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer" />
             </div>

             <button
               onClick={handleSettings}
               className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 cursor-pointer shadow-sm"
               title="الملف الشخصي"
             >
               <User className="w-5 h-5 md:w-6 md:h-6" />
             </button>
           </div>
        </div>
      </header>
 
      <div className="pt-24 md:pt-32 w-full">
        {/* Growth Tree Visualizer on Landing */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-sm mx-auto mb-4"
        >
           <GrowthTree xp={treeXp} keys={treeKeys} />
        </motion.div>

        {/* Gamification Stats Dashboard */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
           className="w-full max-w-sm mx-auto mb-10 flex gap-4 bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] shadow-[0_10px_30px_rgba(37,99,235,0.15)]"
           dir="rtl"
        >
           <div className="flex-1 flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/10 transition-all cursor-default">
              <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-2 shadow-inner group-hover:rotate-12 transition-transform border border-indigo-500/30">
                <i className="pi pi-star-fill text-lg drop-shadow-sm"></i>
              </div>
              <span className="font-extrabold text-2xl text-white font-mono tracking-tight">{Math.floor(treeXp / 100) + 1}</span>
              <span className="text-[10px] font-black text-indigo-300 uppercase mt-1">المستوى</span>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/10 transition-all cursor-default">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform border border-amber-500/30">
                <i className="pi pi-bolt text-lg drop-shadow-sm"></i>
              </div>
              <span className="font-extrabold text-2xl text-white font-mono tracking-tight">{treeXp}</span>
              <span className="text-[10px] font-black text-amber-300 uppercase mt-1">نقاط المعرفة</span>
           </div>

           <div className="flex-1 flex flex-col items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group hover:bg-white/10 transition-all cursor-default">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-2 shadow-inner group-hover:-rotate-12 transition-transform border border-emerald-500/30">
                <i className="pi pi-key text-lg drop-shadow-sm"></i>
              </div>
              <span className="font-extrabold text-2xl text-white font-mono tracking-tight">{treeKeys}</span>
              <span className="text-[10px] font-black text-emerald-300 uppercase mt-1">المفاتيح</span>
           </div>
        </motion.div>

        {/* Level Progress Bar */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.2 }}
           className="w-full max-w-sm mx-auto mb-6 bg-gradient-to-br from-[#020617] via-slate-900 to-indigo-950 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-[0_10px_30px_rgba(37,99,235,0.15)] text-right"
           dir="rtl"
        >
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">التقدم نحو المستوى {Math.floor(treeXp / 100) + 2}</span>
              <span className="text-xs font-bold font-mono text-indigo-400">{treeXp % 100} / 100</span>
           </div>
           <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${treeXp % 100}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
               />
           </div>
        </motion.div>
      </div>
 
      <TripsList onEdit={onEdit} onOpen={onOpen} />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Review Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-3 font-extrabold pr-4 text-2xl text-amber-500 drop-shadow-md" dir="rtl">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-400/30">
               <i className="pi pi-refresh text-xl text-amber-500"></i>
            </div>
            راجع رحلتك المعرفية 🔍
          </div>
        }
        visible={isReviewDialogVisible}
        onHide={() => {
          setIsReviewDialogVisible(false);
          setSelectedReviewTripId("");
          setSelectedReviewTaskId("");
          setCreatedReviewPlans([]);
        }}
        className="w-[98vw] max-w-2xl font-sans mx-4 border-none shadow-[0_0_50px_rgba(245,158,11,0.3)] bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950 rounded-3xl overflow-hidden"
        contentStyle={{ background: 'transparent', color: 'white' }}
        headerStyle={{ background: 'transparent', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        closable
        dismissableMask
      >
        <div className="space-y-6 pt-5 text-right font-sans" dir="rtl">
          {createdReviewPlans.length === 0 ? (
            <>
              {/* Ebbinghaus Tip Alert */}
              <div className="p-4 bg-gradient-to-r from-blue-900/40 to-slate-900 border border-white/15 rounded-2xl text-right flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <i className="pi pi-bolt text-lg"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-300">مصل ترويض منحنى النسيان 🧠</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      بناء ومتابعة خطط المراجعة الثلاث يعيد تركيزك ويحمي 92% من المعرفة المعرضة للتلاشي بعد 48 ساعة.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 rounded-lg text-[9px] font-black shrink-0">
                  +30 XP تفعيل ريادي
                </span>
              </div>

              {/* Trip Selection */}
              <div>
                <p className="text-xs font-black text-amber-400/80 mb-3 uppercase tracking-wider">الخطوة 1: حدد غاية السعي (الرحلة المحددة)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {trips.map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => {
                        vibrate(HAPITCS.MAJOR_CLICK);
                        setSelectedReviewTripId(trip.id);
                        setSelectedReviewTaskId("");
                      }}
                      className={`p-4 rounded-2xl cursor-pointer text-right flex items-center gap-4 transition-all border outline-none ${
                        selectedReviewTripId === trip.id
                          ? "bg-amber-500/25 border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          : "bg-white/5 border-white/5 text-slate-350 hover:bg-white/10"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                        <i className={`pi ${getTripIcon(trip.learningGoal)} text-xs`} />
                      </div>
                      <span className="font-extrabold text-xs">{trip.learningGoal}</span>
                    </button>
                  ))}
                  {trips.length === 0 && (
                    <p className="text-sm text-slate-400">لا توجد رحلات نشطة حالياً للبدء بمراجعتها.</p>
                  )}
                </div>
              </div>

              {/* Task Selector */}
              {selectedReviewTripId && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <p className="text-xs font-black text-amber-400/80 mb-3 uppercase tracking-wider">الخطوة 2: حدد المهمة التي ترغب بمراجعتها</p>
                  <div className="bg-black/20 rounded-2xl p-4 max-h-56 overflow-y-auto border border-white/5 backdrop-blur-md">
                    <div className="grid grid-cols-1 gap-2">
                      {allAvailableTasks.filter(t => t.type === 'main').map((task) => {
                        const isSelected = selectedReviewTaskId === task.id;
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => {
                              vibrate(HAPITCS.GUIDANCE);
                              setSelectedReviewTaskId(task.id);
                            }}
                            className={`w-full p-4 rounded-xl cursor-pointer text-right flex items-center justify-between transition-all border outline-none ${
                              isSelected
                                ? "bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                isSelected ? "bg-amber-500/30 border-amber-450/30 text-amber-300" : "bg-slate-800 border-white/5 text-slate-400"
                              }`}>
                                <i className="pi pi-bookmark text-[10px]" />
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black block">{task.title}</span>
                                {task.description && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5 max-w-[340px] truncate">{task.description}</span>
                                )}
                              </div>
                            </div>
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
                                ✓
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-white/10" />
                            )}
                          </button>
                        );
                      })}
                      {allAvailableTasks.filter(t => t.type === 'main').length === 0 && (
                        <p className="text-xs text-slate-400 p-4 text-center">لم يتم العثور على أي مهام نشطة في هذه الرحلة حالياً مخصصة للتكرار.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rewards Insight */}
              {selectedReviewTaskId && (
                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4 text-right animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 text-lg">
                      🔥
                    </span>
                    <div>
                      <p className="text-xs font-black text-amber-300">درع تعزيز الفراسة المعرفية نشط!</p>
                      <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                        عند تشييد هذه المراجعة الموقّتة ستحصل فورياً على مكافأة بقيمة <b>+35 XP</b> لتعزيز ترتيب نجاحك المعرفي.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex gap-4 justify-end pt-4 border-t border-white/5 mt-6">
                <Button
                  label="تراجع"
                  className="p-button-text text-slate-400 font-bold text-sm cursor-pointer hover:text-white hover:bg-white/5 rounded-xl px-5 py-3 border-none bg-transparent transition-all"
                  onClick={() => {
                    setIsReviewDialogVisible(false);
                    setSelectedReviewTripId("");
                    setSelectedReviewTaskId("");
                  }}
                />
                <Button
                  label="تخطيط وتشييد المراجعات الثلاث 🚀"
                  className="bg-gradient-to-r from-amber-550 to-amber-700 hover:from-amber-400 hover:to-amber-600 border-none text-white font-black px-6 py-3 rounded-xl text-xs cursor-pointer transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                  onClick={handleCreateReviewPlans}
                  disabled={!selectedReviewTripId || !selectedReviewTaskId}
                />
              </div>
            </>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <i className="pi pi-check-circle text-3xl animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-amber-300">تم بناء خطط المراجعة الثلاث وترميم طاقتك! ✨</h3>
                <p className="text-xs text-slate-300 mt-2">انقر على أي من خطط المراجعة الثلاث الموزعة أدناه لعرض تلميحات الجهد وحلحلة الأنشطة داخل مودال التأسيس المطور.</p>
              </div>

              <div className="space-y-3 font-sans">
                {createdReviewPlans.map((plan, idx) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      vibrate(HAPITCS.MAJOR_CLICK);
                      setReviewDetailsTaskId(plan.id);
                      setReviewDetailsVisible(true);
                    }}
                    className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black">
                        #{idx + 1}
                      </div>
                      <div className="text-right">
                        <h4 className="text-sm font-black text-white group-hover:text-amber-350 transition-colors font-sans">{plan.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-sans max-w-[450px] leading-relaxed">{plan.description}</p>
                      </div>
                    </div>
                    <i className="pi pi-angle-left text-xs text-slate-400 group-hover:text-amber-450 transition-colors" />
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5 mt-6">
                <Button
                  label="إغلاق"
                  className="bg-white/10 text-white font-bold px-6 py-3 rounded-xl text-xs cursor-pointer hover:bg-white/15 outline-none border-none transition-all"
                  onClick={() => {
                    setIsReviewDialogVisible(false);
                    setSelectedReviewTripId("");
                    setSelectedReviewTaskId("");
                    setCreatedReviewPlans([]);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Task Details Modal of the Review plans - Replaced with TaskEditorModal rendering setup wizard task editor giving 0 XP */}
      {reviewDetailsTaskId && (
        <TaskEditorModal
          visible={reviewDetailsVisible}
          onHide={() => {
            setReviewDetailsVisible(false);
            setReviewDetailsTaskId(null);
          }}
          task={allAvailableTasks.find((t) => t.id === reviewDetailsTaskId)}
          onSave={async (updatedTask) => {
            await db.tasks.put(updatedTask);
            setReviewDetailsVisible(false);
            setReviewDetailsTaskId(null);
            toastHot.success("تم تشييد التعديلات على خطة المراجعة بنجاح! 💾 (0 XP)");
          }}
        />
      )}
    </div>
  );
}
