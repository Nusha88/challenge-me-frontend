<template>
  <div class="deadline-block" :class="{ 'deadline-block--tactical': variant === 'tactical' }">
    <p
      v-if="variant !== 'tactical'"
      class="field-label mb-4"
      :class="{ 'field-label--required': labelRequired }"
    >
      {{ labelText }}
    </p>
    <span
      v-else
      class="label mb-3"
      :class="{ 'label--required': labelRequired }"
    >
      {{ labelText }}
    </span>

    <v-menu
      v-if="variant !== 'tactical'"
      v-model="menuOpen"
      :close-on-content-click="false"
      transition="scale-transition"
      offset-y
      min-width="auto"
    >
      <template #activator="{ props: menuProps }">
        <div
          v-bind="menuProps"
          class="deadline-selector d-flex align-center pa-4"
          :class="{
            'has-date': endDate,
            'is-disabled': disabled,
            'has-error': Boolean(errorMessage)
          }"
        >
          <v-icon size="28" color="#7e46c4" class="mr-4">mdi-calendar-check</v-icon>

          <div class="d-flex flex-column text-left">
            <span class="date-display">
              {{ endDate ? formattedDate : t('challenges.deadlinePlaceholder') }}
            </span>
            <span v-if="endDate" class="time-left-hint">
              {{ t('challenges.daysLeft') }}: {{ daysLeft }}
            </span>
          </div>

          <v-spacer />
          <v-icon color="#94a3b8">mdi-chevron-right</v-icon>
        </div>
      </template>

      <v-date-picker
        :model-value="endDate"
        :min="min"
        color="#7e46c4"
        elevation="24"
        class="rounded-xl"
        :disabled="disabled"
        @update:model-value="handlePick"
      />
    </v-menu>

    <template v-else>
      <v-btn
        variant="outlined"
        class="mission-date-btn"
        :class="{ 'has-error': Boolean(errorMessage) }"
        :disabled="disabled"
        @click="showTacticalPicker = true"
      >
        <v-icon size="18" class="mr-2">mdi-calendar-month-outline</v-icon>
        <span>{{ endDate ? formattedDate : t('challenges.deadlinePlaceholder') }}</span>
      </v-btn>

      <v-dialog v-model="showTacticalPicker" max-width="400">
        <v-date-picker
          :model-value="endDate"
          :min="min"
          :disabled="disabled"
          @update:model-value="handleTacticalPick"
        />
      </v-dialog>
    </template>

    <p v-if="errorMessage" class="field-error-text mt-2">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDaysUntil, formatDateForLocale, normalizeDateInputValue } from '../../utils/dateUtils'

const props = defineProps({
  variant: { type: String, default: 'default' },
  disabled: { type: Boolean, default: false },
  min: { type: String, default: undefined },
  label: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
  labelRequired: { type: Boolean, default: false }
})

const endDate = defineModel('endDate', { type: String, default: '' })

const menuOpen = ref(false)
const showTacticalPicker = ref(false)
const { t, locale } = useI18n()

const labelText = computed(() => props.label || t('challenges.endDate'))
const formattedDate = computed(() => formatDateForLocale(endDate.value, locale.value))
const daysLeft = computed(() => getDaysUntil(endDate.value))

function applyDate(date) {
  const normalized = normalizeDateInputValue(date)
  if (normalized) {
    endDate.value = normalized
  }
}

function handlePick(date) {
  applyDate(date)
  menuOpen.value = false
}

function handleTacticalPick(date) {
  applyDate(date)
  showTacticalPicker.value = false
}
</script>

<style scoped>
.deadline-block--tactical .label {
  display: block;
}

.deadline-selector.is-disabled {
  opacity: 0.65;
  pointer-events: none;
}

.deadline-selector.has-error {
  border-color: #f87171 !important;
}

.mission-date-btn.has-error {
  border-color: #f87171 !important;
}

.field-label--required::after {
  content: ' *';
  color: #f87171;
}

.field-error-text {
  color: #f87171;
  font-size: 0.75rem;
  line-height: 1.2;
  margin: 0;
}
</style>
