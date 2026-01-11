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
        <v-spacer></v-spacer>
        <div class="header-badges">
        <v-chip
          v-if="challenge?.challengeType"
          :color="challengeTypeColor"
          size="small"
            class="ml-2"
        >
          {{ challengeTypeLabel }}
        </v-chip>
        <v-icon
          v-if="challenge?.privacy === 'private'"
          color="grey-darken-1"
            size="20"
            class="ml-2 privacy-icon"
        >
          mdi-lock
        </v-icon>
        <!-- Share Menu -->
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              variant="text"
              size="small"
              v-bind="menuProps"
              class="ml-2 share-btn"
              prepend-icon="mdi-share-variant"
            >
              {{ t('challenges.share.share') }}</v-btn>
          </template>
          <v-list>
            <v-list-item @click="copyLink">
              <template #prepend>
                <v-icon>mdi-link</v-icon>
              </template>
              <v-list-item-title>{{ t('challenges.share.copyLink') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="shareToFacebook">
              <template #prepend>
                <v-icon color="#1877F2">mdi-facebook</v-icon>
              </template>
              <v-list-item-title>{{ t('challenges.share.facebook') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="shareToVK">
              <template #prepend>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#4680C2" xmlns="http://www.w3.org/2000/svg" style="margin-right: 31px;">
                  <path d="M12.785 15.586s.336-.034.51-.205c.097-.097.093-.252.093-.252s-.007-1.32.58-1.513c.592-.193 1.35.95 2.154 1.37.595.31 1.05.242 1.05.242l2.145-.031s1.12-.07.588-.93c-.043-.065-.308-.66-1.583-1.87-1.34-1.27-1.16-1.066.453-3.266.983-1.34 1.377-2.16 1.253-2.51-.116-.33-.83-.243-.83-.243l-2.126.013s-.157-.023-.274.073c-.116.095-.19.314-.19.314s-.34.912-.74 1.688c-.89 1.78-1.246 1.876-1.392 1.766-.338-.256-.254-1.03-.254-1.58 0-1.72.26-2.437-.51-2.62-.256-.062-.444-.103-1.1-.11-.843-.007-1.553.003-1.955.207-.274.138-.486.443-.357.46.16.02.523.096.713.352.246.33.237 1.07.237 1.07s.143 2.11-.333 2.37c-.327.18-.776-.188-1.74-1.88-.492-.87-.864-1.83-.864-1.83s-.07-.17-.195-.262c-.15-.11-.36-.146-.36-.146l-2.03.013s-.305.009-.417.14c-.1.12-.008.37-.008.37s1.58 3.7 3.36 5.57c1.64 1.7 3.51 1.57 3.51 1.57h.85s.255.016.392-.12c.13-.13.126-.3.126-.3v-2.48s-.007-.21.15-.34c.154-.13.31-.09.31-.09l2.29.014z"/>
                </svg>
              </template>
              <v-list-item-title>{{ t('challenges.share.vk') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="shareToTelegram">
              <template #prepend>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#0088cc" xmlns="http://www.w3.org/2000/svg" style="margin-right: 31px;">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.45.08-.01.15-.01.22-.01.23.01.33.05.45.12.1.06.13.1.15.17.01.07.01.22-.01.38z"/>
                </svg>
              </template>
              <v-list-item-title>{{ t('challenges.share.telegram') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="shareToInstagramStory">
              <template #prepend>
                <v-icon color="#E4405F">mdi-instagram</v-icon>
              </template>
              <v-list-item-title>{{ t('challenges.share.instagramStory') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        </div>
      </div>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4"></v-progress-linear>

      <v-alert v-if="errorMessage" type="error" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-alert v-if="challenge && isChallengeFinished(challenge) && !loading" type="info" class="mb-4">
        {{ t('challenges.challengeFinished') }}
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
                :class="{ 'disabled': isDisabled }"
                @click="!isDisabled && (isEditingTitle = true)"
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
                :disabled="isDisabled"
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
                  :disabled="isDisabled"
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
                      :editable="!isDisabled"
                      :frequency="editForm.frequency"
                      @update:model-value="handleOwnerCompletedDaysUpdate"
                    />
                  </template>
                  <template v-else>
                    <TeamCalendarView
                      :start-date="editForm.startDate"
                      :end-date="editForm.endDate"
                      :participants="challenge.participants || []"
                      :frequency="editForm.frequency"
                    />
                  </template>
                </v-card-text>
              </v-card>
            </div>

            <ChallengeImageUpload
              v-model="editForm.imageUrl"
              :editable="!isDisabled"
            />

            <div class="description-section mb-4">
              <p 
                v-if="!isEditingDescription"
                ref="descriptionDisplay"
                class="editable-description"
                :class="{ 'disabled': isDisabled }"
                @click="!isDisabled && startEditingDescription()"
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
                :disabled="isDisabled"
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
                    :class="{ 'disabled': isDisabled }"
                    @click="!isDisabled && (isEditingFrequency = true)"
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
                    :disabled="isDisabled"
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
                    :class="{ 'disabled': isDisabled }"
                    @click="!isDisabled && (isEditingPrivacy = true)"
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
                    :disabled="isDisabled"
                    autofocus
                    @blur="isEditingPrivacy = false"
                    @update:model-value="isEditingPrivacy = false"
                  ></v-select>
                </div>

                <div class="editable-field-section">
                  <p 
                    v-if="!isEditingDuration"
                    class="editable-field"
                    :class="{ 'disabled': isDisabled }"
                    @click="!isDisabled && (isEditingDuration = true)"
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
                    :disabled="isDisabled"
                    autofocus
                    @blur="isEditingDuration = false"
                    @update:model-value="isEditingDuration = false"
                  ></v-select>
                </div>
              </div>

              <div class="actions-plan-wrapper">
                <div ref="actionsScrollContainer" class="actions-plan-container">
              <ChallengeActions
                v-model="editForm.actions"
                    :readonly="isDisabled"
                    :hide-add-button="true"
                  />
                </div>
                <div class="actions-plan-footer">
                  <v-btn
                    v-if="!isDisabled"
                    prepend-icon="mdi-plus"
                    variant="outlined"
                    color="primary"
                    class="add-action-btn mt-2"
                    @click="handleAddAction"
                  >
                    {{ t('challenges.addAction') }}
                  </v-btn>
                </div>
              </div>
            </template>

            <!-- Allow Comments Switcher -->
            <div class="mb-4">
              <v-switch
                v-model="editForm.allowComments"
                :label="t('challenges.allowComments')"
                color="primary"
                :disabled="isDisabled"
                hide-details
              ></v-switch>
            </div>

            <!-- Comments Component -->
            <div v-if="editForm.allowComments" class="mb-4">
              <CommentsComponent
                :challenge-id="challenge._id"
                :allow-comments="editForm.allowComments"
                :current-user-id="currentUserId"
                :is-owner="true"
                :is-finished="isDisabled"
                @comment-added="handleCommentAdded"
                @comment-deleted="handleCommentDeleted"
              />
            </div>

            <v-alert v-if="saveError" type="error" class="mb-4">
              {{ saveError }}
            </v-alert>

            <v-card-actions class="buttons-area">
              <template v-if="isDisabled">
                <v-spacer></v-spacer>
                <v-btn 
                  variant="outlined" 
                  @click="goBack" 
                  class="action-button back-button"
                >
                  {{ t('common.back') }}
                </v-btn>
              </template>
              <template v-else>
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
                <div class="button-spacer"></div>
              <v-btn 
                type="submit" 
                variant="flat"
                color="primary" 
                :disabled="saveLoading || deleteLoading || !isFormValid"
                  :loading="saveLoading"
                class="action-button save-button"
              >
                {{ t('challenges.update') }}
              </v-btn>
              </template>
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

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :timeout="3000" color="success">
      {{ snackbarText }}
    </v-snackbar>
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
  router.push('/challenges/my')
}

// Share functionality
const getShareUrl = () => {
  if (!challenge.value?._id) return ''
  return `${window.location.origin}/challenges/${challenge.value._id}`
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

const shareToFacebook = () => {
  const url = encodeURIComponent(getShareUrl())
  const text = encodeURIComponent(getShareText())
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400')
}

const shareToVK = () => {
  const url = encodeURIComponent(getShareUrl())
  const text = encodeURIComponent(getShareText())
  window.open(`https://vk.com/share.php?url=${url}&title=${text}`, '_blank', 'width=600,height=400')
}

const shareToTelegram = () => {
  const url = encodeURIComponent(getShareUrl())
  const text = encodeURIComponent(getShareText())
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'width=600,height=400')
}

const shareToInstagramStory = async () => {
  const url = getShareUrl()
  const text = getShareText()
  
  // Copy link to clipboard first
  try {
    await navigator.clipboard.writeText(`${text}\n\n${url}`)
    snackbarText.value = t('challenges.share.instagramStoryCopied')
    snackbar.value = true
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = `${text}\n\n${url}`
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      snackbarText.value = t('challenges.share.instagramStoryCopied')
      snackbar.value = true
    } catch (e) {
      console.error('Fallback copy failed:', e)
    }
    document.body.removeChild(textArea)
  }
  
  // Try to open Instagram Story camera
  setTimeout(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      // Try to open Instagram Story camera
      // iOS: instagram-stories://share
      // Android: instagram://story-camera
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (isIOS) {
        window.location.href = 'instagram-stories://share'
      } else {
        window.location.href = 'instagram://story-camera'
      }
      // Fallback to regular Instagram app after a delay
      setTimeout(() => {
        window.location.href = 'instagram://'
      }, 500)
    } else {
      // On desktop, open Instagram web
      window.open('https://www.instagram.com/', '_blank')
    }
  }, 100)
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
      await challengeService.updateParticipantCompletedDays(
        challengeId,
        currentUserId.value,
        currentCompletedDaysSorted
      )
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

<style scoped>
.challenge-edit-page {
  min-height: 100vh;
  padding: 8px 0;
}

@media (min-width: 600px) {
  .challenge-edit-page {
  padding: 16px 0;
  }
}

.page-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

@media (min-width: 600px) {
  .page-header {
  gap: 16px;
  }
}

.back-button {
  margin-right: 8px;
}

.header-badges {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  flex: 1;
  min-width: 0;
}

@media (min-width: 600px) {
  .page-title {
    font-size: 2rem;
  }
}

.privacy-icon {
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .privacy-icon {
    size: 24;
  }
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
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
  flex: 0 0 auto;
  word-break: break-word;
}

@media (min-width: 600px) {
  .start-date-text,
  .end-date-text {
    font-size: 0.875rem;
  }
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
  padding: 12px 16px !important;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 600px) {
  .buttons-area {
    padding: 16px 24px !important;
    flex-direction: row;
    gap: 0;
  }
}

.button-spacer {
  width: 16px;
  flex-shrink: 0;
}

.action-button {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  min-width: 100px;
  width: 100%;
  height: 40px;
  padding: 0 24px;
  border-radius: 24px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 600px) {
  .action-button {
    width: auto;
  }
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

.editable-title.disabled,
.editable-description.disabled,
.editable-field.disabled {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: none;
}

.editable-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 44px;
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.87);
  word-break: break-word;
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
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  min-height: 56px;
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
    font-size: 1rem;
    padding: 12px 16px;
    min-height: 60px;
  }
}

@media (min-width: 960px) {
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
  font-size: 0.9375rem;
  line-height: 1.6;
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: rgba(0, 0, 0, 0.87);
}

@media (min-width: 600px) {
  .editable-field {
    font-size: 1rem;
    padding: 12px 16px;
  }
}

.editable-field:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.editable-field strong {
  font-weight: 600;
  margin-right: 8px;
}

.card-content {
  padding: 16px;
}

@media (min-width: 600px) {
  .card-content {
    padding: 24px;
  }
  
  .editable-field {
    font-size: 1rem;
    padding: 12px 16px;
  }
}

.actions-plan-wrapper {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.actions-plan-container {
  height: 100%;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
}

.actions-plan-container :deep(.v-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.actions-plan-container :deep(.v-card-text) {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.actions-plan-footer {
  padding: 12px 0;
  margin-top: 8px;
  }

.actions-plan-footer .add-action-btn {
  border-radius: 8px !important;
}
</style>





