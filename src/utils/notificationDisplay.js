export function getNotificationIcon(type) {
  const icons = {
    comment: 'mdi-comment-text-outline',
    join: 'mdi-sword-cross',
    mention: 'mdi-at',
    watch: 'mdi-eye-outline',
    daily_recap: 'mdi-weather-sunset-up',
    referral_completed: 'mdi-gift'
  }
  return icons[type] || 'mdi-bell-ring-outline'
}

export function getNotificationSenderName(notification, t) {
  if (notification.type === 'daily_recap') {
    return notification.title || t('notifications.dailyRecapTitle')
  }
  return notification.fromUserId?.name || t('common.unknown')
}

export function getNotificationText(notification, t) {
  const mission = notification.challengeId?.title || t('notifications.challenge')

  if (notification.type === 'daily_recap') {
    return notification.body || t('notifications.dailyRecapFallback')
  }
  if (notification.type === 'referral_completed') {
    const friendName = notification.fromUserId?.name || t('common.unknown')
    return notification.body || t('referral.notificationText', { name: friendName })
  }
  if (notification.type === 'mention') {
    return t('notifications.mentionedInComment', { mission })
  }
  if (notification.type === 'join') {
    return t('notifications.userJoinedChallenge', { mission })
  }
  if (notification.type === 'watch') {
    return t('notifications.userWatchingChallenge', { mission })
  }
  return t('notifications.newComment', { mission })
}

export function getNotificationInitial(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}
