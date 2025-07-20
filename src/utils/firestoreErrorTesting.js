/**
 * Firestore Error Testing Utilities
 * Specifically for testing and resolving INTERNAL ASSERTION FAILED errors
 */

import { useRecommendationStore } from '../store/recommendation.js';
import { updateUserDocument, updateRecommendationData, testFirestoreConnectivity } from '../services/firestoreService.js';

/**
 * Test the specific error scenario: user document updates during recommendation generation
 */
export const testInternalAssertionScenario = async (userId = 'ZfKRfbByUmO53hVXGaLRZC0GuHB2') => {
  console.log('🧪 Testing Internal Assertion Error Scenario...');
  console.log('=' .repeat(60));

  const results = {
    testName: 'Firestore Internal Assertion Error Resolution',
    userId: userId,
    steps: [],
    success: false,
    errors: [],
    recommendations: []
  };

  try {
    // Step 1: Test basic Firestore connectivity
    console.log('📡 Step 1: Testing Firestore connectivity...');
    const connectivityResult = await testFirestoreConnectivity();
    results.steps.push({
      step: 1,
      name: 'Firestore Connectivity',
      success: connectivityResult,
      details: connectivityResult ? 'Connection successful' : 'Connection failed'
    });

    if (!connectivityResult) {
      results.errors.push('Firestore connectivity test failed');
      return results;
    }

    // Step 2: Test simple user document update
    console.log('📝 Step 2: Testing simple user document update...');
    const simpleUpdateData = {
      testUpdate: true,
      timestamp: new Date().toISOString(),
      testType: 'simple_update'
    };

    const simpleUpdateResult = await updateUserDocument(userId, simpleUpdateData);
    results.steps.push({
      step: 2,
      name: 'Simple User Document Update',
      success: simpleUpdateResult,
      details: simpleUpdateResult ? 'Simple update successful' : 'Simple update failed'
    });

    // Step 3: Test recommendation data update (the problematic scenario)
    console.log('📊 Step 3: Testing recommendation data update...');
    
    // Create mock recommendation data similar to what causes the error
    const mockRecommendationData = {
      recommendations: [
        {
          id: 'test-rec-1',
          title: 'Test Recommendation 1',
          description: 'This is a test recommendation to simulate the error scenario',
          category: 'growth_strategy',
          priority: 'high',
          progressSteps: [
            {
              id: 'step-1',
              title: 'Test Step 1',
              description: 'Test step description',
              order: 0,
              isRequired: true,
              status: 'pending'
            }
          ],
          milestones: [
            {
              id: 'milestone-1',
              title: 'Test Milestone',
              description: 'Test milestone description',
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      businessProfile: {
        userId: userId,
        businessName: 'Test Business',
        category: 'food_beverage',
        stage: 'survival',
        location: 'Jakarta',
        updatedAt: new Date().toISOString()
      },
      analytics: {
        totalRecommendations: 1,
        completedRecommendations: 0,
        lastGeneratedAt: new Date().toISOString()
      }
    };

    const recommendationUpdateResult = await updateRecommendationData(userId, mockRecommendationData);
    results.steps.push({
      step: 3,
      name: 'Recommendation Data Update',
      success: recommendationUpdateResult,
      details: recommendationUpdateResult ? 'Recommendation update successful' : 'Recommendation update failed'
    });

    // Step 4: Test rapid consecutive updates (stress test)
    console.log('⚡ Step 4: Testing rapid consecutive updates...');
    const rapidUpdatePromises = [];
    
    for (let i = 0; i < 5; i++) {
      const updateData = {
        rapidTest: true,
        updateNumber: i + 1,
        timestamp: new Date().toISOString()
      };
      
      rapidUpdatePromises.push(updateUserDocument(userId, updateData));
    }

    const rapidUpdateResults = await Promise.allSettled(rapidUpdatePromises);
    const successfulRapidUpdates = rapidUpdateResults.filter(r => r.status === 'fulfilled' && r.value === true).length;
    
    results.steps.push({
      step: 4,
      name: 'Rapid Consecutive Updates',
      success: successfulRapidUpdates > 0,
      details: `${successfulRapidUpdates}/5 rapid updates successful`
    });

    // Step 5: Test the recommendation store's save mechanism
    console.log('🏪 Step 5: Testing recommendation store save mechanism...');
    
    try {
      const store = useRecommendationStore();
      
      // Set up test data in store
      store.businessProfile = mockRecommendationData.businessProfile;
      store.recommendations = mockRecommendationData.recommendations;
      store.analytics = mockRecommendationData.analytics;
      
      // Test the safe save method
      await store.safeSaveRecommendations(userId);
      
      results.steps.push({
        step: 5,
        name: 'Recommendation Store Save',
        success: true,
        details: 'Store save mechanism completed without errors'
      });
      
    } catch (storeError) {
      results.steps.push({
        step: 5,
        name: 'Recommendation Store Save',
        success: false,
        details: `Store save error: ${storeError.message}`
      });
      results.errors.push(`Store save error: ${storeError.message}`);
    }

    // Calculate overall success
    const successfulSteps = results.steps.filter(s => s.success).length;
    const totalSteps = results.steps.length;
    results.success = successfulSteps === totalSteps;

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Successful Steps: ${successfulSteps}/${totalSteps}`);
    
    if (results.success) {
      console.log('🎉 All tests passed! Internal assertion error appears to be resolved.');
    } else {
      console.log('⚠️ Some tests failed. Check individual step results.');
      results.errors.forEach(error => console.log(`   ❌ ${error}`));
    }

    results.steps.forEach(step => {
      const status = step.success ? '✅' : '❌';
      console.log(`${status} Step ${step.step}: ${step.name} - ${step.details}`);
    });

  } catch (error) {
    console.error('❌ Test suite error:', error);
    results.errors.push(`Test suite error: ${error.message}`);
    results.success = false;
  }

  return results;
};

/**
 * Test concurrent write operations to reproduce the error
 */
export const testConcurrentWrites = async (userId = 'ZfKRfbByUmO53hVXGaLRZC0GuHB2') => {
  console.log('🧪 Testing Concurrent Write Operations...');
  
  const results = {
    testName: 'Concurrent Write Operations Test',
    userId: userId,
    concurrentOperations: 10,
    results: [],
    success: false
  };

  try {
    const promises = [];
    
    // Create multiple concurrent update operations
    for (let i = 0; i < results.concurrentOperations; i++) {
      const updateData = {
        concurrentTest: true,
        operationId: i + 1,
        timestamp: new Date().toISOString(),
        randomData: Math.random().toString(36).substring(7)
      };
      
      promises.push(
        updateUserDocument(userId, updateData)
          .then(success => ({ operationId: i + 1, success, error: null }))
          .catch(error => ({ operationId: i + 1, success: false, error: error.message }))
      );
    }

    // Wait for all operations to complete
    const operationResults = await Promise.all(promises);
    results.results = operationResults;

    // Analyze results
    const successfulOps = operationResults.filter(r => r.success).length;
    const failedOps = operationResults.filter(r => !r.success).length;
    
    results.success = successfulOps > 0; // At least some operations should succeed
    
    console.log(`📊 Concurrent Operations Results:`);
    console.log(`   ✅ Successful: ${successfulOps}/${results.concurrentOperations}`);
    console.log(`   ❌ Failed: ${failedOps}/${results.concurrentOperations}`);
    
    // Log any errors
    const errors = operationResults.filter(r => r.error);
    if (errors.length > 0) {
      console.log(`🔍 Errors encountered:`);
      errors.forEach(err => {
        console.log(`   Operation ${err.operationId}: ${err.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Concurrent write test error:', error);
    results.success = false;
  }

  return results;
};

/**
 * Run comprehensive Firestore error resolution tests
 */
export const runFirestoreErrorTests = async (userId = 'ZfKRfbByUmO53hVXGaLRZC0GuHB2') => {
  console.log('🚀 Running Comprehensive Firestore Error Resolution Tests...');
  console.log('=' .repeat(80));

  const testResults = [];

  // Test 1: Internal assertion scenario
  console.log('\n🧪 Test 1: Internal Assertion Error Scenario');
  const assertionTest = await testInternalAssertionScenario(userId);
  testResults.push(assertionTest);

  // Test 2: Concurrent writes
  console.log('\n🧪 Test 2: Concurrent Write Operations');
  const concurrentTest = await testConcurrentWrites(userId);
  testResults.push(concurrentTest);

  // Overall summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(80));

  const passedTests = testResults.filter(t => t.success).length;
  const totalTests = testResults.length;

  console.log(`📊 Overall Results: ${passedTests}/${totalTests} test suites passed`);

  testResults.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${test.testName}`);
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 All Firestore error resolution tests passed!');
    console.log('✅ Internal assertion error appears to be resolved');
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
  window.testInternalAssertionScenario = testInternalAssertionScenario;
  window.testConcurrentWrites = testConcurrentWrites;
  window.runFirestoreErrorTests = runFirestoreErrorTests;
  
  console.log('🧪 Firestore error testing functions available:');
  console.log('- testInternalAssertionScenario(userId)');
  console.log('- testConcurrentWrites(userId)');
  console.log('- runFirestoreErrorTests(userId)');
}

export default {
  testInternalAssertionScenario,
  testConcurrentWrites,
  runFirestoreErrorTests
};
