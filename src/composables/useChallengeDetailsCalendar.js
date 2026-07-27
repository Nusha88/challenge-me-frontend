/**
 * Calendar day-class helpers shared by HabitProgressCalendar / ChallengeDetailsDialog.
 */
export function isDayProtected(day) {
  return !day.isUserNormalCompleted && (day.isUserFrozen || day.isUserSecondChance)
}

export function buildDayClass(day, { isFinished, isCurrentUserParticipant }) {
  return {
    'is-completed': day.isUserNormalCompleted,
    'protected-day': isDayProtected(day),
    'is-missed': day.isMissed,
    'is-today': day.isToday,
    'is-locked': day.isLocked,
    'is-pre-join': day.isBeforeJoin,
    'is-join-marker': day.isJoinMarker,
    'is-disabled':
      day.isBeforeJoin ||
      isFinished ||
      !day.isToday ||
      !isCurrentUserParticipant ||
      day.isScheduled === false
  }
}
