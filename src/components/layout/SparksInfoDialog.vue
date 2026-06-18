<template>
  <v-dialog v-model="dialogModel" max-width="480" scrollable>
    <v-card class="sparks-info-card rounded-xl overflow-hidden">
      <v-card-title class="sparks-info-header">
        <div class="sparks-info-title-row">
          <span class="sparks-icon">✦</span>
          <span>{{ t('sparks.info.title') }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          class="sparks-info-close"
          @click="dialogModel = false"
        />
      </v-card-title>

      <v-card-text class="sparks-info-body">
        <p class="sparks-info-description">
          {{ t('sparks.info.description') }}
        </p>

        <div class="sparks-balance-pill">
          <span class="sparks-icon">✦</span>
          <span>{{ t('sparks.info.currentBalance', { count: balance }) }}</span>
        </div>

        <h3 class="sparks-info-subtitle">
          {{ t('sparks.info.usesTitle') }}
        </h3>

        <ul class="sparks-uses-list">
          <li
            v-for="use in sparksUses"
            :key="use.key"
            class="sparks-use-item"
          >
            <div class="sparks-use-text">
              <span class="sparks-use-name">{{ t(`sparks.info.${use.key}`) }}</span>
              <span class="sparks-use-hint">{{ t(`sparks.info.${use.key}Hint`) }}</span>
            </div>
            <span class="sparks-use-cost">
              <span class="sparks-icon">✦</span>
              {{ use.cost }}
            </span>
          </li>
        </ul>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const sparksUses = [
  { key: 'freezeDay', cost: 50 },
  { key: 'secondChance', cost: 30 },
  { key: 'customization', cost: 100 }
]

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
</script>

<style scoped>
.sparks-info-card {
  background: rgba(13, 13, 23, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(12px);
  color: #ffffff;
}

.sparks-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 8px;
}

.sparks-info-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 800;
  line-height: 1.3;
}

.sparks-info-close {
  color: rgba(255, 255, 255, 0.7) !important;
  flex-shrink: 0;
}

.sparks-info-body {
  padding: 8px 20px 24px !important;
}

.sparks-info-description {
  margin: 0 0 16px;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
}

.sparks-balance-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.22);
  font-weight: 800;
  font-size: 0.875rem;
  color: #ffffff;
}

.sparks-info-subtitle {
  margin: 0 0 12px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.sparks-uses-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sparks-use-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sparks-use-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.sparks-use-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sparks-use-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: #ffffff;
}

.sparks-use-hint {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.55);
}

.sparks-use-cost {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-weight: 800;
  font-size: 0.9375rem;
  color: #ffc107;
}

.sparks-icon {
  color: #ffc107;
  font-size: 0.85rem;
  line-height: 1;
  filter: drop-shadow(0 0 6px rgba(255, 193, 7, 0.45));
}
</style>
