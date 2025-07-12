import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './store/auth'
import './style.css'

// Create Vue app
const app = createApp(App)

// Install Pinia first
const pinia = createPinia()
app.use(pinia)

// Initialize auth store and check for saved user
const authStore = useAuthStore()
authStore.initializeAuth()

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

console.log('🎉 SiNaik PWA initialized successfully!');
