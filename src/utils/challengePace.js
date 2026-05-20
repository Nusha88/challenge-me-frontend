import { Footprints, Rocket, Flame, Compass, Pause, Zap } from 'lucide-vue-next'

const PACE_ICONS = {
  firstSteps: Footprints,
  atPeak: Rocket,
  inTheGame: Flame,
  onTheWay: Compass,
  tookPause: Pause,
  needImpulse: Zap
}

/**
 * Resolve habit mission pace tier from completion rate vs. time elapsed.
 * @param {number} completionRatePercent - completed scheduled days / days passed (0–100)
 * @param {number} timePassedPercent - days passed / total mission days (0–100)
 * @returns {{ key: string, icon: import('vue').Component }}
 */
export function getPaceStatus(completionRatePercent, timePassedPercent) {
  const completion = Math.max(0, Math.min(100, Number(completionRatePercent) || 0))
  const timePassed = Math.max(0, Math.min(100, Number(timePassedPercent) || 0))

  let key = 'needImpulse'

  if (timePassed <= 20) {
    key = 'firstSteps'
  } else if (completion >= 90) {
    key = 'atPeak'
  } else if (completion >= 75) {
    key = 'inTheGame'
  } else if (completion >= 50) {
    key = 'onTheWay'
  } else if (completion >= 25) {
    key = 'tookPause'
  } else {
    key = 'needImpulse'
  }

  return {
    key,
    icon: PACE_ICONS[key]
  }
}
