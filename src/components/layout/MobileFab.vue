<template>
  <v-btn
    v-if="show"
    to="/missions/add"
    class="fab-button d-md-none app-cta-primary start-mission-btn"
    icon="mdi-plus"
    size="large"
    location="bottom end"
    app
  ></v-btn>
</template>

<script setup>
defineProps({
  show: { type: Boolean, default: false }
})
</script>

<style scoped>
.fab-button {
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 1000;
  width: 56px !important;
  height: 56px !important;
  min-width: 56px !important;
  border-radius: 50% !important;
  transition: transform 0.1s var(--home-ease, ease) !important;
}

.fab-button:active {
  transform: scale(0.92) !important;
  filter: brightness(1.1) !important;
}

@media (prefers-reduced-motion: reduce) {
  .fab-button:active {
    transform: none !important;
  }
}
</style>
