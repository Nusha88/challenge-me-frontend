<script setup>
import { useI18n } from 'vue-i18n'
import { useUserProfile } from '../composables/useUserProfile'
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
  targetUserId,
  finishedUserMissions,
  liveUserMissions,
  reloadProfileData,
  clearError,
  clearUploadError,
  triggerFileInput,
  handleFileInputChange
} = useUserProfile(props)

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
        @bind-file-input="bindFileInput"
        @trigger-upload="triggerFileInput"
        @file-change="handleFileInputChange"
        @clear-upload-error="clearUploadError"
      />

      <HeroProfileHeader
        v-else
        :user="displayUser"
      />

      <ActivityHeatmap
        :habit-challenges="habitChallenges"
        :checklist-history="checklistHistory"
        :user-id="targetUserId"
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
