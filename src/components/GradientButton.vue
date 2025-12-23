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
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
  color: white !important;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 16px 32px;
  height: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.gradient-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.gradient-button:hover::before {
  left: 100%;
}

.gradient-button :deep(.v-btn__overlay) {
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
}

.gradient-button:hover {
  background: linear-gradient(135deg, #A62EE8 0%, #1FA0F6 100%) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(31, 160, 246, 0.4);
}

.gradient-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(31, 160, 246, 0.3);
}

.gradient-button:disabled {
  opacity: 0.6;
}
</style>



