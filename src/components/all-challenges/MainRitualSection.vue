<template>
  <div class="main-ritual-section">
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="#4FD1C5"
      height="4"
      class="mb-4"
    />

    <div v-if="loading" class="main-ritual-loading-wrapper">
      <ChallengeSkeletonCard
        variant="main-ritual"
        type="image, list-item-two-line, actions"
      />
    </div>

    <MainRitualCard
      v-else-if="mainRitual"
      :challenge="mainRitual"
      :current-user-id="currentUserId"
      :joining="joiningId === mainRitual._id"
      @join="$emit('join', $event)"
      @click="$emit('open', $event)"
    />
  </div>
</template>

<script setup>
import MainRitualCard from '../MainRitualCard.vue'
import ChallengeSkeletonCard from '../ChallengeSkeletonCard.vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  mainRitual: {
    type: Object,
    default: null
  },
  currentUserId: {
    type: [String, Number],
    default: null
  },
  joiningId: {
    type: [String, Number],
    default: null
  }
})

defineEmits(['join', 'open'])
</script>

<style scoped>
.main-ritual-section {
  margin-bottom: clamp(16px, 2.5vw, 28px);
}

.main-ritual-loading-wrapper {
  position: relative;
  background: var(--home-surface, rgba(15, 23, 42, 0.5));
  border-radius: var(--home-radius, 22px);
  border: 1px solid var(--home-border, rgba(79, 209, 197, 0.1));
}

@media (max-width: 600px) {
  .main-ritual-section {
    margin-bottom: 14px;
  }
}
</style>

<style src="../../assets/styles/challenge-skeleton.css"></style>
