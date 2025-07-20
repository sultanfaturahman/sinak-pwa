/**
 * User Document Status Monitoring Utilities
 * Monitor and display user document initialization status
 */

import { getUserDocument, createUserDocument } from '../services/firestoreService.js';
import { useAuthStore } from '../store/auth.js';

/**
 * Check current user document status
 */
export const checkUserDocumentStatus = async () => {
  console.log('🔍 Checking User Document Status...');
  console.log('=' .repeat(50));

  const authStore = useAuthStore();
  const user = authStore.user;

  if (!user || !user.uid) {
    console.log('❌ No authenticated user found');
    return {
      status: 'no_user',
      message: 'No authenticated user',
      hasDocument: false,
      documentData: null
    };
  }

  console.log(`👤 Checking document for user: ${user.uid}`);
  console.log(`📧 Email: ${user.email}`);
  console.log(`🏢 Business: ${user.namaUsaha || 'Not set'}`);

  try {
    const userData = await getUserDocument(user.uid);

    if (userData) {
      console.log('✅ User document found in Firestore');
      console.log('📄 Document data:');
      console.log(`   - Email: ${userData.email || 'Not set'}`);
      console.log(`   - Business Name: ${userData.namaUsaha || 'Not set'}`);
      console.log(`   - Created: ${userData.createdAt || 'Unknown'}`);
      console.log(`   - Updated: ${userData.updatedAt || 'Unknown'}`);
      console.log(`   - Business Profile: ${userData.businessProfile ? 'Present' : 'Missing'}`);
      console.log(`   - Preferences: ${userData.preferences ? 'Present' : 'Missing'}`);
      console.log(`   - Analytics: ${userData.analytics ? 'Present' : 'Missing'}`);
      
      // Check for migration flags
      if (userData.migratedUser) {
        console.log(`   - Migration: Migrated user (${userData.migrationDate || 'Unknown date'})`);
      }
      if (userData.createdFromDashboard) {
        console.log(`   - Dashboard Creation: Created from dashboard (${userData.dashboardCreationDate || 'Unknown date'})`);
      }

      return {
        status: 'document_exists',
        message: 'User document found',
        hasDocument: true,
        documentData: userData,
        isComplete: !!(userData.businessProfile && userData.preferences && userData.analytics)
      };

    } else {
      console.log('❌ User document not found in Firestore');
      console.log('💡 This user needs document initialization');

      return {
        status: 'no_document',
        message: 'User document not found',
        hasDocument: false,
        documentData: null,
        needsCreation: true
      };
    }

  } catch (error) {
    console.error('❌ Error checking user document:', error);
    return {
      status: 'error',
      message: `Error checking document: ${error.message}`,
      hasDocument: false,
      documentData: null,
      error: error
    };
  }
};

/**
 * Create missing user document with comprehensive data
 */
export const createMissingUserDocument = async () => {
  console.log('🔧 Creating Missing User Document...');

  const authStore = useAuthStore();
  const user = authStore.user;

  if (!user || !user.uid) {
    console.log('❌ No authenticated user found');
    return false;
  }

  try {
    const comprehensiveUserData = {
      uid: user.uid,
      email: user.email,
      namaUsaha: user.namaUsaha || user.displayName || 'Bisnis Saya',
      
      // Business profile with defaults
      businessProfile: {
        businessName: user.namaUsaha || user.displayName || 'Bisnis Saya',
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
        theme: 'light',
        emailNotifications: true,
        pushNotifications: false
      },
      
      // Analytics and tracking
      analytics: {
        totalRecommendations: 0,
        completedRecommendations: 0,
        lastLoginAt: new Date().toISOString(),
        documentCreatedAt: new Date().toISOString(),
        dashboardAccessCount: 0,
        recommendationGenerationCount: 0
      },
      
      // Status and flags
      isActive: true,
      isEmailVerified: user.emailVerified || false,
      onboardingCompleted: false,
      
      // Creation context
      manuallyCreated: true,
      creationMethod: 'user_document_monitor',
      creationDate: new Date().toISOString()
    };

    console.log('📄 Creating comprehensive user document...');
    const success = await createUserDocument(user.uid, comprehensiveUserData);

    if (success) {
      console.log('✅ User document created successfully');
      
      // Update auth store with new data
      authStore.setUser({ ...user, ...comprehensiveUserData });
      
      return true;
    } else {
      console.log('❌ Failed to create user document');
      return false;
    }

  } catch (error) {
    console.error('❌ Error creating user document:', error);
    return false;
  }
};

/**
 * Fix incomplete user document
 */
export const fixIncompleteUserDocument = async () => {
  console.log('🔧 Fixing Incomplete User Document...');

  const status = await checkUserDocumentStatus();
  
  if (status.status !== 'document_exists') {
    console.log('❌ Cannot fix document - document does not exist');
    return false;
  }

  if (status.isComplete) {
    console.log('✅ User document is already complete');
    return true;
  }

  const authStore = useAuthStore();
  const user = authStore.user;
  const existingData = status.documentData;

  try {
    // Fill in missing fields
    const updatedData = {
      ...existingData,
      
      // Ensure business profile exists
      businessProfile: {
        businessName: user.namaUsaha || user.displayName || 'Bisnis Saya',
        category: null,
        stage: null,
        location: null,
        employeeCount: null,
        monthlyRevenue: null,
        challenges: [],
        goals: [],
        description: null,
        ...existingData.businessProfile
      },
      
      // Ensure preferences exist
      preferences: {
        language: 'id',
        notifications: true,
        theme: 'light',
        emailNotifications: true,
        pushNotifications: false,
        ...existingData.preferences
      },
      
      // Ensure analytics exist
      analytics: {
        totalRecommendations: 0,
        completedRecommendations: 0,
        lastLoginAt: new Date().toISOString(),
        dashboardAccessCount: 0,
        recommendationGenerationCount: 0,
        ...existingData.analytics,
        documentFixedAt: new Date().toISOString()
      },
      
      // Add fix flag
      documentFixed: true,
      fixDate: new Date().toISOString()
    };

    console.log('📝 Updating user document with missing fields...');
    const success = await createUserDocument(user.uid, updatedData);

    if (success) {
      console.log('✅ User document fixed successfully');
      authStore.setUser({ ...user, ...updatedData });
      return true;
    } else {
      console.log('❌ Failed to fix user document');
      return false;
    }

  } catch (error) {
    console.error('❌ Error fixing user document:', error);
    return false;
  }
};

/**
 * Display comprehensive user document report
 */
export const displayUserDocumentReport = async () => {
  console.log('📊 User Document Status Report');
  console.log('=' .repeat(60));

  const status = await checkUserDocumentStatus();
  
  console.log(`📋 Status: ${status.status.toUpperCase()}`);
  console.log(`💬 Message: ${status.message}`);
  console.log(`📄 Has Document: ${status.hasDocument ? 'YES' : 'NO'}`);
  
  if (status.hasDocument && status.documentData) {
    const data = status.documentData;
    
    console.log('\n📊 Document Completeness Check:');
    console.log(`   ✅ Basic Info: ${data.email && data.namaUsaha ? 'Complete' : 'Incomplete'}`);
    console.log(`   ${data.businessProfile ? '✅' : '❌'} Business Profile: ${data.businessProfile ? 'Present' : 'Missing'}`);
    console.log(`   ${data.preferences ? '✅' : '❌'} Preferences: ${data.preferences ? 'Present' : 'Missing'}`);
    console.log(`   ${data.analytics ? '✅' : '❌'} Analytics: ${data.analytics ? 'Present' : 'Missing'}`);
    
    console.log('\n🏷️ Document Flags:');
    console.log(`   - Migrated User: ${data.migratedUser ? 'YES' : 'NO'}`);
    console.log(`   - Created from Dashboard: ${data.createdFromDashboard ? 'YES' : 'NO'}`);
    console.log(`   - Manually Created: ${data.manuallyCreated ? 'YES' : 'NO'}`);
    console.log(`   - Document Fixed: ${data.documentFixed ? 'YES' : 'NO'}`);
    console.log(`   - Onboarding Complete: ${data.onboardingCompleted ? 'YES' : 'NO'}`);
    
    if (data.analytics) {
      console.log('\n📈 Analytics Summary:');
      console.log(`   - Total Recommendations: ${data.analytics.totalRecommendations || 0}`);
      console.log(`   - Completed Recommendations: ${data.analytics.completedRecommendations || 0}`);
      console.log(`   - Dashboard Access Count: ${data.analytics.dashboardAccessCount || 0}`);
      console.log(`   - Last Login: ${data.analytics.lastLoginAt || 'Unknown'}`);
    }
  }
  
  if (status.needsCreation) {
    console.log('\n💡 Recommended Actions:');
    console.log('   - Run createMissingUserDocument() to create the document');
  } else if (status.hasDocument && !status.isComplete) {
    console.log('\n💡 Recommended Actions:');
    console.log('   - Run fixIncompleteUserDocument() to complete missing fields');
  }
  
  console.log('\n' + '=' .repeat(60));
  
  return status;
};

/**
 * Auto-fix user document issues
 */
export const autoFixUserDocument = async () => {
  console.log('🔧 Auto-Fixing User Document Issues...');
  
  const status = await checkUserDocumentStatus();
  
  if (status.status === 'no_document') {
    console.log('📝 Creating missing user document...');
    return await createMissingUserDocument();
  } else if (status.status === 'document_exists' && !status.isComplete) {
    console.log('🔧 Fixing incomplete user document...');
    return await fixIncompleteUserDocument();
  } else if (status.status === 'document_exists' && status.isComplete) {
    console.log('✅ User document is already complete');
    return true;
  } else {
    console.log(`❌ Cannot auto-fix: ${status.message}`);
    return false;
  }
};

// Make monitoring functions available globally
if (typeof window !== 'undefined') {
  window.checkUserDocumentStatus = checkUserDocumentStatus;
  window.createMissingUserDocument = createMissingUserDocument;
  window.fixIncompleteUserDocument = fixIncompleteUserDocument;
  window.displayUserDocumentReport = displayUserDocumentReport;
  window.autoFixUserDocument = autoFixUserDocument;
  
  console.log('👤 User document monitoring functions available:');
  console.log('- checkUserDocumentStatus()');
  console.log('- createMissingUserDocument()');
  console.log('- fixIncompleteUserDocument()');
  console.log('- displayUserDocumentReport()');
  console.log('- autoFixUserDocument()');
}

export default {
  checkUserDocumentStatus,
  createMissingUserDocument,
  fixIncompleteUserDocument,
  displayUserDocumentReport,
  autoFixUserDocument
};
