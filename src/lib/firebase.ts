'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { initializeFirestore, getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let storage: ReturnType<typeof getStorage> | undefined;

let initializationPromise: Promise<void> | null = null;

const initializeFirebase = async () => {
  if (typeof window === 'undefined') return;
  
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        // Initialize Firebase app if not already initialized
        if (!getApps().length) {
          app = initializeApp(firebaseConfig);
        } else {
          app = getApp();
        }

        // Initialize Auth
        auth = getAuth(app);

        // Initialize Firestore with settings
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        });

        // Initialize Storage
        storage = getStorage(app);

        // Enable offline persistence if supported
        if (process.env.NODE_ENV === 'production') {
          try {
            await enableIndexedDbPersistence(db);
          } catch (err: any) {
            if (err.code === 'failed-precondition') {
              console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code === 'unimplemented') {
              console.warn('The current browser does not support persistence.');
            }
          }
        }

        // Only use emulators if explicitly enabled
        if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
          if (!auth || !db || !storage) {
            throw new Error('Firebase services not initialized for emulators');
          }
          
          const { connectAuthEmulator } = await import('firebase/auth');
          const { connectFirestoreEmulator } = await import('firebase/firestore');
          const { connectStorageEmulator } = await import('firebase/storage');
          
          connectAuthEmulator(auth, 'http://localhost:9099');
          connectFirestoreEmulator(db, 'localhost', 8080);
          connectStorageEmulator(storage, 'localhost', 9199);
        }
      } catch (error) {
        console.error('Firebase initialization failed:', error);
        throw error;
      }
    })();
  }
  
  return initializationPromise;
};

// Initialize on client side
if (typeof window !== 'undefined') {
  initializeFirebase().catch(console.error);
}

export const getFirebase = async () => {
  if (typeof window === 'undefined') {
    return { app: null, auth: null, db: null, storage: null };
  }

  await initializeFirebase();

  if (!app || !auth || !db || !storage) {
    throw new Error('Firebase services failed to initialize. Check your configuration.');
  }

  return { app, auth, db, storage };
};

export default app;
export { auth }; 