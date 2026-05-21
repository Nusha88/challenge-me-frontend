/** Standard preset values shown as chips (aligned with add flow). */
export const STANDARD_CHIP_DURATIONS = ['7', '21', '30']

export function resolveDurationFields(dayCount) {
  const parsed = Number(dayCount)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return { duration: '', customDuration: '' }
  }

  const daysStr = String(parsed)

  if (STANDARD_CHIP_DURATIONS.includes(daysStr)) {
    return { duration: daysStr, customDuration: '' }
  }

  return { duration: 'custom', customDuration: daysStr }
}

export function applyDurationFieldsFromDayCount(dayCount, target) {
  const { duration, customDuration } = resolveDurationFields(dayCount)
  target.duration = duration
  target.customDuration = customDuration
}
