import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS } from "../lib/haptics";
import { db } from "../db";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useLiveQuery } from "dexie-react-hooks";

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
                label="استيراد رحلة (.json)"
                icon="pi pi-upload"
                onClick={handleImportClick}
                className="p-button-outlined w-full justify-center rounded-xl p-3 text-blue-900 border-blue-200 hover:bg-blue-50"
              />

              <Button
                label="مشاركة التطبيق 🔗"
                icon="pi pi-share-alt"
                onClick={() => {
                  vibrate(HAPITCS.MAJOR_CLICK);
                  const appUrl = window.location.origin;
                  if (navigator.share) {
                    navigator.share({
                      title: "Aura Journey",
                      text: "انضم إلي في رحلتي التعليمية والتطبيقية على Aura Journey! 🚀",
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
  const [activeMenuTripId, setActiveMenuTripId] = useState<string | null>(null);
  const [deleteTripId, setDeleteTripId] = useState<string | null>(null);

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
      <div className="flex justify-center mb-8">
         <span className="px-8 py-3 bg-gradient-to-r from-blue-800 to-indigo-900 text-white rounded-full font-black text-sm shadow-lg flex items-center gap-3 border border-white/20">
            <i className="pi pi-compass text-lg animate-spin" style={{ animationDuration: '4s' }}></i>
            الرحلات النشطة الحالية
         </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => onOpen(trip.id)}
            className="group relative bg-gradient-to-br from-blue-800 via-indigo-700 to-blue-950 p-[1px] rounded-3xl shadow-2xl shadow-blue-900/20 hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-500 cursor-pointer aspect-square flex w-full overflow-hidden"
          >
            {/* Glow Effect Layer */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.3),transparent_70%)]" />
            
            <div className="bg-gradient-to-br from-blue-900/90 to-blue-950 p-6 rounded-[23px] flex flex-col justify-between items-center text-center w-full h-full relative overflow-hidden backdrop-blur-sm">
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-blue-400/30 transition-all duration-500" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-400/30 transition-all duration-500" />

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
              <div className="mt-4 w-20 h-20 rounded-2xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative z-10">
                <i className={`pi ${getTripIcon(trip.learningGoal)} text-3xl text-blue-900`}></i>
              </div>

              {/* Learning Goal */}
              <div className="flex-1 flex items-center justify-center py-6 px-2 relative z-10">
                <span className="font-black text-white text-xl md:text-2xl leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  {trip.learningGoal}
                </span>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
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

  const handleStart = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    onStart();
  };

  const handleSettings = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setSettingsOpen(true);
  };

  return (
    <div className="w-full max-h-[85vh] overflow-y-auto py-12 px-6 flex flex-col items-center justify-start text-center z-10 space-y-12 max-w-2xl relative scroll-smooth no-scrollbar">
      <header className="absolute top-0 left-0 w-full p-6 md:p-12 flex justify-between items-center gap-6 z-10" dir="rtl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-900 flex items-center justify-center rounded-full bg-white shadow-sm overflow-hidden p-2">
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
            <h1 className="text-xl md:text-2xl font-black text-blue-950 tracking-tight leading-none mb-1">
              Aura Journey
            </h1>
            <span className="text-[10px] md:text-xs text-indigo-600 font-black tracking-[0.2em] uppercase">
              رحلة حياة
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleStart}
            className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-800 to-blue-950 text-white rounded-full text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all border-none cursor-pointer"
          >
            إبدأ الآن
          </button>
          
          <div className="h-8 w-px bg-slate-200 mx-1"></div>

          <button
            onClick={handleSettings}
            className="w-10 h-10 flex items-center justify-center rounded-full text-blue-900 hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
          >
            <i className="pi pi-cog text-xl"></i>
          </button>
        </div>
      </header>
 
      <div className="pt-24 md:pt-32">
        {/* Title removed from body as it is now in the header only */}
      </div>
 
      <TripsList onEdit={onEdit} onOpen={onOpen} />

      <div className="flex flex-col items-center gap-6 w-full pb-8 md:hidden">
        <motion.button
          onClick={handleStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              "0 0 15px rgba(29, 78, 216, 0.4)",
              "0 0 32px rgba(59, 130, 246, 0.77)",
              "0 0 15px rgba(29, 78, 216, 0.4)",
            ],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          }}
          className="px-12 py-5 bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 hover:brightness-110 text-white rounded-full text-xl font-extrabold transition-all relative overflow-hidden group w-full shadow-xl border-none cursor-pointer"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            إصنع رحلتك بنفسك
          </span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </motion.button>
      </div>



      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
