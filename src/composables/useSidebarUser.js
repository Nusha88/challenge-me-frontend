import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import {
  getLevelFromXp,
  getXpForLevel,
  getXpForNextLevel,
  getLevelInfo,
  getRankIcon
} from '../utils/levelSystem'

export function useSidebarUser() {
  const route = useRoute()
  const { t } = useI18n()
  const userStore = useUserStore()

  const user = computed(() => userStore.user)
  const userXp = computed(() => Number(user.value?.xp || 0))
  const userLevel = computed(() => getLevelFromXp(userXp.value))
  const xpForCurrentLevel = computed(() => getXpForLevel(userLevel.value))
  const xpForNextLevel = computed(() => getXpForNextLevel(userLevel.value))
  const xpProgress = computed(() => Math.max(0, userXp.value - xpForCurrentLevel.value))

  const levelProgressPercentage = computed(() => {
    const range = xpForNextLevel.value - xpForCurrentLevel.value
    if (range <= 0) return 100
    return Math.min(100, Math.max(0, (xpProgress.value / range) * 100))
  })

  const heroRank = computed(() => {
    const levelInfo = getLevelInfo(userLevel.value)

    return {
      title: t(`profile.ranks.${levelInfo.rankKey}`),
      color: levelInfo.color,
      icon: getRankIcon(userLevel.value)
    }
  })

  const sidebarContentProps = computed(() => ({
    userName: userStore.userName,
    userAvatarUrl: userStore.userAvatarUrl,
    userLevel: userLevel.value,
    heroRankTitle: heroRank.value.title,
    heroRankColor: heroRank.value.color,
    levelProgressPercentage: levelProgressPercentage.value,
    xpDisplayCurrent: userXp.value,
    xpDisplayNeeded: xpForNextLevel.value,
    currentRoute: route.name
  }))

  return {
    sidebarContentProps
  }
}
