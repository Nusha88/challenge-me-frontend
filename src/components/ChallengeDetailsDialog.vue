<template>
  <v-dialog :model-value="modelValue" max-width="700" @update:modelValue="handleVisibility">
    <v-card v-if="challenge">
      <v-card-title class="dialog-header">
        <div class="dialog-title">
          <span>{{ t('challenges.detailsTitle') }}</span>
          <v-chip
            v-if="challenge.challengeType"
            :color="challengeTypeColor"
            size="small"
          >
            {{ challengeTypeLabel }}
          </v-chip>
        </div>
        <v-icon
          v-if="challenge.privacy === 'private'"
          color="grey-darken-1"
          size="24"
          class="privacy-icon"
        >
          mdi-lock
        </v-icon>
      </v-card-title>

      <v-card-text>
        <template v-if="isOwner">
          <v-form @submit.prevent="handleSubmit">
            <div class="dates-row mb-4">
              <p class="start-date-text">
                <strong>{{ t('challenges.startDate') }}:</strong> {{ formatDisplayDate(editForm.startDate) }}
              </p>
              <p class="end-date-text">
                <strong>{{ t('challenges.endDate') }}:</strong> {{ formatDisplayDate(editForm.endDate) }}
              </p>
            </div>

            <!-- Calendar for habit challenges -->
            <div v-if="challenge.challengeType === 'habit' && editForm.startDate && editForm.endDate" class="habit-calendar mb-4">
              <div v-if="challenge.privacy !== 'private' && canViewPersonalProgress" class="calendar-mode-toggle mb-3">
                <v-btn-toggle
                  v-model="calendarViewMode"
                  mandatory
                  class="calendar-toggle-group"
                  color="primary"
                  variant="outlined"
                >
                  <v-btn value="personal">{{ t('challenges.myProgress') }}</v-btn>
                  <v-btn value="team">{{ t('challenges.teamProgress') }}</v-btn>
                </v-btn-toggle>
              </div>
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  {{ t('challenges.challengeCalendar') }}
                </v-card-title>
                <v-card-text>
                  <template v-if="challenge.privacy === 'private' || (canViewPersonalProgress && calendarViewMode === 'personal')">
                    <ChallengeCalendar
                      :start-date="editForm.startDate"
                      :end-date="editForm.endDate"
                      v-model="editForm.completedDays"
                      :editable="true"
                      @update:model-value="handleOwnerCompletedDaysUpdate"
                    />
                  </template>
                  <template v-else>
                    <TeamCalendarView
                      :start-date="editForm.startDate"
                      :end-date="editForm.endDate"
                      :participants="challenge.participants || []"
                    />
                  </template>
                </v-card-text>
              </v-card>
            </div>

            <ChallengeImageUpload
              v-model="editForm.imageUrl"
              :editable="true"
            />

            <v-text-field
              v-model="editForm.title"
              :label="t('challenges.title')"
              variant="outlined"
              required
              class="mb-4"
              :error-messages="errors.title"
            ></v-text-field>

            <v-textarea
              v-model="editForm.description"
              :label="t('challenges.description')"
              variant="outlined"
              rows="5"
              required
              class="mb-4"
              :error-messages="errors.description"
            ></v-textarea>

            <template v-if="challenge.challengeType === 'habit'">
              <div class="frequency-privacy-row mb-4">
                <v-select
                  v-model="editForm.privacy"
                  :items="privacyOptions"
                  :label="t('challenges.privacy')"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                ></v-select>
                <v-select
                  v-model="editForm.frequency"
                  :items="frequencyOptions"
                  :label="t('challenges.frequency')"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  :error-messages="errors.frequency"
                ></v-select>
              </div>

              <div class="duration-row mb-4">
                <v-select
                  v-model="editForm.duration"
                  :items="durationOptions"
                  :label="t('challenges.duration')"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  :error-messages="errors.duration"
                  class="duration-select"
                ></v-select>

              </div>
            </template>

            <template v-else>
              <div class="duration-privacy-row mb-4">
                <v-select
                  v-model="editForm.privacy"
                  :items="privacyOptions"
                  :label="t('challenges.privacy')"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  class="privacy-select"
                ></v-select>

                <v-select
                  v-model="editForm.duration"
                  :items="durationOptions"
                  :label="t('challenges.duration')"
                  item-title="title"
                  item-value="value"
                  variant="outlined"
                  :error-messages="errors.duration"
                  class="duration-select"
                ></v-select>
              </div>

              <ChallengeActions
                v-model="editForm.actions"
              />
            </template>

            <div v-if="challenge.privacy !== 'private'" class="mb-4">
              <strong>{{ t('challenges.participants') }}:</strong>
              <div class="participants-container mt-2">
                <div
                  v-for="participant in challenge.participants"
                  :key="participant.userId?._id || participant.userId || participant._id || participant"
                  class="participant-avatar"
                  :style="{ backgroundColor: getParticipantColor(participant) }"
                  :title="(participant.userId?.name || participant.name) || t('common.unknown')"
                >
                  {{ getParticipantInitial(participant) }}
                </div>
              </div>
            </div>

            <v-alert v-if="saveError" type="error" class="mb-4">
              {{ saveError }}
            </v-alert>

            <v-card-actions class="buttons-area">
              <v-btn 
                variant="elevated" 
                color="error" 
                @click="handleDelete" 
                :disabled="saveLoading || deleteLoading"
                :loading="deleteLoading"
                class="action-button delete-button"
              >
                {{ t('challenges.delete') }}
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn 
                variant="outlined" 
                @click="handleCancel" 
                :disabled="saveLoading || deleteLoading"
                class="action-button cancel-button"
              >
                {{ t('challenges.cancel') }}
              </v-btn>
              <v-btn 
                type="submit" 
                variant="flat"
                color="primary" 
                :loading="saveLoading" 
                :disabled="saveLoading || deleteLoading"
                class="action-button save-button"
              >
                {{ t('challenges.update') }}
              </v-btn>
            </v-card-actions>
          </v-form>
        </template>

        <template v-else>
          <!-- Calendar for habit challenges -->
          <div v-if="challenge.challengeType === 'habit' && challenge.startDate && challenge.endDate" class="habit-calendar mb-4">
            <div v-if="challenge.privacy !== 'private' && canViewPersonalProgress" class="calendar-mode-toggle mb-3">
              <v-btn-toggle
                v-model="calendarViewMode"
                mandatory
                class="calendar-toggle-group"
                color="primary"
                variant="outlined"
              >
                <v-btn value="personal">{{ t('challenges.myProgress') }}</v-btn>
                <v-btn value="team">{{ t('challenges.teamProgress') }}</v-btn>
              </v-btn-toggle>
            </div>
            <v-card variant="outlined">
              <v-card-title class="text-h6">
                {{ t('challenges.challengeCalendar') }}
              </v-card-title>
              <v-card-text>
                <template v-if="challenge.privacy === 'private' || (canViewPersonalProgress && calendarViewMode === 'personal')">
                  <ChallengeCalendar
                    :start-date="challenge.startDate"
                    :end-date="challenge.endDate"
                    :model-value="currentUserCompletedDays"
                    :editable="isCurrentUserParticipant"
                    @update:model-value="handleParticipantCompletedDaysUpdate"
                  />
                </template>
                <template v-else>
                  <TeamCalendarView
                    :start-date="challenge.startDate"
                    :end-date="challenge.endDate"
                    :participants="challenge.participants || []"
                  />
                </template>
              </v-card-text>
            </v-card>
          </div>

          <ChallengeImageUpload
            :model-value="challenge.imageUrl"
            :editable="false"
          />
          
          <p class="mb-2"><strong>{{ t('challenges.description') }}:</strong> {{ challenge.description }}</p>
          <p class="mb-2"><strong>{{ t('challenges.startDate') }} / {{ t('challenges.endDate') }}:</strong> {{ formatDateRange(challenge.startDate, challenge.endDate) }}</p>
          <p class="mb-2" v-if="challenge.owner">
            <strong>{{ t('challenges.createdBy', { name: challenge.owner.name || t('common.unknown') }) }}</strong>
          </p>

          <div v-if="challenge.privacy !== 'private'">
            <strong>{{ t('challenges.participants') }}:</strong>
            <div class="participants-container mt-2">
              <div
                v-for="participant in challenge.participants"
                :key="participant.userId?._id || participant.userId || participant._id || participant"
                class="participant-avatar"
                :style="{ backgroundColor: getParticipantColor(participant) }"
                :title="(participant.userId?.name || participant.name) || t('common.unknown')"
              >
                {{ getParticipantInitial(participant) }}
              </div>
            </div>
          </div>

          <v-alert
            v-if="isParticipant"
            type="success"
            class="mt-4"
          >
            {{ t('challenges.joinSuccess') }}
          </v-alert>

          <v-alert
            v-else-if="showJoinButton"
            type="info"
            class="mt-4"
          >
            {{ t('challenges.joinInfo') }}
          </v-alert>
        </template>
      </v-card-text>

      <v-card-actions v-if="!isOwner" class="buttons-area">
        <v-btn 
          variant="outlined" 
          @click="handleClose"
          class="action-button cancel-button"
        >
          {{ t('common.close') }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="showJoinButton"
          variant="flat"
          color="primary"
          :loading="joinLoading"
          @click="emitJoin"
          class="action-button save-button"
        >
          {{ t('challenges.join') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteConfirmDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h6">
          {{ t('challenges.deleteConfirmTitle') }}
        </v-card-title>
        <v-card-text>
          {{ t('challenges.deleteConfirmMessage') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteConfirmDialog = false"
            :disabled="deleteLoading"
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            variant="flat"
            color="error"
            @click="confirmDelete"
            :loading="deleteLoading"
            :disabled="deleteLoading"
          >
            {{ t('challenges.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { reactive, ref, watch, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import ChallengeActions from './ChallengeActions.vue'
import ChallengeCalendar from './ChallengeCalendar.vue'
import TeamCalendarView from './TeamCalendarView.vue'
import { challengeService } from '../services/api'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  challenge: {
    type: Object,
    default: null
  },
  isOwner: {
    type: Boolean,
    default: false
  },
  isParticipant: {
    type: Boolean,
    default: false
  },
  joinLoading: {
    type: Boolean,
    default: false
  },
  showJoinButton: {
    type: Boolean,
    default: false
  },
  saveLoading: {
    type: Boolean,
    default: false
  },
  saveError: {
    type: String,
    default: ''
  },
  deleteLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'join', 'delete'])

const deleteConfirmDialog = ref(false)
const isInitializing = ref(true)
let dateRangeObserver = null
const calendarViewMode = ref('personal') // 'personal' или 'team'

// Get current user ID
function getCurrentUserId() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || parsed?._id || null
  } catch {
    return null
  }
}

const currentUserId = ref(getCurrentUserId())

// Local reactive copy of current user's completedDays for optimistic updates
const localCurrentUserCompletedDays = ref([])

const editForm = reactive({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  imageUrl: '',
  duration: '',
  customDuration: '',
  frequency: '',
  privacy: 'public',
  actions: [],
  completedDays: []
})

const errors = reactive({
  title: '',
  description: '',
  duration: '',
  customDuration: '',
  frequency: ''
})

const { t, locale } = useI18n()

const challengeTypeLabel = computed(() => {
  if (!props.challenge?.challengeType) return ''
  return props.challenge.challengeType === 'habit' 
    ? t('challenges.typeHabit') 
    : t('challenges.typeResult')
})

const challengeTypeColor = computed(() => {
  if (!props.challenge?.challengeType) return 'secondary'
  return props.challenge.challengeType === 'habit' ? 'success' : 'warning'
})

// Progress calculations
const progressDone = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === 'result') {
    // For result challenges: count checked actions
    const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
    return actions.filter(a => a.checked).length
  } else {
    // For habit challenges: calculate days passed from start to today
    const startDate = props.isOwner ? editForm.startDate : props.challenge.startDate
    if (!startDate) return 0
    
    const start = new Date(startDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    
    if (today < start) return 0
    
    const diffTime = today - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(0, diffDays)
  }
})

const progressTotal = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === 'result') {
    // For result challenges: total actions count
    const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
    return Math.max(1, actions.length) // At least 1 to avoid division by zero
  } else {
    // For habit challenges: total days from start to end
    const startDate = props.isOwner ? editForm.startDate : props.challenge.startDate
    const endDate = props.isOwner ? editForm.endDate : props.challenge.endDate
    
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    const diffTime = end - start
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diffDays) // At least 1 to avoid division by zero
  }
})

const progressPercentage = computed(() => {
  if (progressTotal.value === 0) return 0
  const percentage = Math.round((progressDone.value / progressTotal.value) * 100)
  return Math.min(100, Math.max(0, percentage)) // Clamp between 0 and 100
})

// Get current user's completedDays from their participant entry
// Use local ref for optimistic updates, fallback to prop when local is empty
const currentUserCompletedDays = computed(() => {
  // If we have local updates, use them for instant UI feedback
  if (localCurrentUserCompletedDays.value.length > 0) {
    return localCurrentUserCompletedDays.value
  }
  
  if (!props.challenge || !props.challenge.participants || !currentUserId.value) return []
  
  // Find current user's participant entry
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === currentUserId.value.toString()
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return []
  
  const days = participant.completedDays
    .filter(d => {
      if (!d) return false
      try {
        const dateStr = String(d).slice(0, 10)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
        const date = new Date(dateStr)
        return !Number.isNaN(date.getTime())
      } catch {
        return false
      }
    })
    .map(d => String(d).slice(0, 10))
    .filter(Boolean)
    .sort()
  
  // Update local ref when prop changes (but only if local is empty)
  if (localCurrentUserCompletedDays.value.length === 0) {
    localCurrentUserCompletedDays.value = days
  }
  
  return days
})

// Get all team completed days (aggregate from all participants)
const teamCompletedDays = computed(() => {
  if (!props.challenge || !props.challenge.participants) return []
  
  const allDays = new Set()
  
  props.challenge.participants.forEach(participant => {
    if (participant.completedDays && Array.isArray(participant.completedDays)) {
      participant.completedDays.forEach(day => {
        if (day) {
          try {
            const dateStr = String(day).slice(0, 10)
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              allDays.add(dateStr)
            }
          } catch {
            // Skip invalid dates
          }
        }
      })
    }
  })
  
  return Array.from(allDays).sort()
})

// Check if current user is a participant
const isCurrentUserParticipant = computed(() => {
  if (!props.challenge || !props.challenge.participants || !currentUserId.value) return false
  
  return props.challenge.participants.some(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === currentUserId.value.toString()
  })
})

// Check if user can view personal progress (must be owner or participant)
const canViewPersonalProgress = computed(() => {
  return props.isOwner || isCurrentUserParticipant.value
})

// Allowed dates function - only allow dates from today onwards (up to end date)
// Dates between startDate and today are disabled
function allowedDates(date) {
  if (!date || !editForm.startDate || !editForm.endDate) return false
  
  try {
    const checkDate = new Date(date)
    const start = new Date(editForm.startDate)
    const end = new Date(editForm.endDate)
    const today = new Date()
    
    if (Number.isNaN(checkDate.getTime()) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false
    }
    
    // Set all dates to midnight for accurate comparison
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    checkDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    
    // Only allow dates from today onwards, but within the challenge date range
    // Disable dates between startDate and today (exclusive)
    return checkDate >= today && checkDate >= start && checkDate <= end
  } catch {
    return false
  }
}

// Generate array of all dates in range for styling
const datesInRange = computed(() => {
  if (!editForm.startDate || !editForm.endDate) return []
  
  try {
    const start = new Date(editForm.startDate)
    const end = new Date(editForm.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
    
    const dates = []
    const current = new Date(start)
    current.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    while (current <= end) {
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, '0')
      const day = String(current.getDate()).padStart(2, '0')
      dates.push(`${year}-${month}-${day}`)
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  } catch {
    return []
  }
})

// Function to check if a date is within the challenge date range
function isDateInRange(date) {
  if (!date) return false
  return datesInRange.value.includes(String(date).slice(0, 10))
}

// Function to style dates in the challenge range with orange background
function styleDateRange() {
  if (!editForm.startDate || !editForm.endDate || datesInRange.value.length === 0) return
  
  // Use multiple timeouts to catch calendar at different render stages
  const attemptStyle = () => {
    const datePickers = document.querySelectorAll('.habit-date-picker')
    if (datePickers.length === 0) return false
    
    let foundAny = false
    
    datePickers.forEach(picker => {
      // Find all day cells - try multiple selectors
      let dayCells = picker.querySelectorAll('.v-date-picker-month__day')
      if (dayCells.length === 0) {
        dayCells = picker.querySelectorAll('[role="gridcell"]')
      }
      if (dayCells.length === 0) {
        dayCells = picker.querySelectorAll('td')
      }
      
      dayCells.forEach(dayCell => {
        const button = dayCell.querySelector('button')
        if (!button) return
        
        // Skip disabled buttons
        if (button.disabled || button.hasAttribute('disabled') || button.classList.contains('v-btn--disabled')) {
          return
        }
        
        // Try to get date from various sources
        let dateStr = null
        
        // Method 1: aria-label on button
        const buttonAria = button.getAttribute('aria-label')
        if (buttonAria) {
          const match = buttonAria.match(/\d{4}-\d{2}-\d{2}/)
          if (match) dateStr = match[0]
        }
        
        // Method 2: aria-label on day cell
        if (!dateStr) {
          const cellAria = dayCell.getAttribute('aria-label')
          if (cellAria) {
            const match = cellAria.match(/\d{4}-\d{2}-\d{2}/)
            if (match) dateStr = match[0]
          }
        }
        
        // Method 3: data-date on day cell
        if (!dateStr) {
          dateStr = dayCell.getAttribute('data-date')
        }
        
        // Method 4: data-date on button
        if (!dateStr) {
          dateStr = button.getAttribute('data-date')
        }
        
        // Method 5: Check all data attributes
        if (!dateStr) {
          Array.from(dayCell.attributes).forEach(attr => {
            if (attr.name.startsWith('data-') && /^\d{4}-\d{2}-\d{2}$/.test(attr.value)) {
              dateStr = attr.value
            }
          })
        }
        
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return
        
        // Check if date is in our range array
        if (datesInRange.value.includes(dateStr)) {
          foundAny = true
          dayCell.setAttribute('data-in-range', 'true')
          button.setAttribute('data-in-range', 'true')
          button.classList.add('date-in-range')
          // Force orange background using multiple methods
          button.style.setProperty('background-color', 'rgba(255, 152, 0, 0.4)', 'important')
          // Also add inline style as backup
          if (!button.style.cssText.includes('background-color')) {
            button.style.cssText += 'background-color: rgba(255, 152, 0, 0.4) !important;'
          }
        } else {
          dayCell.removeAttribute('data-in-range')
          button.removeAttribute('data-in-range')
          button.classList.remove('date-in-range')
          // Only remove if not selected
          if (!dayCell.classList.contains('v-date-picker-month__day--selected')) {
            button.style.removeProperty('background-color')
          }
        }
      })
    })
    
    return foundAny
  }
  
  // Try multiple times with delays
  setTimeout(() => attemptStyle(), 100)
  setTimeout(() => attemptStyle(), 300)
  setTimeout(() => attemptStyle(), 600)
  setTimeout(() => attemptStyle(), 1000)
}

// Handler for calendar updates
function onCalendarUpdate() {
  nextTick(() => {
    setTimeout(() => styleDateRange(), 100)
  })
}

// Watch for date range changes to update styling
watch(
  () => [editForm.startDate, editForm.endDate, props.modelValue, datesInRange.value],
  () => {
    if (props.modelValue && editForm.startDate && editForm.endDate && datesInRange.value.length > 0) {
      styleDateRange()
    }
  }
)

// Watch for calendar month changes to update styling
watch(
  () => editForm.completedDays,
  () => {
    if (props.modelValue && editForm.startDate && editForm.endDate) {
      nextTick(() => {
        styleDateRange()
      })
    }
  }
)

const frequencyOptions = computed(() => [
  { title: t('challenges.frequencyOptions.daily'), value: 'daily' },
  { title: t('challenges.frequencyOptions.everyOtherDay'), value: 'everyOtherDay' },
  { title: t('challenges.frequencyOptions.weekdays'), value: 'weekdays' }
])

const privacyOptions = computed(() => [
  { title: t('challenges.privacyOptions.public'), value: 'public' },
  { title: t('challenges.privacyOptions.private'), value: 'private' }
])

const durationOptions = computed(() => {
  const standardOptions = [
    { title: t('challenges.durationOptions.7days'), value: '7' },
    { title: t('challenges.durationOptions.14days'), value: '14' },
    { title: t('challenges.durationOptions.21days'), value: '21' },
    { title: t('challenges.durationOptions.30days'), value: '30' },
    { title: t('challenges.durationOptions.60days'), value: '60' },
    { title: t('challenges.durationOptions.90days'), value: '90' }
  ]
  
  // If current duration is not in standard list, add it as last option
  const currentDuration = editForm.duration
  if (currentDuration && currentDuration !== 'custom') {
    const standardValues = standardOptions.map(opt => opt.value)
    if (!standardValues.includes(currentDuration)) {
      // Calculate days from duration value
      const days = parseInt(currentDuration)
      if (!isNaN(days) && days > 0) {
        return [
          ...standardOptions,
          { title: `${days} ${days === 1 ? t('challenges.day') : t('challenges.days')}`, value: currentDuration }
        ]
      }
    }
  }
  
  return standardOptions
})

function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end days
  
  // Return the actual number of days (not 'custom')
  return String(diffDays)
}

function calculateEndDateFromDuration(startDate, duration) {
  if (!startDate || !duration) return ''
  
  const start = new Date(startDate)
  const days = parseInt(duration)
  
  if (isNaN(days) || days < 1) return ''
  
  const endDate = new Date(start)
  endDate.setDate(endDate.getDate() + days - 1)
  endDate.setHours(0, 0, 0, 0)
  
  // Format date as YYYY-MM-DD
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const day = String(endDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(
  () => props.challenge,
  value => {
    // Reset local completedDays when challenge changes
    localCurrentUserCompletedDays.value = []
    
    if (!value) {
      resetForm()
      return
    }

    editForm.title = value.title || ''
    editForm.description = value.description || ''
    editForm.startDate = value.startDate ? value.startDate.slice(0, 10) : ''
    editForm.endDate = value.endDate ? value.endDate.slice(0, 10) : ''
    editForm.imageUrl = value.imageUrl || ''
    editForm.frequency = value.frequency || ''
    editForm.privacy = value.privacy || 'public'
    // Initialize actions for result challenges
    if (value.challengeType === 'result') {
      editForm.actions = value.actions && value.actions.length > 0
        ? value.actions.map(a => ({ text: a.text || '', checked: Boolean(a.checked) }))
        : [{ text: '', checked: false }]
    } else {
      editForm.actions = []
    }
    // Initialize completedDays for habit challenges (only for owner)
    // Get from owner's participant entry if available, otherwise from challenge level (backward compatibility)
    if (value.challengeType === 'habit' && props.isOwner) {
      // Only initialize if isInitializing is true (prevents overwriting user selections)
      if (isInitializing.value) {
        let ownerCompletedDays = []
        
        // Try to get from owner's participant entry first
        if (value.participants && currentUserId.value) {
          const ownerParticipant = value.participants.find(p => {
            const userId = p.userId?._id || p.userId || p._id
            return userId && userId.toString() === currentUserId.value.toString()
          })
          
          if (ownerParticipant && ownerParticipant.completedDays && Array.isArray(ownerParticipant.completedDays)) {
            ownerCompletedDays = ownerParticipant.completedDays
          }
        }
        
        // Fallback to challenge level completedDays (backward compatibility)
        if (ownerCompletedDays.length === 0 && value.completedDays && Array.isArray(value.completedDays)) {
          ownerCompletedDays = value.completedDays
        }
        
        editForm.completedDays = ownerCompletedDays
          .filter(d => {
            if (!d) return false
            try {
              const dateStr = String(d).slice(0, 10)
              if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
              const date = new Date(dateStr)
              return !Number.isNaN(date.getTime())
            } catch {
              return false
            }
          })
          .map(d => String(d).slice(0, 10))
          .filter(Boolean)
          .sort()
        
        isInitializing.value = false
      }
    } else {
      editForm.completedDays = []
      isInitializing.value = false
    }
    
    // Calculate duration from start and end dates
    const calculatedDuration = calculateDuration(editForm.startDate, editForm.endDate)
    editForm.duration = calculatedDuration
    
    clearErrors()
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      resetForm()
      deleteConfirmDialog.value = false
      isInitializing.value = true
    } else {
      // Reset initialization flag when dialog opens so completedDays can be loaded
      isInitializing.value = true
      // Force re-initialization of completedDays when dialog opens
      if (props.challenge?.challengeType === 'habit' && props.challenge?.completedDays) {
        nextTick(() => {
          // Always load completedDays when dialog opens
          editForm.completedDays = Array.isArray(props.challenge.completedDays)
            ? props.challenge.completedDays
                .filter(d => {
                  if (!d) return false
                  try {
                    const dateStr = String(d).slice(0, 10)
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
                    const date = new Date(dateStr)
                    return !Number.isNaN(date.getTime())
                  } catch {
                    return false
                  }
                })
                .map(d => String(d).slice(0, 10))
                .filter(Boolean)
                .sort()
            : []
          isInitializing.value = false
        })
      }
    }
  }
)

// Also watch for challenge changes when dialog is open
watch(
  () => [props.modelValue, props.challenge],
  ([dialogOpen, challenge]) => {
    // When dialog opens and challenge is set, ensure completedDays are loaded
    if (dialogOpen && challenge?.challengeType === 'habit' && isInitializing.value) {
      if (challenge.completedDays && Array.isArray(challenge.completedDays)) {
        editForm.completedDays = challenge.completedDays
          .filter(d => {
            if (!d) return false
            try {
              const dateStr = String(d).slice(0, 10)
              if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
              const date = new Date(dateStr)
              return !Number.isNaN(date.getTime())
            } catch {
              return false
            }
          })
          .map(d => String(d).slice(0, 10))
          .filter(Boolean)
          .sort()
        isInitializing.value = false
      }
    }
    // Style date range when dialog opens
    if (dialogOpen && challenge?.challengeType === 'habit' && editForm.startDate && editForm.endDate) {
      // Set up MutationObserver to watch for calendar DOM changes
      nextTick(() => {
        setTimeout(() => {
          const datePickers = document.querySelectorAll('.habit-date-picker')
          datePickers.forEach(picker => {
            // Clean up existing observer
            if (dateRangeObserver) {
              dateRangeObserver.disconnect()
            }
            
            // Create new observer
            dateRangeObserver = new MutationObserver(() => {
              styleDateRange()
            })
            
            // Observe the calendar for changes
            dateRangeObserver.observe(picker, {
              childList: true,
              subtree: true,
              attributes: true
            })
            
            // Initial styling attempts
            styleDateRange()
          })
        }, 100)
      })
    } else {
      // Clean up observer when dialog closes
      if (dateRangeObserver) {
        dateRangeObserver.disconnect()
        dateRangeObserver = null
      }
    }
  }
)

watch(
  () => props.deleteLoading,
  (newValue, oldValue) => {
    // Close confirmation dialog when delete completes (loading goes from true to false)
    if (oldValue === true && newValue === false) {
      deleteConfirmDialog.value = false
    }
  }
)

watch(
  () => [editForm.duration, editForm.startDate],
  () => {
    if (editForm.duration && editForm.startDate) {
      const newEndDate = calculateEndDateFromDuration(
        editForm.startDate,
        editForm.duration
      )
      if (newEndDate) {
        editForm.endDate = newEndDate
      }
    }
  }
)

function resetForm() {
  editForm.title = ''
  editForm.description = ''
  editForm.startDate = ''
  editForm.endDate = ''
  editForm.imageUrl = ''
  editForm.duration = ''
  editForm.customDuration = ''
  editForm.frequency = ''
  editForm.privacy = 'public'
  editForm.actions = []
  editForm.completedDays = []
  clearErrors()
}

function clearErrors() {
  errors.title = ''
  errors.description = ''
  errors.duration = ''
  errors.frequency = ''
}

function handleVisibility(value) {
  emit('update:modelValue', value)
}

function handleCancel() {
  emit('update:modelValue', false)
}

function handleClose() {
  emit('update:modelValue', false)
}

function emitJoin() {
  emit('join')
}

function handleDelete() {
  deleteConfirmDialog.value = true
}

function confirmDelete() {
  if (props.challenge?._id) {
    emit('delete', props.challenge._id)
    // Dialog will close automatically when deleteLoading becomes false (handled by watcher)
  }
}

function handleSubmit() {
  if (!validate()) return
  
  // Create form data, excluding frontend-only fields
  const { duration, customDuration, ...formData } = editForm
  
  // Include challengeType from the challenge prop (it's not editable)
  if (props.challenge?.challengeType) {
    formData.challengeType = props.challenge.challengeType
  }
  
  // Only include completedDays for owner (participants use separate endpoint)
  if (formData.challengeType === 'habit' && props.isOwner) {
    // Ensure completedDays exists and is an array
    if (!Array.isArray(formData.completedDays)) {
      formData.completedDays = []
    }
    
    // Format and validate dates - be more lenient with date formats
    formData.completedDays = formData.completedDays
      .map(d => {
        if (!d) return null
        try {
          // Handle different date formats
          let dateStr = String(d)
          
          // If it's already in YYYY-MM-DD format, use it
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr
          }
          
          // Try to parse as Date and format
          const date = new Date(dateStr)
          if (Number.isNaN(date.getTime())) {
            return null
          }
          
          // Format as YYYY-MM-DD
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        } catch {
          return null
        }
      })
      .filter(d => {
        if (!d) return false
        // Final validation
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
        const date = new Date(d)
        return !Number.isNaN(date.getTime())
      })
      .sort()
  } else if (formData.challengeType === 'habit' && !props.isOwner) {
    // For participants, don't send completedDays (they use separate endpoint)
    delete formData.completedDays
  } else if (formData.challengeType === 'result') {
    // Clear completedDays for result challenges
    formData.completedDays = []
  }
  
  emit('save', formData)
}

function validate() {
  clearErrors()

  if (!editForm.title) {
    errors.title = t('validation.titleRequired')
  }

  if (!editForm.description) {
    errors.description = t('validation.descriptionRequired')
  }

  if (!editForm.duration) {
    errors.duration = t('validation.startOptionRequired') // Reuse existing validation message
  }

  if (props.challenge?.challengeType === 'habit' && !editForm.frequency) {
    errors.frequency = t('validation.frequencyRequired')
  }

  return !errors.title && !errors.description && !errors.duration && !errors.frequency
}

function formatDisplayDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
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

function formatDateRange(start, end) {
  const startFormatted = formatDisplayDate(start)
  const endFormatted = formatDisplayDate(end)
  if (startFormatted && endFormatted) {
    return t('challenges.dateRange', { start: startFormatted, end: endFormatted })
  }
  return startFormatted || endFormatted || ''
}

// Generate a consistent color for a participant based on their ID or name
function getParticipantColor(participant) {
  // Handle new structure: participant.userId or old structure: participant directly
  const userId = participant.userId?._id || participant.userId || participant._id || participant
  const name = participant.userId?.name || participant.name || ''
  const seed = userId?.toString() || name
  
  // Generate a hash from the seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Generate a color from the hash
  const hue = Math.abs(hash % 360)
  const saturation = 60 + (Math.abs(hash) % 20) // 60-80%
  const lightness = 50 + (Math.abs(hash) % 15) // 50-65%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// Get the first letter of participant's name
function getParticipantInitial(participant) {
  // Handle new structure: participant.userId or old structure: participant directly
  const name = participant.userId?.name || participant.name || t('common.unknown')
  return name.charAt(0).toUpperCase()
}

// Handle owner completedDays update
async function handleOwnerCompletedDaysUpdate(completedDays) {
  if (!props.challenge || !currentUserId.value || !props.isOwner) {
    console.log('Skipping owner update:', { challenge: !!props.challenge, userId: !!currentUserId.value, isOwner: props.isOwner })
    return
  }
  
  console.log('Updating owner completedDays:', completedDays)
  
  // Update local form data
  editForm.completedDays = completedDays
  
  // Optimistically update local ref immediately for instant UI feedback
  localCurrentUserCompletedDays.value = [...completedDays]
  
  // Save to owner's participant entry
  try {
    const response = await challengeService.updateParticipantCompletedDays(
      props.challenge._id,
      currentUserId.value,
      completedDays
    )
    console.log('Successfully updated owner completedDays:', response)
    // Emit update event to refresh challenge data from server
    emit('update')
  } catch (error) {
    console.error('Error updating owner completed days:', error)
    console.error('Error details:', error.response?.data || error.message)
    // Revert optimistic update on error
    emit('update')
  }
}

// Handle participant completedDays update
async function handleParticipantCompletedDaysUpdate(completedDays) {
  if (!props.challenge || !currentUserId.value || !isCurrentUserParticipant.value) {
    console.log('Skipping participant update:', { challenge: !!props.challenge, userId: !!currentUserId.value, isParticipant: isCurrentUserParticipant.value })
    return
  }
  
  console.log('Updating participant completedDays:', completedDays)
  
  // Optimistically update local ref immediately for instant UI feedback
  localCurrentUserCompletedDays.value = [...completedDays]
  
  try {
    const response = await challengeService.updateParticipantCompletedDays(
      props.challenge._id,
      currentUserId.value,
      completedDays
    )
    console.log('Successfully updated participant completedDays:', response)
    // Emit update event to refresh challenge data from server
    emit('update')
  } catch (error) {
    console.error('Error updating participant completed days:', error)
    console.error('Error details:', error.response?.data || error.message)
    // Revert optimistic update on error - clear local ref to use prop value
    localCurrentUserCompletedDays.value = []
    emit('update')
  }
}
</script>

<style scoped>
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.dialog-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.privacy-icon {
  flex-shrink: 0;
}

.frequency-privacy-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.frequency-privacy-row.single-column {
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .frequency-privacy-row:not(.single-column) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dates-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.start-date-text,
.end-date-text {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  flex: 0 0 auto;
}

.end-date-text {
  text-align: right;
}

.duration-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .duration-row {
    grid-template-columns: 1fr 1fr;
  }
}

.habit-calendar {
  width: 100%;
}

.habit-calendar :deep(.v-card-text) {
  padding: 16px;
  width: 100%;
}

.habit-calendar :deep(.calendar-wrapper) {
  width: 100%;
}

.duration-privacy-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.duration-privacy-row .privacy-select {
  grid-column: 1;
  grid-row: 1;
}

.duration-privacy-row .duration-select {
  grid-column: 1;
  grid-row: 2;
}

@media (min-width: 600px) {
  .duration-privacy-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .duration-privacy-row .privacy-select {
    grid-column: 1;
    grid-row: 1;
  }
  
  .duration-privacy-row .duration-select {
    grid-column: 2;
    grid-row: 1;
  }
}

.buttons-area {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding: 16px 24px !important;
  margin-top: 24px;
  border-radius: 0 0 4px 4px;
}

.action-button {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  min-width: 100px;
  height: 40px;
  padding: 0 24px;
}

.delete-button {
  box-shadow: 0 2px 4px rgba(211, 47, 47, 0.2);
}

.delete-button:hover:not(:disabled) {
  box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.save-button {
  background-color: rgb(25, 118, 210) !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.2);
}

.save-button:hover:not(:disabled) {
  background-color: rgb(21, 101, 192) !important;
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.cancel-button {
  border-width: 2px;
}

.cancel-button:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.04);
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.participants-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
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
  cursor: default;
  transition: transform 0.2s ease;
}

.participant-avatar:hover {
  transform: scale(1.1);
}
.calendar-mode-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.calendar-toggle-group {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
}

</style>
