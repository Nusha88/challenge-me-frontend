import { useI18n } from 'vue-i18n'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

export { CHALLENGE_TYPES }

export function useChallengeType() {
  const { t } = useI18n()

  const getChallengeTypeLabel = (challengeType) => {
    if (!challengeType) return ''
    return challengeType === CHALLENGE_TYPES.HABIT
      ? t('challenges.typeHabitLabel')
      : t('challenges.typeResultLabel')
  }

  const getMissionTypeLabel = (challengeType) => {
    if (!challengeType) return ''
    return challengeType === CHALLENGE_TYPES.HABIT
      ? t('missions.dailyRitual')
      : t('missions.epicQuest')
  }

  return {
    getChallengeTypeLabel,
    getMissionTypeLabel
  }
}
