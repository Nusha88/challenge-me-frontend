<template>
  <div class="ignite-magic-loader">
    <div class="crystal-wrapper">
      <img :src="logoImage" class="magic-crystal" alt="Loading...">
      
      <div class="magic-ring ring-1"></div>
      <div class="magic-ring ring-2"></div>
      
      <div class="loading-status">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import logoImage from '../assets/awa.png'

defineProps({
  loadingText: {
    type: String,
    default: 'Channelling Power...'
  }
})
</script>

<style scoped>
.ignite-magic-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  width: 100%;
  padding: 40px 20px;
}

.crystal-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Анимация кристалла */
.magic-crystal {
  width: 64px;
  height: 64px;
  object-fit: contain;
  z-index: 10;
  filter: drop-shadow(0 0 15px rgba(79, 209, 197, 0.6));
  animation: crystalFloat 3s ease-in-out infinite;
}

/* Эффект расходящихся колец энергии */
.magic-ring {
  position: absolute;
  top: 32px; /* Центр кристалла */
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(79, 209, 197, 0.3);
  border-radius: 50%;
  z-index: 1;
  pointer-events: none;
}

.ring-1 {
  width: 40px;
  height: 40px;
  animation: ripple 2s linear infinite;
}

.ring-2 {
  width: 40px;
  height: 40px;
  animation: ripple 2s linear infinite 1s; /* Задержка для последовательности */
}

/* Текст под кристаллом */
.loading-status {
  margin-top: 40px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #4FD1C5;
  text-shadow: 0 0 10px rgba(79, 209, 197, 0.4);
  text-transform: uppercase;
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
}

/* --- Keyframes --- */

@keyframes crystalFloat {
  0%, 100% { 
    filter: drop-shadow(0 0 15px rgba(79, 209, 197, 0.6));
  }
  50% { 
    filter: drop-shadow(0 0 25px rgba(79, 209, 197, 0.9));
    transform: translateY(-12px) scale(1.08); /* Чуть больше динамики */
  }
}

@keyframes ripple {
  0% {
    width: 40px;
    height: 40px;
    opacity: 0.8;
    border-color: rgba(244, 167, 130, 0.4);
  }
  100% {
    width: 120px;
    height: 120px;
    opacity: 0;
    border-color: rgba(126, 70, 196, 0);
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .magic-crystal {
    width: 56px;
    height: 56px;
  }
  
  .loading-status {
    font-size: 10px;
    letter-spacing: 2px;
    margin-top: 32px;
  }
  
  .ring-1,
  .ring-2 {
    width: 36px;
    height: 36px;
  }
  
  @keyframes ripple {
    0% {
      width: 36px;
      height: 36px;
      opacity: 0.8;
      border-color: rgba(244, 167, 130, 0.4);
    }
    100% {
      width: 100px;
      height: 100px;
      opacity: 0;
      border-color: rgba(126, 70, 196, 0);
    }
  }
}
</style>
