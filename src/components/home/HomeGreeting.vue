<template>
  <div class="home-hud-greeting">
    <div class="greeting-copy">
      <h1 class="greeting-title">
        <span class="greeting-text">{{ t('home.loggedIn.greeting', { name: userName }) }}</span>
      </h1>
      <p class="motivational-text">
        {{ hasTodayCompletedTasks ? motivationalMessageCompleted : motivationalMessage }}
      </p>

      <div
        v-if="showMobileStreak"
        class="streak-ember d-md-none"
        :class="{ 'streak-ember--yesterday': !hasTodayCompletedTasks && yesterdayStreakDays > 0 }"
      >
        <i class="mdi mdi-fire" aria-hidden="true"></i>
        <span>{{ streakLabel }} {{ streakDaysText }}</span>
      </div>
    </div>

    <div class="greeting-artifact d-none d-md-flex" aria-hidden="false">
      <img
        :src="crystalImage"
        :alt="t('home.loggedIn.crystalAlt')"
        class="magic-artifact"
        width="160"
        height="160"
        decoding="async"
      />
      <span class="artifact-glow" aria-hidden="true"></span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import crystalImage from '../../assets/home/crystal-320.webp'

const props = defineProps({
  userName: { type: String, default: '' },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  motivationalMessage: { type: String, default: '' },
  motivationalMessageCompleted: { type: String, default: '' },
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  streakDaysText: { type: String, default: '' }
})

const { t } = useI18n()

const showMobileStreak = computed(() => {
  return props.yesterdayStreakDays > 0 || props.displayStreakDays > 0
})

const streakLabel = computed(() => {
  if (!props.hasTodayCompletedTasks && props.yesterdayStreakDays > 0) {
    return props.yesterdayStreakDays
  }
  return props.displayStreakDays
})
</script>

<style scoped>
.home-hud-greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  width: 100%;
}

.greeting-copy {
  flex: 1;
  min-width: 0;
  padding-left: 14px;
  border-left: 3px solid transparent;
  border-image: linear-gradient(to bottom, var(--home-teal, #4fd1c5), rgba(112, 72, 232, 0.45)) 1;
}

.greeting-title {
  margin: 0 0 8px;
  font-size: clamp(1.45rem, 2.4vw, 2rem);
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.motivational-text {
  margin: 0;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
  max-width: 42ch;
}

.streak-ember {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 6px 12px;
  border-radius: var(--home-radius-pill, 999px);
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: var(--home-gold, #fbbf24);
  font-size: 0.8rem;
  font-weight: 700;
}

.streak-ember--yesterday {
  opacity: 0.7;
}

.streak-ember .mdi-fire {
  color: #ff6b35;
}

.greeting-artifact {
  position: relative;
  flex-shrink: 0;
  width: 160px;
  height: 160px;
  align-items: center;
  justify-content: center;
}

.magic-artifact {
  position: relative;
  z-index: 1;
  width: 140px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 18px rgba(112, 72, 232, 0.4));
  animation: home-crystal-float 7s ease-in-out infinite;
}

.artifact-glow {
  position: absolute;
  inset: 18%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(112, 72, 232, 0.35), transparent 70%);
  filter: blur(28px);
  pointer-events: none;
}

@keyframes home-crystal-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .magic-artifact {
    animation: none;
  }
}

@media (max-width: 959px) {
  .home-hud-greeting {
    gap: 0;
  }
}
</style>
