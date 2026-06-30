import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { challengeService } from '../services/api'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { fireEpicConfetti } from '../utils/confetti'
import { normalizeDateKey, toDateInputValue } from '../utils/dateUtils'
import {
  getSuggestedSoloEndDate,
  getRemainingSoloDays
} from '../utils/missionParticipation'
import { findParticipantForUser } from '../utils/participantDays'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { getLevelFromXp, getLevelInfo } from '../utils/levelSystem'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'

const missionAccomplishedOpen = ref(false)
const shareCardOpen = ref(false)
const soloContinuationOpen = ref(false)
const soloContinuationLoading = ref(false)
const habitMissionCompleteLoading = ref(false)
const activeChallenge = ref(null)

const missionAccomplishedData = reactive({
  questTitle: '',
  xpGained: 0,
  sparksGained: 0,
  tier: '',
  completionRate: null,
  personalDone: null,
  personalTotal: null,
  badge: '',
  needsSoloContinuation: false
})

const shareCardData = reactive({
  questTitle: '',
  stepName: '',
  userText: '',
  userImage: '',
  userImageDataUrl: '',
  userLevel: 1,
  userRankTitle: '',
  isFinal: true,
  xpEarned: 0,
  sparksEarned: 0,
  completedSteps: 0,
  totalSteps: 0,
  missionDates: '',
  missionType: 'quest',
  completedDays: 0,
  totalDays: 0,
  completionTier: ''
})

watch(missionAccomplishedOpen, (open, wasOpen) => {
  if (wasOpen && !open && missionAccomplishedData.needsSoloContinuation) {
    soloContinuationOpen.value = true
    missionAccomplishedData.needsSoloContinuation = false
  }
})

function countResultActionNodes(actions) {
  let count = 0

  function walk(items) {
    for (const action of items || []) {
      count += 1
      if (Array.isArray(action.children) && action.children.length) {
        walk(action.children)
      }
    }
  }

  walk(actions)
  return count
}

function formatDisplayDate(value, locale) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch {
    return value
  }
}

function formatMissionDateRange(challenge, locale) {
  const start = formatDisplayDate(challenge?.startDate, locale)
  const end = formatDisplayDate(challenge?.endDate, locale)
  if (start && end) return `${start} — ${end}`
  return start || end || ''
}

function populateMissionSummary(challenge, summary) {
  missionAccomplishedData.questTitle = challenge?.title || ''
  missionAccomplishedData.xpGained = Number(summary?.totalXp) || 0
  missionAccomplishedData.sparksGained = Number(summary?.totalSparks) || 0
  missionAccomplishedData.tier = summary?.tier || ''
  missionAccomplishedData.completionRate = summary?.completionRate ?? null
  missionAccomplishedData.personalDone = summary?.personalDone ?? null
  missionAccomplishedData.personalTotal = summary?.personalTotal ?? null
  missionAccomplishedData.badge = summary?.badge || ''
  missionAccomplishedData.needsSoloContinuation = Boolean(summary?.needsSoloContinuation)
}

function notifyMissionUpdated() {
  window.dispatchEvent(new Event('participant-completed-days-updated'))
  window.dispatchEvent(new Event('challenge-updated'))
  dispatchAppEvent(APP_EVENTS.CHECKLIST_UPDATED)
}

export function useMissionCompletionFlow() {
  const { locale } = useI18n()
  const userStore = useUserStore()
  const { applyXpAwardResponse } = useXpAwardFeedback()

  const currentUserId = computed(() => userStore.userId)

  const currentParticipant = computed(() => {
    if (!activeChallenge.value || !currentUserId.value) return null
    return findParticipantForUser(activeChallenge.value, currentUserId.value)
  })

  const soloSuggestedEndDate = computed(() => {
    if (!activeChallenge.value || !currentParticipant.value) return ''
    return getSuggestedSoloEndDate(activeChallenge.value, currentParticipant.value)
  })

  const soloRemainingDays = computed(() => {
    if (!activeChallenge.value || !currentParticipant.value) return 0
    return getRemainingSoloDays(activeChallenge.value, currentParticipant.value)
  })

  const soloMinCustomDate = computed(() => toDateInputValue(new Date()))

  const userLevel = computed(() => getLevelFromXp(Number(userStore.user?.xp || 0)))

  const userRankTitle = computed(() => getLevelInfo(userLevel.value).title)

  async function completeHabitMission(challenge, completedDays, { onUpdate, closeDialog } = {}) {
    if (!challenge?._id || habitMissionCompleteLoading.value) return false

    const normalizedDays = [...completedDays]
      .map(normalizeDateKey)
      .filter(Boolean)
      .sort()

    habitMissionCompleteLoading.value = true

    try {
      const response = await challengeService.endHabitMission(challenge._id, normalizedDays)
      applyXpAwardResponse(response)

      activeChallenge.value = challenge
      populateMissionSummary(challenge, response.data?.missionRewardsSummary || {})

      if (onUpdate) await onUpdate()
      notifyMissionUpdated()

      if (closeDialog) closeDialog()

      fireEpicConfetti()
      await nextTick()
      missionAccomplishedOpen.value = true
      return true
    } finally {
      habitMissionCompleteLoading.value = false
    }
  }

  async function completeQuestMission(challenge, { onUpdate, closeDialog } = {}) {
    if (!challenge?._id || habitMissionCompleteLoading.value) return false

    habitMissionCompleteLoading.value = true

    try {
      const response = await challengeService.endResultMission(challenge._id)
      applyXpAwardResponse(response)

      activeChallenge.value = challenge
      populateMissionSummary(challenge, response.data?.missionRewardsSummary || {})
      missionAccomplishedData.needsSoloContinuation = false

      if (onUpdate) await onUpdate()
      notifyMissionUpdated()

      if (closeDialog) closeDialog()

      fireEpicConfetti()
      await nextTick()
      missionAccomplishedOpen.value = true
      return true
    } finally {
      habitMissionCompleteLoading.value = false
    }
  }

  async function openFinalShareCard(payload = {}) {
    const challenge = activeChallenge.value
    if (!challenge) return

    const reflection = (payload.userReflection || '').trim()
    const isHabitMission = challenge.challengeType === CHALLENGE_TYPES.HABIT
    const actions = challenge.actions || []
    const totalSteps = countResultActionNodes(actions)

    if (reflection && challenge._id && currentUserId.value) {
      try {
        await challengeService.addDiaryEntry(
          challenge._id,
          currentUserId.value,
          reflection,
          null,
          true,
          { isTriumph: true, actionTitle: challenge.title || '' }
        )
        dispatchAppEvent(APP_EVENTS.CHECKLIST_UPDATED)
      } catch (error) {
        console.error('Failed to save triumph reflection:', error)
      }
    }

    shareCardData.questTitle = challenge.title || ''
    shareCardData.stepName = ''
    shareCardData.userText = reflection
    shareCardData.userImage = ''
    shareCardData.userImageDataUrl = ''
    shareCardData.userLevel = userLevel.value
    shareCardData.userRankTitle = userRankTitle.value
    shareCardData.isFinal = true
    shareCardData.xpEarned = missionAccomplishedData.xpGained
    shareCardData.sparksEarned = missionAccomplishedData.sparksGained
    shareCardData.completedSteps = isHabitMission
      ? (missionAccomplishedData.personalDone ?? 0)
      : totalSteps
    shareCardData.totalSteps = isHabitMission
      ? (missionAccomplishedData.personalTotal ?? totalSteps)
      : totalSteps
    shareCardData.missionDates = formatMissionDateRange(challenge, locale.value)
    shareCardData.missionType = isHabitMission ? 'ritual' : 'quest'
    shareCardData.completedDays = isHabitMission
      ? (missionAccomplishedData.personalDone ?? 0)
      : 0
    shareCardData.totalDays = isHabitMission
      ? (missionAccomplishedData.personalTotal ?? 0)
      : 0
    shareCardData.completionTier = isHabitMission
      ? (missionAccomplishedData.tier || '')
      : ''

    missionAccomplishedOpen.value = false
    await nextTick()
    shareCardOpen.value = true
  }

  async function handleSoloContinuation({ customEndDate }) {
    if (!activeChallenge.value?._id) return

    soloContinuationLoading.value = true

    try {
      const response = await challengeService.continueSoloMission(activeChallenge.value._id, {
        customEndDate: customEndDate || undefined
      })
      const newChallenge = response.data?.challenge
      soloContinuationOpen.value = false
      notifyMissionUpdated()

      if (newChallenge?._id) {
        dispatchAppEvent(APP_EVENTS.OPEN_CHALLENGE, { challengeId: newChallenge._id })
      }
    } finally {
      soloContinuationLoading.value = false
    }
  }

  return {
    missionAccomplishedOpen,
    shareCardOpen,
    soloContinuationOpen,
    soloContinuationLoading,
    habitMissionCompleteLoading,
    missionAccomplishedData,
    shareCardData,
    soloSuggestedEndDate,
    soloRemainingDays,
    soloMinCustomDate,
    completeHabitMission,
    completeQuestMission,
    openFinalShareCard,
    handleSoloContinuation
  }
}
