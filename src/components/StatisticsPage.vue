<template>
  <div class="statistic-page">
    <header class="statistic-header">
      <h1 class="statistic-title">{{ t('statistic.title') }}</h1>
    </header>

    <v-alert
      v-if="overviewError"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="overviewError = ''"
    >
      {{ overviewError === 'overview' ? t('statistic.overviewLoadError') : overviewError }}
    </v-alert>

    <section v-if="overview" class="kpi-grid">
      <article class="kpi-card">
        <p class="kpi-label">{{ t('statistic.kpi.heroes') }}</p>
        <p class="kpi-value">{{ overview.usersTotal }}</p>
      </article>
      <article class="kpi-card">
        <p class="kpi-label">{{ t('statistic.kpi.new7d') }}</p>
        <p class="kpi-value">{{ overview.usersNew7d }}</p>
      </article>
      <article class="kpi-card">
        <p class="kpi-label">{{ t('statistic.kpi.disabled') }}</p>
        <p class="kpi-value">{{ overview.usersDisabled }}</p>
      </article>
      <article class="kpi-card">
        <p class="kpi-label">{{ t('statistic.kpi.missionsActive') }}</p>
        <p class="kpi-value">{{ overview.missionsActive }}</p>
      </article>
      <article class="kpi-card">
        <p class="kpi-label">{{ t('statistic.kpi.publicVisible') }}</p>
        <p class="kpi-value">{{ overview.missionsPublicVisible }}</p>
      </article>
      <article class="kpi-card">
        <p class="kpi-label">{{ t('statistic.kpi.campaignsLive') }}</p>
        <p class="kpi-value">{{ overview.campaignsLive }}</p>
      </article>
    </section>

    <v-tabs v-model="tab" color="primary" class="statistic-tabs mb-4">
      <v-tab value="users">{{ t('statistic.usersTab') }}</v-tab>
      <v-tab value="missions">{{ t('statistic.missionsTab') }}</v-tab>
      <v-tab value="campaigns">{{ t('statistic.campaignsTab') }}</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="users">
        <v-alert
          v-if="usersError"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="usersError = ''"
        >
          {{ localizedError(usersError, 'statistic.loadError') }}
        </v-alert>

        <div class="table-toolbar">
          <v-text-field
            v-model="usersSearchInput"
            :placeholder="t('statistic.searchUsers')"
            variant="outlined"
            density="comfortable"
            hide-details
            class="table-search"
            clearable
          >
            <template #prepend-inner>
              <v-icon color="#4FD1C5" size="20">mdi-magnify</v-icon>
            </template>
          </v-text-field>
          <v-select
            v-model="usersStatus"
            :items="userStatusFilters"
            variant="outlined"
            density="comfortable"
            hide-details
            class="table-filter"
          />
        </div>

        <v-data-table
          v-model:page="usersPage"
          v-model:items-per-page="usersPerPage"
          :headers="userHeaders"
          :items="users"
          :items-length="usersTotal"
          :loading="usersLoading"
          :items-per-page-options="pageSizeOptions"
          :no-data-text="t('statistic.emptyUsers')"
          item-value="id"
          class="statistic-table"
          density="comfortable"
          @update:options="handleUsersOptions"
        >
          <template #item.name="{ item }">
            <router-link class="table-link" :to="{ name: 'user-profile', params: { id: item.id } }">
              {{ item.name }}
            </router-link>
          </template>

          <template #item.email="{ item }">
            {{ item.email || identityLabel(item.identity) }}
          </template>

          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>

          <template #item.status="{ item }">
            <v-switch
              :model-value="item.status === 'active'"
              :label="t('statistic.statusActive')"
              :disabled="isUserRowLocked(item) || updatingUserIds.has(item.id)"
              :aria-label="t('statistic.columns.status')"
              hide-details
              density="compact"
              color="primary"
              @update:model-value="(checked) => handleStatusToggle(item, checked)"
            />
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              color="error"
              size="small"
              :disabled="isUserRowLocked(item) || deletingUser"
              :aria-label="t('statistic.deleteConfirmAction')"
              @click="openUserDeleteConfirm(item)"
            >
              <v-icon size="20">mdi-trash-can-outline</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-window-item>

      <v-window-item value="missions">
        <v-alert
          v-if="missionsError"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="missionsError = ''"
        >
          {{ localizedError(missionsError, 'statistic.missionsLoadError') }}
        </v-alert>

        <div class="table-toolbar">
          <v-text-field
            v-model="missionsSearchInput"
            :placeholder="t('statistic.searchMissions')"
            variant="outlined"
            density="comfortable"
            hide-details
            class="table-search"
            clearable
          >
            <template #prepend-inner>
              <v-icon color="#4FD1C5" size="20">mdi-magnify</v-icon>
            </template>
          </v-text-field>
          <v-select
            v-model="missionsType"
            :items="missionTypeFilters"
            variant="outlined"
            density="comfortable"
            hide-details
            class="table-filter"
          />
          <v-select
            v-model="missionsPrivacy"
            :items="missionPrivacyFilters"
            variant="outlined"
            density="comfortable"
            hide-details
            class="table-filter"
          />
          <v-select
            v-model="missionsStatus"
            :items="missionStatusFilters"
            variant="outlined"
            density="comfortable"
            hide-details
            class="table-filter"
          />
        </div>

        <v-data-table
          v-model:page="missionsPage"
          v-model:items-per-page="missionsPerPage"
          :headers="missionHeaders"
          :items="missions"
          :items-length="missionsTotal"
          :loading="missionsLoading"
          :items-per-page-options="pageSizeOptions"
          :no-data-text="t('statistic.emptyMissions')"
          item-value="id"
          class="statistic-table"
          density="comfortable"
          @update:options="handleMissionsOptions"
        >
          <template #item.title="{ item }">
            <div class="title-cell">
              <button type="button" class="table-link table-link-btn" @click="openMission(item.id)">
                {{ item.title }}
              </button>
              <span v-if="item.campaignRole" class="role-chip">
                {{ formatCampaignRole(item.campaignRole) }}
              </span>
            </div>
          </template>

          <template #item.challengeType="{ item }">
            {{ formatMissionType(item.challengeType) }}
          </template>

          <template #item.privacy="{ item }">
            {{ formatPrivacy(item.privacy) }}
          </template>

          <template #item.ownerName="{ item }">
            <router-link
              v-if="item.ownerId"
              class="table-link"
              :to="{ name: 'user-profile', params: { id: item.ownerId } }"
            >
              {{ item.ownerName || t('challenges.unknownHero') }}
            </router-link>
            <span v-else>{{ item.ownerName || '—' }}</span>
          </template>

          <template #item.visibility="{ item }">
            <v-switch
              :model-value="item.visibility !== false"
              :label="t('statistic.visibleInWorld')"
              :disabled="updatingMissionIds.has(item.id)"
              :aria-label="t('statistic.columns.visibility')"
              hide-details
              density="compact"
              color="primary"
              @update:model-value="(checked) => handleVisibilityToggle(item, checked)"
            />
          </template>

          <template #item.status="{ item }">
            {{ formatMissionStatus(item.status) }}
          </template>

          <template #item.lastActivityAt="{ item }">
            {{ formatDateTime(item.lastActivityAt) }}
          </template>

          <template #item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              color="error"
              size="small"
              :disabled="deletingMission"
              :aria-label="t('statistic.missionDeleteConfirmAction')"
              @click="openMissionDeleteConfirm(item)"
            >
              <v-icon size="20">mdi-trash-can-outline</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-window-item>

      <v-window-item value="campaigns">
        <v-alert
          v-if="campaignsError"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="campaignsError = ''"
        >
          {{ localizedError(campaignsError, 'statistic.campaignsLoadError') }}
        </v-alert>

        <div class="table-toolbar">
          <v-text-field
            v-model="campaignsSearchInput"
            :placeholder="t('statistic.searchCampaigns')"
            variant="outlined"
            density="comfortable"
            hide-details
            class="table-search"
            clearable
          >
            <template #prepend-inner>
              <v-icon color="#4FD1C5" size="20">mdi-magnify</v-icon>
            </template>
          </v-text-field>
        </div>

        <v-data-table
          v-model:page="campaignsPage"
          v-model:items-per-page="campaignsPerPage"
          :headers="campaignHeaders"
          :items="campaigns"
          :items-length="campaignsTotal"
          :loading="campaignsLoading"
          :items-per-page-options="pageSizeOptions"
          :no-data-text="t('statistic.emptyCampaigns')"
          item-value="id"
          class="statistic-table"
          density="comfortable"
          @update:options="handleCampaignsOptions"
        >
          <template #item.title="{ item }">
            <button
              v-if="item.sharedChallengeId"
              type="button"
              class="table-link table-link-btn"
              @click="openMission(item.sharedChallengeId)"
            >
              {{ item.title }}
            </button>
            <span v-else>{{ item.title }}</span>
          </template>

          <template #item.status="{ item }">
            {{ formatCampaignStatus(item.status) }}
          </template>

          <template #item.ownerName="{ item }">
            <router-link
              v-if="item.ownerId"
              class="table-link"
              :to="{ name: 'user-profile', params: { id: item.ownerId } }"
            >
              {{ item.ownerName || t('challenges.unknownHero') }}
            </router-link>
            <span v-else>{{ item.ownerName || '—' }}</span>
          </template>

          <template #item.dates="{ item }">
            {{ formatDateRange(item.startDate, item.endDate) }}
          </template>
        </v-data-table>
      </v-window-item>
    </v-window>

    <v-dialog v-model="userDeleteConfirmOpen" max-width="420">
      <v-card class="delete-confirm-card rounded-xl">
        <v-card-title class="delete-confirm-title">
          {{ t('statistic.deleteConfirmTitle') }}
        </v-card-title>
        <v-card-text class="delete-confirm-text">
          {{ t('statistic.deleteConfirmMessage', { name: userPendingDelete?.name || '' }) }}
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deletingUser" @click="closeUserDeleteConfirm">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" :loading="deletingUser" @click="confirmDeleteUserAction">
            {{ t('statistic.deleteConfirmAction') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="missionDeleteConfirmOpen" max-width="420">
      <v-card class="delete-confirm-card rounded-xl">
        <v-card-title class="delete-confirm-title">
          {{ t('statistic.missionDeleteConfirmTitle') }}
        </v-card-title>
        <v-card-text class="delete-confirm-text">
          {{ t('statistic.missionDeleteConfirmMessage', { title: missionPendingDelete?.title || '' }) }}
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" :disabled="deletingMission" @click="closeMissionDeleteConfirm">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" :loading="deletingMission" @click="confirmDeleteMissionAction">
            {{ t('statistic.missionDeleteConfirmAction') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useAdminStatistics } from '../composables/useAdminStatistics'
import { openMissionDetails } from '../utils/openMissionDetails'

const { t, locale } = useI18n()
const { smAndDown } = useDisplay()
const {
  tab,
  overview,
  overviewError,
  users,
  usersTotal,
  usersPage,
  usersPerPage,
  usersSearchInput,
  usersStatus,
  usersLoading,
  usersError,
  updatingUserIds,
  deletingUser,
  missions,
  missionsTotal,
  missionsPage,
  missionsPerPage,
  missionsSearchInput,
  missionsType,
  missionsPrivacy,
  missionsStatus,
  missionsLoading,
  missionsError,
  updatingMissionIds,
  deletingMission,
  campaigns,
  campaignsTotal,
  campaignsPage,
  campaignsPerPage,
  campaignsSearchInput,
  campaignsLoading,
  campaignsError,
  isUserRowLocked,
  handleUsersOptions,
  handleMissionsOptions,
  handleCampaignsOptions,
  handleStatusToggle,
  handleVisibilityToggle,
  confirmDeleteUser,
  confirmDeleteMission
} = useAdminStatistics()

const userDeleteConfirmOpen = ref(false)
const userPendingDelete = ref(null)
const missionDeleteConfirmOpen = ref(false)
const missionPendingDelete = ref(null)

const pageSizeOptions = [10, 25, 50]

const userStatusFilters = computed(() => [
  { title: t('statistic.filterAll'), value: 'all' },
  { title: t('statistic.statusActive'), value: 'active' },
  { title: t('statistic.statusDisabled'), value: 'disabled' }
])

const missionTypeFilters = computed(() => [
  { title: t('statistic.filterAll'), value: 'all' },
  { title: t('statistic.type.ritual'), value: 'habit' },
  { title: t('statistic.type.quest'), value: 'result' }
])

const missionPrivacyFilters = computed(() => [
  { title: t('statistic.filterAll'), value: 'all' },
  { title: t('statistic.privacy.public'), value: 'public' },
  { title: t('statistic.privacy.private'), value: 'private' }
])

const missionStatusFilters = computed(() => [
  { title: t('statistic.filterAll'), value: 'all' },
  { title: t('statistic.missionStatus.active'), value: 'active' },
  { title: t('statistic.missionStatus.upcoming'), value: 'upcoming' },
  { title: t('statistic.missionStatus.archived'), value: 'archived' }
])

const userHeaders = computed(() => {
  const compact = smAndDown.value
  const headers = [
    { title: t('statistic.columns.name'), key: 'name', sortable: false },
    { title: t('statistic.columns.email'), key: 'email', sortable: false },
    { title: t('statistic.columns.joined'), key: 'createdAt', sortable: false }
  ]
  if (!compact) {
    headers.push(
      { title: t('statistic.columns.level'), key: 'level', sortable: false },
      { title: t('statistic.columns.xp'), key: 'xp', sortable: false },
      { title: t('statistic.columns.sparks'), key: 'sparks', sortable: false },
      { title: t('statistic.columns.missions'), key: 'missionsTotal', sortable: false },
      { title: t('statistic.columns.activeMissions'), key: 'missionsActive', sortable: false }
    )
  }
  headers.push(
    { title: t('statistic.columns.status'), key: 'status', sortable: false },
    { title: t('statistic.columns.actions'), key: 'actions', sortable: false, align: 'end', width: 64 }
  )
  return headers
})

const missionHeaders = computed(() => {
  const compact = smAndDown.value
  const headers = [
    { title: t('statistic.columns.title'), key: 'title', sortable: false }
  ]
  if (!compact) {
    headers.push(
      { title: t('statistic.columns.type'), key: 'challengeType', sortable: false },
      { title: t('statistic.columns.privacy'), key: 'privacy', sortable: false },
      { title: t('statistic.columns.participants'), key: 'participantsCount', sortable: false }
    )
  }
  headers.push(
    { title: t('statistic.columns.ownerName'), key: 'ownerName', sortable: false },
    { title: t('statistic.columns.visibility'), key: 'visibility', sortable: false },
    { title: t('statistic.columns.missionStatus'), key: 'status', sortable: false }
  )
  if (!compact) {
    headers.push({ title: t('statistic.columns.updated'), key: 'lastActivityAt', sortable: false })
  }
  headers.push(
    { title: t('statistic.columns.actions'), key: 'actions', sortable: false, align: 'end', width: 64 }
  )
  return headers
})

const campaignHeaders = computed(() => {
  const compact = smAndDown.value
  const headers = [
    { title: t('statistic.columns.title'), key: 'title', sortable: false },
    { title: t('statistic.columns.missionStatus'), key: 'status', sortable: false }
  ]
  if (!compact) {
    headers.push({ title: t('statistic.columns.members'), key: 'membersCount', sortable: false })
  }
  headers.push({ title: t('statistic.columns.ownerName'), key: 'ownerName', sortable: false })
  if (!compact) {
    headers.push({ title: t('statistic.columns.dates'), key: 'dates', sortable: false })
  }
  return headers
})

function localizedError(message, fallbackKey) {
  if (!message || message === 'users' || message === 'missions' || message === 'campaigns'
    || message === 'status' || message === 'visibility' || message === 'delete'
    || message === 'delete-mission' || message === 'overview') {
    return t(fallbackKey)
  }
  return message
}

function identityLabel(identity) {
  if (identity === 'telegram') return t('statistic.identity.telegram')
  if (identity === 'google') return t('statistic.identity.google')
  return '—'
}

function formatMissionType(challengeType) {
  return challengeType === 'result'
    ? t('statistic.type.quest')
    : t('statistic.type.ritual')
}

function formatPrivacy(privacy) {
  return privacy === 'private'
    ? t('statistic.privacy.private')
    : t('statistic.privacy.public')
}

function formatMissionStatus(status) {
  if (status === 'archived') return t('statistic.missionStatus.archived')
  if (status === 'upcoming') return t('statistic.missionStatus.upcoming')
  return t('statistic.missionStatus.active')
}

function formatCampaignStatus(status) {
  if (status === 'draft') return t('statistic.campaignStatus.draft')
  if (status === 'open') return t('statistic.campaignStatus.open')
  if (status === 'finished') return t('statistic.campaignStatus.finished')
  return t('statistic.campaignStatus.active')
}

function formatCampaignRole(role) {
  if (role === 'personalClone') return t('statistic.campaignRole.personalClone')
  if (role === 'shared') return t('statistic.campaignRole.shared')
  return ''
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateRange(start, end) {
  if (!start && !end) return '—'
  return `${formatDate(start)} – ${formatDate(end)}`
}

function openMission(challengeId) {
  openMissionDetails({ challengeId })
}

function openUserDeleteConfirm(item) {
  if (isUserRowLocked(item) || deletingUser.value) return
  userPendingDelete.value = item
  userDeleteConfirmOpen.value = true
}

function closeUserDeleteConfirm() {
  if (deletingUser.value) return
  userDeleteConfirmOpen.value = false
  userPendingDelete.value = null
}

async function confirmDeleteUserAction() {
  const item = userPendingDelete.value
  const ok = await confirmDeleteUser(item)
  if (ok) closeUserDeleteConfirm()
}

function openMissionDeleteConfirm(item) {
  if (deletingMission.value) return
  missionPendingDelete.value = item
  missionDeleteConfirmOpen.value = true
}

function closeMissionDeleteConfirm() {
  if (deletingMission.value) return
  missionDeleteConfirmOpen.value = false
  missionPendingDelete.value = null
}

async function confirmDeleteMissionAction() {
  const item = missionPendingDelete.value
  const ok = await confirmDeleteMission(item)
  if (ok) closeMissionDeleteConfirm()
}
</script>

<style scoped>
.statistic-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 3vw, 28px);
}

.statistic-header {
  margin-bottom: 12px;
}

.statistic-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.kpi-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  padding: 14px 16px;
}

.kpi-label {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--home-text-dim, #94a3b8);
}

.kpi-value {
  margin: 6px 0 0;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.statistic-tabs {
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.table-search {
  flex: 1 1 220px;
  min-width: 0;
}

.table-filter {
  flex: 0 1 160px;
  min-width: 140px;
}

.table-search :deep(.v-field),
.table-filter :deep(.v-field) {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03)) !important;
  color: var(--home-text, #f1f5f9) !important;
}

.statistic-table {
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border-radius: 14px;
  overflow: auto;
  color: #fff;
}

.statistic-table :deep(.v-data-table__th),
.statistic-table :deep(.v-data-table__td),
.statistic-table :deep(.v-data-table-header__content),
.statistic-table :deep(.v-data-table__td .v-selection-control),
.statistic-table :deep(.v-table),
.statistic-table :deep(th),
.statistic-table :deep(td) {
  color: #fff !important;
}

.statistic-table :deep(.v-data-table-footer),
.statistic-table :deep(.v-data-table-footer__info),
.statistic-table :deep(.v-data-table-footer__items-per-page),
.statistic-table :deep(.v-select__selection-text),
.statistic-table :deep(.v-pagination__item) {
  color: #fff !important;
}

.table-link {
  color: var(--home-teal, #4fd1c5);
  font-weight: 700;
  text-decoration: none;
}

.table-link:hover {
  text-decoration: underline;
}

.table-link-btn {
  appearance: none;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-align: left;
}

.title-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.role-chip {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--home-text-dim, #94a3b8);
}

.delete-confirm-card {
  background: var(--home-surface, #161b28);
  color: var(--home-text, #f1f5f9);
}

.delete-confirm-title {
  font-weight: 800;
}

.delete-confirm-text {
  color: var(--home-text-dim, #94a3b8);
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .table-filter {
    flex: 1 1 100%;
  }
}
</style>
