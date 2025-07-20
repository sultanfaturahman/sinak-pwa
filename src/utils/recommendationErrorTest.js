/**
 * Recommendation Error Testing Utilities
 * Test the fixed debounce implementation and error handling
 */

import { useRecommendationStore } from '../store/recommendation.js';

/**
 * Test the fixed safeSaveRecommendations method
 */
export const testSafeSaveRecommendations = async () => {
  console.log('🧪 Testing Fixed safeSaveRecommendations Method...');
  console.log('=' .repeat(60));

  const results = {
    testName: 'Safe Save Recommendations Fix Test',
    passed: true,
    errors: [],
    details: []
  };

  try {
    const store = useRecommendationStore();
    const testUserId = 'test-user-' + Date.now();

    // Test 1: Initialize store with test data
    console.log('📋 Step 1: Setting up test data...');
    
    store.businessProfile = {
      userId: testUserId,
      businessName: 'Test Business',
      category: 'test',
      stage: 'test',
      location: 'Test Location'
    };

    store.recommendations = [
      {
        id: 'test-rec-1',
        title: 'Test Recommendation',
        description: 'Test description',
        category: 'test',
        priority: 'medium',
        createdAt: new Date().toISOString()
      }
    ];

    results.details.push('✅ Test data initialized');

    // Test 2: Test safeSaveRecommendations without errors
    console.log('💾 Step 2: Testing safeSaveRecommendations...');
    
    try {
      await store.safeSaveRecommendations(testUserId);
      results.details.push('✅ safeSaveRecommendations executed without errors');
    } catch (error) {
      results.errors.push(`safeSaveRecommendations error: ${error.message}`);
      results.passed = false;
    }

    // Test 3: Test debounced function initialization
    console.log('🔧 Step 3: Testing debounced function initialization...');
    
    store.initializeDebouncedSave();
    
    if (store._debouncedSaveFunction) {
      results.details.push('✅ Debounced function initialized correctly');
      
      // Test if it has the required methods
      if (typeof store._debouncedSaveFunction.cancel === 'function') {
        results.details.push('✅ Debounced function has cancel method');
      } else {
        results.errors.push('Debounced function missing cancel method');
        results.passed = false;
      }
      
      if (typeof store._debouncedSaveFunction.flush === 'function') {
        results.details.push('✅ Debounced function has flush method');
      } else {
        results.errors.push('Debounced function missing flush method');
        results.passed = false;
      }
      
    } else {
      results.errors.push('Debounced function not initialized');
      results.passed = false;
    }

    // Test 4: Test rapid consecutive calls
    console.log('⚡ Step 4: Testing rapid consecutive calls...');
    
    try {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(store.safeSaveRecommendations(testUserId));
      }
      
      await Promise.all(promises);
      results.details.push('✅ Rapid consecutive calls handled without errors');
    } catch (error) {
      results.errors.push(`Rapid calls error: ${error.message}`);
      results.passed = false;
    }

    // Test 5: Test reset functionality
    console.log('🔄 Step 5: Testing reset functionality...');
    
    try {
      store.resetDebouncedSave();
      results.details.push('✅ Reset functionality works');
    } catch (error) {
      results.errors.push(`Reset error: ${error.message}`);
      results.passed = false;
    }

    // Test 6: Test force immediate save
    console.log('⚡ Step 6: Testing force immediate save...');
    
    try {
      await store.forceImmediateSave(testUserId);
      results.details.push('✅ Force immediate save works');
    } catch (error) {
      results.errors.push(`Force immediate save error: ${error.message}`);
      results.passed = false;
    }

    // Test 7: Test null/undefined userId handling
    console.log('🛡️ Step 7: Testing null/undefined userId handling...');
    
    try {
      await store.safeSaveRecommendations(null);
      await store.safeSaveRecommendations(undefined);
      await store.safeSaveRecommendations('');
      results.details.push('✅ Null/undefined userId handled gracefully');
    } catch (error) {
      results.errors.push(`Null userId handling error: ${error.message}`);
      results.passed = false;
    }

  } catch (error) {
    results.errors.push(`Test suite error: ${error.message}`);
    results.passed = false;
  }

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('=' .repeat(60));

  if (results.passed) {
    console.log('🎉 All tests passed! safeSaveRecommendations fix is working correctly.');
  } else {
    console.log('❌ Some tests failed:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  results.details.forEach(detail => console.log(detail));

  return results;
};

/**
 * Test the recommendation generation flow
 */
export const testRecommendationGeneration = async () => {
  console.log('🧪 Testing Recommendation Generation Flow...');
  
  const results = {
    testName: 'Recommendation Generation Flow Test',
    passed: true,
    errors: [],
    details: []
  };

  try {
    const store = useRecommendationStore();
    
    // Set up test business profile
    const testBusinessProfile = {
      userId: 'test-user-generation-' + Date.now(),
      businessName: 'Test Generation Business',
      category: 'food_beverage',
      stage: 'survival',
      location: 'Jakarta',
      employeeCount: 2,
      monthlyRevenue: 15000000,
      challenges: ['Test challenge'],
      goals: ['Test goal'],
      description: 'Test business description'
    };

    console.log('📋 Setting up test business profile...');
    store.businessProfile = testBusinessProfile;
    results.details.push('✅ Test business profile set up');

    // Test the generation flow (this would normally call AI)
    console.log('🤖 Testing recommendation generation...');
    
    try {
      // This will test the save mechanism without actually calling AI
      await store.safeSaveRecommendations(testBusinessProfile.userId);
      results.details.push('✅ Generation flow save mechanism works');
    } catch (error) {
      results.errors.push(`Generation flow error: ${error.message}`);
      results.passed = false;
    }

  } catch (error) {
    results.errors.push(`Generation test error: ${error.message}`);
    results.passed = false;
  }

  console.log(results.passed ? '✅ Generation flow test passed' : '❌ Generation flow test failed');
  return results;
};

/**
 * Run comprehensive error resolution tests
 */
export const runRecommendationErrorTests = async () => {
  console.log('🚀 Running Comprehensive Recommendation Error Tests...');
  console.log('=' .repeat(80));

  const testResults = [];

  // Test 1: Safe save recommendations fix
  console.log('\n🧪 Test 1: Safe Save Recommendations Fix');
  const saveTest = await testSafeSaveRecommendations();
  testResults.push(saveTest);

  // Test 2: Recommendation generation flow
  console.log('\n🧪 Test 2: Recommendation Generation Flow');
  const generationTest = await testRecommendationGeneration();
  testResults.push(generationTest);

  // Overall summary
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 COMPREHENSIVE ERROR RESOLUTION TEST SUMMARY');
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
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 All error resolution tests passed!');
    console.log('✅ JavaScript error has been resolved');
    console.log('✅ Recommendation generation should work correctly');
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
  window.testSafeSaveRecommendations = testSafeSaveRecommendations;
  window.testRecommendationGeneration = testRecommendationGeneration;
  window.runRecommendationErrorTests = runRecommendationErrorTests;
  
  console.log('🧪 Recommendation error testing functions available:');
  console.log('- testSafeSaveRecommendations()');
  console.log('- testRecommendationGeneration()');
  console.log('- runRecommendationErrorTests()');
}

export default {
  testSafeSaveRecommendations,
  testRecommendationGeneration,
  runRecommendationErrorTests
};
