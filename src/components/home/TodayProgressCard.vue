<template>
  <TodayProgressSkeleton v-if="loading" />
  <div
    v-else-if="visible"
    class="home-progress home-glass-card"
    role="group"
    :aria-label="progressLabel"
  >
    <div class="progress-header">
      <span class="level-badge">
        {{ completedItems }} / {{ totalItems }} {{ t('home.loggedIn.dailyChecklist.completed') }}
      </span>
      <span class="level-badge">{{ percentage }}%</span>
    </div>

    <div
      class="progress-track"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuetext="progressLabel"
    >
      <div
        class="progress-fill"
        :class="{ 'has-progress': showProgressGlow && percentage > 0 }"
        :style="{ width: percentage + '%' }"
      />
    </div>

    <v-fade-transition>
      <v-btn
        v-if="canShare"
        variant="outlined"
        class="share-triumph-btn"
        prepend-icon="mdi-share-variant"
        @click="$emit('share')"
      >
        {{ t('home.loggedIn.shareTriumph') }}
      </v-btn>
    </v-fade-transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TodayProgressSkeleton from './TodayProgressSkeleton.vue'

const props = defineProps({
  loading: { type: Boolean, default: false },
  visible: { type: Boolean, default: true },
  completedItems: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  showProgressGlow: { type: Boolean, default: true },
  canShare: { type: Boolean, default: false }
})

defineEmits(['share'])

const { t } = useI18n()

const progressLabel = computed(() => {
  return `${props.completedItems} / ${props.totalItems} · ${props.percentage}%`
})
</script>

<style scoped>
.home-progress {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 20px 22px !important;
  margin-bottom: 1.25rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.level-badge {
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
  font-size: 1.05rem;
}

.progress-track {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: visible;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.35);
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--home-teal, #4fd1c5) 0%, var(--home-purple, #7048e8) 100%);
  border-radius: 999px;
  box-shadow: 0 0 14px rgba(79, 209, 197, 0.35);
  transition: width 0.55s var(--home-ease, ease);
  position: relative;
}

.progress-fill.has-progress::after {
  content: '';
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: var(--home-teal, #4fd1c5);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--home-teal, #4fd1c5), 0 0 18px var(--home-teal, #4fd1c5);
  animation: home-progress-pulse 1.5s infinite alternate;
}

@keyframes home-progress-pulse {
  from {
    transform: translateY(-50%) scale(1);
    opacity: 0.85;
  }
  to {
    transform: translateY(-50%) scale(1.25);
    opacity: 1;
  }
}

.share-triumph-btn {
  border: 1px solid rgba(79, 209, 197, 0.35) !important;
  background: rgba(26, 26, 46, 0.35) !important;
  color: rgba(255, 255, 255, 0.88) !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  width: fit-content;
  align-self: flex-start;
}

.share-triumph-btn:hover {
  background: rgba(79, 209, 197, 0.14) !important;
  border-color: var(--home-teal, #4fd1c5) !important;
  color: #fff !important;
  box-shadow: var(--home-glow-teal, 0 0 16px rgba(79, 209, 197, 0.28));
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill.has-progress::after {
    animation: none;
  }
}
</style>
