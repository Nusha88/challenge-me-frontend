<template>
  <section class="watched-rail-block">
    <MissionSectionDivider
      :label="t('watched.sections.activityFeed')"
      icon="mdi-broadcast"
      :count="activities.length"
      :flush-top="flushTop"
    />
    <div class="watched-rail-panel">
      <p v-if="!activities.length" class="feed-empty">
        {{ t('watched.feedEmpty') }}
      </p>
      <div v-else class="feed-scroll">
        <div v-for="activity in activities" :key="activity.id" class="activity-entry">
          <v-avatar size="24" class="activity-avatar">
            <v-img v-if="activity.userAvatar" :src="activity.userAvatar" />
            <span v-else class="text-caption">{{ activity.userName?.charAt(0) }}</span>
          </v-avatar>
          <div class="activity-copy">
            <div class="activity-text">
              <b class="activity-user">{{ activity.userName }}</b> {{ activity.text }}
            </div>
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import MissionSectionDivider from '../MissionSectionDivider.vue'
import { formatActivityTime } from '../../utils/activityTime'

defineProps({
  activities: { type: Array, default: () => [] },
  flushTop: { type: Boolean, default: false }
})

const { t, locale } = useI18n()

function formatTime(timestamp) {
  return formatActivityTime(timestamp, { t, locale: locale.value })
}
</script>

<style scoped>
.watched-rail-block {
  margin-bottom: 8px;
}

.watched-rail-panel {
  padding: 8px 10px 12px;
  border-radius: var(--home-radius, 22px);
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.feed-empty {
  margin: 8px 6px;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.85rem;
  line-height: 1.45;
}

.feed-scroll {
  max-height: 420px;
  overflow-y: auto;
}

.activity-entry {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 6px;
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.06));
}

.activity-entry:last-child {
  border-bottom: none;
}

.activity-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.activity-copy {
  min-width: 0;
}

.activity-text {
  color: var(--home-text, #f1f5f9);
  font-size: 0.8rem;
  line-height: 1.4;
}

.activity-user {
  color: var(--home-teal, #4fd1c5);
  font-weight: 800;
}

.activity-time {
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.7rem;
  margin-top: 2px;
}

.feed-scroll::-webkit-scrollbar {
  width: 4px;
}

.feed-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}
</style>
