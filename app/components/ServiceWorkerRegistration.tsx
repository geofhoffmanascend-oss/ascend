'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(err =>
        console.warn('SW registration failed:', err)
      )
    } else {
      // In dev the SW caches /_next/static/ chunks cache-first, which serves stale
      // client bundles against freshly server-rendered HTML → hydration mismatches.
      // Unregister any existing SW and purge its caches so dev always runs fresh.
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => reg.unregister())
      })
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
      }
    }
  }, [])

  return null
}
