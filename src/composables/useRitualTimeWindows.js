import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getYesterdayDateStr } from '../utils/ritualSchedule'

const TICK_INTERVAL_MS = 60_000

export function useRitualTimeWindows() {
  const now = ref(new Date())

  let tickIntervalId = null

  onMounted(() => {
    tickIntervalId = window.setInterval(() => {
      now.value = new Date()
    }, TICK_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (tickIntervalId !== null) {
      window.clearInterval(tickIntervalId)
      tickIntervalId = null
    }
  })

  const currentLocalHour = computed(() => now.value.getHours())
  const currentLocalMinute = computed(() => now.value.getMinutes())

  const ritualTimePhase = computed(() => {
    const hour = currentLocalHour.value

    if (hour >= 0 && hour < 10) {
      return 'save_yesterday'
    }

    if (hour >= 22 && hour <= 23) {
      return 'freeze_today'
    }

    return 'hidden'
  })

  const isSecondChanceWindow = computed(() => {
    const hour = currentLocalHour.value
    return hour >= 22 && hour <= 23
  })

  function isYesterdayStreakBroken(completedDates) {
    if (!completedDates) return false

    const yesterdayStr = getYesterdayDateStr(now.value)
    return !completedDates.has(yesterdayStr)
  }

  return {
    now,
    currentLocalHour,
    currentLocalMinute,
    ritualTimePhase,
    isSecondChanceWindow,
    isYesterdayStreakBroken
  }
}
