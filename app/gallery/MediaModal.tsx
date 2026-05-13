'use client'

import { useState } from 'react'
import type { MediaItem } from './GalleryClient'

type Props = {
  item: MediaItem
  currentUserId: string
  currentUserRoles: string[]
  onClose: () => void
  onUpdated: (item: MediaItem) => void
  onDeleted: (id: string) => void
  onFilterByHashtag: (tag: string) => void
  onFilterByUser: (userId: string, name: string) => void
  onSlideshow: () => void
}

export function MediaModal({ item: initial, currentUserId, currentUserRoles, onClose, onUpdated, onDeleted, onFilterByHashtag, onFilterByUser, onSlideshow }: Props) {
  const [item, setItem]         = useState(initial)
  const [editing, setEditing]   = useState(false)
  const [caption, setCaption]   = useState(item.caption ?? '')
  const [hashtagsRaw, setHashtagsRaw] = useState(item.hashtags.map(h => `#${h.hashtag.tag}`).join(' '))
  const [forSale, setForSale]   = useState(item.forSale)
  const [price, setPrice]       = useState(item.price ? String(item.price / 100) : '')
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [tagResults, setTagResults] = useState<{ id: string; name: string | null }[]>([])
  const [tagError, setTagError] = useState('')

  const canEdit = item.uploader.id === currentUserId || currentUserRoles.includes('admin') || currentUserRoles.includes('instructor')

  async function saveEdit() {
    setSaving(true)
    const res = await fetch(`/api/media/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption:     caption.trim() || null,
        hashtagsRaw: hashtagsRaw.trim(),
        forSale,
        price: forSale && price ? Math.round(parseFloat(price) * 100) : null,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setItem(updated)
      onUpdated(updated)
      setEditing(false)
    }
    setSaving(false)
  }

  async function deleteItem() {
    if (!confirm('Delete this item?')) return
    setDeleting(true)
    const res = await fetch(`/api/media/${item.id}`, { method: 'DELETE' })
    if (res.ok) onDeleted(item.id)
    setDeleting(false)
  }

  async function searchTags(q: string) {
    setTagSearch(q)
    setTagError('')
    if (q.length < 2) { setTagResults([]); return }
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setTagResults(Array.isArray(data) ? data : [])
  }

  async function addTag(userId: string) {
    setTagError('')
    const res = await fetch(`/api/media/${item.id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) {
      const tag = await res.json()
      const updated = { ...item, tags: [...item.tags, tag] }
      setItem(updated); onUpdated(updated)
      setTagSearch(''); setTagResults([])
    } else {
      const data = await res.json()
      setTagError(data.error ?? 'Failed to tag.')
    }
  }

  async function removeTag(userId: string) {
    const res = await fetch(`/api/media/${item.id}/tags/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      const updated = { ...item, tags: item.tags.filter(t => t.userId !== userId) }
      setItem(updated); onUpdated(updated)
    }
  }

  const alreadyTaggedIds = new Set(item.tags.map(t => t.userId))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/70" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-paper border border-smoke shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-smoke shrink-0">
          <p className="text-xs text-ash">
            by {item.uploader.name ?? 'Unknown'} · {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onSlideshow} className="text-xs text-ash hover:text-ink" title="View in slideshow">▶ Slideshow</button>
            {canEdit && !editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-ash hover:text-ink underline">Edit</button>
            )}
            {canEdit && (
              <button onClick={deleteItem} disabled={deleting} className="text-xs text-brand-red hover:text-red-700">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button onClick={onClose} className="text-ash hover:text-ink text-xl leading-none ml-2">×</button>
          </div>
        </div>

        {/* Media */}
        <div className="bg-ink flex items-center justify-center max-h-[50vh] overflow-hidden">
          {item.type === 'photo' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.displayUrl} alt={item.caption ?? ''} className="max-h-[50vh] max-w-full object-contain" />
          ) : (
            <div className="w-full aspect-video">
              <iframe src={toEmbedUrl(item.url)} className="w-full h-full" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* For sale banner */}
          {item.forSale && !editing && (
            <div className="flex items-center justify-between border border-smoke bg-mist px-4 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-steel">For Sale</p>
                {item.price && <p className="text-sm text-ink font-medium">${(item.price / 100).toFixed(2)} — unwatermarked</p>}
              </div>
              <button className="px-4 py-2 border border-smoke text-steel text-sm font-medium opacity-50 cursor-not-allowed">
                Purchase (coming soon)
              </button>
            </div>
          )}

          {/* Edit form */}
          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-steel">Caption</label>
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
                  className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-widest text-steel">Hashtags</label>
                <input type="text" value={hashtagsRaw} onChange={e => setHashtagsRaw(e.target.value)}
                  placeholder="#competition #seminar"
                  className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
              </div>
              {item.type === 'photo' && currentUserRoles.includes('admin') && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={forSale} onChange={() => setForSale(f => !f)} />
                    <div className={`w-10 h-5 rounded-full transition-colors ${forSale ? 'bg-brand-red' : 'bg-smoke'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full shadow transition-transform ${forSale ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-ink">For sale (watermarked in gallery)</span>
                </label>
              )}
              {forSale && currentUserRoles.includes('admin') && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-steel">Price (USD)</label>
                  <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="e.g. 9.99"
                    className="w-32 px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={saveEdit} disabled={saving}
                  className="px-5 py-2 bg-brand-red text-paper font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-5 py-2 border border-smoke text-steel text-sm hover:border-steel transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {item.caption && <p className="text-sm text-ink">{item.caption}</p>}
              {/* Hashtags */}
              {item.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.hashtags.map(h => (
                    <button
                      key={h.hashtag.id}
                      onClick={() => { onFilterByHashtag(h.hashtag.tag); onClose() }}
                      className="text-sm text-brand-red font-medium hover:underline"
                    >
                      #{h.hashtag.tag}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* People tags */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-steel">People</p>
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => { onFilterByUser(tag.userId, tag.user.name ?? tag.userId); onClose() }}
                  className="flex items-center gap-1.5 px-3 py-1 border border-smoke bg-paper hover:border-steel transition-colors text-xs text-ink"
                >
                  {tag.user.name ?? 'Unknown'}
                  {(canEdit || tag.userId === currentUserId) && (
                    <span onClick={e => { e.stopPropagation(); removeTag(tag.userId) }}
                      className="text-ash hover:text-brand-red text-sm leading-none">×</span>
                  )}
                </button>
              ))}
              {item.tags.length === 0 && <p className="text-xs text-ash italic">No one tagged.</p>}
            </div>

            {canEdit && (
              <div className="relative max-w-xs">
                <input type="text" value={tagSearch} onChange={e => searchTags(e.target.value)}
                  placeholder="Tag someone…"
                  className="w-full px-3 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red" />
                {tagResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 bg-paper border border-smoke shadow-md">
                    {tagResults.filter(u => !alreadyTaggedIds.has(u.id)).map(u => (
                      <button key={u.id} onClick={() => addTag(u.id)}
                        className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-mist transition-colors">
                        {u.name ?? 'Unknown'}
                      </button>
                    ))}
                  </div>
                )}
                {tagError && <p className="text-xs text-brand-red mt-1">{tagError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^?&]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}
