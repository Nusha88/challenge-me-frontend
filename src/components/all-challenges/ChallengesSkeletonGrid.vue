<template>
  <ChallengeSkeletonGrid :count="count" grid-class="challenges-grid" />
</template>

<script setup>
import ChallengeSkeletonGrid from '../ChallengeSkeletonGrid.vue'

defineProps({
  count: {
    type: Number,
    default: 6
  }
})
</script>
