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
      <div v-if="loading" class="challenges-grid-skeleton">
  <v-card
    v-for="n in 6"
    :key="n"
    class="skeleton-card-dark rounded-xl overflow-hidden mb-6"
    variant="flat"
  >
    <v-skeleton-loader
      type="image, list-item-two-line, text"
      class="custom-skeleton"
    ></v-skeleton-loader>
  </v-card>
</div>

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
              :joining-id="joiningId"
              :leaving-id="leavingId"
              :watching-id="watchingId"
              @challenge-click="handleChallengeClick"
              @join="joinChallenge"
              @leave="leaveChallenge"
              @watch="watchChallenge"
              @unwatch="unwatchChallenge"
              @owner-navigated="handleOwnerNavigated"
            />

            <MyChallengeSection
              v-if="activeRituals.length"
              :challenges="activeRituals"
              grid-class="rituals-grid"
              :current-user-id="currentUserId"
              :joining-id="joiningId"
              :leaving-id="leavingId"
              :watching-id="watchingId"
              @challenge-click="handleChallengeClick"
              @join="joinChallenge"
              @leave="leaveChallenge"
              @watch="watchChallenge"
              @unwatch="unwatchChallenge"
              @owner-navigated="handleOwnerNavigated"
            />
          </div>

          <!-- Upcoming Challenges -->
          <div v-if="upcomingChallenges.length > 0" :class="{ 'upcoming-section': activeChallenges.length > 0 }">
            <h2 class="section-title mb-4" :class="{ 'mt-8': activeChallenges.length > 0 }">{{ t('challenges.upcoming') }}</h2>
            <MyChallengeSection
              :challenges="upcomingChallenges"
              grid-class="challenges-grid"
              :current-user-id="currentUserId"
              :joining-id="joiningId"
              :leaving-id="leavingId"
              :watching-id="watchingId"
              disabled
              @challenge-click="handleChallengeClick"
              @join="joinChallenge"
              @leave="leaveChallenge"
              @watch="watchChallenge"
              @unwatch="unwatchChallenge"
              @owner-navigated="handleOwnerNavigated"
            />
          </div>

          <!-- Finished Challenges -->
          <div v-if="finishedChallenges.length > 0" :class="{ 'finished-section': activeChallenges.length > 0 }">
            <MyChallengeSection
              :challenges="finishedChallenges"
              grid-class="challenges-grid"
              :class="activeChallenges.length > 0 ? 'mt-8' : undefined"
              :current-user-id="currentUserId"
              :joining-id="joiningId"
              :leaving-id="leavingId"
              :watching-id="watchingId"
              @challenge-click="handleChallengeClick"
              @join="joinChallenge"
              @leave="leaveChallenge"
              @watch="watchChallenge"
              @unwatch="unwatchChallenge"
              @owner-navigated="handleOwnerNavigated"
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
import { onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useI18n } from 'vue-i18n'
import MyChallengeSection from './MyChallengeSection.vue'
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

/* Контейнер сетки (используй те же настройки, что и для реальной сетки) */
.challenges-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

/* Темная подложка карточки */
.skeleton-card-dark {
  background: rgba(15, 23, 42, 0.6) !important; /* Цвет фона карточки */
  border: 1px solid rgba(79, 209, 197, 0.1) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Глубокая кастомизация костей скелетона */
:deep(.custom-skeleton) {
  background: transparent !important;
}

/* Цвет самих "костей" */
:deep(.v-skeleton-loader__bone) {
  background: rgba(255, 255, 255, 0.05) !important;
}

/* Эффект блика (анимация перелива) */
:deep(.v-skeleton-loader__bone::after) {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(79, 209, 197, 0.08), /* Бирюзовое свечение вместо белого */
    transparent
  ) !important;
}

/* Настройка высоты элементов */
:deep(.v-skeleton-loader__image) {
  height: 180px !important;
}

:deep(.v-skeleton-loader__list-item-two-line) {
  padding: 16px !important;
  background: transparent !important;
}

:deep(.v-skeleton-loader__text) {
  margin: 0 16px 16px 16px !important;
  max-width: 80%;
  height: 8px !important; /* Имитация тонкого прогресс-бара */
}

/* Адаптация под мобилки */
@media (max-width: 480px) {
  .challenges-grid-skeleton {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
.shadow-neon-line {
  box-shadow: 0 0 10px rgba(79, 209, 197, 0.5);
  border-radius: 4px;
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

/* Фикс белого цвета для скелетонов, если тема не подхватилась */
:deep(.v-skeleton-loader) {
  background-color: rgba(15, 23, 42, 0.6) !important;
}

:deep(.v-skeleton-loader__bone) {
  background: rgba(255, 255, 255, 0.05) !important;
}
</style>
