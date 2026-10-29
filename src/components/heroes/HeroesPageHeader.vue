<template>
  <header class="heroes-header">
    <div class="heroes-header-title-row">
      <v-icon color="#4FD1C5" size="36" class="heroes-header-icon">mdi-shield-crown</v-icon>
      <div>
        <h1 class="heroes-title">{{ t('users.title') }}</h1>
        <p class="heroes-lead">{{ t('users.description') }}</p>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.heroes-header {
  margin-bottom: clamp(16px, 2.5vw, 24px);
}

.heroes-header-title-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.heroes-header-icon {
  flex-shrink: 0;
  margin-top: 2px;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.35));
}

.heroes-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.heroes-lead {
  margin: 6px 0 0;
  max-width: 46ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.92rem;
  line-height: 1.45;
}
</style>
