<template>
  <v-btn
    :variant="variant"
    :type="type"
    :size="size"
    :block="block"
    :to="to"
    :loading="loading"
    :disabled="disabled"
    class="gradient-button"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </v-btn>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'elevated'
  },
  type: {
    type: String,
    default: 'button'
  },
  size: {
    type: String,
    default: 'x-large'
  },
  block: {
    type: Boolean,
    default: false
  },
  to: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])
</script>

<style scoped>
.gradient-button {
  border-radius: 24px !important;
  /* ЗАМЕНЕНО: Фиолетово-персиковый градиент вместо синего */
  background: linear-gradient(135deg, #4fd1c5 0%, #a62ee8 100%);
  color: white !important;
  font-size: 1.1rem;
  letter-spacing: 1.5px;
  /* Добавляем мягкое свечение */
  box-shadow: 0 0 20px rgba(79, 209, 197, 0.3);
  transition: all 0.3s ease;
  font-weight: 800;
  border: none;
  text-transform: uppercase;
}

/* ЗАМЕНЕНО: Исправляем оверлей Vuetify, чтобы он не подмешивал синий или серый */
.gradient-button :deep(.v-btn__overlay) {
  background: transparent !important;
}

.gradient-button:hover {
  transform: translateY(-2px);
  /* Усиливаем свечение при наведении */
  box-shadow: 0 0 30px rgba(79, 209, 197, 0.5), 
              0 0 10px rgba(166, 46, 232, 0.4);
}

.gradient-button:active {
  transform: translateY(1px);
  box-shadow: 0 4px 10px rgba(112, 72, 232, 0.3) !important;
}

.gradient-button:disabled {
  opacity: 0.5;
  filter: grayscale(0.5);
  cursor: not-allowed;
}

/* Убираем стандартную обводку Vuetify при фокусе */
.gradient-button :deep(.v-btn__underlay) {
  display: none !important;
}
</style>






