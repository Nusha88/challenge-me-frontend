import { challengeService } from '../services/api'

export function challengeIdsMatch(a, b) {
  if (a == null || b == null) return false
  return String(a) === String(b)
}

/**
 * Opens the challenge details dialog immediately with cached list data,
 * then refreshes from the API in the background.
 */
export function openChallengeDetails(
  selectedChallenge,
  detailsDialogOpen,
  challenge,
  { skipFetch = false, onRefreshed } = {}
) {
  if (!challenge?._id) return

  selectedChallenge.value = challenge
  detailsDialogOpen.value = true

  if (skipFetch) return

  refreshChallengeInBackground(selectedChallenge, challenge._id, challenge).then((data) => {
    if (data) onRefreshed?.(data)
  })
}

export async function refreshChallengeInBackground(
  selectedChallenge,
  challengeId,
  fallback = null,
  { onRefreshed } = {}
) {
  const id = challengeId?._id ?? challengeId
  if (!id) return null

  try {
    const { data } = await challengeService.getChallenge(id)
    if (challengeIdsMatch(selectedChallenge.value?._id, id)) {
      selectedChallenge.value = data
    }
    onRefreshed?.(data)
    return data
  } catch {
    if (fallback && challengeIdsMatch(selectedChallenge.value?._id, id)) {
      selectedChallenge.value = fallback
    }
    return null
  }
}
