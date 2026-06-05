<template>
  <TodayProgressSkeleton v-if="loading" />
  <div v-else-if="visible" class="hero-progress-light">
    <div class="progress-header">
      <span class="level-badge">{{ completedItems }} / {{ totalItems }} {{ t('home.loggedIn.dailyChecklist.completed') }}</span>
      <span class="level-badge">{{ percentage }}%</span>
    </div>
    <div class="progress-track-soft">
      <div
        class="progress-fill-vibrant"
        :class="{ 'has-progress': showProgressGlow && percentage > 0 }"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>

    <v-fade-transition>
      <v-btn
        v-if="percentage === 100"
        variant="outlined"
        color="white"
        class="share-triumph-btn mt-2"
        prepend-icon="mdi-share-variant"
        @click="$emit('share')"
      >
        {{ t('home.loggedIn.shareTriumph') }}
      </v-btn>
    </v-fade-transition>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import TodayProgressSkeleton from './TodayProgressSkeleton.vue'

defineProps({
  loading: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  completedItems: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  showProgressGlow: { type: Boolean, default: true }
})

defineEmits(['share'])

const { t } = useI18n()
</script>

<style scoped>
.hero-progress-light {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  margin-bottom: 3em;
}

@media (max-width: 959px) {
  .hero-progress-light {
    margin-bottom: 1.5em;
  }
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.level-badge {
  font-weight: 800;
  color: #FFFFFF;
  font-size: 1.2rem;
}

.progress-track-soft {
  width: 100%;
  height: 10px;
  background: #F1F3F5;
  border-radius: 20px;
  overflow: visible;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.progress-fill-vibrant {
  height: 100%;
  background: linear-gradient(90deg, #4FD1C5 0%, #7048E8 100%);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(112, 72, 232, 0.3);
  transition: width 0.5s ease-in-out;
  position: relative;
}

.progress-fill-vibrant.has-progress::after {
  content: '';
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #4FD1C5;
  border-radius: 50%;
  box-shadow: 0 0 10px #4FD1C5, 0 0 20px #4FD1C5, 0 0 5px #FFFFFF;
  animation: ignite-pulse 1.5s infinite alternate;
}

@keyframes ignite-pulse {
  from {
    transform: translateY(-50%) scale(1);
    opacity: 0.8;
  }
  to {
    transform: translateY(-50%) scale(1.3);
    opacity: 1;
    box-shadow: 0 0 15px #4FD1C5, 0 0 25px #4FD1C5;
  }
}

.share-triumph-btn {
  /* Базовый вид */
  border: 1px solid rgba(79, 209, 197, 0.3) !important; /* Легкая бирюзовая рамка */
  background: rgba(26, 26, 46, 0.4) !important; /* Полупрозрачный фон подложки */
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-size: 0.9rem !important;
  font-weight: 500 !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  width: fit-content;

  /* Добавим легкий внутренний свет */
  backdrop-filter: blur(4px);
}

.share-triumph-btn:hover {
  /* Эффект свечения при наведении */
  background: rgba(79, 209, 197, 0.15) !important;
  border-color: #4FD1C5 !important;
  color: #FFFFFF !important;

  /* Главная фишка: свечение */
  box-shadow: 0 0 15px rgba(79, 209, 197, 0.4),
  0 0 30px rgba(79, 209, 197, 0.2) !important;

  /* Небольшой подъем */
  transform: translateY(-2px);
}

/* Активное состояние (при клике) */
.share-triumph-btn:active {
  transform: translateY(0);
  box-shadow: none !important;
}
</style>
