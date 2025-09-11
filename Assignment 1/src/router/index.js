import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, currentRole } from '@/services/auth';

const TrailsView = () => import('@/views/TrailsView.vue');
const AdminView = () => import('@/views/AdminView.vue');

const routes = [
  { path: '/', redirect: '/trails' },
  { path: '/trails', name: 'trails', component: TrailsView },
  { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, roles: ['admin'] } },
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
