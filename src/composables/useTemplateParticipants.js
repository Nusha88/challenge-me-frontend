import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useDemoStore } from '../stores/demo'
import { getDemoMissions } from '../services/demoStorage'
import { DEMO_USER_ID } from '../constants/demo'

const TTL_MS = 15000
const participantsByTemplateId = ref({})
const loading = ref(false)
let fetchPromise = null
let fetchedAt = 0

export function useTemplateParticipants() {
  const { t } = useI18n()
  const demoStore = useDemoStore()
  const demoMissionsVersion = computed(() => demoStore.missionsVersion)

  async function fetchTemplateParticipants({ force = false } = {}) {
    if (!force && fetchedAt && Date.now() - fetchedAt < TTL_MS) {
      return participantsByTemplateId.value
    }
    if (fetchPromise) return fetchPromise

    loading.value = true
    fetchPromise = (async () => {
      try {
        const { data } = await challengeService.getTemplateParticipants()
        participantsByTemplateId.value = data?.participantsByTemplateId || {}
        fetchedAt = Date.now()
        return participantsByTemplateId.value
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching template participants:', error)
        }
        participantsByTemplateId.value = {}
        return participantsByTemplateId.value
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  function getParticipants(templateId) {
    const remote = participantsByTemplateId.value?.[templateId] || []
    if (!demoStore.isDemoMode || !templateId) return remote
    void demoMissionsVersion.value
    const hasLocal = getDemoMissions().some((mission) => mission.templateId === templateId)
    if (!hasLocal) return remote
    if (remote.some((participant) => String(participant.id) === DEMO_USER_ID)) return remote
    return [
      {
        id: DEMO_USER_ID,
        name: t('demo.guestName'),
        avatarUrl: ''
      },
      ...remote
    ]
  }

  onMounted(fetchTemplateParticipants)

  return {
    participantsByTemplateId,
    loading,
    fetchTemplateParticipants,
    getParticipants
  }
}
