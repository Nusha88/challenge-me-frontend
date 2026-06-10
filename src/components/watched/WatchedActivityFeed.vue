<template>
  <v-card class="sidebar-widget" variant="flat">
    <div class="widget-header pa-4 d-flex align-center">
      <v-icon color="teal-accent-4" class="mr-2">mdi-broadcast</v-icon>
      <span class="text-overline font-weight-black">{{ t('watched.surveillanceFeed') }}</span>
    </div>
    <div class="feed-scroll no-scrollbar px-2">
      <div v-for="activity in activities" :key="activity.id" class="activity-entry pa-3">
        <div class="d-flex align-start gap-3">
          <v-avatar size="24" class="mt-1">
            <v-img v-if="activity.userAvatar" :src="activity.userAvatar" />
            <span v-else class="text-caption">{{ activity.userName?.charAt(0) }}</span>
          </v-avatar>
          <div>
            <div class="text-caption activity-text">
              <b class="activity-user">{{ activity.userName }}</b> {{ activity.text }}
            </div>
            <div class="text-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { formatActivityTime } from '../../utils/activityTime'

defineProps({
  activities: { type: Array, default: () => [] }
})

const { t, locale } = useI18n()

function formatTime(timestamp) {
  return formatActivityTime(timestamp, { t, locale: locale.value })
}
</script>

<style scoped>
.sidebar-widget {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
}

.widget-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.widget-header .text-overline {
  color: #ffffff !important;
  letter-spacing: 2px;
}

.feed-scroll {
  max-height: 420px;
  overflow-y: auto;
}

.activity-entry {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.activity-entry .activity-text {
  color: rgba(255, 255, 255, 0.85);
}

.activity-entry .activity-user {
  color: #4fd1c5;
  font-weight: 800;
}

.text-time {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.7rem;
  margin-top: 2px;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

@media (max-width: 960px) {
  .sidebar-widget {
    border-radius: 16px !important;
  }

  .widget-header {
    padding: 10px 12px !important;
  }
}
</style>
