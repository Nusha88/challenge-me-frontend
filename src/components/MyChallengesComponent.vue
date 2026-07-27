<template>
  <div class="my-missions">
    <MyMissionsHeader />

    <MyMissionsStatusTabs
      v-if="!loading && !listError && challenges.length > 0"
      v-model="statusTab"
      :active-count="activeChallenges.length"
      :upcoming-count="upcomingChallenges.length"
      :archive-count="finishedChallenges.length"
    />

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="#4FD1C5"
      height="4"
      class="my-missions-progress"
    />

    <div class="my-missions-content">
      <ChallengeSkeletonGrid
        v-if="loading"
        :count="6"
        grid-class="my-missions-skeleton-grid"
      />

      <template v-else-if="listError">
        <v-alert
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="clearListError"
        >
          <div class="my-missions-error-row">
            <span>{{ listError }}</span>
            <v-btn
              size="small"
              variant="text"
              color="error"
              class="text-none"
              @click="retryFetch"
            >
              {{ t('myChallenges.retry') }}
            </v-btn>
          </div>
        </v-alert>
      </template>

      <template v-else>
        <v-alert
          v-if="actionError"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="clearActionError"
        >
          {{ actionError }}
        </v-alert>

        <MyMissionsEmptyState
          v-if="challenges.length === 0"
          :text="t('myChallenges.empty.all')"
        />

        <template v-else>
          <template v-if="statusTab === 'active'">
            <MyMissionsEmptyState
              v-if="activeChallenges.length === 0"
              :text="t('myChallenges.empty.active')"
              :show-actions="false"
            />
            <template v-else>
              <MyChallengeSection
                :challenges="activeQuests"
                layout="quests"
                :title="t('myChallenges.sections.quests')"
                icon="mdi-flag-checkered"
                flush-top
                :current-user-id="currentUserId"
                @challenge-click="handleChallengeClick"
                @update="handleDialogUpdate"
              />
              <MyChallengeSection
                :challenges="activeRituals"
                layout="rituals"
                :title="t('myChallenges.sections.rituals')"
                icon="mdi-fire"
                :flush-top="activeQuests.length === 0"
                :current-user-id="currentUserId"
                @challenge-click="handleChallengeClick"
                @update="handleDialogUpdate"
              />
            </template>
          </template>

          <template v-else-if="statusTab === 'upcoming'">
            <MyMissionsEmptyState
              v-if="upcomingChallenges.length === 0"
              :text="t('myChallenges.empty.upcoming')"
              :show-actions="false"
            />
            <template v-else>
              <MyChallengeSection
                :challenges="upcomingQuests"
                layout="quests"
                :title="t('myChallenges.sections.quests')"
                icon="mdi-flag-checkered"
                flush-top
                :current-user-id="currentUserId"
                @challenge-click="handleChallengeClick"
              />
              <MyChallengeSection
                :challenges="upcomingRituals"
                layout="rituals"
                :title="t('myChallenges.sections.rituals')"
                icon="mdi-fire"
                :flush-top="upcomingQuests.length === 0"
                :current-user-id="currentUserId"
                @challenge-click="handleChallengeClick"
              />
            </template>
          </template>

          <template v-else>
            <MyMissionsEmptyState
              v-if="finishedChallenges.length === 0"
              :text="t('myChallenges.empty.archive')"
              :show-actions="false"
            />
            <MyChallengeSection
              v-else
              :challenges="finishedChallenges"
              layout="archive"
              :title="t('myChallenges.sections.archive')"
              icon="mdi-archive-outline"
              flush-top
              :current-user-id="currentUserId"
              show-extend-button
              @challenge-click="handleChallengeClick"
              @extended="handleChallengeExtended"
            />
          </template>
        </template>
      </template>
    </div>

    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="false"
      :show-leave-button="showDialogLeaveButton"
      :join-loading="false"
      :leave-loading="selectedLeaveLoading"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update="handleDialogUpdate"
      @leave="handleDialogLeave"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useI18n } from 'vue-i18n'
import MyChallengeSection from './MyChallengeSection.vue'
import ChallengeSkeletonGrid from './ChallengeSkeletonGrid.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import MyMissionsHeader from './my-missions/MyMissionsHeader.vue'
import MyMissionsStatusTabs from './my-missions/MyMissionsStatusTabs.vue'
import MyMissionsEmptyState from './my-missions/MyMissionsEmptyState.vue'
import { useMyChallenges } from '../composables/useMyChallenges'
import { useChallengeDialog } from '../composables/useChallengeDialog'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const currentUserId = computed(() => userStore.userId)
const statusTab = ref('active')
const hasInitializedTab = ref(false)

const {
  challenges,
  loading,
  listError,
  actionError,
  leavingId,
  activeQuests,
  activeRituals,
  upcomingChallenges,
  upcomingQuests,
  upcomingRituals,
  finishedChallenges,
  activeChallenges,
  clearListError,
  clearActionError,
  fetchChallenges,
  leaveChallenge,
  replaceChallengeInList,
  configureDialogSync
} = useMyChallenges(currentUserId)

const {
  detailsDialogOpen,
  selectedChallenge,
  selectedIsOwner,
  selectedIsParticipant,
  showDialogLeaveButton,
  selectedLeaveLoading,
  handleChallengeClick,
  handleDialogUpdate,
  handleDialogLeave,
  refreshSelectedChallenge,
  consumeChallengeIdFromRoute
} = useChallengeDialog({
  challenges,
  currentUserId,
  error: actionError,
  fetchChallenges,
  leaveChallenge,
  leavingId
})

configureDialogSync({ selectedChallenge, refreshSelectedChallenge })

function pickDefaultTab() {
  if (activeChallenges.value.length > 0) return 'active'
  if (upcomingChallenges.value.length > 0) return 'upcoming'
  if (finishedChallenges.value.length > 0) return 'archive'
  return 'active'
}

function syncDefaultTab() {
  if (loading.value || listError.value || hasInitializedTab.value) return
  statusTab.value = pickDefaultTab()
  hasInitializedTab.value = true
}

async function retryFetch() {
  clearListError()
  await fetchChallenges()
  hasInitializedTab.value = false
  syncDefaultTab()
}

function handleChallengeExtended(updatedChallenge) {
  if (!updatedChallenge?._id) return
  replaceChallengeInList(updatedChallenge)
}

onMounted(async () => {
  await fetchChallenges()
  syncDefaultTab()
  await consumeChallengeIdFromRoute(router, route, route.query.challengeId)
})

watch(
  [loading, activeChallenges, upcomingChallenges, finishedChallenges],
  () => {
    if (!loading.value) syncDefaultTab()
  }
)

watch(() => route.query.challengeId, (newChallengeId) => {
  consumeChallengeIdFromRoute(router, route, newChallengeId)
})
</script>

<style scoped>
.my-missions {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
}

.my-missions-progress {
  margin-bottom: 20px;
  border-radius: 999px;
}

.my-missions-content {
  position: relative;
  min-height: 280px;
}

.my-missions-error-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.my-missions-skeleton-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;
}

@media (min-width: 600px) {
  .my-missions-skeleton-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
}

@media (min-width: 960px) {
  .my-missions-skeleton-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

</style>

<style src="../assets/styles/challenge-skeleton.css"></style>
