import { ref, computed } from 'vue'
import { refreshChallengeInBackground } from '../utils/openChallengeDetails'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import {
  isChallengeOwner,
  isChallengeParticipant,
  canJoinHabitChallenge
} from '../utils/challengeMembership'
import { isChallengeEnded } from '../utils/challengeStatus'

export function useGlobalChallengeDialog(currentUserId) {
  const detailsDialogOpen = ref(false)
  const selectedChallenge = ref(null)
  const scrollTarget = ref(null)
  const initialTab = ref('progress')
  const loading = ref(false)

  const selectedIsOwner = computed(() => {
    if (!selectedChallenge.value) return false
    return isChallengeOwner(selectedChallenge.value.owner, currentUserId)
  })

  const selectedIsParticipant = computed(() => {
    if (!selectedChallenge.value) return false
    return isChallengeParticipant(selectedChallenge.value, currentUserId)
  })

  const showDialogJoinButton = computed(() => {
    if (!selectedChallenge.value) return false
    return canJoinHabitChallenge(selectedChallenge.value, currentUserId)
  })

  const showDialogLeaveButton = computed(() => {
    if (!selectedChallenge.value) return false
    if (isChallengeEnded(selectedChallenge.value)) return false
    if (selectedChallenge.value.challengeType !== CHALLENGE_TYPES.HABIT) return false
    return (
      !!currentUserId.value &&
      !selectedIsOwner.value &&
      selectedIsParticipant.value
    )
  })

  function resetDialogState() {
    scrollTarget.value = null
    initialTab.value = 'progress'
    selectedChallenge.value = null
  }

  async function openFromNotification({ challengeId, commentId = null, replyId = null }) {
    if (!challengeId) return

    const hasCommentTarget = Boolean(commentId)
    scrollTarget.value = hasCommentTarget
      ? {
          commentId: String(commentId),
          replyId: replyId ? String(replyId) : null
        }
      : null
    initialTab.value = hasCommentTarget ? 'community' : 'progress'

    detailsDialogOpen.value = true
    selectedChallenge.value = null
    loading.value = true

    try {
      const data = await refreshChallengeInBackground(selectedChallenge, challengeId)
      if (!data) {
        resetDialogState()
        detailsDialogOpen.value = false
      }
    } catch (error) {
      console.error('Error opening challenge from notification:', error)
      resetDialogState()
      detailsDialogOpen.value = false
    } finally {
      loading.value = false
    }
  }

  function handleDialogClose(open) {
    if (!open) {
      resetDialogState()
    }
  }

  return {
    detailsDialogOpen,
    selectedChallenge,
    scrollTarget,
    initialTab,
    loading,
    selectedIsOwner,
    selectedIsParticipant,
    showDialogJoinButton,
    showDialogLeaveButton,
    openFromNotification,
    handleDialogClose
  }
}
