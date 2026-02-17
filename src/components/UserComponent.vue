<template>
  <div class="user-profile pb-10">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4 rounded-pill"></v-progress-linear>

    <div v-else-if="user" class="profile-layout">
      
      <v-card class="hero-header-card overflow-visible mb-6 rounded-xl" elevation="2">
        <div class="hero-cover"></div>
        
        <v-card-text class="position-relative pt-0">
          <div class="d-flex flex-column flex-md-row align-center align-md-end hero-info-wrapper">
            
            <div class="avatar-container">
              <input v-if="isOwnProfile" ref="fileInputRef" type="file" accept="image/*" class="d-none" @change="handleFileInputChange" />
              <v-hover v-slot="{ isHovering, props }">
                <v-avatar 
                  size="140" 
                  v-bind="props"
                  :class="['hero-avatar', { 'clickable': isOwnProfile }]"
                  @click="isOwnProfile && triggerFileInput()"
                >
                  <v-img v-if="user.avatarUrl" :src="user.avatarUrl" cover></v-img>
                  <div v-else class="avatar-gen text-h3">{{ getUserInitials(user.name) }}</div>
                  
                  <v-fade-transition v-if="isOwnProfile">
                    <div v-if="isHovering || uploading" class="avatar-overlay d-flex align-center justify-center">
                      <v-progress-circular v-if="uploading" indeterminate color="white"></v-progress-circular>
                      <v-icon v-else color="white" size="32">mdi-camera</v-icon>
                    </div>
                  </v-fade-transition>
                </v-avatar>
              </v-hover>
            </div>

            <div class="hero-text ml-md-6 mb-md-4 text-center text-md-left flex-grow-1">
              <h1 class="text-h4 font-weight-black mb-1 d-flex align-center justify-center justify-md-start">
                {{ user.name }}
                <v-icon v-if="user.level > 10" color="amber" class="ml-2" size="24">mdi-shield-check</v-icon>
              </h1>
              <div class="d-flex align-center justify-center justify-md-start gap-4">
                <v-chip
                  :color="getHeroRank(userLevel).color"
                  variant="flat"
                  class="font-weight-bold px-4"
                  size="small"
                >
                  <v-icon start size="16">{{ getHeroRank(userLevel).icon }}</v-icon>
                  {{ getHeroRank(userLevel).title }}
                </v-chip>
                <span class="text-subtitle-2 text-grey-darken-1">
                  <v-icon size="16" class="mr-1">mdi-map-marker-outline</v-icon>
                  {{ daysOnSite }} {{ t('users.daysOnSite') }}
                </span>
              </div>
            </div>

            <div class="xp-mini-card mb-md-4 mr-md-4">
              <div class="d-flex justify-space-between text-caption font-weight-bold mb-1">
                <span>{{ t('navigation.rank') }} {{ userRank }} ({{ t('navigation.level') }} {{ userLevel }})</span>
                <span>{{ xpDisplayCurrent }} / {{ xpDisplayNeeded }} {{ t('navigation.xp') }}</span>
              </div>
              <v-progress-linear :model-value="levelProgressPercentage" color="primary" height="10" rounded></v-progress-linear>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="rounded-xl mb-6 hero-card-standard heatmap-card">
  <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between mb-4 heatmap-header">
    <h3 class="text-h6 font-weight-bold d-flex align-center mb-2 mb-sm-0">
      <v-icon color="success" class="mr-2">mdi-calendar-check</v-icon>
      Activity Journey
    </h3>
    <div class="d-flex align-center text-caption text-grey heatmap-legend-wrapper">
      <span class="mr-2 d-none d-sm-inline">Less</span>
      <div class="heatmap-legend">
        <div class="dot level-0"></div>
        <div class="dot level-1"></div>
        <div class="dot level-2"></div>
        <div class="dot level-3"></div>
      </div>
      <span class="ml-2 d-none d-sm-inline">More</span>
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
        <v-tooltip activator="parent" location="top">
          {{ getTooltipText(day) }}
        </v-tooltip>
      </div>
    </div>
  </div>
</v-card>

      <v-expansion-panels v-if="isOwnProfile" class="mb-6 rounded-xl overflow-hidden">
        <v-expansion-panel elevation="1">
          <v-expansion-panel-title class="font-weight-bold text-grey-darken-2">
            <v-icon start>mdi-cog-outline</v-icon> {{ t('profile.settings') }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
             <div class="setting-row d-flex align-center py-2">
                <span>{{ t('navigation.language') }}</span>
                <v-spacer></v-spacer>
                <v-btn variant="tonal" size="small">{{ currentLocaleLabel }}</v-btn>
             </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div v-if="!isOwnProfile" class="mt-6 mt-md-8 challenges-section">
        <!-- Active Missions -->
        <div v-if="activeUserMissions.length > 0">
          <h3 class="text-subtitle-1 text-h6 font-weight-bold mb-3 mb-md-4 ml-0 ml-md-2">
            <v-icon color="primary" class="mr-2">mdi-target</v-icon>
            Hero's Missions
          </h3>
          
          <div class="challenges-grid">
            <ChallengeCard 
              v-for="mission in activeUserMissions" 
              :key="mission._id || mission.id"
              :challenge="mission"
              :show-join-button="!isOwnProfile"
            />
          </div>
        </div>
        
        <!-- Finished Missions -->
        <div v-if="finishedUserMissions.length > 0" class="mt-6 mt-md-8">
          <h3 class="text-subtitle-1 text-h6 font-weight-bold mb-3 mb-md-4 ml-0 ml-md-2">
            <v-icon color="grey" class="mr-2">mdi-check-circle</v-icon>
            Finished Missions
          </h3>
          
          <div class="challenges-grid">
            <ChallengeCard 
              v-for="mission in finishedUserMissions" 
              :key="mission._id || mission.id"
              :challenge="mission"
              :show-join-button="!isOwnProfile"
            />
          </div>
        </div>
      </div>

    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" class="rounded-xl">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userService, challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'
import ChallengeCard from './ChallengeCard.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import FilterPanel from './FilterPanel.vue'
import { 
  getNotificationPermission, 
  requestAndSubscribeToPushNotifications,
  isSubscribedToPushNotifications 
} from '../utils/pushNotifications'
import { getLevelFromXp, getXpForLevel, getXpForNextLevel, getLevelName, getRank } from '../utils/levelSystem'

const props = defineProps({
  userId: {
    type: String,
    default: null
  }
})

const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()
const availableLocales = SUPPORTED_LOCALES

const currentLocaleLabel = computed(() => {
  return availableLocales.find(lang => lang.code === locale.value)?.label || locale.value
})

function changeLanguage(code) {
  setLocale(code)
}


const user = ref(null)
const challenges = ref([])
const loading = ref(false)
const loadingChallenges = ref(false)
const error = ref('')
const challengesError = ref('')
const checklistHistory = ref([])
const heatmapChallenges = ref([])

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
const subscribingToPush = ref(false)
const pushNotificationStatus = ref('default')
const isPushSubscribed = ref(false)
const fileInputRef = ref(null)

// Hardcoded ImgBB API key for all users
const IMGBB_API_KEY = 'd8a4925b372143b44469009f92023386'

// Get current user ID
function getCurrentUserId() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || null
  } catch {
    return null
  }
}

const currentUserId = ref(getCurrentUserId())

// Level and rank calculations
const userXp = computed(() => Number(user.value?.xp || 0))
const userLevel = computed(() => getLevelFromXp(userXp.value))
const userRank = computed(() => getRank(userLevel.value))
const userLevelName = computed(() => getLevelName(userLevel.value, locale.value))
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

// Get hero rank information based on level
const getHeroRank = (level) => {
  if (level >= 100) return { title: 'Legend', color: '#FF4500', icon: 'mdi-star-circles' };
  if (level >= 41) return { title: 'Grandmaster', color: '#9400D3', icon: 'mdi-auto-fix' };
  if (level >= 21) return { title: 'Master', color: '#FFD700', icon: 'mdi-crown' };
  if (level >= 11) return { title: 'Warrior', color: '#C0C0C0', icon: 'mdi-sword' };
  if (level >= 6) return { title: 'Adept', color: '#4CAF50', icon: 'mdi-shield-check' };
  return { title: 'Explorer', color: '#2196F3', icon: 'mdi-compass-outline' };
};

// Filter state
const filters = ref({
  type: null,
  activity: null,
  participants: null,
  creationDate: null
})

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

// Filtered challenges
const filteredChallenges = computed(() => {
  let result = [...challenges.value]

  // Filter by type
  if (filters.value.type) {
    result = result.filter(challenge => challenge.challengeType === filters.value.type)
  }

  // Filter by activity
  if (filters.value.activity) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    result = result.filter(challenge => {
      if (!challenge.startDate || !challenge.endDate) return false
      
      const startDate = new Date(challenge.startDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(challenge.endDate)
      endDate.setHours(0, 0, 0, 0)
      
      if (filters.value.activity === 'active') {
        return startDate <= today && endDate >= today
      } else if (filters.value.activity === 'finished') {
        return endDate < today
      } else if (filters.value.activity === 'upcoming') {
        return startDate > today
      }
      return true
    })
  }

  // Filter by participants
  if (filters.value.participants) {
    result = result.filter(challenge => {
      const participantCount = (challenge.participants || []).length
      
      if (filters.value.participants === '0') {
        return participantCount === 0
      } else if (filters.value.participants === '1-5') {
        return participantCount >= 1 && participantCount <= 5
      } else if (filters.value.participants === '6+') {
        return participantCount >= 6
      }
      return true
    })
  }

  // Filter by creation date
  if (filters.value.creationDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    result = result.filter(challenge => {
      // Use createdAt if available, otherwise use startDate as fallback
      const creationDate = challenge.createdAt || challenge.startDate
      if (!creationDate) return false
      
      const created = new Date(creationDate)
      created.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today - created) / (1000 * 60 * 60 * 24))
      
      if (filters.value.creationDate === 'today') {
        return daysDiff === 0
      } else if (filters.value.creationDate === 'week') {
        return daysDiff >= 0 && daysDiff <= 7
      } else if (filters.value.creationDate === 'month') {
        return daysDiff >= 0 && daysDiff <= 30
      } else if (filters.value.creationDate === 'older') {
        return daysDiff > 30
      }
      return true
    })
  }

  return result
})

// Separate active and finished challenges
const activeChallenges = computed(() => {
  return filteredChallenges.value.filter(challenge => !isChallengeFinished(challenge))
})

const finishedChallenges = computed(() => {
  return filteredChallenges.value.filter(challenge => isChallengeFinished(challenge))
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

const selectedIsOwner = computed(() => {
  if (!selectedChallenge.value || !currentUserId.value) return false
  const ownerId = selectedChallenge.value.owner?._id || selectedChallenge.value.owner
  return ownerId && ownerId.toString() === currentUserId.value.toString()
})

const selectedIsParticipant = computed(() => {
  if (!selectedChallenge.value || !currentUserId.value) return false
  return (selectedChallenge.value.participants || []).some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === currentUserId.value.toString()
  })
})

const leavingId = ref(null)
const joiningId = ref(null)
const watchingId = ref(null)
const watchedChallenges = ref([])

const showDialogLeaveButton = computed(() => {
  if (!selectedChallenge.value) return false
  
  // Cannot leave if challenge has ended
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  // Can only leave habit challenges
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    selectedIsParticipant.value
  )
})

const selectedLeaveLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return leavingId.value === selectedChallenge.value._id
})

const showDialogJoinButton = computed(() => {
  if (!selectedChallenge.value) return false
  
  // Cannot join if challenge has ended
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  // Can only join habit challenges
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    !selectedIsParticipant.value
  )
})

const selectedJoinLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return joiningId.value === selectedChallenge.value._id
})

function isChallengeOwner(owner) {
  if (!currentUserId.value || !owner) return false
  const ownerId = owner._id || owner
  return ownerId && ownerId.toString() === currentUserId.value.toString()
}

const fetchUser = async () => {
  // If on /profile route, fetch current user's profile
  if (route.path === '/profile') {
    loading.value = true
    error.value = ''
    try {
      const response = await userService.getProfile()
      if (response.data?.user) {
        user.value = response.data.user
      } else {
        error.value = t('profile.noData')
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        error.value = t('profile.invalidToken')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.dispatchEvent(new Event('auth-changed'))
      } else {
        error.value = err.response?.data?.message || t('notifications.profileError')
      }
    } finally {
      loading.value = false
    }
    return
  }

  // Otherwise fetch from users list
  if (!targetUserId.value) {
    error.value = t('users.userNotFound')
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    // Get user from users list
    const response = await userService.getAllUsers()
    const foundUser = response.data.users.find(u => 
      (u._id || u.id)?.toString() === targetUserId.value.toString()
    )
    
    if (foundUser) {
      user.value = foundUser
    } else {
      error.value = t('users.userNotFound')
    }
  } catch (err) {
    error.value = err.response?.data?.message || t('notifications.usersError')
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
    challengesError.value = t('users.userNotFound')
    return
  }

  loadingChallenges.value = true
  challengesError.value = ''
  
  try {
    // Exclude private challenges when viewing other users' profiles
    const excludePrivate = true
    const { data } = await challengeService.getChallengesByUser(userId, { excludePrivate })
    challenges.value = data?.challenges || []
  } catch (err) {
    challengesError.value = err.response?.data?.message || t('notifications.apiError')
  } finally {
    loadingChallenges.value = false
  }
}

const handleChallengeClick = (challenge) => {
  // If viewing own profile and user owns the challenge, navigate to edit page
  if (isOwnProfile.value && isChallengeOwner(challenge.owner)) {
    router.push(`/missions/edit/${challenge._id}`)
    return
  }
  
  // Otherwise open details dialog
  selectedChallenge.value = challenge
  detailsDialogOpen.value = true
}

async function joinChallenge(challenge) {
  if (!currentUserId.value) {
    challengesError.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    challengesError.value = t('notifications.joinError')
    return
  }

  joiningId.value = challenge._id
  challengesError.value = ''

  try {
    await challengeService.joinChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh challenges list
    await fetchChallenges()
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (err) {
        // Fallback to finding in list
        selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (err) {
    challengesError.value = err.response?.data?.message || t('notifications.joinError')
  } finally {
    joiningId.value = null
  }
}

async function leaveChallenge(challenge) {
  if (!currentUserId.value) {
    challengesError.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    challengesError.value = t('notifications.joinError')
    return
  }

  leavingId.value = challenge._id
  challengesError.value = ''

  try {
    await challengeService.leaveChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh challenges list
    await fetchChallenges()
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (err) {
        // Fallback to finding in list
        selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (err) {
    challengesError.value = err.response?.data?.message || t('notifications.joinError')
  } finally {
    leavingId.value = null
  }
}

function isWatched(challenge) {
  if (!challenge || !currentUserId.value) return false
  return watchedChallenges.value.some(id => id.toString() === challenge._id.toString())
}

async function watchChallenge(challenge) {
  if (!currentUserId.value) {
    challengesError.value = t('notifications.mustLogin')
    return
  }

  watchingId.value = challenge._id
  challengesError.value = ''

  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
  }

  try {
    await challengeService.watchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (err) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
    }
    challengesError.value = err.response?.data?.message || t('challenges.watchError')
  } finally {
    watchingId.value = null
  }
}

async function unwatchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  challengesError.value = ''

  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
  }

  try {
    await challengeService.unwatchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (err) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
    }
    challengesError.value = err.response?.data?.message || t('challenges.unwatchError')
  } finally {
    watchingId.value = null
  }
}

async function loadWatchedChallenges() {
  if (!currentUserId.value) return
  
  try {
    const { data } = await challengeService.getWatchedChallenges(currentUserId.value)
    watchedChallenges.value = (data.challenges || []).map(c => c._id)
  } catch (err) {
    console.error('Error loading watched challenges:', err)
  }
}

async function handleDialogJoin() {
  if (!selectedChallenge.value) return
  await joinChallenge(selectedChallenge.value)
}

async function handleDialogLeave() {
  if (!selectedChallenge.value) return
  await leaveChallenge(selectedChallenge.value)
}

const handleDialogUpdate = async () => {
  // Refresh challenges when participant updates their completedDays or watch/unwatch
  await fetchChallenges()
  await loadWatchedChallenges()
  // Also refresh the selected challenge if dialog is open
  if (selectedChallenge.value) {
    const updatedChallenge = challenges.value.find(c => c._id === selectedChallenge.value._id)
    if (updatedChallenge) {
      selectedChallenge.value = updatedChallenge
    }
  }
}

function handleOwnerNavigated() {
  // Close dialog when owner is navigated
  detailsDialogOpen.value = false
}

// Watch for changes in target user ID
watch(targetUserId, (newUserId, oldUserId) => {
  // Only refetch if the user ID actually changed
  if (newUserId && newUserId.toString() !== (oldUserId?.toString() || '')) {
    user.value = null
    challenges.value = []
    error.value = ''
    challengesError.value = ''
    fetchUser()
    fetchChallenges()
  }
}, { immediate: false })

watch(() => props.userId, (newId, oldId) => {
  if (newId && newId.toString() !== (oldId?.toString() || '')) {
    user.value = null
    challenges.value = []
    error.value = ''
    challengesError.value = ''
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
    challengesError.value = ''
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
    challengesError.value = ''
    fetchUser()
    fetchChallenges()
  }
})

// Watch for when viewing own profile to check push notification status
watch(isOwnProfile, (newValue) => {
  if (newValue) {
    checkPushNotificationStatus()
  }
}, { immediate: true })

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
      console.error('ImgBB API error:', payload)
      throw new Error(errorMsg)
    }

    const imageUrl = payload?.data?.url || payload?.data?.display_url
    if (!imageUrl) {
      throw new Error('Upload did not return an image URL')
    }

    const updateResponse = await userService.updateProfile({ avatarUrl: imageUrl })
    user.value = updateResponse.data.user

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      storedUser.avatarUrl = imageUrl
      if (user.value?.name) {
        storedUser.name = user.value.name
      }
      localStorage.setItem('user', JSON.stringify(storedUser))
    } catch (storageError) {
      console.warn('Unable to update localStorage user payload:', storageError)
    }

    uploadSuccess.value = t('profile.uploadSuccess')
    window.dispatchEvent(new Event('auth-changed'))
  } catch (err) {
    console.error('Avatar upload failed:', err)
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
        console.error('Error checking push subscription:', error)
        isPushSubscribed.value = false
      }
    }
  } catch (error) {
    console.error('Error checking push notification status:', error)
  }
}

async function enablePushNotifications() {
  subscribingToPush.value = true
  uploadError.value = ''
  uploadSuccess.value = ''
  
  try {
    const result = await requestAndSubscribeToPushNotifications()
    
    if (result.success) {
      uploadSuccess.value = t('profile.pushNotificationsEnabledSuccess')
      await checkPushNotificationStatus()
    } else if (result.reason === 'permission-denied') {
      uploadError.value = t('profile.pushNotificationsPermissionDenied')
      await checkPushNotificationStatus()
    } else if (result.reason === 'error' && result.error) {
      // Show the actual error so we can debug (timeouts, network errors, etc.)
      uploadError.value = result.error
    } else {
      uploadError.value = t('profile.pushNotificationsEnableError')
    }
  } catch (error) {
    console.error('Error enabling push notifications:', error)
    uploadError.value = error?.message || t('profile.pushNotificationsEnableError')
  } finally {
    subscribingToPush.value = false
  }
}

// Fetch heatmap data (checklist history and challenges)
const fetchHeatmapData = async () => {
  const userId = targetUserId.value
  if (!userId) {
    console.log('[Heatmap] No userId, skipping fetchHeatmapData')
    return
  }

  console.log('[Heatmap] fetchHeatmapData called', { userId, isOwnProfile: isOwnProfile.value })

  try {
    // Fetch checklist history (only for own profile - API doesn't support other users yet)
    if (isOwnProfile.value) {
      try {
        console.log('[Heatmap] Fetching checklist history for own profile...')
        const checklistResponse = await userService.getChecklistHistory()
        console.log('[Heatmap] Checklist history response:', {
          hasData: !!checklistResponse.data,
          checklistsLength: checklistResponse.data?.checklists?.length || 0,
          checklists: checklistResponse.data?.checklists || []
        })
        checklistHistory.value = checklistResponse.data?.checklists || []
        console.log('[Heatmap] checklistHistory.value set to:', checklistHistory.value.length, 'items')
      } catch (err) {
        console.error('[Heatmap] Error fetching checklist history:', err)
        console.error('[Heatmap] Error details:', err.response?.data || err.message)
        checklistHistory.value = []
      }
    } else {
      // For other users, we don't have access to their checklist history yet
      // Will calculate heatmap based on missions only
      console.log('[Heatmap] Not own profile, skipping checklist history fetch')
      checklistHistory.value = []
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
      console.error('Error fetching challenges for heatmap:', err)
      heatmapChallenges.value = []
    }
  } catch (err) {
    console.error('Error fetching heatmap data:', err)
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
  
  // Debug logging
  if (day === 1 || day === daysOnSite.value) {
    console.log(`[Heatmap Debug Day ${day}]`, {
      dateStr,
      checklistHistoryLength: checklistHistory.value.length,
      checklistForDate: checklistForDate ? {
        hasTasks: !!checklistForDate.tasks,
        tasksLength: checklistForDate.tasks?.length || 0,
        clientDay: checklistForDate.clientDay,
        date: checklistForDate.date
      } : null
    })
  }
  
  // Count completed and total steps from checklist
  let completedSteps = 0
  let totalSteps = 0
  
  if (checklistForDate) {
    // Check for tasks array
    if (checklistForDate.tasks && Array.isArray(checklistForDate.tasks)) {
      totalSteps = checklistForDate.tasks.length
      completedSteps = checklistForDate.tasks.filter(t => t && t.done).length
    }
    // Debug if we found checklist but no tasks
    if (day === 1 || day === daysOnSite.value) {
      console.log(`[Heatmap Debug Day ${day}] Steps:`, { completedSteps, totalSteps, hasTasks: !!checklistForDate.tasks })
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
  loadWatchedChallenges()
  // Fetch heatmap data after user is loaded
  if (user.value) {
    await fetchHeatmapData()
  }
  // Only check push notification status if viewing own profile
  if (isOwnProfile.value) {
    checkPushNotificationStatus()
  }
})
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  /* Мягкий градиент на фоне */
  background: radial-gradient(circle at top right, #f8fafc 0%, #e2e8f0 100%);
}

.register-card {
  width: 100%;
  max-width: 500px;
  /* Эффект стекла */
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 32px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05) !important;
}

.register-title {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Стилизация полей ввода */
:deep(.custom-field .v-field) {
  border-radius: 16px !important;
  background: white !important;
}

/* Анимация появления */
.reveal-item {
  opacity: 0;
  transform: translateY(20px);
  animation: revealUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--i) * 0.1s);
}

@keyframes revealUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .register-title { font-size: 2rem; }
}
</style>
