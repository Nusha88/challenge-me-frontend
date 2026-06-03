<template>
  <transition-group name="staggered-fade" tag="div" class="challenges-grid">
    <ChallengeCard
      v-for="challenge in challenges"
      :key="challenge._id"
      :challenge="challenge"
      :current-user-id="currentUserId"
      :show-join-button="true"
      @click="$emit('open', $event)"
      @update="$emit('update')"
    />
  </transition-group>
</template>

<script setup>
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

defineEmits(['open', 'update'])
</script>

<style scoped>
.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 20px 4px;
}

.staggered-fade-enter-active,
.staggered-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.staggered-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.staggered-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.challenges-grid > * {
  transition: all 0.3s ease-in-out !important;
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
