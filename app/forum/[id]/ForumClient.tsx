'use client'

import { useState } from 'react'
import { BeltBadge } from '@/app/components/BeltBadge'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

type Author = { name: string | null; belt: string; role: string }

type Post = {
  id: string
  content: string
  type: string
  videoUrl: string | null
  pinned: boolean
  createdAt: string
  author: Author
  replies: {
    id: string
    content: string
    createdAt: string
    author: Author
  }[]
}

type Props = {
  forumId: string
  posts: Post[]
  userId: string
  userRoles: string[]
  isSubscribed: boolean
  forumType: string
}

const POST_TYPE_STYLES: Record<string, string> = {
  text: 'bg-mist text-steel',
  video_link: 'bg-brand-red text-paper',
  question: 'bg-blue-100 text-blue-700',
  announcement: 'bg-amber-100 text-amber-700',
}

const POST_TYPE_LABELS: Record<string, string> = {
  text: 'Post', video_link: 'Video', question: 'Question', announcement: 'Announcement',
}

function formatDate(iso: string, short = false) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', ...(short ? {} : { year: 'numeric' }),
  })
}

export function ForumClient({ forumId, posts: initial, userId, userRoles, isSubscribed: initSub, forumType }: Props) {
  const [posts, setPosts] = useState(initial)
  const [subscribed, setSubscribed] = useState(initSub)
  const [showForm, setShowForm] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [form, setForm] = useState({ content: '', type: 'text', videoUrl: '' })
  const [replyContent, setReplyContent] = useState('')
  const [saving, setSaving] = useState(false)

  const canAnnounce = userRoles.includes('instructor') || userRoles.includes('admin')
  const canPin = userRoles.includes('instructor') || userRoles.includes('admin')

  async function createPost(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim()) return
    setSaving(true)
    const res = await fetch(`/api/forums/${forumId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const post = await res.json()
      const newPost: Post = { ...post, createdAt: post.createdAt, replies: [] }
      setPosts(prev => {
        return post.pinned
          ? [newPost, ...prev]
          : [...prev.filter(p => p.pinned), newPost, ...prev.filter(p => !p.pinned)]
      })
      setForm({ content: '', type: 'text', videoUrl: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function createReply(postId: string) {
    if (!replyContent.trim()) return
    setSaving(true)
    const res = await fetch(`/api/forums/${forumId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent, type: 'text', parentId: postId }),
    })
    if (res.ok) {
      const reply = await res.json()
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: [...p.replies, reply] } : p))
      setReplyContent('')
      setReplyTo(null)
    }
    setSaving(false)
  }

  async function togglePin(post: Post) {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !post.pinned }),
    })
    if (res.ok) {
      setPosts(prev => {
        const updated = prev.map(p => p.id === post.id ? { ...p, pinned: !p.pinned } : p)
        return [...updated.filter(p => p.pinned), ...updated.filter(p => !p.pinned)]
      })
    }
  }

  async function deletePost(id: string, isReply = false, parentId?: string) {
    await fetch(`/api/posts/${id}`, { method: 'DELETE' })
    if (isReply && parentId) {
      setPosts(prev => prev.map(p => p.id === parentId ? { ...p, replies: p.replies.filter(r => r.id !== id) } : p))
    } else {
      setPosts(prev => prev.filter(p => p.id !== id))
    }
  }

  async function toggleSubscribe() {
    const method = subscribed ? 'DELETE' : 'POST'
    const res = await fetch(`/api/forums/${forumId}/subscribe`, { method })
    if (res.ok) setSubscribed(!subscribed)
  }

  const sortedPosts = [...posts.filter(p => p.pinned), ...posts.filter(p => !p.pinned)]

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Post'}
        </button>
        {forumType === 'class_forum' && (
          <button
            onClick={toggleSubscribe}
            className="px-4 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors"
          >
            {subscribed ? 'Subscribed ✓' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* New post form */}
      {showForm && (
        <form onSubmit={createPost} className="border border-smoke bg-paper p-5 mb-6 flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['text', 'question', 'video_link', ...(canAnnounce ? ['announcement'] : [])] as string[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${form.type === t ? 'bg-brand-red text-paper' : 'bg-mist text-steel hover:text-ink'}`}
              >
                {POST_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
            placeholder={form.type === 'video_link' ? 'Describe the video…' : form.type === 'question' ? 'Ask your question…' : 'Write something…'}
            autoFocus
          />
          {form.type === 'video_link' && (
            <input
              type="url"
              value={form.videoUrl}
              onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="Video URL (YouTube, Vimeo…)"
            />
          )}
          <div>
            <button
              type="submit"
              disabled={saving || !form.content.trim()}
              className="px-5 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
            >
              {saving ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {sortedPosts.length === 0 && (
        <p className="text-ash text-sm italic">No posts yet. Be the first!</p>
      )}

      <div className="flex flex-col gap-5">
        {sortedPosts.map(post => (
          <div key={post.id} className={`border bg-paper ${post.pinned ? 'border-brand-red/40' : 'border-smoke'}`}>

            {/* Post header */}
            <div className="px-5 pt-4 pb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <BeltBadge belt={post.author.belt as Belt} stripes={0} />
                <span className="text-sm font-medium text-ink">{post.author.name ?? 'Unknown'}</span>
                <span className="text-xs text-ash">{formatDate(post.createdAt)}</span>
                <span className={`px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${POST_TYPE_STYLES[post.type] ?? POST_TYPE_STYLES.text}`}>
                  {POST_TYPE_LABELS[post.type] ?? post.type}
                </span>
                {post.pinned && <span className="text-xs text-brand-red font-bold uppercase tracking-wide">📌 Pinned</span>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {canPin && (
                  <button onClick={() => togglePin(post)} className="text-xs text-ash hover:text-brand-red transition-colors">
                    {post.pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                {(post.author.role === userId || userRoles.includes('admin')) && (
                  <button onClick={() => deletePost(post.id)} className="text-xs text-ash hover:text-brand-red transition-colors">✕</button>
                )}
              </div>
            </div>

            {/* Post body */}
            <div className="px-5 py-3">
              <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              {post.videoUrl && (
                <a href={post.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-brand-red hover:text-brand-red-dark underline">
                  Watch video →
                </a>
              )}
            </div>

            {/* Replies + reply form */}
            <div className="px-5 pb-4">
              {/* Nested replies */}
              {post.replies.length > 0 && (
                <div className="mt-1 mb-3 flex flex-col gap-2 border-l-2 border-steel/25 pl-4 ml-1">
                  {post.replies.map(reply => (
                    <div key={reply.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <BeltBadge belt={reply.author.belt as Belt} stripes={0} />
                          <span className="text-xs font-medium text-ink">{reply.author.name ?? 'Unknown'}</span>
                          <span className="text-xs text-ash">{formatDate(reply.createdAt, true)}</span>
                        </div>
                        <p className="text-sm text-ink leading-relaxed">{reply.content}</p>
                      </div>
                      {(reply.author.role === userId || userRoles.includes('admin')) && (
                        <button
                          onClick={() => deletePost(reply.id, true, post.id)}
                          className="text-xs text-ash hover:text-brand-red transition-colors flex-shrink-0 mt-0.5"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyTo === post.id ? (
                <div className="flex gap-2 mt-2 border-l-2 border-brand-red/40 pl-4 ml-1">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    className="flex-1 px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
                    placeholder="Write a reply…"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && createReply(post.id)}
                  />
                  <button
                    onClick={() => createReply(post.id)}
                    disabled={saving || !replyContent.trim()}
                    className="px-3 py-2 bg-brand-red text-paper text-xs font-bold hover:bg-brand-red-dark transition-colors disabled:opacity-60"
                  >
                    Reply
                  </button>
                  <button onClick={() => setReplyTo(null)} className="px-3 py-2 text-xs text-ash hover:text-ink transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setReplyTo(post.id)}
                  className="text-xs text-ash hover:text-ink transition-colors mt-1"
                >
                  ↩ Reply
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
