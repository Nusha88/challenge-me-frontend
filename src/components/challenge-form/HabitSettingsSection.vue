<template>
  <div>
    <div class="duration-frequency-row">
      <div class="duration-selector">
        <p class="field-label">{{ t('challenges.duration') }}</p>
        <div v-if="durationError" class="error-message mb-2">{{ durationError }}</div>
        <div class="duration-toggle-wrapper" :class="{ 'error-border': durationError }">
          <v-btn-toggle
            v-model="duration"
            mandatory
            class="custom-chips-group"
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
            <v-btn value="custom" class="chip-btn custom-choice" @click="toggleCustomSlider">
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
            />
          </template>
        </div>
      </div>

      <div class="frequency-selector">
        <p class="field-label">{{ t('challenges.frequency') }}</p>
        <div class="frequency-toggle-wrapper">
          <v-btn-toggle
            v-model="frequency"
            mandatory
            class="custom-chips-group"
          >
            <v-btn value="daily" class="chip-btn">
              <span>{{ t('challenges.frequencyOptions.daily') }}</span>
            </v-btn>
            <v-btn value="everyOtherDay" class="chip-btn">
              <span>{{ t('challenges.frequencyOptions.everyOtherDay') }}</span>
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>
    </div>

    <div class="start-time-selector">
      <p class="field-label">{{ t('challenges.start') }}</p>

      <div class="d-flex align-center gap-3">
        <v-btn-toggle
          v-model="startOption"
          mandatory
          class="custom-toggle-group"
        >
          <v-btn value="today" class="toggle-btn">
            <span>{{ t('challenges.startOptions.today') }}</span>
          </v-btn>
          <v-btn value="tomorrow" class="toggle-btn">
            <span>{{ t('challenges.startOptions.tomorrow') }}</span>
          </v-btn>
        </v-btn-toggle>

        <v-btn
          :class="['calendar-btn', { 'is-active': isCustomDate }]"
          variant="outlined"
          @click="showDatePicker = true"
        >
          <v-icon size="20">mdi-calendar-month-outline</v-icon>
          <span v-if="isCustomDate" class="ml-2">{{ formattedDate }}</span>
          <span v-else class="ml-2">{{ t('challenges.pickDate') }}</span>
        </v-btn>
      </div>

      <v-dialog v-model="showDatePicker" max-width="400">
        <v-date-picker
          :model-value="startDate"
          @update:model-value="handleDatePick"
        />
      </v-dialog>
    </div>

    <div class="social-settings-block mt-8">
      <div class="social-header d-flex align-center mb-4">
        <v-icon color="#7e46c4" class="mr-2">mdi-share-variant-outline</v-icon>
        <h3 class="text-h6 font-weight-bold">{{ t('challenges.accessCommunity') }}</h3>
      </div>

      <v-item-group v-model="privacy" mandatory>
        <v-row class="px-3">
          <v-col cols="12" md="6" class="pa-2">
            <v-item v-slot="{ isSelected, toggle }" value="private">
              <div
                :class="['mode-card', { active: isSelected }]"
                @click="toggle"
              >
                <div class="d-flex align-center justify-space-between mb-2">
                  <v-icon :color="isSelected ? '#7e46c4' : '#94a3b8'">mdi-lock-outline</v-icon>
                  <v-icon v-if="isSelected" color="#7e46c4" size="20">mdi-check-circle</v-icon>
                </div>
                <span class="mode-title">{{ t('challenges.personalPath') }}</span>
                <p class="mode-desc">{{ t('challenges.personalPathDesc') }}</p>
              </div>
            </v-item>
          </v-col>

          <v-col cols="12" md="6" class="pa-2">
            <v-item v-slot="{ isSelected, toggle }" value="public">
              <div
                :class="['mode-card', { active: isSelected }]"
                @click="toggle"
              >
                <div class="d-flex align-center justify-space-between mb-2">
                  <v-icon :color="isSelected ? '#7e46c4' : '#94a3b8'">mdi-earth</v-icon>
                  <v-icon v-if="isSelected" color="#7e46c4" size="20">mdi-check-circle</v-icon>
                </div>
                <span class="mode-title">{{ t('challenges.commonWorld') }}</span>
                <p class="mode-desc">{{ t('challenges.commonWorldDesc') }}</p>
              </div>
            </v-item>
          </v-col>
        </v-row>
      </v-item-group>

      <v-expand-transition>
        <div v-if="privacy === 'public'" class="public-preview-box mt-4 pa-5">
          <div class="d-flex align-center">
            <v-icon color="#7e46c4" size="32" class="mr-3">mdi-sparkles</v-icon>
            <div>
              <span class="d-block font-weight-bold" style="color: #1a1a2e;">{{ t('challenges.readinessToAnnounce') }}</span>
              <span class="text-caption text-grey-darken-1">
                {{ t('challenges.shareLinkAfterCreation') }}
              </span>
            </div>
          </div>

          <v-divider class="my-4" />

          <v-checkbox
            v-model="allowComments"
            :label="t('challenges.allowCommentsLabel')"
            color="#7e46c4"
            hide-details
            class="compact-checkbox"
          />
        </div>
      </v-expand-transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import {
  toDateInputValue,
  addDays,
  formatDateForLocale
} from '../../utils/dateUtils'

defineProps({
  durationError: { type: String, default: '' }
})

const duration = defineModel('duration', { type: String, default: '21' })
const customDuration = defineModel('customDuration', { type: String, default: '' })
const frequency = defineModel('frequency', { type: String, default: 'daily' })
const startOption = defineModel('startOption', { type: String, default: 'today' })
const startDate = defineModel('startDate', { type: String, default: '' })
const privacy = defineModel('privacy', { type: String, default: 'private' })
const allowComments = defineModel('allowComments', { type: Boolean, default: true })

const { t, locale } = useI18n()
const { lgAndUp } = useDisplay()

const showSlider = ref(false)
const customDays = ref(60)
const showDatePicker = ref(false)

const isCustomDate = computed(() => {
  if (!startDate.value) return false

  const todayStr = toDateInputValue(new Date())
  const tomorrowStr = toDateInputValue(addDays(new Date(), 1))

  return startDate.value !== todayStr && startDate.value !== tomorrowStr
})

const formattedDate = computed(() => formatDateForLocale(startDate.value, locale.value))

function toggleCustomSlider() {
  if (duration.value === 'custom') {
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
}

function handleDatePick(date) {
  if (date) {
    startDate.value = toDateInputValue(date)
    startOption.value = 'custom'
  }

  showDatePicker.value = false
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

watch(startOption, (newValue) => {
  if (newValue === 'custom') {
    return
  }

  if (newValue) {
    const date = newValue === 'tomorrow' ? addDays(new Date(), 1) : new Date()
    startDate.value = toDateInputValue(date)
  }
}, { immediate: true })

</script>

<style scoped>
.duration-selector {
  margin: 24px 0;
}

.duration-frequency-row {
  display: flex;
  gap: 24px;
  margin: 24px 0;
  align-items: flex-start;
}

.duration-frequency-row .duration-selector {
  flex: 1;
  margin: 0;
  min-width: 0;
}

.duration-frequency-row .frequency-selector {
  flex: 0 0 auto;
  margin: 0;
  width: auto;
  max-width: 300px;
}

.duration-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.frequency-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
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

  .duration-frequency-row {
    flex-direction: column;
    gap: 16px;
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
  color: #4FD1C5;
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

.start-time-selector {
  margin-top: 24px;
  margin-bottom: 24px;
}

.custom-toggle-group {
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 12px !important;
  padding: 4px !important;
  height: 44px !important;
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.custom-toggle-group .toggle-btn {
  border: none !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: rgba(255, 255, 255, 0.4) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  flex: 1;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-toggle-group .toggle-btn.v-btn--active {
  background: #7048E8 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(112, 72, 232, 0.4) !important;
}

.calendar-btn {
  height: 44px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  color: rgba(255, 255, 255, 0.6) !important;
  background: rgba(255, 255, 255, 0.03) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  transition: all 0.2s ease;
  margin-left: 8px !important;
}

.calendar-btn:hover {
  border-color: rgba(112, 72, 232, 0.5) !important;
  background: rgba(112, 72, 232, 0.05) !important;
  color: #ffffff !important;
}

.calendar-btn.is-active {
  border-color: #7048E8 !important;
  color: #7048E8 !important;
  background: rgba(112, 72, 232, 0.1) !important;
  box-shadow: 0 0 10px rgba(112, 72, 232, 0.2);
}

.calendar-btn .v-icon {
  color: #ffffff !important;
  opacity: 0.95;
}

.social-settings-block {
  padding: 24px;
  background: rgba(112, 72, 232, 0.04);
  border: 1px solid rgba(112, 72, 232, 0.2);
  border-radius: 24px;
}

.social-settings-block .mode-card {
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-settings-block .mode-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
}

.social-settings-block .mode-card.active {
  border-color: #7048E8;
  background: rgba(112, 72, 232, 0.1);
  box-shadow: 0 0 20px rgba(112, 72, 232, 0.2);
}

.social-settings-block .mode-title {
  display: block;
  color: #FFFFFF;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 4px;
}

.social-settings-block .mode-desc {
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  margin: 0;
}

.social-settings-block .public-preview-box {
  background: linear-gradient(135deg, rgba(112, 72, 232, 0.08) 0%, rgba(79, 209, 197, 0.08) 100%);
  border: 1px solid rgba(112, 72, 232, 0.3);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
}

.social-settings-block .public-preview-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #7048E8, #4FD1C5);
}

.social-settings-block .compact-checkbox :deep(.v-label) {
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  color: rgba(255, 255, 255, 0.9) !important;
  opacity: 1 !important;
}

.social-settings-block .compact-checkbox :deep(.v-selection-control__input) {
  color: #7048E8 !important;
}

.social-settings-block .public-preview-box span.font-weight-bold {
  color: #FFFFFF !important;
}

.social-settings-block .text-grey-darken-1 {
  color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.v-divider) {
  border-color: rgba(255, 255, 255, 0.1) !important;
}
</style>
