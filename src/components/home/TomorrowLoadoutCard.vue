<template>
  <div v-if="missionCount > 0 || stepCount > 0" class="loadout-card home-glass-card">
    <p class="home-section-title">{{ t('home.loggedIn.loadout.title') }}</p>
    <div class="loadout-pills">
      <span class="loadout-pill">
        <v-icon size="16">mdi-flag-outline</v-icon>
        {{ t('home.loggedIn.loadout.missions', { count: missionCount }) }}
      </span>
      <span class="loadout-pill">
        <v-icon size="16">mdi-shoe-print</v-icon>
        {{ t('home.loggedIn.loadout.steps', { count: stepCount }) }}
      </span>
    </div>
  </div>
  <div v-else class="loadout-card home-glass-card home-glass-card--empty">
    <p class="home-section-title">{{ t('home.loggedIn.loadout.title') }}</p>
    <p class="loadout-empty">{{ t('home.loggedIn.loadout.empty') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  missionCount: { type: Number, default: 0 },
  stepCount: { type: Number, default: 0 }
})

const { t } = useI18n()
</script>

<style scoped>
.loadout-card {
  width: 100%;
  padding: 18px 20px;
  margin-bottom: 1rem;
}

.loadout-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.loadout-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--home-radius-pill, 999px);
  background: rgba(79, 209, 197, 0.08);
  border: 1px solid rgba(79, 209, 197, 0.28);
  color: var(--home-text, #f1f5f9);
  font-size: 0.85rem;
  font-weight: 600;
}

.loadout-pill .v-icon {
  color: var(--home-teal, #4fd1c5) !important;
}

.loadout-empty {
  margin: 0;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.9rem;
  line-height: 1.5;
}
</style>
