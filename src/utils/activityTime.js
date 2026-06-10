export function formatActivityTime(timestamp, { t, locale, keyPrefix = 'challenges.comments' }) {
  if (!timestamp) return ''

  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t(`${keyPrefix}.justNow`)
    if (diffMins < 60) return t(`${keyPrefix}.minutesAgo`, { count: diffMins })
    if (diffHours < 24) return t(`${keyPrefix}.hoursAgo`, { count: diffHours })
    if (diffDays < 7) return t(`${keyPrefix}.daysAgo`, { count: diffDays })

    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(date)
  } catch {
    return new Date(timestamp).toLocaleDateString()
  }
}
