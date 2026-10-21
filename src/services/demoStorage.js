import {
  DEMO_STORAGE_KEYS,
  DEMO_USER_ID
} from '../constants/demo'
import { isWeeklyRitualTemplate } from '../utils/weeklyRitualSchedule'

function createEmptyCharacter() {
  return {
    name: 'Guest',
    xp: 0,
    sparks: 0
  }
}

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function safeWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to write demo storage', error)
    }
  }
}

export function isDemoActive() {
  return localStorage.getItem(DEMO_STORAGE_KEYS.ACTIVE) === 'true'
}

export function setDemoActive(active) {
  if (active) {
    localStorage.setItem(DEMO_STORAGE_KEYS.ACTIVE, 'true')
    return
  }
  localStorage.removeItem(DEMO_STORAGE_KEYS.ACTIVE)
}

export function getDemoCharacter() {
  const stored = safeReadJson(DEMO_STORAGE_KEYS.CHARACTER, null)
  if (!stored || typeof stored !== 'object') {
    return createEmptyCharacter()
  }

  return {
    name: stored.name || 'Guest',
    xp: Number(stored.xp) || 0,
    sparks: Number(stored.sparks) || 0
  }
}

export function setDemoCharacter(character) {
  const next = {
    name: character?.name || 'Guest',
    xp: Math.max(0, Number(character?.xp) || 0),
    sparks: Math.max(0, Number(character?.sparks) || 0)
  }
  safeWriteJson(DEMO_STORAGE_KEYS.CHARACTER, next)
  return next
}

export function seedDemoCharacter() {
  const existing = safeReadJson(DEMO_STORAGE_KEYS.CHARACTER, null)
  if (existing && typeof existing === 'object') {
    return getDemoCharacter()
  }
  return setDemoCharacter(createEmptyCharacter())
}

export function getDemoMissions() {
  const stored = safeReadJson(DEMO_STORAGE_KEYS.MISSIONS, [])
  return Array.isArray(stored) ? stored : []
}

export function setDemoMissions(missions) {
  const next = Array.isArray(missions) ? missions : []
  safeWriteJson(DEMO_STORAGE_KEYS.MISSIONS, next)
  return next
}

export function getDemoMissionById(id) {
  if (!id) return null
  return getDemoMissions().find((mission) => String(mission._id) === String(id)) || null
}

export function upsertDemoMission(mission) {
  if (!mission?._id) return getDemoMissions()
  const missions = getDemoMissions()
  const index = missions.findIndex((item) => String(item._id) === String(mission._id))
  if (index === -1) {
    missions.unshift(mission)
  } else {
    missions[index] = { ...missions[index], ...mission }
  }
  return setDemoMissions(missions)
}

export function createDemoMission(payload, { guestName = 'Guest' } = {}) {
  const id = `demo-${crypto.randomUUID()}`
  const owner = {
    _id: DEMO_USER_ID,
    name: guestName
  }
  const mission = {
    _id: id,
    title: payload.title || '',
    description: payload.description || '',
    imageUrl: payload.imageUrl || '',
    challengeType: payload.challengeType || 'habit',
    templateId: payload.templateId || '',
    isWeeklyRitual: isWeeklyRitualTemplate(payload.templateId),
    privacy: payload.privacy || 'private',
    frequency: payload.frequency || 'daily',
    startDate: payload.startDate || '',
    endDate: payload.endDate || '',
    allowComments: payload.allowComments !== false,
    communityQuest: Boolean(payload.communityQuest),
    actions: Array.isArray(payload.actions) ? payload.actions : undefined,
    difficulty: payload.difficulty || undefined,
    reward: payload.reward || undefined,
    owner,
    participants: [
      {
        userId: DEMO_USER_ID,
        completedDays: []
      }
    ],
    createdAt: new Date().toISOString()
  }

  upsertDemoMission(mission)
  return mission
}

export function completeDemoMissionDay(challengeId, dateStr) {
  const missions = getDemoMissions()
  const index = missions.findIndex((item) => String(item._id) === String(challengeId))
  if (index === -1) return null

  const mission = {
    ...missions[index],
    participants: (missions[index].participants || []).map((participant) => ({
      ...participant,
      completedDays: Array.isArray(participant.completedDays)
        ? [...participant.completedDays]
        : []
    }))
  }

  const participant = mission.participants.find((item) => {
    const userId = item?.userId?._id || item?.userId
    return String(userId) === DEMO_USER_ID
  })
  if (!participant) return null

  const alreadyCompleted = participant.completedDays.some((day) => String(day).slice(0, 10) === dateStr)
  if (alreadyCompleted) {
    return { mission, awarded: false }
  }

  participant.completedDays.push(dateStr)
  missions[index] = mission
  setDemoMissions(missions)
  return { mission, awarded: true }
}

export function hasDemoMissions() {
  return getDemoMissions().length > 0
}

export function clearDemoData() {
  localStorage.removeItem(DEMO_STORAGE_KEYS.ACTIVE)
  localStorage.removeItem(DEMO_STORAGE_KEYS.MISSIONS)
  localStorage.removeItem(DEMO_STORAGE_KEYS.CHARACTER)
}

export { createEmptyCharacter }
