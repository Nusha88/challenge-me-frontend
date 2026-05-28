<template>
  <div>
    <v-progress-linear
      v-if="loading"
      indeterminate
      color="teal-accent-4"
      height="4"
      class="mb-6 shadow-neon-line"
    />

    <div v-if="loading" class="main-ritual-loading-wrapper mb-8">
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
.main-ritual-loading-wrapper {
  position: relative;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 24px;
  border: 1px solid rgba(79, 209, 197, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}
</style>

<style src="../../assets/styles/challenge-skeleton.css"></style>
