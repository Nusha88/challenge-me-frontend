import { ref, computed, watch, nextTick, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { challengeService } from '../services/api'
import {
  openChallengeDetails,
  refreshChallengeInBackground
} from '../utils/openChallengeDetails'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { isChallengeEnded, canOpenChallenge } from '../utils/challengeStatus'

function isChallengeOwner(owner, currentUserId) {
  const userId = unref(currentUserId)
  if (!owner || !userId) return false
  const ownerId = owner._id || owner
  return ownerId === userId
}

function isParticipant(challenge, currentUserId) {
  const userId = unref(currentUserId)
  if (!userId) return false
  return (challenge.participants || []).some((participant) => {
    const participantId =
      participant.userId?._id || participant.userId || participant._id || participant
    return participantId && participantId.toString() === userId.toString()
  })
}

export function useAllChallengesDialog({
  challenges,
  loading,
  currentUserId,
  errorMessage,
  fetchChallenges,
  currentPage,
  joinChallenge,
  leaveChallenge,
  joiningId,
  leavingId,
  router,
  route
}) {
  const { t } = useI18n()

  const detailsDialogOpen = ref(false)
  const selectedChallenge = ref(null)
  const dialogScrollTarget = ref(null)
  const dialogInitialTab = ref('progress')
  const isOpeningChallenge = ref(false)
  const saveLoading = ref(false)
  const saveError = ref('')
  const deleteLoading = ref(false)

  const selectedIsOwner = computed(() => {
    if (!selectedChallenge.value) return false
    return isChallengeOwner(selectedChallenge.value.owner, currentUserId)
  })

  const selectedIsParticipant = computed(() => {
    if (!selectedChallenge.value) return false
    return isParticipant(selectedChallenge.value, currentUserId)
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

  function navigateToMissionsList() {
    router.replace({ path: '/missions', query: route.query })
  }

  function parseCommentHash(hash) {
    const normalized = (hash || '').replace('#', '')
    if (!normalized.startsWith('comment-')) return null

    const parts = normalized.split('-')
    if (parts.length < 2) return null

    return {
      commentId: parts[1],
      replyId: parts.length >= 3 ? parts[2] : null
    }
  }

  function applyScrollTargetFromRoute() {
    const target = parseCommentHash(route.hash)
    dialogScrollTarget.value = target
    dialogInitialTab.value = target ? 'community' : 'progress'
  }

  function clearDialogScrollTarget() {
    dialogScrollTarget.value = null
    dialogInitialTab.value = 'progress'
  }

  watch(detailsDialogOpen, (value) => {
    if (!value && !isOpeningChallenge.value) {
      selectedChallenge.value = null
      saveError.value = ''
      clearDialogScrollTarget()
      if (route.params.id) {
        nextTick(() => {
          navigateToMissionsList()
        })
      }
    }
  })

  async function refreshSelectedChallenge(challengeId) {
    const fallback =
      unref(challenges).find((c) => c._id === challengeId) || selectedChallenge.value
    await refreshChallengeInBackground(selectedChallenge, challengeId, fallback)
  }

  function openDetails(challenge, { skipFetch = false, preserveScrollTarget = false } = {}) {
    if (isOpeningChallenge.value) return
    if (!canOpenChallenge(challenge, unref(currentUserId))) return

    if (!preserveScrollTarget) {
      clearDialogScrollTarget()
    }

    isOpeningChallenge.value = true
    saveError.value = ''

    openChallengeDetails(selectedChallenge, detailsDialogOpen, challenge, { skipFetch })

    isOpeningChallenge.value = false

    if (String(route.params.id) !== String(challenge._id)) {
      router.replace({ path: `/missions/${challenge._id}`, hash: route.hash })
    }
  }

  async function openChallengeById(challengeId) {
    if (!challengeId) return

    applyScrollTargetFromRoute()

    let challenge = unref(challenges).find((c) => String(c._id) === String(challengeId))
    let skipFetch = false

    if (!challenge) {
      try {
        const { data } = await challengeService.getChallenge(challengeId)
        challenge = data
        skipFetch = true

        if (challenge && challenge.privacy !== 'private') {
          const existingChallenge = unref(challenges).find((c) => String(c._id) === String(challengeId))
          if (!existingChallenge) {
            challenges.value.push(challenge)
          } else {
            challenge = existingChallenge
          }
        }
      } catch (error) {
        console.error('Error fetching challenge:', error)
        errorMessage.value = error.response?.data?.message || t('challenges.notFound')
        return
      }
    }

    if (challenge) {
      if (!canOpenChallenge(challenge, unref(currentUserId))) {
        errorMessage.value = t('challenges.upcomingOwnerOnly')
        return
      }
      await openDetails(challenge, { skipFetch, preserveScrollTarget: true })
    }
  }

  async function handleDialogSave(formData) {
    if (!selectedChallenge.value) return

    saveLoading.value = true
    saveError.value = ''

    try {
      await challengeService.updateChallenge(selectedChallenge.value._id, { ...formData })
      await fetchChallenges(unref(currentPage), false)
      if (selectedChallenge.value) {
        const updatedChallenge = unref(challenges).find(
          (c) => c._id === selectedChallenge.value._id
        )
        if (updatedChallenge) {
          selectedChallenge.value = updatedChallenge
        }
      }
      detailsDialogOpen.value = false
    } catch (error) {
      saveError.value = error.response?.data?.message || t('notifications.updateError')
    } finally {
      saveLoading.value = false
    }
  }

  async function handleDialogUpdate() {
    await fetchChallenges(unref(currentPage), false)
    if (selectedChallenge.value) {
      const updatedChallenge = unref(challenges).find(
        (c) => c._id === selectedChallenge.value._id
      )
      if (updatedChallenge) {
        selectedChallenge.value = updatedChallenge
      }
    }
  }

  async function handleDialogJoin() {
    if (!selectedChallenge.value) return
    await joinChallenge(selectedChallenge.value)
  }

  async function handleDialogLeave() {
    if (!selectedChallenge.value) return
    await leaveChallenge(selectedChallenge.value)
  }

  async function handleDialogDelete(challengeId) {
    if (!challengeId) return

    deleteLoading.value = true
    saveError.value = ''

    try {
      await challengeService.deleteChallenge(challengeId)
      await fetchChallenges(unref(currentPage), false)
      detailsDialogOpen.value = false
    } catch (error) {
      saveError.value = error.response?.data?.message || t('notifications.deleteChallengeError')
    } finally {
      deleteLoading.value = false
    }
  }

  function handleOwnerNavigated() {
    detailsDialogOpen.value = false
  }

  function setupRouteWatchers() {
    watch(
      () => route.params.id,
      (newId, oldId) => {
        if (isOpeningChallenge.value) return

        if (newId && newId !== oldId) {
          if (detailsDialogOpen.value && selectedChallenge.value?._id === newId) {
            return
          }
          nextTick(() => {
            openChallengeById(newId)
          })
        } else if (!newId && oldId && !isOpeningChallenge.value) {
          nextTick(() => {
            detailsDialogOpen.value = false
          })
        }
      }
    )
  }

  return {
    detailsDialogOpen,
    selectedChallenge,
    dialogScrollTarget,
    dialogInitialTab,
    selectedIsOwner,
    selectedIsParticipant,
    selectedJoinLoading,
    selectedLeaveLoading,
    showDialogJoinButton,
    showDialogLeaveButton,
    saveLoading,
    saveError,
    deleteLoading,
    openDetails,
    openChallengeById,
    refreshSelectedChallenge,
    handleDialogSave,
    handleDialogUpdate,
    handleDialogJoin,
    handleDialogLeave,
    handleDialogDelete,
    handleOwnerNavigated,
    setupRouteWatchers
  }
}
