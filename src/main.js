import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Vuetify — components/directives are auto-imported on demand by
// vite-plugin-vuetify, so we no longer bundle the entire library.
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  defaults: {
    VContainer: {
      fluid: true,
    },
  },
})

const pinia = createPinia()

const app = createApp(App)
  .use(pinia)
  .use(router)
  .use(i18n)
  .use(vuetify)

// Initialize user store from localStorage on app load
import { useUserStore } from './stores/user'
const userStore = useUserStore()
userStore.initializeFromStorage()

app.mount('#app')

// Initialize push notifications when app starts
if ('serviceWorker' in navigator) {
  import('./utils/pushNotifications').then(({ initializePushNotifications }) => {
    // Wait a bit for the app to fully load
    setTimeout(() => {
      initializePushNotifications()
    }, 1000)
  })
}
