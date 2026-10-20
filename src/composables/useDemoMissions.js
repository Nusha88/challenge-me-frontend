import { useI18n } from 'vue-i18n'
import { useDemoStore } from '../stores/demo'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { toDateInputValue } from '../utils/dateUtils'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { DEMO_HABIT_DAY_SPARKS, DEMO_HABIT_DAY_XP } from '../constants/demo'
import {
  completeDemoMissionDay,
  createDemoMission,
  getDemoMissionById,
  getDemoMissions
} from '../services/demoStorage'

function buildHabitDayRewardResponse() {
  return {
    data: {
      xpAward: { gained: DEMO_HABIT_DAY_XP },
      sparksAward: { gained: DEMO_HABIT_DAY_SPARKS }
    }
  }
}

export function useDemoMissions() {
  const { t } = useI18n()
  const demoStore = useDemoStore()
  const { applyRewardResponse } = useXpAwardFeedback()

  function listMissions() {
    return getDemoMissions()
  }

  function getMission(id) {
    return getDemoMissionById(id)
  }

  function createMission(payload) {
    const mission = createDemoMission(payload, {
      guestName: t('demo.guestName')
    })
    demoStore.touchMissions()
    return mission
  }

  function completeToday(challengeId) {
    const todayStr = toDateInputValue(new Date())
    const result = completeDemoMissionDay(challengeId, todayStr)
    if (!result?.mission) return null

    demoStore.touchMissions()
    if (result.awarded) {
      demoStore.awardHabitDay()
      applyRewardResponse(buildHabitDayRewardResponse())
    }

    dispatchAppEvent(APP_EVENTS.CHALLENGE_UPDATED, {
      challengeId: result.mission._id,
      challenge: result.mission
    })
    dispatchAppEvent(APP_EVENTS.PARTICIPANT_COMPLETED_DAYS_UPDATED)

    return result.mission
  }

  return {
    listMissions,
    getMission,
    createMission,
    completeToday
  }
}
