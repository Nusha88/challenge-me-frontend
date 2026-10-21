import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { DEMO_USER_ID } from '../constants/demo'
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
  const demoStore = useDemoStore()

  const userXp = computed(() => {
    if (demoStore.isDemoMode) return Number(demoStore.character?.xp || 0)
    return Number(userStore.user?.xp || 0)
  })
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
    const title = t(`profile.ranks.${levelInfo.rankKey}`)
    const withTier = levelInfo.tier
      ? `${title} · ${t('profile.rankTier', { n: levelInfo.tier })}`
      : title

    return {
      title: withTier,
      color: levelInfo.color,
      icon: getRankIcon(userLevel.value)
    }
  })

  const sidebarContentProps = computed(() => ({
    userName: demoStore.isDemoMode ? t('demo.guestName') : userStore.userName,
    userAvatarUrl: demoStore.isDemoMode ? '' : userStore.userAvatarUrl,
    userSeed: demoStore.isDemoMode ? DEMO_USER_ID : userStore.userId || '',
    userLevel: userLevel.value,
    heroRankTitle: heroRank.value.title,
    heroRankColor: heroRank.value.color,
    levelProgressPercentage: levelProgressPercentage.value,
    xpDisplayCurrent: userXp.value,
    xpDisplayNeeded: xpForNextLevel.value,
    currentRoute: route.name,
    isDemoMode: demoStore.isDemoMode
  }))

  return {
    sidebarContentProps
  }
}
