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
    <v-app-bar class="app-bar-custom" elevation="0" :fixed="false">
      <v-app-bar-nav-icon
        v-if="isLoggedIn"
        @click="toggleDrawer"
        class="d-md-none"
      ></v-app-bar-nav-icon>
      <router-link 
        to="/" 
        class="brand-link"
        :class="{ 'hide-on-mobile-logged-in': isLoggedIn }"
      >{{ t('app.name') }}</router-link>
      <div class="add-button-mobile-wrapper d-md-none">
        <v-btn
          v-if="isLoggedIn"
          to="/challenges/add"
          variant="elevated"
          size="large"
          class="cta-button"
          prepend-icon="mdi-plus-circle"
        >
          {{ t('navigation.addChallenge') }}
        </v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-menu location="bottom" open-on-hover class="d-none d-md-block">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="text"
            class="mr-2 language-button d-none d-md-inline-flex"
            prepend-icon="mdi-translate"
            style="color: rgba(0, 0, 0, 0.87);"
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
        v-if="!isLoggedIn && route.path !== '/register'"
        to="/register"
        variant="elevated"
        class="mr-2 sign-up-button"
        style="color: white;"
      >
        {{ t('navigation.register') }}
      </v-btn>
      <v-btn
        v-if="!isLoggedIn && route.path !== '/login'"
        to="/login"
        variant="outlined"
        class="mr-2 login-button"
        style="border-color: #3C60E8; color: #3C60E8; border-width: 2px;"
      >
        {{ t('navigation.login') }}
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        to="/challenges/add"
        variant="elevated"
        size="large"
        class="mr-2 cta-button d-none d-md-inline-flex"
        prepend-icon="mdi-plus-circle"
      >
        {{ t('navigation.addChallenge') }}
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        to="/profile"
        variant="text"
        class="mr-2 d-none d-md-inline-flex"
        prepend-icon="mdi-account"
        style="color: rgba(0, 0, 0, 0.87);"
      >
        {{ userName || t('navigation.profile') }}
      </v-btn>
      <v-btn
        v-if="isLoggedIn"
        variant="text"
        class="d-none d-md-inline-flex"
        @click="logout"
        style="color: rgba(0, 0, 0, 0.87);"
      >
        {{ t('navigation.logout') }}
      </v-btn>
    </v-app-bar>

    <v-main :class="['main-content', { 'public-view': !isLoggedIn, 'with-sidebar': isLoggedIn }]">
      <div class="main-content-wrapper">
        <!-- Desktop Permanent Sidebar -->
        <v-navigation-drawer
          v-if="isLoggedIn"
          permanent
          class="d-none d-md-block desktop-sidebar sidebar-column"
        >
          <v-list>
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

        <div :class="['main-content-inner', { 'content-column': isLoggedIn, 'full-column': !isLoggedIn }]">
          <router-view></router-view>
        </div>
      </div>
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
        <v-list-item
          to="/"
          :active="currentRoute === 'home'"
          color="primary"
          @click="drawerOpen = false"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-home"></v-icon>
          </template>
          <v-list-item-title>{{ t('navigation.home') }}</v-list-item-title>
        </v-list-item>

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
  width: auto;
}

.main-content-wrapper {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  width: 100%;
  height: 100%;
  gap: 1em;
}

.main-content-inner.full-column {
  grid-column: 1 / -1;
}

.main-content-inner.content-column {
  grid-column: 3 / -1;
}

.sidebar-column {
  grid-column: 1 / 3;
}

@media (max-width: 959px) {
  .main-content-wrapper {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .main-content-inner.content-column {
    grid-column: 1 / -1;
  }
}

.desktop-sidebar {
  position: relative;
  flex-shrink: 0;
  height: auto;
  z-index: 1;
  margin-top: 0;
  padding-top: 0;
  top: 0;
  width: auto;
  background-color: transparent !important;
  border: none !important;
}

.desktop-sidebar :deep(.v-list) {
  padding-top: 0;
}

.desktop-sidebar :deep(.v-navigation-drawer__content) {
  padding-top: 0;
  background-color: transparent !important;
}

.desktop-sidebar :deep(.v-navigation-drawer__prepend),
.desktop-sidebar :deep(.v-navigation-drawer__append) {
  background-color: transparent !important;
}

.desktop-sidebar :deep(.v-navigation-drawer__border) {
  display: none !important;
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.v-list-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(180deg, #1FA0F6 0%, #A62EE8 100%);
  transform: scaleY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-list-item:hover::before {
  transform: scaleY(1);
}

.v-list-item:hover {
  background-color: rgba(31, 160, 246, 0.1) !important;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(31, 160, 246, 0.2);
}

.v-list-item :deep(.v-list-item__prepend) {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-list-item:hover :deep(.v-list-item__prepend) {
  transform: scale(1.1);
}

.v-list-item :deep(.v-icon) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-list-item:hover :deep(.v-icon) {
  transform: scale(1.15) rotate(5deg);
  color: #1FA0F6;
}

.v-list-item :deep(.v-list-item-title) {
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.v-list-item:hover :deep(.v-list-item-title) {
  color: #1FA0F6;
  transform: translateX(2px);
}

.v-list-item.active {
  background-color: #1976d2 !important;
  color: white !important;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.v-list-item.active::before {
  transform: scaleY(1);
  background: linear-gradient(180deg, #1976d2 0%, #1565c0 100%);
}

.v-list-item.active :deep(.v-icon) {
  transform: scale(1.1);
  color: white !important;
}

.v-application {
  background-color: transparent !important;
}

.main-content {
  padding: 1em;
  min-height: auto;
  width: 100%;
  margin: 0;
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 0 0 12px 12px;
}

@media (min-width: 600px) {
  .main-content {
    padding: 1.5em;
    margin: 0 1em 1.5em 1em;
    border-radius: 0 0 16px 16px;
  }
}

@media (min-width: 960px) {
  .main-content {
    padding: 2em;
    margin: 0 1em 2em 1em;
  }
}

.main-content.with-sidebar .main-content-wrapper {
  gap: 1em;
}

.main-content.public-view .main-content-wrapper {
  gap: 0;
}


@media (max-width: 959px) {
  .main-content {
    border-radius: 0;
    margin-top: 64px;
    padding-top: 1em;
  }
}

.cta-button {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-left: 24px;
  padding-right: 24px;
  box-shadow: 0 6px 18px rgba(31, 160, 246, 0.35);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
  color: white !important;
  position: relative;
  overflow: hidden;
}

.cta-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.cta-button:hover::before {
  left: 100%;
}

.cta-button :deep(.v-btn__overlay) {
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
  transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-button :deep(.v-btn__content) {
  color: white !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cta-button :deep(.v-icon) {
  color: white !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 28px rgba(31, 160, 246, 0.5);
  background: linear-gradient(135deg, #A62EE8 0%, #1FA0F6 100%) !important;
}

.cta-button:hover :deep(.v-btn__content) {
  transform: translateX(2px);
}

.cta-button:hover :deep(.v-icon) {
  transform: rotate(90deg) scale(1.1);
}

.cta-button:active {
  transform: translateY(-1px) scale(0.98);
  box-shadow: 0 4px 12px rgba(31, 160, 246, 0.4);
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
  position: relative !important;
  background-color: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin: 1em 1em 0 1em;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-bar-custom :deep(.v-toolbar__content) {
  background-color: transparent !important;
  padding: 0 1.5em;
  overflow-x: auto;
  overflow-y: hidden;
}

.app-bar-custom :deep(.v-toolbar__content)::-webkit-scrollbar {
  display: none;
}

.app-bar-custom :deep(.v-toolbar__content) {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@media (max-width: 959px) {
  .app-bar-custom {
    position: fixed !important;
    top: 0;
    left: 0;
    right: 0;
    margin: 0;
    border-radius: 0;
    z-index: 1000;
    width: 100%;
  }
  
  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0.5em;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 0.25em;
  }
  
  .brand-link {
    font-size: 0.875rem !important;
    padding-left: 4px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  
  .brand-link.hide-on-mobile-logged-in {
    display: none !important;
  }
  
  .v-spacer {
    min-width: 8px;
    flex-shrink: 1;
  }
  
  .sign-up-button,
  .login-button {
    font-size: 0.75rem;
    padding: 6px 12px;
    min-width: auto;
    height: 32px;
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  .sign-up-button :deep(.v-btn__content),
  .login-button :deep(.v-btn__content) {
    padding: 0 4px;
  }
}

@media (max-width: 600px) {
  .app-bar-custom {
    margin: 0.5em 0.25em 0 0.25em;
  }
  
  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0.5em 0.25em;
    gap: 0.25em;
  }
  
  .brand-link {
    font-size: 0.75rem !important;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sign-up-button,
  .login-button {
    font-size: 0.7rem;
    padding: 4px 8px;
    height: 28px;
  }
}

.app-bar-custom :deep(.v-toolbar__content) {
  background-color: transparent !important;
}

.app-bar-custom :deep(.v-app-bar-title) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.app-bar-custom :deep(.v-btn:not(.sign-up-button)) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.app-bar-custom :deep(.brand-link) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.app-bar-custom :deep(.v-app-bar-nav-icon) {
  color: rgba(0, 0, 0, 0.87) !important;
}

.sign-up-button {
  border-radius: 24px !important;
  background: linear-gradient(135deg, #4161E1 0%, #4869DB 100%) !important;
}

.login-button {
  border-radius: 24px !important;
  background-color: transparent !important;
  color: #3C60E8 !important;
  border-color: #3C60E8 !important;
}

.login-button :deep(.v-btn__content) {
  color: #3C60E8 !important;
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