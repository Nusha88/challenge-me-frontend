<template>
  <div :class="gridClass">
    <ChallengeSkeletonCard
      v-for="n in count"
      :key="n"
      :type="type"
      :variant="variant"
      :card-class="cardClass"
    />
  </div>
</template>

<script setup>
import ChallengeSkeletonCard from './ChallengeSkeletonCard.vue'

defineProps({
  count: {
    type: Number,
    default: 6
  },
  gridClass: {
    type: [String, Array, Object],
    default: 'challenges-grid-skeleton'
  },
  type: {
    type: String,
    default: 'image, list-item-two-line, text'
  },
  variant: {
    type: String,
    default: 'card'
  },
  cardClass: {
    type: [String, Array, Object],
    default: ''
  }
})
</script>
