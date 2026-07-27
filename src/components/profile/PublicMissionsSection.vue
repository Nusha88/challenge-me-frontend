<template>
  <section class="public-missions">
    <p
      v-if="!liveMissions.length && !finishedMissions.length"
      class="missions-empty missions-empty--all"
    >
      {{ t('profile.noMissions') }}
    </p>

    <template v-else>
      <MissionSectionDivider
        :label="t('profile.liveMissions')"
        icon="mdi-play-circle-outline"
        :count="liveMissions.length"
        flush-top
      />

      <div v-if="liveMissions.length" class="missions-grid">
        <ChallengeCard
          v-for="challenge in liveMissions"
          :key="challenge._id"
          :challenge="challenge"
          :current-user-id="currentUserId"
          :progress-user-id="progressUserId"
          :show-join-button="false"
          @click="handleClick"
        />
      </div>
      <p v-else class="missions-empty">{{ t('profile.noLiveMissions') }}</p>

      <MissionSectionDivider
        :label="t('challenges.archive')"
        icon="mdi-archive-outline"
        :count="finishedMissions.length"
      />

      <div v-if="finishedMissions.length" class="missions-grid">
        <ChallengeCard
          v-for="challenge in finishedMissions"
          :key="challenge._id"
          :challenge="challenge"
          :current-user-id="currentUserId"
          :progress-user-id="progressUserId"
          :show-join-button="false"
          @click="handleClick"
        />
      </div>
      <p v-else class="missions-empty">{{ t('profile.noArchiveMissions') }}</p>
    </template>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ChallengeCard from '../ChallengeCard.vue'
import MissionSectionDivider from '../MissionSectionDivider.vue'
import { APP_EVENTS, dispatchAppEvent } from '../../utils/appEvents'

defineProps({
  liveMissions: { type: Array, default: () => [] },
  finishedMissions: { type: Array, default: () => [] },
  currentUserId: { type: [String, Number], default: null },
  progressUserId: { type: [String, Number], default: null }
})

const { t } = useI18n()

function handleClick(challenge) {
  if (!challenge?._id) return
  dispatchAppEvent(APP_EVENTS.OPEN_CHALLENGE, { challengeId: challenge._id })
}
</script>

<style scoped>
.public-missions {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.missions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
}

.missions-empty {
  margin: 0 0 16px;
  font-size: 0.9rem;
  color: var(--home-text-dim, #94a3b8);
}

.missions-empty--all {
  margin-top: -8px;
}
</style>
