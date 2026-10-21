export const FIRST_DAY_QUEST_KEY = 'first_day_quest'

export const FIRST_DAY_STEP_TITLES = Object.freeze([
  'Открыть Ignite',
  'Open Ignite',
  'Я открыл Ignite сегодня',
  'I opened Ignite today'
])

export const FIRST_DAY_STATUS = Object.freeze({
  ACTIVE: 'active',
  DONE: 'done'
})

function emptyState() {
  return { status: null, completedOn: null }
}

export function readFirstDayQuest() {
  try {
    const raw = localStorage.getItem(FIRST_DAY_QUEST_KEY)
    if (!raw) return emptyState()

    if (raw === FIRST_DAY_STATUS.ACTIVE || raw === FIRST_DAY_STATUS.DONE) {
      return { status: raw, completedOn: null }
    }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return emptyState()

    const status = parsed.status === FIRST_DAY_STATUS.ACTIVE || parsed.status === FIRST_DAY_STATUS.DONE
      ? parsed.status
      : null

    return {
      status,
      completedOn: typeof parsed.completedOn === 'string' ? parsed.completedOn : null
    }
  } catch {
    return emptyState()
  }
}

export function writeFirstDayQuest(next) {
  try {
    localStorage.setItem(FIRST_DAY_QUEST_KEY, JSON.stringify({
      status: next?.status || null,
      completedOn: next?.completedOn || null
    }))
  } catch {
    // ignore quota / private mode
  }
}

export function markOnboardingComplete() {
  try {
    localStorage.setItem('onboarding_complete', 'true')
    localStorage.removeItem('onboarding_pending')
  } catch {
    // ignore
  }
}

export function isOnboardingPending() {
  try {
    return localStorage.getItem('onboarding_pending') === 'true'
  } catch {
    return false
  }
}

export function isOnboardingComplete() {
  try {
    return localStorage.getItem('onboarding_complete') === 'true'
  } catch {
    return false
  }
}

export function shouldSkipWelcomeInterrupt() {
  const { status } = readFirstDayQuest()
  if (status === FIRST_DAY_STATUS.ACTIVE) return true
  if (status === FIRST_DAY_STATUS.DONE) return false
  return isOnboardingPending() || !isOnboardingComplete()
}

export function isFirstDayQuestStep(task, stepTitle = '') {
  const title = String(task?.title || '').trim()
  if (!title) return false
  if (stepTitle && title === stepTitle) return true
  return FIRST_DAY_STEP_TITLES.includes(title)
}

export function hasFirstDayQuestStep(tasks, stepTitle = '') {
  return (Array.isArray(tasks) ? tasks : []).some((task) => isFirstDayQuestStep(task, stepTitle))
}
