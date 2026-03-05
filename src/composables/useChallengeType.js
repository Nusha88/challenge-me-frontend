import { useI18n } from 'vue-i18n'

export function useChallengeType() {
  const { t } = useI18n()

  const getChallengeTypeLabel = (challengeType) => {
    if (!challengeType) return ''
    return challengeType === 'habit' 
      ? t('challenges.typeHabitLabel') 
      : t('challenges.typeResultLabel')
  }

  const getMissionTypeLabel = (challengeType) => {
    if (!challengeType) return ''
    return challengeType === 'habit'
      ? t('missions.dailyRitual')
      : t('missions.epicQuest')
  }

  return {
    getChallengeTypeLabel,
    getMissionTypeLabel
  }
}
