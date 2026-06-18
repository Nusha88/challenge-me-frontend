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
    :class="['notification-card', { unread: !notification.read }]"
    @click="$emit('click', notification)"
  >
    <div class="card-glow"></div>

    <div class="card-avatar">
      <div
        v-if="notification.type === 'daily_recap'"
        class="avatar-placeholder recap-avatar"
      >
        <v-icon size="22" color="white">mdi-weather-sunset-up</v-icon>
      </div>
      <div
        v-else-if="notification.type === 'referral_completed'"
        class="avatar-placeholder referral-avatar"
      >
        <v-icon size="22" color="white">mdi-gift</v-icon>
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
      <div class="type-icon-small" :class="notification.type">
        <v-icon size="10">{{ getNotificationIcon(notification.type) }}</v-icon>
      </div>
    </div>

    <div class="card-info">
      <div class="info-top">
        <span class="user-name">{{ getNotificationSenderName(notification, t) }}</span>
        <span class="time-stamp">{{ formatDate(notification.createdAt) }}</span>
      </div>
      <p class="message-text">{{ getNotificationText(notification, t) }}</p>
    </div>

    <v-btn
      icon="mdi-close"
      size="x-small"
      variant="text"
      class="delete-btn"
      @click.stop="$emit('delete', notification)"
    />
  </div>
</template>

<style scoped>
.notification-card {
  position: relative;
  display: flex;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.notification-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(112, 72, 232, 0.3);
  transform: translateX(-4px);
}

.notification-card.unread {
  background: rgba(112, 72, 232, 0.08);
  border-left: 3px solid #7048E8;
}

.notification-card.unread .card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 10% 50%, rgba(112, 72, 232, 0.15), transparent 70%);
}

.card-avatar {
  position: relative;
  margin-right: 14px;
}

.avatar-img,
.avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar-placeholder {
  background: linear-gradient(135deg, #7048e8 0%, #be4bdb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.recap-avatar {
  background: linear-gradient(135deg, #3c60e8 0%, #7048e8 100%);
}

.referral-avatar {
  background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%);
}

.type-icon-small {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.info-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.user-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #fff;
}

.time-stamp {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.message-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  color: rgba(255, 255, 255, 0.3) !important;
}

.notification-card:hover .delete-btn {
  opacity: 1;
}
</style>
