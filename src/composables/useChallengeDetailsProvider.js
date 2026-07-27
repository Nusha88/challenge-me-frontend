import { ref, computed } from 'vue'
import { challengeService } from '../services/api'
import {
  openChallengeDetails,
  refreshChallengeInBackground
} from '../utils/openChallengeDetails'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import {
  isChallengeOwner,
  isChallengeParticipant,
  canJoinHabitChallenge
} from '../utils/challengeMembership'
import { isChallengeEnded } from '../utils/challengeStatus'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { useUserStore } from '../stores/user'
import { useXpAwardFeedback } from './useXpAwardFeedback'

// Single shared dialog state (one provider for the whole app)
const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
const scrollTarget = ref(null)
const initialTab = ref('progress')
const loading = ref(false)
const joinLoading = ref(false)
const leaveLoading = ref(false)

function getUserId() {
  return useUserStore().userId
}

function resetDialogState() {
  scrollTarget.value = null
  initialTab.value = 'progress'
  selectedChallenge.value = null
}

function notifyChallengeUpdated(challenge) {
  dispatchAppEvent(APP_EVENTS.CHALLENGE_UPDATED, {
    challengeId: challenge?._id || challenge?.id || null,
    challenge: challenge || null
  })
}

/**
 * Sole open API for mission details. Prefer passing `challenge` for optimistic UI.
 */
export async function openChallengeDetailsProvider({
  challengeId = null,
  challenge = null,
  commentId = null,
  replyId = null,
  initialTab: tab = null
} = {}) {
  const id = challengeId || challenge?._id || challenge?.id
  if (!id) return

  const hasCommentTarget = Boolean(commentId)
  scrollTarget.value = hasCommentTarget
    ? {
        commentId: String(commentId),
        replyId: replyId ? String(replyId) : null
      }
    : null
  initialTab.value = tab || (hasCommentTarget ? 'community' : 'progress')

  if (challenge) {
    openChallengeDetails(selectedChallenge, detailsDialogOpen, challenge)
    return
  }

  loading.value = true
  try {
    const { data } = await challengeService.getChallenge(id)
    selectedChallenge.value = data
    detailsDialogOpen.value = true
  } catch (error) {
    console.error('Error opening challenge details:', error)
    resetDialogState()
    detailsDialogOpen.value = false
  } finally {
    loading.value = false
  }
}

export function useChallengeDetailsProvider() {
  const userStore = useUserStore()
  const { applyRewardResponse } = useXpAwardFeedback()

  const currentUserId = computed(() => {
    const id = userStore.userId
    return id != null ? String(id) : null
  })

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

  function handleDialogClose(open) {
    if (!open) {
      resetDialogState()
    }
  }

  async function handleDialogLeave() {
    const userId = getUserId()
    if (!selectedChallenge.value?._id || !userId) return

    leaveLoading.value = true
    try {
      const response = await challengeService.leaveChallenge(selectedChallenge.value._id, {
        userId
      })
      if (response.data?.challenge) {
        selectedChallenge.value = response.data.challenge
        notifyChallengeUpdated(response.data.challenge)
      } else {
        await refreshChallengeInBackground(
          selectedChallenge,
          selectedChallenge.value._id,
          selectedChallenge.value
        )
        notifyChallengeUpdated(selectedChallenge.value)
      }
    } catch (error) {
      console.error('Error leaving challenge:', error)
    } finally {
      leaveLoading.value = false
    }
  }

  async function handleDialogJoin() {
    const userId = getUserId()
    if (!selectedChallenge.value?._id || !userId) return

    joinLoading.value = true
    try {
      const response = await challengeService.joinChallenge(selectedChallenge.value._id, {
        userId
      })
      applyRewardResponse(response)
      if (response.data?.challenge) {
        selectedChallenge.value = response.data.challenge
      }
      await refreshChallengeInBackground(
        selectedChallenge,
        selectedChallenge.value._id,
        selectedChallenge.value
      )
      notifyChallengeUpdated(selectedChallenge.value)
    } catch (error) {
      console.error('Error joining challenge:', error)
    } finally {
      joinLoading.value = false
    }
  }

  async function handleDialogUpdate() {
    if (!selectedChallenge.value?._id) return
    await refreshChallengeInBackground(
      selectedChallenge,
      selectedChallenge.value._id,
      selectedChallenge.value
    )
    notifyChallengeUpdated(selectedChallenge.value)
  }

  function openFromEvent(detail = {}) {
    return openChallengeDetailsProvider({
      challengeId: detail.challengeId,
      challenge: detail.challenge || null,
      commentId: detail.commentId || null,
      replyId: detail.replyId || null,
      initialTab: detail.initialTab || null
    })
  }

  return {
    detailsDialogOpen,
    selectedChallenge,
    scrollTarget,
    initialTab,
    loading,
    joinLoading,
    leaveLoading,
    selectedIsOwner,
    selectedIsParticipant,
    showDialogJoinButton,
    showDialogLeaveButton,
    openChallenge: openChallengeDetailsProvider,
    openFromEvent,
    handleDialogClose,
    handleDialogLeave,
    handleDialogJoin,
    handleDialogUpdate
  }
}
