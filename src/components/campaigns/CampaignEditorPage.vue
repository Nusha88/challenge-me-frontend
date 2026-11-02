<template>
  <div class="campaign-editor mission-form">
    <header class="campaign-header">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        class="back-btn"
        :to="{ path: '/missions/my' }"
      />
      <div>
        <p class="campaign-kicker">{{ t('campaigns.kicker') }}</p>
        <h1 class="campaign-title">
          {{ isNew ? t('campaigns.createTitle') : (form.title || t('campaigns.createTitle')) }}
        </h1>
      </div>
    </header>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="#4FD1C5"
      class="mb-4"
    />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-alert
      v-if="justPublished"
      type="success"
      variant="tonal"
      class="mb-4"
    >
      <p class="publish-success-title">{{ t('campaigns.publishSuccessTitle') }}</p>
      <p class="publish-success-copy">
        {{ inviteCount > 0 ? t('campaigns.publishSuccessInvites') : t('campaigns.publishSuccessSolo') }}
      </p>
      <router-link class="publish-success-link" to="/missions/my">
        {{ t('campaigns.goToMissions') }}
      </router-link>
    </v-alert>

    <div v-if="!justPublished && !(isNew && loading)" class="campaign-card">
      <label class="field-label field-label--required">{{ t('challenges.title') }}</label>
      <v-text-field
        v-model="form.title"
        variant="outlined"
        hide-details="auto"
        :disabled="!canEditShell"
        :placeholder="t('campaigns.titlePlaceholder')"
      />

      <label class="field-label">{{ t('challenges.description') }}</label>
      <v-textarea
        v-model="form.description"
        variant="outlined"
        rows="3"
        hide-details="auto"
        :disabled="!canEditShell"
        :placeholder="t('campaigns.descriptionPlaceholder')"
      />

      <p class="field-label">{{ t('challenges.duration') }}</p>
      <v-btn-toggle
        v-model="form.duration"
        mandatory
        class="custom-chips-group"
        :disabled="!canEditShell"
      >
        <v-btn value="7" class="chip-btn">
          <span>{{ t('challenges.durationOptions.7days') }}</span>
        </v-btn>
        <v-btn value="14" class="chip-btn">
          <span>{{ t('challenges.durationOptions.14days') }}</span>
        </v-btn>
        <v-btn value="21" class="chip-btn">
          <v-icon left size="18">mdi-fire</v-icon>
          <span>{{ t('challenges.durationOptions.21days') }}</span>
        </v-btn>
      </v-btn-toggle>

      <div class="start-time-selector">
        <p class="field-label">{{ t('challenges.start') }}</p>
        <div class="start-row">
          <v-btn-toggle
            v-model="form.startOption"
            mandatory
            class="custom-toggle-group"
            :disabled="!canEditShell"
          >
            <v-btn value="today" class="toggle-btn">
              <span>{{ t('challenges.startOptions.today') }}</span>
            </v-btn>
            <v-btn value="tomorrow" class="toggle-btn">
              <span>{{ t('challenges.startOptions.tomorrow') }}</span>
            </v-btn>
          </v-btn-toggle>

          <v-btn
            :class="['calendar-btn', { 'is-active': isCustomDate }]"
            variant="outlined"
            :disabled="!canEditShell"
            @click="showDatePicker = true"
          >
            <v-icon size="20">mdi-calendar-month-outline</v-icon>
            <span v-if="isCustomDate" class="ml-2">{{ formattedStartDate }}</span>
            <span v-else class="ml-2">{{ t('challenges.pickDate') }}</span>
          </v-btn>
        </div>

        <v-dialog v-model="showDatePicker" max-width="400">
          <v-date-picker
            :model-value="form.startDate"
            :min="toDateInputValue(new Date())"
            @update:model-value="handleDatePick"
          />
        </v-dialog>
      </div>

      <SquadInvitePicker
        v-if="canEditShell"
        v-model="form.inviteUserIds"
        :max-count="MAX_CAMPAIGN_GUESTS"
      />
    </div>

    <div v-if="!justPublished && !isNew" class="campaign-slots">
      <div
        class="slot-card"
        :class="{ 'slot-card--link': sharedEditTo }"
        @click="openSlot(sharedEditTo)"
      >
        <div>
          <p class="slot-label">{{ t('campaigns.sharedSlot') }}</p>
          <p class="slot-copy">{{ sharedTitle || t('campaigns.sharedSlotHint') }}</p>
        </div>
        <v-btn
          v-if="canEditShell && !sharedTitle"
          class="app-cta-primary text-none"
          :to="{ path: '/missions/add', query: { campaignId: campaignId, slot: 'shared' } }"
          @click.stop
        >
          {{ t('campaigns.addShared') }}
        </v-btn>
        <div v-else-if="sharedTitle" class="slot-status">
          <v-icon color="#4FD1C5">mdi-check-circle</v-icon>
          <v-icon v-if="sharedEditTo" size="20">mdi-chevron-right</v-icon>
        </div>
      </div>

      <div
        class="slot-card"
        :class="{ 'slot-card--link': personalEditTo }"
        @click="openSlot(personalEditTo)"
      >
        <div>
          <p class="slot-label">{{ t('campaigns.personalSlot') }}</p>
          <p class="slot-copy">{{ personalTitle || t('campaigns.personalSlotHint') }}</p>
        </div>
        <v-btn
          v-if="canEditShell && !personalTitle"
          class="app-cta-primary text-none"
          :to="{ path: '/missions/add', query: { campaignId: campaignId, slot: 'personal' } }"
          @click.stop
        >
          {{ t('campaigns.addPersonal') }}
        </v-btn>
        <div v-else-if="personalTitle" class="slot-status">
          <v-icon color="#4FD1C5">mdi-check-circle</v-icon>
          <v-icon v-if="personalEditTo" size="20">mdi-chevron-right</v-icon>
        </div>
      </div>
    </div>

    <div v-if="!justPublished && !(isNew && loading)" class="campaign-actions">
      <v-btn
        v-if="canEditShell"
        class="app-cta-primary text-none"
        :loading="saving"
        :disabled="!form.title.trim() || saving || deleting"
        @click="saveShell"
      >
        {{ isNew ? t('campaigns.saveDraft') : t('campaigns.saveChanges') }}
      </v-btn>
      <v-btn
        v-if="canEditShell && !isNew"
        variant="outlined"
        color="error"
        class="text-none delete-draft-btn"
        :disabled="saving || publishing || deleting"
        @click="deleteConfirmOpen = true"
      >
        {{ t('campaigns.delete') }}
      </v-btn>
      <div v-if="canPublish" class="publish-block">
        <v-btn
          class="publish-btn text-none"
          :loading="publishing"
          :disabled="publishing || !hasInvites"
          @click="publish"
        >
          {{ t('campaigns.publish') }}
        </v-btn>
        <p class="publish-hint">
          {{ hasInvites ? t('campaigns.publishHint') : t('campaigns.publishNeedsInvite') }}
        </p>
      </div>
      <template v-if="isInvited">
        <v-btn
          class="app-cta-primary text-none"
          :loading="deciding === 'accept'"
          :disabled="Boolean(deciding)"
          @click="decideInvite('accept')"
        >
          {{ t('campaigns.accept') }}
        </v-btn>
        <v-btn
          variant="text"
          class="text-none"
          :loading="deciding === 'reject'"
          :disabled="Boolean(deciding)"
          @click="decideInvite('reject')"
        >
          {{ t('campaigns.reject') }}
        </v-btn>
      </template>
    </div>

    <DeleteChallengeDialog
      v-model="deleteConfirmOpen"
      :loading="deleting"
      :error="deleteError"
      :title="t('campaigns.deleteConfirmTitle')"
      :message="t('campaigns.deleteConfirmMessage')"
      :confirm-label="t('campaigns.delete')"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import SquadInvitePicker from '../challenge-form/SquadInvitePicker.vue'
import DeleteChallengeDialog from '../challenge-form/DeleteChallengeDialog.vue'
import { campaignService } from '../../services/api'
import { clearMyMissionsListCache } from '../../composables/useMyMissionsListCache'
import { useUserStore } from '../../stores/user'
import {
  addDays,
  formatDateForLocale,
  getInclusiveDaysBetween,
  toDateInputValue
} from '../../utils/dateUtils'
import {
  MAX_CAMPAIGN_GUESTS,
  campaignIdOf,
  findOwnedBlockingCampaign,
  hasBothSlots
} from '../../utils/campaigns'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const deleting = ref(false)
const deleteConfirmOpen = ref(false)
const deleteError = ref('')
const deciding = ref('')
const justPublished = ref(false)
const errorMessage = ref('')
const campaign = ref(null)

const form = reactive({
  title: '',
  description: '',
  duration: '14',
  startOption: 'today',
  startDate: toDateInputValue(new Date()),
  inviteUserIds: []
})
const showDatePicker = ref(false)

const isNew = computed(() => route.name === 'campaign-new' || route.params.id === 'new')
const campaignId = computed(() => (isNew.value ? '' : String(route.params.id || '')))
const currentUserId = computed(() => String(userStore.userId || ''))
const isOwner = computed(() => campaignIdOf(campaign.value?.owner) === currentUserId.value)
const canEditShell = computed(() => (
  isNew.value || (campaign.value?.status === 'draft' && isOwner.value)
))
const canPublish = computed(() => campaign.value?.status === 'draft' && hasBothSlots(campaign.value))
const hasInvites = computed(() => form.inviteUserIds.length > 0)
const sharedTitle = computed(() => campaign.value?.sharedChallengeId?.title || '')
const personalTitle = computed(() => campaign.value?.personalTemplate?.title || '')
const campaignEditFrom = computed(() => (
  campaignId.value ? `/missions/campaigns/${campaignId.value}` : ''
))
const sharedEditTo = computed(() => slotEditTo(campaignIdOf(campaign.value?.sharedChallengeId)))
const personalEditTo = computed(() => slotEditTo(
  campaignIdOf(campaign.value?.personalTemplateChallengeId)
  || campaignIdOf(campaign.value?.personalTemplate?.challengeId)
))

function slotEditTo(challengeId) {
  if (!canEditShell.value || !challengeId) return null
  return {
    name: 'edit-challenge',
    params: { id: challengeId },
    query: { from: campaignEditFrom.value }
  }
}

function openSlot(to) {
  if (!to) return
  router.push(to)
}
const inviteCount = computed(() => (campaign.value?.invites || []).length)
const isInvited = computed(() => {
  const userId = currentUserId.value
  if (!userId || !campaign.value) return false
  const invited = (campaign.value.invites || []).some((row) => campaignIdOf(row.userId) === userId)
  const member = (campaign.value.members || []).some((row) => campaignIdOf(row.userId) === userId)
  return invited && !member
})

const isCustomDate = computed(() => {
  if (!form.startDate) return false
  const todayStr = toDateInputValue(new Date())
  const tomorrowStr = toDateInputValue(addDays(new Date(), 1))
  return form.startDate !== todayStr && form.startDate !== tomorrowStr
})

const formattedStartDate = computed(() => formatDateForLocale(form.startDate, locale.value))

function startDateFromOption() {
  if (form.startOption === 'custom' && form.startDate) return form.startDate
  if (form.startOption === 'tomorrow') return toDateInputValue(addDays(new Date(), 1))
  return toDateInputValue(new Date())
}

function handleDatePick(date) {
  if (date) {
    form.startDate = toDateInputValue(date)
    form.startOption = 'custom'
  }
  showDatePicker.value = false
}

watch(
  () => form.startOption,
  (value) => {
    if (value === 'custom') return
    form.startDate = value === 'tomorrow'
      ? toDateInputValue(addDays(new Date(), 1))
      : toDateInputValue(new Date())
  }
)

function buildPayload() {
  const startDate = startDateFromOption()
  const duration = Number(form.duration) || 14
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    startDate,
    endDate: toDateInputValue(addDays(startDate, duration - 1)),
    inviteUserIds: form.inviteUserIds
  }
}

function applyCampaign(next) {
  campaign.value = next
  form.title = next.title || ''
  form.description = next.description || ''
  const days = getInclusiveDaysBetween(next.startDate, next.endDate)
  form.duration = ['7', '14', '21'].includes(String(days)) ? String(days) : '14'
  form.startDate = toDateInputValue(next.startDate)
  const todayStr = toDateInputValue(new Date())
  const tomorrowStr = toDateInputValue(addDays(new Date(), 1))
  if (form.startDate === tomorrowStr) form.startOption = 'tomorrow'
  else if (form.startDate === todayStr) form.startOption = 'today'
  else form.startOption = 'custom'
  form.inviteUserIds = (next.invites || [])
    .map((row) => String(row.userId?._id || row.userId || ''))
    .filter(Boolean)
}

function campaignErrorMessage(error, fallbackKey) {
  if (error.response?.data?.reason === 'campaign_limit') return t('campaigns.limitError')
  return error.response?.data?.message || t(fallbackKey)
}

async function redirectToOwnedBlockingCampaign() {
  const { data } = await campaignService.listCampaigns()
  const existing = findOwnedBlockingCampaign(data?.campaigns || [], currentUserId.value)
  if (existing?._id) {
    await router.replace({ name: 'campaign-detail', params: { id: existing._id } })
    return true
  }
  return false
}

async function loadCampaign() {
  loading.value = true
  errorMessage.value = ''
  try {
    if (isNew.value) {
      await redirectToOwnedBlockingCampaign()
      return
    }
    const { data } = await campaignService.getCampaign(campaignId.value)
    applyCampaign(data.campaign)
  } catch (error) {
    errorMessage.value = campaignErrorMessage(error, 'campaigns.loadError')
  } finally {
    loading.value = false
  }
}

async function saveShell() {
  if (!form.title.trim()) return
  saving.value = true
  errorMessage.value = ''
  try {
    const payload = buildPayload()
    if (isNew.value) {
      const { data } = await campaignService.createCampaign(payload)
      await router.replace({ name: 'campaign-detail', params: { id: data.campaign._id } })
      applyCampaign(data.campaign)
    } else {
      const { data } = await campaignService.updateCampaign(campaignId.value, payload)
      applyCampaign(data.campaign)
    }
  } catch (error) {
    if (error.response?.data?.reason === 'campaign_limit') {
      try {
        if (await redirectToOwnedBlockingCampaign()) return
      } catch {
        // fall through to the error message
      }
    }
    errorMessage.value = campaignErrorMessage(error, 'campaigns.saveError')
  } finally {
    saving.value = false
  }
}

async function publish() {
  if (!hasInvites.value) return
  publishing.value = true
  errorMessage.value = ''
  try {
    if (canEditShell.value) {
      const { data: saved } = await campaignService.updateCampaign(campaignId.value, buildPayload())
      applyCampaign(saved.campaign)
    }
    const { data } = await campaignService.publishCampaign(campaignId.value)
    applyCampaign(data.campaign)
    justPublished.value = true
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('campaigns.publishError')
  } finally {
    publishing.value = false
  }
}

async function confirmDelete() {
  if (!campaignId.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await campaignService.deleteCampaign(campaignId.value)
    clearMyMissionsListCache()
    deleteConfirmOpen.value = false
    await router.push('/missions/my')
  } catch (error) {
    deleteError.value = error.response?.data?.message || t('campaigns.deleteError')
  } finally {
    deleting.value = false
  }
}

async function decideInvite(kind) {
  deciding.value = kind
  errorMessage.value = ''
  try {
    if (kind === 'accept') {
      const { data } = await campaignService.acceptCampaignInvite(campaignId.value)
      applyCampaign(data.campaign)
    } else {
      await campaignService.rejectCampaignInvite(campaignId.value)
    }
    await router.push('/missions/my')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('campaigns.inviteActionError')
  } finally {
    deciding.value = ''
  }
}

onMounted(loadCampaign)
</script>

<style scoped>
.campaign-editor {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 0 40px;
  color: var(--home-text, #f1f5f9);
}

.campaign-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.back-btn {
  color: #fff !important;
}

.campaign-kicker {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.campaign-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.campaign-card,
.slot-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: 20px;
  padding: 18px;
}

.campaign-card :deep(.v-field) {
  background: rgba(255, 255, 255, 0.04);
  color: var(--home-text, #f1f5f9) !important;
}

.campaign-card :deep(.v-field__input),
.campaign-card :deep(textarea) {
  color: var(--home-text, #f1f5f9) !important;
  caret-color: #4fd1c5;
  -webkit-text-fill-color: var(--home-text, #f1f5f9);
}

.campaign-card :deep(.v-field__input::placeholder),
.campaign-card :deep(textarea::placeholder) {
  color: var(--home-text-dim, #94a3b8) !important;
  -webkit-text-fill-color: var(--home-text-dim, #94a3b8);
  opacity: 1;
}

.campaign-card :deep(.v-input--disabled .v-field__input),
.campaign-card :deep(.v-input--disabled textarea) {
  color: var(--home-text, #f1f5f9) !important;
  -webkit-text-fill-color: var(--home-text, #f1f5f9);
  opacity: 1;
}

.start-time-selector {
  margin: 20px 0 8px;
}

.start-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.custom-chips-group {
  display: flex;
  gap: 12px;
  background: transparent !important;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.custom-chips-group .chip-btn {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.05)) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1)) !important;
  color: var(--home-text-dim, rgba(255, 255, 255, 0.7)) !important;
  border-radius: 12px !important;
  height: 48px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  padding: 0 20px !important;
  box-shadow: none !important;
}

.custom-chips-group .chip-btn.v-btn--active {
  background: var(--home-purple, #7048e8) !important;
  color: #fff !important;
}

.custom-toggle-group {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.05)) !important;
  border-radius: 12px !important;
  padding: 4px !important;
  height: 44px !important;
  display: flex;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1)) !important;
}

.custom-toggle-group .toggle-btn {
  border: none !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: var(--home-text-dim, rgba(255, 255, 255, 0.4)) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  flex: 1;
}

.custom-toggle-group .toggle-btn.v-btn--active {
  background: var(--home-purple, #7048e8) !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(112, 72, 232, 0.35) !important;
}

.calendar-btn {
  height: 44px !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1)) !important;
  border-radius: 12px !important;
  color: var(--home-text-dim, rgba(255, 255, 255, 0.6)) !important;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03)) !important;
  text-transform: none !important;
  font-weight: 600 !important;
}

.calendar-btn.is-active {
  border-color: var(--home-purple, #7048e8) !important;
  color: var(--home-purple, #7048e8) !important;
  background: rgba(112, 72, 232, 0.1) !important;
}

@media (max-width: 600px) {
  .start-row {
    flex-direction: column;
    align-items: stretch;
  }

  .custom-toggle-group,
  .calendar-btn {
    width: 100%;
  }

  .custom-chips-group {
    display: flex !important;
    width: 100%;
    flex-wrap: nowrap;
    gap: 6px;
    overflow: visible;
  }

  .custom-chips-group .chip-btn {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    width: auto !important;
    max-width: none !important;
    height: 40px !important;
    padding: 0 8px !important;
    font-size: 0.8rem !important;
    border-radius: 10px !important;
  }

  .custom-chips-group .chip-btn :deep(.v-btn__content) {
    min-width: 0;
    white-space: nowrap;
  }
}

.campaign-slots {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.slot-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slot-card--link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.slot-card--link:hover {
  border-color: var(--home-teal, #4fd1c5);
}

.slot-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--home-text-dim, #94a3b8);
}

.slot-label {
  margin: 0 0 4px;
  font-weight: 800;
}

.slot-copy {
  margin: 0;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.9rem;
}

.campaign-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.publish-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.publish-btn {
  background: rgba(79, 209, 197, 0.16) !important;
  color: #4fd1c5 !important;
}

.publish-btn:disabled,
.publish-btn.v-btn--disabled {
  opacity: 0.4 !important;
}

.publish-hint,
.publish-success-copy {
  margin: 0;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.85rem;
  line-height: 1.45;
}

.publish-success-title {
  margin: 0 0 6px;
  font-weight: 800;
}

.publish-success-link {
  display: inline-block;
  margin-top: 10px;
  color: #4fd1c5;
  font-weight: 700;
  text-decoration: none;
}
</style>
