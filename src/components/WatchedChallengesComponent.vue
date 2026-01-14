<template>
  <div class="watched-challenges">
    <h1 class="mb-4 mb-md-6 page-title ml-4">{{ t('challenges.watchedListTitle') }}</h1>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

    <v-alert v-if="errorMessage" type="error" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <v-alert v-else-if="!isLoggedIn" type="info">
      {{ t('challenges.loginPrompt') }}
    </v-alert>

    <v-alert v-else-if="!challenges.length && !loading" type="info">
      {{ t('challenges.noWatchedChallenges') }}
    </v-alert>

    <v-row v-else class="watched-challenges-layout">
      <!-- Left Column: Challenge Cards (8 cols) -->
      <v-col cols="12" md="8" class="challenges-column">
        <div class="challenges-list">
          <v-card
            v-for="challenge in challenges"
            :key="challenge._id"
            class="watched-challenge-card mb-4"
            @click="openDetails(challenge)"
          >
            <v-card-text>
              <div class="challenge-header-row mb-3">
                <h3 class="challenge-title">{{ challenge.title }}</h3>
                <v-chip
                  v-if="challenge.challengeType"
                  :color="challenge.challengeType === 'habit' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ challenge.challengeType === 'habit' ? t('challenges.typeHabit') : t('challenges.typeResult') }}
                </v-chip>
              </div>
              
              <div class="challenge-meta-row mb-3">
                <div class="author-info">
                  <v-icon size="small" class="mr-1">mdi-account</v-icon>
                  <span class="text-caption">{{ t('challenges.createdBy').split('{name}')[0] }}</span>
                  <span 
                    class="author-name text-caption ml-1" 
                    @click.stop="navigateToUser(challenge.owner)"
                  >
                    {{ challenge.owner?.name || t('common.unknown') }}
                  </span>
                </div>
                <div class="dates-info text-caption">
                  {{ formatDateRange(challenge.startDate, challenge.endDate) }}
                </div>
              </div>

              <div v-if="challenge.owner && getOwnerProgress(challenge) !== null" class="owner-progress mb-3">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption">{{ t('challenges.authorProgress') }}</span>
                  <span class="progress-numbers">
                    <template v-if="challenge.challengeType === 'result'">
                      {{ getOwnerProgressDone(challenge) }}/{{ getOwnerProgressTotal(challenge) }} {{ t('home.loggedIn.dailyChecklist.completed') }}
                    </template>
                    <template v-else>
                      {{ getOwnerProgressPercentage(challenge) }}%
                    </template>
                  </span>
                </div>
                <v-progress-linear
                  :model-value="getOwnerProgressPercentage(challenge)"
                  :color="getProgressBarColor(challenge)"
                  height="6"
                  rounded
                  :class="['owner-progress-bar', getProgressBarColorClass(challenge)]"
                ></v-progress-linear>
              </div>

              <div class="challenge-actions d-flex justify-space-between align-center">
                <v-btn
                  size="small"
                  variant="text"
                  color="grey"
                  :loading="watchingId === challenge._id"
                  @click.stop="unwatchChallenge(challenge)"
                  class="unwatch-button"
                >
                  <v-icon size="small" class="mr-1">mdi-eye-off</v-icon>
                  {{ t('challenges.unwatch') }}
                </v-btn>
                <v-btn
                  v-if="canJoin(challenge)"
                  color="primary"
                  size="small"
                  variant="flat"
                  :loading="joiningId === challenge._id"
                  @click.stop="joinChallenge(challenge)"
                  class="join-button"
                >
                  {{ t('challenges.join') }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-col>

      <!-- Right Column: Sidebar (4 cols) -->
      <v-col cols="12" md="4" class="sidebar-column">
        <!-- Top Performers Block -->
        <v-card class="top-performers-card mb-4">
          <v-card-title>
            <span class="mr-2">🏆</span>
            Top Performers
          </v-card-title>
          <v-card-text>
            <div v-if="topPerformers.length === 0" class="text-caption text-medium-emphasis">
              No participants yet
            </div>
            <div v-else class="performers-list">
              <div
                v-for="(participant, index) in topPerformers"
                :key="getParticipantId(participant)"
                class="performer-item d-flex align-center mb-3"
              >
                <div class="performer-rank mr-3">{{ index + 1 }}</div>
                <div class="performer-avatar mr-3">
                  <img
                    v-if="getParticipantAvatar(participant)"
                    :src="getParticipantAvatar(participant)"
                    :alt="getParticipantName(participant)"
                    class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ getParticipantInitial(participant) }}
                  </div>
                </div>
                <div class="performer-info flex-grow-1">
                  <div class="performer-name text-body-2 font-weight-medium">
                    {{ getParticipantName(participant) }}
                  </div>
                  <div class="performer-progress">
                    <v-progress-linear
                      :model-value="getParticipantProgressPercentage(participant)"
                      color="primary"
                      height="4"
                      rounded
                      class="mt-1"
                    ></v-progress-linear>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ getParticipantProgressPercentage(participant) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- News Feed Block -->
        <v-card class="news-feed-card">
          <v-card-title>
            <span class="mr-2">🔔</span>
            {{ t('challenges.newsFeed') }}
          </v-card-title>
          <v-card-text class="feed-content">
            <div v-if="feedActivities.length === 0 && !feedLoading" class="text-caption text-medium-emphasis text-center py-4">
              {{ t('challenges.feedEmpty') }}
            </div>
            <div v-else class="feed-activities">
              <div
                v-for="activity in feedActivities"
                :key="activity.id"
                class="feed-activity-item"
              >
                <div class="activity-avatar mr-3">
                  <img
                    v-if="activity.userAvatar"
                    :src="activity.userAvatar"
                    :alt="activity.userName"
                    class="avatar-img"
                  />
                  <div v-else class="avatar-placeholder">
                    {{ activity.userInitial }}
                  </div>
                </div>
                <div class="activity-content flex-grow-1">
                  <div class="activity-text text-body-2">
                    <span 
                      class="activity-user-name font-weight-medium"
                      @click.stop="navigateToActivityUser(activity)"
                    >
                      {{ activity.userName }}
                    </span>
                    {{ activity.text }}
                  </div>
                  <div class="activity-time text-caption text-medium-emphasis mt-1">
                    {{ formatActivityTime(activity.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
            <v-progress-linear v-if="feedLoading" indeterminate color="primary" class="mt-2"></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="showDialogJoinButton"
      :show-leave-button="showDialogLeaveButton"
      :join-loading="selectedJoinLoading"
      :leave-loading="selectedLeaveLoading"
      :save-loading="saveLoading"
      :save-error="saveError"
      :delete-loading="deleteLoading"
      @save="handleDialogSave"
      @join="handleDialogJoin"
      @leave="handleDialogLeave"
      @delete="handleDialogDelete"
      @update="handleDialogUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t, locale } = useI18n()

const challenges = ref([])
const loading = ref(false)
const errorMessage = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))
const currentUserId = ref(getCurrentUserId())
const joiningId = ref(null)
const leavingId = ref(null)
const watchingId = ref(null)
const feedLoading = ref(false)
const feedActivities = ref([])

const detailsDialogOpen = ref(false)
const selectedChallenge = ref(null)
const saveLoading = ref(false)
const saveError = ref('')
const deleteLoading = ref(false)

const selectedIsOwner = computed(() => {
  if (!selectedChallenge.value) return false
  return isChallengeOwner(selectedChallenge.value.owner)
})

const selectedIsParticipant = computed(() => {
  if (!selectedChallenge.value) return false
  return isParticipant(selectedChallenge.value)
})

const selectedJoinLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return joiningId.value === selectedChallenge.value._id
})

const showDialogJoinButton = computed(() => {
  if (!selectedChallenge.value) return false
  
  if (isChallengeEnded(selectedChallenge.value)) {
    return false
  }
  
  if (selectedChallenge.value.challengeType !== 'habit') {
    return false
  }
  
  return (
    !!currentUserId.value &&
    !selectedIsOwner.value &&
    !selectedIsParticipant.value
  )
})

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

function getCurrentUserId() {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    const user = JSON.parse(userStr)
    return user.id || user._id || null
  } catch {
    return null
  }
}

function isChallengeOwner(owner) {
  if (!owner || !currentUserId.value) return false
  const ownerId = owner._id || owner
  return ownerId.toString() === currentUserId.value.toString()
}

function isParticipant(challenge) {
  if (!challenge.participants || !currentUserId.value) return false
  return challenge.participants.some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === currentUserId.value.toString()
  })
}

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

async function loadWatchedChallenges() {
  if (!currentUserId.value) {
    errorMessage.value = t('challenges.loginPrompt')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await challengeService.getWatchedChallenges(currentUserId.value)
    challenges.value = data.challenges || []
    // Load feed activities after challenges are loaded
    await loadFeedActivities()
  } catch (error) {
    console.error('Error loading watched challenges:', error)
    errorMessage.value = error.response?.data?.message || t('challenges.loadError')
  } finally {
    loading.value = false
  }
}

async function loadFeedActivities() {
  if (!currentUserId.value || challenges.value.length === 0) {
    feedActivities.value = []
    return
  }

  feedLoading.value = true
  
  try {
    const activities = []
    
    // Process each watched challenge
    for (const challenge of challenges.value) {
      // 1. Get comments (challenge diary entries)
      if (challenge.allowComments !== false) {
        try {
          const { data } = await challengeService.getComments(challenge._id)
          const comments = data.comments || []
          
          comments.forEach(comment => {
            const user = comment.userId
            const userName = user?.name || t('common.unknown')
            const userAvatar = user?.avatarUrl || null
            const userInitial = userName.charAt(0).toUpperCase()
            const userId = user?._id || user
            
            activities.push({
              id: `comment-${challenge._id}-${comment._id}`,
              type: 'comment',
              timestamp: new Date(comment.createdAt),
              userName,
              userAvatar,
              userInitial,
              userId,
              text: t('challenges.feed.commented', { challenge: challenge.title }),
              challengeId: challenge._id,
              challengeTitle: challenge.title
            })
          })
        } catch (error) {
          console.error(`Error loading comments for challenge ${challenge._id}:`, error)
        }
      }
      
      // 2. Get participants and their progress (joins and progress updates)
      if (challenge.participants && Array.isArray(challenge.participants)) {
        challenge.participants.forEach(participant => {
          const user = participant.userId
          const userName = user?.name || t('common.unknown')
          const userAvatar = user?.avatarUrl || null
          const userInitial = userName.charAt(0).toUpperCase()
          const userId = user?._id || user || participant.userId
          
          // Check if challenge was just finished
          const isFinished = checkChallengeFinished(challenge)
          const completedDays = participant.completedDays || []
          
          if (isFinished && completedDays.length > 0) {
            // Check if this is a recent completion (within last 7 days)
            const lastCompleted = completedDays[completedDays.length - 1]
            if (lastCompleted) {
              const lastDate = new Date(lastCompleted)
              const daysAgo = (new Date() - lastDate) / (1000 * 60 * 60 * 24)
              if (daysAgo <= 7) {
                activities.push({
                  id: `finished-${challenge._id}-${userId}`,
                  type: 'finished',
                  timestamp: lastDate,
                  userName,
                  userAvatar,
                  userInitial,
                  userId,
                  text: t('challenges.feed.finished', { challenge: challenge.title }),
                  challengeId: challenge._id,
                  challengeTitle: challenge.title
                })
              }
            }
          }
          
          // Add join activity (if participant has any completed days, they joined)
          if (completedDays.length > 0) {
            const firstDay = completedDays[0]
            if (firstDay) {
              const joinDate = new Date(firstDay)
              const daysAgo = (new Date() - joinDate) / (1000 * 60 * 60 * 24)
              // Only show recent joins (within last 30 days)
              if (daysAgo <= 30) {
                activities.push({
                  id: `join-${challenge._id}-${userId}`,
                  type: 'join',
                  timestamp: joinDate,
                  userName,
                  userAvatar,
                  userInitial,
                  userId,
                  text: t('challenges.feed.joined', { challenge: challenge.title }),
                  challengeId: challenge._id,
                  challengeTitle: challenge.title
                })
              }
            }
          }
          
          // Add progress updates (recent completed days)
          if (completedDays.length > 0) {
            const recentDays = completedDays
              .map(day => new Date(day))
              .filter(date => {
                const daysAgo = (new Date() - date) / (1000 * 60 * 60 * 24)
                return daysAgo <= 7 && daysAgo >= 0 // Last 7 days
              })
              .sort((a, b) => b - a) // Most recent first
            
            recentDays.forEach(dayDate => {
              activities.push({
                id: `progress-${challenge._id}-${userId}-${dayDate.toISOString()}`,
                type: 'progress',
                timestamp: dayDate,
                userName,
                userAvatar,
                userInitial,
                userId,
                text: t('challenges.feed.progress', { challenge: challenge.title }),
                challengeId: challenge._id,
                challengeTitle: challenge.title
              })
            })
          }
        })
      }
    }
    
    // Sort all activities by timestamp (newest first) and limit to 50
    feedActivities.value = activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50)
    
  } catch (error) {
    console.error('Error loading feed activities:', error)
  } finally {
    feedLoading.value = false
  }
}

function checkChallengeFinished(challenge) {
  // Check if endDate is in the past
  if (challenge.endDate) {
    try {
      const endDate = new Date(challenge.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < today) {
        return true
      }
    } catch {
      // Continue to check other conditions
    }
  }
  
  // For result challenges, check if all actions are done
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions) || challenge.actions.length === 0) {
      return false
    }
    
    return challenge.actions.every(action => {
      if (!action.checked) return false
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every(child => child.checked)
      }
      return true
    })
  }
  
  return false
}

function formatActivityTime(timestamp) {
  if (!timestamp) return ''
  
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return t('challenges.comments.justNow')
    if (diffMins < 60) return t('challenges.comments.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('challenges.comments.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('challenges.comments.daysAgo', { count: diffDays })
    
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(date)
  } catch (err) {
    return timestamp.toLocaleDateString()
  }
}

async function joinChallenge(challenge) {
  if (!currentUserId.value) return

  joiningId.value = challenge._id
  try {
    await challengeService.joinChallenge(challenge._id, { userId: currentUserId.value })
    await loadWatchedChallenges()
    if (detailsDialogOpen.value && selectedChallenge.value?._id === challenge._id) {
      await handleDialogUpdate()
    }
  } catch (error) {
    console.error('Error joining challenge:', error)
    alert(error.response?.data?.message || t('challenges.joinError'))
  } finally {
    joiningId.value = null
  }
}

async function watchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  
  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
  }
  
  try {
    await challengeService.watchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (error) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
    }
    console.error('Error watching challenge:', error)
    alert(error.response?.data?.message || t('challenges.watchError'))
  } finally {
    watchingId.value = null
  }
}

async function unwatchChallenge(challenge) {
  if (!currentUserId.value) return

  watchingId.value = challenge._id
  
  // Optimistically update watchers count
  const challengeIndex = challenges.value.findIndex(c => c._id === challenge._id)
  if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
    challenges.value[challengeIndex].watchersCount = Math.max(0, (challenges.value[challengeIndex].watchersCount || 0) - 1)
  }
  
  try {
    await challengeService.unwatchChallenge(challenge._id, currentUserId.value)
    await loadWatchedChallenges()
    if (detailsDialogOpen.value && selectedChallenge.value?._id === challenge._id) {
      detailsDialogOpen.value = false
    }
  } catch (error) {
    // Revert optimistic update on error
    if (challengeIndex !== -1 && challenges.value[challengeIndex].watchersCount !== undefined) {
      challenges.value[challengeIndex].watchersCount = (challenges.value[challengeIndex].watchersCount || 0) + 1
    }
    console.error('Error unwatching challenge:', error)
    alert(error.response?.data?.message || t('challenges.unwatchError'))
  } finally {
    watchingId.value = null
  }
}

function openDetails(challenge) {
  selectedChallenge.value = challenge
  detailsDialogOpen.value = true
}

function handleOwnerNavigated() {
  // Close dialog when owner is navigated
  detailsDialogOpen.value = false
}

async function handleDialogSave() {
  // Not implemented for watched challenges
}

async function leaveChallenge(challenge) {
  if (!currentUserId.value) {
    errorMessage.value = t('notifications.mustLogin')
    return
  }

  if (!challenge || !challenge._id) {
    errorMessage.value = t('notifications.joinError')
    return
  }

  leavingId.value = challenge._id
  errorMessage.value = ''

  try {
    await challengeService.leaveChallenge(challenge._id, { userId: currentUserId.value })
    
    // Refresh watched challenges list
    await loadWatchedChallenges()
    
    // Refresh the selected challenge if dialog is open
    if (selectedChallenge.value?._id === challenge._id) {
      // Fetch fresh challenge data to get updated participants list
      try {
        const { data } = await challengeService.getChallenge(challenge._id)
        selectedChallenge.value = data
      } catch (error) {
        // Fallback to finding in list
        selectedChallenge.value = challenges.value.find(c => c._id === challenge._id) || null
      }
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.joinError')
  } finally {
    leavingId.value = null
  }
}

async function handleDialogJoin(challenge) {
  await joinChallenge(challenge)
}

async function handleDialogLeave() {
  if (!selectedChallenge.value) return
  await leaveChallenge(selectedChallenge.value)
}

async function handleDialogDelete() {
  // Not implemented for watched challenges
}

async function handleDialogUpdate() {
  if (!selectedChallenge.value) return
  try {
    const { data } = await challengeService.getChallenge(selectedChallenge.value._id)
    selectedChallenge.value = data
    // Update in challenges list
    const index = challenges.value.findIndex(c => c._id === data._id)
    if (index !== -1) {
      challenges.value[index] = data
    }
  } catch (error) {
    console.error('Error updating challenge:', error)
  }
}

// Format date range
function formatDateRange(start, end) {
  const startFormatted = formatDate(start)
  const endFormatted = formatDate(end)
  return startFormatted && endFormatted
    ? `${startFormatted} - ${endFormatted}`
    : startFormatted || endFormatted || ''
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  try {
    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    return formatter.format(date)
  } catch (err) {
    return date.toLocaleDateString()
  }
}

// Get owner progress
function getOwnerProgress(challenge) {
  if (!challenge.owner) return null
  
  // For result challenges, check actions
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions)) return null
    // Count checked actions (including parent and child actions)
    let checkedCount = 0
    challenge.actions.forEach(action => {
      if (action.checked) checkedCount++
      if (action.children && Array.isArray(action.children)) {
        action.children.forEach(child => {
          if (child.checked) checkedCount++
        })
      }
    })
    return checkedCount
  }
  
  // For habit challenges, check completedDays
  if (!challenge.participants) return null
  
  const ownerId = challenge.owner._id || challenge.owner
  const participant = challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === ownerId.toString()
  })
  
  if (!participant || !participant.completedDays) return null
  return participant.completedDays.length
}

function getOwnerProgressDone(challenge) {
  const progress = getOwnerProgress(challenge)
  return progress !== null ? progress : 0
}

function getOwnerProgressTotal(challenge) {
  if (challenge.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions)) return 0
    // Count total actions (including parent and child actions)
    let totalCount = 0
    challenge.actions.forEach(action => {
      totalCount++ // Count parent action
      if (action.children && Array.isArray(action.children)) {
        totalCount += action.children.length // Count child actions
      }
    })
    return Math.max(1, totalCount) // At least 1 to avoid division by zero
  }
  
  return getChallengeTotalDays(challenge)
}

function getOwnerProgressPercentage(challenge) {
  const done = getOwnerProgressDone(challenge)
  const total = getOwnerProgressTotal(challenge)
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

function getProgressBarColor(challenge) {
  const percentage = getOwnerProgressPercentage(challenge)
  
  if (percentage === 100) {
    return 'success' // Green for 100%
  } else if (percentage >= 31) {
    return 'primary' // Bright accent blue/purple for 31-99%
  } else {
    return 'info' // Will be overridden with dark blue via CSS
  }
}

function getProgressBarColorClass(challenge) {
  const percentage = getOwnerProgressPercentage(challenge)
  
  if (percentage <= 30) {
    return 'progress-low'
  }
  return ''
}

function getChallengeTotalDays(challenge) {
  if (!challenge.startDate || !challenge.endDate) return 0
  
  try {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    if (challenge.frequency === 'everyOtherDay') {
      let count = 0
      const current = new Date(start)
      let dayIndex = 0
      while (current <= end) {
        if (dayIndex % 2 === 0) count++
        current.setDate(current.getDate() + 1)
        dayIndex++
      }
      return Math.max(1, count)
    }
    
    const diffTime = end - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diffDays)
  } catch {
    return 0
  }
}

// Top Performers - aggregate from all watched challenges
const topPerformers = computed(() => {
  // Map to track unique participants and their best progress
  const participantMap = new Map()
  
  challenges.value.forEach(challenge => {
    // Only include habit challenges (result challenges don't have participant progress)
    if (challenge.challengeType !== 'habit') return
    
    if (challenge.participants && Array.isArray(challenge.participants)) {
      challenge.participants.forEach(participant => {
        const participantId = getParticipantId(participant)
        const progressPercentage = getParticipantProgressPercentageForChallenge(participant, challenge)
        
        // Only include participants with progress > 0
        if (progressPercentage <= 0) return
        
        // Keep the best progress for each participant
        if (!participantMap.has(participantId) || participantMap.get(participantId).progressPercentage < progressPercentage) {
          participantMap.set(participantId, {
            participant,
            challenge,
            progressPercentage
          })
        }
      })
    }
  })
  
  // Convert to array, sort by progress percentage (descending) and take top 5
  const sorted = Array.from(participantMap.values())
    .sort((a, b) => {
      // Sort by progress percentage descending
      const diff = b.progressPercentage - a.progressPercentage
      return diff !== 0 ? diff : 0
    })
    .slice(0, 5)
  
  // Store progress percentage on participant for display
  return sorted.map(item => {
    const participant = { ...item.participant }
    participant._cachedProgressPercentage = item.progressPercentage
    participant._cachedChallenge = item.challenge
    return participant
  })
})

function getParticipantProgress(participant, challenge) {
  // For result challenges, participants don't have individual progress
  // Only the owner tracks progress through actions
  if (challenge.challengeType === 'result') {
    return 0
  }
  
  // For habit challenges, use completedDays
  if (!participant.completedDays || !Array.isArray(participant.completedDays)) return 0
  return participant.completedDays.length
}

function getParticipantProgressPercentage(participant) {
  // Use cached progress percentage if available (from topPerformers)
  if (participant._cachedProgressPercentage !== undefined) {
    return participant._cachedProgressPercentage
  }
  
  // Otherwise, find the challenge this participant belongs to
  const challenge = challenges.value.find(c => {
    return c.participants?.some(p => {
      const pId = p.userId?._id || p.userId || p._id
      const participantId = participant.userId?._id || participant.userId || participant._id
      return pId && participantId && pId.toString() === participantId.toString()
    })
  })
  
  if (!challenge) return 0
  return getParticipantProgressPercentageForChallenge(participant, challenge)
}

function getParticipantProgressPercentageForChallenge(participant, challenge) {
  const progress = getParticipantProgress(participant, challenge)
  const total = getChallengeTotalDays(challenge)
  if (total === 0) return 0
  return Math.round((progress / total) * 100)
}

function getParticipantId(participant) {
  return participant.userId?._id || participant.userId || participant._id || participant
}

function getParticipantName(participant) {
  return participant.userId?.name || participant.name || t('common.unknown')
}

function getParticipantAvatar(participant) {
  return participant.userId?.avatarUrl || participant.avatarUrl || null
}

function getParticipantInitial(participant) {
  const name = getParticipantName(participant)
  return name.charAt(0).toUpperCase()
}

function canJoin(challenge) {
  if (isChallengeEnded(challenge)) return false
  if (challenge.challengeType !== 'habit') return false
  if (!currentUserId.value) return false
  if (isChallengeOwner(challenge.owner)) return false
  if (isParticipant(challenge)) return false
  return true
}

function navigateToUser(user) {
  if (!user) return
  const userId = user._id || user
  if (!userId) return
  router.push(`/users/${userId}`)
}

function navigateToActivityUser(activity) {
  if (activity.userId) {
    router.push(`/users/${activity.userId}`)
  }
}

onMounted(() => {
  loadWatchedChallenges()
})
</script>

<style scoped>
.watched-challenges {
  width: 100%;
}

.watched-challenges-layout {
  margin: 0;
}

.challenges-column {
  padding: 0 12px;
}

.sidebar-column {
  padding: 0 12px;
}

.challenges-list {
  padding: 0;
}

.watched-challenge-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 12px;
}

.watched-challenge-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.challenge-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.challenge-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.challenge-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.author-info {
  display: flex;
  align-items: center;
}

.author-name {
  color: #1976d2;
  cursor: pointer;
  transition: opacity 0.2s;
}

.author-name:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.owner-progress {
  margin-top: 8px;
}

.progress-numbers {
  font-size: calc(0.75rem + 4px);
  font-weight: 700;
}

.owner-progress-bar :deep(.v-progress-linear__determinate) {
  transition: background-color 0.3s ease;
}

.owner-progress-bar.progress-low :deep(.v-progress-linear__determinate) {
  background: #1565C0 !important; /* Dark blue for 0-30% */
}

.challenge-actions {
  margin-top: 12px;
}

.join-button,
.unwatch-button {
  border-radius: 12px !important;
}

.top-performers-card,
.news-feed-card {
  border-radius: 12px;
}

.performers-list {
  padding: 0;
}

.performer-item {
  padding: 8px 0;
}

.performer-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.performer-avatar {
  flex-shrink: 0;
}

.avatar-img,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1FA0F6;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.performer-info {
  min-width: 0;
}

.performer-name {
  margin-bottom: 4px;
}

.performer-progress {
  width: 100%;
}

.feed-content {
  padding: 0 !important;
  height: 500px;
  overflow-y: auto;
  overflow-x: hidden;
}

.feed-activities {
  padding: 8px 0;
}

.feed-activity-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s;
}

.feed-activity-item:last-child {
  border-bottom: none;
}

.feed-activity-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.activity-avatar {
  flex-shrink: 0;
}

.activity-avatar .avatar-img,
.activity-avatar .avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.activity-avatar .avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1FA0F6;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.activity-content {
  min-width: 0;
}

.activity-user-name {
  color: #1976d2;
  cursor: pointer;
  transition: opacity 0.2s;
}

.activity-user-name:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.activity-text {
  color: rgba(0, 0, 0, 0.87);
  line-height: 1.5;
}

.activity-time {
  color: rgba(0, 0, 0, 0.6);
}

@media (max-width: 959px) {
  .challenges-column,
  .sidebar-column {
    padding: 0 16px;
  }
  
  .feed-content {
    height: 400px;
  }
  
  .feed-activity-item {
    padding: 10px 12px;
  }
}
</style>

