import { pushService } from '../services/api'

let vapidPublicKey = null
let registration = null

/**
 * Register service worker and request notification permission
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  } else {
    return null
  }
}

/**
 * Get VAPID public key from server
 */
export async function getVapidPublicKey() {
  if (vapidPublicKey) {
    return vapidPublicKey
  }

  try {
    const response = await pushService.getVapidPublicKey()
    vapidPublicKey = response.data.publicKey
    return vapidPublicKey
  } catch (error) {
    console.error('Error getting VAPID public key:', error)
    return null
  }
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission // 'granted', 'denied', or 'default'
}

/**
 * Request notification permission and subscribe (for manual trigger)
 */
export async function requestAndSubscribeToPushNotifications() {
  try {
    const permission = await requestNotificationPermission()
    if (!permission) {
      return { success: false, reason: 'permission-denied' }
    }

    const subscription = await subscribeToPushNotifications()
    if (subscription) {
      return { success: true, subscription }
    }
    
    return { success: false, reason: 'subscription-failed' }
  } catch (error) {
    console.error('Error requesting and subscribing to push notifications:', error)
    return { success: false, reason: 'error', error: error.message }
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null
    }

    // Register service worker if not already registered
    if (!registration) {
      registration = await registerServiceWorker()
      if (!registration) {
        return null
      }
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready

    // Request notification permission
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      return null
    }

    // Get VAPID public key from server (always get fresh key)
    const publicKey = await getVapidPublicKey()
    if (!publicKey) {
      return null
    }

    // Unsubscribe from any existing subscription first (to avoid key mismatches)
    try {
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        await existingSubscription.unsubscribe()
        // Also remove from server
        try {
          await pushService.unsubscribe()
        } catch (unsubError) {
          // Ignore errors - subscription might not exist on server
        }
      }
    } catch (unsubError) {
      // Ignore unsubscribe errors
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey)

    // Subscribe to push notifications with fresh key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })

    // Send subscription to server
    await pushService.subscribe(subscription.toJSON())

    return subscription
  } catch (error) {
    console.error('[Push] Error subscribing to push notifications:', error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  try {
    if (!registration) {
      registration = await navigator.serviceWorker.ready
    }

    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      await pushService.unsubscribe()
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribedToPushNotifications() {
  try {
    if (!registration) {
      registration = await navigator.serviceWorker.ready
    }

    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch (error) {
    console.error('Error checking push subscription:', error)
    return false
  }
}

/**
 * Convert VAPID key from base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Initialize push notifications (call this when user logs in)
 * This only registers the service worker and creates subscription if needed
 * Syncing to server happens separately after login completes
 */
export async function initializePushNotifications() {
  const isLoggedIn = !!localStorage.getItem('token')
  if (!isLoggedIn) {
    return
  }

  try {
    // Register service worker (non-blocking)
    registerServiceWorker().catch(() => {
      // Silent fail - service worker registration shouldn't block login
    })

    // Don't try to sync or subscribe here - do it after login completes
    // This prevents any authentication errors from blocking the login process
  } catch (error) {
    // Silent fail - don't block login
  }
}

/**
 * Sync existing browser subscription to server (call after login completes)
 */
export async function syncPushSubscriptionToServer() {
  try {
    // Verify token exists and user is logged in
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    if (!('serviceWorker' in navigator)) {
      return false
    }

    // Wait for service worker to be ready
    const reg = await navigator.serviceWorker.ready
    const subscription = await reg.pushManager.getSubscription()
    
    if (subscription) {
      // Double-check token is still valid before syncing
      const currentToken = localStorage.getItem('token')
      if (!currentToken) {
        return false
      }
      
      const subscriptionData = subscription.toJSON()
      await pushService.subscribe(subscriptionData)
      return true
    }
    
    return false
  } catch (error) {
    // Silent fail - subscription exists in browser
    // Don't log errors for auth failures - they're expected during login
    return false
  }
}
