<template>
  <div class="my-challenges">
    <div class="header-section text-left mb-10 reveal-animation">
  <div class="d-flex align-center mb-1">
    <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-shield-account</v-icon>
    <h1 class="page-title-dark">{{ t('myChallenges.title') }}</h1>
  </div>
  <div class="text-overline text-teal-accent-4 tracking-widest ml-13">{{ t('myChallenges.subtitle') }}</div>
  <p class="journal-subtitle-dark mt-2">{{ t('myChallenges.description') }}</p>
</div>
<v-progress-linear
      v-if="loading"
      indeterminate
      color="teal-accent-4"
      height="4"
      class="mb-6 shadow-neon-line"
    ></v-progress-linear>
    <div class="content-section">
      <ChallengeSkeletonGrid
        v-if="loading"
        :count="6"
        grid-class="challenges-grid-skeleton"
        card-class="mb-6"
      />

      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
        </v-alert>

      <v-alert
        v-else-if="challenges.length === 0"
        type="info"
        variant="tonal"
        class="info-message"
      >
        <template #prepend>
          <v-icon class="info-message-icon">mdi-information</v-icon>
        </template>
        <div>
          <div class="mb-3">
            {{ t('challenges.noMyChallenges') }}
          </div>
          <v-btn
            color="teal-accent-4"
            variant="outlined"
            rounded="pill"
            class="mt-1 action-btn-ignite"
            to="/missions/add"
            elevation="4"
          >
            {{ t('home.loggedIn.emptyMissions.launchFirstMission') }}
          </v-btn>
        </div>
      </v-alert>

      <div v-else>
          <!-- Active Challenges -->
          <div v-if="activeChallenges.length > 0">
            <MyChallengeSection
              v-if="activeQuests.length"
              :challenges="activeQuests"
              grid-class="quests-grid mb-6"
              :current-user-id="currentUserId"
              @challenge-click="handleChallengeClick"
              @update="handleDialogUpdate"
            />

            <MyChallengeSection
              v-if="activeRituals.length"
              :challenges="activeRituals"
              grid-class="rituals-grid"
              :current-user-id="currentUserId"
              @challenge-click="handleChallengeClick"
              @update="handleDialogUpdate"
            />
          </div>

          <!-- Upcoming Challenges -->
          <div v-if="upcomingChallenges.length > 0" :class="{ 'upcoming-section': activeChallenges.length > 0 }">
            <h2 class="section-title mb-4" :class="{ 'mt-8': activeChallenges.length > 0 }">{{ t('challenges.upcoming') }}</h2>
            <MyChallengeSection
              :challenges="upcomingChallenges"
              grid-class="challenges-grid"
              :current-user-id="currentUserId"
              disabled
              @challenge-click="handleChallengeClick"
            />
          </div>

          <!-- Finished Challenges -->
          <div v-if="finishedChallenges.length > 0" :class="{ 'finished-section': activeChallenges.length > 0 }">
            <MyChallengeSection
              :challenges="finishedChallenges"
              grid-class="challenges-grid"
              :class="activeChallenges.length > 0 ? 'mt-8' : undefined"
              :current-user-id="currentUserId"
              @challenge-click="handleChallengeClick"
            />
          </div>
        </div>
    </div>

    <!-- Challenge Details Dialog -->
    <ChallengeDetailsDialog
      v-model="detailsDialogOpen"
      :challenge="selectedChallenge"
      :is-owner="selectedIsOwner"
      :is-participant="selectedIsParticipant"
      :show-join-button="false"
      :show-leave-button="showDialogLeaveButton"
      :join-loading="selectedJoinLoading"
      :leave-loading="selectedLeaveLoading"
      :save-loading="false"
      :save-error="''"
      :delete-loading="false"
      @update="handleDialogUpdate"
      @join="handleDialogJoin"
      @leave="handleDialogLeave"
    />
  </div>
</template>

<script setup>
import { onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useI18n } from 'vue-i18n'
import MyChallengeSection from './MyChallengeSection.vue'
import ChallengeSkeletonGrid from './ChallengeSkeletonGrid.vue'
import ChallengeDetailsDialog from './ChallengeDetailsDialog.vue'
import { useMyChallenges } from '../composables/useMyChallenges'
import { useChallengeDialog } from '../composables/useChallengeDialog'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const currentUserId = computed(() => userStore.userId)

const {
  challenges,
  loading,
  error,
  joiningId,
  leavingId,
  watchingId,
  activeQuests,
  activeRituals,
  upcomingChallenges,
  finishedChallenges,
  activeChallenges,
  fetchChallenges,
  joinChallenge,
  leaveChallenge,
  watchChallenge,
  unwatchChallenge,
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
  handleOwnerNavigated,
  refreshSelectedChallenge,
  consumeChallengeIdFromRoute
} = useChallengeDialog({
  challenges,
  currentUserId,
  error,
  fetchChallenges,
  leaveChallenge,
  leavingId
})

configureDialogSync({ selectedChallenge, refreshSelectedChallenge })

const selectedJoinLoading = computed(() => {
  if (!selectedChallenge.value) return false
  return joiningId.value === selectedChallenge.value._id
})

async function handleDialogJoin() {
  if (!selectedChallenge.value) return
  await joinChallenge(selectedChallenge.value)
}

onMounted(async () => {
  await fetchChallenges()
  await consumeChallengeIdFromRoute(router, route, route.query.challengeId)
})

watch(() => route.query.challengeId, (newChallengeId) => {
  consumeChallengeIdFromRoute(router, route, newChallengeId)
})
</script>

<style scoped>
.my-challenges {
  width: 100%;
  max-width: 1400px; /* Ограничиваем ширину для больших мониторов */
  margin: 0 auto;
  padding: 16px;
}

.content-section {
  position: relative;
  min-height: 400px;
}

.challenges-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 8px 0;
  width: 100%;
}

@media (min-width: 600px) {
  .challenges-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 16px 0;
  }
}

@media (min-width: 960px) {
  .challenges-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Quests grid - 2 per row */
.quests-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 8px 0;
  width: 100%;
}

@media (min-width: 600px) {
  .quests-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 16px 0;
  }
}

/* Rituals grid - 3 per row */
.rituals-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 8px 0;
  width: 100%;
}

@media (min-width: 600px) {
  .rituals-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    padding: 16px 0;
  }
}

@media (min-width: 960px) {
  .rituals-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 16px;
}

@media (min-width: 600px) {
  .section-title {
    font-size: 1.5rem;
  }
}

.finished-section {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  padding-top: 24px;
  margin-top: 24px;
}

.challenges-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

@media (max-width: 480px) {
  .challenges-grid-skeleton {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.info-message {
  background-color: #1a1e2e !important;
  border: 1px solid transparent;
  border-image: linear-gradient(to right, #a78bfa, #2dd4bf) 1 !important;
  color: #e2e8f0 !important;
  padding: 16px 20px !important;
  box-shadow: 0 0 15px rgba(45, 212, 191, 0.2) !important;
}

.info-message-icon {
  color: #2dd4bf !important;
  filter: drop-shadow(0 0 5px rgba(45, 212, 191, 0.5));
}

</style>

<style src="../assets/styles/challenge-skeleton.css"></style>
