// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBhZvHQT5Omr8L_O9sn-BFrni6GzPu4pqU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sinaik-pwa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sinaik-pwa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sinaik-pwa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "801751969697",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:801751969697:web:1461a75e437828126265e0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JHY41YCETE"
};

// Validate configuration
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter(key => !firebaseConfig[key]);

  if (missing.length > 0) {
    console.error('❌ Missing Firebase configuration:', missing);
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }

  console.log('✅ Firebase configuration validated');
  console.log('🔧 Project ID:', firebaseConfig.projectId);
};

// Validate before initializing
validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Development mode: Connect to emulators if available
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.log('⚠️ Firebase emulators not available, using production');
  }
}

console.log('🚀 Firebase initialized successfully');

export default app;