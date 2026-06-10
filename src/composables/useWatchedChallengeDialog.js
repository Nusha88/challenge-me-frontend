import { ref, computed, unref } from 'vue'
import { challengeService } from '../services/api'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { isChallengeEnded } from '../utils/challengeStatus'
import { isChallengeOwner, isChallengeParticipant } from '../utils/challengeMembership'

export function useWatchedChallengeDialog({
  currentUserId,
  joiningId,
  leavingId,
  joinChallenge,
  leaveChallenge,
  onChallengeUpdated
}) {
  const detailsDialogOpen = ref(false)
  const selectedChallenge = ref(null)

  const selectedIsOwner = computed(() => {
    if (!selectedChallenge.value) return false
    return isChallengeOwner(selectedChallenge.value.owner, currentUserId)
  })

  const selectedIsParticipant = computed(() => {
    if (!selectedChallenge.value) return false
    return isChallengeParticipant(selectedChallenge.value, currentUserId)
  })

  const selectedJoinLoading = computed(() => {
    if (!selectedChallenge.value) return false
    return unref(joiningId) === selectedChallenge.value._id
  })

  const selectedLeaveLoading = computed(() => {
    if (!selectedChallenge.value) return false
    return unref(leavingId) === selectedChallenge.value._id
  })

  const showDialogJoinButton = computed(() => {
    if (!selectedChallenge.value) return false
    if (isChallengeEnded(selectedChallenge.value)) return false
    if (selectedChallenge.value.challengeType !== CHALLENGE_TYPES.HABIT) return false

    return (
      !!unref(currentUserId) &&
      !selectedIsOwner.value &&
      !selectedIsParticipant.value
    )
  })

  const showDialogLeaveButton = computed(() => {
    if (!selectedChallenge.value) return false
    if (isChallengeEnded(selectedChallenge.value)) return false
    if (selectedChallenge.value.challengeType !== CHALLENGE_TYPES.HABIT) return false

    return (
      !!unref(currentUserId) &&
      !selectedIsOwner.value &&
      selectedIsParticipant.value
    )
  })

  async function openDetails(challenge) {
    try {
      const { data } = await challengeService.getChallenge(challenge._id)
      selectedChallenge.value = data
    } catch {
      selectedChallenge.value = challenge
    }
    detailsDialogOpen.value = true
  }

  async function handleDialogUpdate() {
    if (!selectedChallenge.value?._id) return

    try {
      const { data } = await challengeService.getChallenge(selectedChallenge.value._id)
      selectedChallenge.value = data
      onChallengeUpdated?.(data)
    } catch (error) {
      console.error('Error updating challenge:', error)
    }
  }

  async function handleDialogJoin() {
    if (!selectedChallenge.value) return
    await joinChallenge(selectedChallenge.value, {
      selectedChallenge,
      onAfterJoin: handleDialogUpdate
    })
  }

  async function handleDialogLeave() {
    if (!selectedChallenge.value) return
    await leaveChallenge(selectedChallenge.value, { selectedChallenge })
  }

  return {
    detailsDialogOpen,
    selectedChallenge,
    selectedIsOwner,
    selectedIsParticipant,
    selectedJoinLoading,
    selectedLeaveLoading,
    showDialogJoinButton,
    showDialogLeaveButton,
    openDetails,
    handleDialogUpdate,
    handleDialogJoin,
    handleDialogLeave
  }
}
