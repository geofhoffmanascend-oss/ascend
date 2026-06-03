'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BeltBadge } from '@/app/components/BeltBadge'

type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

type Author = { name: string | null; belt: string; beltVerified?: boolean; beltVerifiedBy?: string | null }

type Reply = {
  id: string
  authorId: string
  content: string
  createdAt: string
  author: Author
  likeCount: number
  likedByMe: boolean
  imageUrl?: string | null
}

type Post = {
  id: string
  authorId: string
  content: string
  type: string
  videoUrl: string | null
  imageUrl?: string | null
  pinned: boolean
  createdAt: string
  author: Author
  likeCount: number
  likedByMe: boolean
  replies: Reply[]
}

type Props = {
  forumId: string
  posts: Post[]
  userId: string
  userRoles: string[]
  isSubscribed: boolean
  forumType: string
  canPost?: boolean
  isBeltForum?: boolean
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

export function ForumClient({ forumId, posts: initial, userId, userRoles, isSubscribed: initSub, forumType, canPost = true, isBeltForum = false }: Props) {
  const [posts, setPosts] = useState(initial)
  const [subscribed, setSubscribed] = useState(initSub)
  const [showForm, setShowForm] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [form, setForm] = useState({ content: '', type: 'text', videoUrl: '' })
  const [replyContent, setReplyContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [postImage, setPostImage] = useState<File | null>(null)
  const [replyImage, setReplyImage] = useState<File | null>(null)

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/forums/${forumId}/upload`, { method: 'POST', body: fd })
    if (!res.ok) return null
    const data = await res.json()
    return data.url ?? null
  }

  const canAnnounce = userRoles.includes('instructor') || userRoles.includes('admin')
  const canPin = userRoles.includes('instructor') || userRoles.includes('admin')

  async function createPost(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim()) return
    setSaving(true)
    let imageUrl: string | null = null
    if (postImage) {
      imageUrl = await uploadImage(postImage)
      if (!imageUrl) { setSaving(false); return }
    }
    const res = await fetch(`/api/forums/${forumId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, imageUrl }),
    })
    if (res.ok) {
      const post = await res.json()
      const newPost: Post = { ...post, createdAt: post.createdAt, replies: [], likeCount: 0, likedByMe: false }
      setPosts(prev => {
        return post.pinned
          ? [newPost, ...prev]
          : [...prev.filter(p => p.pinned), newPost, ...prev.filter(p => !p.pinned)]
      })
      setForm({ content: '', type: 'text', videoUrl: '' })
      setPostImage(null)
      setShowForm(false)
    }
    setSaving(false)
  }

  async function createReply(postId: string) {
    if (!replyContent.trim()) return
    setSaving(true)
    let imageUrl: string | null = null
    if (replyImage) {
      imageUrl = await uploadImage(replyImage)
      if (!imageUrl) { setSaving(false); return }
    }
    const res = await fetch(`/api/forums/${forumId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent, type: 'text', parentId: postId, imageUrl }),
    })
    if (res.ok) {
      const reply = await res.json()
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, replies: [...p.replies, { ...reply, likeCount: 0, likedByMe: false }] } : p))
      setReplyContent('')
      setReplyImage(null)
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

  async function toggleLike(id: string, liked: boolean, isReply = false, parentId?: string) {
    // optimistic
    const apply = (delta: number, nowLiked: boolean) => setPosts(prev => prev.map(p => {
      if (isReply && parentId) {
        if (p.id !== parentId) return p
        return { ...p, replies: p.replies.map(r => r.id === id ? { ...r, likeCount: r.likeCount + delta, likedByMe: nowLiked } : r) }
      }
      return p.id === id ? { ...p, likeCount: p.likeCount + delta, likedByMe: nowLiked } : p
    }))
    apply(liked ? -1 : 1, !liked)
    const res = await fetch(`/api/posts/${id}/like`, { method: liked ? 'DELETE' : 'POST' })
    if (!res.ok) { apply(liked ? 1 : -1, liked); return } // revert
    const data = await res.json()
    // reconcile exact count
    setPosts(prev => prev.map(p => {
      if (isReply && parentId) {
        if (p.id !== parentId) return p
        return { ...p, replies: p.replies.map(r => r.id === id ? { ...r, likeCount: data.count, likedByMe: data.liked } : r) }
      }
      return p.id === id ? { ...p, likeCount: data.count, likedByMe: data.liked } : p
    }))
  }

  function startEdit(id: string, content: string) {
    setEditingId(id)
    setEditContent(content)
  }

  async function saveEdit(id: string, isReply = false, parentId?: string) {
    if (!editContent.trim()) return
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPosts(prev => prev.map(p => {
        if (isReply && parentId) {
          if (p.id !== parentId) return p
          return { ...p, replies: p.replies.map(r => r.id === id ? { ...r, content: updated.content } : r) }
        }
        return p.id === id ? { ...p, content: updated.content } : p
      }))
      setEditingId(null)
      setEditContent('')
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
        {canPost && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors"
          >
            {showForm ? 'Cancel' : '+ New Post'}
          </button>
        )}
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
          <label className="text-xs text-steel font-medium flex items-center gap-2 cursor-pointer">
            <span className="border border-smoke px-3 py-1.5 hover:border-steel transition-colors">📷 {postImage ? 'Change photo' : 'Add photo'}</span>
            {postImage && <span className="text-ash">{postImage.name}</span>}
            <input type="file" accept="image/*" className="hidden" onChange={e => setPostImage(e.target.files?.[0] ?? null)} />
          </label>
          <div>
            <button
              type="submit"
              disabled={saving || !form.content.trim()}
              className="px-5 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-brand-red-dark transition-colors disabled:opacity-60"
            >
              {saving ? 'Posting…' : "'ScendIt"}
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
                <Link href={`/profile/${post.authorId}`} className="text-sm font-medium text-ink hover:text-brand-red transition-colors">{post.author.name ?? 'Unknown'}</Link>
                {isBeltForum && (
                  post.author.beltVerified
                    ? <span className="text-xs text-green-600 font-medium">✓ Verified</span>
                    : <span className="text-xs text-ash italic">(Unverified)</span>
                )}
                <span suppressHydrationWarning className="text-xs text-ash">{formatDate(post.createdAt)}</span>
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
                {post.authorId === userId && editingId !== post.id && (
                  <button onClick={() => startEdit(post.id, post.content)} className="text-xs text-ash hover:text-brand-red transition-colors">Edit</button>
                )}
                {(post.authorId === userId || userRoles.includes('admin')) && (
                  <button onClick={() => deletePost(post.id)} className="text-xs text-ash hover:text-brand-red transition-colors">✕</button>
                )}
              </div>
            </div>

            {/* Post body */}
            <div className="px-5 py-3">
              {editingId === post.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(post.id)} disabled={!editContent.trim()} className="px-3 py-1.5 bg-brand-red text-paper text-xs font-bold hover:bg-brand-red-dark transition-colors disabled:opacity-60">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-ash hover:text-ink transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-ink text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && (
                    <a href={`/forum/${forumId}/gallery`}>
                      <img src={post.imageUrl} alt="" className="mt-2 max-h-96 w-auto rounded border border-smoke object-contain" />
                    </a>
                  )}
                  {post.videoUrl && (
                    <a href={post.videoUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-block mt-2 text-xs text-brand-red hover:text-brand-red-dark underline">
                      Watch video →
                    </a>
                  )}
                </>
              )}
              <button
                onClick={() => toggleLike(post.id, post.likedByMe)}
                className={`inline-flex items-center gap-1 mt-3 text-xs font-medium transition-colors ${post.likedByMe ? 'text-brand-red' : 'text-ash hover:text-ink'}`}
              >
                👍 <span>{post.likeCount > 0 ? post.likeCount : 'Like'}</span>
              </button>
            </div>

            {/* Replies + reply form */}
            <div className="px-5 pb-4">
              {/* Nested replies */}
              {post.replies.length > 0 && (
                <div className="mt-1 mb-3 flex flex-col gap-2 border-l-2 border-steel/25 pl-4 ml-1">
                  {post.replies.map(reply => (
                    <div key={reply.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <BeltBadge belt={reply.author.belt as Belt} stripes={0} />
                          <Link href={`/profile/${reply.authorId}`} className="text-xs font-medium text-ink hover:text-brand-red transition-colors">{reply.author.name ?? 'Unknown'}</Link>
                          <span suppressHydrationWarning className="text-xs text-ash">{formatDate(reply.createdAt, true)}</span>
                        </div>
                        {editingId === reply.id ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(reply.id, true, post.id)} disabled={!editContent.trim()} className="px-3 py-1 bg-brand-red text-paper text-xs font-bold hover:bg-brand-red-dark transition-colors disabled:opacity-60">Save</button>
                              <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-ash hover:text-ink transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-ink leading-relaxed">{reply.content}</p>
                            {reply.imageUrl && (
                              <a href={`/forum/${forumId}/gallery`}>
                                <img src={reply.imageUrl} alt="" className="mt-1 max-h-72 w-auto rounded border border-smoke object-contain" />
                              </a>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => toggleLike(reply.id, reply.likedByMe, true, post.id)}
                          className={`inline-flex items-center gap-1 mt-1 text-xs font-medium transition-colors ${reply.likedByMe ? 'text-brand-red' : 'text-ash hover:text-ink'}`}
                        >
                          👍 <span>{reply.likeCount > 0 ? reply.likeCount : 'Like'}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        {reply.authorId === userId && editingId !== reply.id && (
                          <button onClick={() => startEdit(reply.id, reply.content)} className="text-xs text-ash hover:text-brand-red transition-colors">Edit</button>
                        )}
                        {(reply.authorId === userId || userRoles.includes('admin')) && (
                          <button onClick={() => deletePost(reply.id, true, post.id)} className="text-xs text-ash hover:text-brand-red transition-colors">✕</button>
                        )}
                      </div>
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
                  <label className={`px-3 py-2 border text-xs cursor-pointer transition-colors flex items-center ${replyImage ? 'border-brand-red text-brand-red' : 'border-smoke text-ash hover:text-ink hover:border-steel'}`} title={replyImage ? replyImage.name : 'Add photo'}>
                    📷
                    <input type="file" accept="image/*" className="hidden" onChange={e => setReplyImage(e.target.files?.[0] ?? null)} />
                  </label>
                  <button
                    onClick={() => createReply(post.id)}
                    disabled={saving || !replyContent.trim()}
                    className="px-3 py-2 bg-brand-red text-paper text-xs font-bold hover:bg-brand-red-dark transition-colors disabled:opacity-60"
                  >
                    {"'ScendIt"}
                  </button>
                  <button onClick={() => { setReplyTo(null); setReplyImage(null) }} className="px-3 py-2 text-xs text-ash hover:text-ink transition-colors">
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
