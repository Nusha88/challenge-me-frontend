function startOfDay(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export function toDateInputValue(value = new Date()) {
  const date = startOfDay(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function normalizeDateInputValue(value) {
  if (!value) {
    return ''
  }

  const stringValue = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue
  }

  return toDateInputValue(value)
}

export function addDays(value, days) {
  const date = startOfDay(value)
  date.setDate(date.getDate() + days)
  return date
}

export function getInclusiveDaysBetween(startValue, endValue) {
  const start = startOfDay(startValue)
  const end = startOfDay(endValue)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }

  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
}

export function getDurationDaysString(startValue, endValue) {
  const days = getInclusiveDaysBetween(startValue, endValue)
  return days > 0 ? String(days) : ''
}

function parseDurationDayCount(duration, customDuration = '') {
  if (!duration) {
    return NaN
  }

  if (duration === 'custom') {
    return parseInt(String(customDuration || ''), 10)
  }

  return parseInt(String(duration), 10)
}

export function calculateEndDateFromDuration(startDate, duration, customDuration = '') {
  if (!startDate || !duration) {
    return ''
  }

  const days = parseDurationDayCount(duration, customDuration)

  if (!Number.isFinite(days) || days < 1) {
    return ''
  }

  return toDateInputValue(addDays(startDate, days - 1))
}

export function getDaysUntil(endValue, fromValue = new Date()) {
  const from = startOfDay(fromValue)
  const end = startOfDay(endValue)

  if (Number.isNaN(end.getTime())) {
    return 0
  }

  const diffDays = Math.ceil((end - from) / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

export function isPastDate(value, reference = new Date()) {
  if (!value) {
    return false
  }

  const date = startOfDay(value)
  const ref = startOfDay(reference)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date < ref
}

export function isFutureDate(value, reference = new Date()) {
  if (!value) {
    return false
  }

  const date = startOfDay(value)
  const ref = startOfDay(reference)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date > ref
}

export function formatDateForLocale(value, locale) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

export function normalizeDateList(dates) {
  if (!Array.isArray(dates)) {
    return []
  }

  return dates
    .map((entry) => normalizeDateInputValue(entry))
    .filter((entry) => entry && /^\d{4}-\d{2}-\d{2}$/.test(entry))
    .sort()
}
