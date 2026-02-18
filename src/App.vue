<script setup>
import MainLayout from './components/MainLayout.vue'
</script>

<template>
  <div class="app-dark-wrapper">
    <MainLayout />
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  /* Глубокий «космический» фон */
  background-color: #0b0d12 !important; 
  color: #ffffff;
}

/* Оживляем фон мягким свечением, чтобы он не был просто черным */
body::before {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(112, 72, 232, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(60, 96, 232, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}

#app {
  background: transparent !important;
  position: relative;
  z-index: 1;
}

@media (min-width: 960px) {
  #app {
    /* Ограничиваем ширину для ультра-широких мониторов, чтобы контент не разъезжался */
    max-width: 1600px; 
    margin-left: auto;
    margin-right: auto;
  }
}

/* Настройка полей ввода под темную тему и Glassmorphism */
:deep(.v-field) {
  border-radius: 12px !important;
  background: rgba(255, 255, 255, 0.03) !important; /* Едва заметный фон */
  transition: all 0.3s ease !important;
}

:deep(.v-field--focused) {
  background: rgba(255, 255, 255, 0.07) !important;
  /* Тонкое свечение при фокусе */
  box-shadow: 0 0 15px rgba(112, 72, 232, 0.2) !important; 
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.1 !important; /* Делаем границы очень тонкими */
}

/* Стили для скроллбара в стиле киберпанк */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0b0e14;
}
::-webkit-scrollbar-thumb {
  background: rgba(112, 72, 232, 0.3);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(112, 72, 232, 0.5);
}
</style>