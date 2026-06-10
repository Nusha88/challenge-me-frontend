import { ref, watch, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { notificationService } from '../services/api'
import { syncAppBadge } from '../utils/appBadge'

// Shared layout-level state (single drawer instance across the app)
const unreadNotificationCount = ref(0)
const notificationsDrawerOpen = ref(false)

export function useUnreadNotifications({ onUnreadLoadSuccess } = {}) {
  const userStore = useUserStore()
  const isLoggedIn = computed(() => userStore.isLoggedIn)

  async function loadUnreadNotificationCount() {
    const userId = userStore.userId
    if (!userId || !isLoggedIn.value) return

    try {
      const { data } = await notificationService.getUnreadCount(userId)
      unreadNotificationCount.value = data.count || 0
      onUnreadLoadSuccess?.()
    } catch (error) {
      console.error('Error loading unread notification count:', error)
    }
  }

  function openNotifications() {
    if (notificationsDrawerOpen.value) {
      notificationsDrawerOpen.value = false
      return
    }

    notificationsDrawerOpen.value = true
    loadUnreadNotificationCount()
  }

  function closeNotifications() {
    notificationsDrawerOpen.value = false
  }

  function handleUnreadCountChanged(newCount) {
    unreadNotificationCount.value = newCount
  }

  function reset() {
    unreadNotificationCount.value = 0
    notificationsDrawerOpen.value = false
  }

  watch(unreadNotificationCount, (count) => {
    syncAppBadge(count)
  })

  return {
    unreadNotificationCount,
    notificationsDrawerOpen,
    loadUnreadNotificationCount,
    openNotifications,
    closeNotifications,
    handleUnreadCountChanged,
    reset,
    getCurrentUserId: () => {
      const id = userStore.userId
      return id != null ? String(id) : null
    }
  }
}
