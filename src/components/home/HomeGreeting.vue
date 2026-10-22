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
        :class="streakHeatClass"
      >
        <i class="mdi mdi-fire" aria-hidden="true"></i>
        <span>{{ streakLabel }} {{ streakDaysText }}</span>
      </div>
    </div>

    <button
      type="button"
      class="greeting-hero"
      :aria-label="t('navigation.profile')"
      @click="$emit('profile')"
    >
      <RankedAvatar
        :avatar-url="avatarUrl"
        :seed="userSeed"
        :initials="initials"
        :alt="userName"
        :size="avatarSize"
        :level="userLevel"
        clickable
      />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import RankedAvatar from '../user/RankedAvatar.vue'
import { getStreakHeatTier } from '../../utils/streakUtils'

const props = defineProps({
  userName: { type: String, default: '' },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  motivationalMessage: { type: String, default: '' },
  motivationalMessageCompleted: { type: String, default: '' },
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  streakDaysText: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  userSeed: { type: [String, Number], default: '' },
  userLevel: { type: Number, default: 1 }
})

defineEmits(['profile'])

const { t } = useI18n()
const { mdAndUp } = useDisplay()

const avatarSize = computed(() => (mdAndUp.value ? 72 : 52))

const initials = computed(() => {
  const parts = String(props.userName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
})

const showMobileStreak = computed(() => {
  return props.yesterdayStreakDays > 0 || props.displayStreakDays > 0
})

const isYesterdayStreak = computed(() => {
  return !props.hasTodayCompletedTasks && props.yesterdayStreakDays > 0
})

const streakLabel = computed(() => {
  if (isYesterdayStreak.value) return props.yesterdayStreakDays
  return props.displayStreakDays
})

const streakHeatClass = computed(() => {
  const tier = getStreakHeatTier(streakLabel.value)
  return {
    'streak-ember--yesterday': isYesterdayStreak.value,
    'streak-ember--pulse': !isYesterdayStreak.value && tier >= 7,
    [`streak-ember--heat-${tier}`]: tier > 0
  }
})
</script>

<style scoped>
.home-hud-greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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

.greeting-hero {
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}

.streak-ember {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 6px 12px;
  border-radius: var(--home-radius-pill, 999px);
  background: rgba(255, 107, 53, 0.12);
  border: 1px solid rgba(255, 107, 53, 0.4);
  color: #ffd4a8;
  font-size: 0.8rem;
  font-weight: 700;
}

.streak-ember .mdi-fire {
  color: #ff6b35;
}

.streak-ember--heat-1 {
  box-shadow: 0 0 10px rgba(255, 107, 53, 0.18);
}

.streak-ember--heat-3 {
  background: rgba(255, 107, 53, 0.18);
  border-color: rgba(255, 107, 53, 0.55);
  color: #ffe0c2;
  box-shadow: 0 0 14px rgba(255, 107, 53, 0.28);
}

.streak-ember--heat-3 .mdi-fire {
  color: #ff7a2e;
}

.streak-ember--heat-7 {
  background: rgba(255, 69, 0, 0.22);
  border-color: rgba(255, 69, 0, 0.65);
  color: #fff1e0;
  box-shadow: 0 0 18px rgba(255, 69, 0, 0.38);
}

.streak-ember--heat-7 .mdi-fire {
  color: #ff4500;
}

.streak-ember--heat-14 {
  background: linear-gradient(135deg, rgba(255, 69, 0, 0.28), rgba(255, 191, 36, 0.22));
  border-color: rgba(255, 191, 36, 0.7);
  color: #fff7ea;
  box-shadow: 0 0 22px rgba(255, 69, 0, 0.5);
}

.streak-ember--heat-14 .mdi-fire {
  color: #ff4500;
  filter: drop-shadow(0 0 8px rgba(255, 191, 36, 0.8));
}

.streak-ember--pulse .mdi-fire {
  animation: streak-fire-pulse 1.6s ease-in-out infinite;
}

.streak-ember--yesterday {
  opacity: 0.7;
  filter: saturate(0.55);
  box-shadow: none;
  animation: none;
}

.streak-ember--yesterday .mdi-fire {
  animation: none;
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
  .streak-ember--pulse .mdi-fire {
    animation: none;
  }
}

@media (max-width: 959px) {
  .home-hud-greeting {
    gap: 0.75rem;
  }
}
</style>
