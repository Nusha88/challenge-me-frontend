<template>
  <section class="activity-section">
    <div class="activity-header">
      <div>
        <h3 class="section-title">
          <v-icon color="#4FD1C5" class="mr-2" size="22">mdi-calendar-month</v-icon>
          {{ t('profile.activity') }}
        </h3>
        <p class="section-lead">{{ t('profile.activityLead') }}</p>
      </div>
      <div class="heatmap-legend">
        <span class="legend-label">{{ t('profile.heatmapLegendEmpty') }}</span>
        <div class="dot empty" :title="t('profile.heatmapLegendEmpty')" />
        <div class="dot miss" :title="t('profile.heatmapLegendMiss')" />
        <div class="dot low" :title="t('profile.heatmapLegendLow')" />
        <div class="dot mid" :title="t('profile.heatmapLegendMid')" />
        <div class="dot high" :title="t('profile.heatmapLegendHigh')" />
        <span class="legend-label">{{ t('profile.heatmapLegendHigh') }}</span>
      </div>
    </div>

    <div class="heatmap-scroll" :class="{ 'is-empty': !hasAnyScheduled }">
      <div v-if="!hasAnyScheduled" class="empty-overlay">
        <p class="empty-text">
          <template v-if="isOwnProfile">
            {{ t('profile.emptyActivityTextStart') }}
            <span>{{ t('profile.emptyActivityTextHighlight') }}</span>{{ t('profile.emptyActivityTextEnd') }}
          </template>
          <template v-else>
            {{ t('profile.emptyActivityOtherStart') }}
            <span>{{ t('profile.emptyActivityOtherHighlight') }}</span>{{ t('profile.emptyActivityOtherEnd') }}
          </template>
        </p>
      </div>

      <div class="heatmap-frame">
        <div class="month-row">
          <div class="weekday-spacer" />
          <div
            class="month-labels"
            :style="{ gridTemplateColumns: `repeat(${columns.length}, 12px)` }"
          >
            <span
              v-for="(label, i) in monthLabels"
              :key="`m-${i}`"
              class="month-label"
              :style="{ gridColumn: label.index + 1 }"
            >
              {{ label.show ? label.label : '' }}
            </span>
          </div>
        </div>

        <div class="heatmap-body">
          <div class="weekday-labels">
            <span>{{ weekdayLabels[0] }}</span>
            <span>{{ weekdayLabels[2] }}</span>
            <span>{{ weekdayLabels[4] }}</span>
          </div>

          <div class="heatmap-grid" :style="{ gridTemplateColumns: `repeat(${columns.length}, 12px)` }">
            <template v-for="(col, colIndex) in columns" :key="col.weekStartStr">
              <div
                v-for="(cell, dayIndex) in col.days"
                :key="cell.dateStr"
                class="heatmap-cell"
                :class="[
                  cellStats(cell.dateStr).level,
                  { future: cell.future }
                ]"
                :style="{ gridColumn: colIndex + 1, gridRow: dayIndex + 1 }"
              >
                <v-tooltip
                  v-if="!cell.future"
                  activator="parent"
                  location="top"
                  offset="8"
                >
                  <div class="tooltip-body">
                    {{ tooltipText(cell.dateStr) }}
                  </div>
                </v-tooltip>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildActivityHeatmap, ACTIVITY_LEVEL } from '../../utils/activityHeatmap'

const props = defineProps({
  habitChallenges: { type: Array, default: () => [] },
  checklistHistory: { type: Array, default: () => [] },
  userId: { type: [String, Number], default: null },
  isOwnProfile: { type: Boolean, default: true }
})

const { t, locale } = useI18n()

const heatmap = computed(() =>
  buildActivityHeatmap({
    habitChallenges: props.habitChallenges,
    checklistHistory: props.checklistHistory,
    userId: props.userId,
    locale: locale.value
  })
)

const columns = computed(() => heatmap.value.columns)
const monthLabels = computed(() => heatmap.value.monthLabels)
const hasAnyScheduled = computed(() => heatmap.value.hasAnyScheduled)

const weekdayLabels = computed(() => {
  // Monday-first short labels
  const formatter = new Intl.DateTimeFormat(locale.value, { weekday: 'short' })
  const monday = new Date(2024, 0, 1) // known Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return formatter.format(d)
  })
})

function cellStats(dateStr) {
  return (
    heatmap.value.byDate.get(dateStr) || {
      level: ACTIVITY_LEVEL.EMPTY,
      total: 0,
      completed: 0,
      scheduledHabits: 0,
      completedHabits: 0,
      checklistSteps: 0,
      completedSteps: 0
    }
  )
}

function tooltipText(dateStr) {
  const stats = cellStats(dateStr)
  const dateLabel = new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale.value)

  if (stats.total === 0) {
    return t('profile.activityTooltipEmpty', { date: dateLabel })
  }

  return t('profile.activityTooltip', {
    date: dateLabel,
    completed: stats.completed,
    total: stats.total,
    habitsDone: stats.completedHabits,
    habitsTotal: stats.scheduledHabits,
    stepsDone: stats.completedSteps,
    stepsTotal: stats.checklistSteps
  })
}
</script>

<style scoped>
.activity-section {
  margin-bottom: clamp(20px, 3vw, 32px);
  padding: 20px 22px;
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  border-radius: var(--home-radius, 16px);
}

.activity-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

@media (min-width: 600px) {
  .activity-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.section-title {
  margin: 0;
  display: flex;
  align-items: center;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--home-text, #f1f5f9);
}

.section-lead {
  margin: 6px 0 0;
  font-size: 0.85rem;
  color: var(--home-text-dim, #94a3b8);
  max-width: 48ch;
  line-height: 1.45;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.7rem;
  color: var(--home-text-dim, #94a3b8);
  margin: 0 2px;
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 3px;
}

.heatmap-scroll {
  position: relative;
  overflow-x: auto;
  padding-bottom: 4px;
}

.heatmap-scroll.is-empty .heatmap-frame {
  opacity: 0.35;
}

.empty-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 16px;
}

.empty-text {
  margin: 0;
  text-align: center;
  max-width: 36ch;
  font-size: 0.95rem;
  color: var(--home-text, #f1f5f9);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
}

.empty-text span {
  color: #4fd1c5;
  font-weight: 800;
}

.heatmap-frame {
  min-width: max-content;
}

.month-row {
  display: flex;
  margin-bottom: 4px;
}

.weekday-spacer {
  width: 28px;
  flex-shrink: 0;
}

.month-labels {
  display: grid;
  gap: 3px;
  font-size: 0.65rem;
  color: var(--home-text-dim, #94a3b8);
  height: 16px;
}

.month-label {
  white-space: nowrap;
  overflow: visible;
}

.heatmap-body {
  display: flex;
  gap: 6px;
}

.weekday-labels {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  gap: 3px;
  width: 22px;
  flex-shrink: 0;
  font-size: 0.6rem;
  color: var(--home-text-dim, #94a3b8);
  line-height: 12px;
}

.weekday-labels span:nth-child(1) { grid-row: 1; }
.weekday-labels span:nth-child(2) { grid-row: 3; }
.weekday-labels span:nth-child(3) { grid-row: 5; }

.heatmap-grid {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  gap: 3px;
}

.heatmap-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.12);
}

.heatmap-cell.future {
  opacity: 0.25;
  pointer-events: none;
}

.heatmap-cell.empty,
.dot.empty {
  background: rgba(148, 163, 184, 0.14);
}

.heatmap-cell.miss,
.dot.miss {
  background: rgba(248, 113, 113, 0.45);
}

.heatmap-cell.low,
.dot.low {
  background: rgba(79, 209, 197, 0.35);
}

.heatmap-cell.mid,
.dot.mid {
  background: rgba(79, 209, 197, 0.65);
}

.heatmap-cell.high,
.dot.high {
  background: #4fd1c5;
}

.tooltip-body {
  font-size: 0.8rem;
  line-height: 1.35;
}
</style>
