import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/profile',
      name: 'profile',
      component: () => import('../components/UserComponent.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/missions',
      name: 'challenges',
      component: () => import('../components/AllChallengesComponent.vue')
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
      path: '/missions/:id',
      name: 'view-challenge',
      component: () => import('../components/AllChallengesComponent.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../components/NotFoundPage.vue')
    }
  ]
})

router.beforeEach((to) => {
  const requiresAuth = to.matched.some(r => r.meta?.requiresAuth)
  const token = (() => {
    try {
      return localStorage.getItem('token')
    } catch {
      return null
    }
  })()

  if (requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // If user is already logged in, keep them out of auth pages
  if ((to.name === 'login' || to.name === 'register') && token) {
    return { name: 'today' }
  }
})

export default router 