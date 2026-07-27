<template>
  <div
    v-if="visible"
    class="streak-button d-none d-md-inline-flex"
    :class="{ 'streak-yesterday': isYesterdayStreak }"
  >
    <i class="mdi mdi-fire"></i>
    <span>{{ displayDays }} {{ streakDaysText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  displayStreakDays: { type: Number, default: 0 },
  yesterdayStreakDays: { type: Number, default: 0 },
  hasTodayCompletedTasks: { type: Boolean, default: false },
  streakDaysText: { type: String, default: '' },
  visible: { type: Boolean, default: false }
})

const isYesterdayStreak = computed(() => {
  return !props.hasTodayCompletedTasks && props.yesterdayStreakDays > 0
})

const displayDays = computed(() => {
  return isYesterdayStreak.value ? props.yesterdayStreakDays : props.displayStreakDays
})
</script>

<style scoped>
.streak-button {
  background: rgba(251, 191, 36, 0.1) !important;
  border: 1px solid rgba(251, 191, 36, 0.32) !important;
  border-radius: 12px;
  padding: 6px 14px;
  color: var(--home-gold, #fbbf24) !important;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.12);
}

.streak-button i {
  font-size: 20px;
  filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.55));
}

.streak-yesterday {
  filter: grayscale(0.8);
  opacity: 0.7;
}
</style>
