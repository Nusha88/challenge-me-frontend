import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import { useDemoStore } from '../stores/demo'
import { getDemoMissions } from '../services/demoStorage'
import { DEMO_USER_ID } from '../constants/demo'

export function useTemplateParticipants() {
  const { t } = useI18n()
  const demoStore = useDemoStore()
  const participantsByTemplateId = ref({})
  const loading = ref(false)
  const demoMissionsVersion = computed(() => demoStore.missionsVersion)

  async function fetchTemplateParticipants() {
    loading.value = true
    try {
      const { data } = await challengeService.getTemplateParticipants()
      participantsByTemplateId.value = data?.participantsByTemplateId || {}
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching template participants:', error)
      }
      participantsByTemplateId.value = {}
    } finally {
      loading.value = false
    }
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
