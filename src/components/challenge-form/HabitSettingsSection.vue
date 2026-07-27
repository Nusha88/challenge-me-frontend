<template>
  <div>
    <div class="duration-frequency-row">
      <DurationSelector
        v-model:duration="duration"
        v-model:custom-duration="customDuration"
        :duration-error="durationError"
        :disabled="disabled"
        label-required
      />

      <div class="frequency-selector" data-validation-field="frequency">
        <p class="field-label field-label--required">{{ t('challenges.frequency') }}</p>
        <p v-if="frequencyError" class="field-error-text mb-2">{{ frequencyError }}</p>
        <div class="frequency-toggle-wrapper">
          <v-btn-toggle
            v-model="frequency"
            mandatory
            class="custom-chips-group"
            :disabled="disabled"
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

    <div v-if="mode === 'edit'" class="mission-dates-grid mt-4 mb-4">
      <div class="date-info-box date-info-box--editable">
        <span class="label mb-3">{{ t('challenges.startDate') }}</span>
        <v-btn
          variant="outlined"
          class="mission-date-btn"
          :disabled="disabled"
          @click="$emit('pick-start')"
        >
          <v-icon size="18" class="mr-2">mdi-calendar-month-outline</v-icon>
          <span>{{ formattedStartDate }}</span>
        </v-btn>
      </div>
      <div class="date-divider">
        <v-icon color="rgba(255,255,255,0.1)">mdi-arrow-right-thin</v-icon>
      </div>
      <div class="date-info-box date-info-box--editable">
        <span class="label mb-3">{{ t('challenges.endDate') }}</span>
        <v-btn
          variant="outlined"
          class="mission-date-btn"
          :disabled="disabled"
          @click="$emit('pick-end')"
        >
          <v-icon size="18" class="mr-2">mdi-calendar-month-outline</v-icon>
          <span>{{ formattedEndDate }}</span>
        </v-btn>
      </div>
    </div>

    <div v-else class="start-time-selector">
      <p class="field-label">{{ t('challenges.start') }}</p>

      <div class="d-flex align-center gap-3">
        <v-btn-toggle
          v-model="startOption"
          mandatory
          class="custom-toggle-group"
          :disabled="disabled"
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
          :disabled="disabled"
          @click="showDatePicker = true"
        >
          <v-icon size="20">mdi-calendar-month-outline</v-icon>
          <span v-if="isCustomDate" class="ml-2">{{ formattedStartDate }}</span>
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

    <div class="mt-8">
      <PrivacySelector
        v-model:privacy="privacy"
        v-model:allow-comments="allowComments"
        show-comments-toggle
        :disabled="disabled"
        :menu-props="menuProps"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DurationSelector from './DurationSelector.vue'
import PrivacySelector from './PrivacySelector.vue'
import {
  toDateInputValue,
  addDays,
  formatDateForLocale
} from '../../utils/dateUtils'

const props = defineProps({
  mode: { type: String, default: 'create' },
  durationError: { type: String, default: '' },
  frequencyError: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  menuProps: { type: Object, default: undefined }
})

defineEmits(['pick-start', 'pick-end'])

const duration = defineModel('duration', { type: String, default: '21' })
const customDuration = defineModel('customDuration', { type: String, default: '' })
const frequency = defineModel('frequency', { type: String, default: 'daily' })
const startOption = defineModel('startOption', { type: String, default: 'today' })
const startDate = defineModel('startDate', { type: String, default: '' })
const endDate = defineModel('endDate', { type: String, default: '' })
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

const formattedStartDate = computed(() => formatDateForLocale(startDate.value, locale.value))
const formattedEndDate = computed(() => formatDateForLocale(endDate.value, locale.value))

function handleDatePick(date) {
  if (date) {
    startDate.value = toDateInputValue(date)
    startOption.value = 'custom'
  }
  showDatePicker.value = false
}

watch(startOption, (newValue) => {
  if (props.mode === 'edit') return
  if (newValue === 'custom') return
  if (newValue) {
    const date = newValue === 'tomorrow' ? addDays(new Date(), 1) : new Date()
    startDate.value = toDateInputValue(date)
  }
}, { immediate: true })
</script>

<style scoped>
.duration-frequency-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin: 24px 0;
  align-items: flex-start;
}

.duration-frequency-row :deep(.duration-selector) {
  flex: 1 1 480px;
  margin: 0;
  min-width: min(100%, 360px);
}

.duration-frequency-row .frequency-selector {
  flex: 1 1 240px;
  margin: 0;
  width: auto;
  max-width: 100%;
}

.frequency-toggle-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 959px) {
  .duration-frequency-row {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 12px;
    margin: 12px 0 16px;
  }

  .duration-frequency-row :deep(.duration-selector),
  .duration-frequency-row .frequency-selector {
    flex: none;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }
}

@media (max-width: 600px) {
  .duration-frequency-row {
    gap: 10px;
    margin: 8px 0 12px;
  }

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
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.05)) !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1)) !important;
  color: var(--home-text-dim, rgba(255, 255, 255, 0.7)) !important;
  border-radius: 12px !important;
  height: 48px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0 !important;
  transition: all 0.25s var(--home-ease, ease) !important;
  padding: 0 20px !important;
  box-shadow: none !important;
}

.custom-chips-group .chip-btn.v-btn--active {
  background: var(--home-purple, #7048E8) !important;
  color: white !important;
}

.start-time-selector {
  margin-top: 24px;
  margin-bottom: 24px;
}

.custom-toggle-group {
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.05)) !important;
  border-radius: 12px !important;
  padding: 4px !important;
  height: 44px !important;
  display: flex;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1)) !important;
}

.custom-toggle-group .toggle-btn {
  border: none !important;
  border-radius: 8px !important;
  background: transparent !important;
  color: var(--home-text-dim, rgba(255, 255, 255, 0.4)) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  flex: 1;
  transition: all 0.2s var(--home-ease, ease);
}

.custom-toggle-group .toggle-btn.v-btn--active {
  background: var(--home-purple, #7048E8) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(112, 72, 232, 0.35) !important;
}

.calendar-btn {
  height: 44px !important;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1)) !important;
  border-radius: 12px !important;
  color: var(--home-text-dim, rgba(255, 255, 255, 0.6)) !important;
  background: var(--home-surface-soft, rgba(255, 255, 255, 0.03)) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  transition: all 0.2s ease;
  margin-left: 8px !important;
}

.calendar-btn:hover {
  border-color: var(--home-border-hi, rgba(112, 72, 232, 0.5)) !important;
  background: rgba(112, 72, 232, 0.05) !important;
  color: var(--home-text, #ffffff) !important;
}

.calendar-btn.is-active {
  border-color: var(--home-purple, #7048E8) !important;
  color: var(--home-purple, #7048E8) !important;
  background: rgba(112, 72, 232, 0.1) !important;
}

.calendar-btn .v-icon {
  color: var(--home-text, #ffffff) !important;
  opacity: 0.95;
}

.field-error-text {
  color: #f87171;
  font-size: 0.75rem;
  line-height: 1.2;
  margin: 0;
}
</style>
