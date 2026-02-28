// Rank definitions based on the new system
const RANKS = [
  { rank: 'I', minLevel: 1, maxLevel: 5, xpPerLevel: 100, nameRu: 'Странник', nameEn: 'Explorer' },
  { rank: 'II', minLevel: 6, maxLevel: 10, xpPerLevel: 250, nameRu: 'Адепт', nameEn: 'Adept' },
  { rank: 'III', minLevel: 11, maxLevel: 20, xpPerLevel: 500, nameRu: 'Воитель', nameEn: 'Warrior' },
  { rank: 'IV', minLevel: 21, maxLevel: 40, xpPerLevel: 1000, nameRu: 'Мастер', nameEn: 'Master' },
  { rank: 'V', minLevel: 41, maxLevel: 99, xpPerLevel: 2500, nameRu: 'Грандмастер', nameEn: 'Grandmaster' },
  { rank: 'VI', minLevel: 100, maxLevel: Infinity, xpPerLevel: 5000, nameRu: 'Легенда', nameEn: 'Legend' }
]

// Calculate total XP needed to reach a specific level
function calculateXpForLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  let totalXp = 0
  
  for (let currentLevel = 1; currentLevel < lvl; currentLevel++) {
    const rank = getRankForLevel(currentLevel)
    if (rank) {
      totalXp += rank.xpPerLevel
    }
  }
  
  return totalXp
}

// Get rank information for a given level
function getRankForLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  return RANKS.find(r => lvl >= r.minLevel && lvl <= r.maxLevel) || RANKS[RANKS.length - 1]
}

// Calculate level from total XP
export function getLevelFromXp(xp) {
  const safeXp = Math.max(0, Number(xp) || 0)
  let currentXp = 0
  let currentLevel = 1
  
  // Keep leveling up until we run out of XP
  while (currentLevel <= 1000) { // Safety limit
    const rank = getRankForLevel(currentLevel)
    if (!rank) break
    
    const xpNeeded = rank.xpPerLevel
    
    // If we don't have enough XP for this level, stop
    if (currentXp + xpNeeded > safeXp) {
      break
    }
    
    // We have enough XP, advance to next level
    currentXp += xpNeeded
    currentLevel++
    
    // Stop if we've exceeded the max level for all ranks
    if (currentLevel > RANKS[RANKS.length - 1].maxLevel) {
      break
    }
  }
  
  return currentLevel
}

// XP at the start of a given level (Lv1 starts at 0)
export function getXpForLevel(level) {
  return calculateXpForLevel(level)
}

// Total XP needed to reach the next level (threshold)
export function getXpForNextLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  const rank = getRankForLevel(lvl)
  if (!rank) return 0
  return calculateXpForLevel(lvl) + rank.xpPerLevel
}

export function getXpNeededForNextLevel(xp) {
  const safeXp = Math.max(0, Number(xp) || 0)
  const lvl = getLevelFromXp(safeXp)
  const xpForNext = getXpForNextLevel(lvl)
  return Math.max(0, xpForNext - safeXp)
}

// Get rank name for a given level
export function getLevelName(level, locale = 'en') {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  const rank = getRankForLevel(lvl)
  if (!rank) return locale === 'ru' ? 'Уровень' : 'Level'
  
  const isRu = (locale || 'en').toString().toLowerCase().startsWith('ru')
  return isRu ? rank.nameRu : rank.nameEn
}

// Get rank (I, II, III, etc.) for a given level
export function getRank(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  const rank = getRankForLevel(lvl)
  return rank ? rank.rank : 'I'
}

// Get XP per level for current rank
export function getXpPerLevel(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  const rank = getRankForLevel(lvl)
  return rank ? rank.xpPerLevel : 100
}

// Get comprehensive level info (rank, color, xpPerLvl, rankKey)
export function getLevelInfo(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  const rank = getRank(lvl)
  const xpPerLvl = getXpPerLevel(lvl)
  
  // Get rank key for translation based on level
  let rankKey = 'explorer'
  if (lvl >= 100) rankKey = 'legend'
  else if (lvl >= 41) rankKey = 'grandmaster'
  else if (lvl >= 21) rankKey = 'master'
  else if (lvl >= 11) rankKey = 'warrior'
  else if (lvl >= 6) rankKey = 'adept'
  
  // Get color based on rank
  let color = '#2196F3' // Explorer - blue
  if (rank === 'VI') color = '#FF4500' // Legend - orange red
  else if (rank === 'V') color = '#9400D3' // Grandmaster - purple
  else if (rank === 'IV') color = '#FFD700' // Master - gold
  else if (rank === 'III') color = '#C0C0C0' // Warrior - silver
  else if (rank === 'II') color = '#4CAF50' // Adept - green
  else color = '#2196F3' // Explorer - blue
  
  return {
    rank,
    color,
    xpPerLvl,
    rankKey
  }
}

// Get icon for rank (for UI display)
export function getRankIcon(level) {
  const lvl = Math.max(1, Math.floor(Number(level) || 1))
  if (lvl >= 100) return 'mdi-star-circles'
  if (lvl >= 41) return 'mdi-auto-fix'
  if (lvl >= 21) return 'mdi-crown'
  if (lvl >= 11) return 'mdi-sword'
  if (lvl >= 6) return 'mdi-shield-check'
  return 'mdi-compass-outline'
}
