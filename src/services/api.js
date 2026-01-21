import axios from 'axios'

function resolveDefaultBaseUrl() {
  // Default to Render backend API
  const defaultUrl = 'https://challenge-me-backend-frh7.onrender.com/api'
  
  if (typeof window === 'undefined') {
    return defaultUrl
  }

  const hostname = window.location.hostname
  const isLocal = ['localhost', '127.0.0.1'].includes(hostname) || hostname.endsWith('.local')

  // Use localhost only for local development
  if (isLocal) {
    return 'http://localhost:3000/api'
  }

  // Use Render backend for all other cases
  return defaultUrl
}

const DEFAULT_API_BASE_URL = resolveDefaultBaseUrl()
const envBaseUrl = import.meta.env.VITE_API_BASE_URL
const apiBaseUrl = (envBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '')
const envHealthcheck = import.meta.env.VITE_API_HEALTHCHECK_URL
const apiHealthcheckUrl = envHealthcheck
  ? envHealthcheck
  : (DEFAULT_API_BASE_URL.includes('challenge-me-backend-frh7.onrender.com')
      ? 'https://challenge-me-backend-frh7.onrender.com'
      : apiBaseUrl.replace(/\/api$/i, '') || apiBaseUrl)

// Create axios instance with default config
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
})

// Request interceptor
api.interceptors.request.use(
  config => {
    // Attach JWT token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    // Handle authentication errors (401/403)
    // Don't clear token for push subscription endpoints - they might fail during login
    const isPushEndpoint = error.config?.url?.includes('/push/')
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !isPushEndpoint) {
      const token = localStorage.getItem('token')
      if (token) {
        // Clear invalid token
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Dispatch auth-changed event to update UI
        window.dispatchEvent(new Event('auth-changed'))
        // Only redirect if not already on login/register page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login'
        }
      }
    }
    
    if (error.code === 'ERR_NETWORK' && apiHealthcheckUrl) {
      try {
        await axios.get(apiHealthcheckUrl, { timeout: 4000 })
      } catch (pingError) {
        console.warn('API healthcheck failed', pingError?.message)
      }
    }
    return Promise.reject(error)
  }
)

// Auth service
export const authService = {
  register: (userData) => {
    return api.post('/auth/register', userData)
  },
  login: (credentials) => {
    return api.post('/auth/login', credentials)
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
  forgotPassword: (data) => {
    return api.post('/auth/forgot-password', data)
  },
  resetPassword: (data) => {
    return api.post('/auth/reset-password', data)
  }
}

// User service
export const userService = {
  _clientDayHeaders: () => {
    // Send the CLIENT'S local calendar day + timezone offset so backend can select correct "today".
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const clientDay = `${yyyy}-${mm}-${dd}`
    const tzOffset = String(now.getTimezoneOffset()) // minutes (same as Date.getTimezoneOffset)
    return {
      'x-client-day': clientDay,
      'x-client-tz-offset': tzOffset
    }
  },
  getProfile: () => {
    return api.get('/auth/profile')
  },
  updateProfile: (userData) => {
    return api.put('/auth/profile', userData)
  },
  getAllUsers: (params = {}) => {
    return api.get('/auth/users', { params })
  },
  getTodayChecklist: () => {
    return api.get('/auth/daily-checklist/today', {
      headers: userService._clientDayHeaders()
    })
  },
  updateTodayChecklist: (tasks) => {
    return api.put('/auth/daily-checklist/today', { tasks }, {
      headers: userService._clientDayHeaders()
    })
  },
  getTomorrowChecklist: () => {
    return api.get('/auth/daily-checklist/tomorrow', {
      headers: userService._clientDayHeaders()
    })
  },
  updateTomorrowChecklist: (tasks) => {
    return api.put('/auth/daily-checklist/tomorrow', { tasks }, {
      headers: userService._clientDayHeaders()
    })
  },
  getChecklistHistory: () => {
    return api.get('/auth/daily-checklist/history', {
      headers: userService._clientDayHeaders()
    })
  },
  awardDailyBonusXp: () => {
    return api.post('/auth/xp/daily-bonus')
  }
}

// Challenge service
export const challengeService = {
  createChallenge: (payload) => {
    return api.post('/challenges', payload)
  },
  updateChallenge: (id, payload) => {
    return api.put(`/challenges/${id}`, payload)
  },
  deleteChallenge: (id) => {
    return api.delete(`/challenges/${id}`)
  },
  getChallengesByUser: (userId, options = {}) => {
    const params = {}
    if (options.excludePrivate !== undefined) {
      params.excludePrivate = options.excludePrivate
    }
    // Add filter parameters
    if (options.type) params.type = options.type
    if (options.activity) params.activity = options.activity
    if (options.participants) params.participants = options.participants
    if (options.creationDate) params.creationDate = options.creationDate
    return api.get(`/challenges/user/${userId}`, { params })
  },
  getAllChallenges: (filters = {}) => {
    const params = {}
    
    // Pagination parameters
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit
    
    // Support legacy excludeFinished parameter
    if (filters.excludeFinished !== undefined) {
      params.excludeFinished = filters.excludeFinished
    } else {
      // Default to excluding finished challenges if no filters specified
      params.excludeFinished = true
    }
    
    // Add filter parameters
    if (filters.title) params.title = filters.title
    if (filters.type) params.type = filters.type
    if (filters.owner) params.owner = filters.owner
    if (filters.popularity) params.popularity = filters.popularity
    if (filters.creationDate) params.creationDate = filters.creationDate
    
    return api.get('/challenges', { params })
  },
  getChallenge: (id) => {
    return api.get(`/challenges/${id}`)
  },
  joinChallenge: (id, payload = {}) => {
    return api.post(`/challenges/${id}/join`, payload)
  },
  leaveChallenge: (id, payload = {}) => {
    return api.post(`/challenges/${id}/leave`, payload)
  },
  updateParticipantCompletedDays: (challengeId, userId, completedDays) => {
    return api.put(`/challenges/${challengeId}/participant/${userId}/completedDays`, { completedDays })
  },
  watchChallenge: (challengeId, userId) => {
    return api.post(`/challenges/${challengeId}/watch`, { userId })
  },
  unwatchChallenge: (challengeId, userId) => {
    return api.post(`/challenges/${challengeId}/unwatch`, { userId })
  },
  getWatchedChallenges: (userId) => {
    return api.get(`/challenges/watched/${userId}`)
  },
  addComment: (challengeId, userId, text) => {
    return api.post(`/challenges/${challengeId}/comments`, { userId, text })
  },
  getComments: (challengeId) => {
    return api.get(`/challenges/${challengeId}/comments`)
  },
  deleteComment: (challengeId, commentId, userId) => {
    return api.delete(`/challenges/${challengeId}/comments/${commentId}`, { data: { userId } })
  },
  replyToComment: (challengeId, commentId, userId, text, mentionedUserId) => {
    return api.post(`/challenges/${challengeId}/comments/${commentId}/reply`, { userId, text, mentionedUserId })
  },
  deleteReply: (challengeId, commentId, replyId, userId) => {
    return api.delete(`/challenges/${challengeId}/comments/${commentId}/replies/${replyId}`, { data: { userId } })
  },
  replyToReply: (challengeId, commentId, replyId, userId, text, mentionedUserId) => {
    return api.post(`/challenges/${challengeId}/comments/${commentId}/replies/${replyId}/reply`, { userId, text, mentionedUserId })
  },
  deleteNestedReply: (challengeId, commentId, replyId, nestedReplyId, userId) => {
    return api.delete(`/challenges/${challengeId}/comments/${commentId}/replies/${replyId}/replies/${nestedReplyId}`, { data: { userId } })
  }
}

// Notification service
export const notificationService = {
  getNotifications: (userId, options = {}) => {
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit)
    if (options.unreadOnly) params.append('unreadOnly', 'true')
    return api.get(`/notifications/${userId}?${params.toString()}`)
  },
  getUnreadCount: (userId) => {
    return api.get(`/notifications/${userId}/unread-count`)
  },
  markAsRead: (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`)
  },
  markAllAsRead: (userId) => {
    return api.put(`/notifications/${userId}/read-all`)
  },
  deleteNotification: (notificationId) => {
    return api.delete(`/notifications/${notificationId}`)
  }
}

// Happiness tracking service
export const happinessService = {
  // Energy tracking
  getEnergyEntries: () => {
    return api.get('/happiness/energy')
  },
  addEnergyEntry: (entry) => {
    return api.post('/happiness/energy', entry)
  },

  // Present tracking
  getPresentEntries: () => {
    return api.get('/happiness/present')
  },
  addPresentEntry: (entry) => {
    return api.post('/happiness/present', entry)
  },

  // Future tracking
  getFutureEntries: () => {
    return api.get('/happiness/future')
  },
  addFutureEntry: (entry) => {
    return api.post('/happiness/future', entry)
  }
}

// Push notification service
export const pushService = {
  getVapidPublicKey: () => {
    return api.get('/push/vapid-public-key')
  },
  subscribe: (subscription) => {
    return api.post('/push/subscribe', { subscription })
  },
  unsubscribe: () => {
    return api.post('/push/unsubscribe')
  },
  getStatus: () => {
    return api.get('/push/status')
  }
}

export default api 