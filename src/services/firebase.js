// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Firebase AI available in v12.0.0 - using Firebase AI Logic client SDKs
import { getAI, GoogleAIBackend } from "firebase/ai";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBhZvHQT5Omr8L_O9sn-BFrni6GzPu4pqU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sinaik-pwa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sinaik-pwa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sinaik-pwa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "801751969697",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:801751969697:web:72cd22232c25d1906265e0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BNLMHV9GG3"
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
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Firebase AI (available in v12.0.0+)
let ai = null;
try {
  if (import.meta.env.VITE_ENABLE_FIREBASE_AI !== 'false') {
    ai = getAI(app, { backend: new GoogleAIBackend() });
    console.log('✅ Firebase AI initialized with Gemini Developer API');
  }
} catch (error) {
  console.warn('⚠️ Firebase AI initialization failed:', error.message);
  console.log('💡 Firebase AI requires proper API key configuration');
}

// Enhanced Firestore connection monitoring and error handling
import {
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  terminate,
  clearIndexedDbPersistence,
  waitForPendingWrites
} from 'firebase/firestore';

// Firestore connection state management
let firestoreInitialized = false;
let connectionRetryCount = 0;
const MAX_RETRY_COUNT = 3;

// Enhanced Firestore initialization with error recovery and offline handling
const initializeFirestoreWithRecovery = async () => {
  try {
    // Check if we're in development and should use emulator
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && import.meta.env.DEV) {
      try {
        if (!firestoreInitialized) {
          // Check if emulator is running before connecting
          try {
            const emulatorResponse = await fetch('http://localhost:8081');
            if (emulatorResponse.ok || emulatorResponse.status === 404) {
              connectFirestoreEmulator(db, 'localhost', 8081);
              console.log('🔧 Connected to Firestore Emulator on port 8081');
            }
          } catch (emulatorError) {
            console.warn('⚠️ Firestore Emulator not running, using production Firebase');
            console.warn('💡 Start emulator with: firebase emulators:start --only firestore');
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to connect to Firestore Emulator:', error);
      }
    }

    // Enable network with retry logic
    await enableNetwork(db);
    console.log('✅ Firestore network enabled successfully');
    firestoreInitialized = true;
    connectionRetryCount = 0;

  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);

    // Enhanced offline error handling
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.log('📴 Firestore detected as offline - enabling offline mode');
      firestoreInitialized = false;
      return; // Don't retry for offline errors
    }

    // Handle specific error types
    if (error.code === 'failed-precondition' && connectionRetryCount < MAX_RETRY_COUNT) {
      console.log(`🔄 Retrying Firestore initialization (${connectionRetryCount + 1}/${MAX_RETRY_COUNT})`);
      connectionRetryCount++;

      try {
        // Try to clear any corrupted state
        await disableNetwork(db);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Retry initialization
        await initializeFirestoreWithRecovery();
      } catch (retryError) {
        console.error('❌ Firestore retry failed:', retryError);
      }
    } else if (error.message.includes('INTERNAL ASSERTION FAILED')) {
      console.log('🔧 Handling Firestore internal assertion error...');

      try {
        // Force cleanup and reinitialize
        await terminate(db);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Clear any cached data that might be causing issues
        try {
          await clearIndexedDbPersistence(db);
          console.log('✅ Cleared Firestore persistence cache');
        } catch (clearError) {
          console.log('ℹ️ Could not clear persistence cache (may not be enabled)');
        }

        // Reinitialize
        await enableNetwork(db);
        console.log('✅ Firestore recovered from internal assertion error');
        firestoreInitialized = true;

      } catch (recoveryError) {
        console.error('❌ Firestore recovery failed:', recoveryError);
        firestoreInitialized = false;
      }
    }
  }
};

// Monitor Firestore connection status
const monitorFirestoreConnection = () => {

  // Enhanced connection test with better error handling
  const testConnection = async () => {
    try {
      // Use the enhanced initialization
      await initializeFirestoreWithRecovery();

      // Test a simple operation to verify connectivity
      const { doc, getDoc } = await import('firebase/firestore');
      const testDoc = doc(db, 'test', 'connection');

      // Set a timeout for the test operation
      const testPromise = getDoc(testDoc);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection test timeout')), 10000)
      );

      await Promise.race([testPromise, timeoutPromise]);
      console.log('✅ Firestore connection test successful');

    } catch (error) {
      console.error('❌ Firestore connection test failed:', error);
      console.log('🔍 Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200)
      });

      // Enhanced troubleshooting based on error patterns
      if (error.code === 'unavailable') {
        console.log('💡 Troubleshooting: Firestore service unavailable');
        console.log('   - Check internet connection');
        console.log('   - Verify Firebase project is active');
        console.log('   - Check if Firestore is enabled in Firebase Console');
      } else if (error.code === 'permission-denied') {
        console.log('💡 Troubleshooting: Permission denied');
        console.log('   - Check Firestore security rules');
        console.log('   - Verify user authentication');
      } else if (error.message.includes('offline')) {
        console.log('💡 Troubleshooting: Client detected as offline');
        console.log('   - This may be a CORS or network configuration issue');
        console.log('   - Check browser network tab for failed requests');
        console.log('   - Verify API key permissions in Firebase Console');
      } else if (error.message.includes('INTERNAL ASSERTION FAILED')) {
        console.log('💡 Troubleshooting: Firestore internal assertion error');
        console.log('   - This is a known issue with Firestore v10.12.5');
        console.log('   - The app will continue to function with fallback mechanisms');
        console.log('   - Consider upgrading Firebase SDK when available');
      } else if (error.message.includes('timeout')) {
        console.log('💡 Troubleshooting: Connection timeout');
        console.log('   - Network may be slow or unstable');
        console.log('   - Firestore will retry automatically');
      }

      // Set fallback mode if connection fails
      firestoreInitialized = false;
    }
  };

  // Run connection test after a short delay
  setTimeout(testConnection, 1000);
};

// Start monitoring
monitorFirestoreConnection();

// Export Firestore health check function
export const isFirestoreHealthy = () => firestoreInitialized;

// Export function to manually retry Firestore connection
export const retryFirestoreConnection = async () => {
  console.log('🔄 Manually retrying Firestore connection...');
  connectionRetryCount = 0;
  await initializeFirestoreWithRecovery();
  return firestoreInitialized;
};

// Export function to get Firestore connection status
export const getFirestoreStatus = () => ({
  initialized: firestoreInitialized,
  retryCount: connectionRetryCount,
  maxRetries: MAX_RETRY_COUNT,
  canRetry: connectionRetryCount < MAX_RETRY_COUNT
});

console.log('🚀 Firebase initialized successfully');

// Export Firebase services for use in other modules
export { app, auth, db, ai };
export default app;