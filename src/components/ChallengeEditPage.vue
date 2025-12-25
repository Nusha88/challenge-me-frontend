<template>
  <div class="challenge-edit-page">
    <v-container>
      <div class="page-header mb-6">
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="goBack"
          class="back-button"
        ></v-btn>
        <h1 class="page-title">{{ t('challenges.editTitle') }}</h1>
        <v-chip
          v-if="challenge?.challengeType"
          :color="challengeTypeColor"
          size="small"
          class="ml-4"
        >
          {{ challengeTypeLabel }}
        </v-chip>
        <v-icon
          v-if="challenge?.privacy === 'private'"
          color="grey-darken-1"
          size="24"
          class="ml-4 privacy-icon"
        >
          mdi-lock
        </v-icon>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

      <v-alert v-if="errorMessage" type="error" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-card v-if="challenge && !loading">
        <v-card-text>
          <v-form @submit.prevent="handleSubmit">
            <div class="dates-row mb-4">
              <p class="start-date-text">
                <strong>{{ t('challenges.startDate') }}:</strong> {{ formatDisplayDate(editForm.startDate) }}
              </p>
              <p class="end-date-text">
                <strong>{{ t('challenges.endDate') }}:</strong> {{ formatDisplayDate(editForm.endDate) }}
              </p>
            </div>

            <div class="title-section mb-4">
              <h2 
                v-if="!isEditingTitle"
                class="editable-title"
                @click="isEditingTitle = true"
              >
                {{ editForm.title || t('challenges.title') }}
              </h2>
              <v-text-field
                v-else
                v-model="editForm.title"
                :label="t('challenges.title')"
                variant="outlined"
                required
                :error-messages="titleErrorMessages"
                autofocus
                @blur="isEditingTitle = false"
                @keyup.enter="isEditingTitle = false"
                @keyup.esc="isEditingTitle = false"
              ></v-text-field>
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

            <div class="description-section mb-4">
              <p 
                v-if="!isEditingDescription"
                ref="descriptionDisplay"
                class="editable-description"
                @click="startEditingDescription"
              >
                {{ editForm.description || t('challenges.description') }}
              </p>
              <v-textarea
                v-else
                ref="descriptionTextarea"
                v-model="editForm.description"
                :label="t('challenges.description')"
                variant="outlined"
                :rows="descriptionRows"
                required
                :error-messages="errors.description"
                autofocus
                auto-grow
                @blur="isEditingDescription = false"
                @keyup.ctrl.enter="isEditingDescription = false"
                @keyup.esc="isEditingDescription = false"
              ></v-textarea>
            </div>

            <template v-if="challenge.challengeType === 'habit'">
              <div class="frequency-privacy-row mb-4">
                <div class="editable-field-section">
                  <p 
                    v-if="!isEditingPrivacy"
                    class="editable-field"
                    @click="isEditingPrivacy = true"
                  >
                    <strong>{{ t('challenges.privacy') }}:</strong> {{ getPrivacyLabel(editForm.privacy) }}
                  </p>
                  <v-select
                    v-else
                    v-model="editForm.privacy"
                    :items="privacyOptions"
                    :label="t('challenges.privacy')"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    autofocus
                    @blur="isEditingPrivacy = false"
                    @update:model-value="isEditingPrivacy = false"
                  ></v-select>
                </div>
                <div class="editable-field-section">
                  <p 
                    v-if="!isEditingFrequency"
                    class="editable-field"
                    @click="isEditingFrequency = true"
                  >
                    <strong>{{ t('challenges.frequency') }}:</strong> {{ getFrequencyLabel(editForm.frequency) }}
                  </p>
                  <v-select
                    v-else
                    v-model="editForm.frequency"
                    :items="frequencyOptions"
                    :label="t('challenges.frequency')"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    :error-messages="errors.frequency"
                    autofocus
                    @blur="isEditingFrequency = false"
                    @update:model-value="isEditingFrequency = false"
                  ></v-select>
                </div>
              </div>

              <div class="duration-row mb-4">
                <div class="editable-field-section">
                  <p 
                    v-if="!isEditingDuration"
                    class="editable-field"
                    @click="isEditingDuration = true"
                  >
                    <strong>{{ t('challenges.duration') }}:</strong> {{ getDurationLabel(editForm.duration) }}
                  </p>
                  <v-select
                    v-else
                    v-model="editForm.duration"
                    :items="durationOptions"
                    :label="t('challenges.duration')"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    :error-messages="errors.duration"
                    autofocus
                    @blur="isEditingDuration = false"
                    @update:model-value="isEditingDuration = false"
                  ></v-select>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="duration-privacy-row mb-4">
                <div class="editable-field-section">
                  <p 
                    v-if="!isEditingPrivacy"
                    class="editable-field"
                    @click="isEditingPrivacy = true"
                  >
                    <strong>{{ t('challenges.privacy') }}:</strong> {{ getPrivacyLabel(editForm.privacy) }}
                  </p>
                  <v-select
                    v-else
                    v-model="editForm.privacy"
                    :items="privacyOptions"
                    :label="t('challenges.privacy')"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    autofocus
                    @blur="isEditingPrivacy = false"
                    @update:model-value="isEditingPrivacy = false"
                  ></v-select>
                </div>

                <div class="editable-field-section">
                  <p 
                    v-if="!isEditingDuration"
                    class="editable-field"
                    @click="isEditingDuration = true"
                  >
                    <strong>{{ t('challenges.duration') }}:</strong> {{ getDurationLabel(editForm.duration) }}
                  </p>
                  <v-select
                    v-else
                    v-model="editForm.duration"
                    :items="durationOptions"
                    :label="t('challenges.duration')"
                    item-title="title"
                    item-value="value"
                    variant="outlined"
                    :error-messages="errors.duration"
                    autofocus
                    @blur="isEditingDuration = false"
                    @update:model-value="isEditingDuration = false"
                  ></v-select>
                </div>
              </div>

              <ChallengeActions
                v-model="editForm.actions"
              />
            </template>

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
                @click="goBack" 
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
                :disabled="saveLoading || deleteLoading || !isFormValid"
                class="action-button save-button"
              >
                {{ t('challenges.update') }}
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-container>

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
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useRouter, useRoute } from 'vue-router'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import ChallengeActions from './ChallengeActions.vue'
import ChallengeCalendar from './ChallengeCalendar.vue'
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
const { mobile, mdAndUp } = useDisplay()

const challengeTypeLabel = computed(() => {
  if (!challenge.value?.challengeType) return ''
  return challenge.value.challengeType === 'habit' 
    ? t('challenges.typeHabit') 
    : t('challenges.typeResult')
})

const challengeTypeColor = computed(() => {
  if (!challenge.value?.challengeType) return 'secondary'
  return challenge.value.challengeType === 'habit' ? 'success' : 'warning'
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
    } else {
      editForm.completedDays = []
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
  { title: t('challenges.frequencyOptions.everyOtherDay'), value: 'everyOtherDay' },
  { title: t('challenges.frequencyOptions.weekdays'), value: 'weekdays' }
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
  router.back()
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
    router.push('/challenges/my')
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.deleteError')
  } finally {
    deleteLoading.value = false
    deleteConfirmDialog.value = false
  }
}

async function handleSubmit() {
  if (!validate()) return
  
  const { duration, customDuration, ...formData } = editForm
  
  if (challenge.value?.challengeType) {
    formData.challengeType = challenge.value.challengeType
  }
  
  if (formData.challengeType === 'habit') {
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
  } else if (formData.challengeType === 'result') {
    formData.completedDays = []
  }
  
  saveLoading.value = true
  saveError.value = ''

  try {
    await challengeService.updateChallenge(challenge.value._id, { ...formData })
    router.push('/challenges/my')
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

async function handleOwnerCompletedDaysUpdate(completedDays) {
  if (!challenge.value || !currentUserId.value) return
  
  editForm.completedDays = completedDays
  localCurrentUserCompletedDays.value = [...completedDays]
  
  try {
    await challengeService.updateParticipantCompletedDays(
      challenge.value._id,
      currentUserId.value,
      completedDays
    )
    await loadChallenge()
  } catch (error) {
    console.error('Error updating owner completed days:', error)
    await loadChallenge()
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

onMounted(() => {
  loadChallenge()
})
</script>

<style scoped>
.challenge-edit-page {
  min-height: 100vh;
  padding: 16px 0;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  margin-right: 8px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.privacy-icon {
  flex-shrink: 0;
}

.frequency-privacy-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 600px) {
  .frequency-privacy-row:not(.single-column) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.dates-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

@media (min-width: 600px) {
  .dates-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
}

.start-date-text,
.end-date-text {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  flex: 0 0 auto;
}

.end-date-text {
  text-align: left;
}

@media (min-width: 600px) {
  .end-date-text {
    text-align: right;
  }
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
  padding: 12px;
  width: 100%;
}

@media (min-width: 600px) {
  .habit-calendar :deep(.v-card-text) {
    padding: 16px;
  }
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
  margin-top: 0;
}

.action-button {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  min-width: 100px;
  height: 40px;
  padding: 0 24px;
  border-radius: 24px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-button {
  box-shadow: 0 2px 4px rgba(211, 47, 47, 0.2);
}

.delete-button:hover:not(:disabled) {
  box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3);
  transform: translateY(-2px);
}

.save-button {
  background: linear-gradient(135deg, #1FA0F6 0%, #2196F3 100%) !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(31, 160, 246, 0.2);
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2196F3 0%, #1FA0F6 100%) !important;
  box-shadow: 0 4px 12px rgba(31, 160, 246, 0.4);
  transform: translateY(-2px);
}

.cancel-button {
  border-width: 2px;
  border-color: rgba(31, 160, 246, 0.5) !important;
  color: #1FA0F6 !important;
}

.cancel-button:hover:not(:disabled) {
  background-color: rgba(31, 160, 246, 0.08) !important;
  border-color: #1FA0F6 !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(31, 160, 246, 0.2);
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

.title-section {
  width: 100%;
}

.editable-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 48px;
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.87);
}

.editable-title:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.editable-title:empty::before {
  content: attr(data-placeholder);
  color: rgba(0, 0, 0, 0.38);
}

@media (min-width: 600px) {
  .editable-title {
    font-size: 2rem;
    padding: 16px 20px;
  }
}

.description-section {
  width: 100%;
}

.editable-description {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 60px;
  color: rgba(0, 0, 0, 0.87);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.editable-description:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.editable-description:empty::before {
  content: attr(data-placeholder);
  color: rgba(0, 0, 0, 0.38);
}

@media (min-width: 600px) {
  .editable-description {
    font-size: 1.125rem;
    padding: 16px 20px;
    min-height: 80px;
  }
}

.editable-field-section {
  width: 100%;
}

.editable-field {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: rgba(0, 0, 0, 0.87);
}

.editable-field:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.editable-field strong {
  font-weight: 600;
  margin-right: 8px;
}

@media (min-width: 600px) {
  .editable-field {
    font-size: 1.125rem;
    padding: 16px 20px;
  }
}
</style>




