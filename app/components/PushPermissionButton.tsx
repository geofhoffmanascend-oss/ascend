'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export function PushPermissionButton() {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'granted' | 'denied' | 'default'>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
    } else {
      setStatus(Notification.permission as 'granted' | 'denied' | 'default')
    }
  }, [])

  async function subscribe() {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      setStatus(permission as 'granted' | 'denied' | 'default')
      if (permission !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const keyRes = await fetch('/api/push/vapid-key')
      const { publicKey } = await keyRes.json()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
    } catch (err) {
      console.error('Push subscribe failed:', err)
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('default')
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading' || status === 'unsupported') return null

  if (status === 'granted') {
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink">Push notifications</p>
          <p className="text-xs text-ash mt-0.5">Enabled on this device</p>
        </div>
        <button
          onClick={unsubscribe}
          disabled={busy}
          className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-50"
        >
          {busy ? 'Disabling…' : 'Disable'}
        </button>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div>
        <p className="text-sm font-medium text-ink">Push notifications</p>
        <p className="text-xs text-ash mt-0.5">
          Blocked by browser — enable in your browser's site settings.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-ink">Push notifications</p>
        <p className="text-xs text-ash mt-0.5">Get notified even when the app isn't open</p>
      </div>
      <button
        onClick={subscribe}
        disabled={busy}
        className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-50"
      >
        {busy ? 'Enabling…' : 'Enable'}
      </button>
    </div>
  )
}
