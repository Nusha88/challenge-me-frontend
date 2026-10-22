<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserProfile } from '../composables/useUserProfile'
import { useFriendship } from '../composables/useFriendship'
import ProfilePageHeader from './profile/ProfilePageHeader.vue'
import HeroProfileHeader from './profile/HeroProfileHeader.vue'
import ActivityHeatmap from './profile/ActivityHeatmap.vue'
import ProfileSettingsPanel from './profile/ProfileSettingsPanel.vue'
import PublicMissionsSection from './profile/PublicMissionsSection.vue'

const props = defineProps({
  userId: {
    type: String,
    default: null
  }
})

const { t } = useI18n()

const {
  displayUser,
  habitChallenges,
  checklistHistory,
  loading,
  error,
  uploading,
  uploadError,
  fileInputRef,
  currentUserId,
  isOwnProfile,
  auraDimmed,
  targetUserId,
  finishedUserMissions,
  liveUserMissions,
  reloadProfileData,
  clearError,
  clearUploadError,
  triggerFileInput,
  handleFileInputChange,
  removeAvatar
} = useUserProfile(props)

const {
  friendshipStatus,
  isBusy,
  loadStatuses,
  sendRequest,
  acceptRequest,
  rejectRequest
} = useFriendship()

const friendError = ref('')

watch(
  [targetUserId, isOwnProfile],
  ([id, own]) => {
    if (id && !own) loadStatuses([{ _id: id }])
  },
  { immediate: true }
)

async function runFriendAction(action) {
  friendError.value = ''
  try {
    await action()
  } catch {
    friendError.value = t('users.squad.actionError')
  }
}

function bindFileInput(el) {
  fileInputRef.value = el
}
</script>

<template>
  <div class="user-profile">
    <v-progress-linear
      v-if="loading && !displayUser"
      indeterminate
      color="#4FD1C5"
      class="mb-4 rounded-pill"
    />

    <template v-else-if="displayUser">
      <ProfilePageHeader
        v-if="isOwnProfile"
        :user="displayUser"
        :uploading="uploading"
        :upload-error="uploadError"
        :dimmed="auraDimmed"
        @bind-file-input="bindFileInput"
        @trigger-upload="triggerFileInput"
        @remove-avatar="removeAvatar"
        @file-change="handleFileInputChange"
        @clear-upload-error="clearUploadError"
      />

      <HeroProfileHeader
        v-else
        :user="displayUser"
        :friendship-status="friendshipStatus(displayUser)"
        :friend-busy="isBusy(displayUser)"
        @friend-add="runFriendAction(() => sendRequest(displayUser))"
        @friend-cancel="runFriendAction(() => rejectRequest(displayUser))"
        @friend-accept="runFriendAction(() => acceptRequest(displayUser))"
        @friend-reject="runFriendAction(() => rejectRequest(displayUser))"
      />

      <v-alert
        v-if="friendError && !isOwnProfile"
        type="error"
        variant="tonal"
        class="rounded-xl mb-4"
        closable
        @click:close="friendError = ''"
      >
        {{ friendError }}
      </v-alert>

      <ActivityHeatmap
        :habit-challenges="habitChallenges"
        :checklist-history="checklistHistory"
        :user-id="targetUserId"
        :is-own-profile="isOwnProfile"
      />

      <ProfileSettingsPanel v-if="isOwnProfile" />

      <PublicMissionsSection
        v-else
        :live-missions="liveUserMissions"
        :finished-missions="finishedUserMissions"
        :current-user-id="currentUserId"
        :progress-user-id="targetUserId"
      />
    </template>

    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="rounded-xl mt-4"
    >
      <div class="profile-error-row">
        <span>{{ error }}</span>
        <v-btn
          size="small"
          variant="text"
          color="error"
          class="text-none"
          @click="() => { clearError(); reloadProfileData() }"
        >
          {{ t('users.retry') }}
        </v-btn>
      </div>
    </v-alert>
  </div>
</template>

<style scoped>
.user-profile {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  color: var(--home-text, #f1f5f9);
}

.profile-error-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
