<template>
  <div class="habit-progress-calendar">
    <p v-if="lead" class="progress-lead">{{ lead }}</p>
    <slot name="header" />
    <div v-if="ready" class="calendar-grid">
      <div
        v-for="day in days"
        :key="day.date"
        class="day-cell"
        :class="dayClass(day)"
        :style="dayStyle(day)"
        @click="$emit('day-click', day)"
      >
        <slot name="day" :day="day" />
      </div>
    </div>
    <slot name="legend" />
  </div>
</template>

<script setup>
defineProps({
  days: { type: Array, default: () => [] },
  ready: { type: Boolean, default: true },
  lead: { type: String, default: '' },
  dayClass: { type: Function, required: true },
  dayStyle: { type: Function, required: true }
})

defineEmits(['day-click'])
</script>

<style scoped>
.progress-lead {
  margin: 0 0 14px;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--home-text-dim, #94a3b8);
  max-width: 52ch;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
</style>
