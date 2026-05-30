'use client'

import { useEffect, useState } from 'react'

interface Forum {
  id: string
  title: string
  _count: { posts: number; subscriptions: number }
}

interface Props {
  gymId: string
  gymName: string
  onDone?: () => void
}

export function GymForumPrompt({ gymId, gymName, onDone = () => {} }: Props) {
  const [loading, setLoading] = useState(true)
  const [forum, setForum] = useState<Forum | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [working, setWorking] = useState(false)
  const [done, setDone] = useState(false)
  const [doneMsg, setDoneMsg] = useState('')

  useEffect(() => {
    fetch(`/api/gyms/${gymId}/forum`)
      .then(r => r.json())
      .then(data => {
        setForum(data.forum)
        setMemberCount(data.gymMemberCount ?? 0)
      })
      .finally(() => setLoading(false))
  }, [gymId])

  async function joinForum() {
    if (!forum) return
    setWorking(true)
    await fetch(`/api/forums/${forum.id}/subscribe`, { method: 'POST' })
    setDoneMsg('Joined! You can find it in Forums.')
    setDone(true)
    setWorking(false)
  }

  async function createForum() {
    setWorking(true)
    const res = await fetch(`/api/gyms/${gymId}/forum`, { method: 'POST' })
    const data = await res.json()
    setDoneMsg('Forum created! Your training partners will be notified.')
    setForum(data.forum)
    setDone(true)
    setWorking(false)
  }

  const primaryBtn = 'bg-brand-red text-paper font-bold text-sm tracking-wide px-5 py-2.5 hover:bg-red-700 transition-colors disabled:opacity-50'
  const secondaryBtn = 'text-sm text-ash hover:text-ink transition-colors'

  if (loading) {
    return (
      <div className="border border-smoke bg-paper p-6">
        <div className="h-4 w-32 bg-mist animate-pulse mb-3" />
        <div className="h-3 w-48 bg-mist animate-pulse" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="border border-smoke bg-paper p-6">
        <p className="text-sm text-ink mb-4">{doneMsg}</p>
        <button onClick={onDone} className={primaryBtn}>Continue →</button>
      </div>
    )
  }

  return (
    <div className="border border-smoke bg-paper p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Gym Community</p>
      {forum ? (
        <>
          <p className="text-sm text-ink mb-1">
            A community forum exists for <strong>{gymName}</strong>.
          </p>
          <p className="text-sm text-ash mb-5">
            Join to connect with your training partners.
            ({forum._count.subscriptions} {forum._count.subscriptions === 1 ? 'member' : 'members'})
          </p>
          <div className="flex items-center gap-4">
            <button onClick={joinForum} disabled={working} className={primaryBtn}>
              {working ? 'Joining…' : 'Join Forum'}
            </button>
            <button onClick={onDone} className={secondaryBtn}>Skip</button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-ink mb-1">
            {memberCount > 0
              ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'} from ${gymName} are on AscendIt.`
              : `Be the first from ${gymName} on AscendIt!`}
          </p>
          <p className="text-sm text-ash mb-5">
            Be the first to create a community forum for your gym.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={createForum} disabled={working} className={primaryBtn}>
              {working ? 'Creating…' : 'Create Forum'}
            </button>
            <button onClick={onDone} className={secondaryBtn}>Skip</button>
          </div>
        </>
      )}
    </div>
  )
}
