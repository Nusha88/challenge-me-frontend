<template>
  <v-dialog 
    :model-value="modelValue" 
    max-width="400" 
    persistent 
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="custom-modal-content">
      <div class="success-icon-wrapper">
        <v-icon size="42" color="white">mdi-check-bold</v-icon>
      </div>
      
      <h2 class="modal-title">{{ title }}</h2>
      <p class="modal-text">{{ message }}</p>
      
      <GradientButton
        block
        class="ok-btn"
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

// Конфетти в тонах твоего интерфейса
const fireConfetti = () => {
  const duration = 3 * 1000
  const end = Date.now() + duration

  ;(function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#7048E8', '#F4A782', '#FFFFFF']
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#7048E8', '#F4A782', '#FFFFFF']
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }())
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setTimeout(fireConfetti, 300)
  }
})

function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.custom-modal-content {
  /* Глубокое темное стекло */
  background: rgba(15, 15, 25, 0.9) !important;
  backdrop-filter: blur(25px) saturate(200%);
  -webkit-backdrop-filter: blur(25px) saturate(200%);

  padding: 45px 35px !important;
  border-radius: 32px !important;
  /* Тонкая граница с эффектом свечения */
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  text-align: center;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7) !important;
}

.success-icon-wrapper {
  width: 84px;
  height: 84px;
  /* Твой основной градиент */
  background: linear-gradient(135deg, #7048E8 0%, #F4A782 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  transform: rotate(-8deg); /* Небольшой игровой наклон */
  box-shadow: 0 12px 30px rgba(112, 72, 232, 0.4);
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  100% { transform: scale(1) rotate(-8deg); opacity: 1; }
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #FFFFFF !important;
  margin-bottom: 14px;
  letter-spacing: -0.5px;
}

.modal-text {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 35px;
}

/* Принудительное перекрашивание кнопки */
.ok-btn :deep(.v-btn) {
  /* Убираем стандартный синий фон Vuetify */
  background: linear-gradient(135deg, #7048E8 0%, #F4A782 100%) !important;
  /* Убираем синюю тень и границы */
  border: none !important;
  box-shadow: 0 10px 20px rgba(112, 72, 232, 0.4) !important;
  
  /* Текст и иконка внутри */
  color: white !important;
  height: 58px !important;
  border-radius: 18px !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

/* Убираем синий эффект при наведении */
.ok-btn :deep(.v-btn__overlay),
.ok-btn :deep(.v-btn__underlay) {
  display: none !important;
}

.ok-btn :deep(.v-btn:hover) {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 15px 30px rgba(112, 72, 232, 0.6) !important;
}
</style>