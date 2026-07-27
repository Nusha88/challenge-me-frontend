import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { challengeService } from '../services/api'
import {
  getInclusiveDaysBetween,
  getDurationDaysString,
  calculateEndDateFromDuration,
  formatDateForLocale,
  normalizeDateInputValue,
  normalizeDateList
} from '../utils/dateUtils'
import { applyDurationFieldsFromDayCount } from '../utils/durationUtils'
import { isChallengeFinished } from '../utils/challengeStatus'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { useXpAwardFeedback } from './useXpAwardFeedback'

const VALIDATION_FIELD_ORDER = ['title', 'description', 'actions', 'endDate', 'duration', 'frequency']

function createEmptyErrors() {
  return {
    title: '',
    description: '',
    duration: '',
    frequency: '',
    endDate: '',
    actions: ''
  }
}

export function useChallengeEditForm() {
  const router = useRouter()
  const route = useRoute()
  const { t, locale } = useI18n()
  const userStore = useUserStore()
  const { applyXpAwardResponse } = useXpAwardFeedback()

  const tacticalSelectMenuProps = {
    contentClass: 'challenge-edit-select-menu'
  }

  const showStartDatePicker = ref(false)
  const showEndDatePicker = ref(false)
  const startDatePickerModel = ref('')
  const endDatePickerModel = ref('')

  const challenge = ref(null)
  const loading = ref(true)
  const errorMessage = ref('')
  const saveLoading = ref(false)
  const saveError = ref('')
  const deleteLoading = ref(false)
  const deleteConfirmDialog = ref(false)
  const deleteError = ref('')
  const isInitializing = ref(true)
  const isEditingTitle = ref(false)
  const validationToastOpen = ref(false)

  const currentUserId = computed(() => userStore.userId)
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
    privacy: 'private',
    difficulty: '',
    reward: '',
    actions: [],
    completedDays: [],
    allowComments: true
  })

  const errors = reactive(createEmptyErrors())

  const challengeTypeLabel = computed(() => {
    if (!challenge.value?.challengeType) return ''
    return challenge.value.challengeType === CHALLENGE_TYPES.HABIT
      ? t('challenges.typeHabit')
      : t('challenges.typeResult')
  })

  const challengeTypeColor = computed(() => {
    if (!challenge.value?.challengeType) return 'secondary'
    return challenge.value.challengeType === CHALLENGE_TYPES.HABIT ? '#7048E8' : '#4FD1C5'
  })

  const isHabit = computed(() => challenge.value?.challengeType === CHALLENGE_TYPES.HABIT)
  const isResult = computed(() => challenge.value?.challengeType === CHALLENGE_TYPES.RESULT)

  const isDisabled = computed(() =>
    challenge.value ? isChallengeFinished(challenge.value) : false
  )

  const frequencyOptions = computed(() => [
    { title: t('challenges.frequencyOptions.daily'), value: 'daily' },
    { title: t('challenges.frequencyOptions.everyOtherDay'), value: 'everyOtherDay' }
  ])

  function setLoadError(message) {
    errorMessage.value = message
  }

  function handleLoadError(error) {
    setLoadError(error.response?.data?.message || t('notifications.apiError'))
  }

  function isCurrentUserOwner(challengeData) {
    const ownerId = challengeData?.owner?._id || challengeData?.owner
    return Boolean(
      ownerId
      && currentUserId.value
      && ownerId.toString() === currentUserId.value.toString()
    )
  }

  function clearErrors() {
    Object.assign(errors, createEmptyErrors())
  }

  function initializeActions(challengeData) {
    if (challengeData.challengeType === CHALLENGE_TYPES.RESULT) {
      editForm.actions = challengeData.actions?.length > 0
        ? challengeData.actions.map((action) => ({
            _id: action._id,
            text: action.text || '',
            checked: Boolean(action.checked),
            children: Array.isArray(action.children)
              ? action.children.map((child) => ({
                  _id: child._id,
                  text: child.text || '',
                  checked: Boolean(child.checked)
                }))
              : []
          }))
        : [{ text: '', checked: false, children: [] }]
      return
    }

    editForm.actions = []
  }

  function initializeCompletedDays(challengeData) {
    if (challengeData.challengeType !== CHALLENGE_TYPES.HABIT) {
      editForm.completedDays = []
      originalCompletedDays.value = []
      return
    }

    let ownerCompletedDays = []

    if (challengeData.participants && currentUserId.value) {
      const ownerParticipant = challengeData.participants.find((participant) => {
        const userId = participant.userId?._id || participant.userId || participant._id
        return userId && userId.toString() === currentUserId.value.toString()
      })

      if (ownerParticipant?.completedDays && Array.isArray(ownerParticipant.completedDays)) {
        ownerCompletedDays = ownerParticipant.completedDays
      }
    }

    if (ownerCompletedDays.length === 0 && Array.isArray(challengeData.completedDays)) {
      ownerCompletedDays = challengeData.completedDays
    }

    editForm.completedDays = normalizeDateList(ownerCompletedDays)
    originalCompletedDays.value = [...editForm.completedDays]
  }

  function initializeEditForm(challengeData) {
    isInitializing.value = true

    editForm.title = challengeData.title || ''
    editForm.description = challengeData.description || ''
    editForm.startDate = normalizeDateInputValue(challengeData.startDate)
    editForm.endDate = normalizeDateInputValue(challengeData.endDate)
    startDatePickerModel.value = editForm.startDate
    endDatePickerModel.value = editForm.endDate
    editForm.imageUrl = challengeData.imageUrl || ''
    editForm.frequency = challengeData.frequency || ''
    editForm.privacy = challengeData.privacy === 'public' ? 'public' : 'private'
    editForm.allowComments = challengeData.allowComments !== undefined ? challengeData.allowComments : true
    editForm.difficulty = challengeData.difficulty || (challengeData.challengeType === CHALLENGE_TYPES.RESULT ? 'medium' : '')
    editForm.reward = challengeData.reward != null ? String(challengeData.reward) : ''

    initializeActions(challengeData)
    initializeCompletedDays(challengeData)

    const dayCount = parseInt(getDurationDaysString(editForm.startDate, editForm.endDate), 10)
    applyDurationFieldsFromDayCount(dayCount, editForm)

    isInitializing.value = false
  }

  async function loadChallenge() {
    const challengeId = route.params.id

    if (!challengeId) {
      setLoadError(t('challenges.notFound'))
      loading.value = false
      return
    }

    loading.value = true
    errorMessage.value = ''

    try {
      const { data } = await challengeService.getChallenge(challengeId)

      if (!isCurrentUserOwner(data)) {
        setLoadError(t('challenges.notAuthorized'))
        return
      }

      challenge.value = data
      initializeEditForm(data)
      clearErrors()
    } catch (error) {
      handleLoadError(error)
    } finally {
      loading.value = false
    }
  }

  function syncDurationFromDates() {
    if (!editForm.startDate || !editForm.endDate) return

    if (getInclusiveDaysBetween(editForm.startDate, editForm.endDate) < 1) {
      editForm.endDate = editForm.startDate
      return
    }

    const daysStr = getDurationDaysString(editForm.startDate, editForm.endDate)
    const d = parseInt(daysStr, 10)
    if (Number.isNaN(d) || d < 1) return
    applyDurationFieldsFromDayCount(d, editForm)
  }

  function handleStartDatePick(value) {
    if (isDisabled.value) return
    const picked = normalizeDateInputValue(value)
    if (!picked) return
    editForm.startDate = picked
    startDatePickerModel.value = picked

    if (challenge.value?.challengeType === CHALLENGE_TYPES.RESULT) {
      syncDurationFromDates()
    }

    showStartDatePicker.value = false
  }

  function handleEndDatePick(value) {
    if (isDisabled.value) return
    const picked = normalizeDateInputValue(value)
    if (!picked) return
    editForm.endDate = picked
    endDatePickerModel.value = picked
    syncDurationFromDates()
    showEndDatePicker.value = false
  }

  function navigateAway() {
    const from = route.query.from
    if (typeof from === 'string' && from.startsWith('/')) {
      router.push(from)
      return
    }
    router.push('/missions/my')
  }

  function goBack() {
    navigateAway()
  }

  function handleDelete() {
    deleteError.value = ''
    deleteConfirmDialog.value = true
  }

  async function confirmDelete() {
    if (!challenge.value?._id) return

    deleteLoading.value = true
    deleteError.value = ''

    try {
      await challengeService.deleteChallenge(challenge.value._id)
      deleteConfirmDialog.value = false
      navigateAway()
    } catch (err) {
      deleteError.value = err?.response?.data?.message || t('challenges.deleteChallengeError')
    } finally {
      deleteLoading.value = false
    }
  }

  function normalizeActions(actions) {
    if (!Array.isArray(actions)) {
      return []
    }

    return actions.map((action) => ({
      ...(action._id ? { _id: action._id } : {}),
      text: (action.text || '').trim(),
      checked: Boolean(action.checked),
      children: Array.isArray(action.children)
        ? action.children.map((child) => ({
            ...(child._id ? { _id: child._id } : {}),
            text: (child.text || '').trim(),
            checked: Boolean(child.checked)
          }))
        : []
    }))
  }

  function buildUpdatePayload() {
    const challengeType = challenge.value?.challengeType

    const payload = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      imageUrl: editForm.imageUrl,
      privacy: editForm.privacy === 'public' ? 'public' : 'private',
      allowComments: editForm.allowComments,
      challengeType
    }

    if (challengeType === CHALLENGE_TYPES.HABIT) {
      payload.frequency = editForm.frequency
      payload.completedDays = normalizeDateList(editForm.completedDays)
    }

    if (challengeType === CHALLENGE_TYPES.RESULT) {
      payload.completedDays = []
      payload.actions = normalizeActions(editForm.actions)
      payload.difficulty = editForm.difficulty || challenge.value?.difficulty || 'medium'
      payload.reward = editForm.reward?.trim() || ''
    }

    return payload
  }

  async function updateParticipantCompletedDaysIfChanged(challengeId, challengeType, currentCompletedDays) {
    if (challengeType !== CHALLENGE_TYPES.HABIT || !currentUserId.value) {
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
        applyXpAwardResponse(response)
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error updating participant completed days:', error)
        }
      }
    }
  }

  function validate() {
    clearErrors()

    if (!editForm.title?.trim()) {
      errors.title = t('challenges.validation.titleRequired')
    }

    if (challenge.value?.challengeType === CHALLENGE_TYPES.RESULT && !editForm.description?.trim()) {
      errors.description = t('challenges.validation.descriptionRequired')
    }

    if (challenge.value?.challengeType === CHALLENGE_TYPES.HABIT) {
      if (!editForm.duration) {
        errors.duration = t('challenges.validation.durationRequired')
      } else if (editForm.duration === 'custom' && Number(editForm.customDuration) < 1) {
        errors.duration = t('challenges.validation.customDurationRequired')
      }

      if (!editForm.frequency) {
        errors.frequency = t('challenges.validation.frequencyRequired')
      }
    }

    if (challenge.value?.challengeType === CHALLENGE_TYPES.RESULT) {
      if (!editForm.endDate) {
        errors.endDate = t('challenges.validation.endDateRequired')
      }

      const hasAction = editForm.actions?.some((action) => action.text?.trim())
      if (!hasAction) {
        errors.actions = t('challenges.validation.milestoneRequired')
      }
    }

    return !errors.title
      && !errors.description
      && !errors.duration
      && !errors.frequency
      && !errors.endDate
      && !errors.actions
  }

  async function scrollToFirstValidationError() {
    await nextTick()
    for (const field of VALIDATION_FIELD_ORDER) {
      if (!errors[field]) continue
      const target = document.querySelector(`[data-validation-field="${field}"]`)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
  }

  async function handleSubmit() {
    if (isDisabled.value) return

    if (!validate()) {
      validationToastOpen.value = true
      await scrollToFirstValidationError()
      return
    }

    const payload = buildUpdatePayload()

    saveLoading.value = true
    saveError.value = ''
    try {
      const response = await challengeService.updateChallenge(challenge.value._id, payload)
      applyXpAwardResponse(response)

      await updateParticipantCompletedDaysIfChanged(
        challenge.value._id,
        payload.challengeType,
        payload.completedDays
      )
      navigateAway()
    } catch (error) {
      saveError.value = error.response?.data?.message || t('notifications.updateError')
    } finally {
      saveLoading.value = false
    }
  }

  watch(
    () => [editForm.duration, editForm.startDate, editForm.customDuration],
    () => {
      if (isInitializing.value) return
      if (challenge.value?.challengeType !== CHALLENGE_TYPES.HABIT) return
      if (!editForm.duration || !editForm.startDate) return

      const newEndDate = calculateEndDateFromDuration(
        editForm.startDate,
        editForm.duration,
        editForm.customDuration
      )

      if (newEndDate) {
        editForm.endDate = newEndDate
        endDatePickerModel.value = newEndDate
      }
    }
  )

  watch(() => editForm.duration, () => {
    if (errors.duration) errors.duration = ''
  })

  watch(() => editForm.customDuration, () => {
    if (errors.duration && editForm.customDuration) errors.duration = ''
  })

  watch(() => editForm.title, () => {
    if (errors.title) errors.title = ''
  })

  watch(() => editForm.description, () => {
    if (errors.description) errors.description = ''
  })

  watch(
    () => editForm.endDate,
    (newVal, oldVal) => {
      if (errors.endDate) errors.endDate = ''
      if (isInitializing.value || challenge.value?.challengeType !== CHALLENGE_TYPES.RESULT) return
      if (newVal && newVal !== oldVal) syncDurationFromDates()
    }
  )

  watch(() => editForm.frequency, () => {
    if (errors.frequency) errors.frequency = ''
  })

  watch(
    () => editForm.actions,
    () => {
      if (errors.actions && editForm.actions?.some((action) => action.text?.trim())) {
        errors.actions = ''
      }
    },
    { deep: true }
  )

  onMounted(async () => {
    await loadChallenge()
  })

  return {
    CHALLENGE_TYPES,
    locale,
    formatDateForLocale,
    tacticalSelectMenuProps,
    showStartDatePicker,
    showEndDatePicker,
    startDatePickerModel,
    endDatePickerModel,
    challenge,
    loading,
    errorMessage,
    saveLoading,
    saveError,
    deleteLoading,
    deleteConfirmDialog,
    deleteError,
    isEditingTitle,
    validationToastOpen,
    editForm,
    errors,
    challengeTypeLabel,
    challengeTypeColor,
    isHabit,
    isResult,
    isDisabled,
    frequencyOptions,
    handleStartDatePick,
    handleEndDatePick,
    goBack,
    handleDelete,
    confirmDelete,
    handleSubmit
  }
}
