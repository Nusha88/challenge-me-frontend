import { createRouter, createWebHistory } from 'vue-router'
import HomeComponent from '../components/HomeComponent.vue'
import RegisterComponent from '../components/RegisterComponent.vue'
import UsersList from '../components/UsersList.vue'
import LoginComponent from '../components/LoginComponent.vue'
import ProfileComponent from '../components/ProfileComponent.vue'
import AllChallengesComponent from '../components/AllChallengesComponent.vue'
import AddChallengeComponent from '../components/AddChallengeComponent.vue'
import MyChallengesComponent from '../components/MyChallengesComponent.vue'
import ChallengeEditPage from '../components/ChallengeEditPage.vue'

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
      path: '/challenges/my',
      name: 'my-challenges',
      component: MyChallengesComponent
    },
    {
      path: '/challenges',
      name: 'challenges',
      component: AllChallengesComponent
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
    }
  ]
})

export default router 