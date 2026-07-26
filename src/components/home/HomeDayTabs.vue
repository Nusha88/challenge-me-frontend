<template>
  <div class="home-day-tabs">
    <v-tabs :model-value="modelValue" class="day-tabs" bg-color="transparent" @update:model-value="$emit('update:modelValue', $event)">
      <v-tab value="today">{{ t('home.loggedIn.tabs.today') }}</v-tab>
      <v-tab value="tomorrow">{{ t('home.loggedIn.tabs.tomorrow') }}</v-tab>
    </v-tabs>

    <button
      v-if="freezeConfig"
      type="button"
      class="freeze-chip"
      :disabled="!hasEnoughSparks || freezeLoading"
      :title="!hasEnoughSparks ? t('sparks.rituals.insufficientSparks') : ''"
      @click="$emit('freeze')"
    >
      <v-icon size="18">{{ freezeConfig.icon }}</v-icon>
      <span class="freeze-chip-label">{{ t(freezeConfig.labelKey) }}</span>
      <span class="home-cost-badge">
        <span>|</span>
        <span>{{ freezeCost }}</span>
        <span class="sparks-icon">✦</span>
      </span>
      <v-progress-circular
        v-if="freezeLoading"
        indeterminate
        size="16"
        width="2"
        class="freeze-chip-spinner"
      />
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: String, required: true },
  freezeConfig: { type: Object, default: null },
  freezeCost: { type: Number, default: 50 },
  hasEnoughSparks: { type: Boolean, default: true },
  freezeLoading: { type: Boolean, default: false }
})

defineEmits(['update:modelValue', 'freeze'])

const { t } = useI18n()
</script>

<style scoped>
.home-day-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.day-tabs {
  width: auto;
  flex: 1;
  align-self: flex-start;
}

.day-tabs :deep(.v-tab) {
  color: rgba(241, 245, 249, 0.55) !important;
  border-radius: 12px !important;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.02em;
}

.day-tabs :deep(.v-tab--selected) {
  color: var(--home-teal, #4fd1c5) !important;
}

.day-tabs :deep(.v-tab__slider) {
  background: var(--home-teal, #4fd1c5) !important;
  height: 3px;
  border-radius: 999px;
}

.freeze-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(162, 89, 255, 0.45);
  border-radius: var(--home-radius-pill, 999px);
  background: linear-gradient(135deg, rgba(108, 71, 255, 0.85), rgba(162, 89, 255, 0.85));
  color: #fff;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--home-glow-purple, 0 0 16px rgba(112, 72, 232, 0.35));
  transition:
    transform 0.25s var(--home-ease, ease),
    box-shadow 0.25s var(--home-ease, ease),
    opacity 0.25s var(--home-ease, ease);
}

.freeze-chip:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 24px rgba(162, 89, 255, 0.55);
}

.freeze-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.freeze-chip-label {
  white-space: nowrap;
}

.freeze-chip-spinner {
  margin-left: 2px;
}

@media (max-width: 959px) {
  .home-day-tabs {
    flex-direction: column;
    align-items: stretch;
  }

  .day-tabs,
  .freeze-chip {
    width: 100%;
  }

  .freeze-chip {
    justify-content: center;
  }
}
</style>
