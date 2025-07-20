/**
 * Firestore State Manager
 * Prevents and handles "internal assertion state: unexpected state" errors
 */

import { 
  runTransaction, 
  doc, 
  getDoc,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db } from '../services/firebase.js';

// Global state management
const firestoreState = {
  isInitialized: false,
  isOnline: true,
  activeTransactions: new Map(),
  operationQueue: new Map(),
  lastOperation: null,
  errorCount: 0,
  maxConcurrentTransactions: 3,
  transactionTimeout: 30000, // 30 seconds
  operationDelay: 100 // Minimum delay between operations
};

/**
 * Initialize Firestore state manager
 */
export const initializeFirestoreStateManager = () => {
  if (firestoreState.isInitialized) {
    console.log('🔧 Firestore state manager already initialized');
    return;
  }

  console.log('🚀 Initializing Firestore state manager...');

  // Monitor network state
  window.addEventListener('online', handleNetworkOnline);
  window.addEventListener('offline', handleNetworkOffline);

  // Monitor page visibility for state cleanup
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupFirestoreState);

  firestoreState.isInitialized = true;
  console.log('✅ Firestore state manager initialized');
};

/**
 * Handle network coming online
 */
const handleNetworkOnline = async () => {
  console.log('🌐 Network came online, enabling Firestore...');
  firestoreState.isOnline = true;
  
  try {
    await enableNetwork(db);
    console.log('✅ Firestore network enabled');
    
    // Process queued operations
    await processQueuedOperations();
  } catch (error) {
    console.error('❌ Error enabling Firestore network:', error);
  }
};

/**
 * Handle network going offline
 */
const handleNetworkOffline = async () => {
  console.log('📴 Network went offline, managing Firestore state...');
  firestoreState.isOnline = false;
  
  try {
    // Cancel active transactions
    await cancelActiveTransactions();
    
    // Note: Don't disable network here as it can cause state issues
    // Let Firestore handle offline mode automatically
    console.log('✅ Firestore offline state managed');
  } catch (error) {
    console.error('❌ Error managing offline state:', error);
  }
};

/**
 * Handle page visibility changes
 */
const handleVisibilityChange = () => {
  if (document.hidden) {
    console.log('👁️ Page hidden, pausing Firestore operations...');
    // Pause new operations when page is hidden
  } else {
    console.log('👁️ Page visible, resuming Firestore operations...');
    // Resume operations when page becomes visible
  }
};

/**
 * Cancel active transactions
 */
const cancelActiveTransactions = async () => {
  console.log('🚫 Cancelling active transactions...');
  
  for (const [transactionId, transactionInfo] of firestoreState.activeTransactions) {
    try {
      if (transactionInfo.controller) {
        transactionInfo.controller.abort();
      }
      firestoreState.activeTransactions.delete(transactionId);
    } catch (error) {
      console.warn(`⚠️ Error cancelling transaction ${transactionId}:`, error);
    }
  }
  
  console.log('✅ Active transactions cancelled');
};

/**
 * Process queued operations when network comes back
 */
const processQueuedOperations = async () => {
  if (firestoreState.operationQueue.size === 0) {
    return;
  }

  console.log(`🔄 Processing ${firestoreState.operationQueue.size} queued operations...`);
  
  for (const [operationId, operation] of firestoreState.operationQueue) {
    try {
      await operation.execute();
      firestoreState.operationQueue.delete(operationId);
      console.log(`✅ Processed queued operation: ${operationId}`);
    } catch (error) {
      console.error(`❌ Error processing queued operation ${operationId}:`, error);
      
      // Remove failed operations after 3 attempts
      operation.attempts = (operation.attempts || 0) + 1;
      if (operation.attempts >= 3) {
        firestoreState.operationQueue.delete(operationId);
        console.log(`🗑️ Removed failed operation after 3 attempts: ${operationId}`);
      }
    }
    
    // Add delay between operations
    await new Promise(resolve => setTimeout(resolve, firestoreState.operationDelay));
  }
};

/**
 * Safe transaction wrapper that prevents state conflicts
 */
export const safeTransaction = async (transactionFunction, options = {}) => {
  const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const maxRetries = options.maxRetries || 3;
  const timeout = options.timeout || firestoreState.transactionTimeout;
  
  // Check if we have too many concurrent transactions
  if (firestoreState.activeTransactions.size >= firestoreState.maxConcurrentTransactions) {
    console.warn('⚠️ Too many concurrent transactions, queuing operation...');
    
    return new Promise((resolve, reject) => {
      const queuedOperation = {
        execute: () => safeTransaction(transactionFunction, options),
        resolve,
        reject,
        attempts: 0
      };
      
      firestoreState.operationQueue.set(transactionId, queuedOperation);
      
      // Process queue after a delay
      setTimeout(() => {
        if (firestoreState.operationQueue.has(transactionId)) {
          processQueuedOperations();
        }
      }, 1000);
    });
  }

  // Add minimum delay between operations
  const timeSinceLastOperation = Date.now() - (firestoreState.lastOperation || 0);
  if (timeSinceLastOperation < firestoreState.operationDelay) {
    await new Promise(resolve => 
      setTimeout(resolve, firestoreState.operationDelay - timeSinceLastOperation)
    );
  }

  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    attempt++;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Track active transaction
    firestoreState.activeTransactions.set(transactionId, {
      controller,
      startTime: Date.now(),
      attempt
    });

    try {
      console.log(`🔄 Starting transaction ${transactionId} (attempt ${attempt}/${maxRetries})`);
      
      const result = await runTransaction(db, async (transaction) => {
        // Check if transaction was aborted
        if (controller.signal.aborted) {
          throw new Error('Transaction aborted due to timeout');
        }
        
        return await transactionFunction(transaction);
      });

      // Success - cleanup and return
      clearTimeout(timeoutId);
      firestoreState.activeTransactions.delete(transactionId);
      firestoreState.lastOperation = Date.now();
      
      console.log(`✅ Transaction ${transactionId} completed successfully`);
      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      firestoreState.activeTransactions.delete(transactionId);
      lastError = error;
      
      console.error(`❌ Transaction ${transactionId} failed (attempt ${attempt}):`, error.message);

      // Handle specific error types
      if (error.message.includes('internal assertion') || 
          error.message.includes('unexpected state')) {
        
        console.error('🚨 Firestore internal assertion error detected');
        firestoreState.errorCount++;
        
        // If we've had multiple assertion errors, reset Firestore state
        if (firestoreState.errorCount >= 3) {
          console.log('🔄 Multiple assertion errors detected, resetting Firestore state...');
          await resetFirestoreState();
          firestoreState.errorCount = 0;
        }
        
        // Exponential backoff for assertion errors
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ Waiting ${backoffDelay}ms before retry due to assertion error...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        
      } else if (error.code === 'aborted') {
        console.log('🔄 Transaction aborted, retrying...');
        
        // Short delay for aborted transactions
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        
      } else if (error.code === 'unavailable') {
        console.log('📡 Firestore unavailable, waiting before retry...');
        
        // Longer delay for unavailable errors
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        
      } else {
        // For other errors, don't retry
        console.error(`❌ Non-retryable error in transaction ${transactionId}:`, error);
        break;
      }
    }
  }

  // All retries failed
  firestoreState.lastOperation = Date.now();
  console.error(`❌ Transaction ${transactionId} failed after ${maxRetries} attempts`);
  throw lastError;
};

/**
 * Reset Firestore state to recover from assertion errors
 */
const resetFirestoreState = async () => {
  console.log('🔄 Resetting Firestore state...');
  
  try {
    // Cancel all active transactions
    await cancelActiveTransactions();
    
    // Clear operation queue
    firestoreState.operationQueue.clear();
    
    // Reset network state
    if (firestoreState.isOnline) {
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(db);
    }
    
    console.log('✅ Firestore state reset completed');
    
  } catch (error) {
    console.error('❌ Error resetting Firestore state:', error);
  }
};

/**
 * Cleanup Firestore state on page unload
 */
const cleanupFirestoreState = () => {
  console.log('🧹 Cleaning up Firestore state...');
  
  // Cancel active transactions
  for (const [transactionId, transactionInfo] of firestoreState.activeTransactions) {
    if (transactionInfo.controller) {
      transactionInfo.controller.abort();
    }
  }
  
  firestoreState.activeTransactions.clear();
  firestoreState.operationQueue.clear();
};

/**
 * Get Firestore state information
 */
export const getFirestoreStateInfo = () => {
  return {
    isInitialized: firestoreState.isInitialized,
    isOnline: firestoreState.isOnline,
    activeTransactions: firestoreState.activeTransactions.size,
    queuedOperations: firestoreState.operationQueue.size,
    errorCount: firestoreState.errorCount,
    lastOperation: firestoreState.lastOperation
  };
};

/**
 * Test Firestore state management
 */
export const testFirestoreStateManagement = async () => {
  console.log('🧪 Testing Firestore State Management...');
  
  try {
    // Test safe transaction
    const result = await safeTransaction(async (transaction) => {
      const testRef = doc(db, 'test', 'state-test');
      const testDoc = await transaction.get(testRef);
      
      transaction.set(testRef, {
        timestamp: new Date().toISOString(),
        test: 'state-management'
      });
      
      return { success: true, exists: testDoc.exists() };
    });
    
    console.log('✅ Firestore state management test passed:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Firestore state management test failed:', error);
    return false;
  }
};

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirestoreStateManager);
  } else {
    initializeFirestoreStateManager();
  }
  
  // Make functions available globally for debugging
  window.getFirestoreStateInfo = getFirestoreStateInfo;
  window.testFirestoreStateManagement = testFirestoreStateManagement;
  window.resetFirestoreState = resetFirestoreState;
  
  console.log('🔧 Firestore state management functions available:');
  console.log('- getFirestoreStateInfo()');
  console.log('- testFirestoreStateManagement()');
  console.log('- resetFirestoreState()');
}

export default {
  initializeFirestoreStateManager,
  safeTransaction,
  getFirestoreStateInfo,
  testFirestoreStateManagement
};
