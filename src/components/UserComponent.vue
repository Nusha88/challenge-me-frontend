<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userService, challengeService, pushService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'
import { useUserStore } from '../stores/user'
import { 
  getNotificationPermission, 
  requestAndSubscribeToPushNotifications,
  isSubscribedToPushNotifications 
} from '../utils/pushNotifications'
import { getLevelFromXp, getXpForLevel, getXpForNextLevel, getRank, getLevelInfo, getRankIcon } from '../utils/levelSystem'

const props = defineProps({
  userId: {
    type: String,
    default: null
  }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { t, locale } = useI18n()
const availableLocales = SUPPORTED_LOCALES

const currentLocale = computed(() => locale.value)

const currentLocaleLabel = computed(() => {
  return availableLocales.find(lang => lang.code === locale.value)?.label || locale.value
})

function changeLanguage(code) {
  setLocale(code)
}

const user = ref(null)
const challenges = ref([])
const loading = ref(false)
const error = ref('')
const checklistHistory = ref([])
const heatmapChallenges = ref([])
const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
const subscribingToPush = ref(false)
const pushNotificationStatus = ref('default')
const isPushSubscribed = ref(false)
const pushNotificationError = ref('')
const pushNotificationSuccess = ref('')
const dailyRecapEnabled = ref(false)
const dailyRecapTime = ref('20:00')
const dailyRecapSaving = ref(false)
const dailyRecapError = ref('')
const dailyRecapSuccess = ref('')
const fileInputRef = ref(null)

// Hardcoded ImgBB API key for all users
const IMGBB_API_KEY = 'd8a4925b372143b44469009f92023386'

// Get current user ID from store
const currentUserId = computed(() => userStore.userId)

// Level and rank calculations
const userXp = computed(() => Number(user.value?.xp || 0))
const userLevel = computed(() => getLevelFromXp(userXp.value))
const userRank = computed(() => getRank(userLevel.value))
const xpForCurrentLevel = computed(() => getXpForLevel(userLevel.value))
const xpForNextLevel = computed(() => getXpForNextLevel(userLevel.value))
const xpProgress = computed(() => Math.max(0, userXp.value - xpForCurrentLevel.value))
const levelProgressPercentage = computed(() => {
  const range = xpForNextLevel.value - xpForCurrentLevel.value
  if (range <= 0) return 100
  return Math.min(100, Math.max(0, (xpProgress.value / range) * 100))
})

// XP display values matching MainLayout format
const xpDisplayCurrent = computed(() => userXp.value)
const xpDisplayNeeded = computed(() => xpForNextLevel.value)

// Get hero rank information based on level (using helper function)
const getHeroRank = (level) => {
  const levelInfo = getLevelInfo(level)
  return {
    title: t(`profile.ranks.${levelInfo.rankKey}`),
    color: levelInfo.color,
    icon: getRankIcon(level)
  }
}

// Determine if viewing own profile
const isOwnProfile = computed(() => {
  if (!currentUserId.value) return false
  // If on /profile route, it's always own profile
  if (route.path === '/profile') return true
  // Otherwise check if the target user ID matches current user ID
  const userId = props.userId || route.params.id
  return userId && userId.toString() === currentUserId.value.toString()
})

// Get user ID from props or route
const targetUserId = computed(() => {
  // If on /profile route, use current user ID
  if (route.path === '/profile') {
    return currentUserId.value
  }
  // Otherwise use props or route params
  return props.userId || route.params.id
})

const getUserInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  const initials = parts.length === 1
    ? parts[0].slice(0, 2)
    : `${parts[0][0] || ''}${parts[1][0] || ''}`
  return initials.toUpperCase()
}

// Helper functions to determine if challenge is finished
function isChallengeEnded(challenge) {
  if (!challenge.endDate) return false
  try {
    const endDate = new Date(challenge.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    return endDate < today
  } catch {
    return false
  }
}

function isChallengeFinished(challenge) {
  // Check if endDate is in the past
  if (isChallengeEnded(challenge)) {
    return true
  }
  
  // For result challenges, check if all actions are done
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions) || challenge.actions.length === 0) {
      return false
    }
    
    // Check if all actions and their children are checked
    return challenge.actions.every(action => {
      // Parent action must be checked
      if (!action.checked) return false
      
      // All children must be checked (if any exist)
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every(child => child.checked)
      }
      
      return true
    })
  }
  
  return false
}

const daysOnSite = computed(() => {
  if (!user.value?.createdAt) return 0
  try {
    const registrationDate = new Date(user.value.createdAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    registrationDate.setHours(0, 0, 0, 0)
    
    const diffTime = today - registrationDate
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  } catch {
    return 0
  }
})

const heatmapDays = computed(() => {
  return Array.from({ length: daysOnSite.value }, (_, i) => i + 1)
})

// User missions (habit challenges) for non-current user profiles
const userMissions = computed(() => {
  if (isOwnProfile.value) return []
  return challenges.value.filter(challenge => challenge.challengeType === 'habit')
})

// Active user missions (not finished)
const activeUserMissions = computed(() => {
  if (isOwnProfile.value) return []
  return userMissions.value.filter(challenge => !isChallengeFinished(challenge))
})

// Finished user missions
const finishedUserMissions = computed(() => {
  if (isOwnProfile.value) return []
  return userMissions.value.filter(challenge => isChallengeFinished(challenge))
})

function goToUserMissions() {
  if (!targetUserId.value) return
  router.push({
    name: 'challenges',
    query: { 
      createdBy: targetUserId.value,
      isCompleted: 'true'
    }
  })
}

const fetchUser = async () => {
  // Reset checklistHistory when switching profiles
  checklistHistory.value = []
  
  // If on /profile route, fetch current user's profile
  if (route.path === '/profile') {
    loading.value = true
    error.value = ''
    try {
      const response = await userService.getProfile()
      if (response.data?.user) {
        user.value = response.data.user
        // Update store with fresh user data
        userStore.setUser(response.data.user)
        // Checklist history will be fetched in fetchHeatmapData for own profile
      } else {
        error.value = t('profile.noData')
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        error.value = t('profile.invalidToken')
        userStore.clearUser()
        window.dispatchEvent(new Event('auth-changed'))
      } else {
        error.value = err.response?.data?.message || t('notifications.profileError')
      }
    } finally {
      loading.value = false
    }
    return
  }

  // Otherwise fetch user by ID
  if (!targetUserId.value) {
    error.value = t('users.userNotFound')
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const response = await userService.getUserById(targetUserId.value)
    if (response.data?.user) {
      user.value = response.data.user
      // Set checklistHistory from user object if available
      if (response.data.user.checklistHistory) {
        checklistHistory.value = response.data.user.checklistHistory
      } else {
        checklistHistory.value = []
      }
    } else {
      error.value = t('users.userNotFound')
    }
  } catch (err) {
    if (err.response?.status === 404) {
      error.value = t('users.userNotFound')
    } else {
      error.value = err.response?.data?.message || t('notifications.usersError')
    }
  } finally {
    loading.value = false
  }
}

const fetchChallenges = async () => {
  // Skip fetching challenges when viewing own profile (they're shown in My Challenges page)
  if (isOwnProfile.value) {
    challenges.value = []
    return
  }

  const userId = targetUserId.value
  
  if (!userId) {
    return
  }
  
  try {
    // Exclude private challenges when viewing other users' profiles
    const excludePrivate = true
    const { data } = await challengeService.getChallengesByUser(userId, { excludePrivate })
    challenges.value = data?.challenges || []
  } catch (err) {
    // Error fetching challenges
  }
}

// Watch for changes in target user ID
watch(targetUserId, (newUserId, oldUserId) => {
  // Only refetch if the user ID actually changed
  if (newUserId && newUserId.toString() !== (oldUserId?.toString() || '')) {
    user.value = null
    challenges.value = []
    error.value = ''
    fetchUser()
    fetchChallenges()
  }
}, { immediate: false })

watch(() => props.userId, (newId, oldId) => {
  if (newId && newId.toString() !== (oldId?.toString() || '')) {
    user.value = null
    challenges.value = []
    error.value = ''
    fetchUser()
    fetchChallenges()
  }
})

watch(() => route.path, (newPath, oldPath) => {
  // Reset state when route changes (e.g., from /heroes/:id to /profile)
  if (newPath !== oldPath) {
    user.value = null
    challenges.value = []
    error.value = ''
    fetchUser()
    fetchChallenges()
  }
}, { immediate: false })

watch(() => route.params.id, (newId, oldId) => {
  // Only refetch if the ID actually changed
  if (newId !== oldId) {
    user.value = null
    challenges.value = []
    error.value = ''
    fetchUser()
    fetchChallenges()
  }
})

// Watch for when user is loaded to fetch heatmap data
watch(() => user.value, async (newUser, oldUser) => {
  // When user object is loaded or changes, fetch heatmap data
  // This is especially important for current user profile where checklist history needs to be fetched separately
  if (newUser && newUser !== oldUser && !loading.value) {
    // Small delay to ensure user object is fully set
    await nextTick()
    await fetchHeatmapData()
  }
}, { immediate: false, deep: false })

// Watch for when viewing own profile to check push notification status
watch(isOwnProfile, (newValue) => {
  if (newValue) {
    checkPushNotificationStatus()
    loadDailyRecapSettings()
  }
}, { immediate: true })

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function getRecapLanguageCode() {
  return String(locale.value || 'en').startsWith('ru') ? 'ru' : 'en'
}

async function loadDailyRecapSettings() {
  if (!isOwnProfile.value) return
  dailyRecapError.value = ''
  try {
    const response = await pushService.getDailyRecapSettings()
    dailyRecapEnabled.value = !!response.data?.dailyRecapEnabled
    dailyRecapTime.value = response.data?.dailyRecapTime || '20:00'
  } catch {
    dailyRecapError.value = t('profile.dailyRecapError')
  }
}

async function saveDailyRecapSettings() {
  if (!isOwnProfile.value) return
  dailyRecapSaving.value = true
  dailyRecapError.value = ''
  dailyRecapSuccess.value = ''

  try {
    await pushService.updateDailyRecapSettings({
      dailyRecapEnabled: !!dailyRecapEnabled.value,
      dailyRecapTime: dailyRecapTime.value || '20:00',
      dailyRecapTimezone: getBrowserTimezone(),
      dailyRecapLanguage: getRecapLanguageCode()
    })
    dailyRecapSuccess.value = t('profile.dailyRecapSaved')
  } catch {
    dailyRecapError.value = t('profile.dailyRecapError')
  } finally {
    dailyRecapSaving.value = false
  }
}

async function handleDailyRecapToggle(value) {
  dailyRecapEnabled.value = !!value
  await saveDailyRecapSettings()
}

const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      } else {
        reject(new Error('Unable to read file'))
      }
    }
    reader.onerror = () => reject(reader.error || new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

const handleAvatarSelection = async (files) => {
  uploadError.value = ''
  uploadSuccess.value = ''

  if (!files || (Array.isArray(files) && files.length === 0)) {
    return
  }

  const file = Array.isArray(files) ? files[0] : files
  if (!file) return

  if (!file.type.startsWith('image/')) {
    uploadError.value = t('profile.uploadInvalidType')
    return
  }

  const maxSizeMb = 5
  if (file.size > maxSizeMb * 1024 * 1024) {
    uploadError.value = t('profile.uploadTooLarge', { size: maxSizeMb })
    return
  }

  uploading.value = true

  try {
    const base64 = await readFileAsBase64(file)
    
    // ImgBB API expects form-encoded data, not FormData
    const formData = new URLSearchParams()
    formData.append('image', base64)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    const payload = await response.json()

    if (!response.ok || !payload.success) {
      const errorMsg = payload?.error?.message || payload?.data?.error?.message || 'Upload failed'
      throw new Error(errorMsg)
    }

    const imageUrl = payload?.data?.url || payload?.data?.display_url
    if (!imageUrl) {
      throw new Error('Upload did not return an image URL')
    }

    const updateResponse = await userService.updateProfile({ avatarUrl: imageUrl })
    user.value = updateResponse.data.user

    // Update store with new avatar URL
    userStore.updateUser({ avatarUrl: imageUrl })
    if (user.value?.name) {
      userStore.updateUser({ name: user.value.name })
    }

    uploadSuccess.value = t('profile.uploadSuccess')
    window.dispatchEvent(new Event('auth-changed'))
  } catch (err) {
    uploadError.value = err.message || t('profile.uploadError')
  } finally {
    uploading.value = false
  }
}

const triggerFileInput = () => {
  if (uploading.value || !fileInputRef.value) return
  fileInputRef.value.click()
}

const handleFileInputChange = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    handleAvatarSelection(files[0])
  }
  // Reset input so same file can be selected again
  if (event.target) {
    event.target.value = ''
  }
}

async function checkPushNotificationStatus() {
  try {
    pushNotificationStatus.value = getNotificationPermission()
    
    if (pushNotificationStatus.value === 'granted') {
      try {
        const browserHasSubscription = await isSubscribedToPushNotifications()
        
        // Check if server also has the subscription
        if (browserHasSubscription) {
          try {
            const { pushService } = await import('../services/api')
            const statusResponse = await pushService.getStatus()
            const serverHasSubscription = statusResponse.data.hasSubscription
            
            // If browser has subscription but server doesn't, user needs to re-subscribe
            // (This happens when VAPID keys change and server removes invalid subscriptions)
            isPushSubscribed.value = serverHasSubscription
          } catch (error) {
            // If we can't check server status, assume browser subscription is valid
            isPushSubscribed.value = browserHasSubscription
          }
        } else {
          isPushSubscribed.value = false
        }
      } catch (error) {
        isPushSubscribed.value = false
      }
    }
  } catch (error) {
    // Error checking push notification status
  }
}

async function enablePushNotifications() {
  subscribingToPush.value = true
  pushNotificationError.value = ''
  pushNotificationSuccess.value = ''
  
  try {
    const result = await requestAndSubscribeToPushNotifications()
    
    if (result.success) {
      pushNotificationSuccess.value = t('profile.pushNotificationsEnabledSuccess')
      await checkPushNotificationStatus()
    } else if (result.reason === 'permission-denied') {
      pushNotificationError.value = t('profile.pushNotificationsPermissionDenied')
      await checkPushNotificationStatus()
    } else if (result.reason === 'error' && result.error) {
      // Show the actual error so we can debug (timeouts, network errors, etc.)
      pushNotificationError.value = result.error
    } else {
      pushNotificationError.value = t('profile.pushNotificationsEnableError')
    }
  } catch (error) {
    pushNotificationError.value = error?.message || t('profile.pushNotificationsEnableError')
  } finally {
    subscribingToPush.value = false
  }
}

// Fetch heatmap data (checklist history and challenges)
const fetchHeatmapData = async () => {
  const userId = targetUserId.value
  if (!userId) {
    return
  }

  try {
    // For own profile, always fetch checklist history (getProfile doesn't include it)
    if (isOwnProfile.value) {
      try {
        const checklistResponse = await userService.getChecklistHistory()
        checklistHistory.value = checklistResponse.data?.checklists || []
      } catch (err) {
        checklistHistory.value = []
      }
    } else {
      // For other users, checklist history should come from user object (set in fetchUser)
      // If not available, set to empty array
      if (!checklistHistory.value) {
        checklistHistory.value = []
      }
    }

    // Fetch challenges for the viewed user (needed to determine missions)
    try {
      const excludePrivate = !isOwnProfile.value
      const { data } = await challengeService.getChallengesByUser(userId, { excludePrivate })
      // Filter for habit challenges only (missions) where user is participant
      const habitChallenges = (data?.challenges || []).filter(c => {
        if (c.challengeType !== 'habit') return false
        if (!c.participants || !Array.isArray(c.participants)) return false
        // Check if the viewed user is a participant
        return c.participants.some(p => {
          const pUserId = p.userId?._id || p.userId || p._id
          return pUserId && pUserId.toString() === userId.toString()
        })
      })
      heatmapChallenges.value = habitChallenges
    } catch (err) {
      heatmapChallenges.value = []
    }
  } catch (err) {
    // Error fetching heatmap data
  }
}

// Helper function to format date string
const formatDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Get date for a specific day number (day 1 = registration date)
const getDateForDay = (dayNumber) => {
  if (!user.value?.createdAt) return null
  try {
    const registrationDate = new Date(user.value.createdAt)
    registrationDate.setHours(0, 0, 0, 0)
    const targetDate = new Date(registrationDate)
    targetDate.setDate(registrationDate.getDate() + (dayNumber - 1))
    return targetDate
  } catch {
    return null
  }
}

// Get challenges active on a specific date for the viewed user
const getChallengesForDate = (dateString, userId) => {
  if (!userId || !heatmapChallenges.value.length) return []
  
  const targetDate = new Date(dateString)
  targetDate.setHours(0, 0, 0, 0)
  const userIdStr = userId.toString()
  
  return heatmapChallenges.value.filter(challenge => {
    // Must be a habit challenge (already filtered, but double-check)
    if (challenge.challengeType !== 'habit') return false
    
    // Must have started (startDate <= targetDate)
    if (challenge.startDate) {
      const startDate = new Date(challenge.startDate)
      startDate.setHours(0, 0, 0, 0)
      if (startDate > targetDate) return false
    }
    
    // Must not be finished before target date
    if (challenge.endDate) {
      const endDate = new Date(challenge.endDate)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < targetDate) return false
    }
    
    // Must be a participant (already filtered, but double-check)
    const isParticipant = challenge.participants?.some(p => {
      const pUserId = p.userId?._id || p.userId || p._id
      if (!pUserId) return false
      return pUserId.toString() === userIdStr
    })
    
    return isParticipant
  })
}

// Check if challenge is completed on a specific date
const isChallengeCompletedOnDate = (challenge, dateString, userId) => {
  if (!challenge.participants || !userId) return false
  
  // Ensure userId is a string for comparison
  const userIdStr = userId.toString()
  
  const participant = challenge.participants.find(p => {
    const pUserId = p.userId?._id || p.userId || p._id
    if (!pUserId) return false
    return pUserId.toString() === userIdStr
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) {
    return false
  }
  
  return participant.completedDays.some(date => {
    if (!date) return false
    let dateStr = String(date)
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0]
    }
    dateStr = dateStr.substring(0, 10)
    return dateStr === dateString
  })
}

const getHeatmapLevel = (day) => {
  if (!user.value?.createdAt) return 'level-0'
  
  const targetDate = getDateForDay(day)
  if (!targetDate) return 'level-0'
  
  const dateStr = formatDateString(targetDate)
  const userId = targetUserId.value
  
  if (!userId) return 'level-0'
  
  // Find checklist entry for this date
  const checklistForDate = checklistHistory.value.find(c => {
    try {
      // clientDay is already YYYY-MM-DD string, date is a Date object
      let checklistDateStr = null
      if (c.clientDay) {
        // clientDay is already in YYYY-MM-DD format
        checklistDateStr = c.clientDay
      } else if (c.date) {
        // date is a Date object, convert to YYYY-MM-DD
        checklistDateStr = formatDateString(new Date(c.date))
      }
      if (!checklistDateStr) return false
      return checklistDateStr === dateStr
    } catch {
      return false
    }
  })
  
  // Count completed and total steps from checklist
  let completedSteps = 0
  let totalSteps = 0
  
  if (checklistForDate) {
    // Check for tasks array
    if (checklistForDate.tasks && Array.isArray(checklistForDate.tasks)) {
      totalSteps = checklistForDate.tasks.length
      completedSteps = checklistForDate.tasks.filter(t => t && t.done).length
    }
  }
  
  // Get challenges active on this date
  const challengesForDate = getChallengesForDate(dateStr, userId)
  
  // Count completed and total missions
  let completedMissions = 0
  let totalMissions = challengesForDate.length
  
  challengesForDate.forEach(challenge => {
    if (isChallengeCompletedOnDate(challenge, dateStr, userId)) {
      completedMissions++
    }
  })
  
  // Calculate percentage
  const totalItems = totalMissions + totalSteps
  if (totalItems === 0) return 'level-0'
  
  const completedItems = completedMissions + completedSteps
  const percentage = (completedItems / totalItems) * 100
  
  // Return level based on percentage
  if (percentage > 80) return 'level-3'
  if (percentage > 60) return 'level-2'
  if (percentage > 40) return 'level-1'
  return 'level-0'
}

const getTooltipText = (day) => {
  if (!user.value?.createdAt) return `Day ${day}`
  
  const targetDate = getDateForDay(day)
  if (!targetDate) return `Day ${day}`
  
  const dateStr = formatDateString(targetDate)
  const userId = targetUserId.value
  
  if (!userId) return `Day ${day}`
  
  // Find checklist entry for this date
  const checklistForDate = checklistHistory.value.find(c => {
    try {
      // clientDay is already YYYY-MM-DD string, date is a Date object
      let checklistDateStr = null
      if (c.clientDay) {
        // clientDay is already in YYYY-MM-DD format
        checklistDateStr = c.clientDay
      } else if (c.date) {
        // date is a Date object, convert to YYYY-MM-DD
        checklistDateStr = formatDateString(new Date(c.date))
      }
      if (!checklistDateStr) return false
      return checklistDateStr === dateStr
    } catch {
      return false
    }
  })
  
  // Count completed and total steps from checklist
  let completedSteps = 0
  let totalSteps = 0
  
  if (checklistForDate && checklistForDate.tasks && Array.isArray(checklistForDate.tasks)) {
    totalSteps = checklistForDate.tasks.length
    completedSteps = checklistForDate.tasks.filter(t => t && t.done).length
  }
  
  // Get challenges active on this date
  const challengesForDate = getChallengesForDate(dateStr, userId)
  
  // Count completed and total missions
  let completedMissions = 0
  let totalMissions = challengesForDate.length
  
  challengesForDate.forEach(challenge => {
    if (isChallengeCompletedOnDate(challenge, dateStr, userId)) {
      completedMissions++
    }
  })
  
  const dateFormatted = targetDate.toLocaleDateString()
  return `${dateFormatted}: ${completedMissions}/${totalMissions} missions, ${completedSteps}/${totalSteps} steps`
}

onMounted(async () => {
  await fetchUser()
  fetchChallenges()
  // Always fetch heatmap data after user is loaded (especially important for current user)
  await fetchHeatmapData()
  // Only check push notification status if viewing own profile
  if (isOwnProfile.value) {
    checkPushNotificationStatus()
    loadDailyRecapSettings()
  }
})
</script>
  <template>
    <div class="user-profile pb-10">
      <v-progress-linear v-if="loading" indeterminate color="#7048E8" class="mb-4 rounded-pill"></v-progress-linear>
    <div v-else-if="user" class="profile-layout">
      
      <v-card class="hero-header-card overflow-visible mb-6" elevation="0">
        <div class="hero-cover">
          <div class="particles-overlay"></div>
        </div>
        
        <v-card-text class="position-relative pt-0 px-6">
          <div class="d-flex flex-column flex-md-row align-center align-md-end hero-info-wrapper">
            
            <div class="avatar-container">
              <input v-if="isOwnProfile" ref="fileInputRef" type="file" accept="image/*" class="d-none" @change="handleFileInputChange" />
              <div class="avatar-glow"></div>
              <v-hover v-slot="{ isHovering, props }">
                <v-avatar 
                  size="150" 
                  v-bind="props"
                  :class="['hero-avatar', { 'clickable': isOwnProfile }]"
                  @click="isOwnProfile && triggerFileInput()"
                >
                  <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover></v-img>
                  <div v-else class="avatar-gen text-h3">{{ getUserInitials(user.name) }}</div>
                  
                  <v-fade-transition v-if="isOwnProfile">
                    <div v-if="isHovering || uploading" class="avatar-overlay d-flex align-center justify-center">
                      <v-progress-circular v-if="uploading" indeterminate color="white"></v-progress-circular>
                      <v-icon v-else color="white" size="32">mdi-camera-plus</v-icon>
                    </div>
                  </v-fade-transition>
                </v-avatar>
              </v-hover>
            </div>

            <div class="hero-text ml-md-6 mb-md-4 text-center text-md-left flex-grow-1">
              <h1 class="hero-name">
                {{ user.name }}
                <v-icon v-if="user.level > 10" color="#F4A782" class="ml-2" size="28">mdi-shield-check</v-icon>
              </h1>
              <div class="hero-meta d-flex align-center justify-center justify-md-start gap-3">
                <v-chip
                  :color="getHeroRank(userLevel).color"
                  class="rank-chip px-4"
                  size="small"
                >
                  <v-icon start size="16">{{ getHeroRank(userLevel).icon }}</v-icon>
                  {{ getHeroRank(userLevel).title }}
                </v-chip>
                <span class="days-badge">
                  <v-icon size="16" class="mr-1">mdi-timer-sand</v-icon>
                  {{ daysOnSite }} {{ t('users.daysOnSite') }}
                </span>
              </div>
            </div>

            <div class="xp-mini-card mb-md-4 mr-md-4">
              <div class="d-flex justify-space-between text-caption font-weight-bold mb-1 xp-label">
                <span>{{ t('profile.rankLabel') }} {{ userRank }}</span>
                <span>{{ t('profile.levelLabel') }} {{ userLevel }}</span>
              </div>
              <v-progress-linear 
                :model-value="levelProgressPercentage" 
                color="#7048E8" 
                height="8" 
                rounded
                class="xp-progress"
              ></v-progress-linear>
              <div class="xp-values">{{ xpDisplayCurrent }} / {{ xpDisplayNeeded }} XP</div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="activity-card mb-6">
        <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-6">
          <h3 class="section-title">
            <v-icon color="#7048E8" class="mr-2">mdi-sword-cross</v-icon>
            {{ t('profile.activityJourney') }}
          </h3>
          <div class="heatmap-legend-container">
            <span class="legend-label">{{ t('profile.heatmapLess') }}</span>
            <div class="heatmap-legend">
              <div class="dot level-0"></div>
              <div class="dot level-1"></div>
              <div class="dot level-2"></div>
              <div class="dot level-3"></div>
            </div>
            <span class="legend-label">{{ t('profile.heatmapMore') }}</span>
          </div>
        </div>

        <div class="heatmap-scroll-wrapper">
          <div class="heatmap-grid">
            <div 
              v-for="day in heatmapDays" 
              :key="day" 
              class="heatmap-dot"
              :class="getHeatmapLevel(day)"
            >
              <v-tooltip activator="parent" location="top" offset="10">
                <div class="custom-tooltip">
                  <strong>{{ getTooltipText(day) }}</strong>
                </div>
              </v-tooltip>
            </div>
          </div>
        </div>
      </v-card>

      <v-card v-if="!isOwnProfile" class="activity-card mt-6" @click="goToUserMissions" style="cursor: pointer;">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h3 class="section-title mb-1">{{ t('profile.missionsArchive') }}</h3>
            <div class="text-caption opacity-60">
              {{ activeUserMissions.length }} {{ t('profile.active') }} • {{ finishedUserMissions.length }} {{ t('profile.completed') }}
            </div>
          </div>
          <v-btn icon="mdi-arrow-right" variant="text" color="#7048E8"></v-btn>
        </div>
      </v-card>

      <v-expansion-panels v-if="isOwnProfile" class="settings-panels mb-6">
        <v-expansion-panel elevation="0">
          <v-expansion-panel-title class="settings-title">
            <v-icon start color="#F4A782">mdi-cog-sync</v-icon> 
            <span>{{ t('profile.settings') }}</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="setting-row d-flex align-center py-2">
              <span class="text-white opacity-70">{{ t('navigation.language') }}</span>
              <v-spacer></v-spacer>
              
              <v-menu location="bottom end">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="outlined"
                    color="#7048E8"
                    size="small"
                    append-icon="mdi-chevron-down"
                    class="rounded-lg"
                  >
                    {{ currentLocaleLabel }}
                  </v-btn>
                </template>

                <v-list bg-color="#1A1A2E" border class="mt-2">
                  <v-list-item
                    v-for="lang in availableLocales"
                    :key="lang.code"
                    @click="changeLanguage(lang.code)"
                    :active="currentLocale === lang.code"
                  >
                    <v-list-item-title class="text-white">{{ lang.label }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>

            <div class="setting-row d-flex align-center py-2">
              <div class="d-flex flex-column">
                <span class="text-white opacity-70">{{ t('profile.pushNotifications') }}</span>
                <span v-if="pushNotificationStatus !== 'default'" class="text-caption text-white opacity-50 mt-1">
                  <template v-if="pushNotificationStatus === 'granted' && isPushSubscribed">
                    {{ t('profile.pushNotificationsEnabled') }}
                  </template>
                  <template v-else-if="pushNotificationStatus === 'granted' && !isPushSubscribed">
                    {{ t('profile.pushNotificationsNotSubscribed') }}
                  </template>
                  <template v-else-if="pushNotificationStatus === 'denied'">
                    {{ t('profile.pushNotificationsDenied') }}
                  </template>
                  <template v-else-if="pushNotificationStatus === 'unsupported'">
                    {{ t('profile.pushNotificationsUnsupported') }}
                  </template>
                  <template v-else>
                    {{ t('profile.pushNotificationsNotEnabled') }}
                  </template>
                </span>
              </div>
              <v-spacer></v-spacer>
              
              <v-btn
                v-if="pushNotificationStatus === 'granted' && !isPushSubscribed"
                @click="enablePushNotifications"
                :loading="subscribingToPush"
                variant="outlined"
                color="#7048E8"
                size="small"
                class="rounded-lg"
              >
                {{ t('profile.reSubscribePushNotifications') }}
              </v-btn>
              <v-btn
                v-else-if="pushNotificationStatus !== 'granted' && pushNotificationStatus !== 'denied' && pushNotificationStatus !== 'unsupported'"
                @click="enablePushNotifications"
                :loading="subscribingToPush"
                variant="outlined"
                color="#7048E8"
                size="small"
                class="rounded-lg"
              >
                {{ t('profile.enablePushNotifications') }}
              </v-btn>
              <v-chip
                v-else-if="pushNotificationStatus === 'granted' && isPushSubscribed"
                color="#4CAF50"
                size="small"
                variant="flat"
              >
                {{ t('profile.pushNotificationsActive') }}
              </v-chip>
            </div>

            <div class="setting-row d-flex align-center py-2">
              <div class="d-flex flex-column flex-grow-1">
                <span class="text-white opacity-70">{{ t('profile.dailyRecap') }}</span>
                <span class="text-caption text-white opacity-50 mt-1">
                  {{ t('profile.dailyRecapHint') }}
                </span>
                <div v-if="dailyRecapEnabled" class="d-flex align-center mt-2 gap-2">
                  <v-text-field
                    v-model="dailyRecapTime"
                    type="time"
                    density="compact"
                    hide-details
                    variant="outlined"
                    color="#7048E8"
                    class="daily-recap-time-input"
                  />
                  <v-btn
                    variant="outlined"
                    color="#7048E8"
                    size="small"
                    :loading="dailyRecapSaving"
                    @click="saveDailyRecapSettings"
                  >
                    {{ t('profile.dailyRecapSave') }}
                  </v-btn>
                </div>
              </div>
              <v-switch
                :model-value="dailyRecapEnabled"
                color="#7048E8"
                hide-details
                :disabled="dailyRecapSaving"
                @update:model-value="handleDailyRecapToggle"
              />
            </div>

            <v-alert
              v-if="pushNotificationError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-2"
              @click:close="pushNotificationError = ''"
            >
              {{ pushNotificationError }}
            </v-alert>
            <v-alert
              v-if="pushNotificationSuccess"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-2"
              @click:close="pushNotificationSuccess = ''"
            >
              {{ pushNotificationSuccess }}
            </v-alert>
            <v-alert
              v-if="dailyRecapError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-2"
              @click:close="dailyRecapError = ''"
            >
              {{ dailyRecapError }}
            </v-alert>
            <v-alert
              v-if="dailyRecapSuccess"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-2"
              @click:close="dailyRecapSuccess = ''"
            >
              {{ dailyRecapSuccess }}
            </v-alert>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div v-if="!isOwnProfile" class="missions-section">
          </div>

    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="rounded-xl mt-4">
      {{ error }}
    </v-alert>
  </div>
</template>

<style scoped>
/* ОБЩИЙ КОНТЕЙНЕР */
.user-profile {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* ГЛАВНАЯ КАРТОЧКА (HEADER) */
.hero-header-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
}

.hero-cover {
  height: 160px;
  background: linear-gradient(135deg, #1A1A2E 0%, #7048E8 100%);
  border-radius: 24px 24px 0 0;
  position: relative;
  overflow: hidden;
}

.particles-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: radial-gradient(circle, #fff 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.1;
}

.hero-info-wrapper {
  margin-top: -60px;
}

/* АВАТАР */
.avatar-container {
  position: relative;
  z-index: 2;
}

.avatar-glow {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 160px; height: 160px;
  background: #7048E8;
  filter: blur(30px);
  opacity: 0.3;
  border-radius: 50%;
}

.hero-avatar {
  border: 4px solid #1A1A2E !important;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  background: #1A1A2E;
}

.avatar-gen {
  background: linear-gradient(135deg, #7048E8 0%, #F4A782 100%);
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; color: white;
}

/* ИМЯ И РАНГ */
.hero-name {
  font-size: 2.5rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.rank-chip {
  font-weight: 800 !important;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.days-badge {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-weight: 600;
}

/* XP БЛОК */
.xp-mini-card {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.05);
  min-width: 280px;
}

.xp-label {
  color: #7048E8;
  letter-spacing: 1px;
}

.xp-values {
  text-align: right;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  margin-top: 6px;
  font-family: monospace;
}

/* КАРТОЧКА АКТИВНОСТИ (HEATMAP) */
.activity-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  padding: 24px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 1px;
}
/* Контейнер, который ограничивает высоту и позволяет скроллить вбок */
.heatmap-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden; /* Запрещаем вертикальный рост */
  padding: 15px 5px;
  display: block; /* Важно для корректного overflow */
}

.heatmap-grid {
  display: grid;
  /* Жестко задаем 7 рядов (дни недели) */
  grid-template-rows: repeat(7, 14px); 
  /* Разрешаем колонкам создаваться автоматически вправо */
  grid-auto-flow: column;
  grid-auto-columns: 14px; 
  gap: 4px;
  
  /* Устанавливаем высоту, чтобы сетка не схлопывалась и не росла */
  height: calc(7 * 14px + 6 * 4px); 
  width: max-content; /* Сетка растянется вширь в зависимости от количества дней */
}

.heatmap-dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  transition: transform 0.2s ease;
}

/* Дополнительно: убедимся, что карточка не растягивается внутренним контентом */
.activity-card {
  min-height: auto !important; 
  max-height: fit-content;
}

.level-1 { background: rgba(112, 72, 232, 0.3); }
.level-2 { background: rgba(112, 72, 232, 0.6); }
.level-3 { background: #7048E8; box-shadow: 0 0 8px rgba(112, 72, 232, 0.4); }

/* НАСТРОЙКИ */
.settings-panels {
  border-radius: 24px !important;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.settings-panels :deep(.v-expansion-panel) {
  background: rgba(255, 255, 255, 0.03) !important;
  color: #fff !important;
}

.settings-title {
  font-weight: 700 !important;
}

.setting-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
/* Стили для самого контейнера тултипа */
:deep(.v-tooltip > .v-overlay__content) {
  background: #1A1A2E !important; /* Глубокий темный фон вместо серого */
  border: 1px solid #7048E8 !important; /* Фиолетовая рамка */
  border-radius: 8px !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
  padding: 0 !important; /* Убираем лишние отступы, чтобы работал .custom-tooltip */
}

/* Стили для твоего внутреннего div (который внутри v-tooltip) */
.custom-tooltip {
  padding: 8px 12px;
  color: #FFFFFF !important;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  background: transparent !important; /* Фон берется от родителя выше */
}

/* Чтобы текст внутри был читаемым */
.custom-tooltip strong {
  color: #F4A782 !important; /* Персиковый акцент для даты/значения */
  display: block;
  margin-bottom: 2px;
}
/* Контейнер всей легенды */
.heatmap-legend-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03); /* Легкая подложка */
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Надписи Less / More */
.legend-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Группа из 4-х точек */
.heatmap-legend {
  display: flex;
  gap: 4px;
}

/* Общий стиль для точки в легенде */
.heatmap-legend .dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* Цвета уровней (должны совпадать с основной сеткой Heatmap) */
.level-0 { background: rgba(255, 255, 255, 0.05); } /* Пусто */
.level-1 { background: rgba(112, 72, 232, 0.3); }  /* Мало */
.level-2 { background: rgba(112, 72, 232, 0.6); }  /* Средне */
.level-3 { 
  background: #7048E8; 
  box-shadow: 0 0 5px rgba(112, 72, 232, 0.5); /* Сияние для максимума */
}
</style>
