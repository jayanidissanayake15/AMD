import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalStorage, SecureStorage, STORAGE_KEYS } from '../services/storage';

export interface User {
  id: string;
  name: string;
  email: string;
  createdDate: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLocked: boolean;
  isPinSetup: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  lockApp: () => void;
  unlockApp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPinSetup, setIsPinSetup] = useState<boolean>(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      setIsLoading(true);
      // Check active user session
      const savedSession = await LocalStorage.getItem<User>(STORAGE_KEYS.USER_SESSION);
      if (savedSession) {
        setUser(savedSession);
        
        // Check if security PIN is enabled
        const pinEnabled = await SecureStorage.getItem(STORAGE_KEYS.PIN_ENABLED);
        const savedPin = await SecureStorage.getItem(STORAGE_KEYS.SECURITY_PIN);
        
        if (pinEnabled === 'true' && savedPin) {
          setIsPinSetup(true);
          setIsLocked(true); // Lock app on launch if PIN is enabled
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const emailLower = email.toLowerCase().trim();

      // Retrieve users list
      const users = await LocalStorage.getItem<Array<User & { password?: string }>>(STORAGE_KEYS.USERS_LIST) || [];
      const matchedUser = users.find(u => u.email.toLowerCase() === emailLower);

      if (!matchedUser) {
        return { success: false, error: 'User does not exist. Please register first.' };
      }

      if (matchedUser.password !== password) {
        return { success: false, error: 'Incorrect password.' };
      }

      // Successful login
      const sessionUser: User = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        createdDate: matchedUser.createdDate
      };

      await LocalStorage.setItem(STORAGE_KEYS.USER_SESSION, sessionUser);
      setUser(sessionUser);

      // Check PIN requirements
      const pinEnabled = await SecureStorage.getItem(STORAGE_KEYS.PIN_ENABLED);
      const savedPin = await SecureStorage.getItem(STORAGE_KEYS.SECURITY_PIN);
      
      if (pinEnabled === 'true' && savedPin) {
        setIsPinSetup(true);
        setIsLocked(true);
      } else {
        setIsPinSetup(false);
        setIsLocked(false);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Login failed due to an internal error.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const emailLower = email.toLowerCase().trim();
      const users = await LocalStorage.getItem<Array<User & { password?: string }>>(STORAGE_KEYS.USERS_LIST) || [];

      if (users.some(u => u.email.toLowerCase() === emailLower)) {
        return { success: false, error: 'An account with this email already exists.' };
      }

      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        name: name.trim(),
        email: emailLower,
        password: password,
        createdDate: new Date().toISOString()
      };

      users.push(newUser);
      await LocalStorage.setItem(STORAGE_KEYS.USERS_LIST, users);

      // Automatically sign in the registered user
      const sessionUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdDate: newUser.createdDate
      };

      await LocalStorage.setItem(STORAGE_KEYS.USER_SESSION, sessionUser);
      setUser(sessionUser);
      setIsPinSetup(false);
      setIsLocked(false);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await LocalStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      setUser(null);
      setIsLocked(false);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupPin = async (pin: string) => {
    await SecureStorage.setItem(STORAGE_KEYS.SECURITY_PIN, pin);
    await SecureStorage.setItem(STORAGE_KEYS.PIN_ENABLED, 'true');
    setIsPinSetup(true);
    setIsLocked(false);
  };

  const disablePin = async () => {
    await SecureStorage.deleteItem(STORAGE_KEYS.SECURITY_PIN);
    await SecureStorage.setItem(STORAGE_KEYS.PIN_ENABLED, 'false');
    setIsPinSetup(false);
    setIsLocked(false);
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    const savedPin = await SecureStorage.getItem(STORAGE_KEYS.SECURITY_PIN);
    if (savedPin === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (isPinSetup) {
      setIsLocked(true);
    }
  };

  const unlockApp = () => {
    setIsLocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLocked,
        isPinSetup,
        login,
        register,
        logout,
        setupPin,
        disablePin,
        verifyPin,
        lockApp,
        unlockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
