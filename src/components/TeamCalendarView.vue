<template>
  <div class="team-section mt-6">
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

    <div class="d-flex align-center mb-4 px-2">
      <v-icon color="primary" class="mr-2">mdi-account-group-outline</v-icon>
      <h3 class="text-h6 font-weight-bold mb-0">{{ t('challenges.teamLeaders') }}</h3>
    </div>

    <v-list class="team-list bg-transparent">
      <v-hover v-for="member in team" :key="member.id" v-slot="{ isHovering, props }">
        <v-card
          v-bind="props"
          :elevation="isHovering ? 4 : 1"
          class="member-card mb-3 pa-3 rounded-xl transition-swing"
          :class="{ 'leader-border': member.isLeader }"
          @click="navigateToUserProfile(member)"
        >
          <div class="d-flex align-center">
            <v-badge
              dot
              location="bottom right"
              :color="member.online ? 'success' : 'grey'"
              offset-x="3"
              offset-y="3"
            >
              <v-avatar size="48" :color="member.color || 'primary'" class="elevation-2">
                <v-img v-if="member.avatarUrl" :src="member.avatarUrl" />
                <span v-else class="text-white font-weight-bold">{{ getInitials(member.name) }}</span>
              </v-avatar>
            </v-badge>

            <div class="ml-4 flex-grow-1">
              <div class="d-flex justify-space-between align-center">
                <span class="font-weight-bold text-subtitle-1">{{ member.name }}</span>
                <div class="d-flex align-center">
                  <v-icon v-if="member.streak > 3" color="orange" size="small" class="mr-1">mdi-fire</v-icon>
                  <span class="text-caption font-weight-medium text-grey-darken-1">
                    {{ member.currentDay }}/{{ totalDays }} {{ t('challenges.days') }}
                  </span>
                </div>
              </div>

              <div class="progress-container mt-1">
                <v-progress-linear
                  :model-value="member.progress"
                  color="primary"
                  height="8"
                  rounded
                  striped
                >
                </v-progress-linear>
              </div>
            </div>

            <div class="ml-4 text-right" style="min-width: 45px">
              <span class="text-h6 font-weight-black color-primary">{{ member.progress }}%</span>
            </div>
            
            <v-btn icon="mdi-chevron-right" variant="text" size="small" color="grey"></v-btn>
          </div>
        </v-card>
      </v-hover>
    </v-list>
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
      
      // For "every other day" frequency, disable every other day starting from start date
      const isFrequencyDisabled = props.frequency === 'everyOtherDay' && dayIndex % 2 === 1
      
      // Count how many participants completed this day
      let participantCount = 0
      let isMarked = false
      
      props.participants.forEach(participant => {
        const completedDays = participant.completedDays || []
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

function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDay(date) {
  return date.getDate()
}

// Calculate total days
const totalDays = computed(() => {
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
        if (dayIndex % 2 === 0) {
          count++
        }
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
})

// Calculate streak for a participant
function calculateStreak(participant) {
  if (!participant.completedDays || !Array.isArray(participant.completedDays)) return 0
  
  function formatDateString(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const completedDateStrings = participant.completedDays
    .map(date => {
      try {
        if (!date) return null
        let dateStr = String(date)
        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0]
        return dateStr.substring(0, 10)
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))
  
  if (completedDateStrings.length === 0) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)
  
  let startDate = new Date(today)
  if (!completedDateStrings.includes(todayStr)) {
    startDate.setDate(today.getDate() - 1)
  }
  
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
}

// Transform participants to team members format
const team = computed(() => {
  return props.participants.map(participant => {
    const completedDays = participant.completedDays || []
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
    
    const completedCount = normalizedDays.length
    const progress = totalDays.value > 0 ? Math.round((completedCount / totalDays.value) * 100) : 0
    const streak = calculateStreak({ completedDays: normalizedDays })
    
    // Determine if leader (highest progress or longest streak)
    const userId = participant.userId?._id || participant.userId || participant._id
    const name = participant.userId?.name || participant.name || t('common.unknown')
    const avatarUrl = participant.userId?.avatarUrl || participant.avatarUrl || null
    
    return {
      id: userId || Math.random(),
      name,
      avatarUrl,
      color: getParticipantColor(participant),
      online: true, // Could be enhanced with actual online status
      isLeader: false, // Will be set below
      streak,
      currentDay: completedCount,
      progress,
      userId: participant.userId,
      _id: participant._id
    }
  }).map((member, index, array) => {
    // Find the leader (highest progress, then highest streak)
    const maxProgress = Math.max(...array.map(m => m.progress))
    const leaders = array.filter(m => m.progress === maxProgress)
    const leader = leaders.reduce((prev, current) => {
      return current.streak > prev.streak ? current : prev
    }, leaders[0])
    
    if (member.id === leader.id) {
      member.isLeader = true
    }
    return member
  }).sort((a, b) => {
    // Sort: leader first, then by progress descending
    if (a.isLeader && !b.isLeader) return -1
    if (!a.isLeader && b.isLeader) return 1
    return b.progress - a.progress
  })
})

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }
  return name.charAt(0).toUpperCase()
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

function navigateToUserProfile(member) {
  // Get user ID from member
  const userId = member.userId?._id || member.userId || member._id || member.id
  if (userId && typeof userId !== 'number') {
    // Emit event before navigation so parent can close dialog if neede
    router.push(`/heroes/${userId}`)
      emit('participant-clicked')
  }
}
</script>

<style scoped>
.calendar-wrapper {
  width: 100%;
  padding: 0;
}

/* Calendar Grid */
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

/* States */
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

/* Status dot */
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

/* Calendar Legend */
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

.team-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

/* Кастомный скроллбар */
.team-list::-webkit-scrollbar {
  width: 4px;
}
.team-list::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.member-card {
  border: 1px solid #f1f5f9 !important;
  transition: all 0.3s ease !important;
  background: white !important;
  cursor: pointer;
}

.member-card:hover {
  transform: translateX(4px);
  border-color: #3b82f6 !important;
}

.leader-border {
  border: 1.5px solid #3b82f6 !important;
  background: linear-gradient(to right, #ffffff, #f0f7ff) !important;
}

.progress-container {
  border-radius: 10px;
  overflow: hidden;
  background: #f1f5f9;
}

/* Цвет процента совпадает с темой */
.color-primary {
  color: #3b82f6;
}

/* Анимация при появлении */
.member-card {
  animation: slideIn 0.4s ease-out forwards;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
