<template>
  <div class="upcoming-section mt-8">
    <h2 class="section-title mb-4">{{ t('challenges.upcoming') }}</h2>
    <div class="challenges-grid">
      <div
        v-for="challenge in challenges"
        :key="challenge._id"
        class="upcoming-card-disabled"
      >
        <ChallengeCard
          :challenge="challenge"
          :current-user-id="currentUserId"
          :show-join-button="true"
          @click="$emit('open', $event)"
        />
        <div class="upcoming-blur-overlay" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ChallengeCard from '../ChallengeCard.vue'

defineProps({
  challenges: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: [String, Number],
    default: null
  }
})

defineEmits(['open'])

const { t } = useI18n()
</script>

<style scoped>
.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 20px 4px;
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

.upcoming-section {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  padding-top: 24px;
  margin-top: 24px;
}

.upcoming-card-disabled {
  position: relative;
}

.upcoming-card-disabled :deep(.challenge-card) {
  pointer-events: none;
}

.upcoming-blur-overlay {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: rgba(13, 17, 28, 0.38);
  backdrop-filter: blur(3px);
  z-index: 5;
  pointer-events: all;
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
