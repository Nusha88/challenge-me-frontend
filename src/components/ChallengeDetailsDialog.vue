<template>
  <v-dialog 
    v-model="dialogModel"
    max-width="800"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="handleVisibility"
  >
    <v-card v-if="challenge" class="challenge-details-card rounded-xl overflow-hidden">
      <v-img
        :src="challenge.imageUrl || 'https://images.unsplash.com/photo-149485981460c-3834b3a25b5c?auto=format&fit=crop&q=80&w=1200'"
        height="280"
        cover
        class="align-end text-white header-image"
      >
        <div class="header-actions">
          <v-btn
            v-if="isOwner"
            icon="mdi-pencil"
            variant="text"
            size="small"
            @click.stop="router.push(`/missions/edit/${challenge._id}`)"
            class="action-btn"
          ></v-btn>
          
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn
                variant="text"
                size="small"
                v-bind="menuProps"
                class="action-btn"
                icon="mdi-share-variant"
              ></v-btn>
            </template>
            <v-list class="dark-menu-list">
              <v-list-item @click="copyLink">
                <template #prepend><v-icon size="18">mdi-link</v-icon></template>
                <v-list-item-title>{{ t('challenges.share.copyLink') }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click.stop="handleVisibility(false)"
            class="action-btn"
          ></v-btn>
        </div>

        <div class="header-overlay">
          <div class="header-content px-6 py-6">
            <div class="d-flex align-center gap-2 mb-3">
              <v-chip
                size="x-small"
                :class="challenge.challengeType === 'habit' ? 'chip-habit' : 'chip-result'"
                class="font-weight-black text-uppercase px-3"
              >
                {{ challenge.challengeType === 'habit' ? t('challenges.typeHabitLabel') : t('challenges.typeResultLabel') }}
              </v-chip>
              <v-icon v-if="challenge.privacy === 'private'" color="rgba(255,255,255,0.5)" size="14">mdi-lock</v-icon>
            </div>
            
            <h2 class="text-h4 font-weight-bold mb-2 challenge-title">
              {{ challenge.title }}
            </h2>

            <div class="d-flex align-center date-info">
              <v-icon size="16" color="#4FD1C5" class="mr-2">mdi-calendar-clock</v-icon>
              <span class="text-caption opacity-80">
                {{ formatDisplayDate(challenge.startDate) }} — {{ formatDisplayDate(challenge.endDate) }}
              </span>
            </div>
          </div>
        </div>
      </v-img>

      <v-tabs v-model="tab" grow class="custom-tabs">
        <v-tab value="progress">{{ t('challenges.progress') }}</v-tab>
        <v-tab value="details">{{ t('challenges.about') }}</v-tab>
        <v-tab value="community">{{ t('challenges.diary.title') }}</v-tab>
      </v-tabs>

      <v-card-text class="pa-0 modal-body-bg">
        <v-window v-model="tab" class="pa-6">
          
          <v-window-item value="progress">
            <div class="tab-content-wrapper">
              <template v-if="challenge.challengeType === 'habit'">
                <div class="d-flex justify-space-between align-center mb-6">
                  <h3 class="section-title">{{ t('challenges.progress') }}</h3>
                  <v-chip size="small" variant="outlined" color="#4FD1C5">{{ currentDayText }}</v-chip>
                </div>

                <div class="calendar-grid">
                  <div 
                    v-for="day in calendarDays" 
                    :key="day.date"
                    class="day-cell"
                    :class="getDayClass(day)"
                    @click="toggleDay(day)"
                  >
                    <span class="day-number">{{ day.number }}</span>
                    <v-icon 
                      v-if="day.isToday && day.isCompleted" 
                      size="12" 
                      color="#4CAF50" 
                      class="today-checkmark"
                    >
                      mdi-check-circle
                    </v-icon>
                  </div>
                </div>

                <div class="calendar-legend mt-8">
                  <div class="legend-item"><span class="dot completed"></span> {{ t('challenges.completed') }}</div>
                  <div class="legend-item"><span class="dot missed"></span> {{ t('challenges.missed') }}</div>
                  <div class="legend-item"><span class="dot today"></span> {{ t('challenges.today') }}</div>
                </div>
              </template>

              <template v-else>
                <div class="d-flex justify-space-between mb-2">
                  <span class="section-title">{{ progressPercentage }}% {{ t('challenges.completed') }}</span>
                </div>
                <v-progress-linear
                  :model-value="progressPercentage"
                  color="#4FD1C5"
                  height="10"
                  rounded
                  class="mission-progress mb-6"
                ></v-progress-linear>
                <ChallengeActions :model-value="challenge.actions || []" :readonly="!isOwner" />
              </template>
            </div>
          </v-window-item>

          <v-window-item value="details">
            <v-row dense class="mb-8">
              <v-col cols="4" v-for="item in missionStats" :key="item.label">
                <div class="stat-card">
                  <v-icon :icon="item.icon" size="18" :color="item.color || '#4FD1C5'"></v-icon>
                  <div class="stat-label">{{ item.label }}</div>
                  <div class="stat-value">{{ item.value }}</div>
                </div>
              </v-col>
            </v-row>

            <h3 class="section-title mb-3">{{ t('challenges.description') }}</h3>
            <p class="description-text mb-8">{{ challenge.description }}</p>

            <div class="owner-box pa-4 rounded-lg">
              <v-avatar size="40" class="owner-avatar mr-4">
                <v-img v-if="challenge.owner?.avatarUrl" :src="challenge.owner.avatarUrl" cover></v-img>
                <span v-else>{{ getOwnerInitial() }}</span>
              </v-avatar>
              <div>
                <div class="text-caption opacity-60">{{ t('challenges.createdByLabel') }}</div>
                <div class="font-weight-bold">{{ challenge.owner?.name || t('challenges.unknownHero') }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn variant="text" size="small" color="#4FD1C5" @click="navigateToOwner">
                {{ t('challenges.viewProfile') }}
              </v-btn>
            </div>
          </v-window-item>

          <v-window-item value="community">
            <div class="diary-container">
              <CommentsComponent
                v-if="!isFinished"
                :challenge-id="challenge._id"
                :allow-comments="challenge.allowComments"
                :current-user-id="currentUserId"
                :is-owner="isOwner"
                :challenge-type="challenge.challengeType"
                :challenge-start-date="challenge.startDate"
                :challenge-end-date="challenge.endDate"
                :challenge-owner="challenge.owner"
                :challenge-participants="challenge.participants || []"
                @join="emitJoin"
              />
              <v-alert v-else type="info" variant="tonal" class="rounded-xl">
                {{ t('challenges.finishedChallengeComments') }}
              </v-alert>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions class="modal-footer px-6 py-4">
        <v-btn variant="text" color="rgba(255,255,255,0.5)" @click="handleClose">
          {{ t('common.close') }}
        </v-btn>
        
        <v-btn v-if="showLeaveButton" color="#ff5252" variant="text" @click="emitLeave">
          {{ t('challenges.giveUp') }}
        </v-btn>

        <v-spacer></v-spacer>

        <div class="d-flex gap-3">
          <v-btn
            v-if="!isOwner && !isFinished && currentUserId && !isCurrentUserParticipant"
            variant="outlined"
            :color="isWatched ? '#4FD1C5' : 'rgba(255,255,255,0.3)'"
            class="rounded-lg action-outline-btn"
            @click="isWatched ? handleUnwatch() : handleWatch()"
          >
            <v-icon start size="18">{{ isWatched ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
            {{ isWatched ? t('challenges.unwatch') : t('challenges.watch') }}
          </v-btn>

          <v-btn
            v-if="showJoinButton || (isCurrentUserParticipant && challenge.challengeType === 'habit' && !isFinished)"
            class="main-action-btn"
            :loading="joinLoading"
            @click="showJoinButton ? emitJoin() : handleParticipantSave()"
          >
            {{ showJoinButton ? t('challenges.joinMission') : t('challenges.saveProgress') }}
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
/* --- ПЕРЕМЕННЫЕ И БАЗА --- */
.challenge-details-card {
  background: #0f172a !important; /* Глубокий темно-синий из твоей темы */
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-body-bg { background: #0f172a !important; }

/* --- HEADER --- */
.header-overlay {
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.95) 100%);
}

.header-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn { color: white !important; opacity: 0.8; }
.action-btn:hover { opacity: 1; background: rgba(255,255,255,0.1); }

.chip-habit { background-color: #7048E8 !important; box-shadow: 0 0 10px rgba(112, 72, 232, 0.4); }
.chip-result { background-color: #4FD1C5 !important; box-shadow: 0 0 10px rgba(79, 209, 197, 0.4); }

/* --- TABS --- */
.custom-tabs {
  background: #1e293b !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.custom-tabs :deep(.v-tab) {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.5) !important;
}
.custom-tabs :deep(.v-tab--selected) { color: #4FD1C5 !important; }

/* --- CALENDAR --- */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.day-cell {
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  position: relative;
}
.day-cell.is-completed {
  background: rgba(79, 209, 197, 0.1) !important;
  border-color: #4FD1C5 !important;
  color: #4FD1C5 !important;
  box-shadow: inset 0 0 8px rgba(79, 209, 197, 0.2);
}
.day-cell.is-today {
  border-color: #F4A782 !important;
  color: #F4A782 !important;
}

/* --- PROGRESS BAR (GLOW) --- */
.mission-progress {
  background: rgba(255, 255, 255, 0.05) !important;
  overflow: visible !important;
}
.mission-progress :deep(.v-progress-linear__determinate) {
  box-shadow: 0 0 15px 2px rgba(79, 209, 197, 0.4);
  border-radius: 10px;
}

/* --- STATS --- */
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 14px;
  text-align: center;
}
.stat-label { font-size: 0.65rem; text-transform: uppercase; opacity: 0.5; margin-top: 4px; }
.stat-value { font-size: 0.9rem; font-weight: 800; }

.owner-box {
  background: rgba(30, 41, 59, 0.5);
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.owner-avatar {
  border: 2px solid rgba(79, 209, 197, 0.3) !important;
  flex-shrink: 0;
}

.owner-avatar span {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 16px;
}

/* --- FOOTER --- */
.modal-footer {
  background: #0f172a !important;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.main-action-btn {
  background: linear-gradient(135deg, #7048E8 0%, #4FD1C5 100%) !important;
  color: white !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  border-radius: 12px !important;
  padding: 0 32px !important;
  box-shadow: 0 4px 15px rgba(79, 209, 197, 0.3) !important;
}
.v-card-text.pa-0.modal-body-bg {
  height: 400px;
}

.action-outline-btn { text-transform: none; border-color: rgba(255, 255, 255, 0.1) !important; }

.section-title {
  color: #4FD1C5;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}
/* Контейнер легенды */
.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
  justify-content: flex-start;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Общий стиль для индикаторов (вместо простых точек) */
.dot {
  width: 14px;
  height: 14px;
  border-radius: 4px; /* Мягкий квадрат как в сетке */
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

/* Конкретные состояния для легенды и сетки */
.dot.completed, .day-cell.is-completed {
  background: rgba(79, 209, 197, 0.1) !important;
  border: 1px solid #4FD1C5 !important;
  box-shadow: 0 0 8px rgba(79, 209, 197, 0.3);
}

.dot.missed, .day-cell.is-missed {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.dot.today, .day-cell.is-today {
  background: rgba(244, 167, 130, 0.05) !important;
  border: 1px solid #F4A782 !important;
  box-shadow: 0 0 10px rgba(244, 167, 130, 0.4);
  position: relative;
}

.today-checkmark {
  position: absolute;
  bottom: 2px;
  right: 2px;
  filter: drop-shadow(0 0 3px rgba(76, 175, 80, 0.6));
  z-index: 2;
}
.legend-item {
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  font-size: 0.7rem;
}
</style>
<script setup>
import { reactive, ref, watch, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useUserStore } from '../stores/user'
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

// Get current user ID from store
const userStore = useUserStore()
function getCurrentUserId() {
  return userStore.userId
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
      // Update store with new user data
      userStore.updateUser(response.data.user)
      window.dispatchEvent(new Event('auth-changed'))
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
      // Update store with new user data
      userStore.updateUser(response.data.user)
      window.dispatchEvent(new Event('auth-changed'))
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