<template>
  <div class="user-profile">
    <v-card class="user-info-card mb-6">
      <v-card-text>
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <div v-else-if="user" class="user-info">
          <!-- Avatar and Basic Info -->
          <div class="user-header mb-6">
            <div class="avatar-wrapper">
              <input
                v-if="isOwnProfile"
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden-file-input"
                :disabled="uploading"
                @change="handleFileInputChange"
              />
              <div
                v-if="isOwnProfile"
                class="avatar-clickable"
                :class="{ 'uploading': uploading }"
                @click="triggerFileInput"
              >
                <v-avatar size="120" class="user-avatar" :class="{ 'avatar-no-image': !user.avatarUrl }">
                  <v-img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.name" cover></v-img>
                  <span v-else class="avatar-initials">{{ getUserInitials(user.name) }}</span>
                </v-avatar>
                <div class="avatar-overlay">
                  <v-progress-circular
                    v-if="uploading"
                    indeterminate
                    color="white"
                    size="32"
                    width="3"
                  ></v-progress-circular>
                  <v-icon v-else size="32" color="white">mdi-camera</v-icon>
                  <span class="avatar-overlay-text">{{ uploading ? t('profile.uploading') : t('profile.clickToUpload') }}</span>
                </div>
              </div>
              <v-avatar v-else size="120" class="user-avatar" :class="{ 'avatar-no-image': !user.avatarUrl }">
                <v-img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.name" cover></v-img>
                <span v-else class="avatar-initials">{{ getUserInitials(user.name) }}</span>
              </v-avatar>
            </div>
            <div class="user-details">
              <h1 class="text-h4 mb-2">{{ user.name }}</h1>
              <div class="user-stats">
                <div class="stat-item">
                  <v-icon size="small" class="mr-1">mdi-calendar-check</v-icon>
                  <span>{{ t('users.daysOnSite') }}: {{ daysOnSite }}</span>
                </div>
                <div class="stat-item">
                  <v-icon size="small" class="mr-1">mdi-target</v-icon>
                  <span>{{ t('users.challenges') }}: {{ user.challengeCount || challenges.length }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <v-alert v-if="uploadError" type="error" class="mb-4">{{ uploadError }}</v-alert>
          <v-alert v-if="uploadSuccess" type="success" class="mb-4">{{ uploadSuccess }}</v-alert>
        </div>
        
        <v-alert v-else-if="error" type="error">
          {{ error }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Challenges Section -->
    <v-card>
      <v-card-title class="text-h5 mb-4">
        {{ isOwnProfile ? t('challenges.myListTitle') : t('users.userChallenges') }}
      </v-card-title>
      <v-card-text>
        <!-- Filter Panel -->
        <FilterPanel v-if="challenges.length > 0" v-model="filters" class="mb-4" />

        <v-progress-linear v-if="loadingChallenges" indeterminate color="primary" class="mb-4"></v-progress-linear>
        
        <v-alert v-if="challengesError" type="error" class="mb-4">
          {{ challengesError }}
        </v-alert>
        
        <v-alert v-else-if="!loadingChallenges && challenges.length === 0" type="info">
          {{ isOwnProfile ? t('challenges.noMyChallenges') : t('users.noChallenges') }}
        </v-alert>
        
        <v-alert v-else-if="!loadingChallenges && filteredChallenges.length === 0" type="info">
          {{ t('challenges.noMyChallenges') }}
        </v-alert>
        
        <div v-else>
          <!-- Active Challenges -->
          <div v-if="activeChallenges.length > 0">
            <h2 class="section-title mb-4">{{ t('challenges.activityActive') }}</h2>
            <div class="challenges-grid">
              <ChallengeCard
                v-for="challenge in activeChallenges"
                :key="challenge._id"
                :challenge="challenge"
                :current-user-id="currentUserId"
                :show-join-button="false"
                @click="handleChallengeClick"
              />
            </div>
          </div>

          <!-- Finished Challenges -->
          <div v-if="finishedChallenges.length > 0" :class="{ 'finished-section': activeChallenges.length > 0 }">
            <h2 class="section-title mb-4" :class="{ 'mt-8': activeChallenges.length > 0 }">{{ t('challenges.activityFinished') }}</h2>
            <div class="challenges-grid">
              <ChallengeCard
                v-for="challenge in finishedChallenges"
                :key="challenge._id"
                :challenge="challenge"
                :current-user-id="currentUserId"
                :show-join-button="false"
                @click="handleChallengeClick"
              />
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Challenge Details Dialog -->
    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="false"
      :join-loading="false"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update="handleDialogUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { userService, challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import ChallengeCard from './ChallengeCard.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import FilterPanel from './FilterPanel.vue'

const props = defineProps({
  userId: {
    type: String,
    default: null
  }
})

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const user = ref(null)
const challenges = ref([])
const loading = ref(false)
const loadingChallenges = ref(false)
const error = ref('')
const challengesError = ref('')

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
const uploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')
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
  const userId = targetUserId.value
  
  if (!userId) {
    challengesError.value = t('users.userNotFound')
    return
  }

  loadingChallenges.value = true
  challengesError.value = ''
  
  try {
    // Exclude private challenges unless viewing own profile
    const excludePrivate = !isOwnProfile.value
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
    router.push(`/challenges/edit/${challenge._id}`)
    return
  }
  
  // Otherwise open details dialog
  selectedChallenge.value = challenge
  detailsDialogOpen.value = true
}

const handleDialogUpdate = async () => {
  // Refresh challenges when participant updates their completedDays
  await fetchChallenges()
  // Also refresh the selected challenge if dialog is open
  if (selectedChallenge.value) {
    const updatedChallenge = challenges.value.find(c => c._id === selectedChallenge.value._id)
    if (updatedChallenge) {
      selectedChallenge.value = updatedChallenge
    }
  }
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
  // Reset state when route changes (e.g., from /users/:id to /profile)
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

onMounted(() => {
  fetchUser()
  fetchChallenges()
})
</script>

<style scoped>
.user-profile {
  width: 100%;
  padding: 24px;
}

.user-info-card {
  width: 100%;
}

.user-info {
  width: 100%;
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

@media (min-width: 600px) {
  .user-header {
    flex-direction: row;
    align-items: center;
    text-align: left;
  }
}

.user-avatar {
  margin-bottom: 16px;
}

@media (min-width: 600px) {
  .user-avatar {
    margin-right: 24px;
    margin-bottom: 0;
  }
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar-clickable {
  position: relative;
  cursor: pointer;
  display: inline-block;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-clickable:hover .avatar-overlay {
  opacity: 1;
}

.avatar-clickable.uploading .avatar-overlay {
  opacity: 1;
}

.avatar-clickable:hover .user-avatar {
  opacity: 0.8;
}

.avatar-no-image {
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
}

.avatar-initials {
  font-size: 48px;
  font-weight: 600;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: white;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.avatar-overlay-text {
  color: white;
  font-size: 12px;
  margin-top: 4px;
  text-align: center;
}

.hidden-file-input {
  display: none;
}

.user-details {
  flex: 1;
}

.user-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

@media (min-width: 600px) {
  .user-stats {
    flex-direction: row;
    gap: 24px;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.6);
}

.challenges-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 8px 0;
  width: 100%;
}

@media (min-width: 600px) {
  .challenges-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 16px 0;
  }
}

@media (min-width: 960px) {
  .challenges-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
}

@media (min-width: 600px) {
  .section-title {
    font-size: 1.5rem;
  }
}

.finished-section {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  padding-top: 24px;
  margin-top: 24px;
}
</style>
