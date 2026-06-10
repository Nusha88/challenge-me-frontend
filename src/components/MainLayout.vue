<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useUserStore } from '../stores/user'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'
import NotificationsComponent from './NotificationsComponent.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import XpAwardToast from './XpAwardToast.vue'
import AppHeader from './layout/AppHeader.vue'
import AppSidebar from './layout/AppSidebar.vue'
import MobileFab from './layout/MobileFab.vue'
import { useUnreadNotifications } from '../composables/useUnreadNotifications'
import { useUserStreak } from '../composables/useUserStreak'
import { usePushNotifications } from '../composables/usePushNotifications'
import { useOnboarding } from '../composables/useOnboarding'
import { useAppEventListeners } from '../composables/useAppEvents'
import { useGlobalChallengeDialog } from '../composables/useGlobalChallengeDialog'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { clearAppBadge } from '../utils/appBadge'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { mobile, mdAndUp } = useDisplay()
const { startTour } = useOnboarding()

const isAuthPage = computed(() => {
  return ['login', 'register', 'forgot-password'].includes(route.name)
    || route.path === '/login'
    || route.path === '/register'
})

const isLoggedIn = computed(() => userStore.isLoggedIn)
const currentUserId = computed(() => {
  const id = userStore.userId
  return id != null ? String(id) : null
})
const showAppChrome = computed(() => isLoggedIn.value && !isAuthPage.value)

const push = usePushNotifications()
const {
  displayStreakDays,
  yesterdayStreakDays,
  hasTodayCompletedTasks,
  streakDaysText,
  showStreak,
  calculateStreak,
  reset: resetStreak
} = useUserStreak()
const {
  unreadNotificationCount,
  notificationsDrawerOpen,
  loadUnreadNotificationCount,
  openNotifications,
  closeNotifications,
  handleUnreadCountChanged,
  reset: resetNotifications
} = useUnreadNotifications({
  onUnreadLoadSuccess: () => push.trySyncSubscription()
})

const drawerOpen = ref(false)
const onboardingStarted = ref(false)
let notificationPollInterval = null

const {
  detailsDialogOpen: globalDetailsDialogOpen,
  selectedChallenge: globalSelectedChallenge,
  scrollTarget: globalScrollTarget,
  initialTab: globalInitialTab,
  selectedIsOwner: globalSelectedIsOwner,
  selectedIsParticipant: globalSelectedIsParticipant,
  showDialogJoinButton: globalShowDialogJoinButton,
  showDialogLeaveButton: globalShowDialogLeaveButton,
  openFromNotification,
  handleDialogClose: handleGlobalDialogClose
} = useGlobalChallengeDialog(currentUserId)

function handleOpenChallenge(event) {
  const detail = event?.detail
  if (!detail?.challengeId) return
  openFromNotification(detail)
}

function startNotificationPolling() {
  stopNotificationPolling()

  notificationPollInterval = setInterval(() => {
    if (!isLoggedIn.value) {
      stopNotificationPolling()
      return
    }

    loadUnreadNotificationCount()
    calculateStreak()
  }, 30000)
}

function stopNotificationPolling() {
  if (notificationPollInterval) {
    clearInterval(notificationPollInterval)
    notificationPollInterval = null
  }
}

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value
}

function logout() {
  useWatchedChallengesStore().clear()
  userStore.clearUser()
  clearAppBadge()
  dispatchAppEvent(APP_EVENTS.AUTH_CHANGED)
  router.push('/login')
}

function startLoggedInSession() {
  loadUnreadNotificationCount()
  calculateStreak()
  startNotificationPolling()
  push.initializeOnce()
}

function stopLoggedInSession() {
  stopNotificationPolling()
  push.reset()
  resetNotifications()
  resetStreak()
}

useAppEventListeners([
  { event: APP_EVENTS.AUTH_CHANGED, handler: push.handleAuthChanged },
  { event: APP_EVENTS.OPEN_CHALLENGE, handler: handleOpenChallenge }
])

watch(() => route.name, () => {
  if (mobile.value) {
    drawerOpen.value = false
  }
})

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    startLoggedInSession()
  } else {
    stopLoggedInSession()
  }
})

onMounted(() => {
  closeNotifications()
  push.handleAuthChanged()
  if (isLoggedIn.value) {
    startLoggedInSession()
  }
})

onBeforeUnmount(() => {
  stopNotificationPolling()
})

async function maybeStartOnboarding() {
  if (onboardingStarted.value || !isLoggedIn.value) return
  if (localStorage.getItem('onboarding_complete') === 'true') return
  if (localStorage.getItem('onboarding_pending') !== 'true') return

  onboardingStarted.value = true
  await nextTick()
  setTimeout(() => {
    try {
      startTour()
    } catch {
      onboardingStarted.value = false
    }
  }, 500)
}

watch(
  () => [isLoggedIn.value, route.path, mdAndUp.value],
  () => {
    maybeStartOnboarding()
  },
  { immediate: true }
)
</script>

<template>
  <v-app>
    <AppHeader
      v-if="!isAuthPage"
      :is-logged-in="isLoggedIn"
      :unread-count="unreadNotificationCount"
      :display-streak-days="displayStreakDays"
      :yesterday-streak-days="yesterdayStreakDays"
      :has-today-completed-tasks="hasTodayCompletedTasks"
      :streak-days-text="streakDaysText"
      :show-streak="showStreak"
      @toggle-drawer="toggleDrawer"
      @open-notifications="openNotifications"
    />

    <MobileFab :show="showAppChrome" />

    <v-main
      :class="['main-content', {
        'public-view': !isLoggedIn,
        'with-sidebar': showAppChrome,
        'auth-layout': isAuthPage
      }]"
    >
      <div class="main-content-wrapper">
        <AppSidebar
          v-if="showAppChrome"
          :drawer-open="drawerOpen"
          @update:drawer-open="drawerOpen = $event"
          @profile="router.push('/profile')"
          @logout="logout"
        />

        <div
          :class="['main-content-inner', {
            'content-column': showAppChrome,
            'full-column': !showAppChrome
          }]"
        >
          <router-view></router-view>
        </div>
      </div>
    </v-main>

    <NotificationsComponent
      v-model="notificationsDrawerOpen"
      :current-user-id="currentUserId"
      :unread-count="unreadNotificationCount"
      @unread-count-changed="handleUnreadCountChanged"
      @close="closeNotifications"
    />

    <ChallengeDetailsDialog
      v-model="globalDetailsDialogOpen"
      :challenge="globalSelectedChallenge"
      :is-owner="globalSelectedIsOwner"
      :is-participant="globalSelectedIsParticipant"
      :show-join-button="globalShowDialogJoinButton"
      :show-leave-button="globalShowDialogLeaveButton"
      :initial-tab="globalInitialTab"
      :scroll-target="globalScrollTarget"
      :join-loading="false"
      :leave-loading="false"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update:model-value="handleGlobalDialogClose"
    />

    <XpAwardToast />
  </v-app>
</template>

<style scoped>
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

@media (max-width: 959px) {
  .main-content-wrapper {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .main-content-inner.content-column {
    grid-column: 1 / -1;
  }

  .main-content.with-sidebar {
    margin-left: 0 !important;
  }

  .main-content {
    border-radius: 0;
    padding-top: 1em;
  }
}

.v-application {
  background-color: transparent !important;
}

.main-content {
  padding: 1em;
  min-height: auto;
  width: 100%;
  margin: 0;
  background-color: transparent;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 0 0 12px 12px;
}

.main-content.with-sidebar .main-content-wrapper {
  gap: 1em;
}

.main-content.public-view .main-content-wrapper {
  gap: 0;
}

.auth-layout {
  padding: 0 !important;
  margin: 0 !important;
  height: 100vh !important;
  width: 100vw !important;
  overflow: hidden !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-layout .main-content-wrapper,
.auth-layout .main-content-inner {
  height: 100% !important;
  width: 100% !important;
  display: flex;
}

:deep(.v-application__wrap) {
  min-height: 100vh !important;
  backface-visibility: hidden;
}

@media (max-height: 750px) {
  .auth-layout {
    overflow-y: auto !important;
  }
}
</style>
