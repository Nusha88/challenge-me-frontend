<template>
  <div class="header-section text-left mb-10 reveal-animation">
    <div class="d-flex align-center mb-1">
      <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-radar</v-icon>
      <h1 class="page-title-dark">{{ t('watched.title') }}</h1>
    </div>
    <div class="text-overline text-teal-accent-4 tracking-widest ml-13">{{ t('watched.subtitle') }}</div>
    <p class="journal-subtitle-dark mt-2">{{ t('watched.description') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.page-title-dark {
  font-size: 2rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.journal-subtitle-dark {
  color: rgba(255, 255, 255, 0.6);
  max-width: 600px;
}

:deep(.mdi-radar) {
  animation: radar-pulse 4s infinite linear;
}

@keyframes radar-pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .page-title-dark {
    font-size: 1.5rem !important;
  }

  .ml-13 {
    margin-left: 42px !important;
  }
}
</style>
