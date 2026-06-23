import { useState, useEffect, useCallback } from 'react';
import { Splash } from './components/Splash';
import { Tutorial } from './components/Tutorial';
import { db } from './db';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, useToasterStore, toast } from 'react-hot-toast';
import { Landing } from './components/Landing';
import { SetupWizard } from './components/SetupWizard';
import { Maps } from './components/Maps';
import { playTickSound } from './lib/haptics';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="pi pi-exclamation-triangle text-rose-500 text-2xl"></i>
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2">عذراً، حدث خطأ غير متوقع</h2>
        <p className="text-sm text-slate-500 font-bold mb-6 leading-relaxed">
          نواجه مشكلة تقنية بسيطة. جرب إعادة تحميل الصفحة أو العودة للرئيسية.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl mb-6 text-left overflow-auto max-h-[150px]">
          <pre className="text-[10px] text-rose-600 font-mono">
            {error.message}
            {error.stack && `\n\nStack:\n${error.stack}`}
          </pre>
        </div>
        <div className="space-y-3">
          <button 
            onClick={resetErrorBoundary}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
          >
            إعادة المحاولة
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}

type AppState = 'splash' | 'tutorial' | 'landing' | 'wizard' | 'maps';

export default function App() {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        window.location.reload();
      }}
      onError={(error, info) => {
        console.error('ErrorBoundary caught an error:', error, info);
      }}
    >
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [targetState, setTargetState] = useState<AppState>('landing');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Limit visible toasts to prevent lag and heap clutter
  const { toasts } = useToasterStore();
  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= 2) // Maintain maximum of 2 active concurrent toasts
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  useEffect(() => {
    // Add global click listener for tick sound
    const handleClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        const tag = target.tagName.toLowerCase();
        const role = target.getAttribute('role');
        const isClickable = tag === 'button' || tag === 'a' || role === 'button' || target.classList.contains('cursor-pointer');
        
        if (isClickable) {
           playTickSound();
           break;
         }
        target = target.parentElement;
      }
    };
    document.addEventListener('click', handleClick);

    const init = async () => {
       try {
         const tutorialCompleted = localStorage.getItem('via_tutorial_completed');
         setTargetState(tutorialCompleted ? 'landing' : 'tutorial');
       } catch (e) {
         console.error('DB Init Error', e);
       }
    };
    init();

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-white relative overflow-hidden font-sans">
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        containerStyle={{ zIndex: 2147483647 }} 
        toastOptions={{
          duration: 3500,
          style: {
            zIndex: 2147483647,
            background: 'rgba(10, 15, 30, 0.85)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            fontSize: '13.5px',
            fontWeight: '600',
            padding: '10px 18px',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            maxWidth: '400px',
            textAlign: 'right',
            direction: 'rtl'
          }
        }}
      />
      <div className="h-full flex flex-col items-center justify-center p-0 md:p-8 relative overflow-hidden">
        {/* Background Decorative Element */}
        <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" viewBox="0 0 1024 768" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-50 400C150 200 400 600 600 400C800 200 1100 500 1100 500" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="10 10" />
        </svg>

        <AnimatePresence mode="wait">
          {appState === 'splash' && (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center relative z-10"
            >
              <Splash onComplete={() => setAppState(targetState)} />
            </motion.div>
          )}

          {appState === 'tutorial' && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full relative z-10"
            >
              <Tutorial onComplete={() => {
                localStorage.setItem('via_tutorial_completed', 'true');
                setAppState('landing');
              }} />
            </motion.div>
          )}

          {appState === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center relative z-10"
            >
              <Landing 
                onStart={() => {
                  setEditingTripId(null);
                  setAppState('wizard');
                }} 
                onEdit={(tripId) => {
                  setEditingTripId(tripId);
                  setAppState('wizard');
                }}
                onOpen={(tripId) => {
                  setSelectedTripId(tripId);
                  setAppState('maps');
                }}
              />
            </motion.div>
          )}

          {(appState === 'wizard' || appState === 'maps') && (
            <motion.div
              key={appState}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center relative z-10"
            >
              {appState === 'wizard' ? (
                <SetupWizard 
                  editingTripId={editingTripId}
                  onComplete={(uid) => {
                    setEditingTripId(null);
                    setSelectedTripId(uid);
                    setAppState('maps');
                  }} 
                  onCancel={() => {
                    setEditingTripId(null);
                    setAppState(editingTripId ? 'maps' : 'landing');
                  }}
                />
              ) : (
                <Maps tripId={selectedTripId} onBack={() => setAppState('landing')} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
