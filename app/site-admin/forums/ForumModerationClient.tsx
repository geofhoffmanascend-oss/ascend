'use client'

import { useState, useEffect } from 'react'
import { BELT_COLORS } from '@/lib/belt'

interface Forum { id: string; title: string; beltLevel: string | null }

interface Post {
  id: string
  content: string
  createdAt: string
  authorId: string
  author: { name: string | null; belt: string; beltVerified: boolean }
  forum: { title: string; beltLevel: string | null }
}

export function ForumModerationClient({ forums }: { forums: Forum[] }) {
  const [selectedId, setSelectedId] = useState(forums[0]?.id ?? '')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    fetch(`/api/site-admin/forums/belt-posts?forumId=${selectedId}&limit=50`)
      .then(r => r.json())
      .then(data => setPosts(data.posts ?? []))
      .finally(() => setLoading(false))
  }, [selectedId])

  async function deletePost(id: string) {
    await fetch(`/api/site-admin/forums/posts/${id}`, { method: 'DELETE' })
    setPosts(prev => prev.filter(p => p.id !== id))
    setConfirming(null)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Forum tabs */}
      <div className="md:w-44 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto">
        {forums.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedId(f.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm text-left whitespace-nowrap transition-colors ${
              selectedId === f.id ? 'bg-brand-red text-paper font-bold' : 'border border-smoke text-steel hover:border-steel hover:text-ink'
            }`}
          >
            {f.beltLevel && (
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${BELT_COLORS[f.beltLevel]}`} />
            )}
            {f.title}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-mist animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-ash text-sm italic">No posts in this forum.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map(post => (
              <div key={post.id} className="border border-smoke bg-paper p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-sm font-medium text-ink">{post.author.name ?? 'Unknown'}</span>
                    <span className="text-xs text-ash ml-2 capitalize">{post.author.belt}</span>
                    {post.author.beltVerified
                      ? <span className="text-xs text-green-600 ml-1">✓</span>
                      : <span className="text-xs text-ash ml-1 italic">(unverified)</span>
                    }
                    <span className="text-xs text-ash ml-2">
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {confirming === post.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ash">Delete?</span>
                        <button onClick={() => deletePost(post.id)} className="text-xs text-brand-red font-bold hover:underline">Yes</button>
                        <button onClick={() => setConfirming(null)} className="text-xs text-ash hover:text-ink">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirming(post.id)} className="text-xs text-ash hover:text-brand-red transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
