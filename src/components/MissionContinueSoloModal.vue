<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    persistent
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="solo-card">
      <div class="solo-header">
        <h3 class="solo-title">{{ t('challenges.soloContinuation.title') }}</h3>
        <p class="solo-subtitle">{{ t('challenges.soloContinuation.subtitle') }}</p>
      </div>

      <v-card-text class="solo-body">
        <p class="solo-copy">{{ t('challenges.soloContinuation.description', { remaining: remainingDays }) }}</p>

        <v-btn
          class="solo-primary mb-4"
          block
          size="large"
          :loading="loading"
          @click="continueWithSuggestedEnd"
        >
          {{ t('challenges.soloContinuation.autoExtend', { days: remainingDays }) }}
        </v-btn>

        <v-divider class="my-4" />

        <p class="solo-custom-label">{{ t('challenges.soloContinuation.customLabel') }}</p>
        <v-text-field
          v-model="customEndDate"
          type="date"
          variant="outlined"
          density="comfortable"
          color="#4FD1C5"
          hide-details
          class="solo-date-field"
          :min="minCustomDate"
        />
        <v-btn
          variant="outlined"
          class="solo-secondary mt-3"
          block
          size="large"
          :loading="loading"
          :disabled="!customEndDate"
          @click="continueWithCustomEnd"
        >
          {{ t('challenges.soloContinuation.customButton') }}
        </v-btn>
      </v-card-text>

      <div class="solo-actions">
        <v-btn variant="text" class="solo-skip" block @click="close">
          {{ t('challenges.soloContinuation.skip') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  suggestedEndDate: { type: String, default: '' },
  remainingDays: { type: Number, default: 0 },
  minCustomDate: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'continue'])

const { t } = useI18n()
const customEndDate = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      customEndDate.value = props.suggestedEndDate || ''
    }
  }
)

function close() {
  emit('update:modelValue', false)
}

function continueWithSuggestedEnd() {
  emit('continue', { customEndDate: null })
}

function continueWithCustomEnd() {
  if (!customEndDate.value) return
  emit('continue', { customEndDate: customEndDate.value })
}
</script>

<style scoped>
.solo-card {
  background: linear-gradient(165deg, #16213e 0%, #0f172a 100%) !important;
  border: 1px solid rgba(79, 209, 197, 0.2);
  border-radius: 20px !important;
  color: #fff;
}

.solo-header {
  padding: 24px 24px 8px;
}

.solo-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.solo-subtitle {
  margin: 8px 0 0;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.65);
}

.solo-body {
  padding: 8px 24px 12px !important;
}

.solo-copy {
  margin: 0 0 16px;
  font-size: 0.92rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.82);
}

.solo-custom-label {
  margin: 0 0 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.55);
}

.solo-primary {
  background: #4fd1c5 !important;
  color: #0f172a !important;
  font-weight: 800;
  text-transform: none;
}

.solo-secondary {
  text-transform: none;
  color: rgba(255, 255, 255, 0.85) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
}

.solo-actions {
  padding: 0 20px 20px;
}

.solo-skip {
  text-transform: none;
  color: rgba(255, 255, 255, 0.55) !important;
}
</style>
