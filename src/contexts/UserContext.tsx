'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Auth } from 'firebase/auth';
import { 
  DocumentReference,
  DocumentSnapshot,
  Timestamp,
  onSnapshot,
  setDoc,
  doc,
  Firestore
} from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';

interface UserProfile {
  name: string;
  email: string;
  stardust: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

interface FirestoreUserProfile extends Omit<UserProfile, 'createdAt' | 'lastLoginAt'> {
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeProfile: (() => void) | undefined;

    const initializeFirebase = async () => {
      try {
        const { auth: firebaseAuth, db: firebaseDb } = await getFirebase();
        
        if (!firebaseAuth || !firebaseDb) {
          console.error('Firebase services not available');
          setLoading(false);
          setError('Firebase services not available');
          return;
        }

        const auth = firebaseAuth as Auth;
        const db = firebaseDb as Firestore;

        unsubscribeAuth = auth.onAuthStateChanged(async (user: User | null) => {
          setUser(user);
          if (!user) {
            setProfile(null);
            setLoading(false);
            return;
          }

          // Subscribe to user profile updates with retry logic
          const subscribeToProfile = async () => {
            try {
              const userRef = doc(db, 'users', user.uid);
              return onSnapshot(
                userRef,
                (docSnapshot: DocumentSnapshot) => {
                  setError(null);
                  if (docSnapshot.exists()) {
                    const data = docSnapshot.data() as FirestoreUserProfile;
                    // Convert Firestore Timestamp to Date
                    const profile: UserProfile = {
                      ...data,
                      createdAt: data.createdAt.toDate(),
                      lastLoginAt: data.lastLoginAt.toDate(),
                    };
                    setProfile(profile);
                  } else {
                    // Create default profile if it doesn't exist
                    const now = Timestamp.now();
                    const defaultProfile: FirestoreUserProfile = {
                      name: user.displayName || '',
                      email: user.email || '',
                      stardust: 1000,
                      preferences: {
                        theme: 'light',
                        notifications: true,
                      },
                      createdAt: now,
                      lastLoginAt: now,
                    };
                    setDoc(userRef, defaultProfile)
                      .then(() => setProfile({
                        ...defaultProfile,
                        createdAt: now.toDate(),
                        lastLoginAt: now.toDate(),
                      }))
                      .catch((error) => {
                        console.error('Error creating user profile:', error);
                        setError('Failed to create user profile');
                      });
                  }
                  setLoading(false);
                },
                (error) => {
                  console.error('Firestore subscription error:', error);
                  setError(`Database connection error: ${error.message}`);
                  
                  // Implement retry logic
                  if (retryCount < MAX_RETRIES) {
                    setRetryCount((prev) => prev + 1);
                    setTimeout(() => {
                      subscribeToProfile();
                    }, 1000 * Math.pow(2, retryCount));
                  } else {
                    setLoading(false);
                  }
                }
              );
            } catch (error) {
              console.error('Error setting up profile subscription:', error);
              setError('Failed to connect to the database');
              setLoading(false);
              return () => {};
            }
          };

          const unsubscribeProfileTemp = await subscribeToProfile();
          unsubscribeProfile = unsubscribeProfileTemp;
        });
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setError('Failed to initialize Firebase');
        setLoading(false);
      }
    };

    initializeFirebase();

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [retryCount]);

  // Don't render anything on the server side
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <UserContext.Provider value={{ user, profile, loading, error }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 