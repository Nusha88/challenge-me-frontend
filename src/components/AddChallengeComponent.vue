<template>
  <div class="add-challenge mission-form">
    <div class="header-section text-left mb-10 reveal-animation">
      <div class="d-flex align-center mb-1">
        <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-flare</v-icon>
        <h1 class="page-title-dark">{{ t('challenges.addTitle') }}</h1>
      </div>
      <p class="journal-subtitle-dark mt-2">{{ t('challenges.motiveText') }}</p>
    </div>
    <div class="form-container">
        <v-form @submit.prevent="handleSubmit">
          <ChallengeTypeSelector
            :model-value="form.challengeType"
            @update:model-value="selectChallengeType"
          />

          <v-row>
            <v-col cols="12" md="8">
              <div class="form-fields-wrapper mission-form-fields">
                <ChallengeBaseFields
                  v-model:title="form.title"
                  v-model:description="form.description"
                  v-model:image-url="form.imageUrl"
                  v-model:show-image-upload="showImageUpload"
                  :challenge-type="form.challengeType"
                  :title-error="errors.title"
                  :description-error="errors.description"
                  :description-required="!isHabit"
                />

                <HabitSettingsSection
                  v-if="isHabit"
                  v-model:duration="form.duration"
                  v-model:custom-duration="form.customDuration"
                  v-model:frequency="form.frequency"
                  v-model:start-option="form.startOption"
                  v-model:start-date="form.startDate"
                  v-model:privacy="form.privacy"
                  v-model:allow-comments="form.allowComments"
                  :duration-error="errors.duration"
                />

                <ResultSettingsSection
                  v-else
                  v-model:milestones="form.milestones"
                  v-model:end-date="form.endDate"
                  v-model:difficulty="form.difficulty"
                  v-model:privacy="form.privacy"
                  v-model:reward="form.reward"
                  :end-date-error="errors.endDate"
                  :milestones-error="errors.milestones"
                />

          <v-alert
            v-if="errorMessage"
            type="error"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <div class="create-button-wrapper">
            <v-btn
              type="submit"
              color="primary"
              size="large"
              :loading="loading"
              :disabled="loading"
              class="create-mission-btn"
              :class="{
                'disabled-grayscale': !isFormValid,
                'create-mission-btn--ready': isFormValid && !loading
              }"
            >
              {{ createButtonText }}
            </v-btn>
          </div>
              </div>
            </v-col>
            <v-col v-if="showImageUpload" cols="12" md="4" class="desktop-upload-section">
              <ChallengeImageUpload
                v-model="form.imageUrl"
                :editable="true"
              />
            </v-col>
          </v-row>
        </v-form>
    </div>
    
    <SuccessModal
      v-model="showSuccessModal"
      :challenge-id="createdChallengeId"
      :is-public="form.privacy === 'public'"
      @add-another="resetForm"
    />

    <v-snackbar
      v-model="validationToastOpen"
      color="error"
      location="bottom"
      :timeout="4000"
    >
      {{ t('challenges.validation.formIncomplete') }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '../stores/user'
import ChallengeImageUpload from './ChallengeImageUpload.vue'
import SuccessModal from './SuccessModal.vue'
import ChallengeTypeSelector from './challenge-form/ChallengeTypeSelector.vue'
import ChallengeBaseFields from './challenge-form/ChallengeBaseFields.vue'
import HabitSettingsSection from './challenge-form/HabitSettingsSection.vue'
import ResultSettingsSection from './challenge-form/ResultSettingsSection.vue'
import { fireConfetti } from '../utils/confetti'
import { toDateInputValue, addDays } from '../utils/dateUtils'
import { useRestartChallengeDraft } from '../composables/useRestartChallengeDraft'
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()
const { applyRewardResponse } = useXpAwardFeedback()
const {
  loadRestartDraft,
  getRestartedChallengeId,
  clearRestartedChallengeId
} = useRestartChallengeDraft()

const form = ref({
  title: '',
  description: '',
  startDate: '',
  imageUrl: '',
  duration: '21',
  customDuration: '',
  privacy: 'private',
  challengeType: CHALLENGE_TYPES.HABIT,
  frequency: 'daily',
  startOption: 'today',
  milestones: [{ title: '' }],
  endDate: '',
  reward: '',
  difficulty: 'medium',
  allowComments: true,
  communityQuest: false
})

const showImageUpload = ref(false)
/** Preserves habit privacy when toggling habit ↔ result */
const lastHabitPrivacy = ref('private')
const showSuccessModal = ref(false)
const createdChallengeId = ref('')

const isHabit = computed(() => form.value.challengeType === CHALLENGE_TYPES.HABIT)

watch(() => form.value.title, () => {
  if (errors.value.title) {
    errors.value.title = ''
  }
})

watch(() => form.value.description, () => {
  if (errors.value.description) {
    errors.value.description = ''
  }
})

watch(() => form.value.endDate, () => {
  if (errors.value.endDate) {
    errors.value.endDate = ''
  }
})

watch(() => form.value.milestones, () => {
  if (errors.value.milestones && form.value.milestones?.some((item) => item.title?.trim())) {
    errors.value.milestones = ''
  }
}, { deep: true })

watch(() => form.value.frequency, () => {
  if (errors.value.frequency) {
    errors.value.frequency = ''
  }
})

watch(() => form.value.duration, () => {
  if (errors.value.duration) {
    errors.value.duration = ''
  }
})

watch(() => form.value.customDuration, () => {
  if (errors.value.duration && form.value.customDuration) {
    errors.value.duration = ''
  }
})

function applyRestartDraft(draft) {
  if (!draft) {
    return
  }

  if (draft.title) form.value.title = draft.title
  if (draft.description) form.value.description = draft.description
  if (draft.imageUrl) {
    form.value.imageUrl = draft.imageUrl
    showImageUpload.value = true
  }
  if (draft.challengeType) form.value.challengeType = draft.challengeType
  if (draft.privacy) form.value.privacy = draft.privacy
  if (draft.frequency) form.value.frequency = draft.frequency
  if (draft.reward) form.value.reward = draft.reward
  if (draft.difficulty) form.value.difficulty = draft.difficulty
  if (draft.allowComments !== undefined) form.value.allowComments = draft.allowComments
  if (draft.startOption) form.value.startOption = draft.startOption

  if (draft.duration) {
    form.value.duration = draft.duration
    form.value.customDuration = draft.customDuration || ''
    if (draft.customDays != null) {
      customDays.value = draft.customDays
    }
    if (draft.showCustomSlider) {
      showSlider.value = true
    }
  }

  if (draft.endDate) form.value.endDate = draft.endDate
  if (draft.milestones) form.value.milestones = draft.milestones
  if (draft.lastHabitPrivacy) lastHabitPrivacy.value = draft.lastHabitPrivacy
}

onMounted(() => {
  applyRestartDraft(loadRestartDraft())
})

const createButtonText = computed(() => {
  return form.value.challengeType === CHALLENGE_TYPES.RESULT
    ? t('challenges.createResult')
    : t('challenges.createHabit')
})

const loading = ref(false)
const errorMessage = ref('')
const validationToastOpen = ref(false)

function createEmptyErrors() {
  return {
    title: '',
    description: '',
    duration: '',
    endDate: '',
    milestones: '',
    frequency: '',
    startOption: ''
  }
}

const errors = ref(createEmptyErrors())

const isFormValid = computed(() => {
  const hasTitle = Boolean(form.value.title?.trim())
  const hasValidDuration = form.value.duration !== 'custom'
    ? Boolean(form.value.duration)
    : Number(form.value.customDuration) >= 1

  if (form.value.challengeType === CHALLENGE_TYPES.HABIT) {
    return hasTitle && hasValidDuration && Boolean(form.value.frequency)
  }

  const hasDeadline = Boolean(form.value.endDate)
  const hasMilestone = form.value.milestones?.some((item) => item.title?.trim())
  const hasDescription = Boolean(form.value.description?.trim())

  return hasTitle && hasDescription && hasDeadline && hasMilestone
})

function getCurrentUserId() {
  if (userStore.userId) {
    return userStore.userId
  }

  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null

  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || parsed?._id || null
  } catch (error) {
    return null
  }
}

function saveCurrentTypeState() {
  if (form.value.challengeType !== CHALLENGE_TYPES.HABIT) {
    return
  }

  if (form.value.privacy === 'private' || form.value.privacy === 'public') {
    lastHabitPrivacy.value = form.value.privacy
  }
}

function applyHabitDefaults() {
  form.value.duration = '21'
  form.value.startOption = 'today'
  form.value.frequency = 'daily'
  form.value.privacy = lastHabitPrivacy.value
}

function applyResultDefaults() {
  form.value.duration = '30'
  form.value.startOption = 'today'
  form.value.frequency = ''
  form.value.privacy = 'private'
  form.value.difficulty = 'medium'

  if (!form.value.milestones?.length) {
    form.value.milestones = [{ title: '' }]
  }
}

function resetCustomDurationIfNeeded() {
  if (form.value.duration !== 'custom') {
    form.value.customDuration = ''
  }
}

function selectChallengeType(type) {
  if (form.value.challengeType === type) {
    return
  }

  saveCurrentTypeState()
  form.value.challengeType = type

  if (type === CHALLENGE_TYPES.HABIT) {
    applyHabitDefaults()
  } else {
    applyResultDefaults()
  }

  resetCustomDurationIfNeeded()
}

function validate() {
  const validationErrors = {}

  if (!form.value.title?.trim()) {
    validationErrors.title = t('challenges.validation.titleRequired')
  }

  if (form.value.challengeType === CHALLENGE_TYPES.HABIT) {
    if (!form.value.startOption) {
      validationErrors.startOption = t('challenges.validation.startOptionRequired')
    }

    if (!form.value.duration) {
      validationErrors.duration = t('challenges.validation.durationRequired')
    } else if (form.value.duration === 'custom' && Number(form.value.customDuration) < 1) {
      validationErrors.duration = t('challenges.validation.customDurationRequired')
    }

    if (!form.value.frequency) {
      validationErrors.frequency = t('challenges.validation.frequencyRequired')
    }
  } else {
    if (!form.value.description?.trim()) {
      validationErrors.description = t('challenges.validation.descriptionRequired')
    }

    if (!form.value.endDate) {
      validationErrors.endDate = t('challenges.validation.endDateRequired')
    }

    const hasMilestone = form.value.milestones?.some((item) => item.title?.trim())
    if (!hasMilestone) {
      validationErrors.milestones = t('challenges.validation.milestoneRequired')
    }
  }

  errors.value = {
    ...createEmptyErrors(),
    ...validationErrors
  }
  return Object.keys(validationErrors).length === 0
}

const VALIDATION_FIELD_ORDER = ['title', 'description', 'milestones', 'endDate', 'duration', 'frequency']

async function scrollToFirstValidationError() {
  await nextTick()

  for (const field of VALIDATION_FIELD_ORDER) {
    if (!errors.value[field]) continue

    const target = document.querySelector(`[data-validation-field="${field}"]`)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }
}

function calculateStartDate() {
  if (form.value.startDate) {
    return form.value.startDate
  }

  const startDate = form.value.startOption === 'tomorrow'
    ? addDays(new Date(), 1)
    : new Date()

  return toDateInputValue(startDate)
}

function calculateEndDate() {
  const startDate = calculateStartDate()
  if (!startDate) return ''

  const duration = form.value.duration === 'custom'
    ? parseInt(form.value.customDuration, 10)
    : parseInt(form.value.duration, 10)

  if (!Number.isFinite(duration) || duration < 1) {
    return ''
  }

  return toDateInputValue(addDays(startDate, duration - 1))
}

const normalizedPrivacy = computed(() => {
  return form.value.privacy === 'solo' ? 'private' : form.value.privacy
})

function getSubmissionEndDate() {
  if (form.value.challengeType === CHALLENGE_TYPES.RESULT && form.value.endDate) {
    return form.value.endDate
  }

  return calculateEndDate()
}

function buildActionsFromMilestones() {
  const milestones = Array.isArray(form.value.milestones) ? form.value.milestones : []

  return milestones
    .map((milestone) => milestone.title?.trim())
    .filter(Boolean)
    .map((title) => ({
      text: title,
      checked: false,
      children: []
    }))
}

function buildChallengePayload(userId) {
  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    startDate: calculateStartDate(),
    endDate: getSubmissionEndDate(),
    owner: userId,
    privacy: normalizedPrivacy.value,
    challengeType: form.value.challengeType,
    allowComments: form.value.allowComments,
    communityQuest: form.value.communityQuest
  }

  if (form.value.imageUrl) {
    payload.imageUrl = form.value.imageUrl
  }

  if (form.value.challengeType === CHALLENGE_TYPES.HABIT) {
    payload.frequency = form.value.frequency
  }

  if (form.value.challengeType === CHALLENGE_TYPES.RESULT) {
    payload.actions = buildActionsFromMilestones()
    payload.difficulty = form.value.difficulty

    if (form.value.reward?.trim()) {
      payload.reward = form.value.reward.trim()
    }
  }

  return payload
}

async function deleteRestartedChallengeIfNeeded() {
  const restartedChallengeId = getRestartedChallengeId()
  if (!restartedChallengeId) {
    return
  }

  try {
    await challengeService.deleteChallenge(restartedChallengeId)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error deleting restarted challenge:', error)
    }
  } finally {
    clearRestartedChallengeId()
  }
}

function getCreatedChallengeId(response) {
  return response.data?.challenge?._id || response.data?._id || response.data?.id || ''
}

function triggerHapticFeedback(pattern = 50) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

async function handleCreateSuccess(response) {
  applyRewardResponse(response)
  const challengeId = getCreatedChallengeId(response)

  if (challengeId) {
    createdChallengeId.value = challengeId
    triggerHapticFeedback([100, 50, 100])
    fireConfetti()
  }

  if (form.value.privacy === 'public') {
    await nextTick()
    showSuccessModal.value = true
    return
  }

  router.push('/missions/my')
}

function handleCreateError(error) {
  if (import.meta.env.DEV) {
    console.error('Error creating challenge:', error)
  }

  errorMessage.value = error.response?.data?.message || error.message || t('notifications.createError')
}

async function handleSubmit() {
  if (!validate()) {
    validationToastOpen.value = true
    await scrollToFirstValidationError()
    return
  }

  const userId = getCurrentUserId()
  if (!userId) {
    errorMessage.value = t('challenges.mustBeLoggedIn')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const payload = buildChallengePayload(userId)
    const response = await challengeService.createChallenge(payload)

    await deleteRestartedChallengeIfNeeded()
    await handleCreateSuccess(response)
  } catch (error) {
    handleCreateError(error)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  // Reset form to default values
  form.value = {
    title: '',
    description: '',
    startDate: '',
    imageUrl: '',
    duration: '21',
    customDuration: '',
    privacy: 'private',
    challengeType: CHALLENGE_TYPES.HABIT,
    frequency: 'daily',
    startOption: 'today',
    milestones: [{ title: '' }],
    endDate: '',
    reward: '',
    difficulty: 'medium',
    allowComments: true,
    communityQuest: false
  }
  
  // Reset other state
  showImageUpload.value = false
  createdChallengeId.value = ''
  errorMessage.value = ''
  errors.value = createEmptyErrors()
  validationToastOpen.value = false
  lastHabitPrivacy.value = 'private'

  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.add-challenge {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2em 1em;
  position: relative;
  color: #FFFFFF;
}

.header-section {
  margin-bottom: 40px;
}

.form-container {
  width: 100%;
}

.form-fields-wrapper {
  width: 100%;
}

.desktop-upload-section {
  display: none;
}

@media (min-width: 960px) {
  .desktop-upload-section {
    display: block;
  }
}
</style>
