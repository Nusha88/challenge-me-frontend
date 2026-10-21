export const DEMO_STORAGE_KEYS = Object.freeze({
  ACTIVE: 'ignite_demo_active',
  MISSIONS: 'ignite_demo_missions',
  CHARACTER: 'ignite_demo_character',
  CHECKLIST: 'ignite_demo_checklist'
})

export const DEMO_USER_ID = 'demo-user'

export const DEMO_ALLOWED_ROUTE_NAMES = Object.freeze([
  'today',
  'my-challenges',
  'add-challenge'
])

export const DEMO_HABIT_DAY_XP = 10
export const DEMO_HABIT_DAY_SPARKS = 2
export const DEMO_CHECKLIST_TASK_XP = 5
export const DEMO_CHECKLIST_TASK_SPARKS = 2

export function isDemoMissionId(id) {
  return typeof id === 'string' && id.startsWith('demo-')
}
