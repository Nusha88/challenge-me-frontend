import { ref, computed } from 'vue'
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
  const selectedLeaveLoading = ref(false)
  const selectedJoinLoading = ref(false)

  const selectedIsOwner = computed(() => {
    const userId = getUserId?.()
    const challenge = selectedChallenge.value
    if (!challenge || !userId) return false

    const ownerId = challenge.owner?._id || challenge.owner
    return Boolean(ownerId && ownerId.toString() === userId.toString())
  })

  const selectedIsParticipant = computed(() => {
    const userId = getUserId?.()
    const challenge = selectedChallenge.value
    if (!challenge || !userId) return false

    return challenge.participants?.some((participant) => {
      const participantUserId = getParticipantUserId(participant)
      return participantUserId && participantUserId.toString() === userId.toString()
    }) || false
  })

  function navigateToChallenge(challenge) {
    openChallengeDetails(selectedChallenge, detailsDialogOpen, challenge)
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
      const response = await challengeService.leaveChallenge(selectedChallenge.value._id, { userId })
      if (response.data?.challenge) {
        selectedChallenge.value = response.data.challenge
        if (updateChallengeInList) {
          updateChallengeInList(response.data.challenge)
        }
      } else {
        await handleDialogUpdate()
      }
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
      }

      const { data } = await challengeService.getChallenge(selectedChallenge.value._id)
      selectedChallenge.value = data

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
