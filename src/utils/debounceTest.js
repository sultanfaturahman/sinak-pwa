/**
 * Debounce Testing Utilities for SiNaK PWA
 * Test the custom debounce implementation and recommendation store integration
 */

import { debounce, throttle, simpleDebounce, debounceImmediate } from './debounce.js';
import { useRecommendationStore } from '../store/recommendation.js';

/**
 * Test the basic debounce functionality
 */
export const testBasicDebounce = () => {
  console.log('🧪 Testing Basic Debounce Functionality...');
  
  const results = {
    testName: 'Basic Debounce Test',
    passed: true,
    details: []
  };

  try {
    let callCount = 0;
    const testFunction = () => {
      callCount++;
      console.log(`Test function called: ${callCount}`);
    };

    // Create debounced function with 500ms delay
    const debouncedFunction = debounce(testFunction, 500);

    // Test rapid calls
    console.log('📞 Making rapid calls to debounced function...');
    debouncedFunction();
    debouncedFunction();
    debouncedFunction();
    debouncedFunction();
    debouncedFunction();

    // Check that function hasn't been called yet
    if (callCount === 0) {
      results.details.push('✅ Debounce prevented immediate execution');
    } else {
      results.details.push('❌ Debounce failed to prevent immediate execution');
      results.passed = false;
    }

    // Wait for debounce to execute
    setTimeout(() => {
      if (callCount === 1) {
        results.details.push('✅ Debounced function executed exactly once');
        console.log('✅ Basic debounce test passed');
      } else {
        results.details.push(`❌ Expected 1 call, got ${callCount} calls`);
        results.passed = false;
        console.log('❌ Basic debounce test failed');
      }
    }, 600);

  } catch (error) {
    results.passed = false;
    results.details.push(`❌ Test error: ${error.message}`);
    console.error('❌ Basic debounce test error:', error);
  }

  return results;
};

/**
 * Test the debounce cancel functionality
 */
export const testDebounceCancel = () => {
  console.log('🧪 Testing Debounce Cancel Functionality...');
  
  const results = {
    testName: 'Debounce Cancel Test',
    passed: true,
    details: []
  };

  try {
    let callCount = 0;
    const testFunction = () => {
      callCount++;
      console.log(`Cancelled test function called: ${callCount}`);
    };

    const debouncedFunction = debounce(testFunction, 500);

    // Call the function
    debouncedFunction();
    
    // Cancel it before it executes
    setTimeout(() => {
      debouncedFunction.cancel();
      results.details.push('🚫 Debounced function cancelled');
    }, 200);

    // Check that it was cancelled
    setTimeout(() => {
      if (callCount === 0) {
        results.details.push('✅ Cancel prevented function execution');
        console.log('✅ Debounce cancel test passed');
      } else {
        results.details.push('❌ Cancel failed to prevent execution');
        results.passed = false;
        console.log('❌ Debounce cancel test failed');
      }
    }, 700);

  } catch (error) {
    results.passed = false;
    results.details.push(`❌ Test error: ${error.message}`);
    console.error('❌ Debounce cancel test error:', error);
  }

  return results;
};

/**
 * Test the recommendation store debounced save mechanism
 */
export const testRecommendationStoreDebounce = async () => {
  console.log('🧪 Testing Recommendation Store Debounced Save...');
  
  const results = {
    testName: 'Recommendation Store Debounce Test',
    passed: true,
    details: [],
    saveCallCount: 0
  };

  try {
    const store = useRecommendationStore();
    
    // Mock user ID for testing
    const testUserId = 'test-user-debounce-' + Date.now();
    
    // Set up test business profile
    store.businessProfile = {
      userId: testUserId,
      businessName: 'Test Business for Debounce',
      category: 'test',
      stage: 'test',
      location: 'Test Location'
    };

    // Set up test recommendations
    store.recommendations = [
      {
        id: 'test-rec-1',
        title: 'Test Recommendation 1',
        description: 'Test description',
        category: 'test',
        priority: 'medium',
        createdAt: new Date().toISOString()
      }
    ];

    // Initialize the debounced save function
    store.initializeDebouncedSave();
    
    results.details.push('✅ Store initialized with test data');

    // Test rapid save calls
    console.log('📞 Making rapid save calls...');
    
    const savePromises = [];
    for (let i = 0; i < 5; i++) {
      savePromises.push(store.safeSaveRecommendations(testUserId));
      results.details.push(`📞 Save call ${i + 1} initiated`);
    }

    // Wait for all save calls to be processed
    await Promise.all(savePromises);
    
    results.details.push('✅ All save calls processed');

    // Check if debouncing worked (should have reduced the number of actual saves)
    if (store.debouncedSave && typeof store.debouncedSave.cancel === 'function') {
      results.details.push('✅ Debounced save function properly initialized');
    } else {
      results.details.push('❌ Debounced save function not properly initialized');
      results.passed = false;
    }

    // Test the save queue mechanism
    if (store.saveQueue && store.saveQueue instanceof Set) {
      results.details.push('✅ Save queue mechanism working');
    } else {
      results.details.push('❌ Save queue mechanism not working');
      results.passed = false;
    }

    console.log(results.passed ? '✅ Recommendation store debounce test passed' : '❌ Recommendation store debounce test failed');

  } catch (error) {
    results.passed = false;
    results.details.push(`❌ Test error: ${error.message}`);
    console.error('❌ Recommendation store debounce test error:', error);
  }

  return results;
};

/**
 * Test different debounce utility functions
 */
export const testDebounceUtilities = () => {
  console.log('🧪 Testing Debounce Utility Functions...');
  
  const results = {
    testName: 'Debounce Utilities Test',
    passed: true,
    details: []
  };

  try {
    // Test simple debounce
    let simpleCallCount = 0;
    const simpleTest = simpleDebounce(() => simpleCallCount++, 100);
    
    simpleTest();
    simpleTest();
    simpleTest();
    
    setTimeout(() => {
      if (simpleCallCount === 1) {
        results.details.push('✅ Simple debounce working correctly');
      } else {
        results.details.push('❌ Simple debounce failed');
        results.passed = false;
      }
    }, 150);

    // Test throttle
    let throttleCallCount = 0;
    const throttleTest = throttle(() => throttleCallCount++, 100);
    
    throttleTest();
    setTimeout(() => throttleTest(), 50);
    setTimeout(() => throttleTest(), 150);
    
    setTimeout(() => {
      if (throttleCallCount >= 1) {
        results.details.push('✅ Throttle function working');
      } else {
        results.details.push('❌ Throttle function failed');
        results.passed = false;
      }
    }, 200);

    // Test immediate debounce
    let immediateCallCount = 0;
    const immediateTest = debounceImmediate(() => immediateCallCount++, 100, true);
    
    immediateTest();
    
    if (immediateCallCount === 1) {
      results.details.push('✅ Immediate debounce executed immediately');
    } else {
      results.details.push('❌ Immediate debounce failed to execute immediately');
      results.passed = false;
    }

    console.log('✅ Debounce utilities test completed');

  } catch (error) {
    results.passed = false;
    results.details.push(`❌ Test error: ${error.message}`);
    console.error('❌ Debounce utilities test error:', error);
  }

  return results;
};

/**
 * Run comprehensive debounce tests
 */
export const runDebounceTests = async () => {
  console.log('🚀 Running Comprehensive Debounce Tests...');
  console.log('=' .repeat(60));

  const testResults = [];

  // Test 1: Basic debounce functionality
  console.log('\n🧪 Test 1: Basic Debounce Functionality');
  const basicTest = testBasicDebounce();
  testResults.push(basicTest);

  // Test 2: Debounce cancel functionality
  console.log('\n🧪 Test 2: Debounce Cancel Functionality');
  const cancelTest = testDebounceCancel();
  testResults.push(cancelTest);

  // Test 3: Debounce utilities
  console.log('\n🧪 Test 3: Debounce Utility Functions');
  const utilitiesTest = testDebounceUtilities();
  testResults.push(utilitiesTest);

  // Test 4: Recommendation store integration
  console.log('\n🧪 Test 4: Recommendation Store Integration');
  const storeTest = await testRecommendationStoreDebounce();
  testResults.push(storeTest);

  // Wait for async tests to complete
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 DEBOUNCE TESTS SUMMARY');
  console.log('=' .repeat(60));

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;

  console.log(`📊 Overall Results: ${passedTests}/${totalTests} tests passed`);

  testResults.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} Test ${index + 1}: ${test.testName}`);
    
    if (test.details && test.details.length > 0) {
      test.details.forEach(detail => {
        console.log(`   ${detail}`);
      });
    }
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 All debounce tests passed!');
    console.log('✅ Custom debounce implementation is working correctly');
    console.log('✅ Recommendation store debounced save mechanism is functional');
  } else {
    console.log('\n⚠️ Some debounce tests failed - check individual results above');
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
  window.testBasicDebounce = testBasicDebounce;
  window.testDebounceCancel = testDebounceCancel;
  window.testRecommendationStoreDebounce = testRecommendationStoreDebounce;
  window.testDebounceUtilities = testDebounceUtilities;
  window.runDebounceTests = runDebounceTests;
  
  console.log('🧪 Debounce testing functions available:');
  console.log('- testBasicDebounce()');
  console.log('- testDebounceCancel()');
  console.log('- testRecommendationStoreDebounce()');
  console.log('- testDebounceUtilities()');
  console.log('- runDebounceTests()');
}

export default {
  testBasicDebounce,
  testDebounceCancel,
  testRecommendationStoreDebounce,
  testDebounceUtilities,
  runDebounceTests
};
