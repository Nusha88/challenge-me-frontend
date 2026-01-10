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
      console.log('Service Worker registered successfully')
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  } else {
    console.log('Service Workers are not supported')
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
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied')
    return false
  }

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications() {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push messaging is not supported')
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
      console.log('Notification permission not granted')
      return null
    }

    // Get VAPID public key
    const publicKey = await getVapidPublicKey()
    if (!publicKey) {
      console.log('Failed to get VAPID public key')
      return null
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey)

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    })

    // Send subscription to server
    await pushService.subscribe(subscription.toJSON())

    console.log('Push subscription successful')
    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
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
      console.log('Push subscription removed')
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
 */
export async function initializePushNotifications() {
  const isLoggedIn = !!localStorage.getItem('token')
  if (!isLoggedIn) {
    return
  }

  // Register service worker
  await registerServiceWorker()

  // Check if already subscribed
  const isSubscribed = await isSubscribedToPushNotifications()
  if (!isSubscribed) {
    // Try to subscribe
    await subscribeToPushNotifications()
  }
}
