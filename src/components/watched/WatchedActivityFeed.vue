<template>
  <section class="watched-feed-block">
    <MissionSectionDivider
      :label="t('watched.sections.activityFeed')"
      icon="mdi-broadcast"
      :count="activities.length"
      flush-top
    />

    <div class="watched-feed-panel">
      <div v-if="loading && !activities.length" class="feed-skeleton">
        <div v-for="n in 4" :key="n" class="feed-skeleton-row">
          <v-skeleton-loader type="avatar" class="feed-skeleton-avatar" />
          <v-skeleton-loader type="text, text" class="feed-skeleton-copy" />
        </div>
      </div>

      <p v-else-if="!activities.length" class="feed-empty">
        {{ t('watched.feedEmpty') }}
      </p>

      <div v-else class="feed-list">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="activity-entry"
          role="button"
          tabindex="0"
          @click="$emit('open-mission', activity)"
          @keydown.enter.prevent="$emit('open-mission', activity)"
          @keydown.space.prevent="$emit('open-mission', activity)"
        >
          <v-avatar
            size="40"
            class="activity-avatar"
            @click.stop="$emit('open-hero', activity)"
          >
            <v-img v-if="activity.userAvatar" :src="activity.userAvatar" />
            <span v-else class="activity-initial">{{ activity.userName?.charAt(0) }}</span>
          </v-avatar>
          <div class="activity-copy">
            <div class="activity-text">
              <button
                type="button"
                class="activity-user"
                @click.stop="$emit('open-hero', activity)"
              >
                {{ activity.userName }}
              </button>
              {{ activity.text }}
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
  loading: { type: Boolean, default: false }
})

defineEmits(['open-mission', 'open-hero'])

const { t, locale } = useI18n()

function formatTime(timestamp) {
  return formatActivityTime(timestamp, { t, locale: locale.value })
}
</script>

<style scoped>
.watched-feed-block {
  min-width: 0;
}

.watched-feed-panel {
  border-radius: var(--home-radius, 22px);
  background: var(--home-surface, rgba(22, 27, 40, 0.55));
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  overflow: hidden;
}

.feed-empty {
  margin: 0;
  padding: 18px 16px;
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.9rem;
  line-height: 1.5;
}

.feed-skeleton {
  padding: 8px 12px 12px;
}

.feed-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
}

.feed-skeleton-avatar {
  width: 40px;
  flex-shrink: 0;
  background: transparent !important;
}

.feed-skeleton-copy {
  flex: 1;
  min-width: 0;
  background: transparent !important;
}

.activity-entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  color: inherit;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.06));
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease;
}

.activity-entry:last-child {
  border-bottom: none;
}

.activity-entry:hover,
.activity-entry:focus-visible {
  background: rgba(255, 255, 255, 0.04);
  outline: none;
}

.activity-avatar {
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}

.activity-initial {
  font-size: 0.9rem;
  font-weight: 800;
  color: #4fd1c5;
}

.activity-copy {
  min-width: 0;
  flex: 1;
}

.activity-text {
  color: var(--home-text, #f1f5f9);
  font-size: 0.9rem;
  line-height: 1.4;
}

.activity-user {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--home-teal, #4fd1c5);
  font-weight: 800;
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
}

.activity-user:hover {
  text-decoration: underline;
}

.activity-time {
  color: var(--home-text-dim, #94a3b8);
  font-size: 0.72rem;
  margin-top: 4px;
}
</style>
