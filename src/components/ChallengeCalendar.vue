<template>
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
        @click="toggleDay(day)"
      >
        <span class="day-number">
          {{ formatDay(day.date) }}
          <span v-if="day.marked" class="day-check">✔</span>
        </span>
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
</template>



<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  completedDays: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:completedDays', 'update:modelValue'])

// Support both v-model and completedDays prop
const localCompletedDays = computed({
  get: () => props.modelValue?.length > 0 ? props.modelValue : (props.completedDays || []),
  set: (value) => {
    emit('update:completedDays', value)
    emit('update:modelValue', value)
  }
})

// Generate all days between start and end date
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
      const isMarked = localCompletedDays.value.includes(dateStr)
      
      // For "every other day" frequency, disable every other day starting from start date
      // Day 0 (start date) is enabled, day 1 is disabled, day 2 is enabled, etc.
      const isFrequencyDisabled = props.frequency === 'everyOtherDay' && dayIndex % 2 === 1
      
      // A date is "missed" only if:
      // 1. It's before today
      // 2. It's not marked as completed
      // 3. It's NOT disabled due to frequency (every other day)
      const missed = isPast && !isMarked && !isFrequencyDisabled
      
      // Disable dates if:
      // - It's not today (past/future dates)
      // - Today but user can't edit
      // - OR it's disabled due to frequency (every other day)
      const disabled = isFrequencyDisabled || !isToday || (isToday && !props.editable)
      
      daysArray.push({
        date: new Date(current),
        dateStr,
        marked: isMarked,
        isToday,
        disabled,
        inRange: true,
        missed
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

function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDay(date) {
  return date.getDate()
}

function toggleDay(day) {
  // Only allow toggling today's date
  if (!props.editable || day.disabled || !day.isToday) {
    console.log('Calendar toggle blocked:', { editable: props.editable, disabled: day.disabled, isToday: day.isToday })
    return
  }
  
  console.log('Toggling day:', day.dateStr)
  
  const updatedDays = [...localCompletedDays.value]
  const index = updatedDays.indexOf(day.dateStr)
  
  if (index > -1) {
    // Remove if already marked
    updatedDays.splice(index, 1)
    console.log('Removed day from completedDays')
  } else {
    // Add if not marked
    updatedDays.push(day.dateStr)
    console.log('Added day to completedDays')
  }
  
  // Sort dates
  updatedDays.sort()
  
  console.log('Updated completedDays:', updatedDays)
  localCompletedDays.value = updatedDays
}
</script>

<style scoped>
.challenge-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding: 12px 0;
  flex: 1;
  width: 100%;
}

@media (min-width: 600px) {
  .challenge-calendar {
    gap: 12px;
    padding: 16px 0;
  }
}

.challenge-calendar.has-scroll {
  max-height: calc(4 * 44px + 3 * 8px); /* 4 rows: 4 circles + 3 gaps */
  overflow-y: auto;
}

@media (min-width: 600px) {
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
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
  animation: fadeIn 0.3s ease-in;
  margin: 0 auto;
}

@media (min-width: 600px) {
  .day-circle {
    max-width: 60px;
  }
}

.day-circle:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.day-circle.day-marked {
  background-color: #4caf50;
  color: black;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}


.day-circle.day-disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #e0e0e0;
}

.day-circle.day-disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Keep green background for completed dates even when disabled */
.day-circle.day-marked.day-disabled {
  background-color: #4caf50;
  opacity: 0.8;
}

/* Keep red background for missed dates even when disabled */
.day-circle.day-missed.day-disabled {
  background-color: #f44336;
  opacity: 0.8;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.day-circle.day-marked .day-number {
  color: black !important;
}

.day-circle.day-disabled .day-number {
  color: #999;
}

/* Ensure marked dates have black text even when disabled */
.day-circle.day-marked.day-disabled .day-number {
  color: black !important;
}

/* Missed days - dates before today that were not completed */
.day-circle.day-missed {
  background-color: #ef5350; 
  border: 2px solid #c62828;
}

.calendar-title { text-align: center; font-size: 18px; font-weight: 600; margin-bottom: 12px; }
.day-circle.day-missed .day-number {
  color: white;
}
.day-icon { font-size: 10px; margin-left: 4px; color: #2e7d32; }

/* Ensure marked days override missed days */
.day-circle.day-marked.day-missed {
  background-color: #4caf50;
}
.calendar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
}

@media (min-width: 768px) {
  .calendar-wrapper {
    flex-direction: row;
    gap: 24px;
  }
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

/* ✅ Цвета легенды совпадают с календарём */
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
.day-number {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.day-check {
  font-size: 11px;
  color: #1b5e20;
}

/* Сегодня — визуально заметен, но не мешает зелёному/красному состоянию */
.day-circle.day-today {
  border-color: #2196f3;
  border-width: 2px;
  box-shadow: 0 0 6px rgba(33, 150, 243, 0.6);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

</style>

