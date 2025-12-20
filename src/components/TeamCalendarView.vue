<template>
  <div class="team-calendar-view">
    <div class="calendar-wrapper">
      <div class="challenge-calendar" :class="{ 'has-scroll': needsScroll }">
        <div
          v-for="(day, index) in days"
          :key="index"
          class="day-circle"
          :class="{
            'day-marked': day.marked,
            'day-today': day.isToday,
            'day-disabled': day.disabled,
            'day-in-range': day.inRange,
            'day-missed': day.missed
          }"
        >
          <span class="day-number">
            {{ formatDay(day.date) }}
            <span v-if="day.marked" class="day-check">✔</span>
          </span>
          <div v-if="day.participantCount > 0" class="participant-count">
            {{ day.participantCount }}
          </div>
        </div>
      </div>

      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-dot legend-marked"></span>
          <span>{{ t('challenges.calendarLegend.completed') }}</span>
        </div>

        <div class="legend-item">
          <span class="legend-dot legend-missed"></span>
          <span>{{ t('challenges.calendarLegend.missed') }}</span>
        </div>

        <div class="legend-item">
          <span class="legend-dot legend-today"></span>
          <span>{{ t('challenges.calendarLegend.today') }}</span>
        </div>

        <div class="legend-item">
          <span class="legend-dot legend-disabled"></span>
          <span>{{ t('challenges.calendarLegend.unavailable') }}</span>
        </div>
      </div>
    </div>

    <div v-if="participantsWithStats.length > 0" class="participants-progress">
      <h4 class="participants-title">{{ t('challenges.participants') }}</h4>
      <div class="participants-list">
        <div
          v-for="participant in participantsWithStats"
          :key="participant.id"
          class="participant-item"
        >
          <div class="participant-info">
            <div
              class="participant-avatar"
              :style="{ backgroundColor: getParticipantColor(participant) }"
            >
              {{ getParticipantInitial(participant) }}
            </div>
            <span class="participant-name">{{ participant.name || t('common.unknown') }}</span>
          </div>
          <div class="participant-stats">
            <span class="completed-count">{{ participant.completedCount }}/{{ participant.totalDuration }}</span>
            <span class="stats-label">{{ t('challenges.calendarLegend.completed') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
    
    while (current <= end) {
      const dateStr = formatDateString(current)
      const isToday = current.getTime() === today.getTime()
      const isPast = current < today
      const isFuture = current > today
      
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
      
      const missed = isPast && !isMarked
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
</script>

<style scoped>
.team-calendar-view {
  width: 100%;
}

.calendar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 16px;
}

@media (min-width: 768px) {
  .calendar-wrapper {
    flex-direction: row;
    gap: 24px;
    margin-bottom: 24px;
  }
}

.challenge-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding: 12px 0;
  flex: 1;
  width: 100%;
}

.challenge-calendar.has-scroll {
  max-height: calc(4 * 44px + 3 * 8px);
  overflow-y: auto;
}

@media (min-width: 600px) {
  .challenge-calendar {
    gap: 12px;
    padding: 16px 0;
  }
  
  .challenge-calendar.has-scroll {
    max-height: calc(4 * 44px + 3 * 12px);
  }
}

.day-circle {
  width: 100%;
  aspect-ratio: 1;
  max-width: 44px;
  border-radius: 50%;
  background-color: rgba(255, 152, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
  animation: fadeIn 0.3s ease-in;
  margin: 0 auto;
  cursor: default;
}

@media (min-width: 600px) {
  .day-circle {
    max-width: 60px;
  }
}

.day-circle.day-marked {
  background-color: #4caf50;
  color: black;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}

.day-circle.day-today {
  border-color: #2196f3;
  border-width: 2px;
  box-shadow: 0 0 6px rgba(33, 150, 243, 0.6);
}

.day-circle.day-disabled {
  opacity: 0.7;
  cursor: default;
  background-color: #e0e0e0;
}

.day-circle.day-marked.day-disabled {
  background-color: #4caf50;
  opacity: 0.8;
}

.day-circle.day-missed.day-disabled {
  background-color: #f44336;
  opacity: 0.8;
}

.day-circle.day-missed {
  background-color: #ef5350;
  border: 2px solid #c62828;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.day-circle.day-marked .day-number {
  color: black !important;
}

.day-circle.day-disabled .day-number {
  color: #999;
}

.day-circle.day-marked.day-disabled .day-number {
  color: black !important;
}

.day-circle.day-missed .day-number {
  color: white;
}

.day-circle.day-marked.day-missed {
  background-color: #4caf50;
}

.day-check {
  font-size: 11px;
  color: #1b5e20;
}

.participant-count {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 9px;
  font-weight: 600;
  color: #1b5e20;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 10px;
  min-width: 140px;
  width: 100%;
}

@media (min-width: 768px) {
  .calendar-legend {
    width: auto;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #444;
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  border: 2px solid transparent;
}

.legend-marked {
  background-color: #4caf50;
}

.legend-missed {
  background-color: #f44336;
}

.legend-today {
  border-color: #2196f3;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.legend-disabled {
  background-color: #e0e0e0;
}

.participants-progress {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.participants-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.participant-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.participant-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.completed-count {
  font-size: 18px;
  font-weight: 600;
  color: #4caf50;
}

.stats-label {
  font-size: 12px;
  color: #666;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
