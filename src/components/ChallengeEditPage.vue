<template>
  <div class="challenge-edit-page mission-form dark-mission-theme">
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
          </div>
        </div>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="#4FD1C5" class="mb-4 rounded-pill"></v-progress-linear>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-4 rounded-xl custom-alert"
      >
        {{ errorMessage }}
      </v-alert>

      <v-card v-if="challenge && !loading && !errorMessage" class="main-tactical-card pa-1">
        <v-card-text class="pa-6">
          <v-form @submit.prevent="handleSubmit">

            <div class="mission-dates-grid mb-8">
              <div class="date-info-box date-info-box--editable">
                <span class="label mb-3">{{ t('challenges.startDate') }}</span>
                <v-btn
                  variant="outlined"
                  class="mission-date-btn"
                  :disabled="isDisabled"
                  @click="showStartDatePicker = true"
                >
                  <v-icon size="18" class="mr-2">mdi-calendar-month-outline</v-icon>
                  <span>{{ formatDateForLocale(editForm.startDate, locale) }}</span>
                </v-btn>

                <v-dialog v-model="showStartDatePicker" max-width="400">
                  <v-date-picker
                    v-model="startDatePickerModel"
                    @update:model-value="handleStartDatePick"
                  ></v-date-picker>
                </v-dialog>
              </div>
              <div class="date-divider">
                <v-icon color="rgba(255,255,255,0.1)">mdi-arrow-right-thin</v-icon>
              </div>
              <div
                v-if="challenge.challengeType === CHALLENGE_TYPES.HABIT"
                class="date-info-box date-info-box--editable"
              >
                <span class="label mb-3">{{ t('challenges.endDate') }}</span>
                <v-btn
                  variant="outlined"
                  class="mission-date-btn"
                  :disabled="isDisabled"
                  @click="showEndDatePicker = true"
                >
                  <v-icon size="18" class="mr-2">mdi-calendar-month-outline</v-icon>
                  <span>{{ formatDateForLocale(editForm.endDate, locale) }}</span>
                </v-btn>

                <v-dialog v-model="showEndDatePicker" max-width="400">
                  <v-date-picker
                    v-model="endDatePickerModel"
                    :min="editForm.startDate || undefined"
                    @update:model-value="handleEndDatePick"
                  ></v-date-picker>
                </v-dialog>
              </div>
              <MissionDeadlinePicker
                v-else
                v-model:end-date="editForm.endDate"
                variant="tactical"
                class="date-info-box date-info-box--editable flex-grow-1"
                :min="editForm.startDate || undefined"
                :disabled="isDisabled"
              />
            </div>

            <ChallengeBaseFields
              v-model:title="editForm.title"
              v-model:description="editForm.description"
              v-model:image-url="editForm.imageUrl"
              :challenge-type="challenge.challengeType"
              :title-error="errors.title"
              :description-error="errors.description"
              hide-title
              editable
              compact
              :show-image-toggle="false"
              :disabled="isDisabled"
            />

            <div class="settings-tactical-grid mb-8">
              <div class="setting-item">
                <PrivacySelector
                  v-model:privacy="editForm.privacy"
                  variant="compact"
                  :disabled="isDisabled"
                  :menu-props="tacticalSelectMenuProps"
                />
              </div>

              <div v-if="challenge.challengeType === CHALLENGE_TYPES.HABIT" class="setting-item">
                <span class="setting-label">{{ t('challenges.frequency') }}</span>
                <v-select
                  v-model="editForm.frequency"
                  :items="frequencyOptions"
                  variant="plain"
                  class="tactical-select"
                  hide-details
                  :disabled="isDisabled"
                  :menu-props="tacticalSelectMenuProps"
                ></v-select>
              </div>
            </div>

            <DurationSelector
              v-if="challenge.challengeType === CHALLENGE_TYPES.HABIT"
              v-model:duration="editForm.duration"
              v-model:custom-duration="editForm.customDuration"
              :duration-error="errors.duration"
              :disabled="isDisabled"
              class="mb-8"
            />

            <div v-if="challenge.challengeType === CHALLENGE_TYPES.RESULT" class="actions-plan-section mb-8">
              <div class="section-tag mb-4">{{ t('challenges.actionsPlan') }}</div>
              <div class="actions-glass-wrapper pa-2">
                <ChallengeActions v-model="editForm.actions" :readonly="isDisabled" />
              </div>
            </div>

            <DifficultySelector
              v-if="challenge.challengeType === CHALLENGE_TYPES.RESULT"
              v-model:difficulty="editForm.difficulty"
              :disabled="isDisabled"
              class="mb-8"
            />

            <div v-if="challenge.challengeType === CHALLENGE_TYPES.RESULT" class="reward-edit-section mb-8">
              <div class="section-tag mb-2">{{ t('challenges.rewardTitle') }}</div>
              <v-text-field
                v-model="editForm.reward"
                variant="outlined"
                density="comfortable"
                color="#4FD1C5"
                :placeholder="t('challenges.rewardPlaceholder')"
                :disabled="isDisabled"
                hide-details
                class="description-input-active reward-edit-field"
              />
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

              <v-alert
                v-if="saveError"
                type="error"
                variant="tonal"
                class="mb-4 rounded-xl custom-alert"
              >
                {{ saveError }}
              </v-alert>

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
            </div>
          </v-form>
        </v-card-text>
      </v-card>

      <DeleteChallengeDialog
        v-model="deleteConfirmDialog"
        :loading="deleteLoading"
        :error="deleteError"
        @confirm="confirmDelete"
      />
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

/* Ограничиваем ширину контента и центрируем страницу редактирования */
.challenge-edit-page :deep(.v-container) {
  max-width: 960px;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
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

.description-input-active :deep(.v-field) {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
}

.description-input-active :deep(.v-field__input),
.description-input-active :deep(textarea) {
  color: #ffffff !important;
  caret-color: #4fd1c5;
}

/* Match .description-display-box border when idle (not focused) — avoids default black outline */
.description-input-active :deep(.v-field--variant-outlined .v-field__outline) {
  --v-field-border-opacity: 1;
  color: rgba(255, 255, 255, 0.08) !important;
}

.description-input-active :deep(.v-field--focused.v-field--variant-outlined .v-field__outline) {
  color: rgba(79, 209, 197, 0.45) !important;
}

.reward-edit-field :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}

/* --- ФУТЕР --- */
.mission-footer-actions {
  margin-top: 40px;
  margin-bottom: 40px;
  padding-top: 24px;
  padding-bottom: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
}

.footer-btn {
  border-radius: 12px !important;
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.glass-container {
  background: rgba(255, 255, 255, 0.01);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.actions-glass-wrapper {
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

  .description-display-box {
    padding: 12px;
    min-height: 80px;
    font-size: 0.9rem;
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

  .footer-btn {
    width: 100%;
    justify-content: center;
  }

  .glass-container {
    padding: 12px;
    border-radius: 12px;
  }

  .actions-glass-wrapper {
    padding: 10px;
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
@media (max-width: 440px) {
  .challenge-edit-page :deep(.v-container) {
    max-width: 440px;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }

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

  .description-display-box {
    padding: 10px;
    min-height: 70px;
    font-size: 0.85rem;
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

@media (max-width: 600px) {
  .mission-footer-actions {
    flex-direction: column; /* Смена порядка: Сохранить в топе */
    align-items: stretch;
    gap: 12px;
  }

  .action-buttons-group {
    flex-direction: column;
    order: 1; /* Группа сохранения сверху */
  }
}

.custom-alert {
  background: rgba(255, 82, 82, 0.1) !important;
  border: 1px solid rgba(255, 82, 82, 0.2) !important;
}
</style>

<style>
/* Teleported v-select menus — unscoped so contentClass applies to overlay */
.challenge-edit-select-menu.v-overlay__content,
.challenge-edit-select-menu {
  background: #131A2D !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55) !important;
}

.challenge-edit-select-menu .v-list {
  background: #131A2D !important;
  padding: 6px 0 !important;
}

.challenge-edit-select-menu .v-list-item {
  background: transparent !important;
}

.challenge-edit-select-menu .v-list-item__overlay {
  background: transparent !important;
}

.challenge-edit-select-menu .v-list-item-title {
  color: rgba(255, 255, 255, 0.95) !important;
}

.challenge-edit-select-menu .v-list-item--active .v-list-item-title {
  color: #4fd1c5 !important;
}

.challenge-edit-select-menu .v-list-item:hover {
  background: rgba(79, 209, 197, 0.12) !important;
}

.challenge-edit-select-menu .v-list-item--active {
  background: rgba(79, 209, 197, 0.15) !important;
}
</style>

<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'
import {useUserStore} from '../stores/user'
import ChallengeActions from './ChallengeActions.vue'
import ChallengeBaseFields from './challenge-form/ChallengeBaseFields.vue'
import DurationSelector from './challenge-form/DurationSelector.vue'
import MissionDeadlinePicker from './challenge-form/MissionDeadlinePicker.vue'
import PrivacySelector from './challenge-form/PrivacySelector.vue'
import DifficultySelector from './challenge-form/DifficultySelector.vue'
import DeleteChallengeDialog from './challenge-form/DeleteChallengeDialog.vue'
import {challengeService} from '../services/api'
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
import { useXpAwardFeedback } from '../composables/useXpAwardFeedback'

const router = useRouter()
const route = useRoute()
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

// Get current user ID from store
const userStore = useUserStore()
function getCurrentUserId() {
  return userStore.userId
}

const currentUserId = ref(getCurrentUserId())

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
  privacy: 'private',
  difficulty: '',
  reward: '',
  actions: [],
  completedDays: [],
  allowComments: true
})

const errors = reactive({
  title: '',
  description: '',
  duration: '',
  frequency: '',
  endDate: '',
  actions: ''
})

const { t, locale } = useI18n()

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
  syncDurationFromDates()
  showEndDatePicker.value = false
}

watch(
  () => [editForm.duration, editForm.startDate, editForm.customDuration],
  () => {
    if (isInitializing.value) {
      return
    }

    if (challenge.value?.challengeType !== CHALLENGE_TYPES.HABIT) {
      return
    }

    if (!editForm.duration || !editForm.startDate) {
      return
    }

    const newEndDate = calculateEndDateFromDuration(
      editForm.startDate,
      editForm.duration,
      editForm.customDuration
    )

    if (newEndDate) {
      editForm.endDate = newEndDate
    }
  }
)

const frequencyOptions = computed(() => [
  { title: t('challenges.frequencyOptions.daily'), value: 'daily' },
  { title: t('challenges.frequencyOptions.everyOtherDay'), value: 'everyOtherDay' }
])

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
    router.push('/missions/my')
  } catch (err) {
    deleteError.value = err?.response?.data?.message || t('challenges.deleteChallengeError')
  } finally {
    deleteLoading.value = false
  }
}

const isDisabled = computed(() => {
  return challenge.value ? isChallengeFinished(challenge.value) : false
})

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

// Check if completedDays changed and update participant entry if needed
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
      console.error('Error updating participant completed days:', error)
      // Don't fail the whole save if this fails
    }
  }
}

async function handleSubmit() {
  if (!validate()) return

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
    router.back() // Navigate to previous page after successful save
  } catch (error) {
    saveError.value = error.response?.data?.message || t('notifications.updateError')
  } finally {
    saveLoading.value = false
  }
}

function validate() {
  clearErrors()

  if (!editForm.title?.trim()) {
    errors.title = t('challenges.validation.titleRequired')
  }

  if (!editForm.description?.trim()) {
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

watch(
  () => editForm.endDate,
  (newVal, oldVal) => {
    if (isInitializing.value || challenge.value?.challengeType !== CHALLENGE_TYPES.RESULT) {
      return
    }

    if (newVal && newVal !== oldVal) {
      syncDurationFromDates()
    }
  }
)

onMounted(async () => {
  await loadChallenge()
})
</script>




