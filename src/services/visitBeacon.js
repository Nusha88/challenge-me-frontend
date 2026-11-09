const VISITOR_KEY = 'ignite_visitor_id'
const LOCALE_KEY = 'challenge-me-locale'
const TRACKED_ROUTES = new Set([
  'home',
  'register',
  'login',
  'forgot-password',
  'reset-password',
  'users',
  'user-profile',
  'challenges'
])
const CONVERSION_EVENTS = new Set(['register_success', 'login_success'])

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16)
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8
    return value.toString(16)
  })
}

export function getVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing) return existing
    const next = createVisitorId()
    localStorage.setItem(VISITOR_KEY, next)
    return next
  } catch {
    return createVisitorId()
  }
}

function isLoggedIn() {
  try {
    return Boolean(localStorage.getItem('token'))
  } catch {
    return false
  }
}

function storedUserId() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.id || parsed?._id || ''
  } catch {
    return ''
  }
}

function utmFromLocation() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || ''
  }
}

function collectContext() {
  return {
    visitorId: getVisitorId(),
    path: typeof window === 'undefined' ? '/' : window.location.pathname || '/',
    referrer: typeof document === 'undefined' ? '' : document.referrer || '',
    locale: (() => {
      try {
        return localStorage.getItem(LOCALE_KEY) || document.documentElement.lang || ''
      } catch {
        return document.documentElement.lang || ''
      }
    })(),
    language: typeof navigator === 'undefined' ? '' : navigator.language || '',
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
      } catch {
        return ''
      }
    })(),
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent || '',
    viewportW: typeof window === 'undefined' ? 0 : window.innerWidth || 0,
    viewportH: typeof window === 'undefined' ? 0 : window.innerHeight || 0,
    ...utmFromLocation()
  }
}

function send(payload) {
  import('./api').then(({ apiBaseUrl }) => {
    fetch(`${apiBaseUrl}/visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit'
    }).catch(() => {})
  }).catch(() => {})
}

export function trackPageview(route) {
  if (typeof window === 'undefined') return
  if (isLoggedIn()) return
  if (!TRACKED_ROUTES.has(route?.name)) return
  send({
    ...collectContext(),
    event: 'pageview',
    path: route.path || window.location.pathname || '/'
  })
}

export function trackVisitEvent(event, meta) {
  if (typeof window === 'undefined' || !event) return
  const converting = CONVERSION_EVENTS.has(event)
  if (!converting && isLoggedIn()) return
  send({
    ...collectContext(),
    event,
    userId: converting ? storedUserId() : undefined,
    meta: meta && typeof meta === 'object' ? meta : undefined
  })
}

export function startVisitTracking(router) {
  if (!router) return
  trackPageview(router.currentRoute.value)
  router.afterEach((to) => {
    trackPageview(to)
  })
}
