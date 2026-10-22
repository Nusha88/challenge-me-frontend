import { computed, onMounted, ref } from 'vue'
import { challengeService } from '../services/api'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { getDemoMissions } from '../services/demoStorage'
import { indexActiveTemplateChallenges } from '../utils/templateMembership'
import { useChallengeUpdatedListener } from './useChallengeUpdatedListener'

export function useActiveTemplateMissions() {
  const userStore = useUserStore()
  const demoStore = useDemoStore()
  const activeByTemplateId = ref({})

  function isTemplateInUse(templateId) {
    return Boolean(activeByTemplateId.value[String(templateId || '')])
  }

  function getActiveChallenge(templateId) {
    return activeByTemplateId.value[String(templateId || '')] || null
  }

  async function loadActiveTemplateMissions() {
    if (demoStore.isDemoMode) {
      activeByTemplateId.value = indexActiveTemplateChallenges(getDemoMissions())
      return
    }

    const userId = userStore.userId
    if (!userId) {
      activeByTemplateId.value = {}
      return
    }

    try {
      const { data } = await challengeService.getChallengesByUser(userId, {
        excludePrivate: false
      })
      activeByTemplateId.value = indexActiveTemplateChallenges(data?.challenges || [])
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading active template missions:', error)
      }
      activeByTemplateId.value = {}
    }
  }

  const inUseTemplateIds = computed(() => Object.keys(activeByTemplateId.value))

  onMounted(loadActiveTemplateMissions)
  useChallengeUpdatedListener(loadActiveTemplateMissions)

  return {
    isTemplateInUse,
    getActiveChallenge,
    inUseTemplateIds,
    loadActiveTemplateMissions
  }
}
