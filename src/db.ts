import Dexie, { type EntityTable } from 'dexie';

export interface Station {
  id: string;
  name: string;
  icon: string;
  description: string;
  generalNotes?: string;
  secretResourcesNotes?: string;
  riddleDetails?: string;
  riddleAnswer?: string;
  riddleHint?: string;
  riddleExplanation?: string;
  secretResourcesRiddleDetails?: string;
  secretResourcesRiddleAnswer?: string;
  secretResourcesRiddleHint?: string;
  secretResourcesRiddleExplanation?: string;
  secretResources?: { id: string; name: string; url: string; description?: string; puzzle?: string; puzzleAnswer?: string; puzzleHint?: string }[];
  targetDate: string;
  order: number;
}

export interface TaskActivity {
  id: string;
  title: string;
  description?: string;
  guidance?: string;
  learningResources?: string;
  youtubeUrl?: string;
  googleDriveUrl?: string;
  type?: "cognitive" | "applied" | "interactive";
  puzzleHint?: string;
  duration?: number; // Expected duration in minutes
  isCompleted: boolean;
  isSuspended?: boolean;
  comment?: string;
  steps?: { id: string; title: string, isCompleted: boolean }[];
  children?: TaskActivity[];
}

export interface Task {
  id: string;
  stationId: string;
  title: string;
  type: 'main' | 'sub' | 'side' | 'practical' | 'project';
  parentId?: string; // If sub, points to main
  isCompleted: boolean;
  activities?: TaskActivity[];
  dueDate?: string;
  description?: string;
  learningResources?: string;
  youtubeUrl?: string;
  googleDriveUrl?: string;
  youglishKeyword?: string;
  startMessage?: string;
  endMessage?: string;
  riddleDetails?: string;
  riddleAnswer?: string;
  riddleHint?: string;
  riddleExplanation?: string;
  hiddenRiddleDetails?: string;
  hiddenRiddleAnswer?: string;
  hiddenRiddleHint?: string;
  hiddenRiddleExplanation?: string;
  taskGoals?: string;
  taskOutcomes?: string;
  practicalPart?: string;
  taskReviewSessionsCount?: number;
  taskExtraXpEarned?: number;
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
  incentiveTime?: string;
  incentiveDesc?: string;
  planGoals?: string;
  planOutcomes?: string;
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
  reviewSessionProgress?: string[]; // Array of completed target IDs: 'original', 'review1', 'review2', 'review3'
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
  aiPromptEvaluation?: {
    promptCreated: boolean;
    promptTopic: string;
    promptExpected: boolean | null;
    promptAI: string;
    promptAIKey: string;
  };
  sheetsEvaluation?: {
    functionName: string;
    usageDescription: string;
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

export interface LearningRepository {
  id: string;
  tripId: string;
  name: string;
  createdAt: string;
  sentences?: { id: string; text: string; translation?: string; date: string; category?: string }[];
  listeningTricks?: { id: string; title: string; videoUrl?: string; trick: string; date: string; category?: string }[];
  errorsGaps?: { id: string; error: string; correction: string; area: string; date: string; category?: string }[];
  dailyContexts?: { id: string; topic: string; paragraph: string; date: string; category?: string }[];
}

export const db = new Dexie('AuraJourneyDatabase') as Dexie & {
  stations: EntityTable<Station, 'id'>,
  tasks: EntityTable<Task, 'id'>,
  userSettings: EntityTable<UserSettings, 'id'>,
  reflections: EntityTable<TaskReflection, 'id'>,
  stumbles: EntityTable<Stumble, 'id'>,
  notifications: EntityTable<Notification, 'id'>,
  learningRepositories: EntityTable<LearningRepository, 'id'>
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

db.version(8).stores({
  stations: 'id, order',
  tasks: 'id, stationId, type, parentId',
  userSettings: 'id',
  reflections: 'id, taskId, stationId, createdAt',
  stumbles: 'id, stationId, createdAt',
  notifications: 'id, isRead, createdAt',
  learningRepositories: 'id, tripId'
});

db.open().catch(err => {
  console.error("Failed to open db: ", err.stack || err);
});
