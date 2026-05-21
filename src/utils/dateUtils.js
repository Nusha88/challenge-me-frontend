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

export function getDaysUntil(endValue, fromValue = new Date()) {
  const from = startOfDay(fromValue)
  const end = startOfDay(endValue)

  if (Number.isNaN(end.getTime())) {
    return 0
  }

  const diffDays = Math.ceil((end - from) / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
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
