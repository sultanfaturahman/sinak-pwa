import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirestoreHealthy, retryFirestoreConnection, getFirestoreStatus } from './firebase';
import { safeTransaction } from '../utils/firestoreStateManager.js';
import {
  withOfflineHandling,
  getOfflineStatus,
  queueOfflineOperation,
  addOfflineListener
} from './firebaseOfflineHandler.js';

// Firebase error monitoring
let firebaseErrorCount = 0;
let lastFirebaseError = null;
const MAX_FIREBASE_ERRORS = 3;

/**
 * Monitor Firebase errors and switch to fallback mode if needed
 */
const monitorFirebaseError = (error) => {
  firebaseErrorCount++;
  lastFirebaseError = {
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString()
  };

  console.log(`🚨 Firebase error #${firebaseErrorCount}:`, error.message);

  if (firebaseErrorCount >= MAX_FIREBASE_ERRORS) {
    console.error('🚨 Too many Firebase errors, consider switching to fallback mode');
    console.error('🚨 Last error:', lastFirebaseError);
  }

  // Check for specific critical errors
  if (error.message.includes('INTERNAL ASSERTION FAILED')) {
    console.error('🚨 CRITICAL: Firebase internal assertion error detected');
    return true; // Indicate critical error
  }

  return false;
};

// Firebase error statistics function moved to end of file for enhanced version

/**
 * Check if Firestore is available and accessible
 */
export const checkFirestoreConnection = async () => {
  try {
    // Try to read a test document
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    console.log('✅ Firestore connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
};

/**
 * Safely create or update user document with offline handling
 */
export const createUserDocument = async (uid, userData) => {
  // Check if Firestore is disabled
  if (import.meta.env.VITE_DISABLE_FIRESTORE === 'true') {
    console.log('🔧 Firestore disabled, skipping user document creation');
    return true; // Return success to not break the flow
  }

  // Check offline status first
  const offlineStatus = getOfflineStatus();
  if (offlineStatus.isOffline) {
    console.log('📴 Device is offline, queuing user document creation');
    queueOfflineOperation(
      () => createUserDocument(uid, userData),
      `createUserDocument-${uid}`
    );
    return true; // Return success to not break the flow
  }

  // Check Firestore health before attempting operation
  if (!isFirestoreHealthy()) {
    console.log('⚠️ Firestore not healthy, attempting to reconnect...');
    const reconnected = await retryFirestoreConnection();
    if (!reconnected) {
      console.log('🔧 Firestore reconnection failed, queuing operation');
      queueOfflineOperation(
        () => createUserDocument(uid, userData),
        `createUserDocument-${uid}`
      );
      return false;
    }
  }

  const MAX_RETRIES = 3;
  let lastError = null;

  // Retry logic for document creation with offline handling
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔍 DEBUG: Creating/updating user document for ${uid} (attempt ${attempt}/${MAX_RETRIES})`);

      // Wrap the entire operation with offline handling
      const result = await withOfflineHandling(async () => {
        const userRef = doc(db, 'users', uid);

        // Use safe transaction wrapper to prevent state conflicts
        return await safeTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);

        const now = serverTimestamp();
        const currentTime = new Date().toISOString();

        if (!userDoc.exists()) {
          console.log('📄 Creating new user document');

          // Create new document with comprehensive data
          const newUserData = {
            uid: uid,
            ...userData,
            createdAt: now,
            updatedAt: now,

            // Ensure essential fields exist
            email: userData.email || null,
            namaUsaha: userData.namaUsaha || 'Bisnis Baru',

            // Ensure business profile exists
            businessProfile: {
              businessName: userData.namaUsaha || 'Bisnis Baru',
              category: null,
              stage: null,
              location: null,
              employeeCount: null,
              monthlyRevenue: null,
              challenges: [],
              goals: [],
              description: null,
              ...userData.businessProfile
            },

            // Ensure preferences exist
            preferences: {
              language: 'id',
              notifications: true,
              theme: 'light',
              ...userData.preferences
            },

            // Ensure analytics exist
            analytics: {
              totalRecommendations: 0,
              completedRecommendations: 0,
              lastLoginAt: currentTime,
              registrationDate: currentTime,
              ...userData.analytics
            },

            // Status fields
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            isEmailVerified: userData.isEmailVerified || false,
            onboardingCompleted: userData.onboardingCompleted || false
          };

          transaction.set(userRef, newUserData);

        } else {
          console.log('📝 Updating existing user document');

          // Update existing document, preserving existing data
          const existingData = userDoc.data();
          const updatedData = {
            ...existingData,
            ...userData,
            updatedAt: now,

            // Merge business profile
            businessProfile: {
              ...existingData.businessProfile,
              ...userData.businessProfile
            },

            // Merge preferences
            preferences: {
              ...existingData.preferences,
              ...userData.preferences
            },

            // Merge analytics
            analytics: {
              ...existingData.analytics,
              ...userData.analytics
            }
          };

          transaction.update(userRef, updatedData);
        }

        return true;
        });
      }, `createUserDocument-${uid}`);

      if (result) {
        console.log('✅ User document created/updated successfully in Firestore');
        return true;
      }

    } catch (error) {
      lastError = error;
      console.error(`❌ Firestore createUserDocument error (attempt ${attempt}):`, error);

      // Handle specific error types
      if (error.message.includes('INTERNAL ASSERTION FAILED')) {
        console.error('🚨 Firebase internal assertion error during user document creation');

        if (attempt < MAX_RETRIES) {
          console.log('🔄 Attempting recovery from internal assertion error...');

          try {
            await retryFirestoreConnection();
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } catch (recoveryError) {
            console.error('❌ Recovery attempt failed:', recoveryError);
          }
        }
      } else if (error.code === 'aborted') {
        console.log('🔄 Transaction aborted, retrying...');
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(500 * attempt, 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // If this is the last attempt, break
      if (attempt === MAX_RETRIES) {
        break;
      }
    }
  }

  // All retries failed
  console.error(`❌ All ${MAX_RETRIES} user document creation attempts failed. Last error:`, lastError?.message);

  // Monitor the error
  monitorFirebaseError(lastError);

  return false;
};

/**
 * Safely get user document with enhanced error handling and health checks
 */
export const getUserDocument = async (uid) => {
  // Check if Firestore is disabled
  if (import.meta.env.VITE_DISABLE_FIRESTORE === 'true') {
    console.log('🔧 Firestore disabled, using local storage only');
    return null;
  }

  // Check Firestore health before attempting operation
  if (!isFirestoreHealthy()) {
    console.log('⚠️ Firestore not healthy, attempting to reconnect...');
    const reconnected = await retryFirestoreConnection();
    if (!reconnected) {
      console.log('🔧 Firestore reconnection failed, using fallback mode');
      return null;
    }
  }

  // Fallback mode - more aggressive error handling
  const fallbackMode = import.meta.env.VITE_FIRESTORE_FALLBACK_MODE === 'true';

  try {
    console.log('🔍 DEBUG: Attempting to get user document for:', uid);

    const userRef = doc(db, 'users', uid);

    // Add timeout to prevent hanging
    const getDocPromise = getDoc(userRef);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timeout')), 15000)
    );

    const userSnap = await Promise.race([getDocPromise, timeoutPromise]);

    if (userSnap.exists()) {
      console.log('✅ User document retrieved successfully from Firestore');
      return userSnap.data();
    } else {
      console.log('ℹ️ User document does not exist in Firestore');
      return null;
    }
  } catch (error) {
    console.error('❌ Firestore getUserDocument error:', error);

    // Enhanced error handling for specific error types
    if (error.message.includes('INTERNAL ASSERTION FAILED')) {
      console.log('🔧 Handling Firestore internal assertion error in getUserDocument');

      // Try to recover by retrying the connection
      try {
        await retryFirestoreConnection();
        console.log('✅ Firestore connection recovered, operation will continue with fallback');
      } catch (recoveryError) {
        console.error('❌ Firestore recovery failed:', recoveryError);
      }
    }

    // Monitor the error
    const isCritical = monitorFirebaseError(error);

    if (isCritical || fallbackMode) {
      console.log('🔧 Critical error or fallback mode - continuing without Firestore');
      return null;
    } else {
      // In non-fallback mode, still don't throw to prevent app crashes
      console.log('🔧 Firestore error detected, switching to local storage mode');
      return null;
    }
  }
};

/**
 * Enhanced user document update with transaction support and robust error recovery
 */
export const updateUserDocument = async (uid, updateData) => {
  // Check if Firestore is disabled
  if (import.meta.env.VITE_DISABLE_FIRESTORE === 'true') {
    console.log('🔧 Firestore disabled, skipping user document update');
    return true; // Return success to not break the flow
  }

  // Check Firestore health before attempting operation
  if (!isFirestoreHealthy()) {
    console.log('⚠️ Firestore not healthy, attempting to reconnect...');
    const reconnected = await retryFirestoreConnection();
    if (!reconnected) {
      console.log('🔧 Firestore reconnection failed, skipping update');
      return false;
    }
  }

  const fallbackMode = import.meta.env.VITE_FIRESTORE_FALLBACK_MODE === 'true';
  const MAX_RETRIES = 3;
  let lastError = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔍 DEBUG: Attempting to update user document for ${uid} (attempt ${attempt}/${MAX_RETRIES})`);

      const userRef = doc(db, 'users', uid);

      // Use safe transaction wrapper to prevent state conflicts and assertion errors
      const result = await safeTransaction(async (transaction) => {
        // First, check if document exists
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          console.log('📄 User document does not exist, creating new document');
          // Create document if it doesn't exist
          transaction.set(userRef, {
            ...updateData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            uid: uid
          });
        } else {
          console.log('📝 User document exists, updating with transaction');
          // Update existing document
          transaction.update(userRef, {
            ...updateData,
            updatedAt: serverTimestamp()
          });
        }

        return true;
      });

      if (result) {
        console.log('✅ User document updated successfully in Firestore with transaction');
        return true;
      }

    } catch (error) {
      lastError = error;
      console.error(`❌ Firestore updateUserDocument error (attempt ${attempt}):`, error);

      // Handle specific error types
      if (error.message.includes('INTERNAL ASSERTION FAILED')) {
        console.error('🚨 Firebase internal assertion error during update');

        if (attempt < MAX_RETRIES) {
          console.log('🔄 Attempting recovery from internal assertion error...');

          try {
            // Try to recover by retrying the connection
            await retryFirestoreConnection();

            // Wait before retry with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));

            continue; // Retry the operation
          } catch (recoveryError) {
            console.error('❌ Recovery attempt failed:', recoveryError);
          }
        }
      } else if (error.code === 'aborted') {
        console.log('🔄 Transaction aborted, retrying...');
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(500 * attempt, 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else if (error.code === 'unavailable') {
        console.log('🔄 Firestore unavailable, retrying...');
        if (attempt < MAX_RETRIES) {
          const delay = Math.min(1000 * attempt, 3000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      // If this is the last attempt or a non-retryable error, break
      if (attempt === MAX_RETRIES) {
        break;
      }
    }
  }

  // All retries failed
  console.error(`❌ All ${MAX_RETRIES} update attempts failed. Last error:`, lastError?.message);

  // Monitor the error
  monitorFirebaseError(lastError);

  if (fallbackMode) {
    console.log('🔧 Fallback mode - update failed but continuing');
    return false; // Indicate failure but don't crash
  } else {
    console.log('🔧 Firestore error detected, continuing without persistence');
    return false;
  }
};

/**
 * Specialized function for updating recommendation data with optimized batching
 */
export const updateRecommendationData = async (uid, recommendationData) => {
  // Check if Firestore is disabled
  if (import.meta.env.VITE_DISABLE_FIRESTORE === 'true') {
    console.log('🔧 Firestore disabled, skipping recommendation data update');
    return true;
  }

  // Check Firestore health
  if (!isFirestoreHealthy()) {
    console.log('⚠️ Firestore not healthy for recommendation update');
    const reconnected = await retryFirestoreConnection();
    if (!reconnected) {
      return false;
    }
  }

  try {
    console.log('📊 Updating recommendation data with optimized approach...');

    // Split large recommendation data into smaller chunks to avoid document size limits
    const { recommendations, businessProfile, analytics } = recommendationData;

    // Prepare optimized update data
    let optimizedData = {
      businessProfile: businessProfile || {},
      analytics: analytics || {},
      recommendationCount: recommendations?.length || 0,
      lastRecommendationUpdate: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Store recommendations separately if they're too large
    if (recommendations && recommendations.length > 0) {
      // Calculate approximate size
      const dataSize = JSON.stringify(recommendations).length;
      console.log(`📏 Recommendation data size: ${Math.round(dataSize / 1024)}KB`);

      if (dataSize > 500000) { // If larger than 500KB
        console.log('📦 Large dataset detected, using batch approach...');

        // Use batch writes for large datasets
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', uid);

        // Update main user document without recommendations
        batch.update(userRef, optimizedData);

        // Store recommendations in a separate subcollection
        const recommendationsRef = doc(db, 'users', uid, 'data', 'recommendations');
        batch.set(recommendationsRef, {
          recommendations: recommendations,
          updatedAt: serverTimestamp()
        });

        await batch.commit();
        console.log('✅ Large recommendation data saved using batch approach');

      } else {
        // Small dataset, use regular transaction
        optimizedData.recommendations = recommendations;
        const success = await updateUserDocument(uid, optimizedData);
        return success;
      }
    } else {
      // No recommendations, just update other data
      const success = await updateUserDocument(uid, optimizedData);
      return success;
    }

    return true;

  } catch (error) {
    console.error('❌ Error updating recommendation data:', error);

    // Handle specific errors
    if (error.message.includes('INTERNAL ASSERTION FAILED')) {
      console.log('🔧 Internal assertion error in recommendation update, falling back to simple update');

      try {
        // Fallback to simple update without recommendations
        const fallbackData = {
          businessProfile: recommendationData.businessProfile || {},
          analytics: recommendationData.analytics || {},
          recommendationCount: recommendationData.recommendations?.length || 0,
          lastUpdateAttempt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        };

        return await updateUserDocument(uid, fallbackData);
      } catch (fallbackError) {
        console.error('❌ Fallback update also failed:', fallbackError);
        return false;
      }
    }

    return false;
  }
};

/**
 * Handle Firestore errors gracefully
 */
export const handleFirestoreError = (error, operation = 'Firestore operation') => {
  console.error(`❌ ${operation} failed:`, error);
  
  // Check for specific error types
  if (error.code === 'permission-denied') {
    return 'Akses ditolak. Periksa konfigurasi security rules Firestore.';
  } else if (error.code === 'unavailable') {
    return 'Layanan database tidak tersedia. Coba lagi nanti.';
  } else if (error.code === 'not-found') {
    return 'Database tidak ditemukan. Periksa konfigurasi project.';
  } else {
    return 'Terjadi kesalahan pada database. Aplikasi akan tetap berjalan tanpa sinkronisasi data.';
  }
};

/**
 * Get comprehensive Firebase status for debugging
 */
export const getFirebaseErrorStats = () => {
  const firestoreStatus = getFirestoreStatus();

  return {
    errorCount: firebaseErrorCount,
    lastError: lastFirebaseError,
    maxErrors: MAX_FIREBASE_ERRORS,
    isInFallbackMode: firebaseErrorCount >= MAX_FIREBASE_ERRORS,
    firestoreHealth: {
      initialized: firestoreStatus.initialized,
      retryCount: firestoreStatus.retryCount,
      maxRetries: firestoreStatus.maxRetries,
      canRetry: firestoreStatus.canRetry
    }
  };
};

/**
 * Reset Firebase error count (for testing/recovery)
 */
export const resetFirebaseErrorCount = () => {
  firebaseErrorCount = 0;
  lastFirebaseError = null;
  console.log('🔄 Firebase error count reset');
};

/**
 * Test Firestore connectivity
 */
export const testFirestoreConnectivity = async () => {
  try {
    console.log('🧪 Testing Firestore connectivity...');

    if (!isFirestoreHealthy()) {
      console.log('⚠️ Firestore not healthy, attempting reconnection...');
      await retryFirestoreConnection();
    }

    // Try a simple read operation
    const testRef = doc(db, 'test', 'connectivity');
    await getDoc(testRef);

    console.log('✅ Firestore connectivity test passed');
    return true;

  } catch (error) {
    console.error('❌ Firestore connectivity test failed:', error);
    return false;
  }
};

// Make debugging functions available globally for console access
if (typeof window !== 'undefined') {
  window.getFirebaseErrorStats = getFirebaseErrorStats;
  window.testFirestoreConnectivity = testFirestoreConnectivity;
  window.resetFirebaseErrorCount = resetFirebaseErrorCount;

  console.log('🔧 Firestore debugging functions available:');
  console.log('- getFirebaseErrorStats()');
  console.log('- testFirestoreConnectivity()');
  console.log('- resetFirebaseErrorCount()');
}
