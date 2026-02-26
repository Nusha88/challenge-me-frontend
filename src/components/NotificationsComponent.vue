<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { notificationService } from '../services/api'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'unread-count-changed', 'close'])

const router = useRouter()
const { t, locale } = useI18n()
const { mobile } = useDisplay()

const internalDrawerOpen = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

const drawerRef = ref(null)

const notifications = ref([])
const loading = ref(false)
const errorMessage = ref('')
const unreadCount = ref(0)
const markingAllAsRead = ref(false)
let pollInterval = null

function handleDrawerUpdate(value) {
  emit('update:modelValue', value)
}

function getCurrentUserId() {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    const parsed = JSON.parse(storedUser)
    return parsed?.id || parsed?._id || props.currentUserId || null
  } catch {
    return props.currentUserId || null
  }
}

async function loadNotifications() {
  const userId = getCurrentUserId()
  if (!userId) return

  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await notificationService.getNotifications(userId, { limit: 50 })
    notifications.value = data.notifications || []
  } catch (error) {
    console.error('Error loading notifications:', error)
    errorMessage.value = t('notifications.loadError')
  } finally {
    loading.value = false
  }
}

async function loadUnreadCount() {
  const userId = getCurrentUserId()
  if (!userId) return

  try {
    const { data } = await notificationService.getUnreadCount(userId)
    unreadCount.value = data.count || 0
  } catch (error) {
    console.error('Error loading unread count:', error)
  }
}

async function handleNotificationClick(notification) {
  if (!notification.read) {
    try {
      await notificationService.markAsRead(notification._id)
      notification.read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      // Emit event to update parent component's badge
      emit('unread-count-changed', unreadCount.value)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Navigate to challenge with comment/reply ID in hash if available
  const challengeId = notification.challengeId._id || notification.challengeId
  let hash = ''
  
  if (notification.commentId && notification.replyId) {
    // Navigate to specific reply
    hash = `#comment-${notification.commentId}-${notification.replyId}`
  } else if (notification.commentId) {
    // Navigate to specific comment
    hash = `#comment-${notification.commentId}`
  }
  
  router.push(`/missions/${challengeId}${hash}`)
  closeDrawer()
}

async function markAllAsRead() {
  const userId = getCurrentUserId()
  if (!userId || unreadCount.value === 0) return

  markingAllAsRead.value = true
  try {
    await notificationService.markAllAsRead(userId)
    notifications.value.forEach(n => { n.read = true })
    unreadCount.value = 0
    // Emit event to update parent component's badge
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
    notifications.value = notifications.value.filter(n => n._id !== notification._id)
    if (!notification.read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      // Emit event to update parent component's badge
      emit('unread-count-changed', unreadCount.value)
    }
  } catch (error) {
    console.error('Error deleting notification:', error)
    errorMessage.value = t('notifications.deleteError')
  }
}

function getNotificationText(notification) {
  if (notification.type === 'mention') {
    return t('notifications.mentionedInComment', {
      challenge: notification.challengeId?.title || t('notifications.challenge')
    })
  }
  if (notification.type === 'join') {
    return t('notifications.userJoinedChallenge', {
      challenge: notification.challengeId?.title || t('notifications.challenge')
    })
  }
  if (notification.type === 'watch') {
    return t('notifications.userWatchingChallenge', {
      challenge: notification.challengeId?.title || t('notifications.challenge')
    })
  }
  if (notification.type === 'comment') {
    return t('notifications.newComment', {
      challenge: notification.challengeId?.title || t('notifications.challenge')
    })
  }
  return t('notifications.newComment', {
    challenge: notification.challengeId?.title || t('notifications.challenge')
  })
}
const getNotificationIcon = (type) => {
  const icons = {
    'like': 'mdi-heart',
    'comment': 'mdi-comment-text-outline',
    'follow': 'mdi-account-plus',
    'join': 'mdi-sword-cross',
    'mention': 'mdi-at',
    'achievement': 'mdi-trophy-variant-outline'
  };
  return icons[type] || 'mdi-bell-ring-outline';
};

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  
  try {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('notifications.justNow')
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays })

    const formatter = new Intl.DateTimeFormat(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    return formatter.format(date)
  } catch (err) {
    return date.toLocaleDateString()
  }
}

function getInitial(name) {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

function closeDrawer(event) {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  
  // Emit first to update parent state
  emit('update:modelValue', false)
  emit('close')
  
  // Force hide the drawer immediately using DOM manipulation
  // Since modelValue is already false, the drawer state is out of sync
  // Try using the ref first
  if (drawerRef.value) {
    try {
      // Access Vuetify component's internal state
      if (drawerRef.value.modelValue !== undefined) {
        drawerRef.value.modelValue = false
      }
      // Also manipulate DOM directly
      const drawerEl = drawerRef.value.$el || drawerRef.value
      if (drawerEl) {
        drawerEl.style.transform = 'translateX(100%)'
        drawerEl.style.visibility = 'hidden'
        drawerEl.classList.remove('v-navigation-drawer--active')
      }
    } catch (e) {
      // Silently handle error
    }
  }
  
  // Also find by selector as backup
  setTimeout(() => {
    const drawers = document.querySelectorAll('.v-navigation-drawer[location="right"]')
    drawers.forEach(drawer => {
      drawer.style.transform = 'translateX(100%)'
      drawer.style.visibility = 'hidden'
      drawer.style.display = 'none'
      drawer.classList.remove('v-navigation-drawer--active')
      drawer.setAttribute('aria-hidden', 'true')
    })
    
    // Hide all scrims
    const scrims = document.querySelectorAll('.v-navigation-drawer__scrim')
    scrims.forEach(scrim => {
      scrim.style.display = 'none'
      scrim.style.opacity = '0'
      scrim.style.visibility = 'hidden'
    })
  }, 10)
}

// Poll for new notifications every 30 seconds
function startPolling() {
  if (pollInterval) return
  pollInterval = setInterval(() => {
    if (getCurrentUserId()) {
      loadUnreadCount()
    }
  }, 30000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

watch(() => props.currentUserId, () => {
  if (props.currentUserId) {
    loadNotifications()
    loadUnreadCount()
  }
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && getCurrentUserId()) {
    loadNotifications()
    loadUnreadCount()
  }
  
  // Force close drawer if modelValue is false but drawer is still visible
  if (!isOpen) {
    nextTick(() => {
      const drawers = document.querySelectorAll('.v-navigation-drawer[location="right"]')
      drawers.forEach(drawer => {
        drawer.style.transform = 'translateX(100%)'
        drawer.style.visibility = 'hidden'
        drawer.style.display = 'none'
        drawer.classList.remove('v-navigation-drawer--active')
      })
      
      const scrims = document.querySelectorAll('.v-navigation-drawer__scrim')
      scrims.forEach(scrim => {
        scrim.style.display = 'none'
      })
    })
  }
})

onMounted(() => {
  // Force close drawer on mount to prevent it from opening on page reload
  if (props.modelValue) {
    emit('update:modelValue', false)
  }
  
  // Also force close via DOM manipulation with !important to override any conflicting styles
  nextTick(() => {
    const drawers = document.querySelectorAll('.v-navigation-drawer[location="right"]')
    drawers.forEach(drawer => {
      drawer.style.setProperty('transform', 'translateX(100%)', 'important')
      drawer.style.setProperty('visibility', 'hidden', 'important')
      drawer.style.setProperty('display', 'none', 'important')
      drawer.style.setProperty('right', '-100%', 'important')
      drawer.style.setProperty('opacity', '0', 'important')
      drawer.classList.remove('v-navigation-drawer--active')
      drawer.setAttribute('aria-hidden', 'true')
    })
    
    const scrims = document.querySelectorAll('.v-navigation-drawer__scrim')
    scrims.forEach(scrim => {
      scrim.style.setProperty('display', 'none', 'important')
      scrim.style.setProperty('opacity', '0', 'important')
      scrim.style.setProperty('visibility', 'hidden', 'important')
    })
  })
  
  if (getCurrentUserId()) {
    loadNotifications()
    loadUnreadCount()
    startPolling()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<template>
  <v-navigation-drawer
    ref="drawerRef"
    :model-value="modelValue"
    @update:model-value="handleDrawerUpdate"
    location="right"
    temporary
    :width="mobile ? '100%' : '400'"
    class="notification-drawer"
    :class="{ 'drawer-closed': !modelValue, 'notification-drawer-desktop': !mobile }"
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
          @click="markAllAsRead"
        ></v-btn>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          class="action-btn"
          @click.stop="closeDrawer"
        ></v-btn>
      </div>
    </div>

    <v-divider class="glass-divider"></v-divider>

    <div class="notification-content">
      <v-progress-linear v-if="loading" indeterminate color="#7048E8" height="2"></v-progress-linear>

      <div v-if="!loading && notifications.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <v-icon size="48">mdi-ghost-outline</v-icon>
        </div>
        <p class="empty-text">{{ t('notifications.noNotifications') }}</p>
      </div>

      <div v-else class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification._id"
          :class="['notification-card', { 'unread': !notification.read }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="card-glow"></div>
          
          <div class="card-avatar">
            <img
              v-if="notification.fromUserId?.avatarUrl"
              :src="notification.fromUserId.avatarUrl"
              class="avatar-img"
            />
            <div v-else class="avatar-placeholder">
              {{ getInitial(notification.fromUserId?.name) }}
            </div>
            <div class="type-icon-small" :class="notification.type">
               <v-icon size="10">{{ getNotificationIcon(notification.type) }}</v-icon>
            </div>
          </div>

          <div class="card-info">
            <div class="info-top">
              <span class="user-name">{{ notification.fromUserId?.name || t('common.unknown') }}</span>
              <span class="time-stamp">{{ formatDate(notification.createdAt) }}</span>
            </div>
            <p class="message-text">{{ getNotificationText(notification) }}</p>
          </div>

          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            class="delete-btn"
            @click.stop="deleteNotification(notification)"
          ></v-btn>
        </div>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
/* Основной контейнер дровера */
.notification-drawer {
  background: rgba(13, 13, 23, 0.95) !important; /* Глубокий темный фон */
  backdrop-filter: blur(20px) !important;
  border-left: 1px solid rgba(112, 72, 232, 0.2) !important;
  color: #fff !important;
}

/* Шапка */
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
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%);
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

/* Карточки уведомлений */
.notification-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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
  top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle at 10% 50%, rgba(112, 72, 232, 0.15), transparent 70%);
}

/* Аватар */
.card-avatar {
  position: relative;
  margin-right: 14px;
}

.avatar-img, .avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.avatar-placeholder {
  background: linear-gradient(135deg, #7048E8 0%, #BE4BDB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.type-icon-small {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: #1A1A2E;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,0.1);
}

/* Текст */
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

/* Кнопка удаления */
.delete-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
  color: rgba(255,255,255,0.3) !important;
}

.notification-card:hover .delete-btn {
  opacity: 1;
}

/* Пустое состояние */
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
  background: rgba(255,255,255,0.03);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: rgba(255,255,255,0.2);
}

.empty-text {
  color: rgba(255,255,255,0.4);
  font-weight: 500;
}

/* Анимации */
@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 77, 77, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
}

/* Глобальные фиксы для дровера */
.drawer-closed {
  transform: translateX(100%) !important;
  visibility: hidden !important;
}

@media (min-width: 960px) {
  .notification-drawer-desktop {
    margin-top: 64px !important;
    height: calc(100% - 64px) !important;
  }
}
</style>

