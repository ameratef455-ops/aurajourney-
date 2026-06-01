import Dexie, { type EntityTable } from 'dexie';

export interface Station {
  id: string;
  name: string;
  icon: string;
  description: string;
  targetDate: string;
  order: number;
  isPremium?: boolean;
  completionMessage?: string;
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
  isFree?: boolean;
  role?: 'free' | 'premium' | 'admin';
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
  theme?: 'cards' | 'calendar';
  completionMessage?: string;
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
  }[]>;
  unlockedStationIds?: string[];
  timeCapsules?: Record<string, { message: string; writtenAt: string; isRead: boolean; messages?: { message: string; writtenAt: string }[] }>;
  subStations?: Record<string, SubStation[]>;
  flashcards?: Record<string, any[]>;
  email?: string;
  uid?: string;
  xp?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'free' | 'premium';
  createdAt?: string;
  tripCount?: number;
}

export interface Ad {
  id: string;
  title: string;
  text: string;
  imageUrl?: string;
  link?: string;
  position: 'top' | 'bottom';
  isActive: boolean;
}

export interface LeaderboardEntry {
  id: string; // userId
  userName: string;
  xp: number;
  lastUpdated: string;
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

export interface Feedback {
  id: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  type: 'complaint' | 'rating' | 'suggestion';
  createdAt: string;
}

export const db = new Dexie('AuraJourneyDatabase') as Dexie & {
  stations: EntityTable<Station, 'id'>,
  tasks: EntityTable<Task, 'id'>,
  userSettings: EntityTable<UserSettings, 'id'>,
  reflections: EntityTable<TaskReflection, 'id'>,
  stumbles: EntityTable<Stumble, 'id'>,
  notifications: EntityTable<Notification, 'id'>,
  feedbacks: EntityTable<Feedback, 'id'>
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

db.version(8).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId, createdAt',
  stumbles: 'id, stationId, createdAt',
  notifications: 'id, isRead, createdAt',
  feedbacks: 'id, userId, type, createdAt'
});

db.open().catch(err => {
  console.error("Failed to open db: ", err.stack || err);
});

// Sync logic for Firebase
let activeSyncCount = 0;
let authInitialized = false;
let currentUserId = null;
import { auth, db as firestore } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot, deleteDoc, getDocFromServer, getDocs, writeBatch } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj === undefined ? null : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result;
}

let unsubscribeSettings: (() => void) | null = null;
let unsubscribeTasks: (() => void) | null = null;
let unsubscribeStations: (() => void) | null = null;
let unsubscribeReflections: (() => void) | null = null;
let unsubscribeStumbles: (() => void) | null = null;
let unsubscribeNotifications: (() => void) | null = null;
let unsubscribeFeedbacks: (() => void) | null = null;

const uploadLocalDataToFirestore = async (userId: string) => {
  try {
    const userSettingsPath = `users/${userId}/userSettings`;
    const snap = await getDocs(collection(firestore, userSettingsPath));
    if (snap.empty) {
      const localSettings = await db.userSettings.toArray();
      const localStations = await db.stations.toArray();
      const localTasks = await db.tasks.toArray();
      const localReflections = await db.reflections.toArray();
      const localStumbles = await db.stumbles.toArray();
      const localNotifications = await db.notifications.toArray();
      const localFeedbacks = await db.feedbacks.toArray();

      if (
        localSettings.length > 0 || 
        localStations.length > 0 || 
        localTasks.length > 0 ||
        localReflections.length > 0 ||
        localStumbles.length > 0 ||
        localNotifications.length > 0 ||
        localFeedbacks.length > 0
      ) {
        console.log(`Initial login merge: Firestore is empty. Migrating all local tables to Firestore.`);
        const batch = writeBatch(firestore);
        
        for (const item of localSettings) {
          batch.set(doc(firestore, `users/${userId}/userSettings`, item.id), sanitizeForFirestore(item));
        }
        for (const item of localStations) {
          batch.set(doc(firestore, `users/${userId}/stations`, item.id), sanitizeForFirestore(item));
        }
        for (const item of localTasks) {
          batch.set(doc(firestore, `users/${userId}/tasks`, item.id), sanitizeForFirestore(item));
        }
        for (const item of localReflections) {
          batch.set(doc(firestore, `users/${userId}/reflections`, item.id), sanitizeForFirestore(item));
        }
        for (const item of localStumbles) {
          batch.set(doc(firestore, `users/${userId}/stumbles`, item.id), sanitizeForFirestore(item));
        }
        for (const item of localNotifications) {
          batch.set(doc(firestore, `users/${userId}/notifications`, item.id), sanitizeForFirestore(item));
        }
        for (const item of localFeedbacks) {
          batch.set(doc(firestore, `users/${userId}/feedbacks`, item.id), sanitizeForFirestore(item));
        }
        
        await batch.commit();
        console.log("Migration of all tables to Firestore complete.");
      }
    }
  } catch (err) {
    console.warn("Failed to complete automatic local data migration:", err);
  }
};

// Call this from App.tsx on mount
export const initFirebaseSync = () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      currentUserId = null;
      authInitialized = false;
      
      if (unsubscribeSettings) { unsubscribeSettings(); unsubscribeSettings = null; }
      if (unsubscribeTasks) { unsubscribeTasks(); unsubscribeTasks = null; }
      if (unsubscribeStations) { unsubscribeStations(); unsubscribeStations = null; }
      if (unsubscribeReflections) { unsubscribeReflections(); unsubscribeReflections = null; }
      if (unsubscribeStumbles) { unsubscribeStumbles(); unsubscribeStumbles = null; }
      if (unsubscribeNotifications) { unsubscribeNotifications(); unsubscribeNotifications = null; }
      if (unsubscribeFeedbacks) { unsubscribeFeedbacks(); unsubscribeFeedbacks = null; }

      // Clear local Dexie DB when logged out
      await db.userSettings.clear();
      await db.tasks.clear();
      await db.stations.clear();
      await db.reflections.clear();
      await db.stumbles.clear();
      await db.notifications.clear();
      await db.feedbacks.clear();
      return;
    }

    currentUserId = user.uid;
    authInitialized = true;
    
    testConnection();
    
    // Merge any pre-auth offline/local user progress to Firestore first if Firestore is empty
    await uploadLocalDataToFirestore(user.uid);

    const userSettingsPath = `users/${user.uid}/userSettings`;
    if (unsubscribeSettings) unsubscribeSettings();
    // Sync Trips (userSettings) from Firebase to Dexie
    unsubscribeSettings = onSnapshot(collection(firestore, userSettingsPath), async (snapshot) => {
      activeSyncCount++;
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
        activeSyncCount--;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, userSettingsPath);
    });

    const tasksPath = `users/${user.uid}/tasks`;
    if (unsubscribeTasks) unsubscribeTasks();
    // Sync Tasks from Firebase to Dexie
    unsubscribeTasks = onSnapshot(collection(firestore, tasksPath), async (snapshot) => {
      activeSyncCount++;
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
        activeSyncCount--;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, tasksPath);
    });

    const stationsPath = `users/${user.uid}/stations`;
    if (unsubscribeStations) unsubscribeStations();
    // Sync Stations from Firebase to Dexie
    unsubscribeStations = onSnapshot(collection(firestore, stationsPath), async (snapshot) => {
      activeSyncCount++;
      try {
        const fbData = snapshot.docs.map(d => d.data() as Station);
        const localData = await db.stations.toArray();
        for (const fbItem of fbData) {
          await db.stations.put(fbItem);
        }
        const fbIds = new Set(fbData.map(d => d.id));
        for (const localItem of localData) {
          if (!fbIds.has(localItem.id)) {
            await db.stations.delete(localItem.id);
          }
        }
      } finally {
        activeSyncCount--;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, stationsPath);
    });

    const reflectionsPath = `users/${user.uid}/reflections`;
    if (unsubscribeReflections) unsubscribeReflections();
    // Sync Reflections from Firebase to Dexie
    unsubscribeReflections = onSnapshot(collection(firestore, reflectionsPath), async (snapshot) => {
      activeSyncCount++;
      try {
        const fbData = snapshot.docs.map(d => d.data() as any);
        const localData = await db.reflections.toArray();
        for (const fbItem of fbData) {
          await db.reflections.put(fbItem);
        }
        const fbIds = new Set(fbData.map(d => d.id));
        for (const localItem of localData) {
          if (!fbIds.has(localItem.id)) {
            await db.reflections.delete(localItem.id);
          }
        }
      } finally {
        activeSyncCount--;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, reflectionsPath);
    });

    const stumblesPath = `users/${user.uid}/stumbles`;
    if (unsubscribeStumbles) unsubscribeStumbles();
    // Sync Stumbles from Firebase to Dexie
    unsubscribeStumbles = onSnapshot(collection(firestore, stumblesPath), async (snapshot) => {
      activeSyncCount++;
      try {
        const fbData = snapshot.docs.map(d => d.data() as any);
        const localData = await db.stumbles.toArray();
        for (const fbItem of fbData) {
          await db.stumbles.put(fbItem);
        }
        const fbIds = new Set(fbData.map(d => d.id));
        for (const localItem of localData) {
          if (!fbIds.has(localItem.id)) {
            await db.stumbles.delete(localItem.id);
          }
        }
      } finally {
        activeSyncCount--;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, stumblesPath);
    });

    const notificationsPath = `users/${user.uid}/notifications`;
    if (unsubscribeNotifications) unsubscribeNotifications();
    // Sync Notifications from Firebase to Dexie
    unsubscribeNotifications = onSnapshot(collection(firestore, notificationsPath), async (snapshot) => {
      activeSyncCount++;
      try {
        const fbData = snapshot.docs.map(d => d.data() as any);
        const localData = await db.notifications.toArray();
        for (const fbItem of fbData) {
          await db.notifications.put(fbItem);
        }
        const fbIds = new Set(fbData.map(d => d.id));
        for (const localItem of localData) {
          if (!fbIds.has(localItem.id)) {
            await db.notifications.delete(localItem.id);
          }
        }
      } finally {
        activeSyncCount--;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, notificationsPath);
    });

    const feedbacksPath = `users/${user.uid}/feedbacks`;
    if (unsubscribeFeedbacks) unsubscribeFeedbacks();
    unsubscribeFeedbacks = onSnapshot(collection(firestore, feedbacksPath), async (snapshot) => {
      activeSyncCount++;
      try {
        const fbData = snapshot.docs.map(d => d.data() as any);
        const localData = await db.feedbacks.toArray();
        for (const fbItem of fbData) {
          await db.feedbacks.put(fbItem);
        }
        const fbIds = new Set(fbData.map(d => d.id));
        for (const localItem of localData) {
          if (!fbIds.has(localItem.id)) {
            await db.feedbacks.delete(localItem.id);
          }
        }
      } finally {
        activeSyncCount--;
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, feedbacksPath);
    });
  });

  // Track Dexie changes and push to Firebase
  const pushToFirebase = async (table: string, id: string, data: any, type: 'put' | 'delete') => {
    if (activeSyncCount > 0 || !authInitialized || !currentUserId) return;
    const path = `users/${currentUserId}/${table}/${id}`;
    try {
      const ref = doc(firestore, `users/${currentUserId}/${table}`, id);
      if (type === 'put') {
        await setDoc(ref, sanitizeForFirestore(data));
      } else {
        await deleteDoc(ref);
      }
    } catch(err) {
      handleFirestoreError(err, type === 'put' ? OperationType.WRITE : OperationType.DELETE, path);
    }
  };

  db.userSettings.hook('creating', (primKey, obj) => { pushToFirebase('userSettings', primKey, obj, 'put'); });
  db.userSettings.hook('updating', (mods, primKey, obj) => { pushToFirebase('userSettings', primKey, { ...obj, ...mods }, 'put'); });
  db.userSettings.hook('deleting', (primKey) => { pushToFirebase('userSettings', primKey, null, 'delete'); });

  db.tasks.hook('creating', (primKey, obj) => { pushToFirebase('tasks', primKey, obj, 'put'); });
  db.tasks.hook('updating', (mods, primKey, obj) => { pushToFirebase('tasks', primKey, { ...obj, ...mods }, 'put'); });
  db.tasks.hook('deleting', (primKey) => { pushToFirebase('tasks', primKey, null, 'delete'); });

  db.stations.hook('creating', (primKey, obj) => { pushToFirebase('stations', primKey, obj, 'put'); });
  db.stations.hook('updating', (mods, primKey, obj) => { pushToFirebase('stations', primKey, { ...obj, ...mods }, 'put'); });
  db.stations.hook('deleting', (primKey) => { pushToFirebase('stations', primKey, null, 'delete'); });

  db.reflections.hook('creating', (primKey, obj) => { pushToFirebase('reflections', primKey, obj, 'put'); });
  db.reflections.hook('updating', (mods, primKey, obj) => { pushToFirebase('reflections', primKey, { ...obj, ...mods }, 'put'); });
  db.reflections.hook('deleting', (primKey) => { pushToFirebase('reflections', primKey, null, 'delete'); });

  db.stumbles.hook('creating', (primKey, obj) => { pushToFirebase('stumbles', primKey, obj, 'put'); });
  db.stumbles.hook('updating', (mods, primKey, obj) => { pushToFirebase('stumbles', primKey, { ...obj, ...mods }, 'put'); });
  db.stumbles.hook('deleting', (primKey) => { pushToFirebase('stumbles', primKey, null, 'delete'); });

  db.notifications.hook('creating', (primKey, obj) => { pushToFirebase('notifications', primKey, obj, 'put'); });
  db.notifications.hook('updating', (mods, primKey, obj) => { pushToFirebase('notifications', primKey, { ...obj, ...mods }, 'put'); });
  db.notifications.hook('deleting', (primKey) => { pushToFirebase('notifications', primKey, null, 'delete'); });

  db.feedbacks.hook('creating', (primKey, obj) => { pushToFirebase('feedbacks', primKey, obj, 'put'); });
  db.feedbacks.hook('updating', (mods, primKey, obj) => { pushToFirebase('feedbacks', primKey, { ...obj, ...mods }, 'put'); });
  db.feedbacks.hook('deleting', (primKey) => { pushToFirebase('feedbacks', primKey, null, 'delete'); });
};

