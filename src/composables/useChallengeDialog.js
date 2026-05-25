import { ref, computed, unref, nextTick } from 'vue'
import { challengeService } from '../services/api'
import { isChallengeEnded } from '../utils/challengeStatus'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

export function useChallengeDialog({
  challenges,
  currentUserId,
  error,
  fetchChallenges,
  leaveChallenge,
  leavingId
}) {
  const detailsDialogOpen = ref(false)
  const selectedChallenge = ref(null)

  const selectedIsOwner = computed(() => {
    const userId = unref(currentUserId)
    if (!selectedChallenge.value || !userId) return false
    const ownerId = selectedChallenge.value.owner?._id || selectedChallenge.value.owner
    return ownerId && ownerId.toString() === userId.toString()
  })

  const selectedIsParticipant = computed(() => {
    const userId = unref(currentUserId)
    if (!selectedChallenge.value || !userId) return false
    return (selectedChallenge.value.participants || []).some((participant) => {
      const participantId =
        participant.userId?._id || participant.userId || participant._id || participant
      return participantId && participantId.toString() === userId.toString()
    })
  })

  const showDialogLeaveButton = computed(() => {
    if (!selectedChallenge.value) return false
    if (isChallengeEnded(selectedChallenge.value)) return false
    if (selectedChallenge.value.challengeType !== CHALLENGE_TYPES.HABIT) return false

    const userId = unref(currentUserId)
    return !!userId && !selectedIsOwner.value && selectedIsParticipant.value
  })

  const selectedLeaveLoading = computed(() => {
    if (!selectedChallenge.value) return false
    return unref(leavingId) === selectedChallenge.value._id
  })

  async function refreshSelectedChallenge(challengeId) {
    try {
      const { data } = await challengeService.getChallenge(challengeId)
      selectedChallenge.value = data
    } catch {
      selectedChallenge.value =
        unref(challenges).find((c) => c._id === challengeId) || selectedChallenge.value
    }
  }

  async function handleChallengeClick(challenge) {
    if (error) {
      error.value = ''
    }

    try {
      const { data } = await challengeService.getChallenge(challenge._id)
      selectedChallenge.value = data
    } catch {
      selectedChallenge.value = challenge
    }

    detailsDialogOpen.value = true
  }

  async function handleDialogUpdate() {
    const selectedId = selectedChallenge.value?._id
    await fetchChallenges()

    if (selectedId) {
      await refreshSelectedChallenge(selectedId)
    }
  }

  async function handleDialogLeave() {
    if (!selectedChallenge.value) return
    await leaveChallenge(selectedChallenge.value)
  }

  function handleOwnerNavigated() {
    detailsDialogOpen.value = false
  }

  async function openChallengeById(challengeId) {
    if (!challengeId) return

    const normalizedId = Array.isArray(challengeId) ? challengeId[0] : challengeId
    if (!normalizedId) return

    const challenge = unref(challenges).find(
      (c) => c._id === normalizedId || c._id?.toString() === normalizedId
    )

    if (challenge) {
      await refreshSelectedChallenge(normalizedId)
      detailsDialogOpen.value = true
      return
    }

    try {
      const { data } = await challengeService.getChallenge(normalizedId)
      selectedChallenge.value = data
      detailsDialogOpen.value = true
    } catch (err) {
      console.error('Error loading challenge:', err)
    }
  }

  function clearChallengeIdQuery(router, route) {
    const nextQuery = { ...route.query }
    delete nextQuery.challengeId
    router.replace({ path: route.path, query: nextQuery })
  }

  async function consumeChallengeIdFromRoute(router, route, challengeId) {
    const id = Array.isArray(challengeId) ? challengeId[0] : challengeId
    if (!id) return

    await nextTick()
    await openChallengeById(id)
    clearChallengeIdQuery(router, route)
  }

  return {
    detailsDialogOpen,
    selectedChallenge,
    selectedIsOwner,
    selectedIsParticipant,
    showDialogLeaveButton,
    selectedLeaveLoading,
    handleChallengeClick,
    refreshSelectedChallenge,
    handleDialogUpdate,
    handleDialogLeave,
    handleOwnerNavigated,
    openChallengeById,
    consumeChallengeIdFromRoute
  }
}
