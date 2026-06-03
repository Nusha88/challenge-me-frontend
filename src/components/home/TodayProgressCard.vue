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
</style>
