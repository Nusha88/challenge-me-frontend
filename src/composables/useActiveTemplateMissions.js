import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { getDemoMissions } from '../services/demoStorage'
import { indexActiveTemplateChallenges } from '../utils/templateMembership'
import { useChallengeUpdatedListener } from './useChallengeUpdatedListener'
import { useAppEventListeners } from './useAppEvents'
import { APP_EVENTS } from '../utils/appEvents'
import {
  clearMyMissionsListCache,
  loadMyMissionsList,
  patchMyMissionsListCache
} from './useMyMissionsListCache'

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

  async function loadActiveTemplateMissions({ force = false } = {}) {
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
      const challenges = await loadMyMissionsList(userId, { force })
      activeByTemplateId.value = indexActiveTemplateChallenges(challenges)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading active template missions:', error)
      }
      activeByTemplateId.value = {}
    }
  }

  const inUseTemplateIds = computed(() => Object.keys(activeByTemplateId.value))

  onMounted(loadActiveTemplateMissions)

  useChallengeUpdatedListener(({ challenge }) => {
    if (challenge) {
      patchMyMissionsListCache(challenge)
    }
    loadActiveTemplateMissions({ force: !challenge })
  })

  useAppEventListeners([
    {
      event: APP_EVENTS.AUTH_CHANGED,
      handler: () => {
        clearMyMissionsListCache()
        loadActiveTemplateMissions({ force: true })
      }
    }
  ])

  return {
    isTemplateInUse,
    getActiveChallenge,
    inUseTemplateIds,
    loadActiveTemplateMissions
  }
}
