<template>
  <div class="deadline-block">
    <p class="field-label mb-4">{{ t('challenges.deadlineTitle') }}</p>

    <v-menu
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
          :class="{ 'has-date': endDate }"
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
        color="#7e46c4"
        elevation="24"
        class="rounded-xl"
        @update:model-value="handlePick"
      />
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { toDateInputValue, getDaysUntil, formatDateForLocale } from '../../utils/dateUtils'

const endDate = defineModel('endDate', { type: String, default: '' })

const menuOpen = ref(false)
const { t, locale } = useI18n()

const formattedDate = computed(() => formatDateForLocale(endDate.value, locale.value))
const daysLeft = computed(() => getDaysUntil(endDate.value))

function handlePick(date) {
  if (date) {
    endDate.value = toDateInputValue(date)
  }

  menuOpen.value = false
}
</script>
