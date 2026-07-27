/**
 * Open the single MainLayout challenge details provider.
 * Prefer passing `challenge` for optimistic UI when available from a list cache.
 */
import { APP_EVENTS, dispatchAppEvent } from './appEvents'

export function openMissionDetails({
  challengeId = null,
  challenge = null,
  commentId = null,
  replyId = null,
  initialTab = null
} = {}) {
  const id = challengeId || challenge?._id || challenge?.id
  if (!id) return

  dispatchAppEvent(APP_EVENTS.OPEN_CHALLENGE, {
    challengeId: String(id),
    challenge: challenge || null,
    commentId: commentId || null,
    replyId: replyId || null,
    initialTab: initialTab || null
  })
}
