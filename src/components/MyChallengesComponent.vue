<template>
  <div class="my-missions">
    <MyMissionsHeader :can-create-campaign="canCreateCampaign" />

    <MyMissionsStatusTabs
      v-if="!listError && (loading || challenges.length > 0)"
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
          v-if="challenges.length === 0 && draftCampaigns.length === 0"
          :text="t('myChallenges.empty.all')"
          :can-create-campaign="canCreateCampaign"
        />

        <template v-else>
          <template v-if="statusTab === 'active'">
            <MyMissionsEmptyState
              v-if="activeChallenges.length === 0 && draftCampaigns.length === 0"
              :text="t('myChallenges.empty.active')"
              :can-create-campaign="canCreateCampaign"
            />
            <template v-else>
              <router-link
                v-for="draft in draftCampaigns"
                :key="draft._id"
                class="draft-campaign-link"
                :to="{ name: 'campaign-detail', params: { id: draft._id } }"
              >
                {{ t('campaigns.draftLabel', { title: draft.title }) }}
              </router-link>
              <CampaignFolder
                v-for="(folder, index) in activeCampaignFolders"
                :key="folder.campaign._id"
                :campaign="folder.campaign"
                :missions="folder.missions"
                :current-user-id="currentUserId"
                :flush-top="index === 0"
                @challenge-click="handleChallengeClick"
              />
              <MyChallengeSection
                :challenges="visibleActiveQuests"
                layout="quests"
                :title="t('myChallenges.sections.quests')"
                icon="mdi-flag-checkered"
                :flush-top="activeCampaignFolders.length === 0"
                :current-user-id="currentUserId"
                @challenge-click="handleChallengeClick"
              />
              <MyChallengeSection
                :challenges="visibleActiveRituals"
                layout="rituals"
                :title="t('myChallenges.sections.rituals')"
                icon="mdi-fire"
                :flush-top="activeCampaignFolders.length === 0 && visibleActiveQuests.length === 0"
                :current-user-id="currentUserId"
                @challenge-click="handleChallengeClick"
              />
            </template>
          </template>

          <template v-else-if="statusTab === 'upcoming'">
            <MyMissionsEmptyState
              v-if="upcomingChallenges.length === 0"
              :text="t('myChallenges.empty.upcoming')"
              :can-create-campaign="canCreateCampaign"
            />
            <template v-else>
              <CampaignFolder
                v-for="(folder, index) in upcomingCampaignFolders"
                :key="folder.campaign._id"
                :campaign="folder.campaign"
                :missions="folder.missions"
                :current-user-id="currentUserId"
                :flush-top="index === 0"
                @challenge-click="handleChallengeClick"
              />
              <MyChallengeSection
                :challenges="visibleUpcomingQuests"
                layout="quests"
                :title="t('myChallenges.sections.quests')"
                icon="mdi-flag-checkered"
                :flush-top="upcomingCampaignFolders.length === 0"
                :current-user-id="currentUserId"
                @challenge-click="handleChallengeClick"
              />
              <MyChallengeSection
                :challenges="visibleUpcomingRituals"
                layout="rituals"
                :title="t('myChallenges.sections.rituals')"
                icon="mdi-fire"
                :flush-top="upcomingCampaignFolders.length === 0 && visibleUpcomingQuests.length === 0"
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
            <template v-else>
              <CampaignFolder
                v-for="(folder, index) in archiveCampaignFolders"
                :key="folder.campaign._id"
                :campaign="folder.campaign"
                :missions="folder.missions"
                :current-user-id="currentUserId"
                :flush-top="index === 0"
                @challenge-click="handleChallengeClick"
              />
              <MyChallengeSection
                :challenges="visibleFinishedQuests"
                layout="archive"
                :title="t('myChallenges.sections.quests')"
                icon="mdi-flag-checkered"
                :flush-top="archiveCampaignFolders.length === 0"
                :current-user-id="currentUserId"
                show-extend-button
                @challenge-click="handleChallengeClick"
                @extended="handleChallengeExtended"
              />
              <MyChallengeSection
                :challenges="visibleFinishedRituals"
                layout="archive"
                :title="t('myChallenges.sections.rituals')"
                icon="mdi-fire"
                :flush-top="archiveCampaignFolders.length === 0 && visibleFinishedQuests.length === 0"
                :current-user-id="currentUserId"
                show-extend-button
                @challenge-click="handleChallengeClick"
                @extended="handleChallengeExtended"
              />
            </template>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useDemoStore } from '../stores/demo'
import { DEMO_USER_ID } from '../constants/demo'
import { useI18n } from 'vue-i18n'
import MyChallengeSection from './MyChallengeSection.vue'
import ChallengeSkeletonGrid from './ChallengeSkeletonGrid.vue'
import MyMissionsHeader from './my-missions/MyMissionsHeader.vue'
import MyMissionsStatusTabs from './my-missions/MyMissionsStatusTabs.vue'
import MyMissionsEmptyState from './my-missions/MyMissionsEmptyState.vue'
import CampaignFolder from './campaigns/CampaignFolder.vue'
import { useMyChallenges } from '../composables/useMyChallenges'
import { openMissionDetails } from '../utils/openMissionDetails'
import { useChallengeUpdatedListener } from '../composables/useChallengeUpdatedListener'
import { useChallengeDetailsProvider } from '../composables/useChallengeDetailsProvider'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const demoStore = useDemoStore()
const { t } = useI18n()

const currentUserId = computed(() => userStore.userId || (demoStore.isDemoMode ? DEMO_USER_ID : null))
const statusTab = ref('active')
const hasInitializedTab = ref(false)

const {
  challenges,
  loading,
  listError,
  actionError,
  upcomingChallenges,
  finishedChallenges,
  activeChallenges,
  visibleActiveQuests,
  visibleActiveRituals,
  visibleUpcomingQuests,
  visibleUpcomingRituals,
  visibleFinishedQuests,
  visibleFinishedRituals,
  draftCampaigns,
  canCreateCampaign,
  activeCampaignFolders,
  upcomingCampaignFolders,
  archiveCampaignFolders,
  clearListError,
  clearActionError,
  fetchChallenges,
  replaceChallengeInList,
  promoteChallengeToFront
} = useMyChallenges(currentUserId)

const { detailsDialogOpen } = useChallengeDetailsProvider()

function handleChallengeClick(challenge) {
  clearActionError()
  openMissionDetails({ challenge })
}

useChallengeUpdatedListener(({ challenge }) => {
  if (challenge) replaceChallengeInList(challenge)
  else fetchChallenges()
})

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

  // Extend creates a new mission id — refresh the full list so the archived
  // source stays put and the renewed copy lands at the top via createdAt.
  fetchChallenges().then(() => {
    promoteChallengeToFront(updatedChallenge)
    statusTab.value = 'active'
  })
}

onMounted(async () => {
  await fetchChallenges()
  syncDefaultTab()
  const challengeId = route.query.challengeId
  if (challengeId) {
    openMissionDetails({ challengeId: String(challengeId) })
    router.replace({ path: '/missions/my', query: { ...route.query, challengeId: undefined } })
  }
})

watch(detailsDialogOpen, (open) => {
  if (!open && route.query.challengeId) {
    const query = { ...route.query }
    delete query.challengeId
    router.replace({ path: '/missions/my', query })
  }
})

watch(
  [loading, activeChallenges, upcomingChallenges, finishedChallenges],
  () => {
    if (!loading.value) syncDefaultTab()
  }
)

watch(() => route.query.challengeId, (newChallengeId) => {
  if (!newChallengeId) return
  openMissionDetails({ challengeId: String(newChallengeId) })
  const query = { ...route.query }
  delete query.challengeId
  router.replace({ path: '/missions/my', query })
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

.draft-campaign-link {
  display: block;
  margin-bottom: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px dashed rgba(79, 209, 197, 0.35);
  color: var(--home-teal, #4fd1c5);
  text-decoration: none;
  font-weight: 700;
}

</style>

<style src="../assets/styles/challenge-skeleton.css"></style>
