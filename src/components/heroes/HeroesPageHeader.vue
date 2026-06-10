<template>
  <div class="header-section text-left mb-10 reveal-animation">
    <div class="d-flex align-center justify-space-between flex-wrap">
      <div>
        <div class="d-flex align-center mb-1">
          <v-icon color="teal-accent-4" size="40" class="mr-3">mdi-shield-crown</v-icon>
          <h1 class="page-title-dark">{{ t('users.title') }}</h1>
        </div>
        <div class="text-overline text-teal-accent-4 tracking-widest ml-13">{{ t('users.subtitle') }}</div>
        <p class="journal-subtitle-dark mt-2">{{ t('users.description') }}</p>
      </div>

      <div v-if="totalUsers" class="hero-counter-block d-none d-sm-flex">
        <div class="text-right">
          <div class="text-overline grey-text">{{ t('users.totalStrength') }}</div>
          <div class="hero-count">{{ totalUsers }} {{ t('users.active') }}</div>
        </div>
        <v-icon color="teal-accent-4" size="32" class="ml-4 opacity-50">mdi-account-group</v-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  totalUsers: { type: Number, default: 0 }
})

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

.grey-text {
  color: rgba(255, 255, 255, 0.5) !important;
}

.tracking-widest {
  letter-spacing: 4px !important;
}

.hero-counter-block {
  background: rgba(79, 209, 197, 0.05);
  border-left: 1px solid rgba(79, 209, 197, 0.3);
  padding: 8px 20px;
  border-radius: 0 12px 12px 0;
}

.hero-count {
  font-family: monospace;
  font-size: 1.5rem;
  font-weight: 900;
  color: #4fd1c5;
  text-transform: uppercase;
  line-height: 1;
}

@media (max-width: 480px) {
  .page-title-dark {
    font-size: 1.5rem !important;
  }

  .ml-13 {
    margin-left: 42px !important;
  }

  .hero-counter-block {
    margin-top: 16px;
    width: 100%;
    border-left: 2px solid #4fd1c5;
    border-radius: 0;
    padding: 4px 12px;
  }

  .hero-count {
    font-size: 1.2rem !important;
  }
}
</style>
