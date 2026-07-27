<template>
  <header class="watched-header">
    <div class="watched-header-copy">
      <div class="watched-header-title-row">
        <v-icon color="#4FD1C5" size="36" class="watched-header-icon">mdi-radar</v-icon>
        <div>
          <h1 class="watched-title">{{ t('watched.title') }}</h1>
          <p class="watched-subtitle">{{ t('watched.subtitle') }}</p>
        </div>
      </div>
      <p class="watched-lead">{{ t('watched.description') }}</p>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.watched-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.watched-header-copy {
  min-width: 0;
}

.watched-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.watched-header-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.35));
  animation: radar-pulse 4s infinite linear;
}

.watched-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.watched-subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.watched-lead {
  margin: 0;
  max-width: 54ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}

@keyframes radar-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.75;
    transform: scale(1.08);
  }
}
</style>
