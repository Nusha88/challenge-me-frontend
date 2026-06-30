import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import { getScheduledDaysCount, normalizeDateKey, toDateInputValue } from '../utils/dateUtils'
import { getEffectiveCompletedDays } from '../utils/participantDays'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { shouldTriggerHabitMissionCompletion } from '../utils/missionParticipation'
import { useMissionCompletionFlow } from './useMissionCompletionFlow'

function getParticipantUserId(participant) {
  return participant?.userId?._id || participant?.userId || participant?._id || participant
}

function triggerHapticFeedback(pattern = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

export function useChallengeCardProgress(props, emit) {
  const { t } = useI18n()
  const { applyXpAwardResponse } = useXpAwardFeedback()
  const { completeHabitMission } = useMissionCompletionFlow()

  const isHabitType = computed(() => props.challenge.challengeType === CHALLENGE_TYPES.HABIT)
  const isResultType = computed(() => props.challenge.challengeType === CHALLENGE_TYPES.RESULT)

  const currentUserIdString = computed(() => props.currentUserId?.toString() || '')

  const currentUserParticipant = computed(() => {
    if (!currentUserIdString.value || !Array.isArray(props.challenge.participants)) {
      return null
    }

    return props.challenge.participants.find((participant) => {
      const userId = getParticipantUserId(participant)
      return userId && userId.toString() === currentUserIdString.value
    }) || null
  })

  const isParticipant = computed(() => Boolean(currentUserParticipant.value))

  const targetParticipant = computed(() => {
    if (currentUserParticipant.value) return currentUserParticipant.value
    if (!Array.isArray(props.challenge.participants)) return null

    const ownerId = props.challenge.owner?._id || props.challenge.owner
    return props.challenge.participants.find((participant) => {
      const userId = getParticipantUserId(participant)
      return userId && userId.toString() === ownerId?.toString()
    }) || null
  })

  const targetCompletedDateSet = computed(() => {
    return new Set(
      getEffectiveCompletedDays(targetParticipant.value)
        .map((day) => normalizeDateKey(day))
        .filter(Boolean)
    )
  })

  const currentUserCompletedDateSet = computed(() => {
    return new Set(
      getEffectiveCompletedDays(currentUserParticipant.value)
        .map((day) => normalizeDateKey(day))
        .filter(Boolean)
    )
  })

  const isTodayScheduled = computed(() => {
    if (!isHabitType.value) return false
    if (props.challenge.frequency !== 'everyOtherDay') return true
    if (!props.challenge.startDate) return true

    const start = new Date(props.challenge.startDate)
    const today = new Date()
    start.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return false
    return diffDays % 2 === 0
  })

  const streakDays = computed(() => {
    if (!isHabitType.value) return 0
    if (!currentUserParticipant.value) return 0

    const completedDates = currentUserCompletedDateSet.value
    const todayStr = toDateInputValue(new Date())

    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    if (!completedDates.has(todayStr)) {
      startDate.setDate(startDate.getDate() - 1)
    }

    let streak = 0
    const currentDate = new Date(startDate)

    for (let i = 0; i < 365; i++) {
      const dateStr = toDateInputValue(currentDate)

      if (!completedDates.has(dateStr)) {
        break
      }

      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  })

  const isTodayCompleted = computed(() => {
    if (!isHabitType.value) return false
    return currentUserCompletedDateSet.value.has(toDateInputValue(new Date()))
  })

  const resultActionsStats = computed(() => {
    if (!isResultType.value) {
      return { done: 0, total: 0 }
    }

    return (props.challenge.actions || []).reduce(
      (stats, action) => {
        stats.total++

        if (action.checked) {
          stats.done++
        }

        ;(action.children || []).forEach((child) => {
          stats.total++

          if (child.checked) {
            stats.done++
          }
        })

        return stats
      },
      { done: 0, total: 0 }
    )
  })

  const progressDone = computed(() => {
    if (isResultType.value) {
      return resultActionsStats.value.done
    }

    return getEffectiveCompletedDays(targetParticipant.value).length
  })

  const todayString = computed(() => toDateInputValue(new Date()))

  const lastSevenDays = computed(() => {
    const days = []
    const today = todayString.value

    for (let i = 0; i <= 6; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      const dateStr = toDateInputValue(date)

      days.push({
        date: dateStr,
        completed: targetCompletedDateSet.value.has(dateStr),
        label: dateStr === today ? t('common.today') : dateStr
      })
    }

    return days
  })

  const progressTotal = computed(() => {
    if (isResultType.value) {
      return resultActionsStats.value.total
    }

    return getScheduledDaysCount(
      props.challenge.startDate,
      props.challenge.endDate,
      props.challenge.frequency
    )
  })

  const progressPercentage = computed(() => {
    const total = progressTotal.value
    if (total === 0) return 0
    return Math.min(100, Math.max(0, Math.round((progressDone.value / total) * 100)))
  })

  const efficiencyPercentage = computed(() => {
    const { done, total } = resultActionsStats.value
    return total === 0 ? 0 : Math.round((done / total) * 100)
  })

  async function completeToday() {
    if (props.disabled) return
    if (!isHabitType.value || !currentUserParticipant.value || isTodayCompleted.value || !isTodayScheduled.value) {
      return
    }

    const todayStr = toDateInputValue(new Date())
    const newCompletedDays = [...(currentUserParticipant.value.completedDays || []), todayStr]

    try {
      if (shouldTriggerHabitMissionCompletion(props.challenge, newCompletedDays)) {
        await completeHabitMission(props.challenge, newCompletedDays, {
          onUpdate: () => emit('update')
        })
        return
      }

      const response = await challengeService.updateParticipantCompletedDays(
        props.challenge._id,
        props.currentUserId,
        newCompletedDays
      )
      triggerHapticFeedback(50)
      applyXpAwardResponse(response)
      emit('update')
    } catch (error) {
      console.error('Error completing challenge:', error)
    }
  }

  return {
    isHabitType,
    isResultType,
    isParticipant,
    targetParticipant,
    progressDone,
    progressTotal,
    progressPercentage,
    efficiencyPercentage,
    streakDays,
    isTodayCompleted,
    isTodayScheduled,
    lastSevenDays,
    todayString,
    completeToday
  }
}
