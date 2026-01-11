import { createRouter, createWebHistory } from 'vue-router'
import HomeComponent from '../components/HomeComponent.vue'
import RegisterComponent from '../components/RegisterComponent.vue'
import UsersList from '../components/UsersList.vue'
import LoginComponent from '../components/LoginComponent.vue'
import AllChallengesComponent from '../components/AllChallengesComponent.vue'
import AddChallengeComponent from '../components/AddChallengeComponent.vue'
import ChallengeEditPage from '../components/ChallengeEditPage.vue'
import WatchedChallengesComponent from '../components/WatchedChallengesComponent.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeComponent
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterComponent
    },
    {
      path: '/users',
      name: 'users',
      component: UsersList
    },
    {
      path: '/users/:id',
      name: 'user-profile',
      component: () => import('../components/UserComponent.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: LoginComponent
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
      component: () => import('../components/UserComponent.vue')
    },
    {
      path: '/challenges',
      name: 'challenges',
      component: AllChallengesComponent
    },
    {
      path: '/challenges/my',
      name: 'my-challenges',
      component: () => import('../components/MyChallengesComponent.vue')
    },
    {
      path: '/challenges/add',
      name: 'add-challenge',
      component: AddChallengeComponent
    },
    {
      path: '/challenges/edit/:id',
      name: 'edit-challenge',
      component: ChallengeEditPage
    },
    {
      path: '/challenges/watched',
      name: 'watched-challenges',
      component: WatchedChallengesComponent
    },
    {
      path: '/challenges/:id',
      name: 'view-challenge',
      component: AllChallengesComponent
    },
    {
      path: '/checklists/history',
      name: 'checklists-history',
      component: () => import('../components/DailyChecklistsHistory.vue')
    }
  ]
})

export default router 