<template>
  <div class="empty-radar-container">
    <div class="radar-ping">
      <div class="ring"></div>
      <div class="ring"></div>
      <div class="ring"></div>
      <v-icon color="teal-accent-4" size="48">mdi-radar</v-icon>
    </div>

    <p class="empty-text-dark mt-6">
      {{ t('watched.emptyStateStart') }}
      <span>{{ t('watched.emptyStateHighlight') }}</span>{{ t('watched.emptyStateEnd') }}
    </p>

    <v-btn
      color="teal-accent-4"
      variant="outlined"
      rounded="pill"
      class="mt-4"
      to="/heroes"
    >
      {{ t('watched.findHeroes') }}
    </v-btn>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.empty-radar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.radar-ping {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(79, 209, 197, 0.3);
  border-radius: 50%;
  animation: radar-ring 3s infinite ease-out;
}

.ring:nth-child(2) {
  animation-delay: 1s;
}

.ring:nth-child(3) {
  animation-delay: 2s;
}

@keyframes radar-ring {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.empty-text-dark {
  color: rgba(255, 255, 255, 0.6);
  max-width: 400px;
}

.empty-text-dark span {
  color: #4fd1c5;
  font-weight: 700;
}
</style>
