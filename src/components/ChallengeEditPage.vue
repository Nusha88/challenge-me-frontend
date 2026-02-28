<template>
  <div class="challenge-edit-page dark-mission-theme">
    <v-container>
      <div class="mission-header-panel mb-6">
        <div class="d-flex align-center gap-3 w-100">
        <v-btn
            icon="mdi-chevron-left"
          variant="text"
            color="#4FD1C5"
          @click="goBack"
            class="back-tactical-btn"
        ></v-btn>
          
          <div class="title-container flex-grow-1">
            <h1 v-if="!isEditingTitle" class="page-title-display" @click="!isDisabled && (isEditingTitle = true)">
              {{ editForm.title || t('challenges.editTitle') }}
              <v-icon size="16" class="edit-hint-icon ml-2">mdi-pencil-outline</v-icon>
            </h1>
            <v-text-field
              v-else
              v-model="editForm.title"
              variant="plain"
              class="title-input-active"
              autofocus
              hide-details
              @blur="isEditingTitle = false"
              @keyup.enter="isEditingTitle = false"
            ></v-text-field>
          </div>

          <div class="header-status-badges">
          <v-chip
            v-if="challenge?.challengeType"
            :color="challengeTypeColor"
            size="small"
              variant="flat"
              class="tactical-chip"
          >
            {{ challengeTypeLabel }}
          </v-chip>
            <v-icon v-if="challenge?.privacy === 'private'" color="#4FD1C5" size="18" class="ml-2">mdi-lock-outline</v-icon>
            
            <v-btn icon="mdi-share-variant" variant="text" size="small" color="rgba(255,255,255,0.5)" class="ml-2"></v-btn>
          </div>
        </div>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="#4FD1C5" class="mb-4 rounded-pill"></v-progress-linear>

      <v-card v-if="challenge && !loading" class="main-tactical-card pa-1">
        <v-card-text class="pa-6">
          <v-form @submit.prevent="handleSubmit">
            
            <div class="mission-dates-grid mb-8">
              <div class="date-info-box">
                <span class="label">{{ t('challenges.startDate') }}</span>
                <span class="value">{{ formatDisplayDate(editForm.startDate) }}</span>
            </div>
              <div class="date-divider">
                <v-icon color="rgba(255,255,255,0.1)">mdi-arrow-right-thin</v-icon>
              </div>
              <div class="date-info-box">
                <span class="label">{{ t('challenges.endDate') }}</span>
                <span class="value">{{ formatDisplayDate(editForm.endDate) }}</span>
              </div>
            </div>

            <div v-if="challenge.challengeType === 'habit'" class="calendar-section-wrapper mb-8">
              <div class="section-tag mb-4">
                <v-icon start size="14">mdi-calendar-month</v-icon>
                  {{ t('challenges.challengeCalendar') }}
              </div>
              <div class="glass-container pa-4">
                    <ChallengeCalendar
                      :start-date="editForm.startDate"
                      :end-date="editForm.endDate"
                      v-model="editForm.completedDays"
                      :editable="!isDisabled"
                      :frequency="editForm.frequency"
                      @update:model-value="handleOwnerCompletedDaysUpdate"
                    />
              </div>
            </div>

            <div class="image-upload-wrapper mb-8">
              <ChallengeImageUpload v-model="editForm.imageUrl" :editable="!isDisabled" />
            </div>

            <div class="mission-description-block mb-8">
              <div class="section-tag mb-2">{{ t('challenges.description') }}</div>
              <div 
                v-if="!isEditingDescription"
                class="description-display-box"
                :class="{ 'is-empty': !editForm.description }"
                @click="!isDisabled && startEditingDescription()"
              >
                {{ editForm.description || t('challenges.descriptionPlaceholder') }}
                <v-icon class="edit-corner-icon">mdi-plus-circle-outline</v-icon>
              </div>
              <v-textarea
                v-else
                ref="descriptionTextarea"
                v-model="editForm.description"
                variant="outlined"
                color="#4FD1C5"
                class="description-input-active"
                auto-grow
                autofocus
                @blur="isEditingDescription = false"
              ></v-textarea>
            </div>

            <div class="settings-tactical-grid mb-8">
              <div class="setting-item">
                <span class="setting-label">{{ t('challenges.privacy') }}</span>
                  <v-select
                    v-model="editForm.privacy"
                    :items="privacyOptions"
                  variant="plain"
                  class="tactical-select"
                  hide-details
                  ></v-select>
                </div>

              <div v-if="challenge.challengeType === 'habit'" class="setting-item">
                <span class="setting-label">{{ t('challenges.frequency') }}</span>
                  <v-select
                    v-model="editForm.frequency"
                    :items="frequencyOptions"
                  variant="plain"
                  class="tactical-select"
                  hide-details
                  ></v-select>
              </div>

              <div class="setting-item">
                <span class="setting-label">{{ t('challenges.duration') }}</span>
                  <v-select
                    v-model="editForm.duration"
                    :items="durationOptions"
                  variant="plain"
                  class="tactical-select"
                  hide-details
                  ></v-select>
                </div>
              </div>

            <div v-if="challenge.challengeType === 'result'" class="actions-plan-section mb-8">
              <div class="section-tag mb-4">{{ t('challenges.actionsPlan') }}</div>
              <div class="actions-glass-wrapper pa-2">
                <ChallengeActions v-model="editForm.actions" :readonly="isDisabled" />
                  <v-btn
                    v-if="!isDisabled"
                  block
                  variant="text"
                  color="#4FD1C5"
                  class="add-action-tactical-btn mt-2"
                    prepend-icon="mdi-plus"
                    @click="handleAddAction"
                  >
                    {{ t('challenges.addAction') }}
                  </v-btn>
                </div>
              </div>

            <div class="comments-section-wrapper mb-8">
              <div class="d-flex align-center justify-space-between mb-4">
                <div class="section-tag">{{ t('challenges.diary.title') }}</div>
              <v-switch
                v-model="editForm.allowComments"
                  color="#4FD1C5"
                hide-details
                  density="compact"
              ></v-switch>
            </div>
              <v-expand-transition>
                <div v-if="editForm.allowComments" class="comments-container-glass">
              <CommentsComponent
                :challenge-id="challenge._id"
                :allow-comments="editForm.allowComments"
                :current-user-id="currentUserId"
                :is-owner="true"
                :challenge-participants="challenge.participants || []"
              />
                </div>
              </v-expand-transition>
            </div>

            <div class="mission-footer-actions">
              <v-btn 
                variant="outlined" 
                color="error" 
                @click="handleDelete" 
                class="footer-btn delete-btn"
              >
                {{ t('challenges.delete') }}
              </v-btn>
              
              <v-spacer></v-spacer>

              <div class="d-flex gap-3">
                <v-btn variant="text" color="white" @click="goBack" class="footer-btn">{{ t('challenges.cancel') }}</v-btn>
              <v-btn 
                type="submit" 
                  color="#4FD1C5" 
                  class="footer-btn save-btn"
                    :loading="saveLoading"
              >
                {{ t('challenges.update') }}
                    </v-btn>
                  </div>
                </div>

          </v-form>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
/* --- ТЕМНАЯ ТАКТИЧЕСКАЯ ТЕМА --- */
.dark-mission-theme {
  background: #0f172a;
  color: #fff;
  min-height: 100vh;
}

.mission-header-panel {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 12px 20px;
}

.page-title-display {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: 0.2s;
}

.page-title-display:hover { color: #4FD1C5; }
.edit-hint-icon { opacity: 0.3; }

/* --- ГЛАВНАЯ КАРТОЧКА --- */
.main-tactical-card {
  background: rgba(30, 41, 59, 0.3) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 24px !important;
}

/* --- ТАКТИЧЕСКИЕ ДАТЫ --- */
.mission-dates-grid {
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(15, 23, 42, 0.4);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.date-info-box {
  display: flex;
  flex-direction: column;
}

.date-info-box .label {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #4FD1C5;
  letter-spacing: 1px;
  font-weight: 800;
}

.date-info-box .value {
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  color: #FFFFFF;
}

/* --- СЕКЦИИ И ТЕГИ --- */
.section-tag {
  color: #4FD1C5;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
}

.description-display-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  min-height: 100px;
  cursor: pointer;
  position: relative;
  transition: 0.3s;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.description-display-box:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(79, 209, 197, 0.3);
}

.edit-corner-icon {
  position: absolute;
  bottom: 12px;
  right: 12px;
  opacity: 0.2;
}

/* --- СЕТКА НАСТРОЕК --- */
.settings-tactical-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.setting-item {
  background: rgba(15, 23, 42, 0.3);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.setting-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
  font-weight: 700;
}

.tactical-select :deep(.v-field__input) {
  padding: 0 !important;
  color: #4FD1C5 !important;
  font-weight: 700;
}

/* --- ФУТЕР И КНОПКИ --- */
.mission-footer-actions {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
}

.footer-btn {
  border-radius: 12px !important;
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.save-btn {
  background: linear-gradient(135deg, #4FD1C5 0%, #3a9e94 100%) !important;
  color: #0f172a !important;
  padding: 0 32px !important;
  box-shadow: 0 4px 15px rgba(79, 209, 197, 0.3) !important;
}

.delete-btn {
  border-color: rgba(255, 82, 82, 0.3) !important;
  color: #FF5252 !important;
}

.glass-container {
  background: rgba(255, 255, 255, 0.01);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

/* Mobile Styles */
@media (max-width: 959px) {
  .mission-header-panel {
    padding: 10px 16px;
    border-radius: 12px;
  }

  .page-title-display {
    font-size: 1.25rem;
  }

  .main-tactical-card {
    border-radius: 16px !important;
  }

  .main-tactical-card :deep(.v-card-text) {
    padding: 16px !important;
  }

  .mission-dates-grid {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    align-items: flex-start;
  }

  .date-divider {
    display: none;
  }

  .date-info-box .label {
    font-size: 0.6rem;
  }

  .date-info-box .value {
    font-size: 1rem;
  }

  .section-tag {
    font-size: 0.7rem;
    letter-spacing: 1px;
  }

  .description-display-box {
    padding: 12px;
    min-height: 80px;
    font-size: 0.9rem;
  }

  .settings-tactical-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .setting-item {
    padding: 10px 12px;
  }

  .setting-label {
    font-size: 0.6rem;
  }

  .mission-footer-actions {
    flex-direction: column-reverse;
    gap: 10px;
    margin-top: 24px;
    padding-top: 16px;
    align-items: stretch;
  }

  .mission-footer-actions .v-spacer {
    display: none;
  }

  .mission-footer-actions > .d-flex {
    width: 100%;
    flex-direction: column;
    gap: 10px;
    order: 1;
  }

  .delete-btn {
    order: 2;
    width: 100%;
  }

  .footer-btn {
    width: 100%;
    justify-content: center;
  }

  .save-btn {
    padding: 0 24px !important;
  }

  .glass-container {
    padding: 12px;
    border-radius: 12px;
  }

  .header-status-badges {
    flex-shrink: 0;
  }

  .title-container {
    min-width: 0;
    overflow: hidden;
  }

  .page-title-display {
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Small mobile devices */
@media (max-width: 599px) {
  .mission-header-panel {
    padding: 8px 12px;
    border-radius: 10px;
  }

  .page-title-display {
    font-size: 1rem;
  }

  .main-tactical-card :deep(.v-card-text) {
    padding: 12px !important;
  }

  .mission-dates-grid {
    padding: 10px;
    gap: 10px;
  }

  .date-info-box .label {
    font-size: 0.55rem;
  }

  .date-info-box .value {
    font-size: 0.9rem;
  }

  .section-tag {
    font-size: 0.65rem;
    margin-bottom: 8px;
  }

  .description-display-box {
    padding: 10px;
    min-height: 70px;
    font-size: 0.85rem;
  }

  .settings-tactical-grid {
    gap: 10px;
  }

  .setting-item {
    padding: 8px 10px;
  }

  .mission-footer-actions {
    gap: 10px;
    margin-top: 20px;
    padding-top: 12px;
    align-items: stretch;
  }

  .mission-footer-actions > .d-flex {
    gap: 8px;
  }

  .footer-btn {
    min-height: 44px;
  }

  .glass-container {
    padding: 10px;
    border-radius: 10px;
  }

  .header-status-badges .v-chip {
    font-size: 0.7rem !important;
    height: 20px !important;
  }

  .header-status-badges .v-icon {
    font-size: 14px !important;
  }

  .back-tactical-btn {
    min-width: 36px !important;
    width: 36px !important;
    height: 36px !important;
  }
}
</style>
<script setup>
import { reactive, ref, watch, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useRouter, useRoute } from 'vue-router'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import ChallengeActions from './ChallengeActions.vue'
import ChallengeCalendar from './ChallengeCalendar.vue'
import CommentsComponent from './CommentsComponent.vue'
import TeamCalendarView from './TeamCalendarView.vue'
import { challengeService } from '../services/api'

const router = useRouter()
const route = useRoute()

const challenge = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const saveLoading = ref(false)
const saveError = ref('')
const deleteLoading = ref(false)
const deleteConfirmDialog = ref(false)
const isInitializing = ref(true)
let dateRangeObserver = null
const calendarViewMode = ref('personal')
const isEditingTitle = ref(false)
const isEditingDescription = ref(false)
const isEditingPrivacy = ref(false)
const isEditingDuration = ref(false)
const isEditingFrequency = ref(false)
const descriptionDisplay = ref(null)
const descriptionTextarea = ref(null)
const descriptionRows = ref(5)

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

// Store original completedDays to detect changes
const originalCompletedDays = ref([])

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
const { mobile, mdAndUp } = useDisplay()

const challengeTypeLabel = computed(() => {
  if (!challenge.value?.challengeType) return ''
  return challenge.value.challengeType === 'habit' 
    ? t('challenges.typeHabit') 
    : t('challenges.typeResult')
})

const challengeTypeColor = computed(() => {
  if (!challenge.value?.challengeType) return 'secondary'
  return challenge.value.challengeType === 'habit' ? '#7048E8' : '#4FD1C5'
})

const titleErrorMessages = computed(() => {
  return errors.title || ''
})

const isFormValid = computed(() => {
  // Check for validation errors
  return !errors.title && !errors.description && !errors.duration && !errors.frequency &&
    editForm.title && editForm.description && editForm.duration
})

// Check if user can view personal progress (must be owner or participant)
const canViewPersonalProgress = computed(() => {
  if (!challenge.value || !currentUserId.value) return false
  const ownerId = challenge.value.owner?._id || challenge.value.owner
  return ownerId && ownerId.toString() === currentUserId.value.toString()
})

// Load challenge data
async function loadChallenge() {
  const challengeId = route.params.id
  if (!challengeId) {
    errorMessage.value = t('challenges.notFound')
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await challengeService.getChallenge(challengeId)
    challenge.value = data

    // Check if user is owner
    const ownerId = challenge.value.owner?._id || challenge.value.owner
    if (!ownerId || ownerId.toString() !== currentUserId.value?.toString()) {
      errorMessage.value = t('challenges.notAuthorized')
      loading.value = false
      return
    }

    // Initialize form
    editForm.title = challenge.value.title || ''
    editForm.description = challenge.value.description || ''
    editForm.startDate = challenge.value.startDate ? challenge.value.startDate.slice(0, 10) : ''
    editForm.endDate = challenge.value.endDate ? challenge.value.endDate.slice(0, 10) : ''
    editForm.imageUrl = challenge.value.imageUrl || ''
    editForm.frequency = challenge.value.frequency || ''
    editForm.privacy = challenge.value.privacy || 'public'
    editForm.allowComments = challenge.value.allowComments !== undefined ? challenge.value.allowComments : true
    
    if (challenge.value.challengeType === 'result') {
      editForm.actions = challenge.value.actions && challenge.value.actions.length > 0
        ? challenge.value.actions.map(a => ({ 
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

    // Initialize completedDays for habit challenges
    if (challenge.value.challengeType === 'habit') {
      let ownerCompletedDays = []
      
      if (challenge.value.participants && currentUserId.value) {
        const ownerParticipant = challenge.value.participants.find(p => {
          const userId = p.userId?._id || p.userId || p._id
          return userId && userId.toString() === currentUserId.value.toString()
        })
        
        if (ownerParticipant && ownerParticipant.completedDays && Array.isArray(ownerParticipant.completedDays)) {
          ownerCompletedDays = ownerParticipant.completedDays
        }
      }
      
      if (ownerCompletedDays.length === 0 && challenge.value.completedDays && Array.isArray(challenge.value.completedDays)) {
        ownerCompletedDays = challenge.value.completedDays
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
      
      // Store original completedDays for comparison
      originalCompletedDays.value = [...editForm.completedDays]
    } else {
      editForm.completedDays = []
      originalCompletedDays.value = []
    }
    
    // Calculate duration from start and end dates
    const calculatedDuration = calculateDuration(editForm.startDate, editForm.endDate)
    editForm.duration = calculatedDuration
    
    clearErrors()
    isInitializing.value = false
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('notifications.apiError')
  } finally {
    loading.value = false
  }
}

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

const frequencyOptions = computed(() => [
  { title: t('challenges.frequencyOptions.daily'), value: 'daily' },
  { title: t('challenges.frequencyOptions.everyOtherDay'), value: 'everyOtherDay' }
])

const privacyOptions = computed(() => [
  { title: t('challenges.privacyOptions.public'), value: 'public' },
  { title: t('challenges.privacyOptions.private'), value: 'private' }
])

function getPrivacyLabel(value) {
  const option = privacyOptions.value.find(opt => opt.value === value)
  return option ? option.title : value || t('challenges.privacy')
}

function getDurationLabel(value) {
  if (!value) return t('challenges.duration')
  const option = durationOptions.value.find(opt => opt.value === value)
  if (option) return option.title
  // If not found in standard options, format it
  const days = parseInt(value)
  if (!isNaN(days) && days > 0) {
    return `${days} ${days === 1 ? t('challenges.day') : t('challenges.days')}`
  }
  return value
}

function getFrequencyLabel(value) {
  if (!value) return t('challenges.frequency')
  const option = frequencyOptions.value.find(opt => opt.value === value)
  return option ? option.title : value
}

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

function clearErrors() {
  errors.title = ''
  errors.description = ''
  errors.duration = ''
  errors.frequency = ''
}

function goBack() {
  // Navigate to My Challenges page
  router.push('/missions/my')
}

// Share functionality
const getShareUrl = () => {
  if (!challenge.value?._id) return ''
  return `${window.location.origin}/missions/${challenge.value._id}`
}

const getShareText = () => {
  if (!challenge.value) return ''
  return challenge.value.title || ''
}

const copyLink = async () => {
  const url = getShareUrl()
  try {
    await navigator.clipboard.writeText(url)
    snackbarText.value = t('challenges.share.linkCopied')
    snackbar.value = true
  } catch (err) {
    console.error('Failed to copy link:', err)
    // Fallback for older browsers
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

const actionsScrollContainer = ref(null)

function handleAddAction() {
  if (!editForm.actions || !Array.isArray(editForm.actions)) {
    editForm.actions = []
  }
  editForm.actions.push({ text: '', checked: false, children: [] })
  
  // Scroll to the end of the actions list
  nextTick(() => {
    if (actionsScrollContainer.value) {
      // Try to find the scrollable card-text element inside
      const cardText = actionsScrollContainer.value.querySelector('.v-card-text')
      const scrollTarget = cardText || actionsScrollContainer.value
      scrollTarget.scrollTop = scrollTarget.scrollHeight
    }
  })
}

function handleDelete() {
  deleteConfirmDialog.value = true
}

async function confirmDelete() {
  if (!challenge.value?._id) return

  deleteLoading.value = true
  saveError.value = ''

  try {
    await challengeService.deleteChallenge(challenge.value._id)
    router.push('/profile')
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.deleteChallengeError')
  } finally {
    deleteLoading.value = false
    deleteConfirmDialog.value = false
  }
}

// Normalize completedDays dates to YYYY-MM-DD format
function normalizeCompletedDays(completedDays) {
  if (!Array.isArray(completedDays)) {
    return []
    }
    
  return completedDays
      .map(d => {
        if (!d) return null
        try {
          let dateStr = String(d)
          
        // Already in correct format
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr
          }
          
        // Parse and format date
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
}

function isChallengeEnded(challenge) {
  if (!challenge?.endDate) return false
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

function isChallengeFinished(challenge) {
  // Check if endDate is in the past
  if (isChallengeEnded(challenge)) {
    return true
  }
  
  // For result challenges, check if all actions are done
  if (challenge?.challengeType === 'result') {
    if (!challenge.actions || !Array.isArray(challenge.actions) || challenge.actions.length === 0) {
      return false
    }
    
    // Check if all actions and their children are checked
    return challenge.actions.every(action => {
      // Parent action must be checked
      if (!action.checked) return false
      
      // All children must be checked (if any exist)
      if (action.children && Array.isArray(action.children) && action.children.length > 0) {
        return action.children.every(child => child.checked)
      }
      
      return true
    })
  }
  
  return false
}

const isDisabled = computed(() => {
  return challenge.value ? isChallengeFinished(challenge.value) : false
})

// Prepare form data for submission
function prepareFormData() {
  const { duration, customDuration, ...formData } = editForm
  
  if (challenge.value?.challengeType) {
    formData.challengeType = challenge.value.challengeType
  }
  
  if (formData.challengeType === 'habit') {
    formData.completedDays = normalizeCompletedDays(formData.completedDays)
  } else if (formData.challengeType === 'result') {
    formData.completedDays = []
  }
  
  return formData
}

// Check if completedDays changed and update participant entry if needed
async function updateParticipantCompletedDaysIfChanged(challengeId, challengeType, currentCompletedDays) {
  if (challengeType !== 'habit' || !currentUserId.value) {
    return
  }
  
  const currentCompletedDaysSorted = [...currentCompletedDays].sort()
  const originalCompletedDaysSorted = [...originalCompletedDays.value].sort()
  
  const hasChanged = JSON.stringify(currentCompletedDaysSorted) !== JSON.stringify(originalCompletedDaysSorted)
  
  if (hasChanged) {
    try {
      const response = await challengeService.updateParticipantCompletedDays(
        challengeId,
        currentUserId.value,
        currentCompletedDaysSorted
      )
      
      // Update stored user XP if backend returned it
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
    } catch (error) {
      console.error('Error updating participant completed days:', error)
      // Don't fail the whole save if this fails
    }
  }
}

async function handleSubmit() {
  if (!validate()) return
  
  const formData = prepareFormData()
  
  saveLoading.value = true
  saveError.value = ''

  try {
    await challengeService.updateChallenge(challenge.value._id, { ...formData })
    await updateParticipantCompletedDaysIfChanged(
      challenge.value._id,
      formData.challengeType,
      formData.completedDays
    )
    router.push('/')
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.updateError')
  } finally {
    saveLoading.value = false
  }
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

  if (challenge.value?.challengeType === 'habit' && !editForm.frequency) {
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

function handleOwnerCompletedDaysUpdate(completedDays) {
  if (!challenge.value || !currentUserId.value) return
  
  // Only update local state, don't call API
  editForm.completedDays = completedDays
  localCurrentUserCompletedDays.value = [...completedDays]
}

function handleCommentAdded() {
  // Refresh challenge data if needed
  if (challenge.value) {
    loadChallenge()
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
  if (!challenge.value || !currentUserId.value) return false
  return watchedChallenges.value.some(id => id.toString() === challenge.value._id.toString())
})

// Handle watch challenge
async function handleWatch() {
  if (!currentUserId.value || !challenge.value) return
  
  watchingId.value = challenge.value._id
  try {
    await challengeService.watchChallenge(challenge.value._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (error) {
    console.error('Error watching challenge:', error)
    alert(error.response?.data?.message || t('challenges.watchError'))
  } finally {
    watchingId.value = null
  }
}

// Handle unwatch challenge
async function handleUnwatch() {
  if (!currentUserId.value || !challenge.value) return
  
  watchingId.value = challenge.value._id
  try {
    await challengeService.unwatchChallenge(challenge.value._id, currentUserId.value)
    await loadWatchedChallenges()
  } catch (error) {
    console.error('Error unwatching challenge:', error)
    alert(error.response?.data?.message || t('challenges.unwatchError'))
  } finally {
    watchingId.value = null
  }
}

function handleCommentDeleted() {
  // Refresh challenge data if needed
  if (challenge.value) {
    loadChallenge()
  }
}

function startEditingDescription() {
  // Measure the description height before switching to edit mode
  let targetHeight = 80 // default minimum height
  if (descriptionDisplay.value) {
    const displayElement = descriptionDisplay.value
    const computedStyle = window.getComputedStyle(displayElement)
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24
    const actualHeight = displayElement.scrollHeight
    targetHeight = actualHeight
    const calculatedRows = Math.max(3, Math.ceil(actualHeight / lineHeight))
    
    descriptionRows.value = calculatedRows
  }
  
  isEditingDescription.value = true
  
  // Adjust textarea height after it's rendered to match the display height
  nextTick(() => {
    if (descriptionTextarea.value) {
      const textarea = descriptionTextarea.value.$el?.querySelector('textarea')
      if (textarea) {
        textarea.style.height = 'auto'
        // Set height to match the display, with a minimum
        textarea.style.height = `${Math.max(targetHeight, 80)}px`
      }
    }
  })
}

onMounted(async () => {
  await loadWatchedChallenges()
  loadChallenge()
})
</script>




