import Dexie, { type EntityTable } from 'dexie';

export interface Station {
  id: string;
  name: string;
  icon: string;
  description: string;
  targetDate: string;
  order: number;
}

export interface TaskActivity {
  id: string;
  title: string;
  description?: string;
  duration?: number; // Expected duration in minutes
  isCompleted: boolean;
  steps?: { id: string; title: string, isCompleted: boolean }[];
  children?: TaskActivity[];
}

export interface Task {
  id: string;
  stationId: string;
  title: string;
  type: 'main' | 'sub' | 'side';
  parentId?: string; // If sub, points to main
  isCompleted: boolean;
  activities?: TaskActivity[];
  dueDate?: string;
  description?: string;
}

export interface SubStationTask {
  id: string;
  title: string;
  isCompleted: boolean;
  subTasks?: { id: string; title: string, isCompleted: boolean }[];
}

export interface SubStation {
  stationId: string;
  tasks: SubStationTask[];
  durationMinutes: number;
  isCompleted: boolean;
  unlockedAt: string;
}

export interface UserSettings {
  id: string;
  isFrozen?: boolean;
  isVacation?: boolean;
  learningGoal: string;
  psychology: {
    reason: string;
    motivation: string;
    target: string;
    anxieties: string;
  };
  attachments?: string[];
  resources?: { name: string; url: string }[];
  dailyDuration?: number;
  learningDays?: number[];
  theme?: 'cards' | 'calendar'; // Theme selection
  gameData?: {
    fuel: number;
    xp: number;
    keys: number;
    lastReflectionDate: string;
    streak?: number;
    tasksCompletedSinceReview?: number;
  };
  notes?: Record<string, { 
    text: string; 
    date: string; 
    updatedAt?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
  }[]>; // Station notes map
  unlockedStationIds?: string[]; // IDs of explicitly unlocked stations
  timeCapsules?: Record<string, { message: string; writtenAt: string; isRead: boolean; messages?: { message: string; writtenAt: string }[] }>; // Station ID -> Time capsule
  subStations?: Record<string, SubStation[]>; // Station ID -> Array of SubStation details
  flashcards?: Record<string, any[]>; // Station ID/Task ID -> Array of flashcards
}

export interface TaskReflection {
  id: string;
  taskId: string;
  taskTitle: string;
  stationId: string;
  stationName: string;
  focus: number;
  mastery: number;
  strengths: string;
  weaknesses: string;
  learnings: string;
  didPractical: boolean;
  practicalIssues: string;
  createdAt: string;
  type?: 'initial' | 'review';
  languageLearning?: {
    sentences: { text: string; audioData?: string; notes?: string }[];
    accentRating: number;
    dialectNotes: string;
    pronunciationIssues: string;
  };
}

export interface Stumble {
  id: string;
  stationId: string;
  stationName: string;
  reason: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

export const db = new Dexie('AuraJourneyDatabase') as Dexie & {
  stations: EntityTable<Station, 'id'>,
  tasks: EntityTable<Task, 'id'>,
  userSettings: EntityTable<UserSettings, 'id'>,
  reflections: EntityTable<TaskReflection, 'id'>,
  stumbles: EntityTable<Stumble, 'id'>,
  notifications: EntityTable<Notification, 'id'>
};

db.on('versionchange', () => {
  db.close();
  window.location.reload();
});

db.version(1).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id'
});

db.version(2).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId'
});

db.version(3).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId, createdAt'
});

db.version(4).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId, createdAt',
  stumbles: 'id, stationId, createdAt'
});

db.version(5).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId, createdAt',
  stumbles: 'id, stationId, createdAt',
  notifications: 'id, isRead, createdAt'
});

db.version(6).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId, createdAt',
  stumbles: 'id, stationId, createdAt',
  notifications: 'id, isRead, createdAt',
  businessSpaces: 'id'
});

db.version(7).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId, createdAt',
  stumbles: 'id, stationId, createdAt',
  notifications: 'id, isRead, createdAt'
});

db.open().catch(err => {
  console.error("Failed to open db: ", err.stack || err);
});

// Sync logic for Firebase
let isSyncing = false;
let authInitialized = false;
let currentUserId: string | null = null;
import { auth, db as firestore } from './lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, getDocs, deleteDoc } from 'firebase/firestore';

// Call this from App.tsx on mount
export const initFirebaseSync = () => {
  signInAnonymously(auth).then(({ user }) => {
    currentUserId = user.uid;
    authInitialized = true;
    
    // Sync Trips (userSettings) from Firebase to Dexie
    onSnapshot(collection(firestore, `users/${user.uid}/userSettings`), async (snapshot) => {
      isSyncing = true;
      try {
        const fbData = snapshot.docs.map(d => d.data() as UserSettings);
        const localData = await db.userSettings.toArray();
        // Simple merge: remote wins
        for (const fbItem of fbData) {
          await db.userSettings.put(fbItem);
        }
        // Remove local items not in firebase
        const fbIds = new Set(fbData.map(d => d.id));
        for (const localItem of localData) {
          if (!fbIds.has(localItem.id)) {
            await db.userSettings.delete(localItem.id);
          }
        }
      } finally {
        isSyncing = false;
      }
    });

    // Sync Tasks from Firebase to Dexie
    onSnapshot(collection(firestore, `users/${user.uid}/tasks`), async (snapshot) => {
      isSyncing = true;
      try {
        const fbData = snapshot.docs.map(d => d.data() as Task);
        const localData = await db.tasks.toArray();
        for (const fbItem of fbData) {
          await db.tasks.put(fbItem);
        }
        const fbIds = new Set(fbData.map(d => d.id));
        for (const localItem of localData) {
          if (!fbIds.has(localItem.id)) {
            await db.tasks.delete(localItem.id);
          }
        }
      } finally {
        isSyncing = false;
      }
    });
  });

  // Track Dexie changes and push to Firebase
  const pushToFirebase = async (table: string, id: string, data: any, type: 'put' | 'delete') => {
    if (isSyncing || !authInitialized || !currentUserId) return;
    try {
      const ref = doc(firestore, `users/${currentUserId}/${table}`, id);
      if (type === 'put') {
        await setDoc(ref, data);
      } else {
        await deleteDoc(ref);
      }
    } catch(err) {
      console.error('Firebase sync error:', err);
    }
  };

  db.userSettings.hook('creating', (primKey, obj) => { pushToFirebase('userSettings', primKey, obj, 'put'); });
  db.userSettings.hook('updating', (mods, primKey, obj) => { pushToFirebase('userSettings', primKey, { ...obj, ...mods }, 'put'); });
  db.userSettings.hook('deleting', (primKey) => { pushToFirebase('userSettings', primKey, null, 'delete'); });

  db.tasks.hook('creating', (primKey, obj) => { pushToFirebase('tasks', primKey, obj, 'put'); });
  db.tasks.hook('updating', (mods, primKey, obj) => { pushToFirebase('tasks', primKey, { ...obj, ...mods }, 'put'); });
  db.tasks.hook('deleting', (primKey) => { pushToFirebase('tasks', primKey, null, 'delete'); });
};

