<template>
  <div
    v-if="visible"
    class="streak-button d-none d-md-inline-flex"
    :class="heatClass"
  >
    <i class="mdi mdi-fire"></i>
    <span>{{ displayStreakDays }} {{ streakDaysText }}</span>
    <span v-if="statusLabel" class="streak-status">· {{ statusLabel }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { STREAK_STATUS, getStreakHeatTier } from '../../utils/streakUtils'

const props = defineProps({
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  streakStatus: { type: String, default: STREAK_STATUS.LIVE },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  streakDaysText: { type: String, default: '' },
  visible: { type: Boolean, default: false }
})

const { t } = useI18n()

const statusLabel = computed(() => {
  if (props.streakStatus === STREAK_STATUS.PAUSED) return t('navigation.streakPaused')
  if (props.streakStatus === STREAK_STATUS.COOLED) return t('navigation.streakCooled')
  return ''
})

const heatClass = computed(() => {
  const tier = getStreakHeatTier(props.displayStreakDays, props.streakStatus)
  return {
    'streak-paused': props.streakStatus === STREAK_STATUS.PAUSED,
    'streak-cooled': props.streakStatus === STREAK_STATUS.COOLED,
    'streak-pulse': props.streakStatus === STREAK_STATUS.LIVE && tier >= 7,
    [`streak-heat-${tier}`]: tier > 0
  }
})
</script>

<style scoped>
.streak-button {
  background: rgba(255, 107, 53, 0.12) !important;
  border: 1px solid rgba(255, 107, 53, 0.4) !important;
  border-radius: 12px;
  padding: 6px 14px;
  color: #ffd4a8 !important;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}

.streak-button i {
  font-size: 20px;
  color: #ff6b35;
}

.streak-status {
  font-weight: 700;
  opacity: 0.78;
}

.streak-heat-1 {
  box-shadow: 0 0 10px rgba(255, 107, 53, 0.18);
}

.streak-heat-3 {
  background: rgba(255, 107, 53, 0.18) !important;
  border-color: rgba(255, 107, 53, 0.55) !important;
  color: #ffe0c2 !important;
  box-shadow: 0 0 14px rgba(255, 107, 53, 0.28);
}

.streak-heat-3 i {
  color: #ff7a2e;
}

.streak-heat-7 {
  background: rgba(255, 69, 0, 0.22) !important;
  border-color: rgba(255, 69, 0, 0.65) !important;
  color: #fff1e0 !important;
  box-shadow: 0 0 18px rgba(255, 69, 0, 0.38);
}

.streak-heat-7 i {
  color: #ff4500;
}

.streak-heat-14 {
  background: linear-gradient(135deg, rgba(255, 69, 0, 0.28), rgba(255, 191, 36, 0.22)) !important;
  border-color: rgba(255, 191, 36, 0.7) !important;
  color: #fff7ea !important;
  box-shadow: 0 0 22px rgba(255, 69, 0, 0.5);
}

.streak-heat-14 i {
  color: #ff4500;
  filter: drop-shadow(0 0 8px rgba(255, 191, 36, 0.8));
}

.streak-pulse i {
  animation: streak-fire-pulse 1.6s ease-in-out infinite;
}

.streak-paused,
.streak-cooled {
  box-shadow: none;
}

.streak-cooled {
  opacity: 0.88;
}

@keyframes streak-fire-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .streak-pulse i {
    animation: none;
  }
}
</style>
