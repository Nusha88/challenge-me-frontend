import { computed, onMounted, ref } from 'vue'
import { challengeService } from '../services/api'
import {
  clearMyMissionsListCache,
  loadMyMissionsList,
  patchMyMissionsListCache
} from './useMyMissionsListCache'
import { useWeeklyRitualStore } from '../stores/weeklyRitual'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { useDemoMode } from './useDemoMode'
import { useDemoMissions } from './useDemoMissions'
import { useTemplateParticipants } from './useTemplateParticipants'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { useMissionCompletionFlow } from './useMissionCompletionFlow'
import { useAppEventListeners } from './useAppEvents'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { getDemoMissions } from '../services/demoStorage'
import { findActiveTemplateChallenge } from '../utils/templateMembership'
import { getChallengeTotalDays } from '../utils/challengeProgress'
import {
  findParticipantForUser,
  isDayEffectiveCompleted
} from '../utils/participantDays'
import {
  getCurrentScheduledDayNumber,
  isDateScheduledForChallenge
} from '../utils/ritualSchedule'
import { shouldTriggerHabitMissionCompletion } from '../utils/missionParticipation'
import { toDateInputValue } from '../utils/dateUtils'
import { getMissionTemplateById } from '../constants/missionTemplates'

const VISIBLE_COMPANION_AVATARS = 4

export function useWeeklyRitualStatus() {
  const weeklyRitualStore = useWeeklyRitualStore()
  const userStore = useUserStore()
  const demoStore = useDemoStore()
  const { getEffectiveUserId } = useDemoMode()
  const { completeToday: completeDemoToday } = useDemoMissions()
  const { applyXpAwardResponse } = useXpAwardFeedback()
  const { completeHabitMission } = useMissionCompletionFlow()
  const { getParticipants } = useTemplateParticipants()

  const joinedChallenge = ref(null)
  const checkingIn = ref(false)

  const templateId = computed(() => weeklyRitualStore.currentWeeklyRitualId)
  const currentUserId = computed(() => getEffectiveUserId())

  const isJoined = computed(() => Boolean(joinedChallenge.value))

  const totalDays = computed(() => {
    const fromChallenge = getChallengeTotalDays(joinedChallenge.value)
    if (fromChallenge > 0) return fromChallenge
    return Number(getMissionTemplateById(templateId.value)?.durationDays || 0)
  })

  const currentDay = computed(() => {
    const day = getCurrentScheduledDayNumber(joinedChallenge.value)
    if (day > 0) return day
    return isJoined.value ? 1 : 0
  })

  const todayStr = computed(() => toDateInputValue())

  const canCheckIn = computed(() => {
    const challenge = joinedChallenge.value
    const userId = currentUserId.value
    if (!challenge || !userId) return false
    if (!isDateScheduledForChallenge(challenge, todayStr.value)) return false

    const participant = findParticipantForUser(challenge, userId)
    if (!participant) return false
    return !isDayEffectiveCompleted(participant, todayStr.value)
  })

  const companions = computed(() => {
    const userId = currentUserId.value
    return getParticipants(templateId.value).filter((participant) => {
      return String(participant.id) !== String(userId)
    })
  })

  const companionsCount = computed(() => companions.value.length)

  const visibleCompanions = computed(() => {
    return companions.value.slice(0, VISIBLE_COMPANION_AVATARS)
  })

  const hiddenCompanionsCount = computed(() => {
    return Math.max(companionsCount.value - visibleCompanions.value.length, 0)
  })

  async function loadJoinedChallenge({ force = false } = {}) {
    const id = templateId.value
    if (!id) {
      joinedChallenge.value = null
      return
    }

    if (demoStore.isDemoMode) {
      joinedChallenge.value = findActiveTemplateChallenge(getDemoMissions(), id)
      return
    }

    const userId = userStore.userId
    if (!userId) {
      joinedChallenge.value = null
      return
    }

    try {
      const challenges = await loadMyMissionsList(userId, { force })
      joinedChallenge.value = findActiveTemplateChallenge(challenges, id)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading weekly ritual membership:', error)
      }
      joinedChallenge.value = null
    }
  }

  function patchLocalCompletedDays(newCompletedDays) {
    const challenge = joinedChallenge.value
    const userId = currentUserId.value
    if (!challenge || !userId) return

    const participant = findParticipantForUser(challenge, userId)
    if (!participant) return

    participant.completedDays = newCompletedDays
    joinedChallenge.value = { ...challenge }
  }

  async function checkInToday() {
    const challenge = joinedChallenge.value
    const userId = currentUserId.value
    if (!challenge || !userId || checkingIn.value || !canCheckIn.value) return

    const participant = findParticipantForUser(challenge, userId)
    const today = todayStr.value
    const newCompletedDays = [
      ...(participant?.completedDays || []),
      today
    ]

    checkingIn.value = true
    try {
      if (demoStore.isDemoMode) {
        const updated = completeDemoToday(challenge._id)
        if (updated) {
          joinedChallenge.value = updated
        }
        return
      }

      if (shouldTriggerHabitMissionCompletion(challenge, newCompletedDays)) {
        await completeHabitMission(challenge, newCompletedDays, {
          onUpdate: loadJoinedChallenge
        })
        return
      }

      const response = await challengeService.updateParticipantCompletedDays(
        challenge._id,
        userId,
        newCompletedDays
      )
      applyXpAwardResponse(response)
      patchLocalCompletedDays(newCompletedDays)
      patchMyMissionsListCache(joinedChallenge.value)
      dispatchAppEvent(APP_EVENTS.PARTICIPANT_COMPLETED_DAYS_UPDATED)
      dispatchAppEvent(APP_EVENTS.CHALLENGE_UPDATED, {
        challengeId: challenge._id,
        challenge: joinedChallenge.value
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking in weekly ritual:', error)
      }
    } finally {
      checkingIn.value = false
    }
  }

  onMounted(loadJoinedChallenge)

  useAppEventListeners([
    {
      event: APP_EVENTS.AUTH_CHANGED,
      handler: () => {
        clearMyMissionsListCache()
        loadJoinedChallenge({ force: true })
      }
    },
    {
      event: APP_EVENTS.CHALLENGE_UPDATED,
      handler: (event) => {
        const challenge = event?.detail?.challenge
        if (challenge && String(challenge._id) === String(joinedChallenge.value?._id)) {
          patchMyMissionsListCache(challenge)
          joinedChallenge.value = { ...joinedChallenge.value, ...challenge }
          return
        }
        if (challenge) {
          patchMyMissionsListCache(challenge)
          loadJoinedChallenge()
          return
        }
        loadJoinedChallenge({ force: true })
      }
    }
  ])

  return {
    isJoined,
    joinedChallenge,
    currentDay,
    totalDays,
    canCheckIn,
    checkingIn,
    companionsCount,
    visibleCompanions,
    hiddenCompanionsCount,
    checkInToday,
    loadJoinedChallenge
  }
}
