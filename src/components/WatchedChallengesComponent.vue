<template>
  <div class="watched-challenges-page pa-4">
    <WatchedPageHeader />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="teal-accent-4"
      class="mb-4 shadow-neon"
    />

    <ChallengeSkeletonGrid
      v-if="loading"
      :count="3"
      grid-class="main-feed-skeleton"
      type="heading, subtitle, text, actions"
      variant="card"
      card-class="skeleton-card-dark rounded-xl mb-6"
    />

    <v-row v-if="challenges.length && !loading" class="watched-layout">
      <v-col cols="12" md="8">
        <WatchedMissionCard
          v-for="challenge in challenges"
          :key="challenge._id"
          :challenge="challenge"
          :current-user-id="currentUserId"
          :join-loading="joiningId === challenge._id"
          :unwatch-loading="watchingId === challenge._id"
          @open="openDetails"
          @join="joinFromCard"
          @unwatch="unwatchFromCard"
          @navigate-user="navigateToUser"
        />
      </v-col>

      <v-col cols="12" md="4">
        <WatchedTopPerformers :performers="topPerformers" />
        <WatchedActivityFeed :activities="feedActivities" />
      </v-col>
    </v-row>

    <WatchedEmptyState v-if="!challenges.length && !loading" />

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="showDialogJoinButton"
      :show-leave-button="showDialogLeaveButton"
      :join-loading="selectedJoinLoading"
      :leave-loading="selectedLeaveLoading"
      @join="handleDialogJoin"
      @leave="handleDialogLeave"
      @update="handleDialogUpdate"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import ChallengeSkeletonGrid from './ChallengeSkeletonGrid.vue'
import WatchedPageHeader from './watched/WatchedPageHeader.vue'
import WatchedMissionCard from './watched/WatchedMissionCard.vue'
import WatchedTopPerformers from './watched/WatchedTopPerformers.vue'
import WatchedActivityFeed from './watched/WatchedActivityFeed.vue'
import WatchedEmptyState from './watched/WatchedEmptyState.vue'
import { useUserStore } from '../stores/user'
import { buildTopPerformers } from '../utils/challengeProgress'
import { useWatchedPage } from '../composables/useWatchedPage'
import { useWatchedChallengeDialog } from '../composables/useWatchedChallengeDialog'

const router = useRouter()
const userStore = useUserStore()

const currentUserId = computed(() => userStore.userId)

const {
  challenges,
  loading,
  errorMessage,
  joiningId,
  leavingId,
  watchingId,
  feedActivities,
  loadWatchedChallenges,
  updateChallengeInList,
  joinChallenge,
  leaveChallenge,
  unwatchChallenge
} = useWatchedPage(currentUserId)

const topPerformers = computed(() => buildTopPerformers(challenges.value))

const {
  detailsDialogOpen,
  selectedChallenge,
  selectedIsOwner,
  selectedIsParticipant,
  selectedJoinLoading,
  selectedLeaveLoading,
  showDialogJoinButton,
  showDialogLeaveButton,
  openDetails,
  handleDialogUpdate,
  handleDialogJoin,
  handleDialogLeave
} = useWatchedChallengeDialog({
  currentUserId,
  joiningId,
  leavingId,
  joinChallenge,
  leaveChallenge,
  onChallengeUpdated: updateChallengeInList
})

function joinFromCard(challenge) {
  return joinChallenge(challenge, { selectedChallenge })
}

function unwatchFromCard(challenge) {
  return unwatchChallenge(challenge, {
    onUnwatchFromDialog: (unwatched) => {
      if (detailsDialogOpen.value && selectedChallenge.value?._id === unwatched._id) {
        detailsDialogOpen.value = false
      }
    }
  })
}

function navigateToUser(user) {
  if (!user) return
  const userId = user._id || user
  if (!userId) return
  router.push(`/heroes/${userId}`)
}

onMounted(() => {
  loadWatchedChallenges()
})
</script>

<style scoped>
.watched-challenges-page {
  background: transparent;
  color: #fff;
}

.main-feed-skeleton {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.skeleton-card-dark {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(79, 209, 197, 0.1) !important;
}

:deep(.v-skeleton-loader__text) {
  height: 12px !important;
  background: rgba(79, 209, 197, 0.15) !important;
  margin-top: 20px;
  border-radius: 6px;
}

@media (max-width: 480px) {
  .watched-challenges-page {
    padding: 8px !important;
  }
}
</style>
