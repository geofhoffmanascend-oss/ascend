'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type UserResult = {
  id: string
  name: string | null
  avatarUrl: string | null
  role: string
  belt: string
}

export function NewMessageButton() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function select(userId: string) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(`/messages/${userId}`)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
      >
        New Message
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-24 px-4">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-paper border border-smoke shadow-lg flex flex-col">
            <div className="p-4 border-b border-smoke flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name…"
                className="flex-1 px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              />
              <button onClick={() => setOpen(false)} className="text-ash hover:text-ink text-lg leading-none">×</button>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {loading && <p className="p-4 text-xs text-ash">Searching…</p>}
              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="p-4 text-xs text-ash">No users found.</p>
              )}
              {results.map(u => (
                <button
                  key={u.id}
                  onClick={() => select(u.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-mist transition-colors text-left border-b border-smoke last:border-0"
                >
                  <div className="w-9 h-9 rounded-full bg-mist border border-smoke flex items-center justify-center shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.name ?? ''} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-steel text-xs">
                        {(u.name ?? '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-ink font-medium">{u.name ?? 'Unknown'}</p>
                    <p className="text-xs text-ash capitalize">{u.role} · {u.belt} belt</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
