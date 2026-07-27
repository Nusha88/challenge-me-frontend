<script setup>
import { useI18n } from 'vue-i18n'
import { formatActivityTime } from '../../utils/activityTime'
import {
  getNotificationIcon,
  getNotificationSenderName,
  getNotificationText,
  getNotificationInitial
} from '../../utils/notificationDisplay'

defineProps({
  notification: {
    type: Object,
    required: true
  }
})

defineEmits(['click', 'delete'])

const { t, locale } = useI18n()

function formatDate(dateString) {
  return formatActivityTime(dateString, { t, locale: locale.value, keyPrefix: 'notifications' })
}
</script>

<template>
  <div
    :class="['notification-row', { unread: !notification.read }]"
    role="button"
    tabindex="0"
    @click="$emit('click', notification)"
    @keydown.enter.prevent="$emit('click', notification)"
    @keydown.space.prevent="$emit('click', notification)"
  >
    <div class="row-avatar">
      <div
        v-if="notification.type === 'daily_recap'"
        class="avatar-placeholder recap-avatar"
      >
        <v-icon size="20" color="#0b0d12">mdi-weather-sunset-up</v-icon>
      </div>
      <div
        v-else-if="notification.type === 'referral_completed'"
        class="avatar-placeholder referral-avatar"
      >
        <v-icon size="20" color="#0b0d12">mdi-gift</v-icon>
      </div>
      <template v-else>
        <img
          v-if="notification.fromUserId?.avatarUrl"
          :src="notification.fromUserId.avatarUrl"
          class="avatar-img"
          alt=""
        />
        <div v-else class="avatar-placeholder">
          {{ getNotificationInitial(notification.fromUserId?.name) }}
        </div>
      </template>
      <div class="type-badge">
        <v-icon size="10" color="#4FD1C5">{{ getNotificationIcon(notification.type) }}</v-icon>
      </div>
    </div>

    <div class="row-body">
      <div class="row-top">
        <span class="sender-name">{{ getNotificationSenderName(notification, t) }}</span>
        <span class="time-stamp">{{ formatDate(notification.createdAt) }}</span>
      </div>
      <p class="message-text">{{ getNotificationText(notification, t) }}</p>
    </div>

    <v-btn
      icon="mdi-close"
      size="x-small"
      variant="text"
      class="delete-btn"
      :aria-label="t('notifications.delete')"
      @click.stop="$emit('delete', notification)"
    />
  </div>
</template>

<style scoped>
.notification-row {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.06));
  cursor: pointer;
  transition: background 0.2s ease;
}

.notification-row:hover,
.notification-row:focus-visible {
  background: rgba(255, 255, 255, 0.04);
  outline: none;
}

.notification-row.unread {
  background: rgba(79, 209, 197, 0.06);
  box-shadow: inset 3px 0 0 #4fd1c5;
}

.notification-row.unread:hover,
.notification-row.unread:focus-visible {
  background: rgba(79, 209, 197, 0.1);
}

.row-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-img,
.avatar-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.1));
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
  color: #4fd1c5;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.recap-avatar {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #0b0d12;
  border-color: rgba(251, 191, 36, 0.35);
}

.referral-avatar {
  background: linear-gradient(135deg, #4fd1c5, #2dd4bf);
  color: #0b0d12;
  border-color: rgba(79, 209, 197, 0.35);
}

.type-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #0f131c;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.12));
}

.row-body {
  flex: 1;
  min-width: 0;
}

.row-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
}

.sender-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--home-text, #f1f5f9);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-stamp {
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--home-text-faint, #64748b);
}

.message-text {
  margin: 0;
  font-size: 0.82rem;
  color: var(--home-text-dim, #94a3b8);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.delete-btn {
  flex-shrink: 0;
  margin-top: 2px;
  opacity: 0.45;
  color: var(--home-text-dim, #94a3b8) !important;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.notification-row:hover .delete-btn,
.notification-row:focus-within .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #f87171 !important;
}

@media (hover: none) {
  .delete-btn {
    opacity: 0.7;
  }
}
</style>
