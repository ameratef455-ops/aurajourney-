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
  duration?: number; // Expected duration in minutes
  isCompleted: boolean;
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
