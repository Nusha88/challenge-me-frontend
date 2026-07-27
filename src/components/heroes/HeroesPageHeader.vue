<template>
  <header class="heroes-header">
    <div class="heroes-header-copy">
      <div class="heroes-header-title-row">
        <v-icon color="#4FD1C5" size="36" class="heroes-header-icon">mdi-shield-crown</v-icon>
        <div>
          <h1 class="heroes-title">{{ t('users.title') }}</h1>
          <p class="heroes-subtitle">{{ t('users.subtitle') }}</p>
        </div>
      </div>
      <p class="heroes-lead">{{ t('users.description') }}</p>
      <p v-if="totalUsers" class="heroes-meta">
        {{ totalUsers }} {{ t('users.active') }}
      </p>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  totalUsers: { type: Number, default: 0 }
})

const { t } = useI18n()
</script>

<style scoped>
.heroes-header {
  margin-bottom: clamp(20px, 3vw, 32px);
}

.heroes-header-copy {
  min-width: 0;
}

.heroes-header-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.heroes-header-icon {
  flex-shrink: 0;
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

.heroes-subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-teal, #4fd1c5);
}

.heroes-lead {
  margin: 0;
  max-width: 54ch;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
}

.heroes-meta {
  margin: 10px 0 0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--home-teal, #4fd1c5);
}
</style>
