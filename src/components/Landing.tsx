import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { vibrate, HAPITCS } from "../lib/haptics";
import { db } from "../db";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useLiveQuery } from "dexie-react-hooks";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
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
              <span className="text-blue-900 text-2xl font-bold">؟</span>
            </div>

            <h3 className="text-2xl font-bold text-blue-950 mb-2">
              أحتاج مساعدة ؟
            </h3>
            <p className="text-gray-500 mb-8 leading-relaxed font-light">
              كلمنا على{" "}
              <span className="font-bold text-blue-600 text-[1.15rem] mx-1">
                01282920387
              </span>{" "}
              لأول رحلة مجاناً
            </p>

            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-50 text-blue-950 font-bold rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
            >
              حسناً
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

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

  return (
    <div className="w-full max-w-2xl mt-8 mx-auto" dir="rtl">
      <h3 className="text-xl font-bold text-blue-900 mb-5 text-center flex items-center justify-center gap-2">
        <i className="pi pi-compass text-lg animate-spin" style={{ animationDuration: '4s' }}></i>
        <span>الرحلات النشطة الحالية</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map((trip) => (
          <div
            key={trip.id}
            onClick={() => onOpen(trip.id)}
            className="group relative bg-gradient-to-br from-blue-800 via-indigo-700 to-blue-950 p-[2.5px] rounded-3xl shadow-xl shadow-blue-900/10 hover:shadow-2xl hover:shadow-blue-950/20 active:scale-[0.99] transition-all duration-300 cursor-pointer aspect-square flex w-full"
          >
            <div className="bg-white p-6 rounded-[21px] flex flex-col justify-between items-center text-center w-full h-full relative overflow-hidden">
              {/* Three dots absolute position so it fits beautifully */}
              <div 
                className="absolute top-4 left-4 z-30" 
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition border-none cursor-pointer"
                  onClick={() => {
                    vibrate(HAPITCS.MAJOR_CLICK);
                    setActiveMenuTripId(activeMenuTripId === trip.id ? null : trip.id);
                  }}
                  title="خيارات"
                >
                  <i className="pi pi-ellipsis-v text-sm"></i>
                </button>
                {activeMenuTripId === trip.id && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setActiveMenuTripId(null)}
                    />
                    <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 py-2 text-right">
                      <button
                        onClick={() => {
                          setActiveMenuTripId(null);
                          startEdit(trip);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-blue-950 hover:bg-gray-50 transition border-none bg-transparent font-medium cursor-pointer"
                      >
                        <i className="pi pi-pencil text-blue-600"></i>
                        <span>تعديل المحطات</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveMenuTripId(null);
                          setDeleteTripId(trip.id);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 transition border-none bg-transparent font-medium cursor-pointer"
                      >
                        <i className="pi pi-trash text-rose-500"></i>
                        <span>حذف الرحلة</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Learning Goal Centered vertically */}
              <div className="flex-1 flex items-center justify-center py-6 px-2">
                <span className="font-extrabold text-blue-950 text-xl md:text-2xl group-hover:text-blue-800 transition-colors leading-snug">
                  {trip.learningGoal}
                </span>
              </div>

              {/* Subtext decorator */}
              <span className="text-[11px] font-extrabold text-indigo-900/50 uppercase tracking-wider bg-indigo-50/50 px-3 py-1 rounded-full">
                اضغط لعرض الرحلة 🗺️
              </span>
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
  const [supportOpen, setSupportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleStart = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    onStart();
  };

  const handleSupport = () => {
    vibrate(HAPITCS.GUIDANCE);
    setSupportOpen(true);
  };

  const handleSettings = () => {
    vibrate(HAPITCS.MAJOR_CLICK);
    setSettingsOpen(true);
  };

  return (
    <div className="w-full max-h-[85vh] overflow-y-auto py-12 px-6 flex flex-col items-center justify-start text-center z-10 space-y-12 max-w-2xl relative scroll-smooth no-scrollbar">
      <header className="absolute top-0 left-0 w-full p-6 md:p-12 flex justify-center items-center gap-6 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-blue-900 flex items-center justify-center rounded-full bg-white shadow-sm">
            <div className="w-5 h-5 bg-blue-900 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-col items-start pr-2">
            <h1 className="text-xl md:text-2xl font-black text-blue-950 tracking-tight leading-none mb-1">
              Aura Journey
            </h1>
            <span className="text-[10px] md:text-xs text-indigo-600 font-black tracking-[0.2em] uppercase">
              رحلة حياة
            </span>
          </div>
          
          <div className="h-8 w-px bg-slate-200 mx-2"></div>

          <button
            onClick={handleSettings}
            className="w-10 h-10 flex items-center justify-center rounded-full text-blue-900 hover:bg-blue-50 transition-colors"
          >
            <i className="pi pi-cog text-xl"></i>
          </button>
        </div>
      </header>
 
      <div className="pt-24 md:pt-32">
        {/* Title removed from body as it is now in the header only */}
      </div>
 
      <TripsList onEdit={onEdit} onOpen={onOpen} />

      <div className="flex flex-col items-center gap-6 w-full pb-8">
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
          className="px-12 py-5 bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-950 hover:brightness-110 text-white rounded-full text-xl font-extrabold transition-all relative overflow-hidden group w-full md:w-auto shadow-xl"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            إصنع رحلتك بنفسك 🚀
          </span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </motion.button>
        <button
          onClick={handleSupport}
          className="text-blue-900/60 font-semibold hover:text-blue-900 transition-colors border-b border-transparent hover:border-blue-900 pb-1"
        >
          أحتاج مساعدة ؟
        </button>
      </div>



      <SupportModal
        isOpen={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
