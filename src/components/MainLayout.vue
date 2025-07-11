<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.name)
const isLoggedIn = ref(!!localStorage.getItem('token'))
const username = ref(() => {
  const user = localStorage.getItem('user')
  if (!user) return ''
  try {
    return JSON.parse(user).name || ''
  } catch {
    return ''
  }
})

function updateAuthState() {
  isLoggedIn.value = !!localStorage.getItem('token')
}

onMounted(() => {
  window.addEventListener('auth-changed', updateAuthState)
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
      <v-btn
        to="/"
        color="white"
        variant="text"
        class="text-h6 font-weight-bold"
      >
        XHappyDays
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        to="/users"
        color="white"
        variant="text"
        class="mr-2"
      >
        Users
      </v-btn>
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
      <v-col cols="auto">
        <v-navigation-drawer permanent>
          <v-list>
            <v-list-item
              :active="currentRoute === 'energy'"
              to="/energy"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-bolt"></v-icon>
              </template>
              <v-list-item-title>Energy</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'past'"
              to="/past"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-clock"></v-icon>
              </template>
              <v-list-item-title>Past</v-list-item-title>
            </v-list-item>

            <v-list-item
              :active="currentRoute === 'future'"
              to="/future"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-calendar"></v-icon>
              </template>
              <v-list-item-title>Future</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
      </v-col>

      <v-col>
        <v-main class="main-content mt-6">
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

.brand-title {
  padding: 16px;
  margin-bottom: 8px;
  cursor: pointer;
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
  height: 100vh;
}

.v-main {
  min-height: 100vh;
  width: 100%;
}
</style> 