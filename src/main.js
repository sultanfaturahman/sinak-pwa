import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './store/auth'
import { useDiagnosisStore } from './store/diagnosis'
import './assets/styles/global.css'

// Create Vue app
const app = createApp(App)

// Install Pinia first
const pinia = createPinia()
app.use(pinia)

// Initialize stores
const authStore = useAuthStore()
const diagnosisStore = useDiagnosisStore()

// Initialize auth store and check for saved user
authStore.initializeAuth()

// Initialize diagnosis store and load saved data
diagnosisStore.loadDiagnosisData()

// Install router
app.use(router)

// Set up navigation guard after Pinia is initialized
router.beforeEach((to, from, next) => {
  const isAuthenticated = authStore.isLoggedIn;
  const requiresAuth = to.meta.requiresAuth;

  console.log(`🚀 Navigating to: ${to.path}`);
  console.log(`🔐 Requires Auth: ${requiresAuth}`);
  console.log(`👤 Is Authenticated: ${isAuthenticated}`);

  // If route requires auth and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    console.log('🔄 Redirecting to /login');
    next('/login');
  }
  // If user is authenticated and trying to access login/register
  else if (isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    console.log('🔄 Redirecting to dashboard');
    next('/');
  }
  // Allow navigation
  else {
    next();
  }
});

// Mount the app
app.mount('#app')

// Import system testing utilities in development
if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_AI_TESTING === 'true') {
  import('./utils/systemTesting.js').then(() => {
    console.log('🧪 System testing utilities loaded');
    console.log('💡 Run runSystemTests() to check system health');
    console.log('🔧 Use Ctrl+Shift+D to toggle error monitor');
  });

  // Import Firestore error testing utilities
  import('./utils/firestoreErrorTesting.js').then(() => {
    console.log('🔥 Firestore error testing utilities loaded');
    console.log('💡 Run runFirestoreErrorTests() to test error resolution');
  });

  // Import debounce testing utilities
  import('./utils/debounceTest.js').then(() => {
    console.log('⏱️ Debounce testing utilities loaded');
    console.log('💡 Run runDebounceTests() to test debounce functionality');
  });

  // Import recommendation error testing utilities
  import('./utils/recommendationErrorTest.js').then(() => {
    console.log('🔧 Recommendation error testing utilities loaded');
    console.log('💡 Run runRecommendationErrorTests() to test error resolution');
  });

  // Import error fix verification utilities
  import('./utils/errorFixVerification.js').then(() => {
    console.log('✅ Error fix verification utilities loaded');
    console.log('💡 Run runErrorFixVerification() to verify the fix');
  });

  // Import user document testing utilities
  import('./utils/userDocumentTest.js').then(() => {
    console.log('👤 User document testing utilities loaded');
    console.log('💡 Run runUserDocumentTests() to test user document initialization');
  });

  // Import user document monitoring utilities
  import('./utils/userDocumentMonitor.js').then(() => {
    console.log('📊 User document monitoring utilities loaded');
    console.log('💡 Run displayUserDocumentReport() to check user document status');
    console.log('💡 Run autoFixUserDocument() to automatically fix issues');
  });

  // Import Firestore state manager
  import('./utils/firestoreStateManager.js').then(() => {
    console.log('🔧 Firestore state manager loaded');
    console.log('💡 Run getFirestoreStateInfo() to check Firestore state');
    console.log('💡 Run testFirestoreStateManagement() to test state management');
  });

  // Import Firestore unexpected state diagnostic
  import('./utils/firestoreUnexpectedStateDiagnostic.js').then(() => {
    console.log('🔍 Firestore unexpected state diagnostic loaded');
    console.log('💡 Run diagnoseUnexpectedStateError() to diagnose issues');
    console.log('💡 Run autoFixUnexpectedStateError() to auto-fix issues');
    console.log('👁️ Error monitoring is now active');
  });
}

console.log('🎉 SiNaik PWA initialized successfully!');
