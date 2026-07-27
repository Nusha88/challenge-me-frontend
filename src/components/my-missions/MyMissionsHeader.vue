<template>
  <header class="my-missions-header">
    <div class="my-missions-header-copy">
      <div class="my-missions-header-title-row">
        <v-icon color="#4FD1C5" size="36" class="my-missions-header-icon">mdi-shield-account</v-icon>
        <div>
          <h1 class="my-missions-title">{{ t('myChallenges.title') }}</h1>
          <p class="my-missions-subtitle">{{ t('myChallenges.subtitle') }}</p>
        </div>
      </div>
      <p class="my-missions-lead">{{ t('myChallenges.description') }}</p>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.my-missions-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.my-missions-header-copy {
  min-width: 0;
}

.my-missions-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.my-missions-header-icon {
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px rgba(79, 209, 197, 0.35));
}

.my-missions-title {
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.15;
}

.my-missions-subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.my-missions-lead {
  margin: 0;
  max-width: 54ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}
</style>
