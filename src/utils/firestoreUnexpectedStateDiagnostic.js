/**
 * Firestore "Unexpected State" Error Diagnostic Tool
 * Comprehensive analysis and resolution for internal assertion errors
 */

import { 
  doc, 
  getDoc, 
  enableNetwork, 
  disableNetwork,
  clearIndexedDbPersistence,
  terminate,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { safeTransaction, getFirestoreStateInfo } from './firestoreStateManager.js';

/**
 * Comprehensive diagnostic for "unexpected state" errors
 */
export const diagnoseUnexpectedStateError = async () => {
  console.log('🔍 FIRESTORE "UNEXPECTED STATE" ERROR DIAGNOSTIC');
  console.log('=' .repeat(70));

  const diagnostic = {
    timestamp: new Date().toISOString(),
    issues: [],
    recommendations: [],
    severity: 'unknown',
    canAutoFix: false
  };

  // 1. Check Firestore state manager
  console.log('📊 Step 1: Checking Firestore State Manager...');
  try {
    const stateInfo = getFirestoreStateInfo();
    console.log('   State Info:', stateInfo);
    
    if (stateInfo.activeTransactions > 3) {
      diagnostic.issues.push('Too many concurrent transactions');
      diagnostic.recommendations.push('Reduce concurrent transaction load');
      diagnostic.severity = 'high';
    }
    
    if (stateInfo.errorCount > 5) {
      diagnostic.issues.push('High error count detected');
      diagnostic.recommendations.push('Reset Firestore state');
      diagnostic.severity = 'critical';
    }
    
    if (stateInfo.queuedOperations > 10) {
      diagnostic.issues.push('Large operation queue');
      diagnostic.recommendations.push('Process or clear operation queue');
    }
    
  } catch (error) {
    diagnostic.issues.push('Firestore state manager not initialized');
    diagnostic.recommendations.push('Initialize Firestore state manager');
    console.error('   ❌ Error checking state manager:', error);
  }

  // 2. Check network connectivity
  console.log('🌐 Step 2: Checking Network Connectivity...');
  try {
    const isOnline = navigator.onLine;
    console.log(`   Network Status: ${isOnline ? 'Online' : 'Offline'}`);
    
    if (!isOnline) {
      diagnostic.issues.push('Network is offline');
      diagnostic.recommendations.push('Check internet connection');
      diagnostic.severity = 'high';
    }
    
    // Test actual Firestore connectivity
    const testRef = doc(db, 'test', 'connectivity-test');
    const startTime = Date.now();
    await getDoc(testRef);
    const responseTime = Date.now() - startTime;
    
    console.log(`   Firestore Response Time: ${responseTime}ms`);
    
    if (responseTime > 5000) {
      diagnostic.issues.push('Slow Firestore response time');
      diagnostic.recommendations.push('Check network quality or Firestore status');
    }
    
  } catch (error) {
    diagnostic.issues.push('Firestore connectivity test failed');
    diagnostic.recommendations.push('Check Firestore configuration and network');
    diagnostic.severity = 'critical';
    console.error('   ❌ Connectivity test failed:', error);
  }

  // 3. Check IndexedDB state
  console.log('💾 Step 3: Checking IndexedDB State...');
  try {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      diagnostic.issues.push('IndexedDB not available');
      diagnostic.recommendations.push('Enable IndexedDB in browser settings');
      diagnostic.severity = 'high';
    } else {
      console.log('   IndexedDB: Available');
      
      // Check storage quota
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usagePercent = (estimate.usage / estimate.quota) * 100;
        
        console.log(`   Storage Usage: ${usagePercent.toFixed(2)}%`);
        
        if (usagePercent > 90) {
          diagnostic.issues.push('IndexedDB storage nearly full');
          diagnostic.recommendations.push('Clear browser storage or increase quota');
          diagnostic.severity = 'high';
        }
      }
    }
    
  } catch (error) {
    diagnostic.issues.push('IndexedDB check failed');
    diagnostic.recommendations.push('Clear browser data and restart');
    console.error('   ❌ IndexedDB check failed:', error);
  }

  // 4. Check for multiple Firebase app instances
  console.log('🔥 Step 4: Checking Firebase App Instances...');
  try {
    // This is a simplified check - in practice, you'd need to track app instances
    const firebaseApps = window.firebase?.apps || [];
    console.log(`   Firebase Apps: ${firebaseApps.length || 'Unknown'}`);
    
    if (firebaseApps.length > 1) {
      diagnostic.issues.push('Multiple Firebase app instances detected');
      diagnostic.recommendations.push('Ensure single Firebase app initialization');
      diagnostic.severity = 'high';
    }
    
  } catch (error) {
    console.log('   Firebase app check inconclusive');
  }

  // 5. Check browser compatibility
  console.log('🌐 Step 5: Checking Browser Compatibility...');
  try {
    const userAgent = navigator.userAgent;
    const isChrome = userAgent.includes('Chrome');
    const isFirefox = userAgent.includes('Firefox');
    const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
    const isEdge = userAgent.includes('Edge');
    
    console.log(`   Browser: ${isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Unknown'}`);
    
    // Check for known problematic browser versions
    if (isSafari) {
      diagnostic.issues.push('Safari may have IndexedDB issues');
      diagnostic.recommendations.push('Test in Chrome or Firefox');
    }
    
    // Check for required features
    if (!window.Promise) {
      diagnostic.issues.push('Promise support missing');
      diagnostic.recommendations.push('Update browser or add polyfill');
      diagnostic.severity = 'critical';
    }
    
  } catch (error) {
    console.error('   ❌ Browser compatibility check failed:', error);
  }

  // 6. Test transaction behavior
  console.log('🔄 Step 6: Testing Transaction Behavior...');
  try {
    const testResult = await safeTransaction(async (transaction) => {
      const testRef = doc(db, 'test', 'transaction-test');
      const testDoc = await transaction.get(testRef);
      
      transaction.set(testRef, {
        timestamp: new Date().toISOString(),
        test: 'unexpected-state-diagnostic'
      });
      
      return { success: true, docExists: testDoc.exists() };
    });
    
    console.log('   Transaction Test: Passed');
    console.log('   Result:', testResult);
    
  } catch (error) {
    diagnostic.issues.push('Transaction test failed');
    diagnostic.recommendations.push('Reset Firestore state and retry');
    diagnostic.severity = 'high';
    console.error('   ❌ Transaction test failed:', error);
    
    // Check for specific error patterns
    if (error.message.includes('internal assertion')) {
      diagnostic.issues.push('Internal assertion error confirmed');
      diagnostic.recommendations.push('Apply internal assertion error fixes');
      diagnostic.canAutoFix = true;
    }
    
    if (error.message.includes('unexpected state')) {
      diagnostic.issues.push('Unexpected state error confirmed');
      diagnostic.recommendations.push('Reset Firestore client state');
      diagnostic.canAutoFix = true;
    }
  }

  // Generate final assessment
  console.log('\n' + '=' .repeat(70));
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('=' .repeat(70));

  console.log(`🕐 Timestamp: ${diagnostic.timestamp}`);
  console.log(`⚠️ Severity: ${diagnostic.severity.toUpperCase()}`);
  console.log(`🔧 Can Auto-Fix: ${diagnostic.canAutoFix ? 'YES' : 'NO'}`);

  if (diagnostic.issues.length > 0) {
    console.log('\n❌ Issues Found:');
    diagnostic.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  } else {
    console.log('\n✅ No issues detected');
  }

  if (diagnostic.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    diagnostic.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  return diagnostic;
};

/**
 * Auto-fix for "unexpected state" errors
 */
export const autoFixUnexpectedStateError = async () => {
  console.log('🔧 AUTO-FIXING "UNEXPECTED STATE" ERROR...');
  console.log('=' .repeat(50));

  const fixes = [];
  let success = false;

  try {
    // Fix 1: Reset Firestore network state
    console.log('🔄 Step 1: Resetting Firestore network state...');
    try {
      await disableNetwork(db);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await enableNetwork(db);
      fixes.push('✅ Network state reset');
    } catch (error) {
      fixes.push('❌ Network state reset failed');
      console.error('Network reset error:', error);
    }

    // Fix 2: Clear IndexedDB persistence
    console.log('💾 Step 2: Clearing IndexedDB persistence...');
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
      fixes.push('✅ IndexedDB persistence cleared');
    } catch (error) {
      fixes.push('⚠️ IndexedDB clear failed (may not be necessary)');
      console.warn('IndexedDB clear error:', error);
    }

    // Fix 3: Test transaction after fixes
    console.log('🧪 Step 3: Testing transaction after fixes...');
    try {
      const testResult = await safeTransaction(async (transaction) => {
        const testRef = doc(db, 'test', 'post-fix-test');
        transaction.set(testRef, {
          timestamp: new Date().toISOString(),
          test: 'post-auto-fix'
        });
        return { success: true };
      });
      
      fixes.push('✅ Post-fix transaction test passed');
      success = true;
      
    } catch (error) {
      fixes.push('❌ Post-fix transaction test failed');
      console.error('Post-fix test error:', error);
    }

  } catch (error) {
    fixes.push('❌ Auto-fix process failed');
    console.error('Auto-fix error:', error);
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 AUTO-FIX RESULTS');
  console.log('=' .repeat(50));

  fixes.forEach(fix => console.log(fix));
  
  console.log(`\n🎯 Overall Success: ${success ? 'YES' : 'NO'}`);
  
  if (success) {
    console.log('✅ "Unexpected state" error should be resolved');
    console.log('💡 Monitor for recurring issues');
  } else {
    console.log('❌ Auto-fix unsuccessful');
    console.log('💡 Manual intervention may be required');
    console.log('💡 Consider browser restart or cache clear');
  }

  return { success, fixes };
};

/**
 * Monitor for "unexpected state" errors
 */
export const monitorUnexpectedStateErrors = () => {
  console.log('👁️ Starting "unexpected state" error monitoring...');
  
  // Monitor console errors
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('internal assertion') || 
        message.includes('unexpected state')) {
      
      console.log('🚨 UNEXPECTED STATE ERROR DETECTED!');
      console.log('🔍 Running diagnostic...');
      
      // Run diagnostic in background
      setTimeout(() => {
        diagnoseUnexpectedStateError().then(diagnostic => {
          if (diagnostic.canAutoFix) {
            console.log('🔧 Auto-fix available, running...');
            autoFixUnexpectedStateError();
          }
        });
      }, 1000);
    }
    
    originalError.apply(console, args);
  };
  
  console.log('✅ Error monitoring active');
};

// Make functions available globally
if (typeof window !== 'undefined') {
  window.diagnoseUnexpectedStateError = diagnoseUnexpectedStateError;
  window.autoFixUnexpectedStateError = autoFixUnexpectedStateError;
  window.monitorUnexpectedStateErrors = monitorUnexpectedStateErrors;
  
  console.log('🔍 Firestore diagnostic functions available:');
  console.log('- diagnoseUnexpectedStateError()');
  console.log('- autoFixUnexpectedStateError()');
  console.log('- monitorUnexpectedStateErrors()');
  
  // Auto-start monitoring
  monitorUnexpectedStateErrors();
}

export default {
  diagnoseUnexpectedStateError,
  autoFixUnexpectedStateError,
  monitorUnexpectedStateErrors
};
