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

    <ChallengeSkeletonGrid
      v-if="showPageSkeleton"
      :count="4"
      grid-class="watched-skeleton"
      type="heading, subtitle, text"
      variant="card"
      card-class="watched-skeleton-card rounded-xl mb-4"
    />

    <div
      v-else-if="radarChallenges.length || feedActivities.length"
      class="watched-layout"
      :class="{ 'watched-layout--feed-only': !radarChallenges.length }"
    >
      <WatchedActivityFeed
        :activities="feedActivities"
        :loading="feedLoading"
        @open-mission="openFeedMission"
        @open-hero="openFeedHero"
      />

      <aside v-if="radarChallenges.length" class="watched-rail">
        <MissionSectionDivider
          :label="t('watched.sections.radar')"
          icon="mdi-eye-outline"
          :count="radarChallenges.length"
          flush-top
        />
        <div class="watched-rail-list">
          <WatchedMissionCard
            v-for="challenge in radarChallenges"
            :key="challenge._id"
            :challenge="challenge"
            :current-user-id="currentUserId"
            :join-loading="joiningId === challenge._id"
            :unwatch-loading="unwatchingId === challenge._id"
            :last-activity="lastActivityLabel(challenge)"
            @open="openDetails"
            @join="joinFromCard"
            @unwatch="unwatchFromCard"
            @navigate-user="navigateToUser"
          />
        </div>
      </aside>
    </div>

    <WatchedEmptyState v-else-if="!errorMessage && !loading && !feedLoading" />
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
import WatchedActivityFeed from './watched/WatchedActivityFeed.vue'
import WatchedEmptyState from './watched/WatchedEmptyState.vue'
import { useUserStore } from '../stores/user'
import { useWatchedPage } from '../composables/useWatchedPage'
import { openMissionDetails } from '../utils/openMissionDetails'
import { useChallengeUpdatedListener } from '../composables/useChallengeUpdatedListener'
import { useDemoMode } from '../composables/useDemoMode'
import { formatActivityTime } from '../utils/activityTime'
import { isChallengeFinished } from '../utils/challengeStatus'

const router = useRouter()
const { t, locale } = useI18n()
const userStore = useUserStore()
const { requireAuthOrPrompt } = useDemoMode()

const currentUserId = computed(() => userStore.userId)

const {
  challenges,
  loading,
  errorMessage,
  joiningId,
  unwatchingId,
  feedActivities,
  feedLoading,
  loadWatchedChallenges,
  loadFeedActivities,
  clearError,
  updateChallengeInList,
  joinChallenge,
  unwatchChallenge
} = useWatchedPage(currentUserId)

const radarChallenges = computed(() =>
  (challenges.value || []).filter((challenge) => !isChallengeFinished(challenge))
)

const showPageSkeleton = computed(() => (
  (loading.value || feedLoading.value)
  && !radarChallenges.value.length
  && !feedActivities.value.length
))

const lastActivityByChallengeId = computed(() => {
  const map = {}
  for (const activity of feedActivities.value) {
    const id = activity.challengeId ? String(activity.challengeId) : ''
    if (id && !map[id]) map[id] = activity
  }
  return map
})

function lastActivityLabel(challenge) {
  const activity = lastActivityByChallengeId.value[String(challenge?._id || '')]
  if (!activity?.timestamp) return ''
  return formatActivityTime(activity.timestamp, { t, locale: locale.value })
}

function openDetails(challenge) {
  openMissionDetails({ challenge })
}

function openFeedMission(activity) {
  if (!activity?.challengeId) return
  openMissionDetails({
    challengeId: String(activity.challengeId),
    commentId: activity.commentId || null,
    initialTab: activity.type === 'comment' ? 'community' : null
  })
}

function openFeedHero(activity) {
  const userId = activity?.userId?._id || activity?.userId
  if (!userId) return
  navigateToUser(userId)
}

useChallengeUpdatedListener(({ challenge }) => {
  if (challenge) {
    updateChallengeInList(challenge)
    if (currentUserId.value) {
      loadFeedActivities(currentUserId.value, { force: true })
    }
  } else {
    loadWatchedChallenges({ force: true })
  }
})

function joinFromCard(challenge) {
  return joinChallenge(challenge)
}

function unwatchFromCard(challenge) {
  return unwatchChallenge(challenge)
}

function navigateToUser(user) {
  if (!user) return
  if (!requireAuthOrPrompt()) return
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
  grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
  gap: 24px;
  align-items: start;
}

.watched-layout--feed-only {
  grid-template-columns: minmax(0, 1fr);
}

.watched-rail {
  min-width: 0;
  position: sticky;
  top: 12px;
}

.watched-rail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(70vh, 720px);
  overflow-y: auto;
  padding-right: 4px;
}

.watched-rail-list::-webkit-scrollbar {
  width: 4px;
}

.watched-rail-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
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
    gap: 20px;
  }

  .watched-rail {
    position: static;
  }

  .watched-rail-list {
    max-height: none;
    overflow: visible;
  }
}
</style>
