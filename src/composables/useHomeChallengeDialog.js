import { ref } from 'vue'
import { challengeService } from '../services/api'

function getParticipantUserId(participant) {
  return participant?.userId?._id || participant?.userId || participant?._id
}

export function useHomeChallengeDialog({ getUserId, updateChallengeInList, onRefresh } = {}) {
  const detailsDialogOpen = ref(false)
  const selectedChallenge = ref(null)
  const selectedIsOwner = ref(false)
  const selectedIsParticipant = ref(false)
  const selectedLeaveLoading = ref(false)

  function syncParticipantFlags() {
    const userId = getUserId?.()
    const challenge = selectedChallenge.value
    if (!challenge) return

    const ownerId = challenge.owner?._id || challenge.owner
    selectedIsOwner.value = Boolean(ownerId && ownerId.toString() === userId?.toString())

    selectedIsParticipant.value = challenge.participants?.some((participant) => {
      const participantUserId = getParticipantUserId(participant)
      return participantUserId && participantUserId.toString() === userId?.toString()
    }) || false
  }

  async function navigateToChallenge(challenge) {
    try {
      const { data } = await challengeService.getChallenge(challenge._id)
      selectedChallenge.value = data
    } catch {
      selectedChallenge.value = challenge
    }

    syncParticipantFlags()
    detailsDialogOpen.value = true
  }

  async function handleDialogUpdate() {
    if (!selectedChallenge.value?._id) return

    try {
      const { data } = await challengeService.getChallenge(selectedChallenge.value._id)
      selectedChallenge.value = data

      if (updateChallengeInList) {
        updateChallengeInList(data)
      }

      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error('Error updating challenge:', error)
    }
  }

  async function handleDialogLeave() {
    const userId = getUserId?.()
    if (!selectedChallenge.value?._id || !userId) return

    selectedLeaveLoading.value = true
    try {
      await challengeService.leaveChallenge(selectedChallenge.value._id, { userId })
      await handleDialogUpdate()
    } catch (error) {
      console.error('Error leaving challenge:', error)
    } finally {
      selectedLeaveLoading.value = false
    }
  }

  return {
    detailsDialogOpen,
    selectedChallenge,
    selectedIsOwner,
    selectedIsParticipant,
    selectedLeaveLoading,
    navigateToChallenge,
    handleDialogUpdate,
    handleDialogLeave
  }
}
