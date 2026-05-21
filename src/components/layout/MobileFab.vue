<template>
  <v-btn
    v-if="show"
    to="/missions/add"
    class="fab-button d-md-none start-mission-btn"
    color="primary"
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
  background: linear-gradient(135deg, #7E46C4, #6A11CB) !important;
  box-shadow: 0 4px 15px rgba(126, 70, 196, 0.4),
              0 0 20px rgba(126, 70, 196, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 1000;
  transition: transform 0.1s ease !important;
}

.fab-button:active {
  transform: scale(0.92) !important;
  filter: brightness(1.2) !important;
}
</style>
