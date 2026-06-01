import { useState, useEffect, useCallback } from 'react';
import { Splash } from './components/Splash';
import { Tutorial } from './components/Tutorial';
import { db, initFirebaseSync } from './db';
import { db as firestore } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { Landing } from './components/Landing';
import { SetupWizard } from './components/SetupWizard';
import { Maps } from './components/Maps';
import { playTickSound } from './lib/haptics';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type AppState = 'splash' | 'login' | 'signup' | 'tutorial' | 'landing' | 'wizard' | 'maps';

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [targetState, setTargetState] = useState<AppState>('landing');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'free' | 'premium' | 'guest' | null>(null);

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
         onAuthStateChanged(auth, async (user) => {
           if (user) {
             if (user.isAnonymous) {
               setUserRole('free');
               const tutorialCompleted = localStorage.getItem(`via_tutorial_completed_${user.uid}`);
               const nextState = tutorialCompleted ? 'landing' : 'tutorial';
               setTargetState(nextState);
               setAppState((prev) => (prev === 'splash' || prev === 'login' || prev === 'signup' ? nextState : prev));
               return;
             }

             // Load user's profile and role from Firestore
             const userRef = doc(firestore, 'users', user.uid);
             let userSnap = await getDoc(userRef);
             
             let role: 'admin' | 'free' | 'premium' = user.email?.toLowerCase() === 'ameratef455@gmail.com' ? 'admin' : 'free';
             
             if (!userSnap.exists()) {
               await setDoc(userRef, {
                 uid: user.uid,
                 email: user.email?.toLowerCase() || '',
                 role: role,
                 createdAt: new Date().toISOString()
               });
             } else {
               const data = userSnap.data();
               role = data?.role || role;
               // Robust check for ameratef455@gmail.com to guarantee admin role privileges
               if (user.email?.toLowerCase() === 'ameratef455@gmail.com' && role !== 'admin') {
                 role = 'admin';
                 await setDoc(userRef, { role: 'admin' }, { merge: true });
               }
             }
             
             setUserRole(role);

             const tutorialCompleted = localStorage.getItem(`via_tutorial_completed_${user.uid}`);
             const nextState = tutorialCompleted ? 'landing' : 'tutorial';
             setTargetState(nextState);
             setAppState((prev) => (prev === 'splash' || prev === 'login' || prev === 'signup' ? nextState : prev));
           } else {
             setUserRole(null);
             setAppState('login');
           }
         });
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
              <Splash onComplete={() => {
                // If there is no user, force to login. Otherwise, we can transition to targetState.
                if (!auth.currentUser) {
                  setAppState('login');
                } else {
                  setAppState(targetState);
                }
              }} />
            </motion.div>
          )}

          {appState === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center relative z-10 p-4 overflow-y-auto"
            >
              <Login
                onRegisterClick={() => setAppState('signup')}
                onSuccess={() => {
                  const uid = auth.currentUser?.uid || 'guest';
                  const tutorialCompleted = localStorage.getItem(`via_tutorial_completed_${uid}`);
                  setAppState(tutorialCompleted ? 'landing' : 'tutorial');
                }}
              />
            </motion.div>
          )}

          {appState === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full flex items-center justify-center relative z-10 p-4 overflow-y-auto"
            >
              <Signup
                onLoginClick={() => setAppState('login')}
                onSuccess={() => {
                  const uid = auth.currentUser?.uid || 'guest';
                  const tutorialCompleted = localStorage.getItem(`via_tutorial_completed_${uid}`);
                  setAppState(tutorialCompleted ? 'landing' : 'tutorial');
                }}
              />
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
                const uid = auth.currentUser?.uid || 'guest';
                localStorage.setItem(`via_tutorial_completed_${uid}`, 'true');
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
                userRole={userRole}
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
                  userRole={userRole}
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
                <Maps tripId={selectedTripId} userRole={userRole} onBack={() => setAppState('landing')} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
