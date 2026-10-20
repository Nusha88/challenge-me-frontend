import { challengeService } from './api'
import {
  clearDemoData,
  getDemoMissions,
  hasDemoMissions
} from './demoStorage'
import { useDemoStore } from '../stores/demo'
import { DEMO_USER_ID } from '../constants/demo'

function toCreatePayload(mission, ownerId) {
  const payload = {
    title: mission.title,
    description: mission.description || '',
    startDate: mission.startDate,
    endDate: mission.endDate,
    owner: ownerId,
    privacy: mission.privacy || 'private',
    challengeType: mission.challengeType || 'habit',
    allowComments: mission.allowComments !== false,
    communityQuest: Boolean(mission.communityQuest)
  }

  if (mission.imageUrl) payload.imageUrl = mission.imageUrl
  if (mission.templateId) payload.templateId = mission.templateId
  if (mission.frequency) payload.frequency = mission.frequency
  if (Array.isArray(mission.actions)) payload.actions = mission.actions
  if (mission.difficulty) payload.difficulty = mission.difficulty
  if (mission.reward) payload.reward = mission.reward

  return payload
}

function getCreatedChallengeId(response) {
  return response?.data?.challenge?._id || response?.data?._id || response?.data?.id || ''
}

function getCompletedDays(mission) {
  const participant = (mission.participants || []).find((item) => {
    const userId = item?.userId?._id || item?.userId
    return String(userId) === DEMO_USER_ID
  }) || mission.participants?.[0]

  return Array.isArray(participant?.completedDays)
    ? participant.completedDays.filter(Boolean)
    : []
}

export async function migrateDemoMissionsAfterRegister(userId) {
  const missions = getDemoMissions()
  if (!missions.length) {
    useDemoStore().discardDemo()
    return { migrated: 0, failed: 0 }
  }

  let failed = 0

  for (const mission of missions) {
    try {
      const response = await challengeService.createChallenge(toCreatePayload(mission, userId))
      const createdId = getCreatedChallengeId(response)
      const completedDays = getCompletedDays(mission)
      if (createdId && completedDays.length > 0) {
        await challengeService.updateParticipantCompletedDays(createdId, userId, completedDays)
      }
    } catch (error) {
      failed += 1
      if (import.meta.env.DEV) {
        console.error('Failed to migrate demo mission', error)
      }
    }
  }

  clearDemoData()
  useDemoStore().discardDemo()

  return {
    migrated: missions.length - failed,
    failed
  }
}

export function discardDemoWithoutMigrate() {
  useDemoStore().discardDemo()
}

export { hasDemoMissions }
