import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';
import { useStardust } from '@/contexts/StardustContext';
import { ClothingItem, OutfitSuggestion } from '@/types';

const UPLOAD_COST = 10; // Stardust cost for uploading and analyzing an item
const SUGGESTION_COST = 25; // Stardust cost for getting an outfit suggestion

export function useWardrobe() {
  const { user } = useUser();
  const { spendStardust } = useStardust();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadClothing = useCallback(
    async (
      file: File,
      category: ClothingItem['category'],
      userTags: string[] = []
    ): Promise<ClothingItem | null> => {
      if (!user) return null;
      setLoading(true);
      setError(null);

      try {
        // First, try to spend stardust
        const success = await spendStardust(UPLOAD_COST, 'Upload and analyze clothing item', 'wardrobe');
        if (!success) {
          setError('Insufficient Stardust balance');
          return null;
        }

        // Upload image to Firebase Storage
        const imageRef = ref(storage, `users/${user.uid}/wardrobe/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(imageRef);

        // Call AI analysis API
        const response = await fetch('/api/wardrobe/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl }),
        });

        if (!response.ok) throw new Error('Failed to analyze image');

        const analysis = await response.json();

        // Create clothing item in Firestore
        const itemData: Omit<ClothingItem, 'id'> = {
          imageUrl,
          category,
          tags: [...new Set([...userTags, ...analysis.tags])],
          colors: analysis.colors,
          season: analysis.seasons,
          style: analysis.styles,
          occasions: analysis.occasions,
          metadata: {
            aiTags: analysis.tags,
            confidence: analysis.confidence,
          },
          createdAt: serverTimestamp() as any,
        };

        const itemRef = await addDoc(collection(db, 'users', user.uid, 'wardrobe'), itemData);
        return { id: itemRef.id, ...itemData } as ClothingItem;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload clothing');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, spendStardust]
  );

  const getWardrobe = useCallback(async (): Promise<ClothingItem[]> => {
    if (!user) return [];
    setLoading(true);

    try {
      const wardrobeRef = collection(db, 'users', user.uid, 'wardrobe');
      const q = query(wardrobeRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClothingItem[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch wardrobe');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getSuggestion = useCallback(
    async (occasion: string, style?: string): Promise<OutfitSuggestion | null> => {
      if (!user) return null;
      setLoading(true);
      setError(null);

      try {
        // Spend stardust for suggestion
        const success = await spendStardust(SUGGESTION_COST, 'Get outfit suggestion', 'wardrobe');
        if (!success) {
          setError('Insufficient Stardust balance');
          return null;
        }

        // Get user's wardrobe
        const wardrobe = await getWardrobe();

        // Call suggestion API
        const response = await fetch('/api/wardrobe/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wardrobe, occasion, style }),
        });

        if (!response.ok) throw new Error('Failed to get suggestion');

        const suggestion = await response.json();

        // Save suggestion to Firestore
        const suggestionData: Omit<OutfitSuggestion, 'id'> = {
          items: suggestion.items,
          occasion: suggestion.occasion,
          style: suggestion.style,
          season: suggestion.season,
          explanation: suggestion.explanation,
          createdAt: serverTimestamp() as any,
          metadata: suggestion.metadata,
        };

        const suggestionRef = await addDoc(
          collection(db, 'users', user.uid, 'wardrobe-suggestions'),
          suggestionData
        );

        // Update lastWorn for suggested items
        for (const item of suggestion.items) {
          const itemRef = doc(db, 'users', user.uid, 'wardrobe', item.id);
          await updateDoc(itemRef, {
            lastWorn: serverTimestamp(),
          });
        }

        return { id: suggestionRef.id, ...suggestionData } as OutfitSuggestion;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get suggestion');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, spendStardust, getWardrobe]
  );

  return {
    uploadClothing,
    getWardrobe,
    getSuggestion,
    loading,
    error,
  };
} 