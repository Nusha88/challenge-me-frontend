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
      v-if="loading && !isNew"
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

    <div class="campaign-card">
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

      <p class="field-label field-label--required">{{ t('campaigns.duration') }}</p>
      <v-btn-toggle
        v-model="form.duration"
        mandatory
        class="duration-toggle"
        :disabled="!canEditShell"
      >
        <v-btn value="7">{{ t('campaigns.days', { count: 7 }) }}</v-btn>
        <v-btn value="14">{{ t('campaigns.days', { count: 14 }) }}</v-btn>
        <v-btn value="21">{{ t('campaigns.days', { count: 21 }) }}</v-btn>
      </v-btn-toggle>

      <p class="field-label">{{ t('challenges.start') }}</p>
      <v-btn-toggle
        v-model="form.startOption"
        mandatory
        class="duration-toggle"
        :disabled="!canEditShell"
      >
        <v-btn value="today">{{ t('challenges.startOptions.today') }}</v-btn>
        <v-btn value="tomorrow">{{ t('challenges.startOptions.tomorrow') }}</v-btn>
      </v-btn-toggle>

      <SquadInvitePicker
        v-if="canEditShell"
        v-model="form.inviteUserIds"
        :max-count="MAX_CAMPAIGN_GUESTS"
      />
    </div>

    <div v-if="!isNew" class="campaign-slots">
      <div class="slot-card">
        <div>
          <p class="slot-label">{{ t('campaigns.sharedSlot') }}</p>
          <p class="slot-copy">{{ sharedTitle || t('campaigns.sharedSlotHint') }}</p>
        </div>
        <v-btn
          v-if="canEditShell && !sharedTitle"
          class="app-cta-primary text-none"
          :to="{ path: '/missions/add', query: { campaignId: campaignId, slot: 'shared' } }"
        >
          {{ t('campaigns.addShared') }}
        </v-btn>
        <v-icon v-else-if="sharedTitle" color="#4FD1C5">mdi-check-circle</v-icon>
      </div>

      <div class="slot-card">
        <div>
          <p class="slot-label">{{ t('campaigns.personalSlot') }}</p>
          <p class="slot-copy">{{ personalTitle || t('campaigns.personalSlotHint') }}</p>
        </div>
        <v-btn
          v-if="canEditShell && !personalTitle"
          class="app-cta-primary text-none"
          :to="{ path: '/missions/add', query: { campaignId: campaignId, slot: 'personal' } }"
        >
          {{ t('campaigns.addPersonal') }}
        </v-btn>
        <v-icon v-else-if="personalTitle" color="#4FD1C5">mdi-check-circle</v-icon>
      </div>
    </div>

    <div class="campaign-actions">
      <v-btn
        v-if="canEditShell"
        class="app-cta-primary text-none"
        :loading="saving"
        :disabled="!form.title.trim() || saving"
        @click="saveShell"
      >
        {{ isNew ? t('campaigns.saveDraft') : t('campaigns.saveChanges') }}
      </v-btn>
      <div v-if="canPublish" class="publish-block">
        <v-btn
          class="publish-btn text-none"
          :loading="publishing"
          :disabled="publishing"
          @click="publish"
        >
          {{ t('campaigns.publish') }}
        </v-btn>
        <p class="publish-hint">{{ t('campaigns.publishHint') }}</p>
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
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import SquadInvitePicker from '../challenge-form/SquadInvitePicker.vue'
import { campaignService } from '../../services/api'
import { useUserStore } from '../../stores/user'
import { addDays, getInclusiveDaysBetween, toDateInputValue } from '../../utils/dateUtils'
import { MAX_CAMPAIGN_GUESTS, campaignIdOf, hasBothSlots } from '../../utils/campaigns'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const deciding = ref('')
const justPublished = ref(false)
const errorMessage = ref('')
const campaign = ref(null)

const form = reactive({
  title: '',
  description: '',
  duration: '14',
  startOption: 'today',
  inviteUserIds: []
})

const isNew = computed(() => route.name === 'campaign-new' || route.params.id === 'new')
const campaignId = computed(() => (isNew.value ? '' : String(route.params.id || '')))
const currentUserId = computed(() => String(userStore.userId || ''))
const isOwner = computed(() => campaignIdOf(campaign.value?.owner) === currentUserId.value)
const canEditShell = computed(() => (
  isNew.value || (campaign.value?.status === 'draft' && isOwner.value)
))
const canPublish = computed(() => campaign.value?.status === 'draft' && hasBothSlots(campaign.value))
const sharedTitle = computed(() => campaign.value?.sharedChallengeId?.title || '')
const personalTitle = computed(() => campaign.value?.personalTemplate?.title || '')
const inviteCount = computed(() => (campaign.value?.invites || []).length)
const isInvited = computed(() => {
  const userId = currentUserId.value
  if (!userId || !campaign.value) return false
  const invited = (campaign.value.invites || []).some((row) => campaignIdOf(row.userId) === userId)
  const member = (campaign.value.members || []).some((row) => campaignIdOf(row.userId) === userId)
  return invited && !member
})

function startDateFromOption() {
  return form.startOption === 'tomorrow'
    ? toDateInputValue(addDays(new Date(), 1))
    : toDateInputValue(new Date())
}

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
  form.inviteUserIds = (next.invites || [])
    .map((row) => String(row.userId?._id || row.userId || ''))
    .filter(Boolean)
}

async function loadCampaign() {
  if (isNew.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await campaignService.getCampaign(campaignId.value)
    applyCampaign(data.campaign)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('campaigns.loadError')
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
    errorMessage.value = error.response?.data?.message || t('campaigns.saveError')
  } finally {
    saving.value = false
  }
}

async function publish() {
  publishing.value = true
  errorMessage.value = ''
  try {
    const { data } = await campaignService.publishCampaign(campaignId.value)
    applyCampaign(data.campaign)
    justPublished.value = true
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('campaigns.publishError')
  } finally {
    publishing.value = false
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

.duration-toggle {
  margin-bottom: 16px;
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
