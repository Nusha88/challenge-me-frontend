<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import NotificationListItem from './notifications/NotificationListItem.vue'
import { useNotificationsDrawer } from '../composables/useNotificationsDrawer'
import { resolveNotificationNavigation } from '../utils/notificationNavigation'
import { APP_EVENTS, dispatchAppEvent } from '../utils/appEvents'
import { friendService, challengeService } from '../services/api'

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

const {
  notifications,
  loading,
  errorMessage,
  markingAllAsRead,
  loadNotifications,
  markNotificationReadOptimistic,
  markAllAsRead,
  deleteNotification,
  removeNotificationLocally
} = useNotificationsDrawer(props, emit)

const actingNotificationId = ref(null)
const actingKind = ref('')

function handleDrawerUpdate(value) {
  if (!value) {
    emit('update:modelValue', false)
    emit('close')
  }
}

function closeDrawer(event) {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  emit('update:modelValue', false)
  emit('close')
}

function senderId(notification) {
  return notification?.fromUserId?._id || notification?.fromUserId || null
}

async function resolveFriendRequestId(notification) {
  if (notification.friendshipId) return notification.friendshipId
  const userId = senderId(notification)
  if (!userId) return null
  const { data } = await friendService.getStatus(userId)
  return data?.friendshipId || null
}

async function handleFriendDecision(notification, kind) {
  actingNotificationId.value = notification._id
  actingKind.value = kind
  try {
    const friendshipId = await resolveFriendRequestId(notification)
    if (!friendshipId) throw new Error('missing_friendship')
    if (kind === 'accept') {
      await friendService.accept(friendshipId)
    } else {
      await friendService.reject(friendshipId)
    }
    removeNotificationLocally(notification)
    dispatchAppEvent(APP_EVENTS.FRIENDSHIP_CHANGED, {
      userId: senderId(notification),
      friendshipId,
      status: kind === 'accept' ? 'accepted' : 'none'
    })
  } catch (error) {
    console.error('Error updating friend request:', error)
    errorMessage.value = t('notifications.friendActionError')
  } finally {
    actingNotificationId.value = null
    actingKind.value = ''
  }
}

async function handleMissionInviteDecision(notification, kind) {
  const challengeId = notification.challengeId?._id || notification.challengeId
  if (!challengeId) return
  actingNotificationId.value = notification._id
  actingKind.value = kind
  try {
    if (kind === 'accept') {
      await challengeService.acceptMissionInvite(challengeId)
    } else {
      await challengeService.rejectMissionInvite(challengeId)
    }
    removeNotificationLocally(notification)
    dispatchAppEvent(APP_EVENTS.CHALLENGE_UPDATED, {
      challengeId: String(challengeId)
    })
  } catch (error) {
    console.error('Error updating mission invite:', error)
    errorMessage.value = t('notifications.missionInviteActionError')
  } finally {
    actingNotificationId.value = null
    actingKind.value = ''
  }
}

function handleInviteDecision(notification, kind) {
  if (notification.type === 'mission_invite') {
    return handleMissionInviteDecision(notification, kind)
  }
  return handleFriendDecision(notification, kind)
}

function handleNotificationClick(notification) {
  closeDrawer()
  if (notification.type === 'daily_recap') {
    void deleteNotification(notification)
  } else {
    markNotificationReadOptimistic(notification)
  }

  const nav = resolveNotificationNavigation(notification)
  if (nav.kind === 'route') {
    router.push(nav.path)
    return
  }
  if (nav.kind === 'challenge') {
    dispatchAppEvent(APP_EVENTS.OPEN_CHALLENGE, {
      challengeId: nav.challengeId,
      commentId: nav.commentId,
      replyId: nav.replyId
    })
  }
}
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
      <header class="notification-header">
        <div class="header-left">
          <v-icon color="#4FD1C5" size="22">mdi-bell-outline</v-icon>
          <div class="header-copy">
            <h2 class="header-title">{{ t('notifications.title') }}</h2>
            <p v-if="unreadCount > 0" class="header-meta">
              {{ unreadCount }} {{ t('notifications.unreadMeta') }}
            </p>
          </div>
        </div>

        <div class="header-actions">
          <v-btn
            v-if="unreadCount > 0"
            icon="mdi-check-all"
            size="small"
            variant="text"
            class="action-btn"
            :loading="markingAllAsRead"
            :aria-label="t('notifications.markAllAsRead')"
            :title="t('notifications.markAllAsRead')"
            @click="markAllAsRead"
          />
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            class="action-btn"
            :aria-label="t('notifications.close')"
            @click.stop="closeDrawer"
          />
        </div>
      </header>

      <div class="notification-content">
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="#4FD1C5"
          height="2"
          class="content-progress"
        />

        <div v-else-if="errorMessage" class="state-block">
          <div class="state-icon state-icon--error">
            <v-icon size="40">mdi-alert-circle-outline</v-icon>
          </div>
          <p class="state-text">{{ errorMessage }}</p>
          <v-btn
            variant="text"
            color="#4FD1C5"
            class="text-none mt-3"
            @click="loadNotifications"
          >
            {{ t('notifications.retry') }}
          </v-btn>
        </div>

        <div v-else-if="notifications.length === 0" class="state-block">
          <div class="state-icon">
            <v-icon size="40">mdi-inbox-outline</v-icon>
          </div>
          <p class="state-text">{{ t('notifications.noNotifications') }}</p>
          <p class="state-lead">{{ t('notifications.emptyLead') }}</p>
        </div>

        <div v-else class="notification-list">
          <NotificationListItem
            v-for="notification in notifications"
            :key="notification._id"
            :notification="notification"
            :acting="actingNotificationId === notification._id ? actingKind : ''"
            @click="handleNotificationClick"
            @delete="deleteNotification"
            @accept="handleInviteDecision($event, 'accept')"
            @reject="handleInviteDecision($event, 'reject')"
          />
        </div>
      </div>
    </v-navigation-drawer>
  </Teleport>
</template>

<style scoped>
.notification-drawer {
  background: #0f131c !important;
  border-left: 1px solid var(--home-border, rgba(255, 255, 255, 0.08)) !important;
  color: var(--home-text, #f1f5f9) !important;
}

.notification-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.header-copy {
  min-width: 0;
}

.header-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--home-text, #f1f5f9);
  line-height: 1.25;
}

.header-meta {
  margin: 4px 0 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--home-teal, #4fd1c5);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.action-btn {
  color: var(--home-text-dim, #94a3b8) !important;
}

.action-btn:hover {
  color: var(--home-teal, #4fd1c5) !important;
}

.notification-content {
  display: flex;
  flex-direction: column;
  height: calc(100% - 72px);
  overflow: hidden;
}

.content-progress {
  flex-shrink: 0;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  text-align: center;
  flex: 1;
}

.state-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--home-border, rgba(255, 255, 255, 0.08));
  color: var(--home-text-faint, #64748b);
}

.state-icon--error {
  color: rgba(248, 113, 113, 0.85);
  border-color: rgba(248, 113, 113, 0.25);
}

.state-text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--home-text, #f1f5f9);
}

.state-lead {
  margin: 8px 0 0;
  max-width: 28ch;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--home-text-dim, #94a3b8);
}

@media (min-width: 960px) {
  .notification-drawer-desktop {
    margin-top: 64px !important;
    height: calc(100% - 64px) !important;
  }
}
</style>
