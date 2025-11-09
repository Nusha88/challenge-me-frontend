<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.name)
const isLoggedIn = ref(!!localStorage.getItem('token'))

function updateAuthState() {
  isLoggedIn.value = !!localStorage.getItem('token')
}

onMounted(() => {
  window.addEventListener('auth-changed', updateAuthState)
  updateAuthState()
})

onBeforeUnmount(() => {
  window.removeEventListener('auth-changed', updateAuthState)
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('auth-changed'))
  router.push('/login')
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary">
      <router-link to="/" class="brand-link">ChallengeMe</router-link>
      <v-spacer></v-spacer>
      <v-btn
        v-if="!isLoggedIn"
        to="/register"
        color="white"
        variant="text"
        class="mr-2"
      >
        Register
      </v-btn>
      <v-btn
        v-if="!isLoggedIn"
        to="/login"
        color="white"
        variant="text"
        class="mr-2"
      >
        Login
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        to="/challenges/add"
        color="secondary"
        variant="elevated"
        size="large"
        class="mr-2 cta-button"
        prepend-icon="mdi-plus-circle"
      >
        Add Challenge
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        to="/profile"
        color="white"
        variant="text"
        class="mr-2"
      >
        Profile
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        color="white"
        variant="text"
        @click="logout"
      >
        Logout
      </v-btn>
    </v-app-bar>

    <v-row no-gutters>
      <v-col v-if="isLoggedIn" cols="auto">
        <v-navigation-drawer permanent>
          <v-list>
            <v-list-item
              :active="currentRoute === 'my-challenges'"
              to="/challenges/my"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-trophy"></v-icon>
              </template>
              <v-list-item-title>My Challenges</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'users'"
              to="/users"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-account-group"></v-icon>
              </template>
              <v-list-item-title>All Users</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'challenges'"
              to="/challenges"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-flag-checkered"></v-icon>
              </template>
              <v-list-item-title>All Challenges</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
      </v-col>

      <v-col :class="{ 'public-column': !isLoggedIn }">
        <v-main :class="['main-content', { 'public-view': !isLoggedIn }]">
          <router-view></router-view>
        </v-main>
      </v-col>
    </v-row>
  </v-app>
</template>

<style scoped>
.v-navigation-drawer {
  width: 256px;
}

.v-list-item {
  margin: 4px 8px;
  border-radius: 8px;
}

.v-list-item.active {
  background-color: #1976d2 !important;
  color: white !important;
}

.main-content {
  padding-top: 24px;
  height: 95vh;
  margin-top: 2em;
}

.main-content.public-view {
  padding-top: 48px;
}

.public-column {
  flex: 1;
}

.cta-button {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-left: 24px;
  padding-right: 24px;
  box-shadow: 0 6px 18px rgba(98, 0, 238, 0.35);
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(98, 0, 238, 0.45);
}

.brand-link {
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
  text-decoration: none;
  letter-spacing: 0.04em;
  padding-left: 16px;
  display: inline-flex;
  align-items: center;
  background-color: transparent;
}

.brand-link:hover,
.brand-link:focus,
.brand-link:active {
  text-decoration: none;
  background-color: transparent;
}
</style> 