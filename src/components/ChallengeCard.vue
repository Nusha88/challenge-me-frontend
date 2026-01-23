<template>
  <v-card
    class="challenge-card"
    :class="{ 
      'owner-challenge': isOwner,
      'finished-challenge': isFinished,
      [challenge.challengeType]: challenge.challengeType
    }"
    @click="$emit('click', challenge)"
  >
    <div v-if="isUpcoming" class="upcoming-badge">
      {{ t('challenges.upcoming') }}
    </div>
    <div v-else-if="isFinished && isSuccessful" class="finished-badge success-badge">
      <v-icon size="small" class="mr-1">mdi-check-circle</v-icon>
      {{ t('challenges.successful') }}
    </div>
    <div v-else-if="isFinished && !isSuccessful" class="finished-badge failed-badge">
      <v-icon size="small" class="mr-1">mdi-close-circle</v-icon>
      {{ t('challenges.failed') }}
    </div>
    
    <div class="card-header" :class="challenge.challengeType">
      <v-icon 
        :color="challenge.challengeType === 'habit' ? 'success' : 'primary'"
        class="type-icon"
      >
        {{ challenge.challengeType === 'habit' ? 'mdi-repeat' : 'mdi-sword-cross' }}
      </v-icon>

      <div class="type-label-wrapper">
        <v-icon 
          v-if="challenge.privacy === 'private'"
          size="12"
          color="grey-darken-1"
          class="privacy-icon-header"
        >mdi-lock</v-icon>
        <div class="type-label" :class="challenge.challengeType">
          {{ challenge.challengeType === 'habit' ? t('challenges.typeHabitLabel') : t('challenges.typeResultLabel') }}
        </div>
      </div>
    </div>
    
    <!-- Header with image and title -->
    <div class="challenge-header" :class="challenge.challengeType">
      <div class="challenge-image-container">
        <img v-if="challenge.imageUrl" :src="challenge.imageUrl" class="challenge-image" />
        <v-icon v-else size="32" color="grey-lighten-1">{{ challenge.challengeType === 'habit' ? 'mdi-cached' : 'mdi-sword' }}</v-icon>
      </div>
      
      <div class="challenge-header-content">
        <div class="challenge-title-row">
          <span class="text-subtitle-1 font-weight-bold">{{ challenge.title }}</span>
        </div>
      </div>
    </div>

    <v-card-text v-if="challenge.challengeType === 'result' && challenge.actions" class="pt-2 pb-0">
      <div class="milestones-preview">
        <div 
          v-for="action in challenge.actions.slice(0, 2)" 
          :key="action.id"
          class="milestone-item"
          :class="{ 'done': action.checked }"
        >
          <v-icon size="16" :color="action.checked ? 'success' : 'grey'">
            {{ action.checked ? 'mdi-check-circle' : 'mdi-circle-outline' }}
          </v-icon>
          <span class="ml-2 text-caption truncate">{{ action.text }}</span>
        </div>
        <div v-if="challenge.actions.length > 2" class="text-caption text-grey ml-6">
          + ещё {{ challenge.actions.length - 2 }}
        </div>
      </div>
    </v-card-text>
    
    <v-card-text v-if="challenge.challengeType === 'habit'" class="pt-2 pb-0">
      <div v-if="streakDays > 0 && isTodayCompleted" class="streak-preview streak-completed">
        <div class="streak-item">
          <v-icon size="16" color="success">mdi-fire</v-icon>
          <span class="ml-2 text-caption streak-text streak-text-completed">{{ streakDays }} {{ t('navigation.streakDays').toUpperCase() }}</span>
        </div>
      </div>
      <div v-else-if="streakDays > 0 && !isTodayCompleted" class="streak-badge streak-status-warning" @click.stop="completeDay">
        <Flame :size="16" class="fire-icon-warning flicker-animation" />
        <span class="ml-2 text-caption streak-text-warning">{{ streakDays }}</span>
        <span class="ml-2 text-caption keep-fire-text">{{ t('challenges.keepFireAlive') }}</span>
      </div>
      <div v-else class="streak-badge empty" @click.stop="completeDay">
        <Flame :size="16" class="fire-icon-empty" />
        <span class="text-grey">{{ t('challenges.igniteFirstDay') }}</span>
      </div>
    </v-card-text>
    
    <v-card-text 
      v-if="challenge.challengeType !== 'result' || !challenge.actions || challenge.actions.length === 0"
      class="flex-grow-1 pt-3 pb-0"
    >
      <p class="mb-0 text-body-2 challenge-description">{{ challenge.description }}</p>
    </v-card-text>
    
    <v-card-actions v-if="showJoinButton || currentUserId" class="py-2 px-4">
      <v-btn
        v-if="canJoin"
        color="primary"
        size="small"
        variant="flat"
        class="join-button card-action-button"
        :loading="joiningId === challenge._id"
        @click.stop="$emit('join', challenge)"
      >
        <span class="join-button-content">
          <span v-if="participantCount > 0" class="participant-count">{{ participantCount }}</span>
          <span v-if="participantCount > 0" class="separator">|</span>
          <span>{{ t('challenges.join') }}</span>
        </span>
      </v-btn>
      <v-btn
        v-else-if="canLeave"
        color="error"
        size="small"
        variant="outlined"
        class="leave-button card-action-button"
        :loading="leavingId === challenge._id"
        @click.stop="$emit('leave', challenge)"
      >
        <span class="leave-button-content">
          <span v-if="participantCount > 0" class="participant-count">{{ participantCount }}</span>
          <span v-if="participantCount > 0" class="separator">|</span>
          <span>{{ t('challenges.leave') }}</span>
        </span>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        v-if="currentUserId && !isOwner && !isFinished"
        size="small"
        variant="outlined"
        :class="['watch-button', { 'watch-button--watched': isWatched }, 'card-action-button']"
        :loading="watchingId === challenge._id"
        @click.stop="handleWatchClick"
      >
        <v-icon v-if="isWatched" size="small" class="mr-1">mdi-eye</v-icon>
        <v-icon v-else size="small" class="mr-1">mdi-eye-outline</v-icon>
        {{ isWatched ? t('challenges.unwatch') : t('challenges.watch') }}
      </v-btn>
    </v-card-actions>
    
    <!-- Created by and Participants - Above progress bar -->
    <div class="challenge-meta-container">
      <v-card-subtitle v-if="challenge.owner" class="mb-2 pa-0 px-4 d-flex align-center justify-space-between">
        <template v-if="isOwner">
          <span>{{ t('challenges.createdByMe') }}</span>
        </template>
        <template v-else>
          <span class="created-by-text">
            {{ t('challenges.createdBy').split('{name}')[0] }}
            <span 
              class="owner-name-link" 
              @click.stop="navigateToOwner"
            >
              {{ challenge.owner.name || t('common.unknown') }}
            </span>
          </span>
        </template>
        <div v-if="watchersCount !== undefined" class="watchers-count d-flex align-center">
          <v-icon size="small" class="mr-1">mdi-eye</v-icon>
          <span>{{ watchersCount }}</span>
        </div>
      </v-card-subtitle>
      
      <div v-if="challenge.participants && challenge.participants.length > 0" class="participants-container mb-2 px-4">
        <div
          v-for="participant in displayedParticipants(challenge.participants)"
          :key="participant.userId?._id || participant.userId || participant._id || participant"
          class="participant-avatar"
          :style="getParticipantAvatarStyle(participant)"
          :title="(participant.userId?.name || participant.name) || t('common.unknown')"
        >
          <img
            v-if="getParticipantAvatarUrl(participant)"
            :src="getParticipantAvatarUrl(participant)"
            :alt="(participant.userId?.name || participant.name) || t('common.unknown')"
            class="participant-avatar-img"
          />
          <span v-else>{{ getParticipantInitial(participant) }}</span>
        </div>
        <div
          v-if="challenge.participants.length > 6"
          class="participant-avatar participant-more"
          :title="t('challenges.moreParticipants', { count: challenge.participants.length - 6 })"
        >
          +{{ challenge.participants.length - 6 }}
        </div>
      </div>
    </div>
    
    <!-- Progress Bar - Stuck to bottom -->
    <div v-if="challenge.challengeType" class="progress-bar-container">
      <div class="d-flex justify-space-between mb-1 px-4">
        <span class="text-caption">
          <template v-if="challenge.challengeType === 'result'">
            {{ t('challenges.progressActions', { done: progressDone, total: progressTotal }) }}
          </template>
          <template v-else>
            {{ t('challenges.progressDays', { passed: progressDone, total: progressTotal }) }}
          </template>
        </span>
        <span class="text-caption font-weight-medium">{{ progressPercentage }}%</span>
      </div>
      <v-progress-linear
        :model-value="progressPercentage"
        color="primary"
        height="6"
        rounded
        class="mx-0"
      ></v-progress-linear>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { Flame } from 'lucide-vue-next'

const props = defineProps({
  challenge: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    default: null
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  joiningId: {
    type: String,
    default: null
  },
  leavingId: {
    type: String,
    default: null
  },
  watchingId: {
    type: String,
    default: null
  },
  isWatched: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'join', 'leave', 'watch', 'unwatch', 'owner-navigated', 'update'])

// Local watchers count that can be updated in real-time
const localWatchersCount = ref(props.challenge.watchersCount ?? 0)

// Watch for changes to challenge prop
watch(() => props.challenge.watchersCount, (newCount) => {
  if (newCount !== undefined) {
    localWatchersCount.value = newCount
  }
}, { immediate: true })

// Computed watchers count that uses local value
const watchersCount = computed(() => {
  return localWatchersCount.value
})

const { t, locale } = useI18n()
const router = useRouter()

// Computed properties
const isOwner = computed(() => {
  if (!props.challenge.owner || !props.currentUserId) return false
  const ownerId = props.challenge.owner._id || props.challenge.owner
  return ownerId === props.currentUserId
})

const isFinished = computed(() => {
  // Check if endDate is in the past
  if (props.challenge.endDate) {
  try {
    const endDate = new Date(props.challenge.endDate)
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
  if (props.challenge.challengeType === 'result') {
    if (!props.challenge.actions || !Array.isArray(props.challenge.actions) || props.challenge.actions.length === 0) {
      return false
    }
    
    // Check if all actions and their children are checked
    const allActionsDone = props.challenge.actions.every(action => {
      // Parent action must be checked
      if (!action.checked) return false
      
      // All children must be checked (if any exist)
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every(child => child.checked)
      }
      
      return true
    })
    
    if (allActionsDone) {
      return true
    }
  }
  
  return false
})

const isSuccessful = computed(() => {
  if (!isFinished.value) return false
  
  // For result challenges, check if all actions are done
  if (props.challenge.challengeType === 'result') {
    if (!props.challenge.actions || !Array.isArray(props.challenge.actions) || props.challenge.actions.length === 0) {
    return false
  }
    
    // Check if all actions and their children are checked
    return props.challenge.actions.every(action => {
      // Parent action must be checked
      if (!action.checked) return false
      
      // All children must be checked (if any exist)
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every(child => child.checked)
      }
      
      return true
    })
  }
  
  // For habit challenges, check if user completed all required days (100%)
  if (props.challenge.challengeType === 'habit') {
    return progressPercentage.value === 100
  }
  
  return false
})

const isUpcoming = computed(() => {
  if (!props.challenge.startDate) return false
  try {
    const startDate = new Date(props.challenge.startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startDate.setHours(0, 0, 0, 0)
    return startDate > today
  } catch {
    return false
  }
})

const canJoin = computed(() => {
  if (isFinished.value) return false
  if (props.challenge.challengeType !== 'habit') return false
  if (!props.currentUserId) return false
  if (isOwner.value) return false
  
  // Check if already a participant
  const isParticipant = (props.challenge.participants || []).some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === props.currentUserId.toString()
  })
  
  return !isParticipant
})

const canLeave = computed(() => {
  if (isFinished.value) return false
  if (props.challenge.challengeType !== 'habit') return false
  if (!props.currentUserId) return false
  if (isOwner.value) return false
  
  // Check if user is a participant
  const isParticipant = (props.challenge.participants || []).some(participant => {
    const userId = participant.userId?._id || participant.userId || participant._id || participant
    return userId && userId.toString() === props.currentUserId.toString()
  })
  
  return isParticipant
})

const participantCount = computed(() => {
  return props.challenge.participants ? props.challenge.participants.length : 0
})

function handleWatchClick() {
  // Optimistically update watchers count
  if (props.isWatched) {
    // Unwatching - decrease count
    if (localWatchersCount.value > 0) {
      localWatchersCount.value--
    }
    emit('unwatch', props.challenge)
  } else {
    // Watching - increase count
    localWatchersCount.value++
    emit('watch', props.challenge)
  }
}

const progressDone = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === 'result') {
    if (!props.challenge.actions || !Array.isArray(props.challenge.actions)) return 0
    let count = 0
    props.challenge.actions.forEach(action => {
      if (action.checked) count++
      if (action.children && Array.isArray(action.children)) {
        action.children.forEach(child => {
          if (child.checked) count++
        })
      }
    })
    return count
  } else {
    if (!props.currentUserId || !props.challenge.participants) return 0
    
    const participant = props.challenge.participants.find(p => {
      const userId = p.userId?._id || p.userId || p._id
      return userId && userId.toString() === props.currentUserId.toString()
    })
    
    if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return 0
    return participant.completedDays.length
  }
})

const progressTotal = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === 'result') {
    if (!props.challenge.actions || !Array.isArray(props.challenge.actions)) return 0
    let count = 0
    props.challenge.actions.forEach(action => {
      count++ // Count parent action
      if (action.children && Array.isArray(action.children)) {
        count += action.children.length // Count child actions
      }
    })
    return count
  } else {
    if (!props.challenge.startDate || !props.challenge.endDate) return 0
    
    try {
      const start = new Date(props.challenge.startDate)
      const end = new Date(props.challenge.endDate)
      
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
      
      start.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      
      // For "every other day" frequency, only count every other day
      if (props.challenge.frequency === 'everyOtherDay') {
        let count = 0
        const current = new Date(start)
        let dayIndex = 0
        
        while (current <= end) {
          // Only count enabled days (day 0, 2, 4, 6, etc.)
          if (dayIndex % 2 === 0) {
            count++
          }
          current.setDate(current.getDate() + 1)
          dayIndex++
        }
        
        return count
      }
      
      // For other frequencies, count all days
      const diffTime = end - start
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      
      return diffDays
    } catch {
      return 0
    }
  }
})

const progressPercentage = computed(() => {
  const done = progressDone.value
  const total = progressTotal.value
  
  if (total === 0) return 0
  const percentage = Math.round((done / total) * 100)
  return Math.min(100, Math.max(0, percentage))
})

// Calculate streak for habit challenges
const streakDays = computed(() => {
  if (props.challenge.challengeType !== 'habit') return 0
  if (!props.currentUserId || !props.challenge.participants) return 0
  
  // Find current user's participant entry
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === props.currentUserId.toString()
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return 0
  
  // Helper function to format date string
  function formatDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Normalize completedDays to date strings
  const completedDateStrings = participant.completedDays
    .map(date => {
      if (!date) return null
      let dateStr = String(date)
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]
      }
      return dateStr.substring(0, 10)
    })
    .filter(Boolean)
  
  if (completedDateStrings.length === 0) return 0
  
  // Sort dates descending (most recent first)
  const sortedDates = [...completedDateStrings].sort((a, b) => b.localeCompare(a))
  
  // Start from today or the most recent completed day
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)
  
  // Check if today is completed, if not start from yesterday
  let startDate = new Date(today)
  if (!completedDateStrings.includes(todayStr)) {
    startDate.setDate(startDate.getDate() - 1)
  }
  
  // Calculate streak by counting consecutive days backwards
  let streak = 0
  let currentDate = new Date(startDate)
  
  for (let i = 0; i < 365; i++) {
    const dateStr = formatDateString(currentDate)
    if (completedDateStrings.includes(dateStr)) {
      streak++
    } else {
      break
    }
    currentDate.setDate(currentDate.getDate() - 1)
    currentDate.setHours(0, 0, 0, 0)
  }
  
  return streak
})

// Check if today is completed for this challenge
const isTodayCompleted = computed(() => {
  if (props.challenge.challengeType !== 'habit') return false
  if (!props.currentUserId || !props.challenge.participants) return false
  
  // Find current user's participant entry
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === props.currentUserId.toString()
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return false
  
  // Format today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)
  
  // Check if today's date is in completedDays
  return participant.completedDays.some(date => {
    if (!date) return false
    let dateStr = String(date)
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0]
    }
    dateStr = dateStr.substring(0, 10)
    return dateStr === todayStr
  })
})

// Helper function to format date string
function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Complete challenge for today
async function completeDay() {
  if (props.challenge.challengeType !== 'habit') return
  if (!props.currentUserId || !props.challenge.participants) return
  
  // Find current user's participant entry
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === props.currentUserId.toString()
  })
  
  if (!participant) return
  
  // Get current completedDays array
  const currentCompletedDays = Array.isArray(participant.completedDays) 
    ? [...participant.completedDays] 
    : []
  
  // Format today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)
  
  // Check if today is already completed
  const hasToday = currentCompletedDays.some(date => {
    if (!date) return false
    let dateStr = String(date)
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0]
    }
    dateStr = dateStr.substring(0, 10)
    return dateStr === todayStr
  })
  
  if (hasToday) return // Already completed
  
  // Add today to completedDays
  const newCompletedDays = [...currentCompletedDays, todayStr]
  
  try {
    // Update via API
    await challengeService.updateParticipantCompletedDays(
      props.challenge._id,
      props.currentUserId,
      newCompletedDays
    )
    
    // Update local challenge data
    if (participant) {
      participant.completedDays = newCompletedDays
    }
    
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('participant-completed-days-updated'))
    window.dispatchEvent(new Event('challenge-updated'))
    
    // Emit update event to parent
    emit('update')
  } catch (error) {
    console.error('Error completing challenge:', error)
  }
}

// Helper functions
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

function displayedParticipants(participants) {
  if (!participants || !Array.isArray(participants)) return []
  return participants.slice(0, 6)
}

function getParticipantColor(participant) {
  const userId = participant.userId?._id || participant.userId || participant._id || participant
  const name = participant.userId?.name || participant.name || ''
  const seed = userId?.toString() || name
  
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = Math.abs(hash % 360)
  const saturation = 60 + (Math.abs(hash) % 20)
  const lightness = 50 + (Math.abs(hash) % 15)
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function getParticipantInitial(participant) {
  const name = participant.userId?.name || participant.name || t('common.unknown')
  return name.charAt(0).toUpperCase()
}

function getParticipantAvatarUrl(participant) {
  return participant.userId?.avatarUrl || participant.avatarUrl || null
}

function getParticipantAvatarStyle(participant) {
  const avatarUrl = getParticipantAvatarUrl(participant)
  if (avatarUrl) {
    return {}
  }
  return { backgroundColor: getParticipantColor(participant) }
}

function navigateToOwner() {
  if (!props.challenge.owner) return
  
  // Get owner ID - handle both populated object and ID string
  const ownerId = props.challenge.owner._id || props.challenge.owner
  
  if (!ownerId) return
  
  // Emit event to notify parent component (e.g., dialog should close)
  emit('owner-navigated')
  
  router.push(`/heroes/${ownerId}`)
}
</script>

<style scoped>
.challenge-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  border: 1px solid transparent; /* Добавляем прозрачную рамку */
}

.challenge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.challenge-card.owner-challenge:hover {
  box-shadow: 0 4px 12px rgba(31, 160, 246, 0.3);
}

/* Различие стилей карточек */
/* Квест: выглядит более "премиально" */
.challenge-card.result {
  background-color: #f5f0ff !important; /* Светло-фиолетовый фон */
  border-color: #e9d8fd !important; /* Фиолетовая рамка */
  border-left: 4px solid #A62EE8; /* Фиолетовый акцент */
}

/* Ритуал: выглядит более спокойным */
.challenge-card.habit {
  background-color: #f0fff4 !important; /* Светло-зеленый фон */
  border-color: #c6f6d5 !important; /* Зеленая рамка */
  border-left: 4px solid #4CAF50; /* Зеленый акцент */
  min-height: 100px; /* Компактные для ритуалов */
}

.challenge-card.finished-challenge {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.06) 100%);
}

/* Override finished background for habit/result types */
.challenge-card.finished-challenge.habit {
  background-color: #f0fff4 !important;
}

.challenge-card.finished-challenge.result {
  background-color: #f5f0ff !important;
}

.card-header {
  position: relative;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 20px;
}

.type-label-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.privacy-icon-header {
  flex-shrink: 0;
}

.type-label {
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 1px;
  padding: 2px 6px;
  border-radius: 4px;
}

.type-label.habit {
  color: #4CAF50;
  border: 1px solid #4CAF50;
}

.type-label.result {
  color: #A62EE8;
  border: 1px solid #A62EE8;
}

.challenge-header {
  display: flex;
  gap: 12px;
  padding: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

@media (min-width: 600px) {
  .challenge-header {
    gap: 16px;
    padding: 16px;
  }
}

/* Стили заголовка */
.challenge-header.result .challenge-image-container {
  border: 2px solid #A62EE8; /* Фиолетовая рамка для эпиков */
}

.challenge-image-container {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 600px) {
  .challenge-image-container {
    width: 80px;
    height: 80px;
  }
}

.challenge-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.challenge-image-placeholder {
  opacity: 0.5;
}

.challenge-header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-width: 0;
}

.challenge-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.challenge-title-row .text-subtitle-1 {
  line-height: 1.2;
}

.privacy-icon {
  flex-shrink: 0;
  opacity: 0.7;
}

.challenge-duration {
  margin-top: 4px;
}

/* Бейджик сложности */
.difficulty-badge {
  display: flex;
  align-items: center;
  background: rgba(255, 165, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  width: fit-content;
  color: #ff9800;
  font-weight: bold;
  margin-left: 4px;
}

/* Превью милстоунов */
.milestones-preview {
  background: rgba(0, 0, 0, 0.03);
  padding: 8px;
  border-radius: 8px;
  margin-top: 4px;
}

.milestone-item {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.milestone-item.done span {
  text-decoration: line-through;
  opacity: 0.6;
}

/* Превью стрика для ритуалов */
.streak-preview {
  background: rgba(255, 140, 66, 0.08);
  padding: 8px;
  border-radius: 8px;
  margin-top: 4px;
  display: flex;
  justify-content: center;
}

.streak-preview.streak-completed {
  background: rgba(76, 175, 80, 0.1);
}

.streak-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.streak-text {
  color: #ff9800 !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.streak-text-completed {
  color: #4caf50 !important;
}

/* Streak badge base styles */
.streak-badge {
  border-radius: 8px;
  padding: 8px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Empty streak badge */
.streak-badge.empty {
  background: rgba(0, 0, 0, 0.03);
  border: 1.5px dashed rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

/* Warning streak badge - streak at risk */
.streak-status-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.5);
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.2);
  cursor: pointer;
}

.streak-badge.empty:hover {
  background: rgba(255, 152, 0, 0.1); /* Цвет огня, но очень прозрачный */
  border-style: solid;
  border-color: rgba(255, 152, 0, 0.5);
}

.streak-badge.empty .fire-icon-empty {
  animation: pulse-gray 2s infinite ease-in-out;
  color: #9e9e9e;
  flex-shrink: 0;
}

/* Анимация пульсации */
@keyframes pulse-gray {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.5; }
}

/* Flicker animation for warning fire icon */
.flicker-animation {
  animation: fire-flicker 1.2s infinite alternate;
}

@keyframes fire-flicker {
  from { opacity: 0.5; filter: drop-shadow(0 0 2px orange); }
  to { opacity: 1; filter: drop-shadow(0 0 8px yellow); }
}

.fire-icon-warning {
  color: #ff9800;
  flex-shrink: 0;
}

.streak-text-warning {
  color: #ff9800 !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.keep-fire-text {
  color: #ff9800 !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.challenge-meta-container {
  padding-top: 8px;
  padding-bottom: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.progress-bar-container {
  margin-top: auto;
  padding-bottom: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* Обновленный прогресс-бар */
.progress-bar-container :deep(.v-progress-linear) {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.progress-bar-container :deep(.v-progress-linear__determinate) {
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
}

/* Если это Эпик, делаем прогресс золотым/фиолетовым */
.result .progress-bar-container :deep(.v-progress-linear__determinate) {
  background: linear-gradient(90deg, #A62EE8 0%, #FFD700 100%) !important;
}

.upcoming-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 0 0 0 4px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(31, 160, 246, 0.3);
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.finished-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  color: white;
  padding: 6px 12px;
  border-radius: 0 0 0 4px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.success-badge {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.failed-badge {
  background: linear-gradient(135deg, #F44336 0%, #C62828 100%);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
}

.participants-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  cursor: default;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  overflow: hidden;
}

.participant-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.participant-avatar:hover {
  transform: scale(1.1);
}

.participant-more {
  background-color: rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.challenge-type-chip {
  width: fit-content;
}

.created-by-text {
  color: rgba(0, 0, 0, 0.6);
}

.owner-name-link {
  cursor: pointer;
  color: #1976d2;
  transition: opacity 0.2s, text-decoration 0.2s;
}

.owner-name-link:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.watchers-count {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.challenge-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-clamp: 2;
  line-height: 1.5;
  max-height: calc(1.5em * 5);
}

.join-button {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
  color: white !important;
}

.join-button:hover {
  box-shadow: 0 4px 8px rgba(31, 160, 246, 0.3);
  transform: translateY(-1px);
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
}

.join-button-content,
.leave-button-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.participant-count {
  font-weight: 700;
  font-size: 0.9em;
}

.separator {
  opacity: 0.6;
  font-weight: 400;
}

.watch-button {
  border-color: rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.87);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.5px;
}

.watch-button:hover {
  border-color: #1FA0F6;
  background-color: rgba(31, 160, 246, 0.08);
}

.watch-button--watched {
  background-color: rgba(31, 160, 246, 0.12) !important;
  border-color: #1FA0F6 !important;
  color: #1FA0F6 !important;
}

.watch-button--watched:hover {
  background-color: rgba(31, 160, 246, 0.2) !important;
}

.card-action-button {
  border-radius: 12px !important;
}
</style>



