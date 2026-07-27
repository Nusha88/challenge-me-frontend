<template>
  <div class="quest-progress-panel">
    <p v-if="lead" class="progress-lead">{{ lead }}</p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  lead: { type: String, default: '' }
})
</script>

<style scoped>
.progress-lead {
  margin: 0 0 14px;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--home-text-dim, #94a3b8);
  max-width: 52ch;
}
</style>
