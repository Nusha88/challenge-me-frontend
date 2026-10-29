import { createRouter, createWebHistory } from 'vue-router'
import { isTokenExpired, clearStoredAuth } from '../utils/tokenUtils'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { useDemoAuthGate } from '../composables/useDemoAuthGate'
import { isSuperAdminUserId } from '../constants/superAdmin'

// All route components are lazy-loaded so the initial bundle only ships the
// code for the first route the user lands on.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../components/HomeComponent.vue')
    },
    {
      path: '/today',
      name: 'today',
      component: () => import('../components/HomeLoggedIn.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../components/RegisterComponent.vue')
    },
    {
      path: '/heroes',
      name: 'users',
      component: () => import('../components/UsersList.vue')
    },
    {
      path: '/heroes/:id',
      name: 'user-profile',
      component: () => import('../components/UserComponent.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/LoginComponent.vue')
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../components/AuthCallback.vue')
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../components/ForgotPasswordComponent.vue')
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../components/ResetPasswordComponent.vue')
    },
    {
      path: '/email/unsubscribe',
      name: 'email-unsubscribe',
      component: () => import('../components/EmailUnsubscribePage.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../components/UserComponent.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/missions/my',
      name: 'my-challenges',
      component: () => import('../components/MyChallengesComponent.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/missions/add',
      name: 'add-challenge',
      component: () => import('../components/AddChallengeComponent.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/missions/edit/:id',
      name: 'edit-challenge',
      component: () => import('../components/ChallengeEditPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/missions/watched',
      name: 'watched-challenges',
      component: () => import('../components/WatchedChallengesComponent.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chronicle',
      name: 'chronicle',
      component: () => import('../components/chronicle/ChroniclePage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/statistic',
      name: 'statistic',
      component: () => import('../components/StatisticsPage.vue'),
      meta: { requiresAuth: true, requiresSuperAdmin: true }
    },
    {
      path: '/missions/:id?',
      name: 'challenges',
      component: () => import('../components/AllChallengesComponent.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../components/NotFoundPage.vue')
    }
  ]
})

router.beforeEach((to, from) => {
  const requiresAuth = to.matched.some(r => r.meta?.requiresAuth)
  const requiresSuperAdmin = to.matched.some(r => r.meta?.requiresSuperAdmin)
  let token = (() => {
    try {
      return localStorage.getItem('token')
    } catch {
      return null
    }
  })()

  // An expired token is as good as no token: clear it proactively so the UI
  // flips to logged-out instead of waiting for the first API call to 401.
  if (token && isTokenExpired(token)) {
    clearStoredAuth()
    token = null
  }

  if (!token && to.name === 'user-profile') {
    useDemoAuthGate().openAuthGate({ redirect: '/register?from=demo' })
    if (from.name) return false
    return { path: '/missions', replace: true }
  }

  if (requiresAuth && !token) {
    const demoStore = useDemoStore()
    if (demoStore.isDemoAllowedRoute(to.name)) {
      demoStore.startDemo()
      return
    }

    useDemoAuthGate().openAuthGate({
      redirect: `/register?from=demo&redirect=${encodeURIComponent(to.fullPath)}`
    })
    if (from.name) return false
    return { path: '/missions', replace: true }
  }

  // If user is already logged in, keep them out of auth pages
  if ((to.name === 'login' || to.name === 'register') && token) {
    return { name: 'today' }
  }

  if (requiresSuperAdmin) {
    const userStore = useUserStore()
    if (!isSuperAdminUserId(userStore.userId)) {
      return { name: 'today' }
    }
  }
})

export default router 