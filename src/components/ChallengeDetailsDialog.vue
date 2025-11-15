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

            <!-- Progress Bar -->
            <div v-if="challenge.challengeType" class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">
                  <template v-if="challenge.challengeType === 'result'">
                    {{ t('challenges.progressActions', { done: progressDone, total: progressTotal }) }}
                  </template>
                  <template v-else>
                    {{ t('challenges.progressDays', { passed: progressDone, total: progressTotal }) }}
                  </template>
                </span>
                <span class="text-body-2 font-weight-medium">{{ progressPercentage }}%</span>
              </div>
              <v-progress-linear
                :model-value="progressPercentage"
                color="primary"
                height="8"
                rounded
              ></v-progress-linear>
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

            <div class="mb-4">
              <strong>{{ t('challenges.participants') }}:</strong>
              <v-chip-group column class="mt-2">
                <v-chip
                  v-for="participant in challenge.participants"
                  :key="participant._id || participant"
                  size="small"
                  class="mr-1"
                >
                  {{ participant.name || t('common.unknown') }}
                </v-chip>
              </v-chip-group>
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
          <!-- Progress Bar -->
          <div v-if="challenge.challengeType" class="mb-4">
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2">
                <template v-if="challenge.challengeType === 'result'">
                  {{ t('challenges.progressActions', { done: progressDone, total: progressTotal }) }}
                </template>
                <template v-else>
                  {{ t('challenges.progressDays', { passed: progressDone, total: progressTotal }) }}
                </template>
              </span>
              <span class="text-body-2 font-weight-medium">{{ progressPercentage }}%</span>
            </div>
            <v-progress-linear
              :model-value="progressPercentage"
              color="primary"
              height="8"
              rounded
            ></v-progress-linear>
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

          <div>
            <strong>{{ t('challenges.participants') }}:</strong>
            <v-chip-group column class="mt-2">
              <v-chip
                v-for="participant in challenge.participants"
                :key="participant._id || participant"
                size="small"
                class="mr-1"
              >
                {{ participant.name || t('common.unknown') }}
              </v-chip>
            </v-chip-group>
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
import { reactive, ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import ChallengeActions from './ChallengeActions.vue'

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
  actions: []
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

.date-pickers {
  display: grid;
  gap: 16px;
}

@media (min-width: 600px) {
  .date-pickers {
    grid-template-columns: repeat(2, 1fr);
  }
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

.duration-row .custom-duration-field {
  grid-column: 1;
}

@media (min-width: 600px) {
  .duration-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .duration-row .custom-duration-field {
    grid-column: 2;
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

.duration-privacy-row .custom-duration-field {
  grid-column: 1;
  grid-row: 3;
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
  
  .duration-privacy-row .custom-duration-field {
    grid-column: 2;
    grid-row: 2;
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
</style>
