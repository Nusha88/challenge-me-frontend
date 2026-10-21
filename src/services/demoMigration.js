import { challengeService, userService } from './api'
import {
  clearDemoChecklist,
  clearDemoData,
  clearDemoMissionsAndCharacter,
  getDemoChecklistForDate,
  getDemoMissions,
  hasDemoChecklistTasks,
  hasDemoMissions
} from './demoStorage'
import { useDemoStore } from '../stores/demo'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
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

function taskKey(task) {
  return String(task?.title || '').trim().toLowerCase()
}

function mergeChecklistTasks(serverTasks, demoTasks) {
  const byTitle = new Map()

  for (const task of serverTasks || []) {
    const key = taskKey(task)
    if (!key) continue
    byTitle.set(key, {
      title: String(task.title).trim(),
      done: Boolean(task.done)
    })
  }

  for (const task of demoTasks || []) {
    const title = String(task?.title || '').trim()
    if (!title) continue
    const key = title.toLowerCase()
    const existing = byTitle.get(key)
    byTitle.set(key, {
      title: existing?.title || title,
      done: Boolean(existing?.done || task.done)
    })
  }

  return [...byTitle.values()]
}

async function migrateDemoChecklist() {
  const demoTasks = getDemoChecklistForDate().tasks
  if (!demoTasks.length) return { migrated: 0, failed: 0 }

  try {
    const existing = await userService.getTodayChecklist()
    const serverTasks = existing.data?.checklist?.tasks || []
    const merged = mergeChecklistTasks(serverTasks, demoTasks)
    const response = await userService.updateTodayChecklist(merged)
    useXpAwardFeedback().applyRewardResponse(response)
    return { migrated: 1, failed: 0 }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to migrate demo checklist', error)
    }
    return { migrated: 0, failed: 1 }
  }
}

async function migrateDemoMissions(userId) {
  const missions = getDemoMissions()
  if (!missions.length) return { migrated: 0, failed: 0 }

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

  return {
    migrated: missions.length - failed,
    failed
  }
}

export async function migrateDemoMissionsAfterRegister(userId) {
  const checklistResult = await migrateDemoChecklist()
  const missionsResult = await migrateDemoMissions(userId)

  useDemoStore().stopDemo()
  clearDemoMissionsAndCharacter()

  if (checklistResult.failed === 0) {
    clearDemoChecklist()
    clearDemoData()
    useDemoStore().discardDemo()
  }

  return {
    migrated: checklistResult.migrated + missionsResult.migrated,
    failed: checklistResult.failed + missionsResult.failed
  }
}

export async function migrateLeftoverDemoProgress(userId) {
  if (!hasDemoChecklistTasks() && !hasDemoMissions()) {
    return { migrated: 0, failed: 0 }
  }

  return migrateDemoMissionsAfterRegister(userId)
}

export function discardDemoWithoutMigrate() {
  useDemoStore().discardDemo()
}

export { hasDemoMissions, hasDemoChecklistTasks }
