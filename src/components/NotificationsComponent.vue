<template>
  <v-navigation-drawer
    ref="drawerRef"
    :model-value="modelValue"
    @update:model-value="handleDrawerUpdate"
    location="right"
    temporary
    :width="mobile ? '100%' : '400'"
    :class="{ 'drawer-closed': !modelValue, 'notification-drawer-desktop': !mobile }"
  >
    <v-card-title class="d-flex align-center justify-space-between pa-4">
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-bell</v-icon>
        <span class="text-h6">{{ t('notifications.title') }}</span>
        <v-chip
          v-if="unreadCount > 0"
          color="error"
          size="small"
          class="ml-2"
        >
          {{ unreadCount }}
        </v-chip>
      </div>
      <div class="d-flex align-center gap-2">
        <v-btn
          v-if="unreadCount > 0"
          icon="mdi-check-all"
          size="small"
          variant="text"
          :loading="markingAllAsRead"
          @click="markAllAsRead"
          :title="t('notifications.markAllAsRead')"
        ></v-btn>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click.stop="closeDrawer"
          style="z-index: 1000; position: relative;"
        ></v-btn>
      </div>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text class="pa-0">
      <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="ma-4"
      >
        {{ errorMessage }}
      </v-alert>

      <div v-if="!loading && notifications.length === 0" class="text-center pa-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-bell-off-outline</v-icon>
        <p class="text-body-1 text-medium-emphasis">{{ t('notifications.noNotifications') }}</p>
      </div>

      <v-list v-else class="pa-0">
        <v-list-item
          v-for="notification in notifications"
          :key="notification._id"
          :class="['notification-item', { 'notification-unread': !notification.read }]"
          @click="handleNotificationClick(notification)"
        >
          <template v-slot:prepend>
            <div class="notification-avatar mr-3">
              <img
                v-if="notification.fromUserId?.avatarUrl"
                :src="notification.fromUserId.avatarUrl"
                :alt="notification.fromUserId.name"
                class="avatar-img"
              />
              <div v-else class="avatar-placeholder">
                {{ getInitial(notification.fromUserId?.name) }}
              </div>
            </div>
          </template>

          <v-list-item-title class="notification-title">
            <div class="d-flex align-center">
              <span class="font-weight-medium">{{ notification.fromUserId?.name || t('common.unknown') }}</span>
              <v-chip
                v-if="!notification.read"
                color="primary"
                size="x-small"
                class="ml-2 unread-indicator"
              ></v-chip>
            </div>
          </v-list-item-title>

          <v-list-item-subtitle class="notification-subtitle">
            {{ getNotificationText(notification) }}
          </v-list-item-subtitle>

          <v-list-item-subtitle class="notification-date text-caption">
            {{ formatDate(notification.createdAt) }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click.stop="deleteNotification(notification)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-navigation-drawer>
</template>

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

<style scoped>
.notification-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.notification-unread {
  background-color: rgba(25, 118, 210, 0.05);
}

.notification-avatar {
  flex-shrink: 0;
}

.avatar-img,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1FA0F6 0%, #A62EE8 100%) !important;
  color: white !important;
  font-weight: 600;
  font-size: 16px;
  border-radius: 50%;
  min-width: 40px;
  min-height: 40px;
}

.notification-title {
  margin-bottom: 4px;
}

.notification-subtitle {
  margin-top: 4px;
  white-space: normal;
  word-wrap: break-word;
}

.notification-date {
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.6);
}

.unread-indicator {
  min-width: 8px !important;
  width: 8px !important;
  height: 8px !important;
  padding: 0 !important;
  border-radius: 50% !important;
}
</style>

<style>
/* Global style to force hide notifications drawer when closed */
.drawer-closed,
.v-navigation-drawer.drawer-closed {
  transform: translateX(100%) !important;
  visibility: hidden !important;
  display: none !important;
  right: -100% !important;
  opacity: 0 !important;
  pointer-events: none !important;
  position: fixed !important;
  z-index: -1 !important;
}

/* Add margin-top for desktop to prevent hiding under header */
@media (min-width: 960px) {
  .notification-drawer-desktop {
    margin-top: 64px !important;
  }
}
</style>

