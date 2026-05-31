import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import generatedConfig from '../../firebase-applet-config.json';

// Use environment variables if they exist in secrets, otherwise fallback to the generated config
const meta = import.meta as any;
const env = meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || generatedConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || generatedConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || generatedConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || generatedConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || generatedConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || generatedConfig.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || generatedConfig.measurementId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (env.VITE_FIREBASE_DATABASE_ID as string) || generatedConfig.firestoreDatabaseId);
export const auth = getAuth();
