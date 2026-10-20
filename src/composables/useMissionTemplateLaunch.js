import { useRouter } from 'vue-router'
import { useRestartChallengeDraft } from './useRestartChallengeDraft'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

export function useMissionTemplateLaunch() {
  const router = useRouter()
  const { saveRestartDraft } = useRestartChallengeDraft()

  function launchTemplate(template) {
    if (!template) return

    saveRestartDraft({
      title: template.title || '',
      description: template.description || '',
      challengeType: template.challengeType || CHALLENGE_TYPES.HABIT,
      duration: String(template.durationDays || 21),
      frequency: template.frequency || 'daily',
      privacy: template.privacy || 'public',
      imageUrl: template.imageUrl || '',
      allowComments: true,
      startOption: 'today',
      templateId: template.id || ''
    })

    router.push('/missions/add')
  }

  return { launchTemplate }
}
