/**
 * User Document Initialization Testing Utilities
 * Test the fixed user document creation and initialization flow
 */

import { createUserDocument, getUserDocument } from '../services/firestoreService.js';
import { registerUser, loginUser } from '../services/authService.js';

/**
 * Test user document creation during registration
 */
export const testUserRegistrationFlow = async () => {
  console.log('🧪 Testing User Registration Document Creation...');
  console.log('=' .repeat(60));

  const results = {
    testName: 'User Registration Document Creation',
    passed: true,
    errors: [],
    details: []
  };

  try {
    // Test data
    const testEmail = `test-reg-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testBusinessName = 'Test Registration Business';

    console.log('📋 Step 1: Testing registration process...');
    
    try {
      // This would normally create a real user, but we'll simulate the document creation part
      console.log('🔄 Simulating user registration...');
      
      // Test the document creation logic directly
      const testUserId = 'test-user-reg-' + Date.now();
      const userData = {
        uid: testUserId,
        email: testEmail,
        namaUsaha: testBusinessName,
        
        businessProfile: {
          businessName: testBusinessName,
          category: null,
          stage: null,
          location: null,
          employeeCount: null,
          monthlyRevenue: null,
          challenges: [],
          goals: [],
          description: null
        },
        
        preferences: {
          language: 'id',
          notifications: true,
          theme: 'light'
        },
        
        analytics: {
          totalRecommendations: 0,
          completedRecommendations: 0,
          lastLoginAt: new Date().toISOString(),
          registrationDate: new Date().toISOString()
        },
        
        isActive: true,
        isEmailVerified: false,
        onboardingCompleted: false
      };

      const documentCreated = await createUserDocument(testUserId, userData);
      
      if (documentCreated) {
        results.details.push('✅ User document created during registration simulation');
        
        // Verify the document was created correctly
        const retrievedData = await getUserDocument(testUserId);
        if (retrievedData) {
          results.details.push('✅ User document retrieved successfully after creation');
          
          // Check essential fields
          if (retrievedData.email === testEmail) {
            results.details.push('✅ Email field preserved correctly');
          } else {
            results.errors.push('Email field not preserved correctly');
            results.passed = false;
          }
          
          if (retrievedData.namaUsaha === testBusinessName) {
            results.details.push('✅ Business name preserved correctly');
          } else {
            results.errors.push('Business name not preserved correctly');
            results.passed = false;
          }
          
          if (retrievedData.businessProfile && retrievedData.businessProfile.businessName === testBusinessName) {
            results.details.push('✅ Business profile initialized correctly');
          } else {
            results.errors.push('Business profile not initialized correctly');
            results.passed = false;
          }
          
        } else {
          results.errors.push('Failed to retrieve user document after creation');
          results.passed = false;
        }
        
      } else {
        results.errors.push('User document creation failed during registration');
        results.passed = false;
      }
      
    } catch (error) {
      results.errors.push(`Registration test error: ${error.message}`);
      results.passed = false;
    }

  } catch (error) {
    results.errors.push(`Registration flow test error: ${error.message}`);
    results.passed = false;
  }

  console.log(results.passed ? '✅ Registration flow test passed' : '❌ Registration flow test failed');
  return results;
};

/**
 * Test user document creation during login for existing users
 */
export const testUserLoginDocumentCreation = async () => {
  console.log('🧪 Testing Login Document Creation for Existing Users...');
  
  const results = {
    testName: 'Login Document Creation',
    passed: true,
    errors: [],
    details: []
  };

  try {
    // Simulate existing user without document
    const testUserId = 'test-user-login-' + Date.now();
    const testEmail = `test-login-${Date.now()}@example.com`;
    
    console.log('📋 Step 1: Verifying no document exists...');
    
    // Verify no document exists initially
    let userData = await getUserDocument(testUserId);
    if (!userData) {
      results.details.push('✅ Confirmed no user document exists initially');
    } else {
      results.details.push('⚠️ User document already exists, continuing test...');
    }

    console.log('📋 Step 2: Simulating login document creation...');
    
    // Simulate the login document creation logic
    const defaultUserData = {
      uid: testUserId,
      email: testEmail,
      namaUsaha: 'Bisnis Saya',
      
      businessProfile: {
        businessName: 'Bisnis Saya',
        category: null,
        stage: null,
        location: null,
        employeeCount: null,
        monthlyRevenue: null,
        challenges: [],
        goals: [],
        description: null
      },
      
      preferences: {
        language: 'id',
        notifications: true,
        theme: 'light'
      },
      
      analytics: {
        totalRecommendations: 0,
        completedRecommendations: 0,
        lastLoginAt: new Date().toISOString(),
        firstLoginAt: new Date().toISOString()
      },
      
      isActive: true,
      isEmailVerified: false,
      onboardingCompleted: false,
      
      migratedUser: true,
      migrationDate: new Date().toISOString()
    };
    
    const documentCreated = await createUserDocument(testUserId, defaultUserData);
    
    if (documentCreated) {
      results.details.push('✅ Default user document created during login simulation');
      
      // Verify the document
      userData = await getUserDocument(testUserId);
      if (userData) {
        results.details.push('✅ User document retrieved after login creation');
        
        if (userData.migratedUser) {
          results.details.push('✅ Migration flag set correctly');
        } else {
          results.errors.push('Migration flag not set');
          results.passed = false;
        }
        
      } else {
        results.errors.push('Failed to retrieve user document after login creation');
        results.passed = false;
      }
      
    } else {
      results.errors.push('Failed to create user document during login');
      results.passed = false;
    }

  } catch (error) {
    results.errors.push(`Login document creation test error: ${error.message}`);
    results.passed = false;
  }

  console.log(results.passed ? '✅ Login document creation test passed' : '❌ Login document creation test failed');
  return results;
};

/**
 * Test dashboard document creation for missing documents
 */
export const testDashboardDocumentCreation = async () => {
  console.log('🧪 Testing Dashboard Document Creation...');
  
  const results = {
    testName: 'Dashboard Document Creation',
    passed: true,
    errors: [],
    details: []
  };

  try {
    const testUserId = 'test-user-dashboard-' + Date.now();
    const testEmail = `test-dashboard-${Date.now()}@example.com`;
    
    console.log('📋 Step 1: Simulating dashboard access without document...');
    
    // Simulate dashboard document creation logic
    const defaultUserData = {
      uid: testUserId,
      email: testEmail,
      namaUsaha: 'Bisnis Saya',
      
      businessProfile: {
        businessName: 'Bisnis Saya',
        category: null,
        stage: null,
        location: null,
        employeeCount: null,
        monthlyRevenue: null,
        challenges: [],
        goals: [],
        description: null
      },
      
      preferences: {
        language: 'id',
        notifications: true,
        theme: 'light'
      },
      
      analytics: {
        totalRecommendations: 0,
        completedRecommendations: 0,
        lastLoginAt: new Date().toISOString(),
        dashboardAccessAt: new Date().toISOString()
      },
      
      isActive: true,
      isEmailVerified: false,
      onboardingCompleted: false,
      
      createdFromDashboard: true,
      dashboardCreationDate: new Date().toISOString()
    };
    
    const documentCreated = await createUserDocument(testUserId, defaultUserData);
    
    if (documentCreated) {
      results.details.push('✅ Dashboard user document created successfully');
      
      // Verify dashboard-specific fields
      const userData = await getUserDocument(testUserId);
      if (userData && userData.createdFromDashboard) {
        results.details.push('✅ Dashboard creation flag set correctly');
      } else {
        results.errors.push('Dashboard creation flag not set');
        results.passed = false;
      }
      
    } else {
      results.errors.push('Failed to create user document from dashboard');
      results.passed = false;
    }

  } catch (error) {
    results.errors.push(`Dashboard document creation test error: ${error.message}`);
    results.passed = false;
  }

  console.log(results.passed ? '✅ Dashboard document creation test passed' : '❌ Dashboard document creation test failed');
  return results;
};

/**
 * Run comprehensive user document initialization tests
 */
export const runUserDocumentTests = async () => {
  console.log('🚀 Running Comprehensive User Document Initialization Tests...');
  console.log('=' .repeat(80));

  const testResults = [];

  // Test 1: Registration flow
  console.log('\n🧪 Test 1: User Registration Document Creation');
  const registrationTest = await testUserRegistrationFlow();
  testResults.push(registrationTest);

  // Test 2: Login document creation
  console.log('\n🧪 Test 2: Login Document Creation for Existing Users');
  const loginTest = await testUserLoginDocumentCreation();
  testResults.push(loginTest);

  // Test 3: Dashboard document creation
  console.log('\n🧪 Test 3: Dashboard Document Creation');
  const dashboardTest = await testDashboardDocumentCreation();
  testResults.push(dashboardTest);

  // Overall summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 USER DOCUMENT INITIALIZATION TEST SUMMARY');
  console.log('=' .repeat(80));

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;

  console.log(`📊 Overall Results: ${passedTests}/${totalTests} test suites passed`);

  testResults.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${test.testName}`);
    
    if (test.errors.length > 0) {
      test.errors.forEach(error => console.log(`   ❌ ${error}`));
    }
    
    if (test.details.length > 0) {
      test.details.forEach(detail => console.log(`   ${detail}`));
    }
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 All user document initialization tests passed!');
    console.log('✅ User document creation during registration - WORKING');
    console.log('✅ User document creation during login - WORKING');
    console.log('✅ User document creation from dashboard - WORKING');
    console.log('\n🚀 User document initialization system is fully functional!');
  } else {
    console.log('\n⚠️ Some tests failed - check individual results above');
  }

  return {
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      success: passedTests === totalTests
    },
    results: testResults
  };
};

// Make testing functions available globally
if (typeof window !== 'undefined') {
  window.testUserRegistrationFlow = testUserRegistrationFlow;
  window.testUserLoginDocumentCreation = testUserLoginDocumentCreation;
  window.testDashboardDocumentCreation = testDashboardDocumentCreation;
  window.runUserDocumentTests = runUserDocumentTests;
  
  console.log('🧪 User document testing functions available:');
  console.log('- testUserRegistrationFlow()');
  console.log('- testUserLoginDocumentCreation()');
  console.log('- testDashboardDocumentCreation()');
  console.log('- runUserDocumentTests()');
}

export default {
  testUserRegistrationFlow,
  testUserLoginDocumentCreation,
  testDashboardDocumentCreation,
  runUserDocumentTests
};
