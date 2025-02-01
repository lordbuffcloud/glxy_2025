'use client';

import { createContext, useContext, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDocs, DocumentData } from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';
import { useUser } from './UserContext';
import { StardustTransaction } from '@/types';

interface StardustContextType {
  spendStardust: (amount: number, description: string, planetName: string) => Promise<boolean>;
  addStardust: (amount: number, description: string) => Promise<boolean>;
  getTransactionHistory: () => Promise<StardustTransaction[]>;
}

const StardustContext = createContext<StardustContextType | null>(null);

export function StardustProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useUser();
  const { db } = getFirebase();

  const spendStardust = useCallback(
    async (amount: number, description: string, planetName: string): Promise<boolean> => {
      if (!user || !profile || profile.stardust < amount) {
        return false;
      }

      try {
        // Create transaction record
        const transactionRef = collection(db, 'users', user.uid, 'transactions');
        await addDoc(transactionRef, {
          amount: -amount,
          type: 'debit',
          description,
          planetName,
          timestamp: serverTimestamp(),
        });

        // Update user's stardust balance
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          stardust: profile.stardust - amount,
        });

        return true;
      } catch (error) {
        console.error('Error spending stardust:', error);
        return false;
      }
    },
    [user, profile, db]
  );

  const addStardust = useCallback(
    async (amount: number, description: string): Promise<boolean> => {
      if (!user || !profile) {
        return false;
      }

      try {
        // Create transaction record
        const transactionRef = collection(db, 'users', user.uid, 'transactions');
        await addDoc(transactionRef, {
          amount,
          type: 'credit',
          description,
          planetName: 'system',
          timestamp: serverTimestamp(),
        });

        // Update user's stardust balance
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          stardust: profile.stardust + amount,
        });

        return true;
      } catch (error) {
        console.error('Error adding stardust:', error);
        return false;
      }
    },
    [user, profile, db]
  );

  const getTransactionHistory = useCallback(async (): Promise<StardustTransaction[]> => {
    if (!user) {
      return [];
    }

    try {
      const transactionRef = collection(db, 'users', user.uid, 'transactions');
      const snapshot = await getDocs(transactionRef);
      return snapshot.docs.map((doc: DocumentData) => ({
        id: doc.id,
        ...doc.data(),
      })) as StardustTransaction[];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }, [user, db]);

  return (
    <StardustContext.Provider value={{ spendStardust, addStardust, getTransactionHistory }}>
      {children}
    </StardustContext.Provider>
  );
}

export const useStardust = () => {
  const context = useContext(StardustContext);
  if (!context) {
    throw new Error('useStardust must be used within a StardustProvider');
  }
  return context;
}; 