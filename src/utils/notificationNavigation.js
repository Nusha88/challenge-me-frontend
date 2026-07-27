/**
 * Resolve where a notification click should go.
 * @returns {{ kind: 'route', path: string } | { kind: 'challenge', challengeId: string, commentId: string|null, replyId: string|null } | { kind: 'noop' }}
 */
export function resolveNotificationNavigation(notification) {
  if (!notification) return { kind: 'noop' }

  if (notification.type === 'daily_recap') {
    return { kind: 'route', path: '/today' }
  }

  if (notification.type === 'referral_completed') {
    const friendId = notification.fromUserId?._id || notification.fromUserId
    if (!friendId) return { kind: 'noop' }
    return { kind: 'route', path: `/heroes/${friendId}` }
  }

  const challengeId = notification.challengeId?._id || notification.challengeId
  if (!challengeId) return { kind: 'noop' }

  return {
    kind: 'challenge',
    challengeId: String(challengeId),
    commentId: notification.commentId ? String(notification.commentId) : null,
    replyId: notification.replyId ? String(notification.replyId) : null
  }
}
