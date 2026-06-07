'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteForumButton({ forumId, title }: { forumId: string; title: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete the "${title}" forum permanently? This removes the forum and all of its posts. This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/forums/${forumId}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Failed to delete forum.')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-semibold text-brand-red hover:underline disabled:opacity-60"
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  )
}
