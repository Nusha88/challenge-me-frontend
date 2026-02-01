<template>
  <div class="team-calendar-view">
    <v-card variant="flat" class="team-pulse-card pa-6 mb-8 rounded-xl bg-teal-lighten-5">
      <div class="d-flex align-center justify-space-between mb-2">
        <div>
          <div class="text-overline text-teal-darken-1 mb-n1">{{ t('challenges.teamProgress') }}</div>
          <div class="text-h4 font-weight-black text-teal-darken-2">
            {{ teamAveragePercentage }}%
          </div>
        </div>
        <v-avatar size="64" color="white" class="elevation-2">
          <v-icon color="teal" size="32">mdi-account-group</v-icon>
        </v-avatar>
      </div>
      <v-progress-linear
        :model-value="teamAveragePercentage"
        color="teal-darken-1"
        height="12"
        rounded
        class="mb-2"
      />
      <div class="text-caption text-teal-darken-1">
        {{ totalCompletedTasks }} {{ t('challenges.tasksCompletedByTeam') }}
      </div>
    </v-card>

    <div class="calendar-wrapper mb-8">
      <h4 class="text-subtitle-1 font-weight-bold mb-4 px-1">{{ t('challenges.teamActivityMap') }}</h4>
      <div class="calendar-grid">
        <div
          v-for="(day, index) in days"
          :key="index"
          class="day-cell"
          :class="{
            'is-completed': day.marked,
            'is-missed': day.missed,
            'is-today': day.isToday,
            'is-locked': day.disabled
          }"
        >
          <span class="day-number">{{ formatDay(day.date) }}</span>
          <div v-if="day.marked" class="status-dot"></div>
          <div v-if="day.participantCount > 0" class="participant-count">
            {{ day.participantCount }}
          </div>
        </div>
      </div>

      <div class="calendar-legend d-flex flex-wrap gap-4 mt-6">
        <div class="legend-item">
          <span class="dot completed"></span>
          {{ t('challenges.completed') }}
        </div>
        <div class="legend-item">
          <span class="dot missed"></span>
          {{ t('challenges.missed') }}
        </div>
        <div class="legend-item">
          <span class="dot today"></span>
          {{ t('challenges.today') }}
        </div>
      </div>
    </div>

    <div v-if="participantsWithStats.length > 0" class="participants-section">
      <h4 class="text-subtitle-1 font-weight-bold mb-4 px-1">
        {{ t('challenges.teamLeaders') }} ({{ participantsWithStats.length }})
      </h4>
      
      <div class="participants-grid">
        <v-card
          v-for="participant in participantsWithStats"
          :key="participant.id"
          variant="flat"
          class="participant-card mb-3 rounded-xl border transition-swing"
          @click="navigateToUserProfile(participant)"
        >
          <div class="d-flex align-center pa-4">
            <v-avatar 
              size="48" 
              :color="getParticipantColor(participant)" 
              class="mr-4 elevation-1"
            >
              <v-img v-if="getParticipantAvatarUrl(participant)" :src="getParticipantAvatarUrl(participant)" />
              <span v-else class="text-white font-weight-bold">{{ getParticipantInitial(participant) }}</span>
            </v-avatar>

            <div class="flex-grow-1">
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="font-weight-bold text-truncate" style="max-width: 150px">
                  {{ participant.name || t('common.unknown') }}
                </span>
                <span class="text-caption font-weight-black" :class="`text-${getProgressColor(participant)}`">
                  {{ participant.completedCount }}/{{ participant.totalDuration }}
                </span>
              </div>
              
              <v-progress-linear
                :model-value="(participant.completedCount / participant.totalDuration) * 100"
                :color="getProgressColor(participant)"
                height="6"
                rounded
              />
              
              <div class="d-flex gap-1 mt-2 justify-start">
                <div 
                  v-for="(day, idx) in getLastDaysForParticipant(participant, 10)" 
                  :key="idx"
                  class="mini-dot"
                  :class="{ 'active': day.completed, 'missed': day.missed }"
                ></div>
              </div>
            </div>

            <v-icon color="grey-lighten-1" class="ml-2">mdi-chevron-right</v-icon>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const emit = defineEmits(['participant-clicked'])

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  participants: {
    type: Array,
    default: () => []
  },
  frequency: {
    type: String,
    default: null
  }
})

const { t } = useI18n()

// Generate all days between start and end date with team data
const days = computed(() => {
  if (!props.startDate || !props.endDate) return []
  
  try {
    const start = new Date(props.startDate)
    const end = new Date(props.endDate)
    
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return []
    }
    
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    const daysArray = []
    const current = new Date(start)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate days from start date for "every other day" frequency
    let dayIndex = 0
    
    while (current <= end) {
      const dateStr = formatDateString(current)
      const isToday = current.getTime() === today.getTime()
      const isPast = current < today
      const isFuture = current > today
      
      // For "every other day" frequency, disable every other day starting from start date
      // Day 0 (start date) is enabled, day 1 is disabled, day 2 is enabled, etc.
      const isFrequencyDisabled = props.frequency === 'everyOtherDay' && dayIndex % 2 === 1
      
      // Count how many participants completed this day
      let participantCount = 0
      let isMarked = false
      
      props.participants.forEach(participant => {
        const completedDays = participant.completedDays || []
        // Check if this date is in the participant's completedDays
        const hasDate = completedDays.some(d => {
          if (!d) return false
          try {
            const dayStr = String(d).slice(0, 10)
            return dayStr === dateStr
          } catch {
            return false
          }
        })
        if (hasDate) {
          participantCount++
          isMarked = true
        }
      })
      
      // A date is "missed" only if:
      // 1. It's before today
      // 2. It's not marked as completed
      // 3. It's NOT disabled due to frequency (every other day)
      const missed = isPast && !isMarked && !isFrequencyDisabled
      const disabled = true // Team calendar is read-only
      
      daysArray.push({
        date: new Date(current),
        dateStr,
        marked: isMarked,
        isToday,
        disabled,
        inRange: true,
        missed,
        participantCount
      })
      
      current.setDate(current.getDate() + 1)
      dayIndex++
    }
    
    return daysArray
  } catch (error) {
    console.error('Error generating calendar days:', error)
    return []
  }
})

// Calculate number of rows needed
const calendarRows = computed(() => {
  return Math.ceil(days.value.length / 7)
})

// Check if scroll is needed (5 or more rows)
const needsScroll = computed(() => {
  return calendarRows.value >= 5
})

// Calculate total duration (days between start and end date)
const totalDuration = computed(() => {
  if (!props.startDate || !props.endDate) return 0
  
  try {
    const start = new Date(props.startDate)
    const end = new Date(props.endDate)
    
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 0
    }
    
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    // For "every other day" frequency, only count every other day
    if (props.frequency === 'everyOtherDay') {
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
      
      return Math.max(1, count) // At least 1 day
    }
    
    // For other frequencies, count all days
    const diffTime = end - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
    
    return Math.max(1, diffDays) // At least 1 day
  } catch {
    return 0
  }
})

// Process participants with stats
const participantsWithStats = computed(() => {
  return props.participants.map(participant => {
    const completedDays = participant.completedDays || []
    // Normalize completedDays to date strings
    const normalizedDays = completedDays
      .filter(d => d)
      .map(d => {
        try {
          const dateStr = String(d).slice(0, 10)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr
          }
        } catch {
          return null
        }
        return null
      })
      .filter(Boolean)
      .sort()
    
    return {
      id: participant.userId?._id || participant.userId || participant._id || Math.random(),
      name: participant.userId?.name || participant.name,
      completedDays: normalizedDays,
      completedCount: normalizedDays.length,
      totalDuration: totalDuration.value,
      userId: participant.userId,
      _id: participant._id
    }
  })
})

// Calculate team average percentage
const teamAveragePercentage = computed(() => {
  if (!participantsWithStats.value.length) return 0
  const total = participantsWithStats.value.reduce((acc, p) => {
    if (p.totalDuration === 0) return acc
    return acc + (p.completedCount / p.totalDuration)
  }, 0)
  return Math.round((total / participantsWithStats.value.length) * 100)
})

// Calculate total completed tasks
const totalCompletedTasks = computed(() => {
  return participantsWithStats.value.reduce((acc, p) => acc + p.completedCount, 0)
})

// Get progress color based on percentage
function getProgressColor(participant) {
  if (participant.totalDuration === 0) return 'grey'
  const pct = (participant.completedCount / participant.totalDuration) * 100
  if (pct >= 80) return 'teal'
  if (pct >= 50) return 'orange'
  return 'grey'
}

// Get last days for participant (for mini dots)
function getLastDaysForParticipant(participant, count) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return days.value.slice(-count).map(day => {
    const dayDate = new Date(day.date)
    dayDate.setHours(0, 0, 0, 0)
    const isCompleted = participant.completedDays.includes(day.dateStr)
    const isMissed = dayDate < today && !isCompleted && !day.disabled
    
    return {
      completed: isCompleted,
      missed: isMissed
    }
  })
}

function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDay(date) {
  return date.getDate()
}

function getParticipantColor(participant) {
  const colors = [
    '#2196F3', '#4CAF50', '#FF9800', '#9C27B0',
    '#F44336', '#00BCD4', '#8BC34A', '#FF5722',
    '#3F51B5', '#009688', '#FFC107', '#E91E63'
  ]
  const id = participant.id || participant.userId?._id || participant.userId || participant._id || ''
  const index = typeof id === 'string' 
    ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : id
  return colors[Math.abs(index) % colors.length]
}

function getParticipantInitial(participant) {
  const name = participant.name || participant.userId?.name || ''
  if (!name) return '?'
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

function navigateToUserProfile(participant) {
  // Get user ID from participant
  const userId = participant.userId?._id || participant.userId || participant._id || participant.id
  if (userId && typeof userId !== 'number') {
    // Emit event before navigation so parent can close dialog if needed
    emit('participant-clicked')
    router.push(`/heroes/${userId}`)
  }
}
</script>

<style scoped>
.team-calendar-view {
  width: 100%;
}

.team-pulse-card {
  border: 1px solid rgba(13, 148, 136, 0.1);
}

.calendar-wrapper {
  width: 100%;
  padding: 0;
}

/* Calendar Grid - Same as personal calendar */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  max-width: 450px;
  margin: 0 auto;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: default;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

/* States - Same as personal calendar */
.day-cell.is-completed {
  background: #ecfdf5;
  color: #059669;
}

.day-cell.is-missed {
  background: #fef2f2;
  color: #dc2626;
}

.day-cell.is-today {
  border-color: #0d9488;
  color: #0d9488;
  font-weight: 700;
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2);
}

.day-cell.is-locked {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.day-number {
  font-size: 0.875rem;
  font-weight: 500;
}

.day-cell.is-completed .day-number {
  color: #059669;
}

.day-cell.is-missed .day-number {
  color: #dc2626;
}

.day-cell.is-today .day-number {
  color: #0d9488;
  font-weight: 700;
}

.day-cell.is-locked .day-number {
  color: #64748b;
}

/* Status dot - Same as personal calendar */
.status-dot {
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  margin-top: 2px;
}

/* Participant count badge */
.participant-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 8px;
  font-weight: 700;
  color: white;
  background-color: #0d9488;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid white;
}

.day-cell.is-completed .participant-count {
  background-color: #059669;
}

.day-cell.is-missed .participant-count {
  background-color: #dc2626;
}

/* Calendar Legend - Same as personal calendar */
.calendar-legend {
  font-size: 0.75rem;
  color: #64748b;
  justify-content: center;
  margin-top: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.dot.completed {
  background: #059669;
}

.dot.missed {
  background: #dc2626;
}

.dot.today {
  border: 2px solid #0d9488;
}

/* Participants Section */
.participants-section {
  margin-top: 24px;
}

.participant-card {
  transition: all 0.2s ease;
  background: white !important;
  border: 1px solid #f1f5f9 !important;
  cursor: pointer;
}

.participant-card:hover {
  transform: translateX(4px);
  border-color: #0d9488 !important;
  background: #f0fdfa !important;
}

.mini-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: #f1f5f9;
}

.mini-dot.active {
  background: #0d9488;
}

.mini-dot.missed {
  background: #fee2e2;
}

.gap-1 {
  gap: 4px;
}

/* Styling scroll for participants list */
.participants-grid {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.participants-grid::-webkit-scrollbar {
  width: 4px;
}

.participants-grid::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
