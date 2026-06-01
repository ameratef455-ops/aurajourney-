import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS, playTickSound } from "../lib/haptics";
import { db } from "../db";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { useLiveQuery } from "dexie-react-hooks";
import { toast as toastHot } from "react-hot-toast";
import { NotificationsPopover } from "./NotificationsPopover";
import { Plus } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInstallPWA = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    // In a real PWA this would trigger the beforeinstallprompt event's prompt() method
    alert("Install PWA requested. (Will prompt if PWA criteria are met)");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        vibrate(HAPITCS.COMPLETE);
        alert("تم استيراد الرحلة بنجاح! يرجى إعادة تحميل الصفحة.");
        window.location.reload();
      } catch (err) {
        console.error("Error parsing JSON:", err);
        alert("حدث خطأ أثناء استيراد الملف. تأكد أنه ملف صحيح.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white border border-gray-100 rounded-3xl p-8 shadow-2xl z-50 text-center"
          >
            <div className="w-16 h-16 border-2 border-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-50/30">
              <i className="pi pi-cog text-blue-900 text-2xl"></i>
            </div>

            <h3 className="text-2xl font-bold text-blue-950 mb-6">الإعدادات</h3>

            <div className="flex flex-col gap-4">
              <Button
                label="تثبيت التطبيق (PWA)"
                icon="pi pi-download"
                onClick={handleInstallPWA}
                className="p-button-outlined w-full justify-center rounded-xl p-3 text-blue-900 border-blue-200 hover:bg-blue-50"
              />

              <input
                type="file"
                accept=".json"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <Button
                label="مشاركة التطبيق 🔗"
                icon="pi pi-share-alt"
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
                    alert("تم نسخ رابط التطبيق إلى الحافظة! يمكنك الآن مشاركته مع أصدقائك. 🔗");
                  }
                }}
                className="p-button-outlined w-full justify-center rounded-xl p-3 text-blue-900 border-blue-200 hover:bg-blue-50"
              />
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 mt-6 bg-gray-50 text-blue-950 font-bold rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
            >
              إغلاق
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

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
                  {activeMenuTripId === trip.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenuTripId(null)}
                      />
                      <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-100 rounded-2xl shadow-2xl z-20 py-2 text-right overflow-hidden">
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            startEdit(trip);
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-blue-950 hover:bg-blue-50 transition border-none bg-transparent font-bold cursor-pointer"
                        >
                          <i className="pi pi-pencil text-blue-600"></i>
                          <span>تعديل المحطات</span>
                        </button>
                        <div className="h-px bg-gray-50 mx-2" />
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            setResetTrip(trip);
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-amber-600 hover:bg-amber-50 transition border-none bg-transparent font-bold cursor-pointer"
                        >
                          <i className="pi pi-refresh text-amber-500"></i>
                          <span>ابدأ الرحلة من جديد</span>
                        </button>
                        <div className="h-px bg-gray-50 mx-2" />
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            setFreezeConfirmTrip(trip);
                          }}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition border-none bg-transparent font-bold cursor-pointer ${
                            isFrozen ? "text-emerald-600 hover:bg-emerald-50" : "text-cyan-600 hover:bg-cyan-50"
                          }`}
                        >
                          <i className={`pi ${isFrozen ? 'pi-play' : 'pi-stop-circle'} ${isFrozen ? 'text-emerald-500' : 'text-cyan-500'}`}></i>
                          <span>{isFrozen ? "إلغاء التجميد" : "تجميد الرحلة"}</span>
                        </button>
                        <div className="h-px bg-gray-50 mx-2" />
                        <button
                          onClick={() => {
                            setActiveMenuTripId(null);
                            setDeleteTripId(trip.id);
                          }}
                          className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-rose-600 hover:bg-rose-50 transition border-none bg-transparent font-bold cursor-pointer"
                        >
                          <i className="pi pi-trash text-rose-500"></i>
                          <span>حذف الرحلة</span>
                        </button>
                      </div>
                    </>
                  )}
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

  const handleStart = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    onStart();
  };

  const handleSettings = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setSettingsOpen(true);
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
      <header className="fixed top-0 left-0 w-full p-6 md:p-8 flex justify-between items-center gap-6 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 border-2 border-blue-900 flex items-center justify-center rounded-full bg-white shadow-sm overflow-hidden p-2.5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-blue-900">
              <circle cx="12" cy="6" r="2.5" fill="currentColor" />
              <circle cx="6" cy="18" r="2.5" fill="currentColor" />
              <circle cx="18" cy="18" r="2.5" fill="currentColor" />
              <path d="M12 8.5L7.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 8.5L16.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8.5 18H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex flex-col items-start pr-2">
            <h1 className="text-2xl md:text-3xl font-fredoka font-light tracking-wide text-blue-950 leading-none mb-1 antialiased">
              VIA
            </h1>
            <span className="text-[11px] md:text-sm text-indigo-600 font-black tracking-[0.2em] uppercase">
              رحلة حياة
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
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
          
          <div className="h-6 w-px bg-slate-200"></div>

          <NotificationsPopover className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-blue-900 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer" />

          <button
            onClick={handleSettings}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-blue-900 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <i className="pi pi-cog text-lg md:text-xl"></i>
          </button>
        </div>
      </header>
 
      <div className="pt-24 md:pt-32">
        {/* Title removed from body as it is now in the header only */}
      </div>
 
      <TripsList onEdit={onEdit} onOpen={onOpen} />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
