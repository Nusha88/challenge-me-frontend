<template>
  <div class="upcoming-section">
    <MissionSectionDivider
      :label="t('allChallenges.sections.upcoming')"
      icon="mdi-clock-outline"
      :count="challenges.length"
      flush-top
    />
    <div class="challenges-grid">
      <div
        v-for="challenge in challenges"
        :key="challenge._id"
        class="upcoming-card-cell"
        :class="{ 'upcoming-card-disabled': !isOwner(challenge) }"
      >
        <ChallengeCard
          :challenge="challenge"
          :current-user-id="currentUserId"
          :show-join-button="true"
          :disabled="!isOwner(challenge)"
          @click="handleOpen(challenge)"
        />
        <div v-if="!isOwner(challenge)" class="upcoming-blur-overlay" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ChallengeCard from '../ChallengeCard.vue'
import MissionSectionDivider from '../MissionSectionDivider.vue'
import { isChallengeOwner } from '../../utils/challengeStatus'

const props = defineProps({
  challenges: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['open'])

const { t } = useI18n()

function isOwner(challenge) {
  return isChallengeOwner(challenge, props.currentUserId)
}

function handleOpen(challenge) {
  if (!isOwner(challenge)) return
  emit('open', challenge)
}
</script>

<style scoped>
.upcoming-section {
  margin-bottom: 8px;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 4px;
}

.upcoming-card-cell {
  position: relative;
  min-width: 0;
  width: 100%;
}

.upcoming-card-cell :deep(.challenge-card) {
  width: 100%;
}

.upcoming-card-disabled {
  pointer-events: none;
}

.upcoming-blur-overlay {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: rgba(13, 17, 28, 0.38);
  backdrop-filter: blur(3px);
  pointer-events: none;
}

@media (max-width: 600px) {
  .challenges-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (min-width: 601px) and (max-width: 1024px) {
  .challenges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
