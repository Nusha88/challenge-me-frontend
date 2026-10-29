<template>
  <header class="my-missions-header">
    <h1 class="my-missions-title">{{ t('myChallenges.title') }}</h1>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.my-missions-header {
  margin-bottom: clamp(16px, 2.5vw, 24px);
}

.my-missions-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}
</style>
