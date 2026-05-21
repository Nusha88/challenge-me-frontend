<template>
  <div class="duration-selector" :class="{ 'duration-selector--disabled': disabled }">
    <p class="field-label">{{ t('challenges.duration') }}</p>
    <div v-if="durationError" class="error-message mb-2">{{ durationError }}</div>
    <div class="duration-toggle-wrapper" :class="{ 'error-border': durationError }">
      <v-btn-toggle
        v-model="duration"
        mandatory
        class="custom-chips-group"
        :disabled="disabled"
      >
        <v-btn value="7" class="chip-btn">
          <span>{{ t('challenges.durationOptions.7days') }}</span>
        </v-btn>
        <v-btn value="21" class="chip-btn">
          <v-icon left size="18">mdi-fire</v-icon>
          <span>{{ t('challenges.durationOptions.21days') }}</span>
        </v-btn>
        <v-btn value="30" class="chip-btn">
          <span>{{ t('challenges.durationOptions.30days') }}</span>
        </v-btn>
        <v-btn value="custom" class="chip-btn custom-choice" @click="onCustomChipClick">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>
    <div v-if="duration === 'custom' && showSlider" class="custom-slider-container">
      <template v-if="lgAndUp">
        <div class="days-display">
          {{ customDays }} {{ t('challenges.days') }}
        </div>
        <v-slider
          v-model="customDays"
          min="1"
          max="365"
          step="1"
          hide-details
          class="ignite-slider"
          :disabled="disabled"
        />
      </template>
      <template v-else>
        <v-text-field
          v-model.number="customDays"
          type="number"
          min="1"
          max="365"
          hide-details
          density="compact"
          variant="outlined"
          class="custom-days-number-input"
          :label="t('challenges.customDuration')"
          :disabled="disabled"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  durationError: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const duration = defineModel('duration', { type: String, default: '21' })
const customDuration = defineModel('customDuration', { type: String, default: '' })

const { t } = useI18n()
const { lgAndUp } = useDisplay()

const showSlider = ref(false)
const customDays = ref(60)

function onCustomChipClick() {
  if (props.disabled) {
    return
  }

  toggleCustomSlider()
}

function toggleCustomSlider() {
  if (duration.value !== 'custom') {
    return
  }

  showSlider.value = !showSlider.value
  if (showSlider.value) {
    if (!customDuration.value) {
      customDays.value = 60
      customDuration.value = '60'
    } else {
      customDays.value = parseInt(customDuration.value, 10) || 60
    }
  }
}

watch(duration, (newVal) => {
  if (newVal !== 'custom') {
    showSlider.value = false
    customDuration.value = ''
  } else if (customDuration.value) {
    showSlider.value = true
    customDays.value = parseInt(customDuration.value, 10) || 60
  }
}, { immediate: true })

watch(customDays, (newVal) => {
  const n = Number(newVal)
  if (!Number.isFinite(n)) {
    customDays.value = 1
    return
  }
  const clamped = Math.min(365, Math.max(1, Math.round(n)))
  if (clamped !== newVal) {
    customDays.value = clamped
    return
  }
  customDuration.value = String(clamped)
})
</script>

<style scoped>
.duration-selector {
  margin: 0;
}

.duration-selector--disabled {
  opacity: 0.65;
  pointer-events: none;
}

.duration-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

@media (max-width: 600px) {
  .duration-toggle-wrapper {
    justify-content: center !important;
    width: 100% !important;
  }

  .duration-toggle-wrapper .custom-chips-group {
    width: 100% !important;
    justify-content: center !important;
  }
}

.custom-chips-group {
  display: flex;
  gap: 12px;
  background: transparent !important;
  flex-wrap: wrap;
}

.custom-chips-group .chip-btn {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 12px !important;
  height: 48px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  padding: 0 20px !important;
  box-shadow: none !important;
}

.custom-chips-group .chip-btn:hover:not(.v-btn--active) {
  border-color: #e2e8f0 !important;
}

.custom-chips-group .chip-btn.v-btn--active {
  background: #7048E8 !important;
  color: white !important;
  box-shadow: 0 0 15px rgba(112, 72, 232, 0.4);
}

.custom-chips-group .chip-btn.v-btn--active .v-icon {
  color: #ffffff !important;
}

.custom-chips-group .chip-btn .v-icon {
  color: #4FD1C5 !important;
  margin-right: 6px;
}

.custom-chips-group .custom-choice {
  min-width: 50px !important;
  padding: 0 !important;
}

.custom-chips-group .custom-choice .v-icon {
  margin-right: 0 !important;
}

@media (max-width: 600px) {
  .custom-chips-group .chip-btn {
    height: 40px !important;
    padding: 0 12px !important;
    font-size: 0.85rem !important;
    border-radius: 10px !important;
  }

  .custom-chips-group {
    gap: 8px !important;
    justify-content: center !important;
  }
}

.custom-slider-container {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 15px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  animation: fadeIn 0.3s ease;
}

.custom-slider-container .days-display {
  min-width: 80px;
  font-weight: 800;
  font-size: 1.2rem;
  text-align: center;
  color: #4FD1C5 !important;
  padding-right: 15px;
}

.custom-slider-container .custom-days-number-input :deep(.v-field) {
  background: rgba(255, 255, 255, 0.03);
}

.custom-slider-container .custom-days-number-input :deep(input) {
  color: #4fd1c5;
  font-weight: 800;
  font-size: 1.1rem;
}

.custom-slider-container .ignite-slider {
  flex-grow: 1;
}

.custom-slider-container .ignite-slider :deep(.v-slider-track__fill) {
  background: linear-gradient(90deg, #7e46c4, #4FD1C5) !important;
}

.custom-slider-container .ignite-slider :deep(.v-slider-thumb) {
  color: #7e46c4 !important;
  border: 3px solid white !important;
  box-shadow: 0 4px 10px rgba(126, 70, 196, 0.3) !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
