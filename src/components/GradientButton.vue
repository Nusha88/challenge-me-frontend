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
  background: linear-gradient(135deg, #7048E8 0%, #F4A782 100%) !important;
  color: white !important;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 16px 32px;
  height: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  border: none !important;
}

/* Эффект блика при наведении */
.gradient-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease-in-out;
}

.gradient-button:hover::before {
  left: 100%;
}

/* ЗАМЕНЕНО: Исправляем оверлей Vuetify, чтобы он не подмешивал синий или серый */
.gradient-button :deep(.v-btn__overlay) {
  background: transparent !important;
}

.gradient-button:hover {
  /* Легкое изменение градиента при наведении */
  background: linear-gradient(135deg, #815bf0 0%, #f7b89a 100%) !important;
  transform: translateY(-2px);
  /* ЗАМЕНЕНО: Свечение в тон фиолетового */
  box-shadow: 0 8px 20px rgba(112, 72, 232, 0.4) !important;
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






