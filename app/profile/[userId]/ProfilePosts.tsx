'use client'

import { useState } from 'react'
import Link from 'next/link'

export type ProfilePost = {
  id: string
  content: string
  createdAt: string
  forumId: string
  forumTitle: string
  restricted: boolean
}

export function ProfilePosts({ publicPosts, extraPosts }: { publicPosts: ProfilePost[]; extraPosts: ProfilePost[] }) {
  const [showAll, setShowAll] = useState(false)

  const posts = showAll
    ? [...publicPosts, ...extraPosts].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    : publicPosts

  return (
    <div className="border border-smoke bg-paper p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-steel">Posts</p>
        {extraPosts.length > 0 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="text-xs font-medium text-ash hover:text-ink transition-colors"
          >
            {showAll ? 'Public only' : 'Show all activity I can see'}
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-ash text-sm italic">No public posts yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {posts.map(p => (
            <Link
              key={p.id}
              href={`/forum/${p.forumId}`}
              className="border border-smoke bg-paper p-3 hover:border-steel transition-colors flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-xs text-ash mb-0.5">
                  {p.forumTitle}{p.restricted && <span className="ml-1 text-ash">· members</span>}
                </p>
                <p className="text-sm text-ink line-clamp-2">{p.content}</p>
              </div>
              <p className="text-xs text-ash flex-shrink-0">
                {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
