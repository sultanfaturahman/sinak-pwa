import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import {
  createUserDocument,
  getUserDocument,
  updateUserDocument,
  handleFirestoreError
} from './firestoreService';

/**
 * Register new user with email, password, and business name
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} namaUsaha - Business name
 * @returns {Object} User object with additional data
 */
export const registerUser = async (email, password, namaUsaha) => {
  try {
    console.log('🔄 Starting user registration...');

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Firebase Auth user created:', user.uid);

    // Update user profile with display name
    await updateProfile(user, {
      displayName: namaUsaha
    });

    // Prepare user data
    const userData = {
      namaUsaha,
      email: user.email,
      uid: user.uid,
      // Initial business data
      businessStage: null,
      points: 0,
      completedChallenges: [],
      recommendations: [],
    };

    // Try to save to Firestore (non-blocking)
    const firestoreSuccess = await createUserDocument(user.uid, userData);

    if (!firestoreSuccess) {
      console.warn('⚠️ Firestore save failed, but registration continues');
    }

    // Return user object with additional data
    const result = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      ...userData
    };

    console.log('✅ User registration completed successfully');
    return result;

  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User object with additional data from Firestore
 */
export const loginUser = async (email, password) => {
  try {
    console.log('🔄 Starting user login...');

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Firebase Auth login successful:', user.uid);

    // Try to get additional user data from Firestore (non-blocking)
    const userData = await getUserDocument(user.uid);

    // Prepare result with fallback data
    const result = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      // Use Firestore data if available, otherwise use defaults
      namaUsaha: userData?.namaUsaha || user.displayName || 'Pengguna',
      businessStage: userData?.businessStage || null,
      points: userData?.points || 0,
      completedChallenges: userData?.completedChallenges || [],
      recommendations: userData?.recommendations || [],
      ...userData
    };

    console.log('✅ User login completed successfully');
    return result;

  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

/**
 * Logout current user
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Get current user data from Firestore
 * @param {string} uid - User ID
 * @returns {Object} User data from Firestore
 */
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

/**
 * Update user data in Firestore
 * @param {string} uid - User ID
 * @param {Object} data - Data to update
 */
export const updateUserData = async (uid, data) => {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
    return updateData;
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};
