'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function JoinChat({ chatId }: { chatId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function join() {
    setBusy(true)
    const res = await fetch(`/api/group-chats/${chatId}/join`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (data.status === 'joined' || data.status === 'member') { router.refresh(); return }
    if (data.status === 'requested') { setMsg('Request sent — a member will approve you.'); return }
    setMsg(data.error ?? 'Could not join.')
  }

  if (msg) return <p className="text-sm text-slate">{msg}</p>

  return (
    <button onClick={join} disabled={busy} className="bg-brand-red text-paper font-bold text-sm px-5 py-2.5 hover:bg-red-700 transition-colors disabled:opacity-50">
      {busy ? '…' : 'Join chat'}
    </button>
  )
}
