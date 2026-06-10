<template>
  <v-app-bar class="app-bar-custom" elevation="0" :fixed="false">
    <div class="header-content-wrapper">
      <div class="header-section header-left">
        <v-app-bar-nav-icon
          v-if="isLoggedIn"
          class="d-md-none"
          @click="$emit('toggle-drawer')"
        ></v-app-bar-nav-icon>
        <StreakBadge
          :visible="isLoggedIn && showStreak"
          :display-streak-days="displayStreakDays"
          :yesterday-streak-days="yesterdayStreakDays"
          :has-today-completed-tasks="hasTodayCompletedTasks"
          :streak-days-text="streakDaysText"
        />
      </div>

      <div class="header-section header-center">
        <div
          v-if="isLoggedIn || route.path !== '/'"
          class="brand-group"
        >
          <router-link
            to="/"
            class="brand-link"
          >
            <img :src="awaImage" alt="Awa" class="brand-logo" />
          </router-link>
          <div
            v-if="isLoggedIn"
            class="sparks-container"
            :aria-label="t('navigation.sparksAriaLabel', { count: userSparks })"
          >
            <span class="sparks-icon">✦</span>
            <span class="sparks-count" :class="{ 'sparks-count--spent': sparksSpentAnimating }">{{ userSparks }}</span>
            <span v-if="spentDelta" class="sparks-spent-delta">{{ spentDelta }}</span>
            <span class="sparks-label"> {{ t('navigation.sparksLabel') }}</span>
          </div>
        </div>
        <div v-if="!isLoggedIn && route.path === '/' && mobile" class="d-flex align-center gap-2">
          <v-btn
            v-if="route.path !== '/register'"
            to="/register"
            variant="elevated"
            class="sign-up-button"
            style="color: white;"
          >
            {{ t('navigation.register') }}
          </v-btn>
          <v-btn
            v-if="route.path !== '/login'"
            to="/login"
            variant="outlined"
            class="login-button"
            style="border-color: #3C60E8; color: #3C60E8; border-width: 2px;"
          >
            {{ t('navigation.login') }}
          </v-btn>
        </div>
      </div>

      <div class="header-section header-right">
        <v-btn
          v-if="!isLoggedIn && route.path !== '/register' && (!mobile || route.path !== '/')"
          to="/register"
          variant="elevated"
          class="mr-2 sign-up-button"
          style="color: white;"
        >
          {{ t('navigation.register') }}
        </v-btn>
        <v-btn
          v-if="!isLoggedIn && route.path !== '/login' && (!mobile || route.path !== '/')"
          to="/login"
          variant="outlined"
          class="mr-2 login-button"
          style="border-color: #3C60E8; color: #3C60E8; border-width: 2px;"
        >
          {{ t('navigation.login') }}
        </v-btn>
        <v-btn
          v-if="isLoggedIn"
          to="/missions/add"
          variant="elevated"
          size="large"
          class="mr-2 cta-button-cyber d-none d-md-inline-flex start-mission-btn"
        >
          <template #prepend>
            <v-icon class="icon-pulse">mdi-flare</v-icon>
          </template>
          {{ t('navigation.addChallenge') }}
        </v-btn>
        <v-btn
          v-if="isLoggedIn"
          variant="text"
          class="mr-2 notification-button"
          @click="$emit('open-notifications')"
        >
          <v-icon>mdi-bell</v-icon>
          <v-badge
            v-if="unreadCount > 0"
            :content="unreadCount > 99 ? '99+' : unreadCount"
            color="error"
            overlap
            class="notification-badge"
          ></v-badge>
        </v-btn>
      </div>
    </div>
  </v-app-bar>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useUserStore } from '../../stores/user'
import { APP_EVENTS, addAppEventListener, removeAppEventListener } from '../../utils/appEvents'
import awaImage from '../../assets/awa.png'
import StreakBadge from './StreakBadge.vue'

defineProps({
  isLoggedIn: { type: Boolean, default: false },
  unreadCount: { type: Number, default: 0 },
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  streakDaysText: { type: String, default: '' },
  showStreak: { type: Boolean, default: false }
})

defineEmits(['toggle-drawer', 'open-notifications'])

const route = useRoute()
const { t } = useI18n()
const { mobile } = useDisplay()
const userStore = useUserStore()
const userSparks = computed(() => userStore.userSparks)
const sparksSpentAnimating = ref(false)
const spentDelta = ref('')

function handleSparksSpent(event) {
  const spent = Number(event?.detail?.spent || 0)
  if (!spent) return

  spentDelta.value = `−${spent}`
  sparksSpentAnimating.value = true

  window.setTimeout(() => {
    sparksSpentAnimating.value = false
    spentDelta.value = ''
  }, 800)
}

onMounted(() => {
  addAppEventListener(APP_EVENTS.SPARKS_SPENT, handleSparksSpent)
})

onBeforeUnmount(() => {
  removeAppEventListener(APP_EVENTS.SPARKS_SPENT, handleSparksSpent)
})
</script>

<style scoped>
.app-bar-custom {
  background: rgba(13, 13, 23, 0.7) !important;
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: white !important;
}

.header-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 16px;
  gap: 16px;
}

.header-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header-left {
  justify-content: flex-start;
  min-width: 120px;
}

.header-center {
  justify-content: center;
  flex: 1;
  display: flex;
  align-items: center;
}

.header-right {
  justify-content: flex-end;
  min-width: 120px;
  gap: 8px;
}

.brand-group {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 8px;
  min-width: 0;
  height: 100%;
}

.brand-link {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  flex-shrink: 0;
}

.brand-link:hover,
.brand-link:focus,
.brand-link:active {
  text-decoration: none;
  background-color: transparent;
}

.brand-logo {
  height: 40px;
  filter: drop-shadow(0 0 10px rgba(112, 72, 232, 0.4));
  transition: transform 0.3s ease;
  display: block;
  object-fit: contain;
}

.brand-logo:hover {
  transform: scale(1.05);
}

.sparks-container {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.22);
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.sparks-container:hover {
  background: rgba(255, 193, 7, 0.14);
  border-color: rgba(255, 193, 7, 0.38);
}

.sparks-icon {
  color: #FFC107;
  font-size: 0.85rem;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255, 193, 7, 0.45));
}

.sparks-count {
  font-weight: 800;
  font-size: 0.875rem;
  color: #ffffff;
  line-height: 1;
  transition: color 0.2s ease, transform 0.2s ease;
}

.sparks-count--spent {
  animation: sparksSpentPulse 0.65s ease;
}

.sparks-spent-delta {
  font-size: 0.7rem;
  font-weight: 800;
  color: #7048E8;
  line-height: 1;
  animation: sparksDeltaFade 0.8s ease forwards;
}

@keyframes sparksSpentPulse {
  0% { transform: scale(1); color: #ffffff; }
  35% { transform: scale(1.12); color: #7048E8; }
  100% { transform: scale(1); color: #ffffff; }
}

@keyframes sparksDeltaFade {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}

.sparks-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.65);
  text-transform: uppercase;
  line-height: 1;
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.notification-button {
  color: rgba(255, 255, 255, 0.7) !important;
  position: relative;
}

.notification-button:hover {
  color: white !important;
}

.login-button {
  border: 2px solid rgba(112, 72, 232, 0.5) !important;
  color: white !important;
  border-radius: 12px !important;
}

.sign-up-button {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
}

.sign-up-button :deep(.v-btn__content),
.login-button :deep(.v-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cta-button-cyber {
  background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%) !important;
  color: #0F172A !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 12px !important;
  box-shadow: 0 0 15px rgba(79, 209, 197, 0.4) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.cta-button-cyber:hover {
  box-shadow: 0 0 25px rgba(79, 209, 197, 0.8) !important;
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.cta-button-cyber:active {
  transform: translateY(0);
}

.icon-pulse {
  animation: star-pulse 2s infinite ease-in-out;
}

@keyframes star-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

:deep(.v-badge__badge) {
  background-color: #ff5252 !important;
  box-shadow: 0 0 10px rgba(255, 82, 82, 0.5);
}

.app-bar-custom :deep(.v-app-bar-title),
.app-bar-custom :deep(.v-btn:not(.sign-up-button)),
.app-bar-custom :deep(.brand-link),
.app-bar-custom :deep(.v-app-bar-nav-icon) {
  color: #ffffff;
}

@media (min-width: 600px) {
  .brand-group {
    padding: 0 12px;
  }

  .brand-link {
    font-size: 1.25rem;
  }
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
    min-height: 56px;
    align-items: center;
  }

  .header-content-wrapper {
    gap: 12px;
  }

  .header-left,
  .header-right {
    min-width: auto;
    flex: 0 0 auto;
  }

  .header-center {
    flex: 1;
    justify-content: center;
  }

  .header-center .d-flex {
    justify-content: center;
    gap: 8px;
  }

  .header-right {
    gap: 6px;
  }

  .brand-group {
    gap: 8px;
    padding: 0 4px;
  }

  .brand-link {
    font-size: 0.875rem !important;
  }

  .sparks-container {
    gap: 4px;
    padding: 3px 8px;
  }

  .brand-logo {
    height: 32px;
  }

  .sign-up-button,
  .login-button {
    font-size: 0.75rem;
    padding: 6px 12px;
    min-width: auto;
    height: 32px;
  }

  .sign-up-button :deep(.v-btn__content),
  .login-button :deep(.v-btn__content) {
    padding: 0 4px;
  }
}

@media (max-width: 600px) {
  .app-bar-custom :deep(.v-toolbar__content) {
    padding: 0.5em;
  }

  .header-content-wrapper {
    gap: 8px;
  }

  .header-center .d-flex {
    gap: 6px;
  }

  .header-right {
    gap: 4px;
  }

  .brand-group {
    gap: 6px;
  }

  .brand-link {
    font-size: 0.75rem !important;
  }

  .sparks-container {
    gap: 4px;
    padding: 2px 6px;
  }

  .sparks-label {
    display: none;
  }

  .brand-logo {
    height: 28px;
  }

  .sign-up-button,
  .login-button {
    font-size: 0.7rem;
    padding: 4px 8px;
    height: 28px;
  }
}
</style>
