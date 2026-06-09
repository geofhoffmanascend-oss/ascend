'use client'

import { useState } from 'react'

type Forum = { id: string; title: string; type: string; gymName: string | null; postCount: number }
type Post = { id: string; content: string; createdAt: string; isReply: boolean; imageUrl: string | null; authorName: string }

const TYPE_LABEL: Record<string, string> = {
  general: 'General', announcement: 'Announcements', gym_forum: 'Gym Community',
  class_forum: 'Class', group_forum: 'Group', instructor_only: 'Instructor', private_lesson: 'Private Lessons',
}

export function ForumModerationList({ forums }: { forums: Forum[] }) {
  const [forumList, setForumList] = useState<Forum[]>(forums)
  const [selected, setSelected] = useState<Forum | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingForum, setDeletingForum] = useState(false)

  async function open(f: Forum) {
    setSelected(f); setLoading(true); setPosts([])
    const res = await fetch(`/api/site-admin/forums/posts?forumId=${f.id}`)
    const data = await res.json().catch(() => ({ posts: [] }))
    setPosts(data.posts ?? [])
    setLoading(false)
  }

  async function del(id: string) {
    if (!confirm('Delete this post permanently?')) return
    const res = await fetch(`/api/site-admin/forums/posts/${id}`, { method: 'DELETE' })
    if (res.ok) setPosts(p => p.filter(x => x.id !== id))
  }

  async function delForum(f: Forum) {
    if (!confirm(`Delete the entire "${f.title}" forum and all its posts? This cannot be undone.`)) return
    setDeletingForum(true)
    const res = await fetch(`/api/forums/${f.id}`, { method: 'DELETE' })
    setDeletingForum(false)
    if (res.ok) {
      setForumList(list => list.filter(x => x.id !== f.id))
      setSelected(null); setPosts([])
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Could not delete this forum.')
    }
  }

  if (forumList.length === 0) {
    return <p className="text-ash text-sm italic">No community forums to moderate. (Participating gyms moderate their own.)</p>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      {/* Forum list */}
      <div className="flex flex-col gap-2">
        {forumList.map(f => (
          <button
            key={f.id}
            onClick={() => open(f)}
            className={`text-left border p-3 transition-colors ${selected?.id === f.id ? 'border-brand-red bg-brand-red/5' : 'border-smoke bg-paper hover:border-steel'}`}
          >
            <p className="text-sm font-medium text-ink">{f.title}</p>
            <p className="text-xs text-ash mt-0.5">
              {TYPE_LABEL[f.type] ?? f.type} · {f.gymName ?? 'Platform'} · {f.postCount} {f.postCount === 1 ? 'post' : 'posts'}
            </p>
          </button>
        ))}
      </div>

      {/* Posts of selected forum */}
      <div>
        {!selected ? (
          <p className="text-ash text-sm italic">Select a forum to review its posts.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-steel">{selected.title}{!loading && ` — ${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`}</p>
              <button onClick={() => delForum(selected)} disabled={deletingForum} className="text-xs font-semibold text-brand-red hover:underline flex-shrink-0 disabled:opacity-60">
                {deletingForum ? 'Deleting…' : 'Delete forum'}
              </button>
            </div>
            {loading ? (
              <p className="text-ash text-sm">Loading…</p>
            ) : posts.length === 0 ? (
              <p className="text-ash text-sm italic">No posts in {selected.title}.</p>
            ) : posts.map(p => (
              <div key={p.id} className="border border-smoke bg-paper p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-ash mb-0.5">
                    {p.authorName}{p.isReply && ' · reply'} · {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-ink whitespace-pre-wrap break-words">{p.content}</p>
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="mt-1 max-h-32 rounded border border-smoke" />}
                </div>
                <button onClick={() => del(p.id)} className="text-xs text-brand-red hover:underline flex-shrink-0">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
