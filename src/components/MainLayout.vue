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
import { useChallengeDetailsProvider } from '../composables/useChallengeDetailsProvider'
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
  joinLoading: globalJoinLoading,
  leaveLoading: globalLeaveLoading,
  selectedIsOwner: globalSelectedIsOwner,
  selectedIsParticipant: globalSelectedIsParticipant,
  showDialogJoinButton: globalShowDialogJoinButton,
  showDialogLeaveButton: globalShowDialogLeaveButton,
  openFromEvent,
  handleDialogClose: handleGlobalDialogClose,
  handleDialogLeave: handleGlobalDialogLeave,
  handleDialogJoin: handleGlobalDialogJoin,
  handleDialogUpdate: handleGlobalDialogUpdate
} = useChallengeDetailsProvider()

function handleOpenChallenge(event) {
  const detail = event?.detail
  if (!detail?.challengeId && !detail?.challenge) return
  openFromEvent(detail)
}

function handleServiceWorkerMessage(event) {
  const data = event?.data
  if (!data || data.type !== 'OPEN_CHALLENGE') return
  if (!data.challengeId) return
  openFromEvent({
    challengeId: data.challengeId,
    commentId: data.commentId || null,
    replyId: data.replyId || null,
    initialTab: data.initialTab || null
  })
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

function handleInstallInstructionUpdate(open) {
  installInstructionOpen.value = open
  if (!open && localStorage.getItem('onboarding_pending') === 'true') {
    completeInstallInstructionOnboarding()
  }
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
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
  }
})

onBeforeUnmount(() => {
  stopNotificationPolling()
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
  }
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
  <v-app :class="{ 'app-chrome': showAppChrome }">
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

    <AppSidebar
      v-if="showAppChrome"
      :drawer-open="drawerOpen"
      :display-streak-days="displayStreakDays"
      :yesterday-streak-days="yesterdayStreakDays"
      :has-today-completed-tasks="hasTodayCompletedTasks"
      :streak-days-text="streakDaysText"
      :show-streak="showStreak"
      @update:drawer-open="drawerOpen = $event"
      @profile="router.push('/profile')"
      @logout="logout"
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
      :join-loading="globalJoinLoading"
      :leave-loading="globalLeaveLoading"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update:model-value="handleGlobalDialogClose"
      @join="handleGlobalDialogJoin"
      @leave="handleGlobalDialogLeave"
      @update="handleGlobalDialogUpdate"
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
      :model-value="installInstructionOpen"
      @update:model-value="handleInstallInstructionUpdate"
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
  display: block;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
}

.main-content-inner.full-column,
.main-content-inner.content-column {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.main-content.with-sidebar .main-content-wrapper {
  padding: 16px 20px 24px;
}

@media (min-width: 960px) {
  .main-content.with-sidebar .main-content-wrapper {
    padding: 20px 24px 28px;
  }
}

@media (max-width: 959px) {
  .main-content {
    border-radius: 0;
  }

  .main-content-wrapper,
  .main-content.with-sidebar .main-content-wrapper {
    padding: 8px 10px 16px;
  }
}

.v-application {
  background-color: transparent !important;
}

/*
 * Do not set padding/margin on v-main itself — Vuetify writes layout offsets
 * (header + permanent drawer) there. Content inset lives on the wrapper above.
 */
.main-content {
  min-height: auto;
  width: 100%;
  background-color: transparent;
  border-radius: 0;
}

.main-content.public-view {
  /* Guest pages (landing) must not grow wider than the viewport when a section
     uses an internal horizontal scroller. */
  overflow-x: clip;
  max-width: 100%;
  box-sizing: border-box;
}

.main-content.public-view .main-content-wrapper {
  gap: 0;
  min-width: 0;
  max-width: 100%;
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
