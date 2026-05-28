<template>
  <v-card
    v-if="variant !== 'bare'"
    class="challenge-skeleton-card rounded-xl overflow-hidden"
    :class="cardClass"
    variant="flat"
  >
    <v-skeleton-loader
      :type="type"
      :class="loaderClasses"
      theme="dark"
    />
  </v-card>
  <v-skeleton-loader
    v-else
    :type="type"
    :class="loaderClasses"
    theme="dark"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'image, list-item-two-line, text'
  },
  variant: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'main-ritual', 'bare'].includes(value)
  },
  cardClass: {
    type: [String, Array, Object],
    default: ''
  }
})

const loaderClasses = computed(() => {
  const variantClass =
    props.variant === 'main-ritual'
      ? 'challenge-skeleton-loader--main-ritual'
      : props.variant === 'bare'
        ? 'challenge-skeleton-loader--bare'
        : 'challenge-skeleton-loader--card'

  return ['challenge-skeleton-loader', variantClass]
})
</script>

<style src="../assets/styles/challenge-skeleton.css"></style>
