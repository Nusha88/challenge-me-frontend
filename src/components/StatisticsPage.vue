<template>
  <div class="statistic-page">
    <header class="statistic-header">
      <h1 class="statistic-title">{{ t('statistic.title') }}</h1>
    </header>

    <v-tabs v-model="tab" color="primary" class="statistic-tabs mb-4">
      <v-tab value="users">{{ t('statistic.usersTab') }}</v-tab>
      <v-tab value="missions">{{ t('statistic.missionsTab') }}</v-tab>
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
          {{ usersError }}
        </v-alert>

        <v-data-table
          :headers="userHeaders"
          :items="users"
          :loading="usersLoading"
          item-value="id"
          class="statistic-table"
          density="comfortable"
        >
          <template #item.status="{ item }">
            <v-checkbox
              :model-value="item.status === 'active'"
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
          {{ missionsError }}
        </v-alert>

        <v-data-table
          :headers="missionHeaders"
          :items="missions"
          :loading="missionsLoading"
          item-value="id"
          class="statistic-table"
          density="comfortable"
        >
          <template #item.challengeType="{ item }">
            {{ formatMissionType(item.challengeType) }}
          </template>

          <template #item.privacy="{ item }">
            {{ formatPrivacy(item.privacy) }}
          </template>

          <template #item.visibility="{ item }">
            <v-checkbox
              :model-value="item.visibility !== false"
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
            {{ formatLastActivity(item.lastActivityAt) }}
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
          <v-btn color="error" variant="flat" :loading="deletingUser" @click="confirmDeleteUser">
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
          <v-btn color="error" variant="flat" :loading="deletingMission" @click="confirmDeleteMission">
            {{ t('statistic.missionDeleteConfirmAction') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { userService } from '../services/api'
import { isSuperAdminUserId } from '../constants/superAdmin'

const { t } = useI18n()

const tab = ref('users')

const users = ref([])
const usersLoading = ref(false)
const usersError = ref('')
const updatingUserIds = ref(new Set())
const userDeleteConfirmOpen = ref(false)
const userPendingDelete = ref(null)
const deletingUser = ref(false)

const missions = ref([])
const missionsLoading = ref(false)
const missionsError = ref('')
const missionsLoaded = ref(false)
const updatingMissionIds = ref(new Set())
const missionDeleteConfirmOpen = ref(false)
const missionPendingDelete = ref(null)
const deletingMission = ref(false)

const userHeaders = computed(() => [
  { title: t('statistic.columns.name'), key: 'name', sortable: true },
  { title: t('statistic.columns.email'), key: 'email', sortable: true },
  { title: t('statistic.columns.level'), key: 'level', sortable: true },
  { title: t('statistic.columns.xp'), key: 'xp', sortable: true },
  { title: t('statistic.columns.sparks'), key: 'sparks', sortable: true },
  { title: t('statistic.columns.missions'), key: 'missionsTotal', sortable: true },
  { title: t('statistic.columns.activeMissions'), key: 'missionsActive', sortable: true },
  { title: t('statistic.columns.status'), key: 'status', sortable: false },
  { title: t('statistic.columns.actions'), key: 'actions', sortable: false, align: 'end', width: 64 }
])

const missionHeaders = computed(() => [
  { title: t('statistic.columns.title'), key: 'title', sortable: true },
  { title: t('statistic.columns.type'), key: 'challengeType', sortable: true },
  { title: t('statistic.columns.privacy'), key: 'privacy', sortable: true },
  { title: t('statistic.columns.participants'), key: 'participantsCount', sortable: true },
  { title: t('statistic.columns.ownerName'), key: 'ownerName', sortable: true },
  { title: t('statistic.columns.visibility'), key: 'visibility', sortable: false },
  { title: t('statistic.columns.missionStatus'), key: 'status', sortable: true },
  { title: t('statistic.columns.lastActivity'), key: 'lastActivityAt', sortable: true },
  { title: t('statistic.columns.actions'), key: 'actions', sortable: false, align: 'end', width: 64 }
])

function isUserRowLocked(item) {
  return isSuperAdminUserId(item.id)
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

function formatLastActivity(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadUsers() {
  usersLoading.value = true
  usersError.value = ''
  try {
    const { data } = await userService.getAdminUsers({ limit: 200 })
    users.value = Array.isArray(data?.users) ? data.users : []
  } catch (err) {
    console.error('Failed to load admin users:', err)
    usersError.value = err.response?.data?.message || t('statistic.loadError')
    users.value = []
  } finally {
    usersLoading.value = false
  }
}

async function loadMissions({ force = false } = {}) {
  if (missionsLoaded.value && !force) return

  missionsLoading.value = true
  missionsError.value = ''
  try {
    const { data } = await userService.getAdminMissions({ limit: 200 })
    missions.value = Array.isArray(data?.missions) ? data.missions : []
    missionsLoaded.value = true
  } catch (err) {
    console.error('Failed to load admin missions:', err)
    missionsError.value = err.response?.data?.message || t('statistic.missionsLoadError')
    missions.value = []
  } finally {
    missionsLoading.value = false
  }
}

async function handleStatusToggle(item, checked) {
  if (isUserRowLocked(item) || updatingUserIds.value.has(item.id)) return

  const nextStatus = checked ? 'active' : 'disabled'
  const previousStatus = item.status

  item.status = nextStatus
  updatingUserIds.value = new Set([...updatingUserIds.value, item.id])

  try {
    const { data } = await userService.updateUserStatus(item.id, nextStatus)
    item.status = data?.status === 'disabled' ? 'disabled' : 'active'
  } catch (err) {
    console.error('Failed to update user status:', err)
    item.status = previousStatus
    usersError.value = err.response?.data?.message || t('statistic.statusUpdateError')
  } finally {
    const next = new Set(updatingUserIds.value)
    next.delete(item.id)
    updatingUserIds.value = next
  }
}

async function handleVisibilityToggle(item, checked) {
  if (updatingMissionIds.value.has(item.id)) return

  const nextVisibility = Boolean(checked)
  const previousVisibility = item.visibility !== false

  item.visibility = nextVisibility
  updatingMissionIds.value = new Set([...updatingMissionIds.value, item.id])

  try {
    const { data } = await userService.updateMissionVisibility(item.id, nextVisibility)
    item.visibility = data?.visibility !== false
  } catch (err) {
    console.error('Failed to update mission visibility:', err)
    item.visibility = previousVisibility
    missionsError.value = err.response?.data?.message || t('statistic.visibilityUpdateError')
  } finally {
    const next = new Set(updatingMissionIds.value)
    next.delete(item.id)
    updatingMissionIds.value = next
  }
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

async function confirmDeleteUser() {
  const item = userPendingDelete.value
  if (!item || isUserRowLocked(item)) return

  deletingUser.value = true
  usersError.value = ''
  try {
    await userService.deleteAdminUser(item.id)
    users.value = users.value.filter((user) => user.id !== item.id)
    userDeleteConfirmOpen.value = false
    userPendingDelete.value = null
  } catch (err) {
    console.error('Failed to delete user:', err)
    usersError.value = err.response?.data?.message || t('statistic.deleteError')
  } finally {
    deletingUser.value = false
  }
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

async function confirmDeleteMission() {
  const item = missionPendingDelete.value
  if (!item) return

  deletingMission.value = true
  missionsError.value = ''
  try {
    await userService.deleteAdminMission(item.id)
    missions.value = missions.value.filter((mission) => mission.id !== item.id)
    missionDeleteConfirmOpen.value = false
    missionPendingDelete.value = null
  } catch (err) {
    console.error('Failed to delete mission:', err)
    missionsError.value = err.response?.data?.message || t('statistic.missionDeleteError')
  } finally {
    deletingMission.value = false
  }
}

watch(tab, (nextTab) => {
  if (nextTab === 'missions') {
    loadMissions()
  }
})

onMounted(() => {
  loadUsers()
})
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

.statistic-tabs {
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
}

.statistic-table {
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border-radius: 14px;
  overflow: hidden;
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
</style>
