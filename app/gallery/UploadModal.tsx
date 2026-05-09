'use client'

import { useState, useRef } from 'react'
import type { MediaItem } from './GalleryClient'

type Props = {
  onClose: () => void
  onUploaded: (item: MediaItem) => void
}

export function UploadModal({ onClose, onUploaded }: Props) {
  const [tab, setTab]         = useState<'photo' | 'video'>('photo')
  const [caption, setCaption]   = useState('')
  const [hashtags, setHashtags] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState('')
  const fileRef               = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUploading(true)

    try {
      let res: Response

      if (tab === 'photo') {
        if (!file) { setError('Please select a photo.'); setUploading(false); return }
        const fd = new FormData()
        fd.append('file', file)
        if (caption.trim())  fd.append('caption',  caption.trim())
        if (hashtags.trim()) fd.append('hashtags', hashtags.trim())
        res = await fetch('/api/media', { method: 'POST', body: fd })
      } else {
        if (!videoUrl.trim()) { setError('Please enter a video URL.'); setUploading(false); return }
        res = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: videoUrl.trim(), caption: caption.trim() || null, hashtagsRaw: hashtags.trim() }),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Upload failed.')
        setUploading(false)
        return
      }

      const item = await res.json()
      onUploaded({ ...item, displayUrl: item.url, createdAt: item.createdAt })
    } catch {
      setError('Upload failed. Check your connection.')
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-paper border border-smoke shadow-xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-smoke">
          <h2 className="font-display text-lg text-ink">Upload Media</h2>
          <button onClick={onClose} className="text-ash hover:text-ink text-xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          {/* Tabs */}
          <div className="flex border border-smoke">
            {(['photo', 'video'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-wide transition-colors ${
                  tab === t ? 'bg-brand-red text-paper' : 'text-steel hover:bg-mist'
                }`}
              >
                {t === 'photo' ? 'Photo' : 'Video Link'}
              </button>
            ))}
          </div>

          {tab === 'photo' ? (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-smoke hover:border-brand-red transition-colors cursor-pointer flex flex-col items-center justify-center py-8 gap-2"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Preview" className="max-h-48 max-w-full object-contain" />
                ) : (
                  <>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ash">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                    <span className="text-xs text-ash">Click to choose a photo</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-widest text-steel">YouTube URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=…"
                className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest text-steel">Caption (optional)</label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption…"
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-widest text-steel">Hashtags (optional)</label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#competition #seminar #bjj"
              className="w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {error && <p className="text-sm text-brand-red">{error}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-3 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </div>
    </div>
  )
}
