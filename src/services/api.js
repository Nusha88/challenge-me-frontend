import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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
    if (error.code === 'ERR_NETWORK') {
      try {
        await axios.get('http://localhost:3000/')
      } catch (pingError) {}
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
    return api.put('/users/profile', userData)
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
  getChallengesByUser: (userId) => {
    return api.get(`/challenges/user/${userId}`)
  },
  getAllChallenges: () => {
    return api.get('/challenges')
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