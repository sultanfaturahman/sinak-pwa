import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import DiagnosisView from '../views/DiagnosisView.vue';
import RecommendationView from '../views/RecommendationView.vue';
import BookmarkView from '../views/BookmarkView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { useAuthStore } from '../store/auth';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
  },
  {
    path: '/diagnosis',
    name: 'Diagnosis',
    component: DiagnosisView,
    meta: { requiresAuth: true },
  },
  {
    path: '/recommendations',
    name: 'Recommendations',
    component: RecommendationView,
    meta: { requiresAuth: true },
  },
  {
    path: '/bookmarks',
    name: 'Bookmarks',
    component: BookmarkView,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isLoggedIn;

  console.log(`Navigating to: ${to.path}, Requires Auth: ${to.meta.requiresAuth}, Is Authenticated: ${isAuthenticated}`);

  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Redirecting to /login');
    next('/login');
  } else {
    next();
  }
});

export default router;
