'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BELT_COLORS, BELT_LABELS } from '@/lib/belt'

export type ForumVM = {
  id: string
  title: string
  totalPosts: number
  unread: number
  latestAt: string | null
  latestBy: string | null
  inDefault: boolean
  // belt-forum extras
  beltKey?: string
  isUserBelt?: boolean
  canPost?: boolean
}

type Props = {
  general: ForumVM[]
  belt: ForumVM[]
  group: ForumVM[]
  cls: ForumVM[]
  noClasses: boolean
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-red text-paper text-[11px] font-bold leading-none">
      {count > 9 ? '9+' : count}
    </span>
  )
}

function metaLine(f: ForumVM) {
  if (f.latestAt) {
    return `Last post by ${f.latestBy ?? 'Unknown'} · ${new Date(f.latestAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }
  return 'No posts yet'
}

function ForumRow({ f }: { f: ForumVM }) {
  const hasUnread = f.unread > 0
  return (
    <Link
      href={`/forum/${f.id}`}
      className={`bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between border ${
        hasUnread ? 'border-l-2 border-l-brand-red border-y-smoke border-r-smoke' : 'border-smoke'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-sm text-ink ${hasUnread ? 'font-bold' : 'font-medium'}`}>{f.title}</p>
        <p className="text-xs text-ash mt-0.5">{metaLine(f)}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <UnreadBadge count={f.unread} />
        <p className="text-xs text-ash">{f.totalPosts} posts</p>
      </div>
    </Link>
  )
}

function BeltRow({ f }: { f: ForumVM }) {
  const hasUnread = f.unread > 0
  const beltKey = f.beltKey as string
  return (
    <Link
      href={`/forum/${f.id}`}
      className={`bg-paper p-4 hover:border-steel transition-colors flex items-center justify-between border ${
        hasUnread ? 'border-l-2 border-l-brand-red border-y-smoke border-r-smoke' : f.isUserBelt ? 'border-steel' : 'border-smoke'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${BELT_COLORS[beltKey]}`} />
        <div>
          <p className={`text-sm text-ink ${hasUnread || f.isUserBelt ? 'font-bold' : 'font-medium'}`}>{BELT_LABELS[beltKey]}</p>
          <p className="text-xs text-ash mt-0.5">{f.totalPosts} posts</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <UnreadBadge count={f.unread} />
        <span className="text-xs text-ash">Read</span>
        {f.canPost
          ? <span className="text-xs text-ash">· Post</span>
          : <span className="text-xs text-ash" title={`Requires ${BELT_LABELS[beltKey]} or higher`}>· 🔒 Post</span>}
      </div>
    </Link>
  )
}

export function ForumListClient({ general, belt, group, cls, noClasses }: Props) {
  const [showAll, setShowAll] = useState(false)

  // unread first, then most-recent activity
  const sortVM = (a: ForumVM, b: ForumVM) => {
    if ((b.unread > 0 ? 1 : 0) !== (a.unread > 0 ? 1 : 0)) return (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0)
    const at = a.latestAt ? Date.parse(a.latestAt) : 0
    const bt = b.latestAt ? Date.parse(b.latestAt) : 0
    return bt - at
  }
  const visible = (list: ForumVM[]) => (showAll ? list : list.filter(f => f.inDefault)).slice().sort(sortVM)

  const hiddenCount = [...general, ...belt, ...group].filter(f => !f.inDefault).length

  const gen = visible(general)
  const blt = visible(belt)
  const grp = visible(group)
  const cla = visible(cls)

  return (
    <>
      {gen.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Public</p>
          <div className="flex flex-col gap-2">{gen.map(f => <ForumRow key={f.id} f={f} />)}</div>
        </section>
      )}

      {blt.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Belt Forums</p>
          <div className="flex flex-col gap-2">{blt.map(f => <BeltRow key={f.id} f={f} />)}</div>
        </section>
      )}

      {grp.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">Class Groups</p>
          <div className="flex flex-col gap-2">{grp.map(f => <ForumRow key={f.id} f={f} />)}</div>
        </section>
      )}

      {cla.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-steel mb-3">My Classes</p>
          <div className="flex flex-col gap-2">{cla.map(f => <ForumRow key={f.id} f={f} />)}</div>
        </section>
      )}

      {noClasses && (
        <p className="text-ash text-sm italic">
          Register for a class to join its forum. <Link href="/schedule" className="text-brand-red hover:underline">View schedule →</Link>
        </p>
      )}

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="self-start text-xs font-bold uppercase tracking-widest text-steel border border-smoke hover:border-steel transition-colors px-4 py-2"
        >
          {showAll ? 'Show fewer forums' : `Show all available forums (${hiddenCount})`}
        </button>
      )}
    </>
  )
}
