import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { userService, challengeService } from '../services/api'
import { useAppEventListeners } from './useAppEvents'
import { APP_EVENTS } from '../utils/appEvents'

function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateToString(value) {
  if (!value) return ''

  const dateStr = String(value)
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0]
  }

  return dateStr.substring(0, 10)
}

function buildCompletedDateSet(checklists, habitChallenges, userId) {
  const completedDates = new Set()

  checklists.forEach((checklist) => {
    const hasCompletedTask = checklist.tasks?.some((task) => task.done === true)

    if (hasCompletedTask) {
      completedDates.add(formatDateString(new Date(checklist.date)))
    }
  })

  habitChallenges.forEach((challenge) => {
    const participant = challenge.participants?.find((p) => {
      const participantUserId = p.userId?._id || p.userId || p._id
      return participantUserId && participantUserId.toString() === userId.toString()
    })

    participant?.completedDays?.forEach((completedDate) => {
      const dateStr = normalizeDateToString(completedDate)
      if (dateStr) {
        completedDates.add(dateStr)
      }
    })
  })

  return completedDates
}

function calculateStreakFromDate(startDate, completedDates) {
  let streak = 0
  const currentDate = new Date(startDate)

  for (let i = 0; i < 365; i++) {
    const dateStr = formatDateString(currentDate)

    if (!completedDates.has(dateStr)) {
      break
    }

    streak++
    currentDate.setDate(currentDate.getDate() - 1)
    currentDate.setHours(0, 0, 0, 0)
  }

  return streak
}

export function useUserStreak() {
  const route = useRoute()
  const { t, locale } = useI18n()
  const userStore = useUserStore()

  const streakDays = ref(0)
  const yesterdayStreakDays = ref(0)
  const hasTodayCompletedTasks = ref(false)
  const isLoggedIn = computed(() => userStore.isLoggedIn)

  async function calculateStreak() {
    const userId = userStore.userId
    if (!userId || !isLoggedIn.value) {
      reset()
      return
    }

    try {
      const [checklistResponse, challengesResponse] = await Promise.all([
        userService.getChecklistHistory(),
        challengeService.getChallengesByUser(userId, { excludePrivate: false })
      ])

      const checklists = checklistResponse.data?.checklists || []
      const habitChallenges = (challengesResponse.data?.challenges || [])
        .filter((challenge) => challenge.challengeType === 'habit')

      const completedDates = buildCompletedDateSet(checklists, habitChallenges, userId)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)

      const todayStr = formatDateString(today)

      hasTodayCompletedTasks.value = completedDates.has(todayStr)
      streakDays.value = calculateStreakFromDate(today, completedDates)
      yesterdayStreakDays.value = calculateStreakFromDate(yesterday, completedDates)
    } catch (error) {
      console.error('Error calculating streak:', error)
      reset()
    }
  }

  function reset() {
    streakDays.value = 0
    yesterdayStreakDays.value = 0
    hasTodayCompletedTasks.value = false
  }

  const displayStreakDays = computed(() => {
    if (hasTodayCompletedTasks.value) {
      return streakDays.value
    }
    if (yesterdayStreakDays.value > 0) {
      return yesterdayStreakDays.value
    }
    return streakDays.value
  })

  function getRussianDayWord(days) {
    if (locale.value !== 'ru') {
      return t('navigation.streakDays')
    }

    const num = Math.abs(days)
    const lastDigit = num % 10
    const lastTwoDigits = num % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
      return 'дней подряд'
    }
    if (lastDigit === 1) {
      return 'день подряд'
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'дня подряд'
    }
    return 'дней подряд'
  }

  const streakDaysText = computed(() => {
    const days = (!hasTodayCompletedTasks.value && yesterdayStreakDays.value > 0)
      ? yesterdayStreakDays.value
      : displayStreakDays.value
    return getRussianDayWord(days)
  })

  const showStreak = computed(() => {
    return displayStreakDays.value > 0
      || (!hasTodayCompletedTasks.value && yesterdayStreakDays.value > 0)
  })

  useAppEventListeners([
    { event: APP_EVENTS.CHECKLIST_UPDATED, handler: calculateStreak },
    { event: APP_EVENTS.CHALLENGE_COMPLETED, handler: calculateStreak },
    { event: APP_EVENTS.PARTICIPANT_COMPLETED_DAYS_UPDATED, handler: calculateStreak }
  ])

  watch(() => route.path, () => {
    if (isLoggedIn.value) {
      calculateStreak()
    }
  })

  return {
    streakDays,
    yesterdayStreakDays,
    hasTodayCompletedTasks,
    displayStreakDays,
    streakDaysText,
    showStreak,
    calculateStreak,
    reset
  }
}
