<template>
  <TodayProgressSkeleton v-if="loading" />
  <div
    v-else-if="visible"
    class="home-progress home-glass-card"
    :class="{ 'home-progress--conquered': canShare }"
    role="group"
    :aria-label="progressLabel"
  >
    <p v-if="canShare" class="conquered-title">
      {{ t('home.loggedIn.completionDialog.conqueredTitle') }}
    </p>

    <div class="progress-header" :class="{ 'progress-header--quiet': canShare }">
      <span class="level-badge">
        <v-icon v-if="canShare" size="16" class="done-icon">mdi-check-circle-outline</v-icon>
        {{ completedItems }} / {{ totalItems }} {{ t('home.loggedIn.dailyChecklist.completed') }}
      </span>
      <span class="level-badge">{{ statusLabel }}</span>
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
      <div v-if="canShare" class="share-cta">
        <v-btn
          class="share-triumph-btn"
          variant="flat"
          prepend-icon="mdi-share-variant"
          @click="$emit('share')"
        >
          {{ t('home.loggedIn.shareTriumph') }}
        </v-btn>
        <p class="share-hint">
          {{ t('home.loggedIn.completionDialog.sparksHint') }}
        </p>
      </div>
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

const remainingCount = computed(() => Math.max(0, props.totalItems - props.completedItems))

const statusLabel = computed(() => {
  if (props.canShare) return `${props.percentage}%`
  return t('home.loggedIn.progressRemaining', { count: remainingCount.value })
})

const progressLabel = computed(() => {
  return `${props.completedItems} / ${props.totalItems} · ${statusLabel.value}`
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

.home-progress--conquered {
  box-shadow:
    0 0 0 1px rgba(79, 209, 197, 0.28),
    0 0 28px rgba(126, 70, 196, 0.28);
}

.conquered-title {
  margin: 0;
  font-family: 'Plus Jakarta Sans', 'Montserrat', sans-serif;
  font-size: 1.15rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  text-shadow: 0 0 16px rgba(79, 209, 197, 0.28);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.progress-header--quiet .level-badge {
  font-size: 0.88rem;
  color: rgba(241, 245, 249, 0.72);
}

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
  font-size: 1.05rem;
}

.done-icon {
  color: var(--home-teal, #4fd1c5);
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

.share-cta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-triumph-btn {
  background: linear-gradient(90deg, #7e46c4 0%, #4fd1c5 100%) !important;
  color: #fff !important;
  border-radius: 12px !important;
  text-transform: none !important;
  font-size: 0.95rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.02em;
  width: 100%;
  box-shadow: 0 8px 20px rgba(126, 70, 196, 0.28);
}

.share-triumph-btn:hover {
  filter: brightness(1.06);
}

.share-hint {
  margin: 0;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(79, 209, 197, 0.9);
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill.has-progress::after {
    animation: none;
  }
}
</style>
