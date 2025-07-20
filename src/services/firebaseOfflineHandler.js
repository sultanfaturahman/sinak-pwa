/**
 * Firebase Offline Handler - Comprehensive Solution
 * Handles offline scenarios gracefully for SiNaK PWA
 */

import { 
  enableNetwork, 
  disableNetwork, 
  onSnapshot,
  doc,
  getDoc,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db } from './firebase.js';

// Offline state management
let isOffline = false;
let offlineQueue = [];
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

/**
 * Enhanced offline detection with multiple strategies
 */
class FirebaseOfflineDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.firebaseOnline = true;
    this.listeners = [];
    
    this.setupNetworkListeners();
    this.setupFirebaseListeners();
    this.startPeriodicCheck();
  }
  
  setupNetworkListeners() {
    // Browser online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Browser detected online');
      this.isOnline = true;
      this.handleOnlineStateChange();
    });
    
    window.addEventListener('offline', () => {
      console.log('📴 Browser detected offline');
      this.isOnline = false;
      this.handleOfflineStateChange();
    });
  }
  
  setupFirebaseListeners() {
    // Monitor Firebase connection with a test document
    try {
      const testDoc = doc(db, 'connection-test', 'status');
      
      const unsubscribe = onSnapshot(testDoc, 
        (snapshot) => {
          // Successfully connected to Firebase
          if (!this.firebaseOnline) {
            console.log('🔥 Firebase connection restored');
            this.firebaseOnline = true;
            this.handleOnlineStateChange();
          }
        },
        (error) => {
          // Firebase connection error
          console.warn('🔥 Firebase connection error:', error.code);
          
          if (error.code === 'unavailable' || error.message.includes('offline')) {
            if (this.firebaseOnline) {
              console.log('🔥 Firebase detected as offline');
              this.firebaseOnline = false;
              this.handleOfflineStateChange();
            }
          }
        }
      );
      
      // Store unsubscribe function for cleanup
      this.firebaseUnsubscribe = unsubscribe;
      
    } catch (error) {
      console.warn('⚠️ Could not setup Firebase connection listener:', error);
    }
  }
  
  startPeriodicCheck() {
    // Periodic connectivity check every 30 seconds
    setInterval(() => {
      this.checkFirebaseConnectivity();
    }, 30000);
  }
  
  async checkFirebaseConnectivity() {
    try {
      // Test Firebase connectivity with a simple read operation
      const testDoc = doc(db, 'connection-test', 'ping');
      const testPromise = getDoc(testDoc);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      await Promise.race([testPromise, timeoutPromise]);
      
      // If we reach here, Firebase is accessible
      if (!this.firebaseOnline) {
        console.log('🔥 Firebase connectivity restored via periodic check');
        this.firebaseOnline = true;
        this.handleOnlineStateChange();
      }
      
    } catch (error) {
      // Firebase is not accessible
      if (this.firebaseOnline && (
        error.code === 'unavailable' || 
        error.message.includes('offline') ||
        error.message.includes('timeout')
      )) {
        console.log('🔥 Firebase connectivity lost via periodic check');
        this.firebaseOnline = false;
        this.handleOfflineStateChange();
      }
    }
  }
  
  handleOnlineStateChange() {
    if (this.isOnline && this.firebaseOnline) {
      isOffline = false;
      reconnectAttempts = 0;
      this.notifyListeners('online');
      this.processOfflineQueue();
    }
  }
  
  handleOfflineStateChange() {
    if (!this.isOnline || !this.firebaseOnline) {
      isOffline = true;
      this.notifyListeners('offline');
      this.attemptReconnection();
    }
  }
  
  async attemptReconnection() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('🔄 Max reconnection attempts reached');
      return;
    }
    
    reconnectAttempts++;
    console.log(`🔄 Attempting Firebase reconnection (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    
    try {
      // Wait before attempting reconnection
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY * reconnectAttempts));
      
      // Try to enable network
      await enableNetwork(db);
      
      // Test connectivity
      await this.checkFirebaseConnectivity();
      
    } catch (error) {
      console.warn(`❌ Reconnection attempt ${reconnectAttempts} failed:`, error);
      
      // Try again if we haven't reached max attempts
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(() => this.attemptReconnection(), RECONNECT_DELAY * reconnectAttempts);
      }
    }
  }
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, {
          browserOnline: this.isOnline,
          firebaseOnline: this.firebaseOnline,
          reconnectAttempts
        });
      } catch (error) {
        console.warn('Error in offline listener:', error);
      }
    });
  }
  
  getStatus() {
    return {
      isOffline,
      browserOnline: this.isOnline,
      firebaseOnline: this.firebaseOnline,
      reconnectAttempts,
      queueSize: offlineQueue.length
    };
  }
  
  cleanup() {
    if (this.firebaseUnsubscribe) {
      this.firebaseUnsubscribe();
    }
  }
}

// Initialize offline detector
const offlineDetector = new FirebaseOfflineDetector();

/**
 * Queue operations for when Firebase comes back online
 */
export const queueOfflineOperation = (operation, operationName = 'unknown') => {
  console.log(`📝 Queuing offline operation: ${operationName}`);
  offlineQueue.push({
    operation,
    operationName,
    timestamp: Date.now()
  });
};

/**
 * Process queued operations when back online
 */
const processOfflineQueue = async () => {
  if (offlineQueue.length === 0) return;
  
  console.log(`🔄 Processing ${offlineQueue.length} queued operations`);
  
  const operations = [...offlineQueue];
  offlineQueue = [];
  
  for (const { operation, operationName } of operations) {
    try {
      await operation();
      console.log(`✅ Processed queued operation: ${operationName}`);
    } catch (error) {
      console.error(`❌ Failed to process queued operation ${operationName}:`, error);
      
      // Re-queue if it's a temporary error
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        queueOfflineOperation(operation, operationName);
      }
    }
  }
};

/**
 * Enhanced Firebase operation wrapper with offline handling
 */
export const withOfflineHandling = async (operation, operationName = 'Firebase operation') => {
  try {
    // Check if we're in emulator mode
    const isEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
    
    if (isEmulator && import.meta.env.DEV) {
      // In emulator mode, check if emulator is running
      try {
        const response = await fetch('http://localhost:8081');
        if (!response.ok) {
          throw new Error('Emulator not accessible');
        }
      } catch (emulatorError) {
        console.warn('🔧 Firebase Emulator not accessible, switching to fallback mode');
        throw new Error('Emulator offline - using fallback');
      }
    }
    
    // Attempt the operation
    const result = await operation();
    return result;
    
  } catch (error) {
    console.warn(`⚠️ ${operationName} failed:`, error);
    
    // Handle specific offline errors
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.log(`📴 ${operationName} failed due to offline status`);
      
      // Queue for later if it's a write operation
      if (operationName.includes('create') || operationName.includes('update') || operationName.includes('delete')) {
        queueOfflineOperation(operation, operationName);
      }
      
      // Return appropriate fallback
      return null;
    }
    
    // Re-throw other errors
    throw error;
  }
};

/**
 * Get offline status
 */
export const getOfflineStatus = () => offlineDetector.getStatus();

/**
 * Add offline status listener
 */
export const addOfflineListener = (callback) => {
  offlineDetector.addListener(callback);
};

/**
 * Remove offline status listener
 */
export const removeOfflineListener = (callback) => {
  offlineDetector.removeListener(callback);
};

/**
 * Manually trigger reconnection attempt
 */
export const forceReconnection = async () => {
  reconnectAttempts = 0;
  await offlineDetector.attemptReconnection();
};

/**
 * Clear offline queue
 */
export const clearOfflineQueue = () => {
  offlineQueue = [];
  console.log('🧹 Offline queue cleared');
};

// Export offline detector for advanced usage
export { offlineDetector };

console.log('🔧 Firebase Offline Handler initialized');
