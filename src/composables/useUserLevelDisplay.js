import { useI18n } from 'vue-i18n'
import {
  enrichUserForDisplay,
  getDaysOnSite,
  getLocalizedLevelInfo,
  getUserInitials,
  getUserLevel,
  getUserLevelProgressPercent,
  getUserTotalXp
} from '../utils/userLevelDisplay'

export function useUserLevelDisplay() {
  const { t } = useI18n()

  return {
    enrichUser: (user) => enrichUserForDisplay(user, t),
    getUserInitials,
    getDaysOnSite,
    getUserLevel,
    getUserTotalXp,
    getUserLevelProgressPercent,
    getLocalizedLevelInfo: (level) => getLocalizedLevelInfo(level, t)
  }
}
