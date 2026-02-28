<template>
  <div class="calendar-tactical-wrapper">
    <div class="calendar-container glass-card">
      <div class="challenge-calendar" :class="{ 'has-scroll': needsScroll }">
        <div
          v-for="(day, index) in days"
          :key="index"
          class="day-slot"
          :class="{
            'day-marked': day.marked,
            'day-today': day.isToday,
            'day-disabled': day.disabled,
            'day-missed': day.missed && !day.marked
          }"
          @click="toggleDay(day)"
        >
          <div class="day-hex-bg"></div>
          <div class="day-content">
            <span class="day-label">{{ formatDay(day.date) }}</span>
            <v-icon v-if="day.marked" size="10" class="status-icon">mdi-check-bold</v-icon>
            <v-icon v-else-if="day.missed && !day.marked" size="10" class="status-icon">mdi-close-thick</v-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="calendar-legend-bar">
      <div class="legend-item" v-for="item in legendItems" :key="item.key">
        <div class="legend-indicator" :class="item.class"></div>
        <span class="legend-text">{{ t(`challenges.calendarLegend.${item.key}`) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-tactical-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.glass-card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 16px;
}

.challenge-calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  width: 100%;
}

/* Ячейка дня */
.day-slot {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.day-hex-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: inherit;
}

.day-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.day-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* СОСТОЯНИЯ */

/* Выполнено - Неоновый бирюзовый */
.day-marked .day-hex-bg {
  background: rgba(79, 209, 197, 0.15);
  border-color: #4FD1C5;
  box-shadow: inset 0 0 10px rgba(79, 209, 197, 0.2),
              0 0 15px rgba(79, 209, 197, 0.1);
}
.day-marked .day-label, .day-marked .status-icon {
  color: #4FD1C5;
}

/* Пропущено - Приглушенный красный */
.day-missed .day-hex-bg {
  background: rgba(255, 82, 82, 0.05);
  border-color: rgba(255, 82, 82, 0.3);
}
.day-missed .day-label, .day-missed .status-icon {
  color: #FF5252;
  opacity: 0.7;
}

/* Сегодня - Акцентный синий бордер */
.day-today .day-hex-bg {
  border: 2px solid #2196f3;
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.4);
}
.day-today .day-label {
  color: #fff;
  text-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
}

/* Заблокировано */
.day-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.day-disabled .day-hex-bg {
  background: transparent;
  border-style: dashed;
}

/* ХОВЕР */
.day-slot:hover:not(.day-disabled) {
  transform: translateY(-2px) scale(1.05);
}
.day-slot:hover:not(.day-disabled) .day-hex-bg {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

/* ЛЕГЕНДА */
.calendar-legend-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.3);
  border-radius: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-indicator {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-text {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
}

.bg-marked { background: #4FD1C5; box-shadow: 0 0 8px #4FD1C5; }
.bg-missed { background: #FF5252; opacity: 0.6; }
.bg-today { border: 2px solid #2196f3; }
.bg-disabled { border: 1px dashed rgba(255, 255, 255, 0.3); }

/* Адаптивность под скролл */
.challenge-calendar.has-scroll {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 8px;
}

.challenge-calendar.has-scroll::-webkit-scrollbar {
  width: 4px;
}
.challenge-calendar.has-scroll::-webkit-scrollbar-thumb {
  background: rgba(79, 209, 197, 0.2);
  border-radius: 10px;
}

/* Mobile Styles */
@media (max-width: 959px) {
  .calendar-tactical-wrapper {
    gap: 16px;
  }

  .glass-card {
    padding: 12px;
    border-radius: 16px;
  }

  .challenge-calendar {
    gap: 6px;
  }

  .day-label {
    font-size: 0.75rem;
  }

  .status-icon {
    font-size: 8px !important;
  }

  .calendar-legend-bar {
    gap: 12px;
    padding: 10px;
    border-radius: 10px;
  }

  .legend-item {
    gap: 6px;
  }

  .legend-indicator {
    width: 8px;
    height: 8px;
  }

  .legend-text {
    font-size: 0.7rem;
  }
}

/* Small mobile devices */
@media (max-width: 599px) {
  .calendar-tactical-wrapper {
    gap: 12px;
  }

  .glass-card {
    padding: 10px;
    border-radius: 12px;
  }

  .challenge-calendar {
    gap: 4px;
  }

  .day-label {
    font-size: 0.7rem;
  }

  .status-icon {
    font-size: 7px !important;
  }

  .calendar-legend-bar {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }

  .legend-item {
    gap: 6px;
  }

  .legend-indicator {
    width: 7px;
    height: 7px;
  }

  .legend-text {
    font-size: 0.65rem;
  }

  .challenge-calendar.has-scroll {
    max-height: 240px;
  }
}
</style>
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
const legendItems = [
  { key: 'completed', class: 'bg-marked' },
  { key: 'missed', class: 'bg-missed' },
  { key: 'today', class: 'bg-today' },
  { key: 'unavailable', class: 'bg-disabled' }
];
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
    return
  }
  
  const updatedDays = [...localCompletedDays.value]
  const index = updatedDays.indexOf(day.dateStr)
  
  if (index > -1) {
    // Remove if already marked
    updatedDays.splice(index, 1)
  } else {
    // Add if not marked
    updatedDays.push(day.dateStr)
  }
  
  // Sort dates
  updatedDays.sort()
  localCompletedDays.value = updatedDays
}
</script>

