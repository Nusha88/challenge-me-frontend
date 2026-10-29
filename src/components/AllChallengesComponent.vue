<template>
  <div class="all-challenges">
    <AllChallengesHeader />

    <MainRitualSection
      v-if="showMainRitual"
      @use="launchTemplate"
    />

    <MissionTemplatesSection />

    <FilterPanel
      ref="filterPanelRef"
      v-model="filters"
      @search="handleFilterSearch"
    />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="clearErrorMessage"
    >
      <div class="explore-error-row">
        <span>{{ errorMessage }}</span>
        <v-btn
          size="small"
          variant="text"
          color="error"
          class="text-none"
          @click="retryFetch"
        >
          {{ t('allChallenges.retry') }}
        </v-btn>
      </div>
    </v-alert>

    <div class="content-section">
      <ChallengeSkeletonGrid
        v-if="loading"
        :count="6"
        grid-class="challenges-grid"
      />

      <template v-else>
        <UpcomingChallengesSection
          v-if="showUpcomingSection"
          :challenges="upcomingChallenges"
          :current-user-id="currentUserId"
          @open="openDetails"
        />

        <ExploreEmptyState
          v-if="showEmptyState"
          :text="emptyStateText"
          :has-active-filters="hasActiveFilters"
          @clear-filters="clearFilters"
        />

        <template v-else-if="gridChallenges.length > 0 || hasMore">
          <MissionSectionDivider
            :label="t('allChallenges.sections.live')"
            icon="mdi-earth"
            :flush-top="!showUpcomingSection"
          />
          <ChallengeGrid
            :challenges="gridChallenges"
            :current-user-id="currentUserId"
            @open="openDetails"
            @update="() => fetchChallenges(currentPage.value || 1, false, { silent: true })"
          />

          <ChallengeSkeletonGrid
            v-if="loadingMore"
            :count="3"
            grid-class="challenges-grid challenges-grid--load-more"
            type="card"
            variant="bare"
          />

          <div
            v-if="hasMore"
            ref="loadMoreTrigger"
            class="load-more-trigger"
            aria-hidden="true"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, nextTick, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import FilterPanel from './FilterPanel.vue'
import ChallengeSkeletonGrid from './ChallengeSkeletonGrid.vue'
import AllChallengesHeader from './all-challenges/AllChallengesHeader.vue'
import MainRitualSection from './all-challenges/MainRitualSection.vue'
import MissionTemplatesSection from './all-challenges/MissionTemplatesSection.vue'
import ChallengeGrid from './all-challenges/ChallengeGrid.vue'
import UpcomingChallengesSection from './all-challenges/UpcomingChallengesSection.vue'
import ExploreEmptyState from './all-challenges/ExploreEmptyState.vue'
import MissionSectionDivider from './MissionSectionDivider.vue'
import { useUserStore } from '../stores/user'
import { useAllChallenges } from '../composables/useAllChallenges'
import { useChallengeFilters } from '../composables/useChallengeFilters'
import { useMainRitual } from '../composables/useMainRitual'
import { useMissionTemplateLaunch } from '../composables/useMissionTemplateLaunch'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'
import { openMissionDetails } from '../utils/openMissionDetails'
import { useChallengeUpdatedListener } from '../composables/useChallengeUpdatedListener'
import { useChallengeDetailsProvider } from '../composables/useChallengeDetailsProvider'
import { challengeService } from '../services/api'
import { canOpenChallenge } from '../utils/challengeStatus'
import { useDemoMode } from '../composables/useDemoMode'
import { isDemoMissionId } from '../constants/demo'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()
const filterPanelRef = ref(null)

const { isSocialGated, requireAuthOrPrompt, getEffectiveUserId } = useDemoMode()
const currentUserId = computed(() => getEffectiveUserId() || userStore.userId)

const {
  filters,
  isSyncingFromUrl,
  syncFiltersFromUrl,
  setupFilterWatchers,
  handleFilterSearch: onFilterSearch
} = useChallengeFilters(route, router)

const allChallengesState = useAllChallenges(filters, currentUserId)
const {
  challenges,
  loading,
  loadingMore,
  errorMessage,
  currentPage,
  hasMore,
  fetchChallenges,
  updateChallengeInList,
  clearErrorMessage
} = allChallengesState

const {
  showMainRitual,
  gridChallenges,
  upcomingChallenges
} = useMainRitual(filters, challenges, currentUserId)

const { launchTemplate } = useMissionTemplateLaunch()

const showUpcomingSection = computed(
  () => upcomingChallenges.value.length > 0 && filters.value.showUpcoming !== false
)

const hasActiveFilters = computed(() => {
  const f = filters.value
  return Boolean(
    f.title
    || f.owner
    || (f.type && f.type !== 'all')
    || f.popularity
    || f.isCompleted
    || f.showUpcoming === false
  )
})

const showEmptyState = computed(
  () =>
    !loading.value
    && !errorMessage.value
    && gridChallenges.value.length === 0
    && !showUpcomingSection.value
)

const emptyStateText = computed(() =>
  hasActiveFilters.value
    ? t('allChallenges.empty.filtered')
    : t('allChallenges.empty.catalog')
)

const { detailsDialogOpen } = useChallengeDetailsProvider()

function parseCommentHash(hash) {
  const normalized = (hash || '').replace('#', '')
  if (!normalized.startsWith('comment-')) return null
  const parts = normalized.split('-')
  if (parts.length < 2) return null
  return {
    commentId: parts[1],
    replyId: parts.length >= 3 ? parts[2] : null
  }
}

function openDetails(challenge) {
  if (isSocialGated.value && !isDemoMissionId(challenge?._id)) {
    requireAuthOrPrompt()
    return
  }
  if (!canOpenChallenge(challenge, currentUserId.value)) return
  const target = parseCommentHash(route.hash)
  openMissionDetails({
    challenge,
    commentId: target?.commentId || null,
    replyId: target?.replyId || null,
    initialTab: target ? 'community' : null
  })
  if (String(route.params.id) !== String(challenge._id)) {
    router.replace({ path: `/missions/${challenge._id}`, hash: route.hash })
  }
}

async function openChallengeById(challengeId) {
  if (!challengeId) return
  if (isSocialGated.value && !isDemoMissionId(String(challengeId))) {
    requireAuthOrPrompt()
    if (route.params.id) {
      router.replace({ path: '/missions', query: route.query })
    }
    return
  }
  const target = parseCommentHash(route.hash)
  let challenge = challenges.value.find((c) => String(c._id) === String(challengeId))
  if (!challenge) {
    try {
      const { data } = await challengeService.getChallenge(challengeId)
      challenge = data
    } catch {
      return
    }
  }
  openMissionDetails({
    challenge,
    challengeId,
    commentId: target?.commentId || null,
    replyId: target?.replyId || null,
    initialTab: target ? 'community' : null
  })
}

useChallengeUpdatedListener(({ challenge }) => {
  if (challenge && updateChallengeInList(challenge)) return
  fetchChallenges(currentPage.value || 1, false, { silent: true })
})

watch(detailsDialogOpen, (open) => {
  // Only clear /missions/:id deep-link when still on the browse/view route.
  // Closing for edit/profile navigates away — don't yank back to /missions.
  if (!open && route.params.id) {
    nextTick(() => {
      if (route.params.id) {
        router.replace({ path: '/missions', query: route.query })
      }
    })
  }
})

watch(
  () => route.params.id,
  (id, prev) => {
    if (id && id !== prev) openChallengeById(id)
  }
)

setupFilterWatchers({
  fetchChallenges: (page, append) => fetchChallenges(page, append)
})

const { loadMoreTrigger } = useInfiniteScroll({
  enabled: hasMore,
  loading,
  loadingMore,
  onLoadMore: () => fetchChallenges(currentPage.value + 1, true)
})

function handleFilterSearch() {
  onFilterSearch(fetchChallenges)
}

function clearFilters() {
  if (filterPanelRef.value?.resetFilters) {
    filterPanelRef.value.resetFilters()
    return
  }
  filters.value = {
    title: null,
    type: 'all',
    owner: null,
    popularity: null,
    showUpcoming: true,
    isCompleted: false
  }
  fetchChallenges(1, false)
}

async function retryFetch() {
  await fetchChallenges(currentPage.value || 1, false)
}

onMounted(async () => {
  isSyncingFromUrl.value = true
  syncFiltersFromUrl()
  await nextTick()
  isSyncingFromUrl.value = false

  const challengeIdFromRoute = route.params.id
  if (challengeIdFromRoute) {
    openChallengeById(challengeIdFromRoute)
  }

  await fetchChallenges(1, false)
})
</script>

<style scoped>
.all-challenges {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

.content-section {
  position: relative;
  min-height: 240px;
}

.explore-error-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.load-more-trigger {
  width: 100%;
  height: 1px;
  pointer-events: none;
  visibility: hidden;
}

:deep(.challenges-grid--load-more) {
  margin-top: 24px;
}
</style>

<style src="../assets/styles/challenge-skeleton.css"></style>
