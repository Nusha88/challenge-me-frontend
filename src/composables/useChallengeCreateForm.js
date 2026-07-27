import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { challengeService } from '../services/api'
import { useUserStore } from '../stores/user'
import { fireConfetti } from '../utils/confetti'
import { toDateInputValue, addDays } from '../utils/dateUtils'
import { useRestartChallengeDraft } from './useRestartChallengeDraft'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'

const VALIDATION_FIELD_ORDER = ['title', 'description', 'actions', 'endDate', 'duration', 'frequency']

function emptyAction() {
  return { text: '', checked: false, children: [] }
}

function normalizeActionTree(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return [emptyAction()]
  }

  return actions.map((action) => ({
    ...(action._id ? { _id: action._id } : {}),
    text: action.text || action.title || '',
    checked: Boolean(action.checked),
    children: Array.isArray(action.children)
      ? action.children.map((child) => ({
          ...(child._id ? { _id: child._id } : {}),
          text: child.text || '',
          checked: Boolean(child.checked)
        }))
      : []
  }))
}

function migrateMilestonesToActions(milestones) {
  if (!Array.isArray(milestones)) return [emptyAction()]
  const mapped = milestones
    .map((item) => ({
      text: (item.title || item.text || '').trim(),
      checked: false,
      children: []
    }))
    .filter((item) => item.text)
  return mapped.length > 0 ? mapped : [emptyAction()]
}

function resolveActionsFromDraft(draft) {
  if (Array.isArray(draft?.actions) && draft.actions.length > 0) {
    return normalizeActionTree(draft.actions)
  }
  if (Array.isArray(draft?.milestones) && draft.milestones.length > 0) {
    return migrateMilestonesToActions(draft.milestones)
  }
  return [emptyAction()]
}

function createDefaultForm() {
  return {
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
    actions: [emptyAction()],
    endDate: '',
    reward: '',
    difficulty: 'medium',
    allowComments: true,
    communityQuest: false
  }
}

function createEmptyErrors() {
  return {
    title: '',
    description: '',
    duration: '',
    endDate: '',
    actions: '',
    frequency: '',
    startOption: ''
  }
}

function snapshotHabitState(form) {
  return {
    duration: form.duration,
    customDuration: form.customDuration,
    frequency: form.frequency,
    privacy: form.privacy === 'solo' ? 'private' : form.privacy,
    allowComments: form.allowComments,
    startOption: form.startOption,
    startDate: form.startDate
  }
}

function snapshotResultState(form) {
  return {
    privacy: form.privacy === 'solo' ? 'private' : form.privacy,
    allowComments: form.allowComments,
    difficulty: form.difficulty,
    endDate: form.endDate,
    reward: form.reward,
    actions: normalizeActionTree(form.actions)
  }
}

function hasFilledAction(actions) {
  return Array.isArray(actions) && actions.some((action) => {
    if (action.text?.trim()) return true
    return Array.isArray(action.children) && action.children.some((child) => child.text?.trim())
  })
}

function normalizeActionsForPayload(actions) {
  if (!Array.isArray(actions)) return []

  return actions
    .map((action) => ({
      text: (action.text || '').trim(),
      checked: false,
      children: Array.isArray(action.children)
        ? action.children
            .map((child) => ({
              text: (child.text || '').trim(),
              checked: false
            }))
            .filter((child) => child.text)
        : []
    }))
    .filter((action) => action.text || action.children.length > 0)
}

export function useChallengeCreateForm() {
  const router = useRouter()
  const { t } = useI18n()
  const userStore = useUserStore()
  const { applyRewardResponse } = useXpAwardFeedback()
  const {
    loadRestartDraft,
    getRestartedChallengeId,
    clearRestartedChallengeId
  } = useRestartChallengeDraft()

  const form = ref(createDefaultForm())
  const errors = ref(createEmptyErrors())
  const showImageUpload = ref(false)
  const showSuccessModal = ref(false)
  const createdChallengeId = ref('')
  const loading = ref(false)
  const errorMessage = ref('')
  const validationToastOpen = ref(false)

  const lastHabitState = ref(snapshotHabitState(form.value))
  const lastResultState = ref(snapshotResultState(form.value))

  const isHabit = computed(() => form.value.challengeType === CHALLENGE_TYPES.HABIT)

  const createButtonText = computed(() =>
    form.value.challengeType === CHALLENGE_TYPES.RESULT
      ? t('challenges.createResult')
      : t('challenges.createHabit')
  )

  const isFormValid = computed(() => {
    const hasTitle = Boolean(form.value.title?.trim())
    const hasValidDuration = form.value.duration !== 'custom'
      ? Boolean(form.value.duration)
      : Number(form.value.customDuration) >= 1

    if (form.value.challengeType === CHALLENGE_TYPES.HABIT) {
      return hasTitle && hasValidDuration && Boolean(form.value.frequency)
    }

    const hasDeadline = Boolean(form.value.endDate)
    const hasAction = hasFilledAction(form.value.actions)
    const hasDescription = Boolean(form.value.description?.trim())

    return hasTitle && hasDescription && hasDeadline && hasAction
  })

  const normalizedPrivacy = computed(() =>
    form.value.privacy === 'solo' ? 'private' : form.value.privacy
  )

  watch(() => form.value.title, () => {
    if (errors.value.title) errors.value.title = ''
  })

  watch(() => form.value.description, () => {
    if (errors.value.description) errors.value.description = ''
  })

  watch(() => form.value.endDate, () => {
    if (errors.value.endDate) errors.value.endDate = ''
  })

  watch(() => form.value.actions, () => {
    if (errors.value.actions && hasFilledAction(form.value.actions)) {
      errors.value.actions = ''
    }
  }, { deep: true })

  watch(() => form.value.frequency, () => {
    if (errors.value.frequency) errors.value.frequency = ''
  })

  watch(() => form.value.duration, () => {
    if (errors.value.duration) errors.value.duration = ''
  })

  watch(() => form.value.customDuration, () => {
    if (errors.value.duration && form.value.customDuration) {
      errors.value.duration = ''
    }
  })

  function applyRestartDraft(draft) {
    if (!draft) return

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
    }
    if (draft.endDate) form.value.endDate = draft.endDate
    form.value.actions = resolveActionsFromDraft(draft)
    if (draft.lastHabitPrivacy) {
      lastHabitState.value.privacy = draft.lastHabitPrivacy
    }

    lastHabitState.value = snapshotHabitState(form.value)
    lastResultState.value = snapshotResultState(form.value)
  }

  function initFromRestartDraft() {
    applyRestartDraft(loadRestartDraft())
  }

  function selectChallengeType(type) {
    if (form.value.challengeType === type) return

    if (form.value.challengeType === CHALLENGE_TYPES.HABIT) {
      lastHabitState.value = snapshotHabitState(form.value)
    } else {
      lastResultState.value = snapshotResultState(form.value)
    }

    form.value.challengeType = type

    if (type === CHALLENGE_TYPES.HABIT) {
      const saved = lastHabitState.value
      form.value.duration = saved.duration || '21'
      form.value.customDuration = saved.customDuration || ''
      form.value.frequency = saved.frequency || 'daily'
      form.value.privacy = saved.privacy || 'private'
      form.value.allowComments = saved.allowComments !== false
      form.value.startOption = saved.startOption || 'today'
      form.value.startDate = saved.startDate || ''
    } else {
      const saved = lastResultState.value
      form.value.frequency = ''
      form.value.privacy = saved.privacy || 'private'
      form.value.allowComments = saved.allowComments !== false
      form.value.difficulty = saved.difficulty || 'medium'
      form.value.endDate = saved.endDate || ''
      form.value.reward = saved.reward || ''
      form.value.actions = normalizeActionTree(saved.actions)
      form.value.duration = '30'
      form.value.startOption = 'today'
    }

    if (form.value.duration !== 'custom') {
      form.value.customDuration = ''
    }
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
      if (!hasFilledAction(form.value.actions)) {
        validationErrors.actions = t('challenges.validation.milestoneRequired')
      }
    }

    errors.value = { ...createEmptyErrors(), ...validationErrors }
    return Object.keys(validationErrors).length === 0
  }

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
    if (form.value.startDate) return form.value.startDate
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
    if (!Number.isFinite(duration) || duration < 1) return ''
    return toDateInputValue(addDays(startDate, duration - 1))
  }

  function getSubmissionEndDate() {
    if (form.value.challengeType === CHALLENGE_TYPES.RESULT && form.value.endDate) {
      return form.value.endDate
    }
    return calculateEndDate()
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

    if (form.value.imageUrl) payload.imageUrl = form.value.imageUrl

    if (form.value.challengeType === CHALLENGE_TYPES.HABIT) {
      payload.frequency = form.value.frequency
    }

    if (form.value.challengeType === CHALLENGE_TYPES.RESULT) {
      payload.actions = normalizeActionsForPayload(form.value.actions)
      payload.difficulty = form.value.difficulty
      if (form.value.reward?.trim()) {
        payload.reward = form.value.reward.trim()
      }
    }

    return payload
  }

  async function deleteRestartedChallengeIfNeeded() {
    const restartedChallengeId = getRestartedChallengeId()
    if (!restartedChallengeId) return
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
    if ('vibrate' in navigator) navigator.vibrate(pattern)
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

  function clearError() {
    errorMessage.value = ''
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

    const userId = userStore.userId
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
    form.value = createDefaultForm()
    showImageUpload.value = false
    createdChallengeId.value = ''
    errorMessage.value = ''
    errors.value = createEmptyErrors()
    validationToastOpen.value = false
    lastHabitState.value = snapshotHabitState(form.value)
    lastResultState.value = snapshotResultState(form.value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return {
    form,
    errors,
    showImageUpload,
    showSuccessModal,
    createdChallengeId,
    loading,
    errorMessage,
    validationToastOpen,
    isHabit,
    createButtonText,
    isFormValid,
    initFromRestartDraft,
    selectChallengeType,
    handleSubmit,
    resetForm,
    clearError
  }
}
