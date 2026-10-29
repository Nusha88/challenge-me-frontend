import { challengeService } from '../services/api'

const TTL_MS = 15000

let inflight = null
let cache = {
  userId: null,
  at: 0,
  challenges: []
}

export async function loadMyMissionsList(userId, { force = false } = {}) {
  if (!userId) return []

  const id = String(userId)
  if (
    !force
    && cache.userId === id
    && Date.now() - cache.at < TTL_MS
  ) {
    return cache.challenges
  }

  if (inflight) return inflight

  inflight = (async () => {
    const { data } = await challengeService.getChallengesByUser(id, {
      excludePrivate: false,
      view: 'list'
    })
    cache = {
      userId: id,
      at: Date.now(),
      challenges: data?.challenges || []
    }
    return cache.challenges
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export function patchMyMissionsListCache(challenge) {
  if (!challenge?._id || cache.userId == null) return
  const id = String(challenge._id)
  const index = cache.challenges.findIndex((item) => String(item._id) === id)
  if (index === -1) {
    cache.challenges = [challenge, ...cache.challenges]
    return
  }
  const next = [...cache.challenges]
  next[index] = { ...next[index], ...challenge }
  cache.challenges = next
}

export function clearMyMissionsListCache() {
  cache = { userId: null, at: 0, challenges: [] }
  inflight = null
}
