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
import { watch } from 'vue'
import confetti from 'canvas-confetti'
import GradientButton from './GradientButton.vue'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  message: String,
  buttonText: { type: String, default: 'OK' }
})

const emit = defineEmits(['update:modelValue', 'close'])

// Запуск пушки конфетти
const fireConfetti = () => {
  const duration = 3 * 1000
  const end = Date.now() + duration

  ;(function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#a855f7', '#1FA0F6', '#ffa500']
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#a855f7', '#1FA0F6', '#ffa500']
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }())
}

// Следим за открытием модалки
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setTimeout(fireConfetti, 300) // небольшая задержка для плавности
  }
})

function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.custom-modal-content {
  /* Эффект матового стекла */
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(15px) saturate(180%);
  -webkit-backdrop-filter: blur(15px) saturate(180%);

  padding: 40px 30px !important;
  border-radius: 32px !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
}

.success-icon-wrapper {
  width: 80px;
  height: 80px;
  /* Градиент в цвет твоего кристалла */
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  border-radius: 24px; /* Делаем мягкий квадрат (squircle) */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  transform: rotate(-10deg); /* Легкий наклон для динамики */
  box-shadow: 0 15px 30px rgba(168, 85, 247, 0.4);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% { transform: scale(0) rotate(0); }
  100% { transform: scale(1) rotate(-10deg); }
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(to right, #1f2937, #4b5563);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 12px;
}

.modal-text {
  font-size: 1.1rem;
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 32px;
}

/* Стили для кнопки подтверждения */
:deep(.gradient-button) {
  height: 56px !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  letter-spacing: 1px !important;
  border-radius: 16px !important;
  /* Фиолетово-синий градиент как на Register кнопке */
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3) !important;
}

:deep(.v-overlay__content) {
  /* Важно для корректного отображения тени */
  overflow: visible !important;
}
</style>





