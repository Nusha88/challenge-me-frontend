import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { campaignService, challengeService } from '../services/api'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { useDemoMissions } from './useDemoMissions'
import { DEMO_USER_ID } from '../constants/demo'
import { fireConfetti } from '../utils/confetti'
import { toDateInputValue, addDays, getInclusiveDaysBetween } from '../utils/dateUtils'
import { useRestartChallengeDraft } from './useRestartChallengeDraft'
import { useXpAwardFeedback } from './useXpAwardFeedback'
import { CHALLENGE_TYPES } from '../constants/challengeTypes'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { clearMyMissionsListCache } from './useMyMissionsListCache'
import {
  EXTRA_SLOT_COST,
  isExtraCampaignSlot,
  extraSlotUnlocked
} from '../utils/campaigns'

const VALIDATION_FIELD_ORDER = ['title', 'description', 'actions', 'endDate', 'duration', 'frequency']

function campaignContextFromQuery(query) {
  const campaignId = typeof query?.campaignId === 'string' ? query.campaignId.trim() : ''
  const slot = query?.slot
  if (!campaignId || (slot !== 'shared' && slot !== 'personal')) return null
  return { id: campaignId, slot, campaign: null }
}

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
    communityQuest: false,
    inviteUserIds: [],
    templateId: ''
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
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const userStore = useUserStore()
  const demoStore = useDemoStore()
  const { createMission: createDemoMission } = useDemoMissions()
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
  const campaignContext = ref(campaignContextFromQuery(route.query))

  const lastHabitState = ref(snapshotHabitState(form.value))
  const lastResultState = ref(snapshotResultState(form.value))

  const isHabit = computed(() => form.value.challengeType === CHALLENGE_TYPES.HABIT)

  const isPaidExtraSlot = computed(() => {
    const ctx = campaignContext.value
    if (!ctx?.campaign) return false
    return isExtraCampaignSlot(ctx.campaign, ctx.slot)
  })

  const extraSlotBlocked = computed(() => {
    const ctx = campaignContext.value
    if (!isPaidExtraSlot.value || !ctx?.campaign) return false
    if (extraSlotUnlocked(ctx.campaign, ctx.slot)) return false
    return userStore.userSparks < EXTRA_SLOT_COST
  })

  const createButtonText = computed(() => {
    if (campaignContext.value?.slot === 'shared') {
      return isPaidExtraSlot.value
        ? t('campaigns.addExtraShared', { cost: EXTRA_SLOT_COST })
        : t('campaigns.addShared')
    }
    if (campaignContext.value?.slot === 'personal') {
      return isPaidExtraSlot.value
        ? t('campaigns.addExtraPersonal', { cost: EXTRA_SLOT_COST })
        : t('campaigns.addPersonal')
    }
    return form.value.challengeType === CHALLENGE_TYPES.RESULT
      ? t('challenges.createResult')
      : t('challenges.createHabit')
  })

  const isFormValid = computed(() => {
    if (campaignContext.value && !campaignContext.value.campaign) return false
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

  const normalizedPrivacy = computed(() => {
    if (form.value.privacy === 'solo' || form.value.privacy === 'squad') return 'private'
    return form.value.privacy
  })

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
    if (draft.templateId) form.value.templateId = draft.templateId
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

  function applySquadPrivacyFromQuery() {
    if (route.query.privacy !== 'squad') return
    if (form.value.challengeType !== CHALLENGE_TYPES.HABIT) return
    form.value.privacy = 'squad'
    lastHabitState.value = snapshotHabitState(form.value)
  }

  function applyCampaignDates(campaign) {
    const start = toDateInputValue(campaign.startDate)
    const end = toDateInputValue(campaign.endDate)
    const days = getInclusiveDaysBetween(campaign.startDate, campaign.endDate)
    form.value.startDate = start
    form.value.endDate = end
    form.value.startOption = 'today'
    if (days === 7 || days === 21) {
      form.value.duration = String(days)
      form.value.customDuration = ''
    } else {
      form.value.duration = 'custom'
      form.value.customDuration = String(days || 14)
    }
  }

  function applyCampaignSlotDefaults(slot) {
    if (slot === 'shared') {
      form.value.challengeType = CHALLENGE_TYPES.HABIT
      form.value.privacy = 'squad'
      form.value.allowComments = true
      form.value.inviteUserIds = []
      return
    }
    form.value.challengeType = CHALLENGE_TYPES.RESULT
    form.value.privacy = 'private'
  }

  if (campaignContext.value) {
    applyCampaignSlotDefaults(campaignContext.value.slot)
  }

  async function applyCampaignSlotFromQuery() {
    const next = campaignContextFromQuery(route.query)
    if (!next) {
      campaignContext.value = null
      return
    }

    campaignContext.value = next
    applyCampaignSlotDefaults(next.slot)

    const { data } = await campaignService.getCampaign(next.id)
    const campaign = data?.campaign
    if (!campaign) return

    campaignContext.value = { ...next, campaign }
    applyCampaignDates(campaign)
    lastHabitState.value = snapshotHabitState(form.value)
    lastResultState.value = snapshotResultState(form.value)
  }

  async function initFromRestartDraft() {
    applyRestartDraft(loadRestartDraft())
    applySquadPrivacyFromQuery()
    await applyCampaignSlotFromQuery()
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
      form.value.templateId = ''
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
      allowComments: form.value.privacy === 'squad' ? true : form.value.allowComments,
      communityQuest: form.value.communityQuest
    }

    if (form.value.imageUrl) payload.imageUrl = form.value.imageUrl
    if (form.value.templateId) payload.templateId = form.value.templateId

    if (form.value.challengeType === CHALLENGE_TYPES.HABIT) {
      payload.frequency = form.value.frequency
      if (form.value.privacy === 'squad') {
        payload.inviteOnly = true
        payload.inviteUserIds = Array.isArray(form.value.inviteUserIds)
          ? form.value.inviteUserIds
          : []
      }
    }

    if (form.value.challengeType === CHALLENGE_TYPES.RESULT) {
      payload.actions = normalizeActionsForPayload(form.value.actions)
      payload.difficulty = form.value.difficulty
      if (form.value.reward?.trim()) {
        payload.reward = form.value.reward.trim()
      }
    }

    if (campaignContext.value) {
      payload.campaignId = campaignContext.value.id
      payload.campaignRole = campaignContext.value.slot === 'shared' ? 'shared' : 'personalTemplate'
      payload.startDate = toDateInputValue(campaignContext.value.campaign.startDate)
      payload.endDate = toDateInputValue(campaignContext.value.campaign.endDate)
      if (campaignContext.value.slot === 'shared') {
        payload.inviteOnly = true
        payload.inviteUserIds = []
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
    const sparksSpent = Number(response?.data?.sparksSpent || 0)
    if (sparksSpent > 0) {
      dispatchAppEvent(APP_EVENTS.SPARKS_SPENT, { spent: sparksSpent })
    }
    const challengeId = getCreatedChallengeId(response)
    if (challengeId) {
      createdChallengeId.value = challengeId
      triggerHapticFeedback([100, 50, 100])
      fireConfetti()
    }
    const created = response.data?.challenge || (response.data?._id ? response.data : null)
    clearMyMissionsListCache()
    if (created?._id) {
      dispatchAppEvent(APP_EVENTS.CHALLENGE_UPDATED, {
        challengeId: String(created._id),
        challenge: {
          ...created,
          templateId: created.templateId || form.value.templateId || ''
        }
      })
    }
    if (campaignContext.value?.id) {
      router.push({ name: 'campaign-detail', params: { id: campaignContext.value.id } })
      return
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
    if (error.response?.data?.reason === 'insufficient_sparks') {
      errorMessage.value = t('sparks.rituals.insufficientSparks')
      return
    }
    errorMessage.value = error.response?.data?.message || error.message || t('notifications.createError')
  }

  async function handleSubmit() {
    if (extraSlotBlocked.value) {
      errorMessage.value = t('sparks.rituals.insufficientSparks')
      return
    }
    if (!validate()) {
      validationToastOpen.value = true
      await scrollToFirstValidationError()
      return
    }

    const userId = userStore.userId || (demoStore.isDemoMode ? DEMO_USER_ID : null)
    if (!userId) {
      errorMessage.value = t('challenges.mustBeLoggedIn')
      return
    }

    loading.value = true
    errorMessage.value = ''

    try {
      const payload = buildChallengePayload(userId)
      if (demoStore.isDemoMode) {
        demoStore.startDemo()
        const mission = createDemoMission(payload)
        await handleCreateSuccess({ data: { challenge: mission, _id: mission._id } })
        return
      }
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
    campaignContext,
    createButtonText,
    isFormValid,
    extraSlotBlocked,
    initFromRestartDraft,
    selectChallengeType,
    handleSubmit,
    resetForm,
    clearError
  }
}
