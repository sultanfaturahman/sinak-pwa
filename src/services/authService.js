import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import app from './firebase';
import { createUserDocument, getUserDocument } from './firestoreService';

const auth = getAuth(app);

export const registerUser = async (email, password, namaUsaha) => {
  try {
    console.log('🔄 Creating new user account...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User account created successfully:', user.uid);

    // Create comprehensive user document with default values
    const userData = {
      uid: user.uid,
      email: user.email,
      namaUsaha: namaUsaha || 'Bisnis Baru',

      // Business profile defaults
      businessProfile: {
        businessName: namaUsaha || 'Bisnis Baru',
        category: null,
        stage: null,
        location: null,
        employeeCount: null,
        monthlyRevenue: null,
        challenges: [],
        goals: [],
        description: null
      },

      // User preferences
      preferences: {
        language: 'id',
        notifications: true,
        theme: 'light'
      },

      // Analytics
      analytics: {
        totalRecommendations: 0,
        completedRecommendations: 0,
        lastLoginAt: new Date().toISOString(),
        registrationDate: new Date().toISOString()
      },

      // Status
      isActive: true,
      isEmailVerified: user.emailVerified || false,
      onboardingCompleted: false
    };

    console.log('📄 Creating user document in Firestore...');
    const documentCreated = await createUserDocument(user.uid, userData);

    if (documentCreated) {
      console.log('✅ User document created successfully');
    } else {
      console.warn('⚠️ User document creation failed, but registration succeeded');
    }

    // Return user with additional data
    return {
      ...user,
      namaUsaha: namaUsaha,
      documentCreated: documentCreated
    };

  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log('🔄 Authenticating user...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User authenticated successfully:', user.uid);

    // Check if user document exists
    console.log('📄 Checking user document in Firestore...');
    let userData = await getUserDocument(user.uid);

    if (!userData) {
      console.log('📝 User document not found, creating default document...');

      // Create default user document for existing users
      const defaultUserData = {
        uid: user.uid,
        email: user.email,
        namaUsaha: user.displayName || 'Bisnis Saya',

        // Business profile defaults
        businessProfile: {
          businessName: user.displayName || 'Bisnis Saya',
          category: null,
          stage: null,
          location: null,
          employeeCount: null,
          monthlyRevenue: null,
          challenges: [],
          goals: [],
          description: null
        },

        // User preferences
        preferences: {
          language: 'id',
          notifications: true,
          theme: 'light'
        },

        // Analytics
        analytics: {
          totalRecommendations: 0,
          completedRecommendations: 0,
          lastLoginAt: new Date().toISOString(),
          firstLoginAt: new Date().toISOString()
        },

        // Status
        isActive: true,
        isEmailVerified: user.emailVerified || false,
        onboardingCompleted: false,

        // Migration flag
        migratedUser: true,
        migrationDate: new Date().toISOString()
      };

      const documentCreated = await createUserDocument(user.uid, defaultUserData);

      if (documentCreated) {
        console.log('✅ Default user document created for existing user');
        userData = defaultUserData;
      } else {
        console.warn('⚠️ Failed to create user document, using minimal data');
        userData = {
          uid: user.uid,
          email: user.email,
          namaUsaha: user.displayName || 'Bisnis Saya'
        };
      }
    } else {
      console.log('✅ User document found in Firestore');

      // Update last login time
      try {
        const updatedAnalytics = {
          ...userData.analytics,
          lastLoginAt: new Date().toISOString()
        };

        // Update the document with new login time (non-blocking)
        createUserDocument(user.uid, {
          ...userData,
          analytics: updatedAnalytics
        }).catch(error => {
          console.warn('⚠️ Failed to update last login time:', error);
        });

        userData.analytics = updatedAnalytics;
      } catch (error) {
        console.warn('⚠️ Error updating login time:', error);
      }
    }

    // Return user with Firestore data
    return {
      ...user,
      ...userData,
      firestoreData: userData
    };

  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
};
