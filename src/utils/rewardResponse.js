import { getXpGainedFromResponse, getUserFromResponse } from './xpResponse'

export { getXpGainedFromResponse, getUserFromResponse }

/**
 * Read Sparks awarded by the backend from an API response.
 */
export function getSparksGainedFromResponse(data) {
  if (!data) return 0

  if (data.sparksAward && typeof data.sparksAward === 'object') {
    const gained = Number(data.sparksAward.gained)
    if (Number.isFinite(gained) && gained > 0) return gained
  }

  const legacy = Number(data.sparksGained)
  if (Number.isFinite(legacy) && legacy > 0) return legacy

  return 0
}
