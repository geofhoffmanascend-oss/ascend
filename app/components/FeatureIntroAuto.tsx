'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FEATURE_INTROS } from '@/lib/featureIntros'
import { FeatureIntroModal } from './FeatureIntroModal'

// Exact pathnames that map to a feature explainer. Sub-routes (e.g. /chats/[id]) don't trigger.
const PATH_TO_FEATURE: Record<string, string> = {
  '/my-training': 'my-training',
  '/feed': 'feed',
  '/forum': 'forums',
  '/chats': 'chats',
  '/lessons': 'lessons',
  '/journal': 'journal',
  '/events': 'events',
  '/challenges': 'challenges',
  '/gallery': 'gallery',
  '/store': 'store',
  '/profile': 'profile',
  '/settings': 'settings',
}

// Mounted once (in providers). Shows a feature explainer each time the user opens a feature
// page, until they pick "don't show this again" (persisted per-user in the DB).
export function FeatureIntroAuto() {
  const pathname = usePathname()
  const { status } = useSession()
  const [dismissed, setDismissed] = useState<Set<string> | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const closedForPath = useRef<string | null>(null)

  // Load the user's dismissed set once they're authenticated.
  useEffect(() => {
    if (status !== 'authenticated') { setDismissed(null); return }
    let cancelled = false
    fetch('/api/feature-intros')
      .then(r => r.json())
      .then(d => { if (!cancelled) setDismissed(new Set<string>(d.dismissed ?? [])) })
      .catch(() => { if (!cancelled) setDismissed(new Set()) })
    return () => { cancelled = true }
  }, [status])

  // On each navigation, decide whether to show the explainer for this path.
  useEffect(() => {
    if (!dismissed) { setActiveKey(null); return }
    const key = PATH_TO_FEATURE[pathname]
    if (!key || !(key in FEATURE_INTROS) || dismissed.has(key)) { setActiveKey(null); return }
    // Re-show whenever the path is freshly entered (not just dismissed-for-now on this same path).
    if (closedForPath.current === pathname) return
    setActiveKey(key)
  }, [pathname, dismissed])

  if (!activeKey) return null
  const intro = FEATURE_INTROS[activeKey]

  return (
    <FeatureIntroModal
      featureKey={activeKey}
      title={intro.title}
      body={intro.body}
      onClose={(persisted) => {
        if (persisted) setDismissed(prev => new Set(prev).add(activeKey))
        closedForPath.current = pathname
        setActiveKey(null)
      }}
    />
  )
}
