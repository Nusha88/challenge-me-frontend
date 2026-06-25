<template>
  <div>
    <div class="duration-frequency-row">
      <DurationSelector
        v-model:duration="duration"
        v-model:custom-duration="customDuration"
        :duration-error="durationError"
        label-required
      />

      <div class="frequency-selector">
        <p class="field-label field-label--required">{{ t('challenges.frequency') }}</p>
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
import { useI18n } from 'vue-i18n'
import DurationSelector from './DurationSelector.vue'
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

const showDatePicker = ref(false)

const isCustomDate = computed(() => {
  if (!startDate.value) return false

  const todayStr = toDateInputValue(new Date())
  const tomorrowStr = toDateInputValue(addDays(new Date(), 1))

  return startDate.value !== todayStr && startDate.value !== tomorrowStr
})

const formattedDate = computed(() => formatDateForLocale(startDate.value, locale.value))

function handleDatePick(date) {
  if (date) {
    startDate.value = toDateInputValue(date)
    startOption.value = 'custom'
  }

  showDatePicker.value = false
}

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
.duration-frequency-row {
  display: flex;
  gap: 24px;
  margin: 24px 0;
  align-items: flex-start;
}

.duration-frequency-row :deep(.duration-selector) {
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

.frequency-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .duration-frequency-row {
    flex-direction: column;
    gap: 16px;
  }

  .duration-frequency-row .frequency-selector,
  .frequency-toggle-wrapper,
  .frequency-selector .custom-chips-group,
  .custom-toggle-group,
  .calendar-btn {
    width: 100%;
    max-width: 100%;
  }

  .frequency-toggle-wrapper,
  .start-time-selector .d-flex {
    align-items: stretch !important;
  }

  .start-time-selector .d-flex {
    flex-direction: column;
    gap: 12px !important;
  }

  .frequency-selector .custom-chips-group .chip-btn,
  .custom-toggle-group .toggle-btn {
    flex: 1 1 0;
    min-width: 0;
    padding-inline: 10px !important;
  }

  .frequency-selector .custom-chips-group .chip-btn :deep(.v-btn__content),
  .custom-toggle-group .toggle-btn :deep(.v-btn__content),
  .calendar-btn :deep(.v-btn__content) {
    min-width: 0;
    white-space: normal;
    text-align: center;
    line-height: 1.2;
  }

  .calendar-btn {
    margin-left: 0 !important;
    justify-content: center;
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

.custom-chips-group .chip-btn.v-btn--active {
  background: #7048E8 !important;
  color: white !important;
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
