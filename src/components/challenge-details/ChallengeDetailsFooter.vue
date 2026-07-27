<template>
  <div ref="root" class="challenge-details-footer">
    <slot />
  </div>
</template>

<script setup>
import { ref } from 'vue'
const root = ref(null)
defineExpose({ root })
</script>

<style scoped>
.challenge-details-footer {
  display: contents;
}
</style>
