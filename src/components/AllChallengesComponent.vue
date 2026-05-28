<template>
  <div class="all-challenges">
    <AllChallengesHeader />

    <MainRitualSection
      v-if="showMainRitual"
      :loading="loadingMainRitual"
      :main-ritual="mainRitual"
      :current-user-id="currentUserId"
      :joining-id="joiningId"
      @join="joinChallenge"
      @open="openDetails"
    />

    <FilterPanel v-model="filters" @search="handleFilterSearch" />

    <div class="content-section">
      <ChallengesSkeletonGrid v-if="loading" />

      <template v-else>
        <ChallengeGrid
          :challenges="gridChallenges"
          :current-user-id="currentUserId"
          :joining-id="joiningId"
          :leaving-id="leavingId"
          :watching-id="watchingId"
          :is-watched="isWatched"
          @open="openDetails"
          @join="joinChallenge"
          @leave="leaveChallenge"
          @watch="watchChallenge"
          @unwatch="unwatchChallenge"
          @owner-navigated="handleOwnerNavigated"
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
    </div>

    <UpcomingChallengesSection
      v-if="showUpcomingSection"
      :challenges="upcomingChallenges"
      :current-user-id="currentUserId"
      :joining-id="joiningId"
      :leaving-id="leavingId"
      :watching-id="watchingId"
      :is-watched="isWatched"
      @open="openDetails"
      @join="joinChallenge"
      @leave="leaveChallenge"
      @watch="watchChallenge"
      @unwatch="unwatchChallenge"
      @owner-navigated="handleOwnerNavigated"
    />

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="showDialogJoinButton"
      :show-leave-button="showDialogLeaveButton"
      :join-loading="selectedJoinLoading"
      :leave-loading="selectedLeaveLoading"
      :save-loading="saveLoading"
      :save-error="saveError"
      :delete-loading="deleteLoading"
      @save="handleDialogSave"
      @join="handleDialogJoin"
      @leave="handleDialogLeave"
      @delete="handleDialogDelete"
      @update="handleDialogUpdate"
    />
  </div>
</template>

<script setup>
import { onMounted, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import FilterPanel from './FilterPanel.vue'
import ChallengeSkeletonGrid from './ChallengeSkeletonGrid.vue'
import AllChallengesHeader from './all-challenges/AllChallengesHeader.vue'
import MainRitualSection from './all-challenges/MainRitualSection.vue'
import ChallengesSkeletonGrid from './all-challenges/ChallengesSkeletonGrid.vue'
import ChallengeGrid from './all-challenges/ChallengeGrid.vue'
import UpcomingChallengesSection from './all-challenges/UpcomingChallengesSection.vue'
import { useUserStore } from '../stores/user'
import { useAllChallenges } from '../composables/useAllChallenges'
import { useChallengeFilters } from '../composables/useChallengeFilters'
import { useMainRitual } from '../composables/useMainRitual'
import { useChallengeActions } from '../composables/useChallengeActions'
import { useAllChallengesDialog } from '../composables/useAllChallengesDialog'
import { useInfiniteScroll } from '../composables/useInfiniteScroll'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentUserId = computed(() => userStore.userId)

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
  currentPage,
  hasMore,
  fetchChallenges
} = allChallengesState

const {
  loadingMainRitual,
  showMainRitual,
  mainRitual,
  gridChallenges,
  upcomingChallenges,
  fetchMainRitual,
  clearMainRitual
} = useMainRitual(filters, challenges)

const showUpcomingSection = computed(
  () => upcomingChallenges.value.length > 0 && filters.value.showUpcoming !== false
)

const challengeActions = useChallengeActions({
  challenges,
  currentUserId,
  errorMessage: allChallengesState.errorMessage,
  currentPage,
  fetchChallenges,
  onAfterJoin: () => (showMainRitual.value ? fetchMainRitual() : undefined)
})

const {
  joiningId,
  leavingId,
  watchingId,
  isWatched,
  joinChallenge,
  leaveChallenge,
  watchChallenge,
  unwatchChallenge,
  configureDialogSync
} = challengeActions

const allChallengesDialog = useAllChallengesDialog({
  challenges,
  loading,
  currentUserId,
  errorMessage: allChallengesState.errorMessage,
  fetchChallenges,
  currentPage,
  joinChallenge,
  leaveChallenge,
  joiningId,
  leavingId,
  router,
  route
})

const {
  detailsDialogOpen,
  selectedChallenge,
  selectedIsOwner,
  selectedIsParticipant,
  selectedJoinLoading,
  selectedLeaveLoading,
  showDialogJoinButton,
  showDialogLeaveButton,
  saveLoading,
  saveError,
  deleteLoading,
  openDetails,
  openChallengeById,
  refreshSelectedChallenge,
  handleDialogSave,
  handleDialogUpdate,
  handleDialogJoin,
  handleDialogLeave,
  handleDialogDelete,
  handleOwnerNavigated,
  setupRouteWatchers
} = allChallengesDialog

configureDialogSync({ selectedChallenge, refreshSelectedChallenge })
setupRouteWatchers()

setupFilterWatchers({
  fetchChallenges: (page, append) => fetchChallenges(page, append),
  onOwnerFilterChange: (owner) => {
    if (!owner && showMainRitual.value) {
      fetchMainRitual()
    } else if (owner) {
      clearMainRitual()
    }
  }
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

onMounted(async () => {
  isSyncingFromUrl.value = true
  syncFiltersFromUrl()
  await nextTick()
  isSyncingFromUrl.value = false

  if (showMainRitual.value) {
    await fetchMainRitual()
  }
  await fetchChallenges(1, false)

  if (route.params.id) {
    setTimeout(() => {
      openChallengeById(route.params.id)
    }, 100)
  }
})
</script>

<style scoped>
.all-challenges {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.content-section {
  position: relative;
  min-height: 400px;
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

@media (max-width: 600px) {
  .all-challenges {
    padding: 12px;
  }
}
</style>

<style src="../assets/styles/challenge-skeleton.css"></style>
