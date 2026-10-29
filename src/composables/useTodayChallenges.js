import { ref, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { challengeService } from '../services/api'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { getScheduledDaysCount, normalizeDateKey, toDateInputValue } from '../utils/dateUtils'
import { isChallengeFinished as isMissionFinished, isChallengeUpcoming } from '../utils/challengeStatus'
import {
  findParticipantForUser,
  getDayProtectionSource,
  getEffectiveCompletedDays,
  isDayEffectiveCompleted
} from '../utils/participantDays'
import { getYesterdayDateStr, isDateScheduledForChallenge } from '../utils/ritualSchedule'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { shouldTriggerHabitMissionCompletion } from '../utils/missionParticipation'
import { useMissionCompletionFlow } from './useMissionCompletionFlow'
import { useDemoStore } from '../stores/demo'
import { useDemoMissions } from './useDemoMissions'
import { DEMO_USER_ID } from '../constants/demo'

function getParticipantUserId(participant) {
  return participant?.userId?._id || participant?.userId || participant?._id
}

function isChallengeFinished(challenge) {
  if (challenge.endDate) {
    try {
      const endDate = new Date(challenge.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < today) {
        return true
      }
    } catch {
      // Continue to check other conditions
    }
  }

  if (challenge.challengeType === CHALLENGE_TYPES.RESULT) {
    if (!challenge.actions || !Array.isArray(challenge.actions) || challenge.actions.length === 0) {
      return false
    }

    return challenge.actions.every((action) => {
      if (!action.checked) return false
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every((child) => child.checked)
      }
      return true
    })
  }

  return false
}

export function useTodayChallenges({ onUpdated } = {}) {
  const userStore = useUserStore()
  const demoStore = useDemoStore()
  const { completeToday: completeDemoToday } = useDemoMissions()
  const { applyXpAwardResponse } = useXpAwardFeedback()
  const { completeHabitMission } = useMissionCompletionFlow()

  const challenges = ref([])
  const participantHabitChallenges = ref([])
  const activeQuests = ref([])
  const loadingChallenges = ref(true)
  const hasLoadedOnce = ref(false)

  function getUserId() {
    if (userStore.userId) return userStore.userId
    if (demoStore.isDemoMode) return DEMO_USER_ID
    return null
  }

  function isTodayValidForChallenge(challenge) {
    if (challenge.frequency !== 'everyOtherDay') {
      return true
    }

    if (!challenge.startDate) {
      return false
    }

    const startDate = new Date(challenge.startDate)
    const today = new Date()
    startDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    if (today < startDate) {
      return false
    }

    const diffTime = today - startDate
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return dayIndex % 2 === 0
  }

  function isTomorrowValidForChallenge(challenge) {
    if (challenge.frequency !== 'everyOtherDay') {
      return true
    }

    if (!challenge.startDate) {
      return false
    }

    const startDate = new Date(challenge.startDate)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    startDate.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)

    if (tomorrow < startDate) {
      return false
    }

    const diffTime = tomorrow - startDate
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return dayIndex % 2 === 0
  }

  function getTodayDateStr() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return toDateInputValue(today)
  }

  function getParticipantForChallenge(challenge) {
    return findParticipantForUser(challenge, getUserId())
  }

  function isTodayCompleted(challenge) {
    const participant = getParticipantForChallenge(challenge)
    if (!participant) return false
    return isDayEffectiveCompleted(participant, getTodayDateStr())
  }

  function getTodayDayStatus(challenge) {
    const participant = getParticipantForChallenge(challenge)
    if (!participant) return 'incomplete'

    const todayStr = getTodayDateStr()
    const source = getDayProtectionSource(participant, todayStr)

    if (!source) return 'incomplete'
    if (source === 'normal') return 'completed'
    return 'protected'
  }

  function getChallengeCompletedDays(challenge) {
    const participant = getParticipantForChallenge(challenge)
    if (!participant) return 0
    return getEffectiveCompletedDays(participant).length
  }

  function getChallengeTotalDays(challenge) {
    return getScheduledDaysCount(
      challenge.startDate,
      challenge.endDate,
      challenge.frequency
    )
  }

  function isParticipantHabitChallenge(challenge, userId) {
    if (isChallengeFinished(challenge)) return false
    if (challenge.challengeType !== CHALLENGE_TYPES.HABIT) return false

    if (challenge.startDate) {
      const startDate = new Date(challenge.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      if (startDate > today) return false
    }

    if (!challenge.participants || challenge.participants.length === 0) {
      return false
    }

    return challenge.participants.some((p) => {
      const pUserId = getParticipantUserId(p)
      return pUserId && pUserId.toString() === userId.toString()
    })
  }

  function isYesterdayIncompleteForChallenge(challenge) {
    const participant = getParticipantForChallenge(challenge)
    if (!participant) return false

    const yesterdayStr = getYesterdayDateStr()
    if (!isDateScheduledForChallenge(challenge, yesterdayStr)) return false

    return !isDayEffectiveCompleted(participant, yesterdayStr)
  }

  function shouldShowSecondChance(challenge, { isSecondChanceWindow = false } = {}) {
    if (!isSecondChanceWindow) return false
    return getTodayDayStatus(challenge) === 'incomplete'
  }

  function isActiveQuestForUser(challenge, userId) {
    if (challenge.challengeType !== CHALLENGE_TYPES.RESULT) return false
    if (isMissionFinished(challenge) || isChallengeUpcoming(challenge)) return false
    if (!challenge.participants?.length) return false
    return challenge.participants.some((p) => {
      const pUserId = getParticipantUserId(p)
      return pUserId && pUserId.toString() === userId.toString()
    })
  }

  function loadTodaysChallenges(allChallenges, userId) {
    const habits = allChallenges.filter((challenge) => isParticipantHabitChallenge(challenge, userId))
    participantHabitChallenges.value = habits
    challenges.value = habits.filter((challenge) => isTodayValidForChallenge(challenge))
    activeQuests.value = allChallenges.filter((challenge) => isActiveQuestForUser(challenge, userId))
  }

  function resetChallenges() {
    challenges.value = []
    participantHabitChallenges.value = []
    activeQuests.value = []
    loadingChallenges.value = false
    hasLoadedOnce.value = true
  }

  function replaceChallenge(list, challenge) {
    const index = list.findIndex((item) => String(item._id) === String(challenge._id))
    if (index === -1) return list
    const next = [...list]
    next[index] = { ...list[index], ...challenge }
    return next
  }

  function updateChallengeInList(challenge) {
    if (!challenge?._id) return
    challenges.value = replaceChallenge(challenges.value, challenge)
    participantHabitChallenges.value = replaceChallenge(participantHabitChallenges.value, challenge)
  }

  const todaysChallenges = computed(() => challenges.value)

  const incompleteTodayRitualsCount = computed(() => {
    return todaysChallenges.value.filter((challenge) => getTodayDayStatus(challenge) === 'incomplete').length
  })

  const incompleteYesterdayRitualsCount = computed(() => {
    return participantHabitChallenges.value.filter((challenge) => isYesterdayIncompleteForChallenge(challenge)).length
  })

  const isTodayFullyComplete = computed(() => incompleteTodayRitualsCount.value === 0)

  const tomorrowsChallenges = computed(() => {
    const userId = getUserId()
    const isLoggedIn = !!localStorage.getItem('token') || demoStore.isDemoMode

    if (!userId || !isLoggedIn) {
      return []
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    // Must use the full habit list, not today-only `challenges` — every-other-day
    // rituals valid tomorrow but not today would otherwise disappear from Loadout.
    return participantHabitChallenges.value.filter((challenge) => {
      if (isChallengeFinished(challenge)) return false
      if (challenge.challengeType !== CHALLENGE_TYPES.HABIT) return false

      if (challenge.startDate) {
        const startDate = new Date(challenge.startDate)
        startDate.setHours(0, 0, 0, 0)
        if (startDate > tomorrow) return false
      }

      if (!challenge.participants || challenge.participants.length === 0) {
        return false
      }

      const isParticipant = challenge.participants.some((p) => {
        const pUserId = getParticipantUserId(p)
        return pUserId && pUserId.toString() === userId.toString()
      })

      if (!isParticipant) {
        return false
      }

      if (!isTomorrowValidForChallenge(challenge)) {
        return false
      }

      return true
    })
  })

  async function toggleTodayCompletion(challenge, checked) {
    const userId = getUserId()
    if (!userId || !challenge.participants) return

    const participant = challenge.participants.find((p) => {
      const pUserId = getParticipantUserId(p)
      return pUserId && pUserId.toString() === userId.toString()
    })

    if (!participant) return

    const currentCompletedDays = Array.isArray(participant.completedDays)
      ? [...participant.completedDays]
      : []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = toDateInputValue(today)

    let newCompletedDays = [...currentCompletedDays]

    if (checked) {
      const hasToday = newCompletedDays.some((date) => normalizeDateKey(date) === todayStr)

      if (!hasToday) {
        newCompletedDays.push(todayStr)
      }
    } else {
      newCompletedDays = newCompletedDays.filter((date) => normalizeDateKey(date) !== todayStr)
    }

    try {
      if (demoStore.isDemoMode) {
        if (checked) {
          const updated = completeDemoToday(challenge._id)
          if (updated) {
            participant.completedDays = updated.participants?.[0]?.completedDays || newCompletedDays
          }
        }
        participant.completedDays = newCompletedDays
        updateChallengeInList({
          ...challenge,
          participants: challenge.participants.map((item) => (
            item === participant ? { ...item, completedDays: newCompletedDays } : item
          ))
        })
        if (onUpdated) await onUpdated()
        window.dispatchEvent(new Event('participant-completed-days-updated'))
        return
      }

      if (checked && shouldTriggerHabitMissionCompletion(challenge, newCompletedDays)) {
        await completeHabitMission(challenge, newCompletedDays, {
          onUpdate: onUpdated
        })
        return
      }

      const response = await challengeService.updateParticipantCompletedDays(
        challenge._id,
        userId,
        newCompletedDays
      )
      applyXpAwardResponse(response)

      const nextParticipants = challenge.participants.map((item) => (
        item === participant ? { ...item, completedDays: newCompletedDays } : item
      ))
      updateChallengeInList({ ...challenge, participants: nextParticipants })

      if (onUpdated) {
        await onUpdated()
      }

      window.dispatchEvent(new Event('participant-completed-days-updated'))
    } catch (error) {
      console.error('Error toggling completion:', error)
    }
  }

  return {
    challenges,
    loadingChallenges,
    hasLoadedOnce,
    todaysChallenges,
    tomorrowsChallenges,
    activeQuests,
    loadTodaysChallenges,
    resetChallenges,
    updateChallengeInList,
    isTodayCompleted,
    getTodayDayStatus,
    incompleteTodayRitualsCount,
    incompleteYesterdayRitualsCount,
    isTodayFullyComplete,
    shouldShowSecondChance,
    isYesterdayIncompleteForChallenge,
    isTodayValidForChallenge,
    isTomorrowValidForChallenge,
    toggleTodayCompletion,
    getChallengeCompletedDays,
    getChallengeTotalDays
  }
}
