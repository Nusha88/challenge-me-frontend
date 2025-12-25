<template>
  <v-dialog :model-value="modelValue" max-width="400" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="custom-modal-content">
      <div class="success-icon-wrapper">
        <v-icon size="40" color="white">mdi-check</v-icon>
      </div>
      
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-text">{{ message }}</p>
      
      <GradientButton
        block
        @click="handleClose"
      >
        {{ buttonText }}
      </GradientButton>
    </v-card>
  </v-dialog>
</template>

<script setup>
import GradientButton from './GradientButton.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'OK'
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
/* Стили для кастомного модального окна */
.custom-modal-content {
  background: white !important;
  padding: 40px 30px !important;
  border-radius: 24px !important;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: none !important;
}

.custom-modal-content :deep(.v-card-text) {
  padding: 0 !important;
}

.success-icon-wrapper {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.modal-text {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 30px;
}

/* Убираем стандартные тени Vuetify диалога, чтобы оставить наши скругления */
:deep(.v-overlay__content) {
  box-shadow: none !important;
}

:deep(.v-overlay__content > .v-card) {
  border-radius: 24px !important;
  box-shadow: none !important;
}

/* Purple to blue gradient for the button */
:deep(.gradient-button) {
  background: linear-gradient(135deg, #a855f7 0%, #1FA0F6 100%) !important;
}

:deep(.gradient-button :deep(.v-btn__overlay)) {
  background: linear-gradient(135deg, #a855f7 0%, #1FA0F6 100%) !important;
}

:deep(.gradient-button:hover) {
  background: linear-gradient(135deg, #1FA0F6 0%, #a855f7 100%) !important;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
}
</style>




