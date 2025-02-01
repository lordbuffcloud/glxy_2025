import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
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

export interface StardustTransaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  planetName: string;
  timestamp: Timestamp;
}

export interface PlanetInteraction {
  id: string;
  planetName: string;
  type: string;
  content: string;
  stardustCost: number;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

export interface ClothingItem {
  id: string;
  imageUrl: string;
  tags: string[];
  category: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory';
  colors: string[];
  season: ('spring' | 'summer' | 'fall' | 'winter')[];
  style: string[];
  occasions: string[];
  lastWorn?: Timestamp;
  metadata: {
    aiTags?: string[];
    confidence?: number;
    userNotes?: string;
  };
  createdAt: Timestamp;
}

export interface OutfitSuggestion {
  id: string;
  items: ClothingItem[];
  occasion: string;
  style: string;
  season: string;
  explanation: string;
  createdAt: Timestamp;
  metadata: {
    weather?: {
      temperature?: number;
      condition?: string;
    };
    aiConfidence?: number;
  };
}

export interface PlanetData {
  chat: {
    conversations: PlanetInteraction[];
    preferences: {
      model: string;
      temperature: number;
    };
  };
  code: {
    snippets: PlanetInteraction[];
    preferences: {
      language: string;
      framework: string;
    };
  };
  art: {
    creations: PlanetInteraction[];
    preferences: {
      style: string;
      medium: string;
    };
  };
  music: {
    compositions: PlanetInteraction[];
    preferences: {
      genre: string;
      instrument: string;
    };
  };
  wardrobe: {
    items: ClothingItem[];
    preferences: {
      style: string[];
      occasions: string[];
      seasonalPreference: string;
    };
    suggestions: OutfitSuggestion[];
  };
} 