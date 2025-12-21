<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'

const router = useRouter()
const route = useRoute()
const currentRoute = computed(() => route.name)
const isLoggedIn = ref(!!localStorage.getItem('token'))

function readStoredUser() {
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    return null
  }
}

const currentUser = ref(readStoredUser())
const { t, locale } = useI18n()
const { mobile, mdAndUp } = useDisplay()
const availableLocales = SUPPORTED_LOCALES

function updateAuthState() {
  isLoggedIn.value = !!localStorage.getItem('token')
  currentUser.value = readStoredUser()
}

const userName = computed(() => currentUser.value?.name || null)

const currentLocaleLabel = computed(() => {
  return availableLocales.find(lang => lang.code === locale.value)?.label || locale.value
})

const drawerOpen = ref(false)

const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

// Ensure drawer is closed when route changes on mobile
watch(currentRoute, () => {
  if (mobile.value) {
    drawerOpen.value = false
  }
})

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

function changeLanguage(code) {
  setLocale(code)
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" class="app-bar-custom">
      <v-app-bar-nav-icon
        v-if="isLoggedIn"
        @click="toggleDrawer"
        class="d-md-none"
      ></v-app-bar-nav-icon>
      <router-link to="/" class="brand-link d-none d-md-inline-flex">{{ t('app.name') }}</router-link>
      <div class="add-button-mobile-wrapper d-md-none">
        <v-btn
          v-if="isLoggedIn"
          to="/challenges/add"
          color="secondary"
          variant="elevated"
          size="large"
          class="cta-button"
          prepend-icon="mdi-plus-circle"
        >
          {{ t('navigation.addChallenge') }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        v-if="!isLoggedIn"
        to="/register"
        color="white"
        variant="text"
        class="mr-2 d-none d-md-inline-flex"
      >
        {{ t('navigation.register') }}
      </v-btn>
      <v-btn
        v-if="!isLoggedIn"
        to="/login"
        color="white"
        variant="text"
        class="mr-2 d-none d-md-inline-flex"
      >
        {{ t('navigation.login') }}
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        to="/challenges/add"
        color="secondary"
        variant="elevated"
        size="large"
        class="mr-2 cta-button d-none d-md-inline-flex"
        prepend-icon="mdi-plus-circle"
      >
        {{ t('navigation.addChallenge') }}
      </v-btn>
      <v-menu location="bottom" open-on-hover class="d-none d-md-block">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            color="white"
            variant="text"
            class="mr-2 language-button d-none d-md-inline-flex"
            prepend-icon="mdi-translate"
          >
            {{ currentLocaleLabel }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="language in availableLocales"
            :key="language.code"
            :active="language.code === locale.value"
            @click="changeLanguage(language.code)"
          >
            <v-list-item-title>{{ language.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn
        v-if="isLoggedIn"
        to="/profile"
        color="white"
        variant="text"
        class="mr-2 d-none d-md-inline-flex"
        prepend-icon="mdi-account"
      >
        {{ userName || t('navigation.profile') }}
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        color="white"
        variant="text"
        class="d-none d-md-inline-flex"
        @click="logout"
      >
        {{ t('navigation.logout') }}
      </v-btn>
    </v-app-bar>

    <!-- Desktop Permanent Sidebar -->
    <v-navigation-drawer
      v-if="isLoggedIn"
      permanent
      class="d-none d-md-block desktop-sidebar"
    >
      <v-list>
        <v-list-item class="sidebar-logo">
          <v-list-item-title class="text-h6 font-weight-bold">
            {{ t('app.name') }}
          </v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          :active="currentRoute === 'my-challenges'"
          to="/challenges/my"
          color="primary"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-trophy"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.myChallenges') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'users'"
          to="/users"
          color="primary"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-account-group"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.allUsers') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'challenges'"
          to="/challenges"
          color="primary"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-flag-checkered"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.allChallenges') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main :class="['main-content', { 'public-view': !isLoggedIn, 'with-sidebar': isLoggedIn }]">
      <router-view></router-view>
    </v-main>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-if="isLoggedIn"
      :model-value="drawerOpen"
      @update:model-value="drawerOpen = $event"
      temporary
      location="start"
      class="d-md-none mobile-drawer"
    >
      <v-list>
        <v-list-item class="sidebar-logo" @click="drawerOpen = false">
          <v-list-item-title class="text-h6 font-weight-bold">
            {{ t('app.name') }}
          </v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          to="/profile"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-account"></v-icon>
          </template>
          <v-list-item-title>{{ userName || t('navigation.profile') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          :active="currentRoute === 'my-challenges'"
          to="/challenges/my"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-trophy"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.myChallenges') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'users'"
          to="/users"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-account-group"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.allUsers') }}</v-list-item-title>
        </v-list-item>

        <v-list-item
          :active="currentRoute === 'challenges'"
          to="/challenges"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-flag-checkered"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.allChallenges') }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-subheader>{{ t('navigation.language') }}</v-list-subheader>
        <v-list-item
          v-for="language in availableLocales"
          :key="language.code"
          :active="language.code === locale.value"
          @click="changeLanguage(language.code); drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-translate"></v-icon>
          </template>
          <v-list-item-title>{{ language.label }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          @click="logout(); drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-logout"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.logout') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-app>
</template>

<style scoped>
.v-navigation-drawer {
  width: 256px;
}

.desktop-sidebar {
  position: fixed;
  left: 0;
  top: 64px;
  height: calc(100vh - 64px);
  z-index: 1;
}

.mobile-drawer {
  z-index: 2000;
}

@media (max-width: 959px) {
  .desktop-sidebar {
    display: none !important;
    visibility: hidden !important;
  }
  
  .main-content.with-sidebar {
    margin-left: 0 !important;
  }
  
  /* Control mobile drawer position */
  .mobile-drawer:not(.v-navigation-drawer--active) {
    left: -256px !important;
    transform: translateX(0) !important;
  }
  
  .mobile-drawer.v-navigation-drawer--active {
    left: 0 !important;
  }
  
  /* Control scrim position on mobile */
  .mobile-drawer ~ .v-navigation-drawer__scrim,
  .v-navigation-drawer__scrim {
    left: 2em !important;
  }
}

.v-list-item {
  margin: 4px 8px;
  border-radius: 8px;
}

.sidebar-logo {
  padding: 16px;
  margin: 0;
  cursor: default;
}

.sidebar-logo:hover {
  background-color: transparent !important;
}

.v-list-item.active {
  background-color: #1976d2 !important;
  color: white !important;
}

.main-content {
  padding-top: 32px;
  padding-left: 8px;
  padding-right: 8px;
  min-height: calc(100vh - 64px);
  width: 100%;
  margin-left: 0;
}

.main-content.with-sidebar {
  margin-left: 0;
}

.main-content.public-view {
  padding-top: 40px;
  margin-left: 0;
}

@media (min-width: 960px) {
  .main-content.with-sidebar {
    margin-left: 256px;
  }
}

@media (min-width: 600px) {
  .main-content {
    padding-top: 40px;
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .main-content.public-view {
    padding-top: 56px;
  }
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

@media (max-width: 959px) {
  .cta-button {
    padding: 12px 28px;
    font-size: 1rem;
    height: 48px;
    min-width: 180px;
  }
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(98, 0, 238, 0.45);
}

.brand-link {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  letter-spacing: 0.04em;
  padding-left: 8px;
  display: inline-flex;
  align-items: center;
  background-color: transparent;
}

@media (min-width: 600px) {
  .brand-link {
    font-size: 1.25rem;
    padding-left: 16px;
  }
}

.brand-link:hover,
.brand-link:focus,
.brand-link:active {
  text-decoration: none;
  background-color: transparent;
}

.language-button {
  text-transform: none;
  font-weight: 500;
}

.app-bar-custom {
  position: relative;
}

.add-button-mobile-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

@media (min-width: 960px) {
  .add-button-mobile-wrapper {
    display: none !important;
  }
}
</style> 