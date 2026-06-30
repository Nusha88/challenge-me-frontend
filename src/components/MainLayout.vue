<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useUserStore } from '../stores/user'
import { useWatchedChallengesStore } from '../stores/watchedChallenges'
import NotificationsComponent from './NotificationsComponent.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import XpAwardToast from './XpAwardToast.vue'
import MissionCompletionFlow from './MissionCompletionFlow.vue'
import AppHeader from './layout/AppHeader.vue'
import AppSidebar from './layout/AppSidebar.vue'
import MobileFab from './layout/MobileFab.vue'
import ReferralWelcomeDialog from './layout/ReferralWelcomeDialog.vue'
import InstallAppInstructionModal from './InstallAppInstructionModal.vue'
import { userService } from '../services/api'
import { useUnreadNotifications } from '../composables/useUnreadNotifications'
import { useUserStreak } from '../composables/useUserStreak'
import { usePushNotifications } from '../composables/usePushNotifications'
import { useOnboarding } from '../composables/useOnboarding'
import { useAppEventListeners } from '../composables/useAppEvents'
import { useGlobalChallengeDialog } from '../composables/useGlobalChallengeDialog'
import { useI18n } from 'vue-i18n'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { clearAppBadge } from '../utils/appBadge'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()
const { mobile, lgAndUp } = useDisplay()
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

const showMobileFab = computed(() => {
  return showAppChrome.value && route.name !== 'add-challenge'
})

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
const logoutConfirmOpen = ref(false)
const onboardingStarted = ref(false)
const installInstructionOpen = ref(false)
const referralWelcomeOpen = ref(false)
const referralWelcomeVariant = ref('signup')
let referralWelcomeChecked = false
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

function requestLogout() {
  logoutConfirmOpen.value = true
}

function confirmLogout() {
  logoutConfirmOpen.value = false
  useWatchedChallengesStore().clear()
  userStore.clearUser()
  clearAppBadge()
  dispatchAppEvent(APP_EVENTS.AUTH_CHANGED)
  router.push('/login')
}

function logout() {
  requestLogout()
}

function startLoggedInSession() {
  loadUnreadNotificationCount()
  calculateStreak()
  startNotificationPolling()
  push.initializeOnce()
}

async function maybeShowReferralWelcome() {
  if (!isLoggedIn.value || isAuthPage.value) return
  if (localStorage.getItem('referral_hook_dismissed') === 'true') return
  if (referralWelcomeOpen.value || referralWelcomeChecked) return

  try {
    const response = await userService.getProfile()
    referralWelcomeChecked = true
    const user = response?.data?.user
    const shouldShowWelcome = user?.welcomeHookPending ?? user?.referralHookPending
    if (shouldShowWelcome) {
      referralWelcomeVariant.value = (
        user.welcomeHookType === 'referral' || user.referralHookPending
      ) ? 'referral' : 'signup'
      referralWelcomeOpen.value = true
    }
  } catch (error) {
    console.error('Error checking referral welcome state:', error)
  }
}

async function handleAppEnter() {
  if (!isLoggedIn.value || isAuthPage.value) return
  await maybeShowReferralWelcome()
  if (!referralWelcomeOpen.value) {
    maybeStartOnboarding()
  }
}

function dismissReferralWelcome() {
  localStorage.setItem('referral_hook_dismissed', 'true')
  referralWelcomeOpen.value = false
}

function startMissionFromReferralWelcome() {
  referralWelcomeOpen.value = false
  router.push('/missions/add')
}

function completeInstallInstructionOnboarding() {
  localStorage.setItem('onboarding_complete', 'true')
  localStorage.removeItem('onboarding_pending')
  onboardingStarted.value = false
}

function stopLoggedInSession() {
  stopNotificationPolling()
  push.reset()
  resetNotifications()
  resetStreak()
  referralWelcomeChecked = false
  referralWelcomeOpen.value = false
  referralWelcomeVariant.value = 'signup'
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

watch(
  () => [isLoggedIn.value, isAuthPage.value, lgAndUp.value],
  () => {
    handleAppEnter()
  },
  { immediate: true }
)

watch(referralWelcomeOpen, (open, wasOpen) => {
  if (wasOpen && !open) {
    maybeStartOnboarding()
  }
})

watch(installInstructionOpen, (open, wasOpen) => {
  if (wasOpen && !open && localStorage.getItem('onboarding_pending') === 'true') {
    onboardingStarted.value = false
  }
})

async function maybeStartOnboarding() {
  if (onboardingStarted.value || !isLoggedIn.value) return
  if (isAuthPage.value) return
  if (referralWelcomeOpen.value) return
  if (localStorage.getItem('onboarding_complete') === 'true') return
  if (localStorage.getItem('onboarding_pending') !== 'true') return

  onboardingStarted.value = true

  if (!lgAndUp.value) {
    installInstructionOpen.value = true
    return
  }

  await nextTick()
  setTimeout(() => {
    try {
      startTour()
    } catch {
      onboardingStarted.value = false
    }
  }, 500)
}
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

    <MobileFab :show="showMobileFab" />

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

    <MissionCompletionFlow />

    <ReferralWelcomeDialog
      v-model="referralWelcomeOpen"
      :variant="referralWelcomeVariant"
      @start-mission="startMissionFromReferralWelcome"
      @dismiss="dismissReferralWelcome"
    />

    <InstallAppInstructionModal
      v-model="installInstructionOpen"
      @completed="completeInstallInstructionOnboarding"
    />

    <v-dialog v-model="logoutConfirmOpen" max-width="420">
      <v-card class="logout-confirm-card rounded-xl">
        <v-card-title class="logout-confirm-title">
          {{ t('navigation.logoutConfirmTitle') }}
        </v-card-title>
        <v-card-text class="logout-confirm-text">
          {{ t('navigation.logoutConfirmMessage') }}
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="logoutConfirmOpen = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmLogout">
            {{ t('navigation.logoutConfirmAction') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

:deep(.logout-confirm-card) {
  background: #1a1f2e !important;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:deep(.logout-confirm-title) {
  color: #fff;
  font-weight: 700;
}

:deep(.logout-confirm-text) {
  color: rgba(255, 255, 255, 0.7);
}
</style>
