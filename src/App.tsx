import { useState, useEffect, useCallback } from 'react';
import { Splash } from './components/Splash';
import { Tutorial } from './components/Tutorial';
import { db, initFirebaseSync } from './db';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { Landing } from './components/Landing';
import { SetupWizard } from './components/SetupWizard';
import { Maps } from './components/Maps';
import { playTickSound } from './lib/haptics';

type AppState = 'splash' | 'tutorial' | 'landing' | 'wizard' | 'maps';

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [targetState, setTargetState] = useState<AppState>('landing');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

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
         initFirebaseSync();
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
          style: {
            zIndex: 2147483647,
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
