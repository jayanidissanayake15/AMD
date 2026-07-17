import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalStorage, STORAGE_KEYS } from '../services/storage';
import { useAuth } from './AuthContext';
import { db, isFirebaseConfigured } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';

export type MoodType = 'great' | 'good' | 'okay' | 'anxious' | 'sad' | 'stressed' | 'difficult';

export interface MoodEntry {
  id: string;
  userId: string;
  moodType: MoodType;
  note: string;
  stressLevel: number; // 1-5 rating
  category: string; // 'education' | 'family' | 'relationships' | 'finance' | 'mentalPressure' | 'general'
  date: string; // ISO String
}

export interface StepGoal {
  id: string;
  userId: string;
  title: string;
  category: string;
  completed: boolean;
  createdDate: string;
}

interface MoodContextType {
  moods: MoodEntry[];
  goals: StepGoal[];
  isLoading: boolean;
  
  // Mood CRUD operations
  fetchMoods: () => Promise<void>;
  createMood: (mood: Omit<MoodEntry, 'id' | 'userId' | 'date'>) => Promise<MoodEntry>;
  updateMood: (id: string, updatedFields: Partial<Omit<MoodEntry, 'id' | 'userId' | 'date'>>) => Promise<MoodEntry>;
  deleteMood: (id: string) => Promise<void>;
  
  // Goals CRUD operations
  fetchGoals: () => Promise<void>;
  createGoal: (title: string, category: string) => Promise<StepGoal>;
  toggleGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export const MoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [goals, setGoals] = useState<StepGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Auto fetch when user session changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setMoods([]);
      setGoals([]);
    }
  }, [user]);

  const loadUserData = async () => {
    setIsLoading(true);
    await Promise.all([fetchMoods(), fetchGoals()]);
    setIsLoading(false);
  };

  // --- MOOD CRUD ---

  const fetchMoods = async () => {
    if (!user) return;
    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Fetching moods from Firestore...');
        const moodsRef = collection(db, 'moods');
        const q = query(moodsRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);
        const userMoods: MoodEntry[] = [];
        
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          userMoods.push({
            id: docSnap.id,
            userId: data.userId,
            moodType: data.moodType as MoodType,
            note: data.note,
            stressLevel: data.stressLevel,
            category: data.category,
            date: data.date,
          });
        });

        // Sort locally by date descending
        userMoods.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMoods(userMoods);
      } else {
        console.log('MoodContext: Fetching moods from LocalStorage fallback...');
        const allMoods = await LocalStorage.getItem<MoodEntry[]>(STORAGE_KEYS.MOODS) || [];
        const userMoods = allMoods.filter(m => m.userId === user.id);
        
        // Sort newest first
        userMoods.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMoods(userMoods);
      }
    } catch (error) {
      console.error('Error fetching moods:', error);
    }
  };

  const createMood = async (mood: Omit<MoodEntry, 'id' | 'userId' | 'date'>) => {
    if (!user) throw new Error('User session not found');
    
    const moodData = {
      ...mood,
      userId: user.id,
      date: new Date().toISOString()
    };

    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Saving mood to Firestore...');
        const moodsRef = collection(db, 'moods');
        const docRef = await addDoc(moodsRef, moodData);
        
        const newEntry: MoodEntry = {
          ...moodData,
          id: docRef.id,
        };
        
        // Update state
        setMoods(prev => [newEntry, ...prev]);
        return newEntry;
      } else {
        console.log('MoodContext: Saving mood to LocalStorage...');
        const newEntry: MoodEntry = {
          ...moodData,
          id: Math.random().toString(36).substring(2, 9),
        };
        const allMoods = await LocalStorage.getItem<MoodEntry[]>(STORAGE_KEYS.MOODS) || [];
        allMoods.push(newEntry);
        await LocalStorage.setItem(STORAGE_KEYS.MOODS, allMoods);
        
        // Update state
        setMoods(prev => [newEntry, ...prev]);
        return newEntry;
      }
    } catch (error) {
      console.error('Error saving mood entry:', error);
      throw error;
    }
  };

  const updateMood = async (id: string, updatedFields: Partial<Omit<MoodEntry, 'id' | 'userId' | 'date'>>) => {
    if (!user) throw new Error('User session not found');

    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Updating mood in Firestore...');
        const docRef = doc(db, 'moods', id);
        await updateDoc(docRef, updatedFields);

        let updatedEntry: MoodEntry | null = null;
        setMoods(prev => prev.map(m => {
          if (m.id === id) {
            updatedEntry = { ...m, ...updatedFields };
            return updatedEntry;
          }
          return m;
        }));

        if (!updatedEntry) {
          throw new Error('Mood entry not found in active state');
        }
        return updatedEntry;
      } else {
        console.log('MoodContext: Updating mood in LocalStorage...');
        const allMoods = await LocalStorage.getItem<MoodEntry[]>(STORAGE_KEYS.MOODS) || [];
        const index = allMoods.findIndex(m => m.id === id && m.userId === user.id);

        if (index === -1) {
          throw new Error('Mood entry not found or unauthorized');
        }

        const updatedEntry: MoodEntry = {
          ...allMoods[index],
          ...updatedFields
        };

        allMoods[index] = updatedEntry;
        await LocalStorage.setItem(STORAGE_KEYS.MOODS, allMoods);

        // Update state
        setMoods(prev => prev.map(m => m.id === id ? updatedEntry : m));
        return updatedEntry;
      }
    } catch (error) {
      console.error('Error updating mood entry:', error);
      throw error;
    }
  };

  const deleteMood = async (id: string) => {
    if (!user) throw new Error('User session not found');

    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Deleting mood from Firestore...');
        const docRef = doc(db, 'moods', id);
        await deleteDoc(docRef);
        
        // Update state
        setMoods(prev => prev.filter(m => m.id !== id));
      } else {
        console.log('MoodContext: Deleting mood from LocalStorage...');
        const allMoods = await LocalStorage.getItem<MoodEntry[]>(STORAGE_KEYS.MOODS) || [];
        const filteredMoods = allMoods.filter(m => !(m.id === id && m.userId === user.id));
        await LocalStorage.setItem(STORAGE_KEYS.MOODS, filteredMoods);

        // Update state
        setMoods(prev => prev.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      throw error;
    }
  };

  // --- GOALS CRUD ---

  const fetchGoals = async () => {
    if (!user) return;
    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Fetching goals from Firestore...');
        const goalsRef = collection(db, 'goals');
        const q = query(goalsRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);
        const userGoals: StepGoal[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          userGoals.push({
            id: docSnap.id,
            userId: data.userId,
            title: data.title,
            category: data.category,
            completed: data.completed,
            createdDate: data.createdDate
          });
        });

        // Sort locally by createdDate descending
        userGoals.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        setGoals(userGoals);
      } else {
        console.log('MoodContext: Fetching goals from LocalStorage fallback...');
        const allGoals = await LocalStorage.getItem<StepGoal[]>(STORAGE_KEYS.PLANS) || [];
        const userGoals = allGoals.filter(g => g.userId === user.id);
        
        // Sort newest first
        userGoals.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        setGoals(userGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const createGoal = async (title: string, category: string) => {
    if (!user) throw new Error('User session not found');

    const goalData = {
      userId: user.id,
      title: title.trim(),
      category,
      completed: false,
      createdDate: new Date().toISOString()
    };

    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Saving goal to Firestore...');
        const goalsRef = collection(db, 'goals');
        const docRef = await addDoc(goalsRef, goalData);
        
        const newGoal: StepGoal = {
          ...goalData,
          id: docRef.id,
        };

        // Update state
        setGoals(prev => [newGoal, ...prev]);
        return newGoal;
      } else {
        console.log('MoodContext: Saving goal to LocalStorage...');
        const newGoal: StepGoal = {
          ...goalData,
          id: Math.random().toString(36).substring(2, 9),
        };
        const allGoals = await LocalStorage.getItem<StepGoal[]>(STORAGE_KEYS.PLANS) || [];
        allGoals.push(newGoal);
        await LocalStorage.setItem(STORAGE_KEYS.PLANS, allGoals);

        // Update state
        setGoals(prev => [newGoal, ...prev]);
        return newGoal;
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  };

  const toggleGoal = async (id: string) => {
    if (!user) throw new Error('User session not found');

    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Toggling goal in Firestore...');
        const goalToToggle = goals.find(g => g.id === id);
        if (goalToToggle) {
          const docRef = doc(db, 'goals', id);
          await updateDoc(docRef, { completed: !goalToToggle.completed });

          // Update state
          setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
        }
      } else {
        console.log('MoodContext: Toggling goal in LocalStorage...');
        const allGoals = await LocalStorage.getItem<StepGoal[]>(STORAGE_KEYS.PLANS) || [];
        const index = allGoals.findIndex(g => g.id === id && g.userId === user.id);

        if (index !== -1) {
          allGoals[index].completed = !allGoals[index].completed;
          await LocalStorage.setItem(STORAGE_KEYS.PLANS, allGoals);
          
          // Update state
          setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
        }
      }
    } catch (error) {
      console.error('Error toggling goal status:', error);
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) throw new Error('User session not found');

    try {
      if (isFirebaseConfigured && db) {
        console.log('MoodContext: Deleting goal from Firestore...');
        const docRef = doc(db, 'goals', id);
        await deleteDoc(docRef);

        // Update state
        setGoals(prev => prev.filter(g => g.id !== id));
      } else {
        console.log('MoodContext: Deleting goal from LocalStorage...');
        const allGoals = await LocalStorage.getItem<StepGoal[]>(STORAGE_KEYS.PLANS) || [];
        const filteredGoals = allGoals.filter(g => !(g.id === id && g.userId === user.id));
        await LocalStorage.setItem(STORAGE_KEYS.PLANS, filteredGoals);

        // Update state
        setGoals(prev => prev.filter(g => g.id !== id));
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  return (
    <MoodContext.Provider
      value={{
        moods,
        goals,
        isLoading,
        fetchMoods,
        createMood,
        updateMood,
        deleteMood,
        fetchGoals,
        createGoal,
        toggleGoal,
        deleteGoal,
      }}
    >
      {children}
    </MoodContext.Provider>
  );
};

export const useMood = () => {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
};
