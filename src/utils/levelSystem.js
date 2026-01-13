export function getLevelFromXp(xp) {
  const safeXp = Math.max(0, Number(xp) || 0)
  return Math.floor(Math.sqrt(safeXp / 100)) + 1
}

// XP at the start of a given level (Lv1 starts at 0)
export function getXpForLevel(level) {
  const lvl = Math.max(1, Number(level) || 1)
  return Math.pow(lvl - 1, 2) * 100
}

// Total XP needed to reach the next level (threshold)
export function getXpForNextLevel(level) {
  const lvl = Math.max(1, Number(level) || 1)
  return Math.pow(lvl, 2) * 100
}

export function getXpNeededForNextLevel(xp) {
  const safeXp = Math.max(0, Number(xp) || 0)
  const lvl = getLevelFromXp(safeXp)
  return Math.max(0, getXpForNextLevel(lvl) - safeXp)
}

export function getLevelName(level, locale = 'en') {
  const lvl = Math.max(1, Number(level) || 1)
  const isRu = (locale || 'en').toString().toLowerCase().startsWith('ru')

  const names = isRu
    ? [
        { min: 1, max: 5, name: 'Пробуждающийся' },
        { min: 6, max: 10, name: 'Искатель вызовов' },
        { min: 11, max: 20, name: 'Закаленный' },
        { min: 21, max: 35, name: 'Мастер привычек' },
        { min: 36, max: 50, name: 'Несокрушимый' },
        { min: 51, max: Infinity, name: 'Архитектор судьбы' }
      ]
    : [
        { min: 1, max: 5, name: 'Awakening' },
        { min: 6, max: 10, name: 'Challenger' },
        { min: 11, max: 20, name: 'Iron-willed' },
        { min: 21, max: 35, name: 'Habit Master' },
        { min: 36, max: 50, name: 'Unstoppable' },
        { min: 51, max: Infinity, name: 'Fate Architect' }
      ]

  return names.find(r => lvl >= r.min && lvl <= r.max)?.name || (isRu ? 'Уровень' : 'Level')
}

