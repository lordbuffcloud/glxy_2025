'use client';

import { createContext, useContext, useCallback, useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, orderBy, limit, DocumentData, setDoc } from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';
import { useUser } from './UserContext';
import { useStardust } from './StardustContext';
import { PlanetInteraction, PlanetData } from '@/types';

interface PlanetsContextType {
  activePlanet: keyof PlanetData | null;
  setActivePlanet: (planet: keyof PlanetData | null) => void;
  createInteraction: (planetName: keyof PlanetData, type: string, content: string, stardustCost: number, metadata?: Record<string, any>) => Promise<boolean>;
  getRecentInteractions: (planetName: keyof PlanetData, limit?: number) => Promise<PlanetInteraction[]>;
  getPlanetPreferences: (planetName: keyof PlanetData) => Promise<Record<string, any> | null>;
  updatePlanetPreferences: (planetName: keyof PlanetData, preferences: Record<string, any>) => Promise<boolean>;
}

const PlanetsContext = createContext<PlanetsContextType | null>(null);

export function PlanetsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { spendStardust } = useStardust();
  const [activePlanet, setActivePlanet] = useState<keyof PlanetData | null>(null);

  const createInteraction = useCallback(
    async (
      planetName: keyof PlanetData,
      type: string,
      content: string,
      stardustCost: number,
      metadata?: Record<string, any>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        // First, try to spend stardust
        const { db } = await getFirebase();
        const success = await spendStardust(stardustCost, `${planetName} interaction: ${type}`, planetName);
        if (!success) return false;

        // Create the interaction record
        const interactionRef = collection(db, 'users', user.uid, 'planets', planetName, 'interactions');
        await addDoc(interactionRef, {
          type,
          content,
          stardustCost,
          metadata,
          timestamp: serverTimestamp(),
          planetName,
        });

        return true;
      } catch (error) {
        console.error('Error creating interaction:', error);
        return false;
      }
    },
    [user, spendStardust]
  );

  const getRecentInteractions = useCallback(
    async (planetName: keyof PlanetData, interactionLimit = 10): Promise<PlanetInteraction[]> => {
      if (!user) return [];

      try {
        const { db } = await getFirebase();
        const interactionsRef = collection(db, 'users', user.uid, 'planets', planetName, 'interactions');
        const q = query(interactionsRef, orderBy('timestamp', 'desc'), limit(interactionLimit));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map((doc: DocumentData) => ({
          id: doc.id,
          ...doc.data(),
        })) as PlanetInteraction[];
      } catch (error) {
        console.error('Error fetching interactions:', error);
        return [];
      }
    },
    [user]
  );

  const getPlanetPreferences = useCallback(
    async (planetName: keyof PlanetData): Promise<Record<string, any> | null> => {
      if (!user) return null;

      try {
        const { db } = await getFirebase();
        const preferencesRef = doc(db, 'users', user.uid, 'planets', planetName);
        const snapshot = await getDoc(preferencesRef);
        return snapshot.exists() ? snapshot.data()?.preferences : null;
      } catch (error) {
        console.error('Error fetching planet preferences:', error);
        return null;
      }
    },
    [user]
  );

  const updatePlanetPreferences = useCallback(
    async (planetName: keyof PlanetData, preferences: Record<string, any>): Promise<boolean> => {
      if (!user) return false;

      try {
        const { db } = await getFirebase();
        const preferencesRef = doc(db, 'users', user.uid, 'planets', planetName);
        await setDoc(preferencesRef, { preferences }, { merge: true });
        return true;
      } catch (error) {
        console.error('Error updating planet preferences:', error);
        return false;
      }
    },
    [user]
  );

  return (
    <PlanetsContext.Provider
      value={{
        activePlanet,
        setActivePlanet,
        createInteraction,
        getRecentInteractions,
        getPlanetPreferences,
        updatePlanetPreferences,
      }}
    >
      {children}
    </PlanetsContext.Provider>
  );
}

export const usePlanets = () => {
  const context = useContext(PlanetsContext);
  if (!context) {
    throw new Error('usePlanets must be used within a PlanetsProvider');
  }
  return context;
}; 