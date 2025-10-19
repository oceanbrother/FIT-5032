import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, currentRole } from '@/services/auth';

const TrailsView = () => import('@/views/TrailsView.vue');
const AdminView = () => import('@/views/AdminView.vue');
const FirebaseTestView = () => import('@/views/FirebaseTestView.vue');
const EmailView = () => import('@/views/EmailView.vue');
const TablesView = () => import('@/views/TablesView.vue');
const MapView = () => import('@/views/MapView.vue');
const DashboardView = () => import('@/views/DashboardView.vue');
const BulkEmailView = () => import('@/views/BulkEmailView.vue');
const BookingView = () => import('@/views/BookingView.vue');
const AIRecommendationView = () => import('@/views/AIRecommendationView.vue');

const routes = [
  { path: '/', redirect: '/trails' },
  { path: '/trails', name: 'trails', component: TrailsView },
  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/firebase-test', name: 'firebase-test', component: FirebaseTestView },
  { path: '/email', name: 'email', component: EmailView },
  { path: '/tables', name: 'tables', component: TablesView },
  { path: '/map', name: 'map', component: MapView },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/bulk-email', name: 'bulk-email', component: BulkEmailView, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/bookings', name: 'bookings', component: BookingView },
  { path: '/ai-recommendations', name: 'ai-recommendations', component: AIRecommendationView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const needAuth = to.meta?.requiresAuth;
  const needRoles = to.meta?.roles;

  // Block access if not authenticated
  if (needAuth && !isAuthenticated()) {
    alert('Please login as an admin to access this page.');
    return next({ name: 'trails' });
  }
  // Block access if role does not match
  if (needRoles && needRoles.length > 0) {
    const role = currentRole();
    if (!role || !needRoles.includes(role)) {
      alert('You do not have permission to access this page.');
      return next({ name: 'trails' });
    }
  }
  next();
});

export default router;
