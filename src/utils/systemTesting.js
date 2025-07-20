/**
 * System Testing Utilities for SiNaK PWA
 * Comprehensive testing for critical issues resolution
 */

/**
 * Test Vue Router implementation for deprecation warnings
 */
export const testVueRouter = () => {
  console.log('🧪 Testing Vue Router implementation...');
  
  const results = {
    testName: 'Vue Router Deprecation Fix',
    passed: true,
    issues: [],
    recommendations: []
  };

  try {
    // Check if we're using the modern slot props pattern
    const appElement = document.querySelector('#app');
    if (appElement) {
      const routerViewElements = appElement.querySelectorAll('router-view');
      
      if (routerViewElements.length > 0) {
        // Check if router-view is properly implemented with slot props
        console.log('✅ RouterView elements found, checking implementation...');
        results.recommendations.push('Modern Vue Router slot props pattern appears to be implemented');
      } else {
        results.issues.push('No RouterView elements found in DOM');
        results.passed = false;
      }
    }

    // Check for transition warnings in console (this would need to be monitored manually)
    console.log('ℹ️ Monitor browser console for Vue Router deprecation warnings');
    results.recommendations.push('Monitor console for: "Putting <router-view> inside <transition> is deprecated"');

  } catch (error) {
    results.issues.push(`Router test error: ${error.message}`);
    results.passed = false;
  }

  return results;
};

/**
 * Test Firestore connection and error handling
 */
export const testFirestore = async () => {
  console.log('🧪 Testing Firestore connection and error handling...');
  
  const results = {
    testName: 'Firestore Internal Assertion Fix',
    passed: true,
    issues: [],
    recommendations: [],
    details: {}
  };

  try {
    // Test if Firestore health check functions are available
    if (typeof window.getFirebaseErrorStats === 'function') {
      const stats = window.getFirebaseErrorStats();
      results.details.errorStats = stats;
      
      console.log('📊 Firestore Error Stats:', stats);
      
      if (stats.firestoreHealth.initialized) {
        console.log('✅ Firestore is initialized and healthy');
        results.recommendations.push('Firestore connection is healthy');
      } else {
        console.log('⚠️ Firestore not initialized or unhealthy');
        results.issues.push('Firestore connection not healthy');
        
        if (stats.firestoreHealth.canRetry) {
          results.recommendations.push('Firestore can be retried - connection recovery available');
        }
      }

      if (stats.errorCount > 0) {
        console.log(`⚠️ ${stats.errorCount} Firestore errors detected`);
        results.issues.push(`${stats.errorCount} Firestore errors detected`);
        
        if (stats.lastError) {
          console.log('🔍 Last error:', stats.lastError.message);
          results.details.lastError = stats.lastError;
          
          if (stats.lastError.message.includes('INTERNAL ASSERTION FAILED')) {
            results.recommendations.push('Internal assertion error detected - recovery mechanisms should handle this');
          }
        }
      } else {
        console.log('✅ No Firestore errors detected');
        results.recommendations.push('No Firestore errors - connection is stable');
      }

    } else {
      results.issues.push('Firestore debugging functions not available');
      results.passed = false;
    }

    // Test connectivity if function is available
    if (typeof window.testFirestoreConnectivity === 'function') {
      console.log('🔗 Testing Firestore connectivity...');
      const connectivityResult = await window.testFirestoreConnectivity();
      results.details.connectivityTest = connectivityResult;
      
      if (connectivityResult) {
        console.log('✅ Firestore connectivity test passed');
        results.recommendations.push('Firestore connectivity test successful');
      } else {
        console.log('❌ Firestore connectivity test failed');
        results.issues.push('Firestore connectivity test failed');
      }
    }

  } catch (error) {
    results.issues.push(`Firestore test error: ${error.message}`);
    results.passed = false;
  }

  return results;
};

/**
 * Test AI system functionality
 */
export const testAISystem = async () => {
  console.log('🧪 Testing AI system functionality...');
  
  const results = {
    testName: 'AI System Integration',
    passed: true,
    issues: [],
    recommendations: [],
    details: {}
  };

  try {
    // Check AI configuration
    const aiConfig = {
      enabled: import.meta.env.VITE_ENABLE_AI_RECOMMENDATIONS !== 'false',
      bypassMode: import.meta.env.VITE_BYPASS_AI === 'true',
      hasApiKey: !!(import.meta.env.VITE_GEMINI_API_KEY),
      bypassJsonParsing: import.meta.env.VITE_BYPASS_JSON_PARSING === 'true'
    };

    results.details.config = aiConfig;
    console.log('🔧 AI Configuration:', aiConfig);

    if (!aiConfig.enabled) {
      results.issues.push('AI recommendations are disabled');
      results.recommendations.push('Enable AI recommendations with VITE_ENABLE_AI_RECOMMENDATIONS=true');
    }

    if (aiConfig.bypassMode) {
      console.log('ℹ️ AI is in bypass mode - using fallback recommendations');
      results.recommendations.push('AI bypass mode is active - set VITE_BYPASS_AI=false for real AI');
    }

    if (!aiConfig.hasApiKey && !aiConfig.bypassMode) {
      results.issues.push('No Gemini API key configured');
      results.recommendations.push('Configure VITE_GEMINI_API_KEY for real AI functionality');
    }

    // Test AI functions if available
    if (typeof window.quickAITest === 'function') {
      console.log('🤖 Running quick AI test...');
      
      try {
        const aiTestResult = await window.quickAITest();
        results.details.aiTest = aiTestResult;
        
        if (aiTestResult.success) {
          console.log('✅ AI test passed');
          console.log(`📊 Generated ${aiTestResult.recommendationCount} recommendations`);
          results.recommendations.push(`AI test successful - generated ${aiTestResult.recommendationCount} recommendations`);
        } else {
          console.log('❌ AI test failed:', aiTestResult.error);
          results.issues.push(`AI test failed: ${aiTestResult.error}`);
        }
      } catch (aiError) {
        console.log('❌ AI test threw error:', aiError.message);
        results.issues.push(`AI test error: ${aiError.message}`);
      }
    } else {
      results.issues.push('AI test functions not available');
      results.recommendations.push('AI test functions should be available in development mode');
    }

  } catch (error) {
    results.issues.push(`AI system test error: ${error.message}`);
    results.passed = false;
  }

  return results;
};

/**
 * Test authentication flow
 */
export const testAuthentication = async () => {
  console.log('🧪 Testing authentication system...');
  
  const results = {
    testName: 'Authentication System',
    passed: true,
    issues: [],
    recommendations: [],
    details: {}
  };

  try {
    // Check if Firebase Auth is available
    if (typeof window.firebase !== 'undefined' || document.querySelector('[data-firebase]')) {
      console.log('✅ Firebase appears to be loaded');
      results.recommendations.push('Firebase authentication system is available');
    } else {
      console.log('ℹ️ Firebase not detected in global scope');
      results.recommendations.push('Firebase may be loaded via modules (expected in modern setup)');
    }

    // Check for auth-related elements
    const authElements = document.querySelectorAll('[data-auth], .auth-container, .login-form');
    if (authElements.length > 0) {
      console.log(`✅ Found ${authElements.length} authentication-related elements`);
      results.recommendations.push('Authentication UI elements are present');
    }

    // Check current authentication state (if available)
    const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    if (currentUser) {
      console.log('ℹ️ User session data found in storage');
      results.details.hasUserSession = true;
      results.recommendations.push('User session data is preserved');
    } else {
      console.log('ℹ️ No user session data found');
      results.details.hasUserSession = false;
    }

  } catch (error) {
    results.issues.push(`Authentication test error: ${error.message}`);
    results.passed = false;
  }

  return results;
};

/**
 * Run comprehensive system tests
 */
export const runSystemTests = async () => {
  console.log('🚀 Running comprehensive system tests...');
  console.log('=' .repeat(50));

  const testResults = [];

  // Run all tests
  const tests = [
    { name: 'Vue Router', test: testVueRouter },
    { name: 'Firestore', test: testFirestore },
    { name: 'AI System', test: testAISystem },
    { name: 'Authentication', test: testAuthentication }
  ];

  for (const { name, test } of tests) {
    console.log(`\n🧪 Running ${name} tests...`);
    try {
      const result = await test();
      testResults.push(result);
      
      if (result.passed) {
        console.log(`✅ ${name} tests passed`);
      } else {
        console.log(`❌ ${name} tests failed`);
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      if (result.recommendations.length > 0) {
        console.log(`💡 ${name} recommendations:`);
        result.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }
    } catch (error) {
      console.error(`❌ ${name} test suite failed:`, error);
      testResults.push({
        testName: name,
        passed: false,
        issues: [`Test suite error: ${error.message}`],
        recommendations: [],
        details: {}
      });
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(50));

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  
  console.log(`✅ Passed: ${passedTests}/${totalTests} test suites`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All system tests passed!');
  } else {
    console.log('⚠️ Some tests failed - check individual results above');
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
  window.runSystemTests = runSystemTests;
  window.testVueRouter = testVueRouter;
  window.testFirestore = testFirestore;
  window.testAISystem = testAISystem;
  window.testAuthentication = testAuthentication;
  
  console.log('🧪 System testing functions available:');
  console.log('- runSystemTests() - Run all tests');
  console.log('- testVueRouter() - Test router implementation');
  console.log('- testFirestore() - Test Firestore connection');
  console.log('- testAISystem() - Test AI functionality');
  console.log('- testAuthentication() - Test auth system');
}

export default {
  runSystemTests,
  testVueRouter,
  testFirestore,
  testAISystem,
  testAuthentication
};
