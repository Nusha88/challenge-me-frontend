export function getChronicleActorId(activity) {
  return activity?.actor?._id || activity?.actor || null
}

export function getChronicleActorName(activity) {
  return activity?.actor?.name || ''
}

export function getChronicleActorInitial(activity) {
  const name = getChronicleActorName(activity)
  return name ? name.charAt(0).toUpperCase() : '?'
}

export function getChronicleEventText(activity, t) {
  const title = activity?.payload?.title || t('chronicle.aRitual')
  const level = activity?.payload?.level
  const streak = activity?.payload?.streak

  switch (activity?.type) {
    case 'checkin':
      return t('chronicle.events.checkin', { title })
    case 'ritual_complete':
      return t('chronicle.events.ritualComplete', { title })
    case 'squad_joined':
      return t('chronicle.events.squadJoined', { title })
    case 'level_up':
      return t('chronicle.events.levelUp', { level })
    case 'streak_milestone':
      return t('chronicle.events.streak', { streak })
    default:
      return ''
  }
}
