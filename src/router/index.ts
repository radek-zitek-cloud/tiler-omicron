/**
 * Router configuration for Dashboard Tiling System
 * 
 * Defines the application routes and navigation structure.
 * The main route is the dashboard view where users can
 * create and manage their tile layouts.
 */

import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: {
        title: 'Dashboard - Tiling System'
      }
    },
    {
      path: '/about',
      name: 'about',
      // Route level code-splitting for better performance
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: 'About - Dashboard Tiling System'
      }
    },
    // Redirect any unknown routes to the dashboard
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
})

// Set page title based on route meta
router.beforeEach((to) => {
  document.title = to.meta.title as string || 'Dashboard Tiling System'
})

export default router
