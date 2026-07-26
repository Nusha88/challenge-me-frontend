<template>
  <div v-if="state.initialDataLoading" class="home-loading-container">
    <IgniteLoader :loading-text="t('home.loggedIn.loading.initial', 'Channelling Power...')" />
  </div>

  <div v-else class="home-logged-in-container">
    <section class="home-hud">
      <HomeGreeting
        :user-name="state.userName"
        :has-today-completed-tasks="state.hasTodayCompletedTasks"
        :motivational-message="dailyMotivationalMessage"
        :motivational-message-completed="dailyMotivationalMessageCompleted"
        :display-streak-days="displayStreakDays"
        :yesterday-streak-days="state.yesterdayStreakDays"
        :streak-days-text="streakDaysText"
      />

      <TodayProgressCard
        v-if="state.activeTab === 'today'"
        :loading="isTodayProgressLoading"
        :visible="totalItems > 0"
        :completed-items="completedItems"
        :total-items="totalItems"
        :percentage="combinedProgressPercentage"
        :can-share="isAllCompleted"
        @share="openCompletionShare"
      />
    </section>

    <HomeDayTabs
      v-model="state.activeTab"
      :freeze-config="freezeButtonConfig"
      :freeze-cost="FREEZE_COST"
      :has-enough-sparks="hasEnoughSparksForFreeze"
      :freeze-loading="freezeLoading"
      @freeze="handleFreezeDay"
    />

    <v-alert
      v-if="ritualError"
      type="error"
      variant="tonal"
      density="compact"
      class="ritual-error-alert"
      closable
      @click:close="clearRitualError"
    >
      {{ ritualError }}
    </v-alert>

    <v-window v-model="state.activeTab">
      <v-window-item value="today">
        <div class="todays-cards-wrapper">
          <TodayChallengesCard
            :challenges="todaysChallenges"
            variant="today"
            :get-day-status="getTodayDayStatus"
            :get-completed-days="getChallengeCompletedDays"
            :get-total-days="getChallengeTotalDays"
            :can-use-second-chance="hasEnoughSparksForSecondChance"
            :show-second-chance="showSecondChanceForChallenge"
            :second-chance-loading-id="secondChanceLoadingId"
            :second-chance-cost="SECOND_CHANCE_COST"
            @navigate="navigateToChallenge"
            @toggle-completion="toggleTodayCompletion"
            @second-chance="handleSecondChance"
          />

          <TodayChecklistPanel
            ref="checklistPanelRef"
            :unfinished-steps-count="unfinishedStepsCount"
            :is-empty="checklistTotalSteps === 0"
            @copy-to-tomorrow="copyUnfinishedStepsToTomorrow"
          />
        </div>
      </v-window-item>

      <v-window-item value="tomorrow">
        <TomorrowLoadoutCard
          :mission-count="tomorrowsChallenges.length"
          :step-count="tomorrowSteps.length"
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
      :preparing-share="preparingShare"
      :sharing="generatingImage"
      :saving="savingImage"
      :share-error="shareError"
      :status-message="statusMessage"
      :sparks-claimed="sparksClaimed"
      :preview-data-url="previewDataUrl"
      :user-name="state.userName"
      :streak-days="displayStreakDays"
      :tasks="selectedShareTasks"
      @close="closeCompletionDialog"
      @share="shareVictory"
      @save="saveImage"
      @update:selected-tasks="setSelectedTasks"
    />

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="false"
      :show-leave-button="selectedIsParticipant"
      :join-loading="selectedJoinLoading"
      :leave-loading="selectedLeaveLoading"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update="handleDialogUpdate"
      @join="handleDialogJoin"
      @leave="handleDialogLeave"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onActivated, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import IgniteLoader from './IgniteLoader.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import HomeGreeting from './home/HomeGreeting.vue'
import HomeDayTabs from './home/HomeDayTabs.vue'
import TodayProgressCard from './home/TodayProgressCard.vue'
import TodayChallengesCard from './home/TodayChallengesCard.vue'
import TodayChecklistPanel from './home/TodayChecklistPanel.vue'
import TomorrowStepsCard from './home/TomorrowStepsCard.vue'
import TomorrowLoadoutCard from './home/TomorrowLoadoutCard.vue'
import CompletionCelebrationDialog from './home/CompletionCelebrationDialog.vue'
import { userService, challengeService } from '../services/api'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { toDateInputValue } from '../utils/dateUtils'
import { buildCompletedDateSet, calculateStreakFromDate } from '../utils/streakUtils'
import { useHomeWindowEvents } from '../composables/useHomeWindowEvents'
import { useTodayChallenges } from '../composables/useTodayChallenges'
import { useTomorrowChecklist } from '../composables/useTomorrowChecklist'
import { useCompletionCelebration } from '../composables/useCompletionCelebration'
import { useHomeChallengeDialog } from '../composables/useHomeChallengeDialog'
import { useHomeMotivationalMessage } from '../composables/useHomeMotivationalMessage'
import {
  useSparksRitualActions,
  FREEZE_COST,
  SECOND_CHANCE_COST
} from '../composables/useSparksRitualActions'
import { useRitualTimeWindows } from '../composables/useRitualTimeWindows'

const { t, locale } = useI18n()
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

const checklistPanelRef = ref(null)
const hasLoadedTodayStepsOnce = ref(false)
const completedDates = ref(new Set())
const refreshHomeDataRef = { current: async () => {} }

const { dailyMotivationalMessage, dailyMotivationalMessageCompleted } = useHomeMotivationalMessage()

const {
  ritualTimePhase,
  isSecondChanceWindow,
  isYesterdayStreakBroken
} = useRitualTimeWindows()

const {
  loadingChallenges,
  hasLoadedOnce: hasLoadedTodayMissionsOnce,
  todaysChallenges,
  tomorrowsChallenges,
  loadTodaysChallenges,
  resetChallenges,
  updateChallengeInList,
  getTodayDayStatus,
  incompleteTodayRitualsCount,
  incompleteYesterdayRitualsCount,
  isTodayFullyComplete,
  shouldShowSecondChance,
  toggleTodayCompletion,
  getChallengeCompletedDays,
  getChallengeTotalDays
} = useTodayChallenges({
  onUpdated: () => refreshHomeDataRef.current()
})

const {
  freezeLoading,
  secondChanceLoadingId,
  ritualError,
  hasEnoughSparksForFreeze,
  hasEnoughSparksForSecondChance,
  useSecondChance,
  freezeDay
} = useSparksRitualActions({
  onUpdated: () => refreshHomeDataRef.current(),
  updateChallengeInList
})

const freezeButtonConfig = computed(() => {
  const phase = ritualTimePhase.value

  if (phase === 'freeze_today') {
    if (isTodayFullyComplete.value) return null
    if (incompleteTodayRitualsCount.value < 2) return null

    return {
      target: 'today',
      labelKey: 'sparks.rituals.freezeTodayButton',
      icon: 'mdi-diamond-stone'
    }
  }

  if (phase === 'save_yesterday') {
    if (!isYesterdayStreakBroken(completedDates.value)) return null
    if (incompleteYesterdayRitualsCount.value < 1) return null

    return {
      target: 'yesterday',
      labelKey: 'sparks.rituals.saveYesterdayStreakButton',
      icon: 'mdi-calendar-clock'
    }
  }

  return null
})

function showSecondChanceForChallenge(challenge) {
  return shouldShowSecondChance(challenge, {
    isSecondChanceWindow: isSecondChanceWindow.value
  })
}

async function handleFreezeDay() {
  if (!freezeButtonConfig.value || !hasEnoughSparksForFreeze.value || freezeLoading.value) return
  try {
    await freezeDay({ target: freezeButtonConfig.value.target })
  } catch {
    // ritualError is surfaced via the alert bound to the composable ref
  }
}

async function handleSecondChance(challenge) {
  if (!hasEnoughSparksForSecondChance.value) return
  try {
    await useSecondChance(challenge)
  } catch {
    // ritualError is surfaced via the alert bound to the composable ref
  }
}

function clearRitualError() {
  ritualError.value = ''
}

function getChecklistApi() {
  return checklistPanelRef.value
}

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
  getTodaySteps: () => getChecklistApi()?.todaySteps,
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
  selectedJoinLoading,
  navigateToChallenge,
  handleDialogUpdate,
  handleDialogJoin,
  handleDialogLeave
} = useHomeChallengeDialog({
  getUserId: () => userStore.userId,
  updateChallengeInList,
  onRefresh: () => refreshHomeDataRef.current()
})

const isTodayProgressLoading = computed(
  () => !hasLoadedTodayMissionsOnce.value || !hasLoadedTodayStepsOnce.value
)

let profileFetchInFlight = null

async function updateUser() {
  if (profileFetchInFlight) return profileFetchInFlight

  profileFetchInFlight = (async () => {
    try {
      const response = await userService.getProfile()
      if (response.data?.user) {
        userStore.setUser(response.data.user)
        state.userName = response.data.user.name || ''
      }
    } catch {
      state.userName = userStore.userName || ''
    } finally {
      profileFetchInFlight = null
    }
  })()

  return profileFetchInFlight
}

function applyStreakFromData(checklists, allChallenges, userId) {
  const habitChallenges = allChallenges.filter(
    (challenge) => challenge.challengeType === CHALLENGE_TYPES.HABIT
  )
  const completedDatesSet = buildCompletedDateSet(checklists, habitChallenges, userId)
  completedDates.value = completedDatesSet

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  state.hasTodayCompletedTasks = completedDatesSet.has(toDateInputValue(today))
  state.streakDays = calculateStreakFromDate(today, completedDatesSet)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  state.yesterdayStreakDays = calculateStreakFromDate(yesterday, completedDatesSet)
}

function resetStreakState() {
  completedDates.value = new Set()
  state.streakDays = 0
  state.yesterdayStreakDays = 0
  state.hasTodayCompletedTasks = false
}

async function fetchHomeData() {
  const userId = userStore.userId
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

function resolveExposedArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.value)) return value.value
  return []
}

function resolveExposedNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value?.value === 'number' && Number.isFinite(value.value)) return value.value
  return fallback
}

const completedChallenges = computed(() => {
  return todaysChallenges.value.filter((challenge) => {
    const status = getTodayDayStatus(challenge)
    return status === 'completed' || status === 'protected'
  }).length
})

const checklistCompletedSteps = computed(() => {
  return resolveExposedNumber(getChecklistApi()?.completedSteps, 0)
})

const checklistTotalSteps = computed(() => {
  return resolveExposedNumber(getChecklistApi()?.totalSteps, 0)
})

const completedItems = computed(() => completedChallenges.value + checklistCompletedSteps.value)

const totalItems = computed(() => todaysChallenges.value.length + checklistTotalSteps.value)

const combinedProgressPercentage = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.round((completedItems.value / totalItems.value) * 100)
})

const isAllCompleted = computed(() => {
  if (totalItems.value === 0) return false
  return completedItems.value === totalItems.value
})

const completionShareTasks = computed(() => {
  const challengeTasks = todaysChallenges.value
    .filter((challenge) => {
      const status = getTodayDayStatus(challenge)
      return status === 'completed' || status === 'protected'
    })
    .map((challenge) => ({
      id: `challenge-${challenge._id}`,
      type: 'challenge',
      title: challenge.title,
      selected: true,
      payload: challenge
    }))

  const checklistTasks = resolveExposedArray(getChecklistApi()?.todaySteps)
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
  preparingShare,
  savingImage,
  shareError,
  statusMessage,
  previewDataUrl,
  selectedShareTasks,
  sparksClaimed,
  setSelectedTasks,
  closeCompletionDialog,
  openCompletionShare,
  scheduleCompletionDialogCheck,
  shareVictory,
  saveImage
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
  watchChecklistCompletedSteps: () => getChecklistApi()?.completedSteps
})

const unfinishedStepsCount = computed(() => {
  const steps = resolveExposedArray(getChecklistApi()?.todaySteps)
  return steps.filter((step) => !step.done).length
})

const displayStreakDays = computed(() => {
  if (state.hasTodayCompletedTasks) return state.streakDays
  if (state.yesterdayStreakDays > 0) return state.yesterdayStreakDays
  return state.streakDays
})

function getRussianDayWord(days) {
  if (locale.value !== 'ru') return t('navigation.streakDays')

  const num = Math.abs(days)
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'дней подряд'
  if (lastDigit === 1) return 'день подряд'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня подряд'
  return 'дней подряд'
}

const streakDaysText = computed(() => {
  const days =
    !state.hasTodayCompletedTasks && state.yesterdayStreakDays > 0
      ? state.yesterdayStreakDays
      : displayStreakDays.value
  return getRussianDayWord(days)
})

const updateChecklistLoading = () => {
  const api = getChecklistApi()
  if (!api) return
  state.checklistLoading = !!api.loading
  if (!state.checklistLoading) {
    hasLoadedTodayStepsOnce.value = true
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

  if (reloadTomorrowSteps) loadTomorrowSteps()

  if (waitForChecklist) {
    let attempts = 0
    while ((state.checklistLoading || state.initialDataLoading) && attempts < maxWaitAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      updateChecklistLoading()
      attempts += 1
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

  const api = getChecklistApi()
  if (api && typeof api.loadTodaySteps === 'function') {
    await api.loadTodaySteps()
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

watch(checklistPanelRef, () => {
  nextTick(() => updateChecklistLoading())
}, { immediate: true })

watch(
  () => getChecklistApi()?.completedSteps,
  () => updateChecklistLoading()
)

watch(
  () => getChecklistApi()?.loading,
  (newVal) => {
    if (newVal !== undefined) {
      state.checklistLoading = newVal
      if (newVal === false) hasLoadedTodayStepsOnce.value = true
    }
  }
)

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

watch(
  () => route.path,
  async (newPath) => {
    if (newPath === '/' || newPath === '/today') {
      await refreshHomeData({
        reloadTomorrowSteps: true,
        waitForChecklist: true,
        checkCompletionDialog: true,
        completionDialogDelayMs: 1000
      })
    }
  }
)

watch(
  () => state.activeTab,
  (newTab) => {
    if (newTab === 'tomorrow') loadTomorrowSteps()
  }
)
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
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.25rem;
  padding: 1.25rem 1rem 2rem;
  box-sizing: border-box;
  overflow-x: clip;
}

@media (min-width: 600px) {
  .home-logged-in-container {
    padding: 1.75rem 1.5rem 2.5rem;
    gap: 1.5rem;
  }
}

@media (min-width: 960px) {
  .home-logged-in-container {
    padding: 2rem 24px 3rem;
    gap: 1.75rem;
  }
}

.home-hud {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ritual-error-alert {
  width: 100%;
  border-radius: 14px !important;
}

/*
 * Grid instead of 60%/40% flex: fixed percentages ignore the gap and push the
 * Daily Steps card past the right edge of the content column.
 */
.todays-cards-wrapper {
  width: 100%;
  max-width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 1rem;
  box-sizing: border-box;
}

@media (max-width: 959px) {
  .todays-cards-wrapper {
    grid-template-columns: 1fr;
  }
}

.home-logged-in-container :deep(.v-window),
.home-logged-in-container :deep(.v-window__container),
.home-logged-in-container :deep(.v-window-item),
.home-logged-in-container :deep(.v-card-text) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.home-logged-in-container :deep(.v-card-text) {
  padding: 16px !important;
  color: rgba(255, 255, 255, 0.92) !important;
}
</style>
