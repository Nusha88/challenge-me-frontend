import { createRouter, createWebHistory } from 'vue-router'
import HomeComponent from '../components/HomeComponent.vue'
import RegisterComponent from '../components/RegisterComponent.vue'
import UsersList from '../components/UsersList.vue'
import LoginComponent from '../components/LoginComponent.vue'
import ProfileComponent from '../components/ProfileComponent.vue'
import EnergyComponent from '../components/EnergyComponent.vue'
import FutureComponent from '../components/FutureComponent.vue'
import PastComponent from '../components/PastComponent.vue'

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
      path: '/login',
      name: 'login',
      component: LoginComponent
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileComponent
    },
    {
      path: '/energy',
      name: 'energy',
      component: EnergyComponent
    },
    {
      path: '/future',
      name: 'future',
      component: FutureComponent
    },
    {
      path: '/past',
      name: 'past',
      component: PastComponent
    }
  ]
})

export default router 