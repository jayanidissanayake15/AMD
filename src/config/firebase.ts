import { initializeApp, getApps, getApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBOTF5qr7jYZCoRWKyQ7-zOojteaSknfnI",
  authDomain: "mind-relax-5c9c5.firebaseapp.com",
  projectId: "mind-relax-5c9c5",
  storageBucket: "mind-relax-5c9c5.firebasestorage.app",
  messagingSenderId: "797848352334",
  appId: "1:797848352334:web:ec9fc7c843de29ff38751f"
};

// Since we have hardcoded the configuration, Firebase is active
export const isFirebaseConfigured = true;

let app: any;
let auth: any;
let db: any;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  // Initialize Auth with AsyncStorage persistence to persist session across restarts
  // @ts-ignore
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = getFirestore(app);
} catch (error) {
  console.error('Error initializing Firebase SDK:', error);
  try {
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (innerError) {
    console.error('Fallback initialization failed:', innerError);
  }
}

export { auth, db };
