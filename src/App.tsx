import { useState, useEffect } from 'react';
import { Splash } from './components/Splash';
import { Landing } from './components/Landing';
import { SetupWizard } from './components/SetupWizard';
import { Maps } from './components/Maps';
import { db } from './db';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 'splash' | 'landing' | 'wizard' | 'maps';

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [targetState, setTargetState] = useState<AppState>('landing');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
       try {
         // Keep targetState initialized to landing as requested
         setTargetState('landing');
       } catch (e) {
         console.error('DB Init Error', e);
       }
    };
    init();
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-white relative overflow-hidden font-sans">
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

          {appState === 'wizard' && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center relative z-10"
            >
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
            </motion.div>
          )}

          {appState === 'maps' && (
            <motion.div
              key="maps"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-full h-full relative z-10"
            >
              <Maps tripId={selectedTripId} onBack={() => setAppState('landing')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
