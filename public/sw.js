const CACHE = 'ascendit-v1'

const STATIC_PATTERNS = [
  /^\/_next\/static\//,
  /^\/icons\//,
  /^\/manifest\.json$/,
]

// ── Install: skip waiting so the new SW activates immediately ─────────────────
self.addEventListener('install', () => self.skipWaiting())

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// ── Fetch: cache-first for static assets, network-first for everything else ───
self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  const isStatic = STATIC_PATTERNS.some(p => p.test(url.pathname))

  if (isStatic) {
    // Cache-first: serve from cache, update in background
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(request)
        if (cached) return cached
        const fresh = await fetch(request)
        if (fresh.ok) cache.put(request, fresh.clone())
        return fresh
      })
    )
  } else {
    // Never cache auth or API routes
    if (url.pathname.startsWith('/api/')) return

    // Network-first: try network, fall back to cache for pages
    e.respondWith(
      fetch(request)
        .then(res => {
          // Cache navigations (HTML pages) for offline fallback — clone before async open
          if (request.mode === 'navigate' && res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(request).then(cached => cached ?? caches.match('/offline')))
    )
  }
})

// ── Push: show notification ───────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return

  let payload
  try { payload = e.data.json() } catch { payload = { title: 'AscendIt', body: e.data.text() } }

  const { title = 'AscendIt', body = '', link = '/' } = payload

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { link },
      vibrate: [200, 100, 200],
      tag: link, // deduplicate: same-link notifications replace each other
    })
  )
})

// ── Notification click: open / focus the relevant page ───────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const link = e.notification.data?.link ?? '/'

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(link)
      } else {
        self.clients.openWindow(link)
      }
    })
  )
})
