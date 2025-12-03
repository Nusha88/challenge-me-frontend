import axios from 'axios'

function resolveDefaultBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/api'
  }

  const hostname = window.location.hostname
  const isLocal = ['localhost', '127.0.0.1'].includes(hostname) || hostname.endsWith('.local')

  if (isLocal) {
    return 'http://localhost:3000/api'
  }

  // Hosted fallback (Render backend)
  return 'https://challenge-me-backend-frh7.onrender.com/api'
}

const DEFAULT_API_BASE_URL = resolveDefaultBaseUrl()
const envBaseUrl = import.meta.env.VITE_API_BASE_URL
const apiBaseUrl = (envBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '')
const envHealthcheck = import.meta.env.VITE_API_HEALTHCHECK_URL
const apiHealthcheckUrl = envHealthcheck
  ? envHealthcheck
  : (DEFAULT_API_BASE_URL === 'https://challenge-me-backend-frh7.onrender.com/api'
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
  }
}

// User service
export const userService = {
  getProfile: () => {
    return api.get('/auth/profile')
  },
  updateProfile: (userData) => {
    return api.put('/auth/profile', userData)
  },
  getAllUsers: () => {
    return api.get('/auth/users')
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
  getChallengesByUser: (userId) => {
    return api.get(`/challenges/user/${userId}`)
  },
  getAllChallenges: () => {
    return api.get('/challenges')
  },
  joinChallenge: (id, payload = {}) => {
    return api.post(`/challenges/${id}/join`, payload)
  },
  updateParticipantCompletedDays: (challengeId, userId, completedDays) => {
    return api.put(`/challenges/${challengeId}/participant/${userId}/completedDays`, { completedDays })
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

export default api 