import { ref, computed } from 'vue'
import { useUserStore } from '../stores/user'
import { initializePushNotifications, syncPushSubscriptionToServer } from '../utils/pushNotifications'

export function usePushNotifications() {
  const userStore = useUserStore()
  const pushInitialized = ref(false)
  const pushSubscriptionSynced = ref(false)
  const isLoggedIn = computed(() => userStore.isLoggedIn)

  async function initializeOnce() {
    if (pushInitialized.value || !isLoggedIn.value || !userStore.token) return

    pushInitialized.value = true

    try {
      await initializePushNotifications()
    } catch (error) {
      pushInitialized.value = false
      console.error('Error initializing push notifications:', error)
    }
  }

  async function trySyncSubscription() {
    if (!pushSubscriptionSynced.value && userStore.token && isLoggedIn.value) {
      pushSubscriptionSynced.value = true
      await syncPushSubscriptionToServer()
    }
  }

  function handleAuthChanged() {
    if (userStore.isLoggedIn) {
      setTimeout(() => {
        initializeOnce()
      }, 1000)
    } else {
      reset()
    }
  }

  function reset() {
    pushInitialized.value = false
    pushSubscriptionSynced.value = false
  }

  return {
    initializeOnce,
    trySyncSubscription,
    handleAuthChanged,
    reset
  }
}
