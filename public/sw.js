// Service Worker for Push Notifications and minimal static caching
// Bump version to invalidate old caches on deploy
const CACHE_NAME = 'challengeme-v2';
const urlsToCache = [
  // Do not cache "/" to avoid serving stale index.html after deploys
  '/icons/icon2.png',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
// IMPORTANT: Do NOT cache API requests - they should always go to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't cache API requests - always fetch from network
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Always fetch documents (HTML) from network to avoid stale pages
  if (event.request.destination === 'document') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For other static assets, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/icons/icon2.png',
    badge: '/icons/icon2.png',
    data: {},
    tag: 'notification'
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || notificationData.data,
        tag: data.tag || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/icon2.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  });

  event.waitUntil(promiseChain);
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const challengeId = notificationData.challengeId;

  if (event.action === 'close') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to challenge if challengeId is provided
          if (challengeId) {
            return client.navigate(`/challenges/${challengeId}`).then(() => client.focus());
          }
          return client.focus();
        }
      }
      // If app is not open, open it
      if (clients.openWindow) {
        const url = challengeId ? `/challenges/${challengeId}` : '/';
        return clients.openWindow(url);
      }
    })
  );
});
