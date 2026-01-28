import { createRouter, createWebHistory } from 'vue-router';
import MapLogger from './components/MapLogger.vue';
import LoginView from './components/LoginView.vue';
import { supabase } from './supabase';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/', component: MapLogger, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guard: Protects the Map
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (to.meta.requiresAuth && !session) {
    next('/login'); // Not logged in? Go to Login
  } else if (to.path === '/login' && session) {
    next('/'); // Already logged in? Go to Map
  } else {
    next();
  }
});

export default router;