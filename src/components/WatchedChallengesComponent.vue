<template>
  <div class="watched-challenges-page">
    <WatchedPageHeader />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="clearError"
    >
      <div class="watched-error-row">
        <span>{{ errorMessage }}</span>
        <v-btn
          size="small"
          variant="text"
          color="error"
          class="text-none"
          @click="retryFetch"
        >
          {{ t('watched.retry') }}
        </v-btn>
      </div>
    </v-alert>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="#4FD1C5"
      height="4"
      class="mb-4"
    />

    <ChallengeSkeletonGrid
      v-if="loading"
      :count="3"
      grid-class="watched-skeleton"
      type="heading, subtitle, text, actions"
      variant="card"
      card-class="watched-skeleton-card rounded-xl mb-4"
    />

    <div v-else-if="challenges.length" class="watched-layout">
      <div class="watched-main">
        <MissionSectionDivider
          :label="t('watched.sections.following')"
          icon="mdi-eye-outline"
          :count="challenges.length"
          flush-top
        />
        <WatchedMissionCard
          v-for="challenge in challenges"
          :key="challenge._id"
          :challenge="challenge"
          :current-user-id="currentUserId"
          :join-loading="joiningId === challenge._id"
          :unwatch-loading="unwatchingId === challenge._id"
          @open="openDetails"
          @join="joinFromCard"
          @unwatch="unwatchFromCard"
          @navigate-user="navigateToUser"
        />
      </div>

      <aside class="watched-rail">
        <WatchedTopPerformers :performers="topPerformers" />
        <WatchedActivityFeed
          :activities="feedActivities"
          :flush-top="topPerformers.length === 0"
        />
      </aside>
    </div>

    <WatchedEmptyState v-else-if="!errorMessage" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ChallengeSkeletonGrid from './ChallengeSkeletonGrid.vue'
import MissionSectionDivider from './MissionSectionDivider.vue'
import WatchedPageHeader from './watched/WatchedPageHeader.vue'
import WatchedMissionCard from './watched/WatchedMissionCard.vue'
import WatchedTopPerformers from './watched/WatchedTopPerformers.vue'
import WatchedActivityFeed from './watched/WatchedActivityFeed.vue'
import WatchedEmptyState from './watched/WatchedEmptyState.vue'
import { useUserStore } from '../stores/user'
import { buildTopPerformers } from '../utils/challengeProgress'
import { useWatchedPage } from '../composables/useWatchedPage'
import { openMissionDetails } from '../utils/openMissionDetails'
import { useChallengeUpdatedListener } from '../composables/useChallengeUpdatedListener'

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const currentUserId = computed(() => userStore.userId)

const {
  challenges,
  loading,
  errorMessage,
  joiningId,
  leavingId,
  unwatchingId,
  feedActivities,
  loadWatchedChallenges,
  clearError,
  updateChallengeInList,
  joinChallenge,
  leaveChallenge,
  unwatchChallenge
} = useWatchedPage(currentUserId)

const topPerformers = computed(() => buildTopPerformers(challenges.value))

function openDetails(challenge) {
  openMissionDetails({ challenge })
}

useChallengeUpdatedListener(({ challenge }) => {
  if (challenge) updateChallengeInList(challenge)
  else loadWatchedChallenges({ force: true })
})

function joinFromCard(challenge) {
  return joinChallenge(challenge)
}

function unwatchFromCard(challenge) {
  return unwatchChallenge(challenge)
}

function navigateToUser(user) {
  if (!user) return
  const userId = user._id || user
  if (!userId) return
  router.push(`/heroes/${userId}`)
}

async function retryFetch() {
  await loadWatchedChallenges({ force: true })
}

onMounted(() => {
  loadWatchedChallenges()
})
</script>

<style scoped>
.watched-challenges-page {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  background: transparent;
  color: var(--home-text, #f1f5f9);
}

.watched-error-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.watched-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 360px);
  gap: 24px;
  align-items: start;
}

.watched-main,
.watched-rail {
  min-width: 0;
}

.watched-skeleton {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.watched-skeleton-card {
  background: var(--home-surface, rgba(22, 27, 40, 0.55)) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
}

:deep(.v-skeleton-loader__text) {
  height: 12px !important;
  background: rgba(79, 209, 197, 0.12) !important;
  margin-top: 16px;
  border-radius: 6px;
}

@media (max-width: 959px) {
  .watched-layout {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
