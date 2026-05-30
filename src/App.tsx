import { useState, useEffect, useCallback } from 'react';
import { Splash } from './components/Splash';
import { Tutorial } from './components/Tutorial';
import { db } from './db';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { Landing } from './components/Landing';
import { SetupWizard } from './components/SetupWizard';
import { Maps } from './components/Maps';
import { playTickSound } from './lib/haptics';
import { Login } from './components/Login';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import debounce from 'lodash/debounce';

type AppState = 'splash' | 'tutorial' | 'landing' | 'wizard' | 'maps';

export default function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [targetState, setTargetState] = useState<AppState>('landing');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Debounced Sync Function
  const syncToSupabase = useCallback(
    debounce(async (user: any) => {
      if (!user || !isSupabaseConfigured) return;
      
      console.log('🔄 Syncing to Supabase...');
      setIsSyncing(true);
      
      try {
        const [stations, tasks, settings, reflections, stumbles, notifications] = await Promise.all([
          db.stations.toArray(),
          db.tasks.toArray(),
          db.userSettings.toArray(),
          db.reflections.toArray(),
          db.stumbles.toArray(),
          db.notifications.toArray()
        ]);

        const fullData = {
          stations,
          tasks,
          settings,
          reflections,
          stumbles,
          notifications,
          syncedAt: new Date().toISOString()
        };

        const { error } = await supabase
          .from('user_sync')
          .upsert({ 
            user_id: user.id, 
            payload: fullData,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) {
          if (error.code === '42P01' || error.code === 'PGRST205') {
            console.warn('⚠️ user_sync table not found in Supabase. Please create it using the provided SQL.');
          } else {
            console.error('❌ Sync Error:', error);
          }
        } else {
          console.log('✅ Sync Completed');
        }
      } catch (err) {
        console.error('❌ Sync Failed:', err);
      } finally {
        setIsSyncing(false);
      }
    }, 5000), // 5 seconds debounce
    []
  );

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

         if (isSupabaseConfigured) {
           const { data } = await supabase.auth.getSession();
           if (data?.session?.user) {
             setSupabaseUser(data.session.user);
           }
         }
       } catch (e) {
         console.error('DB Init Error', e);
       }
    };
    init();

    let authSubscription: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSupabaseUser(session?.user || null);
      });
      authSubscription = data.subscription;
    }

    return () => {
      document.removeEventListener('click', handleClick);
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Monitor Dexie changes for sync
  useEffect(() => {
    if (supabaseUser) {
      const observer = () => {
        syncToSupabase(supabaseUser);
      };

      // Simple interval check for local changes since Dexie observation can be complex
      const interval = setInterval(async () => {
        // We could compare hashes here, but for now we just trigger debounce on any presumed activity
        // Better: trigger this from components that modify data, but as a catch-all this works with the debounce
      }, 10000);

      // Add actual Dexie hooks if we want real-time
      const hooks = [db.stations, db.tasks, db.userSettings, db.reflections, db.stumbles, db.notifications];
      hooks.forEach(table => {
        table.hook('creating', observer);
        table.hook('updating', observer);
        table.hook('deleting', observer);
      });

      return () => {
        clearInterval(interval);
        hooks.forEach(table => {
          table.hook('creating').unsubscribe(observer);
          table.hook('updating').unsubscribe(observer);
          table.hook('deleting').unsubscribe(observer);
        });
      };
    }
  }, [supabaseUser, syncToSupabase]);

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
        setSupabaseUser(null);
        setShowLogin(false);
        setAppState('landing');
      } catch (e) {
        console.error('Logout Error:', e);
      }
    } else {
      setSupabaseUser(null);
      setShowLogin(false);
      setAppState('landing');
    }
  };

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
                user={supabaseUser}
                onLogout={handleLogout}
                onLoginRequest={() => setShowLogin(true)}
              />
            </motion.div>
          )}

          <AnimatePresence>
            {showLogin && (
              <Login 
                onSuccess={(u) => {
                  setSupabaseUser(u);
                  setShowLogin(false);
                }} 
                onBack={() => setShowLogin(false)} 
                onTutorialRequest={() => {
                  setShowLogin(false);
                  setAppState('tutorial');
                }}
              />
            )}
          </AnimatePresence>

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
