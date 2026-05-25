/**
 * Read XP awarded by the backend from an API response.
 * Frontend must never send XP amounts — only display what the server returns.
 */
export function getXpGainedFromResponse(data) {
  if (!data) return 0

  if (data.xp && typeof data.xp === 'object') {
    const gained = Number(data.xp.gained)
    if (Number.isFinite(gained) && gained > 0) return gained
  }

  if (data.xpAward && typeof data.xpAward === 'object') {
    const gained = Number(data.xpAward.gained)
    if (Number.isFinite(gained) && gained > 0) return gained
  }

  const legacy = Number(data.xpGained)
  if (Number.isFinite(legacy) && legacy > 0) return legacy

  return 0
}

export function getUserFromResponse(data) {
  return data?.user || null
}
