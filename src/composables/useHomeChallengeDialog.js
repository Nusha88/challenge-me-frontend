import { ref } from 'vue'
import { challengeService } from '../services/api'
import { openChallengeDetails } from '../utils/openChallengeDetails'
import { useXpAwardFeedback } from './useXpAwardFeedback'

function getParticipantUserId(participant) {
  return participant?.userId?._id || participant?.userId || participant?._id
}

export function useHomeChallengeDialog({ getUserId, updateChallengeInList, onRefresh } = {}) {
  const { applyRewardResponse } = useXpAwardFeedback()
  const detailsDialogOpen = ref(false)
  const selectedChallenge = ref(null)
  const selectedIsOwner = ref(false)
  const selectedIsParticipant = ref(false)
  const selectedLeaveLoading = ref(false)
  const selectedJoinLoading = ref(false)

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

  function navigateToChallenge(challenge) {
    openChallengeDetails(selectedChallenge, detailsDialogOpen, challenge, {
      onRefreshed: syncParticipantFlags
    })
    syncParticipantFlags()
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

  async function handleDialogJoin() {
    const userId = getUserId?.()
    if (!selectedChallenge.value?._id || !userId) return

    selectedJoinLoading.value = true
    try {
      const response = await challengeService.joinChallenge(selectedChallenge.value._id, { userId })
      applyRewardResponse(response)
      if (response.data?.challenge) {
        selectedChallenge.value = response.data.challenge
        syncParticipantFlags()
      }

      const { data } = await challengeService.getChallenge(selectedChallenge.value._id)
      selectedChallenge.value = data
      syncParticipantFlags()

      if (updateChallengeInList) {
        updateChallengeInList(data)
      }

      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error('Error joining challenge:', error)
    } finally {
      selectedJoinLoading.value = false
    }
  }

  return {
    detailsDialogOpen,
    selectedChallenge,
    selectedIsOwner,
    selectedIsParticipant,
    selectedLeaveLoading,
    selectedJoinLoading,
    navigateToChallenge,
    handleDialogUpdate,
    handleDialogLeave,
    handleDialogJoin
  }
}
