import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { notificationService } from '../services/api'

/**
 * List load / mark / delete for the notifications drawer.
 */
export function useNotificationsDrawer(props, emit) {
  const { t } = useI18n()

  const notifications = ref([])
  const loading = ref(false)
  const errorMessage = ref('')
  const markingAllAsRead = ref(false)

  const normalizedUserId = computed(() => {
    const id = props.currentUserId
    return id != null && id !== '' ? String(id) : null
  })

  function syncUnreadCountFromList() {
    const unreadFromList = notifications.value.filter((n) => !n.read).length
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
      const { data } = await notificationService.getNotifications(normalizedUserId.value, {
        limit: 50
      })
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

  function clearError() {
    errorMessage.value = ''
  }

  /**
   * Optimistic mark-as-read with rollback on API failure.
   */
  function markNotificationReadOptimistic(notification) {
    if (!notification || notification.read) return

    const previousCount = props.unreadCount
    notification.read = true
    emit('unread-count-changed', Math.max(0, previousCount - 1))

    notificationService.markAsRead(notification._id).catch((error) => {
      console.error('Error marking notification as read:', error)
      notification.read = false
      emit('unread-count-changed', previousCount)
    })
  }

  async function markAllAsRead() {
    if (!normalizedUserId.value || props.unreadCount === 0) return

    markingAllAsRead.value = true
    errorMessage.value = ''
    try {
      await notificationService.markAllAsRead(normalizedUserId.value)
      notifications.value.forEach((n) => {
        n.read = true
      })
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

  return {
    notifications,
    loading,
    errorMessage,
    markingAllAsRead,
    normalizedUserId,
    loadNotifications,
    clearError,
    markNotificationReadOptimistic,
    markAllAsRead,
    deleteNotification
  }
}
