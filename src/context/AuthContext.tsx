import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalStorage, SecureStorage, STORAGE_KEYS } from '../services/storage';
import { auth as firebaseAuth, isFirebaseConfigured } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

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

const getFirebaseAuthErrorMessage = (error: any, fallbackMessage: string): string => {
  let code = error?.code;
  
  // Extract error code from message if code is missing but present in the message
  if (!code && error?.message && typeof error.message === 'string') {
    const match = error.message.match(/\((auth\/[^)]+)\)/);
    if (match) {
      code = match[1];
    }
  }

  if (!code) {
    return error?.message || fallbackMessage;
  }

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'Sign-in provider is disabled. Please contact support.';
    default:
      return error.message || fallbackMessage;
  }
};

const isExpectedAuthError = (error: any): boolean => {
  let code = error?.code;
  if (!code && error?.message && typeof error.message === 'string') {
    const match = error.message.match(/\((auth\/[^)]+)\)/);
    if (match) {
      code = match[1];
    }
  }
  if (!code) return false;
  
  const expectedCodes = [
    'auth/email-already-in-use',
    'auth/invalid-credential',
    'auth/user-not-found',
    'auth/wrong-password',
    'auth/invalid-email',
    'auth/weak-password',
    'auth/too-many-requests'
  ];
  return expectedCodes.includes(code);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isPinSetup, setIsPinSetup] = useState<boolean>(false);

  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      console.log('AuthContext: Firebase detected. Initializing listener...');
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        try {
          setIsLoading(true);
          if (firebaseUser) {
            const sessionUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              createdDate: firebaseUser.metadata.creationTime || new Date().toISOString(),
            };
            setUser(sessionUser);

            // Check if security PIN is enabled
            const pinEnabled = await SecureStorage.getItem(STORAGE_KEYS.PIN_ENABLED);
            const savedPin = await SecureStorage.getItem(STORAGE_KEYS.SECURITY_PIN);
            
            if (pinEnabled === 'true' && savedPin) {
              setIsPinSetup(true);
              setIsLocked(true);
            } else {
              setIsPinSetup(false);
              setIsLocked(false);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        } finally {
          setIsLoading(false);
        }
      });
      return unsubscribe;
    } else {
      console.log('AuthContext: Firebase not configured. Using LocalStorage fallback...');
      loadSession();
    }
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

      if (isFirebaseConfigured && firebaseAuth) {
        // Firebase Login
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, emailLower, password);
        const fbUser = userCredential.user;
        const sessionUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || emailLower.split('@')[0],
          email: fbUser.email || emailLower,
          createdDate: fbUser.metadata.creationTime || new Date().toISOString(),
        };
        
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
      } else {
        // Local Fallback
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
      }
    } catch (error: any) {
      if (isExpectedAuthError(error)) {
        console.log('Login validation error:', error.code || error.message);
      } else {
        console.error('Login error:', error);
      }
      const errorMsg = getFirebaseAuthErrorMessage(error, 'Login failed.');
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const emailLower = email.toLowerCase().trim();

      if (isFirebaseConfigured && firebaseAuth) {
        // Firebase Register
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, emailLower, password);
        const fbUser = userCredential.user;
        
        // Update user display name in Firebase Auth
        await updateProfile(fbUser, { displayName: name.trim() });
        
        const sessionUser: User = {
          id: fbUser.uid,
          name: name.trim(),
          email: fbUser.email || emailLower,
          createdDate: fbUser.metadata.creationTime || new Date().toISOString(),
        };

        setUser(sessionUser);
        setIsPinSetup(false);
        setIsLocked(false);

        return { success: true };
      } else {
        // Local Fallback
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
      }
    } catch (error: any) {
      if (isExpectedAuthError(error)) {
        console.log('Registration validation error:', error.code || error.message);
      } else {
        console.error('Registration error:', error);
      }
      const errorMsg = getFirebaseAuthErrorMessage(error, 'Registration failed.');
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      if (isFirebaseConfigured && firebaseAuth) {
        await firebaseSignOut(firebaseAuth);
      } else {
        await LocalStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      }
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
