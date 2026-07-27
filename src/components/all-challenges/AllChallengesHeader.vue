<template>
  <header class="explore-header">
    <div class="explore-header-copy">
      <div class="explore-header-title-row">
        <v-icon color="#4FD1C5" size="36" class="explore-header-icon">mdi-compass-rose</v-icon>
        <div>
          <h1 class="explore-title">{{ t('allChallenges.title') }}</h1>
          <p class="explore-subtitle">{{ t('allChallenges.subtitle') }}</p>
        </div>
      </div>
      <p class="explore-lead">{{ t('allChallenges.description') }}</p>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.explore-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.explore-header-copy {
  min-width: 0;
}

.explore-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.explore-header-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.35));
}

.explore-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.explore-subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.explore-lead {
  margin: 0;
  max-width: 54ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}
</style>
