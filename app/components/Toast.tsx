'use client'

import { useEffect } from 'react'

type ToastProps = {
  message: string
  type?: 'info' | 'success' | 'error'
  onClose: () => void
  durationMs?: number
}

export function Toast({ message, type = 'info', onClose, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs)
    return () => clearTimeout(t)
  }, [onClose, durationMs])

  const bg =
    type === 'success' ? 'bg-green-700' :
    type === 'error'   ? 'bg-brand-red' :
    'bg-ink'

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 ${bg} text-paper text-sm shadow-lg max-w-sm w-[calc(100vw-2rem)]`}>
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="shrink-0 text-paper/70 hover:text-paper text-lg leading-none">×</button>
    </div>
  )
}
