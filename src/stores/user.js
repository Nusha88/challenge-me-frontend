import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref(null)
  const token = ref(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  
  const userId = computed(() => {
    if (!user.value) return null
    return user.value.id || user.value._id || null
  })
  
  const userName = computed(() => user.value?.name || null)
  
  const userAvatarUrl = computed(() => user.value?.avatarUrl || null)
  
  const userXp = computed(() => Number(user.value?.xp || 0))
  
  const userEmail = computed(() => user.value?.email || null)
  
  const userCreatedAt = computed(() => user.value?.createdAt || null)

  // Actions
  function setUser(userData) {
    user.value = userData
    // Sync to localStorage for persistence
    if (userData) {
      try {
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (error) {
        console.error('Failed to save user to localStorage:', error)
      }
    } else {
      localStorage.removeItem('user')
    }
  }

  function updateUser(updates) {
    if (!user.value) return
    
    // Merge updates with existing user data
    user.value = { ...user.value, ...updates }
    
    // Sync to localStorage
    try {
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (error) {
      console.error('Failed to update user in localStorage:', error)
    }
  }

  function setToken(tokenValue) {
    token.value = tokenValue
    // Keep token in localStorage for axios interceptor compatibility
    if (tokenValue) {
      localStorage.setItem('token', tokenValue)
    } else {
      localStorage.removeItem('token')
    }
  }

  function clearUser() {
    user.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  function initializeFromStorage() {
    // Initialize token from localStorage
    try {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        token.value = storedToken
      }
    } catch (error) {
      console.error('Failed to read token from localStorage:', error)
    }

    // Initialize user from localStorage
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
    } catch (error) {
      console.error('Failed to read user from localStorage:', error)
      // Clear invalid data
      localStorage.removeItem('user')
    }
  }

  return {
    // State
    user,
    token,
    // Getters
    isLoggedIn,
    userId,
    userName,
    userAvatarUrl,
    userXp,
    userEmail,
    userCreatedAt,
    // Actions
    setUser,
    updateUser,
    setToken,
    clearUser,
    initializeFromStorage
  }
})
