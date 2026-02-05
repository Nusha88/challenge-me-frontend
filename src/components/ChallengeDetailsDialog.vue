<template>
  <v-dialog 
    v-model="dialogModel"
    max-width="800"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="handleVisibility"
  >
    <v-card v-if="challenge" class="challenge-details-card rounded-xl overflow-hidden">
      <!-- Header with Image -->
      <v-img
        :src="challenge.imageUrl || 'https://images.unsplash.com/photo-149485981460c-3834b3a25b5c?auto=format&fit=crop&q=80&w=1200'"
        height="280"
        cover
        class="align-end text-white header-image"
      >
        <!-- Top Right Corner Icons -->
        <div class="header-actions">
          <!-- Settings Button for Owners -->
          <v-btn
            v-if="isOwner"
            icon="mdi-pencil"
            variant="text"
            size="small"
            color="white"
            @click.stop="router.push(`/missions/edit/${challenge._id}`)"
            class="action-btn settings-btn"
          ></v-btn>
          <!-- Share Menu -->
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                variant="text"
                size="small"
                color="white"
                v-bind="menuProps"
                class="action-btn share-btn"
                icon="mdi-share-variant"
              ></v-btn>
            </template>
            <v-list>
              <v-list-item @click="copyLink">
                <template #prepend>
                  <v-icon>mdi-link</v-icon>
                </template>
                <v-list-item-title>{{ t('challenges.share.copyLink') }}</v-list-item-title>
              </v-list-item>
              <v-list-item @click="shareToTelegram">
                <template #prepend>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#0088cc" xmlns="http://www.w3.org/2000/svg" style="margin-right: 31px;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.45.08-.01.15-.01.22-.01.23.01.33.05.45.12.1.06.13.1.15.17.01.07.01.22-.01.38z"/>
                  </svg>
                </template>
                <v-list-item-title>{{ t('challenges.share.telegram') }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            color="white"
            @click.stop="handleVisibility(false)"
            class="action-btn close-btn"
          ></v-btn>
        </div>

        <div class="header-overlay">
          <div class="header-content px-6 py-4">
            <div class="d-flex align-center gap-2 mb-2">
              <v-chip
                size="x-small"
                :color="challenge.challengeType === 'habit' ? 'teal-accent-3' : 'deep-purple-accent-2'"
                class="font-weight-black text-uppercase"
                variant="elevated"
              >
                {{ challenge.challengeType === 'habit' ? t('challenges.typeHabitLabel') : t('challenges.typeResultLabel') }}
          </v-chip>
        <v-icon
          v-if="challenge.privacy === 'private'"
                color="white"
                size="16"
                class="ml-1"
        >
          mdi-lock
        </v-icon>
            </div>
            
            <h2 class="text-h4 font-weight-bold mb-2 challenge-title">
              {{ challenge.title }}
            </h2>

            <div class="d-flex align-center date-info opacity-90">
              <v-icon size="16" class="mr-2">mdi-calendar-clock</v-icon>
              <span class="text-caption">
                {{ formatDisplayDate(challenge.startDate) }} — {{ formatDisplayDate(challenge.endDate) }}
              </span>
            </div>
          </div>
        </div>
      </v-img>

      <!-- Tabs -->
      <v-card-text class="pa-0 bg-grey-lighten-4">
        <v-tabs v-model="tab" grow bg-color="white" color="primary">
          <v-tab value="progress">{{ t('challenges.progress') }}</v-tab>
          <v-tab value="details">{{ t('challenges.about') }}</v-tab>
          <v-tab value="community">{{ t('challenges.diary.title') }}</v-tab>
        </v-tabs>

        <v-window v-model="tab" class="pa-6">
          <!-- Progress Tab -->
          <v-window-item value="progress">
            <template v-if="challenge.challengeType === 'habit' && challenge.startDate && challenge.endDate">
              <v-card variant="flat" class="pa-4 rounded-lg border mb-4">
                <div class="d-flex justify-space-between align-center mb-4">
                  <span class="text-subtitle-1 font-weight-bold"></span>
                  <v-chip size="small" variant="tonal" color="primary">
                    {{ currentDayText }}
                  </v-chip>
                </div>
                
                <!-- Calendar Mode Toggle for Team View -->
                <div v-if="challenge.privacy !== 'private' && canViewPersonalProgress && challenge.participants.length > 1" class="calendar-mode-toggle mb-4">
                <v-btn-toggle
                  v-model="calendarViewMode"
                  mandatory
                  class="calendar-toggle-group"
                  color="primary"
                  variant="outlined"
                    density="compact"
                >
                  <v-btn value="personal">{{ t('challenges.myProgress') }}</v-btn>
                  <v-btn value="team">{{ t('challenges.teamProgress') }}</v-btn>
                </v-btn-toggle>
            </div>

                <!-- Calendar Grid -->
                <div v-if="challenge.privacy === 'private' || (canViewPersonalProgress && calendarViewMode === 'personal')" class="calendar-wrapper">

                  <div class="calendar-grid">
                    <div 
                      v-for="day in calendarDays" 
                      :key="day.date"
                      class="day-cell"
                      :class="getDayClass(day)"
                      @click="toggleDay(day)"
                    >
                      <span class="day-number">{{ day.number }}</span>
                      <div v-if="day.isCompleted" class="status-dot"></div>
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

                <!-- Team Calendar View -->
                <div v-else>
                  <TeamCalendarView
                    :start-date="challenge.startDate"
                    :end-date="challenge.endDate"
                    :participants="challenge.participants || []"
                    :frequency="challenge.frequency"
                    @participant-clicked="handleParticipantClick"
                  />
              </div>
              </v-card>
            </template>
            <template v-else-if="challenge.challengeType === 'result'">
              <v-card variant="flat" class="pa-4 rounded-lg border">
                <div class="d-flex justify-space-between align-center mb-4">
                  <span class="text-subtitle-1 font-weight-bold">{{ t('challenges.progress') }}</span>
                  <v-chip size="small" variant="tonal" color="primary">
                    {{ progressPercentage }}%
                  </v-chip>
              </div>
                <v-progress-linear
                  :model-value="progressPercentage"
                  color="primary"
                  height="24"
                  rounded
                  class="mb-4"
                ></v-progress-linear>
              <ChallengeActions
                  :model-value="challenge.actions || []"
                  :readonly="!isOwner"
              />
              </v-card>
            </template>
          </v-window-item>

          <!-- About Tab -->
          <v-window-item value="details">
            <div class="about-section pa-4">
              <v-row dense class="mb-6">
                <v-col cols="4" v-for="item in missionStats" :key="item.label">
                  <v-card variant="tonal" class="pa-3 text-center rounded-lg" :color="item.color">
                    <v-icon :icon="item.icon" size="20" class="mb-1"></v-icon>
                    <div class="text-caption text-uppercase font-weight-bold" style="font-size: 0.65rem">
                      {{ item.label }}
                    </div>
                    <div class="text-body-2 font-weight-black">{{ item.value }}</div>
                  </v-card>
                </v-col>
              </v-row>

              <h3 class="text-h6 font-weight-bold mb-2">{{ t('challenges.description') }}</h3>
              <p class="text-body-2 text-grey-darken-2 mb-6">
                {{ challenge.description }}
              </p>

              <v-divider class="mb-6"></v-divider>

              <div class="d-flex align-center bg-grey-lighten-4 pa-3 rounded-xl">
                <v-avatar size="40" :image="challenge.owner?.avatarUrl" class="mr-3">
                  <span v-if="!challenge.owner?.avatarUrl">{{ getOwnerInitial() }}</span>
                </v-avatar>
                <div>
                  <div class="text-caption text-grey">{{ t('challenges.createdByLabel') }}</div>
                  <div class="text-body-2 font-weight-bold">{{ challenge.owner?.name || t('common.unknown') }}</div>
                </div>
              <v-spacer></v-spacer>
              <v-btn 
                  variant="text" 
                  size="small" 
                color="primary" 
                  @click="navigateToOwner"
              >
                  {{ t('challenges.viewProfile') }}
              </v-btn>
          </div>
            </div>
          </v-window-item>

          <!-- Diary Tab -->
          <v-window-item value="community">
            <v-card variant="flat" class="pa-4 rounded-lg border">
              <div v-if="!isFinished">
                <CommentsComponent
                  :challenge-id="challenge._id"
                  :allow-comments="isOwner ? editForm.allowComments : (challenge.allowComments !== undefined ? challenge.allowComments : true)"
                  :current-user-id="currentUserId"
                  :is-owner="isOwner"
                  :challenge-start-date="isOwner ? editForm.startDate : challenge.startDate"
                  :challenge-end-date="isOwner ? editForm.endDate : challenge.endDate"
                  :challenge-type="challenge.challengeType"
                  :challenge-owner="challenge.owner"
                  :challenge-participants="challenge.participants || []"
                  @comment-added="handleCommentAdded"
                  @comment-deleted="handleCommentDeleted"
                  @user-navigated="handleUserNavigated"
                  @join="emitJoin"
                />
          </div>
              <v-alert v-else type="info">
                {{ t('challenges.finishedChallengeComments') }}
          </v-alert>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="modal-actions-footer px-6 py-4">
  <div class="d-flex align-center gap-2">
        <v-btn 
      variant="text" 
      color="grey-darken-1" 
      class="text-none font-weight-medium"
          @click="handleClose"
        >
          {{ t('common.close') }}
        </v-btn>

    <v-btn
      v-if="showLeaveButton"
      color="error"
      variant="text"
      size="small"
      class="text-none opacity-70"
      :loading="leaveLoading"
      @click="emitLeave"
    >
      {{ t('challenges.giveUp') }}
    </v-btn>
  </div>

        <v-spacer></v-spacer>

  <div class="d-flex align-center gap-3">
        <v-btn
      v-if="!isOwner && !isFinished && currentUserId"
      :variant="isWatched ? 'text' : 'outlined'"
      :color="isWatched ? 'grey-darken-2' : 'primary'"
      class="text-none px-4 rounded-lg"
      :loading="watchingId === challenge._id"
      @click="isWatched ? handleUnwatch() : handleWatch()"
    >
      <v-icon start size="small">
        {{ isWatched ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
      </v-icon>
      {{ isWatched ? t('challenges.unwatch') : t('challenges.watch') }}
        </v-btn>

        <v-btn
      v-if="showJoinButton || (isCurrentUserParticipant && challenge.challengeType === 'habit')"
          color="primary"
      variant="elevated"
      elevation="4"
      class="main-action-btn text-none px-10"
      :loading="joinLoading || participantSaveLoading"
      @click="showJoinButton ? emitJoin() : handleParticipantSave()"
    >
      {{ showJoinButton ? t('challenges.joinMission') : t('challenges.saveProgress') }}
        </v-btn>
  </div>
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
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import ChallengeActions from './ChallengeActions.vue'
import CommentsComponent from './CommentsComponent.vue'
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
  showLeaveButton: {
    type: Boolean,
    default: false
  },
  leaveLoading: {
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

const emit = defineEmits(['update:modelValue', 'save', 'join', 'leave', 'delete', 'update'])

const deleteConfirmDialog = ref(false)
const isInitializing = ref(true)
const participantSaveLoading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const calendarViewMode = ref('personal')
const tab = ref('progress')

// Dialog model for v-model binding
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => handleVisibility(value)
})

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

// Watched challenges
const watchedChallenges = ref([])
const watchingId = ref(null)

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
  completedDays: [],
  allowComments: true
})

const errors = reactive({
  title: '',
  description: '',
  duration: '',
  customDuration: '',
  frequency: ''
})

const { t, locale } = useI18n()
const router = useRouter()
const { mobile, mdAndUp } = useDisplay()

const titleErrorMessages = computed(() => {
  return errors.title || ''
})

const isFormValid = computed(() => {
  return !errors.title && !errors.description && !errors.duration && !errors.frequency &&
    editForm.title && editForm.description && editForm.duration
})

// Progress calculations
const progressDone = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === 'result') {
    const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
    return actions.filter(a => a.checked).length
  } else {
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

const isFinished = computed(() => {
  if (!props.challenge) return false
  
  const endDate = props.isOwner ? editForm.endDate : props.challenge.endDate
  if (endDate) {
    try {
      const end = new Date(endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      end.setHours(0, 0, 0, 0)
      if (end < today) {
        return true
      }
    } catch {
      // Continue to check other conditions
    }
  }
  
  if (props.challenge.challengeType === 'result') {
    const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return false
    }
    
    const allActionsDone = actions.every(action => {
      if (!action.checked) return false
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

const progressTotal = computed(() => {
  if (!props.challenge) return 0
  
  if (props.challenge.challengeType === 'result') {
    const actions = props.isOwner ? editForm.actions : (props.challenge.actions || [])
    return Math.max(1, actions.length)
  } else {
    const startDate = props.isOwner ? editForm.startDate : props.challenge.startDate
    const endDate = props.isOwner ? editForm.endDate : props.challenge.endDate
    const frequency = props.isOwner ? editForm.frequency : props.challenge.frequency
    
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    if (frequency === 'everyOtherDay') {
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
  }
})

const progressPercentage = computed(() => {
  if (progressTotal.value === 0) return 0
  const percentage = Math.round((progressDone.value / progressTotal.value) * 100)
  return Math.min(100, Math.max(0, percentage))
})

// Format date string in local timezone (YYYY-MM-DD)
function formatDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Calendar grid computed properties
const calendarDays = computed(() => {
  if (!props.challenge || props.challenge.challengeType !== 'habit') return []
  if (!props.challenge.startDate || !props.challenge.endDate) return []
  
  const start = new Date(props.challenge.startDate)
  const end = new Date(props.challenge.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDateString(today)
  
  const completedDays = localCurrentUserCompletedDays.value.length > 0 
    ? localCurrentUserCompletedDays.value 
    : currentUserCompletedDays.value
  
  const days = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  // Normalize completedDays to YYYY-MM-DD format for comparison
  const normalizedCompletedDays = completedDays.map(d => {
    if (!d) return null
    let dateStr = String(d)
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0]
    }
    return dateStr.substring(0, 10)
  }).filter(Boolean)
  
  let dayNumber = 1
  while (current <= end) {
    const dateStr = formatDateString(current)
    const isCompleted = normalizedCompletedDays.includes(dateStr)
    const isToday = dateStr === todayStr
    const isLocked = current > today
    
    days.push({
      date: dateStr,
      number: dayNumber,
      isCompleted,
      isToday,
      isLocked,
      isMissed: !isCompleted && !isLocked && current < today
    })
    
    current.setDate(current.getDate() + 1)
    dayNumber++
  }
  
  return days
})

const completedDaysCount = computed(() => {
  return calendarDays.value.filter(d => d.isCompleted).length
})

const totalDays = computed(() => {
  return calendarDays.value.length
})

const currentDayText = computed(() => {
  if (!props.challenge || !props.challenge.startDate) return ''
  const start = new Date(props.challenge.startDate)
    const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  
  if (today < start) return t('challenges.notStarted')
  
  const diffTime = today - start
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  return `${t('challenges.day')} ${diffDays} ${t('challenges.of')} ${totalDays.value}`
})

// Mission stats for About tab
const missionStats = computed(() => {
  if (!props.challenge) return []
  
  const stats = []
  
  if (props.challenge.challengeType === 'habit') {
    // For habit challenges: show duration, frequency, participants
    stats.push({
      label: t('challenges.duration'),
      value: getDurationLabel(props.challenge),
      icon: 'mdi-calendar-range',
      color: 'teal'
    })
    
    stats.push({
      label: t('challenges.frequency'),
      value: props.challenge.frequency ? getFrequencyLabel(props.challenge.frequency) : t('challenges.frequencyOptions.daily'),
      icon: 'mdi-repeat',
      color: 'blue'
    })
    
    stats.push({
      label: t('challenges.participants'),
      value: (props.challenge.participants?.length || 0).toString(),
      icon: 'mdi-account-group',
      color: 'purple'
    })
  } else {
    // For result challenges: show duration, actions, participants
    stats.push({
      label: t('challenges.duration'),
      value: getDurationLabel(props.challenge),
      icon: 'mdi-calendar-range',
      color: 'deep-purple'
    })
    
    const actionsCount = props.challenge.actions?.length || 0
    stats.push({
      label: t('challenges.actions'),
      value: actionsCount.toString(),
      icon: 'mdi-check-circle',
      color: 'orange'
    })
    
    stats.push({
      label: t('challenges.participants'),
      value: (props.challenge.participants?.length || 0).toString(),
      icon: 'mdi-account-group',
      color: 'purple'
    })
  }
  
  return stats
})

function getDayClass(day) {
  return {
    'is-completed': day.isCompleted,
    'is-missed': day.isMissed,
    'is-today': day.isToday,
    'is-locked': day.isLocked
  }
}

async function toggleDay(day) {
  if (day.isLocked || !isCurrentUserParticipant.value) return
  
  const completedDays = localCurrentUserCompletedDays.value.length > 0 
    ? [...localCurrentUserCompletedDays.value]
    : [...currentUserCompletedDays.value]
  
  // Normalize dates to YYYY-MM-DD format for comparison
  const normalizedCompletedDays = completedDays.map(d => {
    if (!d) return null
    let dateStr = String(d)
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0]
    }
    return dateStr.substring(0, 10)
  }).filter(Boolean)
  
  const dayDateStr = day.date.substring(0, 10)
  const index = normalizedCompletedDays.findIndex(d => d === dayDateStr)
  
  if (index > -1) {
    normalizedCompletedDays.splice(index, 1)
  } else {
    normalizedCompletedDays.push(dayDateStr)
  }
  
  localCurrentUserCompletedDays.value = normalizedCompletedDays.sort()
}

// Get current user's completedDays from their participant entry
const currentUserCompletedDays = computed(() => {
  if (localCurrentUserCompletedDays.value.length > 0) {
    return localCurrentUserCompletedDays.value
  }
  
  if (!props.challenge || !props.challenge.participants || !currentUserId.value) return []
  
  const participant = props.challenge.participants.find(p => {
    const userId = p.userId?._id || p.userId || p._id
    return userId && userId.toString() === currentUserId.value.toString()
  })
  
  if (!participant || !participant.completedDays || !Array.isArray(participant.completedDays)) return []
  
  // Normalize dates to YYYY-MM-DD format (handle both ISO strings and date strings)
  const days = participant.completedDays
    .filter(d => {
      if (!d) return false
      try {
        let dateStr = String(d)
        // Handle ISO strings (remove time part)
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0]
        }
        dateStr = dateStr.substring(0, 10)
        // Validate format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
        // Validate it's a real date (use local timezone)
        const date = new Date(dateStr + 'T00:00:00')
        return !Number.isNaN(date.getTime())
      } catch {
        return false
      }
    })
    .map(d => {
      let dateStr = String(d)
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0]
      }
      return dateStr.substring(0, 10)
    })
    .filter(Boolean)
    .sort()
  
  return days
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

const frequencyOptions = computed(() => [
  { title: t('challenges.frequencyOptions.daily'), value: 'daily' },
  { title: t('challenges.frequencyOptions.everyOtherDay'), value: 'everyOtherDay' }
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
  
  const currentDuration = editForm.duration
  if (currentDuration && currentDuration !== 'custom') {
    const standardValues = standardOptions.map(opt => opt.value)
    if (!standardValues.includes(currentDuration)) {
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
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
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
  
  const year = endDate.getFullYear()
  const month = String(endDate.getMonth() + 1).padStart(2, '0')
  const day = String(endDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Load watched challenges on mount
onMounted(() => {
  loadWatchedChallenges()
})

watch(
  () => props.challenge,
  (value, oldValue) => {
    const valueId = value?._id || value?.id
    const oldValueId = oldValue?._id || oldValue?.id
    
    if (valueId !== oldValueId) {
    localCurrentUserCompletedDays.value = []
    }
    
    if (value) {
      loadWatchedChallenges()
    }
    
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
    editForm.allowComments = value.allowComments !== undefined ? value.allowComments : true
    
    if (value.challengeType === 'result') {
      editForm.actions = value.actions && value.actions.length > 0
        ? value.actions.map(a => ({ 
            text: a.text || '', 
            checked: Boolean(a.checked),
            children: (a.children && Array.isArray(a.children))
              ? a.children.map(c => ({ text: c.text || '', checked: Boolean(c.checked) }))
              : []
          }))
        : [{ text: '', checked: false, children: [] }]
    } else {
      editForm.actions = []
    }
    
    if (value.challengeType === 'habit' && props.isOwner) {
      if (isInitializing.value) {
        let ownerCompletedDays = []
        
        if (value.participants && currentUserId.value) {
          const ownerParticipant = value.participants.find(p => {
            const userId = p.userId?._id || p.userId || p._id
            return userId && userId.toString() === currentUserId.value.toString()
          })
          
          if (ownerParticipant && ownerParticipant.completedDays && Array.isArray(ownerParticipant.completedDays)) {
            ownerCompletedDays = ownerParticipant.completedDays
          }
        }
        
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
    
    const calculatedDuration = calculateDuration(editForm.startDate, editForm.endDate)
    editForm.duration = calculatedDuration
    
    clearErrors()
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (value, oldValue) => {
    if (value === oldValue) return
    
    if (!value) {
      resetForm()
      deleteConfirmDialog.value = false
      isInitializing.value = true
      localCurrentUserCompletedDays.value = []
    } else {
      isInitializing.value = true
      if (props.challenge?.challengeType === 'habit' && props.challenge?.completedDays) {
        nextTick(() => {
          if (isInitializing.value) {
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
          }
        })
      }
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

watch(
  () => editForm.title,
  (newValue) => {
    if (newValue && newValue.length > 20) {
      editForm.title = newValue.substring(0, 20)
    }
  }
)

watch(
  () => props.deleteLoading,
  (newValue, oldValue) => {
    if (oldValue === true && newValue === false) {
      deleteConfirmDialog.value = false
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
  editForm.allowComments = true
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

function handleParticipantClick() {
  emit('update:modelValue', false)
}

function emitJoin() {
  emit('join')
}

function emitLeave() {
  emit('leave')
}

function handleDelete() {
  deleteConfirmDialog.value = true
}

function confirmDelete() {
  if (props.challenge?._id) {
    emit('delete', props.challenge._id)
  }
}

function handleSubmit() {
  if (!validate()) return
  
  const { duration, customDuration, ...formData } = editForm
  
  if (props.challenge?.challengeType) {
    formData.challengeType = props.challenge.challengeType
  }
  
  if (formData.challengeType === 'habit' && props.isOwner) {
    if (!Array.isArray(formData.completedDays)) {
      formData.completedDays = []
    }
    
    formData.completedDays = formData.completedDays
      .map(d => {
        if (!d) return null
        try {
          let dateStr = String(d)
          
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr
          }
          
          const date = new Date(dateStr)
          if (Number.isNaN(date.getTime())) {
            return null
          }
          
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
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
        const date = new Date(d)
        return !Number.isNaN(date.getTime())
      })
      .sort()
  } else if (formData.challengeType === 'habit' && !props.isOwner) {
    delete formData.completedDays
  } else if (formData.challengeType === 'result') {
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
    errors.duration = t('validation.startOptionRequired')
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

function getPrivacyLabel(value) {
  if (!value) return t('challenges.privacyOptions.public')
  return value === 'private' 
    ? t('challenges.privacyOptions.private') 
    : t('challenges.privacyOptions.public')
}

function getDurationLabel(challenge) {
  if (!challenge.startDate || !challenge.endDate) return ''
  try {
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return `${diffDays} ${diffDays === 1 ? t('challenges.day') : t('challenges.days')}`
  } catch {
    return ''
  }
}

function getFrequencyLabel(value) {
  if (!value) return ''
  const frequencyMap = {
    'daily': t('challenges.frequencyOptions.daily'),
    'everyOtherDay': t('challenges.frequencyOptions.everyOtherDay')
  }
  return frequencyMap[value] || value
}

function getOwnerInitial() {
  if (!props.challenge?.owner?.name) return '?'
  return props.challenge.owner.name.charAt(0).toUpperCase()
}

function navigateToOwner() {
  if (!props.challenge?.owner?._id && !props.challenge?.owner) return
  const ownerId = props.challenge.owner._id || props.challenge.owner
  router.push(`/heroes/${ownerId}`)
}

function handleCommentAdded() {
  emit('update')
}

function handleCommentDeleted() {
  emit('update')
}

function handleUserNavigated() {
  handleVisibility(false)
}

// Handle owner completedDays update
async function handleOwnerCompletedDaysUpdate(completedDays) {
  if (!props.challenge || !currentUserId.value || !props.isOwner) {
    return
  }
  
  editForm.completedDays = completedDays
  
  localCurrentUserCompletedDays.value = [...completedDays]
  
  try {
    const response = await challengeService.updateParticipantCompletedDays(
      props.challenge._id,
      currentUserId.value,
      completedDays
    )

    if (response?.data?.user) {
      try {
        const stored = localStorage.getItem('user')
        const storedUser = stored ? JSON.parse(stored) : {}
        const merged = { ...storedUser, ...response.data.user }
        localStorage.setItem('user', JSON.stringify(merged))
        window.dispatchEvent(new Event('auth-changed'))
      } catch {
        // ignore
      }
    }
    emit('update')
  } catch (error) {
    console.error('Error updating owner completed days:', error)
    emit('update')
  }
}

// Handle participant calendar changes
function handleParticipantCalendarChange(completedDays) {
  if (!props.challenge || !currentUserId.value || !isCurrentUserParticipant.value) {
    return
  }
  localCurrentUserCompletedDays.value = [...completedDays]
}

// Handle participant save
async function handleParticipantSave() {
  if (!props.challenge || !currentUserId.value || !isCurrentUserParticipant.value) {
    return
  }
  
  participantSaveLoading.value = true
  
  try {
    const completedDays = localCurrentUserCompletedDays.value.length > 0 
      ? localCurrentUserCompletedDays.value 
      : currentUserCompletedDays.value
    
    const response = await challengeService.updateParticipantCompletedDays(
      props.challenge._id,
      currentUserId.value,
      completedDays
    )

    if (response?.data?.user) {
      try {
        const stored = localStorage.getItem('user')
        const storedUser = stored ? JSON.parse(stored) : {}
        const merged = { ...storedUser, ...response.data.user }
        localStorage.setItem('user', JSON.stringify(merged))
        window.dispatchEvent(new Event('auth-changed'))
      } catch {
        // ignore
      }
    }
    emit('update')
    emit('update:modelValue', false)
    router.push('/')
  } catch (error) {
    console.error('Error saving participant completed days:', error)
  } finally {
    participantSaveLoading.value = false
  }
}

// Load watched challenges
async function loadWatchedChallenges() {
  if (!currentUserId.value) return
  
  try {
    const { data } = await challengeService.getWatchedChallenges(currentUserId.value)
    watchedChallenges.value = (data.challenges || []).map(c => c._id)
  } catch (error) {
    console.error('Error loading watched challenges:', error)
  }
}

// Check if challenge is watched
const isWatched = computed(() => {
  if (!props.challenge || !currentUserId.value) return false
  return watchedChallenges.value.some(id => id.toString() === props.challenge._id.toString())
})

// Share functionality
const getShareUrl = () => {
  if (!props.challenge?._id) return ''
  return `${window.location.origin}/missions/${props.challenge._id}`
}

const getShareText = () => {
  if (!props.challenge) return ''
  return props.challenge.title || ''
}

const copyLink = async () => {
  const url = getShareUrl()
  try {
    await navigator.clipboard.writeText(url)
    snackbarText.value = t('challenges.share.linkCopied')
    snackbar.value = true
  } catch (err) {
    console.error('Failed to copy link:', err)
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      snackbarText.value = t('challenges.share.linkCopied')
      snackbar.value = true
    } catch (e) {
      console.error('Fallback copy failed:', e)
    }
    document.body.removeChild(textArea)
  }
}

const shareToTelegram = () => {
  const url = encodeURIComponent(getShareUrl())
  const text = encodeURIComponent(getShareText())
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'width=600,height=400')
}

// Handle watch challenge
async function handleWatch() {
  if (!currentUserId.value || !props.challenge) return
  
  watchingId.value = props.challenge._id
  try {
    await challengeService.watchChallenge(props.challenge._id, currentUserId.value)
    await loadWatchedChallenges()
    emit('update:modelValue', false)
    emit('update')
  } catch (error) {
    console.error('Error watching challenge:', error)
    alert(error.response?.data?.message || t('challenges.watchError'))
  } finally {
    watchingId.value = null
  }
}

// Handle unwatch challenge
async function handleUnwatch() {
  if (!currentUserId.value || !props.challenge) return
  
  watchingId.value = props.challenge._id
  try {
    await challengeService.unwatchChallenge(props.challenge._id, currentUserId.value)
    await loadWatchedChallenges()
    emit('update:modelValue', false)
    emit('update')
  } catch (error) {
    console.error('Error unwatching challenge:', error)
    alert(error.response?.data?.message || t('challenges.unwatchError'))
  } finally {
    watchingId.value = null
  }
}
</script>

<style scoped>
/* Header Image */
.header-image {
  position: relative;
}

/* Header Actions - Top Right Corner */
.header-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border-radius: 24px;
  padding: 4px;
}

.action-btn {
  color: white !important;
  min-width: 36px !important;
  width: 36px !important;
  height: 36px !important;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

/* Header Overlay */
.header-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.2) 40%,
    rgba(0, 0, 0, 0.8) 100%
  );
}

.header-content {
  width: 100%;
  backdrop-filter: blur(2px);
}

.challenge-title {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.date-info {
  font-family: 'Roboto', sans-serif;
  letter-spacing: 0.5px;
}

/* Tabs */
:deep(.v-tabs) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.v-tab) {
  text-transform: none !important;
  font-weight: 600;
  letter-spacing: 0;
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
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

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

.day-cell:hover:not(.is-locked) {
  transform: scale(1.1);
  filter: brightness(0.95);
}

.status-dot {
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  margin-top: 2px;
}

.calendar-legend {
  font-size: 0.75rem;
  color: #64748b;
  justify-content: center;
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

.calendar-wrapper {
  padding: 0;
}

.calendar-header {
  margin-bottom: 16px;
}

.days-counter {
  font-size: 0.875rem;
}

.frequency-privacy-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .frequency-privacy-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.duration-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.duration-privacy-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .duration-privacy-row {
    grid-template-columns: 1fr 1fr;
  }
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

/* About Section Styles */
.about-section {
  line-height: 1.6;
}

.about-section h3 {
  letter-spacing: -0.5px;
  color: #1a202c;
}

/* Effect for stats cards */
.v-card--variant-tonal {
  opacity: 0.9;
  transition: transform 0.2s;
}

.v-card--variant-tonal:hover {
  transform: translateY(-2px);
  opacity: 1;
}
.modal-actions-footer {
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  /* Для iPhone с челкой снизу */
  padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
}

/* Сетка для кнопок */
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

/* Главная кнопка с градиентом или акцентом */
.main-action-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border-radius: 12px !important; /* Более мягкий квадрат, чем pill */
  height: 44px !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
}

.main-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3) !important;
}

/* Улучшаем читаемость кнопок с текстом */
.opacity-70 {
  opacity: 0.7;
}
.opacity-70:hover {
  opacity: 1;
}

/* Мобильная адаптация: если кнопок много, они не должны слипаться */
@media (max-width: 600px) {
  .modal-actions-footer {
    flex-direction: column-reverse; /* Главная кнопка будет сверху под пальцем */
    gap: 12px;
  }
  
  .modal-actions-footer .v-spacer {
    display: none;
  }
  
  .main-action-btn {
    width: 100%; /* На мобилках кнопка на всю ширину удобнее */
  }
  
  .d-flex {
    width: 100%;
    justify-content: center;
  }
}
</style>