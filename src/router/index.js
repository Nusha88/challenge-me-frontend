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
      path: '/heroes',
      name: 'users',
      component: UsersList
    },
    {
      path: '/heroes/:id',
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
      path: '/missions',
      name: 'challenges',
      component: AllChallengesComponent
    },
    {
      path: '/missions/my',
      name: 'my-challenges',
      component: () => import('../components/MyChallengesComponent.vue')
    },
    {
      path: '/missions/add',
      name: 'add-challenge',
      component: AddChallengeComponent
    },
    {
      path: '/missions/edit/:id',
      name: 'edit-challenge',
      component: ChallengeEditPage
    },
    {
      path: '/missions/watched',
      name: 'watched-challenges',
      component: WatchedChallengesComponent
    },
    {
      path: '/missions/:id',
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