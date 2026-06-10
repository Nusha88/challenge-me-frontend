<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { notificationService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import NotificationListItem from './notifications/NotificationListItem.vue'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: String,
    default: null
  },
  unreadCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'unread-count-changed', 'close'])

const router = useRouter()
const { t } = useI18n()
const { mobile } = useDisplay()

const notifications = ref([])
const loading = ref(false)
const errorMessage = ref('')
const markingAllAsRead = ref(false)

const normalizedUserId = computed(() => {
  const id = props.currentUserId
  return id != null && id !== '' ? String(id) : null
})

function handleDrawerUpdate(value) {
  if (!value) {
    emit('update:modelValue', false)
    emit('close')
  }
}

function syncUnreadCountFromList() {
  const unreadFromList = notifications.value.filter((notification) => !notification.read).length
  if (unreadFromList !== props.unreadCount) {
    emit('unread-count-changed', unreadFromList)
  }
}

async function refreshUnreadCountFromApi() {
  if (!normalizedUserId.value) return

  try {
    const { data } = await notificationService.getUnreadCount(normalizedUserId.value)
    emit('unread-count-changed', Number(data?.count) || 0)
  } catch (error) {
    console.error('Error loading unread notification count:', error)
  }
}

async function loadNotifications() {
  if (!normalizedUserId.value) return

  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await notificationService.getNotifications(normalizedUserId.value, { limit: 50 })
    notifications.value = data.notifications || []
    syncUnreadCountFromList()
  } catch (error) {
    console.error('Error loading notifications:', error)
    notifications.value = []
    errorMessage.value = t('notifications.loadError')
    await refreshUnreadCountFromApi()
  } finally {
    loading.value = false
  }
}

function markNotificationReadOptimistic(notification) {
  if (notification.read) return

  notification.read = true
  const nextCount = Math.max(0, props.unreadCount - 1)
  emit('unread-count-changed', nextCount)
  notificationService.markAsRead(notification._id).catch((error) => {
    console.error('Error marking notification as read:', error)
  })
}

function closeDrawer(event) {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  emit('update:modelValue', false)
  emit('close')
}

function handleNotificationClick(notification) {
  closeDrawer()
  markNotificationReadOptimistic(notification)

  if (notification.type === 'daily_recap') {
    router.push('/today')
    return
  }

  const challengeId = notification.challengeId?._id || notification.challengeId
  if (!challengeId) return

  dispatchAppEvent(APP_EVENTS.OPEN_CHALLENGE, {
    challengeId: String(challengeId),
    commentId: notification.commentId ? String(notification.commentId) : null,
    replyId: notification.replyId ? String(notification.replyId) : null
  })
}

async function markAllAsRead() {
  if (!normalizedUserId.value || props.unreadCount === 0) return

  markingAllAsRead.value = true
  try {
    await notificationService.markAllAsRead(normalizedUserId.value)
    notifications.value.forEach((n) => { n.read = true })
    emit('unread-count-changed', 0)
  } catch (error) {
    console.error('Error marking all as read:', error)
    errorMessage.value = t('notifications.markAllAsReadError')
  } finally {
    markingAllAsRead.value = false
  }
}

async function deleteNotification(notification) {
  try {
    await notificationService.deleteNotification(notification._id)
    notifications.value = notifications.value.filter((n) => n._id !== notification._id)
    if (!notification.read) {
      emit('unread-count-changed', Math.max(0, props.unreadCount - 1))
    }
  } catch (error) {
    console.error('Error deleting notification:', error)
    errorMessage.value = t('notifications.deleteError')
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && normalizedUserId.value) {
      loadNotifications()
    }
    if (!isOpen) {
      errorMessage.value = ''
    }
  }
)

watch(
  () => normalizedUserId.value,
  (userId) => {
    if (userId && props.modelValue) {
      loadNotifications()
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <v-navigation-drawer
      v-if="modelValue"
      :model-value="true"
      location="right"
      temporary
      :width="mobile ? '100%' : '400'"
      class="notification-drawer"
      :class="{ 'notification-drawer-desktop': !mobile }"
      :z-index="2400"
      @update:model-value="handleDrawerUpdate"
    >
    <div class="notification-header">
      <div class="header-left">
        <div class="bell-glow-container">
          <v-icon color="#7048E8">mdi-bell-outline</v-icon>
          <div v-if="unreadCount > 0" class="pulse-indicator"></div>
        </div>
        <span class="header-title">{{ t('notifications.title') }}</span>
        <span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</span>
      </div>

      <div class="header-actions">
        <v-btn
          v-if="unreadCount > 0"
          icon="mdi-check-all"
          size="small"
          variant="text"
          class="action-btn"
          :loading="markingAllAsRead"
          @click="markAllAsRead"
        />
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          class="action-btn"
          @click.stop="closeDrawer"
        />
      </div>
    </div>

    <v-divider class="glass-divider" />

    <div class="notification-content">
      <v-progress-linear v-if="loading" indeterminate color="#7048E8" height="2" />

      <div v-else-if="errorMessage" class="empty-state">
        <div class="empty-icon-wrapper error">
          <v-icon size="48">mdi-alert-circle-outline</v-icon>
        </div>
        <p class="empty-text error-text">{{ errorMessage }}</p>
        <v-btn
          variant="outlined"
          color="#7048E8"
          class="mt-4"
          @click="loadNotifications"
        >
          {{ t('notifications.retry') }}
        </v-btn>
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <v-icon size="48">mdi-ghost-outline</v-icon>
        </div>
        <p class="empty-text">{{ t('notifications.noNotifications') }}</p>
      </div>

      <div v-else class="notification-list">
        <NotificationListItem
          v-for="notification in notifications"
          :key="notification._id"
          :notification="notification"
          @click="handleNotificationClick"
          @delete="deleteNotification"
        />
      </div>
    </div>
    </v-navigation-drawer>
  </Teleport>
</template>

<style scoped>
.notification-drawer {
  background: rgba(13, 13, 23, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border-left: 1px solid rgba(112, 72, 232, 0.2) !important;
  color: #fff !important;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.6) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bell-glow-container {
  position: relative;
  display: flex;
}

.pulse-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #ff4d4d;
  border-radius: 50%;
  box-shadow: 0 0 10px #ff4d4d;
  animation: pulse 2s infinite;
}

.notification-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.2);
}

.empty-icon-wrapper.error {
  color: rgba(255, 82, 82, 0.75);
}

.empty-text {
  color: rgba(255, 255, 255, 0.4);
  font-weight: 500;
}

.error-text {
  color: rgba(255, 255, 255, 0.72);
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
}

@media (min-width: 960px) {
  .notification-drawer-desktop {
    margin-top: 64px !important;
    height: calc(100% - 64px) !important;
  }
}
</style>
