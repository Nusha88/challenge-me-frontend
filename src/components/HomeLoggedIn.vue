<template>
  <div v-if="state.initialDataLoading" class="home-loading-container">
    <IgniteLoader :loading-text="t('home.loggedIn.loading.initial', 'Channelling Power...')" />
  </div>
  <div v-else class="home-logged-in-container">
    <HomeGreeting
      :user-name="state.userName"
      :has-today-completed-tasks="state.hasTodayCompletedTasks"
      :motivational-message="dailyMotivationalMessage"
      :motivational-message-completed="dailyMotivationalMessageCompleted"
      :show-inspiration-button="todaysChallenges.length === 0"
      :display-streak-days="displayStreakDays"
      :yesterday-streak-days="state.yesterdayStreakDays"
      :streak-days-text="streakDaysText"
      @inspiration="showInspiration"
    />

    <v-tabs v-model="state.activeTab" class="home-tabs" bg-color="transparent">
      <v-tab value="today">{{ t('home.loggedIn.tabs.today') }}</v-tab>
      <v-tab value="tomorrow">{{ t('home.loggedIn.tabs.tomorrow') }}</v-tab>
    </v-tabs>

    <v-window v-model="state.activeTab">
      <v-window-item value="today">
        <TodayProgressCard
          :loading="isTodayProgressLoading"
          :completed-items="completedItems"
          :total-items="totalItems"
          :percentage="combinedProgressPercentage"
          @share="openCompletionShare"
        />

        <div class="todays-cards-wrapper">
          <TodayChallengesCard
            :challenges="todaysChallenges"
            variant="today"
            :is-completed="isTodayCompleted"
            :get-completed-days="getChallengeCompletedDays"
            :get-total-days="getChallengeTotalDays"
            @navigate="navigateToChallenge"
            @toggle-completion="toggleTodayCompletion"
          />

          <v-card
            class="todays-card todays-checklist-card checklist-card"
            :class="{ 'checklist-card-empty': checklistTotalSteps === 0 }"
          >
            <v-card-text>
              <div class="todays-checklist-section">
                <div class="d-flex align-center justify-space-between mb-2">
                  <h3 class="section-subtitle mb-0">{{ t('home.loggedIn.dailyChecklist.title') }}</h3>
                  <v-btn
                    v-if="unfinishedStepsCount > 0"
                    size="small"
                    variant="text"
                    class="copy-to-tomorrow-btn"
                    @click="copyUnfinishedStepsToTomorrow"
                  >
                    {{ t('home.loggedIn.dailyChecklist.copyToTomorrow') }} | {{ unfinishedStepsCount }}
                  </v-btn>
                </div>
                <DailyChecklist ref="checklistRef" />
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-window-item>

      <v-window-item value="tomorrow">
        <TodayProgressCard
          :visible="tomorrowTotalItems > 0"
          :completed-items="tomorrowCompletedItems"
          :total-items="tomorrowTotalItems"
          :percentage="tomorrowProgressPercentage"
          :show-progress-glow="false"
        />

        <div class="todays-cards-wrapper">
          <TodayChallengesCard
            :challenges="tomorrowsChallenges"
            variant="tomorrow"
          />

          <TomorrowStepsCard
            :tomorrow-steps="tomorrowSteps"
            :show-tomorrow-steps-input="showTomorrowStepsInput"
            v-model:tomorrow-step-text="tomorrowStepText"
            :editing-tomorrow-step-index="editingTomorrowStepIndex"
            v-model:editing-tomorrow-step-text="editingTomorrowStepText"
            @plan-new-step="planNewStep"
            @add-step="addTomorrowStep"
            @remove-step="removeTomorrowStep"
            @start-editing-step="startEditingTomorrowStep"
            @save-step-edit="saveTomorrowStepEdit"
            @cancel-step-edit="cancelTomorrowStepEdit"
          />
        </div>
      </v-window-item>
    </v-window>

    <CompletionCelebrationDialog
      v-model="showCompletionDialog"
      :generating-image="generatingImage"
      :user-name="state.userName"
      :tasks="completionShareTasks"
      :completed="completedItems"
      :total="totalItems"
      :percentage="combinedProgressPercentage"
      @close="closeCompletionDialog"
      @generate-image="generateCompletionImage"
    />

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="false"
      :show-leave-button="selectedIsParticipant"
      :join-loading="false"
      :leave-loading="selectedLeaveLoading"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update="handleDialogUpdate"
      @leave="handleDialogLeave"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import DailyChecklist from './DailyChecklist.vue'
import IgniteLoader from './IgniteLoader.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import HomeGreeting from './home/HomeGreeting.vue'
import TodayProgressCard from './home/TodayProgressCard.vue'
import TodayChallengesCard from './home/TodayChallengesCard.vue'
import TomorrowStepsCard from './home/TomorrowStepsCard.vue'
import CompletionCelebrationDialog from './home/CompletionCelebrationDialog.vue'
import { userService, challengeService } from '../services/api'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import motivationalMessagesEn from '../data/motivationalMessages.en.json'
import motivationalMessagesRu from '../data/motivationalMessages.ru.json'
import motivationalMessagesCompletedEn from '../data/motivationalMessagesCompleted.en.json'
import motivationalMessagesCompletedRu from '../data/motivationalMessagesCompleted.ru.json'
import { toDateInputValue } from '../utils/dateUtils'
import { buildCompletedDateSet, calculateStreakFromDate } from '../utils/streakUtils'
import { useHomeWindowEvents } from '../composables/useHomeWindowEvents'
import { useTodayChallenges } from '../composables/useTodayChallenges'
import { useTomorrowChecklist } from '../composables/useTomorrowChecklist'
import { useCompletionCelebration } from '../composables/useCompletionCelebration'
import { useHomeChallengeDialog } from '../composables/useHomeChallengeDialog'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const state = reactive({
  userName: '',
  streakDays: 0,
  yesterdayStreakDays: 0,
  hasTodayCompletedTasks: false,
  checklistLoading: true,
  initialDataLoading: true,
  activeTab: 'today'
})

const checklistRef = ref(null)
const hasLoadedTodayStepsOnce = ref(false)
const refreshHomeDataRef = { current: async () => {} }

const {
  loadingChallenges,
  hasLoadedOnce: hasLoadedTodayMissionsOnce,
  todaysChallenges,
  tomorrowsChallenges,
  loadTodaysChallenges,
  resetChallenges,
  updateChallengeInList,
  isTodayCompleted,
  toggleTodayCompletion,
  getChallengeCompletedDays,
  getChallengeTotalDays
} = useTodayChallenges({
  onUpdated: () => refreshHomeDataRef.current()
})

const {
  tomorrowSteps,
  showTomorrowStepsInput,
  tomorrowStepText,
  editingTomorrowStepIndex,
  editingTomorrowStepText,
  loadTomorrowSteps,
  planNewStep,
  addTomorrowStep,
  removeTomorrowStep,
  startEditingTomorrowStep,
  saveTomorrowStepEdit,
  cancelTomorrowStepEdit,
  copyUnfinishedStepsToTomorrow
} = useTomorrowChecklist({
  getTodaySteps: () => checklistRef.value?.todaySteps,
  onSwitchToTomorrowTab: () => {
    state.activeTab = 'tomorrow'
  }
})

const {
  detailsDialogOpen,
  selectedChallenge,
  selectedIsOwner,
  selectedIsParticipant,
  selectedLeaveLoading,
  navigateToChallenge,
  handleDialogUpdate,
  handleDialogLeave
} = useHomeChallengeDialog({
  getUserId: () => userStore.userId,
  updateChallengeInList,
  onRefresh: () => refreshHomeDataRef.current()
})

const isTodayProgressLoading = computed(
  () => !hasLoadedTodayMissionsOnce.value || !hasLoadedTodayStepsOnce.value
)

function getCurrentUserId() {
  return userStore.userId
}

async function updateUser() {
  // Fetch fresh user data from API and update store
  try {
    const response = await userService.getProfile()
    if (response.data?.user) {
      userStore.setUser(response.data.user)
      // Update userName for greeting
      state.userName = response.data.user.name || ''
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('auth-changed'))
    }
  } catch (error) {
    // Error fetching user profile
    state.userName = userStore.userName || ''
  }
}

function applyStreakFromData(checklists, allChallenges, userId) {
  const habitChallenges = allChallenges.filter(
    (challenge) => challenge.challengeType === CHALLENGE_TYPES.HABIT
  )
  const completedDates = buildCompletedDateSet(checklists, habitChallenges, userId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  state.hasTodayCompletedTasks = completedDates.has(toDateInputValue(today))
  state.streakDays = calculateStreakFromDate(today, completedDates)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  state.yesterdayStreakDays = calculateStreakFromDate(yesterday, completedDates)
}

function resetStreakState() {
  state.streakDays = 0
  state.yesterdayStreakDays = 0
  state.hasTodayCompletedTasks = false
}

async function fetchHomeData() {
  const userId = getCurrentUserId()
  const isLoggedIn = !!localStorage.getItem('token')
  
  if (!userId || !isLoggedIn) {
    resetStreakState()
    resetChallenges()
    state.initialDataLoading = false
    return
  }

  loadingChallenges.value = true
  try {
    const [checklistResponse, challengesResponse] = await Promise.all([
      userService.getChecklistHistory(),
      challengeService.getChallengesByUser(userId, { excludePrivate: false })
    ])

    const checklists = checklistResponse.data?.checklists || []
    const allChallenges = challengesResponse.data?.challenges || []

    applyStreakFromData(checklists, allChallenges, userId)
    loadTodaysChallenges(allChallenges, userId)
  } catch (error) {
    console.error('Error refreshing home data:', error)
    resetStreakState()
    resetChallenges()
  } finally {
    loadingChallenges.value = false
    state.initialDataLoading = false
    hasLoadedTodayMissionsOnce.value = true
  }
}

function showInspiration() {
  // Navigate to explore page to see all challenges
  router.push('/missions')
}

// Calculate combined progress (challenges + checklist)
const completedChallenges = computed(() => {
  return todaysChallenges.value.filter(challenge => isTodayCompleted(challenge)).length
})

const checklistCompletedSteps = computed(() => {
  return checklistRef.value?.completedSteps || 0
})

const checklistTotalSteps = computed(() => {
  return checklistRef.value?.totalSteps || 0
})

const completedItems = computed(() => {
  return completedChallenges.value + checklistCompletedSteps.value
})

const totalItems = computed(() => {
  return todaysChallenges.value.length + checklistTotalSteps.value
})

const combinedProgressPercentage = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.round((completedItems.value / totalItems.value) * 100)
})

// Tomorrow's progress (challenges + steps)
const tomorrowTotalItems = computed(() => {
  return tomorrowsChallenges.value.length + tomorrowSteps.value.length
})

const tomorrowCompletedItems = computed(() => {
  // Tomorrow's items can't be completed yet, so always 0
  return 0
})

const tomorrowProgressPercentage = computed(() => {
  if (tomorrowTotalItems.value === 0) return 0
  return Math.round((tomorrowCompletedItems.value / tomorrowTotalItems.value) * 100)
})

const isAllCompleted = computed(() => {
  if (totalItems.value === 0) return false
  return completedItems.value === totalItems.value
})

const completionShareTasks = computed(() => {
  const challengeTasks = todaysChallenges.value
    .filter((challenge) => isTodayCompleted(challenge))
    .map((challenge) => ({
      id: `challenge-${challenge._id}`,
      type: 'challenge',
      title: challenge.title,
      selected: true,
      payload: challenge
    }))

  const checklistTasks = (checklistRef.value?.todaySteps || [])
    .filter((step) => step.done)
    .map((step, index) => ({
      id: `checklist-${step._id || index}`,
      type: 'checklist',
      title: step.title,
      selected: true,
      payload: step
    }))

  return [...challengeTasks, ...checklistTasks]
})

const {
  showCompletionDialog,
  generatingImage,
  closeCompletionDialog,
  scheduleCompletionDialogCheck,
  generateCompletionImage
} = useCompletionCelebration({
  isAllCompleted,
  completedItems,
  totalItems,
  isInitialDataLoading: () => state.initialDataLoading,
  isChecklistLoading: () => state.checklistLoading,
  getChallengeCompletedDays,
  getChallengeTotalDays,
  getDefaultShareTasks: () => completionShareTasks.value,
  getCompletionImageData: () => ({
    userName: state.userName,
    streakDays: state.streakDays
  }),
  watchChecklistCompletedSteps: () => checklistRef.value?.completedSteps
})

function openCompletionShare() {
  showCompletionDialog.value = true
}

// Count unfinished steps (not missions)
const unfinishedStepsCount = computed(() => {
  if (!checklistRef.value || !checklistRef.value.todaySteps) return 0
  return checklistRef.value.todaySteps.filter(step => !step.done).length
})

// Display streak: show yesterday's streak in grey if today isn't completed, otherwise show today's streak
const displayStreakDays = computed(() => {
  if (state.hasTodayCompletedTasks) {
    return state.streakDays
  } else if (state.yesterdayStreakDays > 0) {
    return state.yesterdayStreakDays
  }
  return state.streakDays
})

// Get daily motivational message based on date (when no tasks completed)
const dailyMotivationalMessage = computed(() => {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
  const messages = locale.value === 'ru' ? motivationalMessagesRu : motivationalMessagesEn
  const messageIndex = dayOfYear % messages.length
  return messages[messageIndex]
})

// Get daily motivational message when first task is completed
const dailyMotivationalMessageCompleted = computed(() => {
  const today = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
  const messages = locale.value === 'ru' ? motivationalMessagesCompletedRu : motivationalMessagesCompletedEn
  const messageIndex = dayOfYear % messages.length
  return messages[messageIndex]
})

// Helper function for Russian pluralization of "день"
function getRussianDayWord(days) {
  if (locale.value !== 'ru') {
    return t('navigation.streakDays')
  }
  
  const num = Math.abs(days)
  const lastDigit = num % 10
  const lastTwoDigits = num % 100
  
  // Special cases: 11, 12, 13, 14 use "дней"
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней подряд'
  }
  
  // 1, 21, 31, etc. (ends in 1, but not 11) → "день"
  if (lastDigit === 1) {
    return 'день подряд'
  }
  
  // 2, 3, 4, 22, 23, 24, etc. (ends in 2, 3, 4, but not 12, 13, 14) → "дня"
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня подряд'
  }
  
  // Everything else (5-9, 0, 10, 15-20, 25-30, etc.) → "дней"
  return 'дней подряд'
}

const streakDaysText = computed(() => {
  const days = (!state.hasTodayCompletedTasks && state.yesterdayStreakDays > 0) 
    ? state.yesterdayStreakDays 
    : displayStreakDays.value
  return getRussianDayWord(days)
})

// Watch for checklist loading state
const updateChecklistLoading = () => {
  if (checklistRef.value) {
    state.checklistLoading = checklistRef.value.loading || false
    if (!state.checklistLoading) {
      hasLoadedTodayStepsOnce.value = true
    }
  }
}

async function refreshHomeData({
  reloadTomorrowSteps = false,
  waitForChecklist = false,
  maxWaitAttempts = 15,
  checkCompletionDialog = false,
  completionDialogDelayMs = 500
} = {}) {
  await fetchHomeData()

  if (reloadTomorrowSteps) {
    loadTomorrowSteps()
  }

  if (waitForChecklist) {
    let attempts = 0
    while ((state.checklistLoading || state.initialDataLoading) && attempts < maxWaitAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      updateChecklistLoading()
      attempts++
    }
    await nextTick()
  }

  if (checkCompletionDialog) {
    scheduleCompletionDialogCheck(completionDialogDelayMs)
  }
}

refreshHomeDataRef.current = refreshHomeData

async function handleChecklistUpdated() {
  await refreshHomeData()
  await nextTick()

  if (checklistRef.value && typeof checklistRef.value.loadTodaySteps === 'function') {
    await checklistRef.value.loadTodaySteps()
  }

  updateChecklistLoading()
  scheduleCompletionDialogCheck()
}

useHomeWindowEvents({
  onAuthChanged: updateUser,
  onChecklistUpdated: handleChecklistUpdated,
  onChallengeUpdated: refreshHomeData,
  onChallengeCompleted: () => refreshHomeData({ checkCompletionDialog: true }),
  onParticipantCompletedDaysUpdated: refreshHomeData
})

// Watch checklist ref to update loading state
watch(checklistRef, () => {
  nextTick(() => {
    updateChecklistLoading()
  })
}, { immediate: true })

// Watch for checklist updates
watch(() => checklistRef.value?.completedSteps, () => {
  updateChecklistLoading()
})

watch(() => checklistRef.value?.loading, (newVal) => {
  if (newVal !== undefined) {
    state.checklistLoading = newVal
    if (newVal === false) {
      hasLoadedTodayStepsOnce.value = true
    }
  }
})

onMounted(async () => {
  await updateUser()
  await nextTick()
  updateChecklistLoading()
  await refreshHomeData({
    waitForChecklist: true,
    maxWaitAttempts: 10,
    checkCompletionDialog: true
  })

  if (!hasLoadedTodayStepsOnce.value) {
    hasLoadedTodayStepsOnce.value = true
    state.checklistLoading = false
  }
})

onActivated(async () => {
  await refreshHomeData({
    reloadTomorrowSteps: true,
    waitForChecklist: true,
    checkCompletionDialog: true,
    completionDialogDelayMs: 1000
  })
})

watch(() => route.path, async (newPath) => {
  if (newPath === '/' || newPath === '/today') {
    await refreshHomeData({
      reloadTomorrowSteps: true,
      waitForChecklist: true,
      checkCompletionDialog: true,
      completionDialogDelayMs: 1000
    })
  }
})

// Watch activeTab to load tomorrow's steps when switching to tomorrow tab
watch(() => state.activeTab, (newTab) => {
  if (newTab === 'tomorrow') {
    loadTomorrowSteps()
  }
})

</script>

<style scoped>
.home-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  width: 100%;
}

.home-logged-in-container {
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 1.5em 1em;
  gap: 2em;
  box-sizing: border-box;
  overflow: visible !important;
}

@media (min-width: 400px) {
  .home-logged-in-container { padding: 2em 1em; }
}

@media (min-width: 600px) {
  .home-logged-in-container { padding: 2.5em 1.5em; gap: 2.5em; }
}

@media (min-width: 960px) {
  .home-logged-in-container { padding: 3em 24px; gap: 3em; }
}

.todays-cards-wrapper {
  width: 100%;
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: row;
  gap: 1em;
  flex-wrap: nowrap;
  box-sizing: border-box;
  overflow: visible !important;
}

.todays-cards-wrapper :deep(*) {
  overflow: visible !important;
}

@media (max-width: 959px) {
  .todays-cards-wrapper {
    flex-direction: column;
  }
}

.todays-checklist-card {
  width: 35%;
  flex: 0 0 35%;
  max-width: 35%;
  box-sizing: border-box;
  overflow: visible !important;
  min-width: 0;
}

@media (max-width: 959px) {
  .todays-checklist-card {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.checklist-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
  width: 100% !important;
}

.checklist-card-empty {
  background: rgba(112, 72, 232, 0.02) !important;
  border: 2px dashed rgba(112, 72, 232, 0.2) !important;
  border-radius: 24px !important;
  box-shadow: none !important;
}

.checklist-card-empty:hover {
  border-color: rgba(112, 72, 232, 0.4) !important;
  background: rgba(112, 72, 232, 0.01) !important;
}

.section-subtitle {
  color: #4FD1C5 !important;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(79, 209, 197, 0.4);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  margin-bottom: 16px;
  padding-left: 4px;
}

.copy-to-tomorrow-btn {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  color: #4FD1C5 !important;
  text-transform: none !important;
  padding: 4px 12px !important;
  min-width: auto !important;
}

.copy-to-tomorrow-btn:hover {
  background: rgba(112, 72, 232, 0.08) !important;
}

.todays-checklist-section {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.todays-checklist-section :deep(*) {
  max-width: 100%;
  box-sizing: border-box;
}

.home-tabs {
  width: 100%;
  align-self: flex-start;
}

.home-tabs :deep(.v-tabs) {
  justify-content: flex-start;
}

.home-tabs :deep(.v-tab) {
  text-align: left;
  color: #7048E8 !important;
  border-radius: 12px !important;
}

.home-logged-in-container :deep(.v-window),
.home-logged-in-container :deep(.v-window-item),
.home-logged-in-container :deep(.v-window-item__wrapper),
.home-logged-in-container :deep(.v-card),
.home-logged-in-container :deep(.v-card-text) {
  width: 100%;
  max-width: 100%;
  overflow: visible !important;
  box-sizing: border-box;
}

.home-logged-in-container :deep(.v-card-text) {
  padding: 16px !important;
}

.home-logged-in-container :deep(.v-card-text),
.home-logged-in-container :deep(.step-text) {
  color: rgba(255, 255, 255, 0.9) !important;
}
</style>
