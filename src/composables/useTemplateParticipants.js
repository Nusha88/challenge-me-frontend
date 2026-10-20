import { onMounted, ref } from 'vue'
import { challengeService } from '../services/api'

export function useTemplateParticipants() {
  const participantsByTemplateId = ref({})
  const loading = ref(false)

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
    return participantsByTemplateId.value?.[templateId] || []
  }

  onMounted(fetchTemplateParticipants)

  return {
    participantsByTemplateId,
    loading,
    fetchTemplateParticipants,
    getParticipants
  }
}
