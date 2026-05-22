'use client'

import { useState } from 'react'

export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(window.location.origin + url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors shrink-0"
    >
      {copied ? 'Copied!' : 'Share Profile'}
    </button>
  )
}
