'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import type { MediaItem } from './GalleryClient'

type Props = {
  items: MediaItem[]
  index: number
  onChangeIndex: (i: number) => void
  onClose: () => void
}

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^?&]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`
  return url
}

export function Slideshow({ items, index, onChangeIndex, onClose }: Props) {
  const [autoPlay,    setAutoPlay]    = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const containerRef  = useRef<HTMLDivElement>(null)
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const prev = useCallback(() => onChangeIndex((index - 1 + items.length) % items.length), [index, items.length, onChangeIndex])
  const next = useCallback(() => onChangeIndex((index + 1) % items.length), [index, items.length, onChangeIndex])

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  { prev(); resetControls() }
      if (e.key === 'ArrowRight') { next(); resetControls() }
      if (e.key === 'Escape')     onClose()
      if (e.key === ' ')          { e.preventDefault(); setAutoPlay(a => !a) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next, onClose])

  // Auto-play
  useEffect(() => {
    if (autoPlay) {
      timerRef.current = setInterval(() => next(), 4000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoPlay, next])

  // Fullscreen API
  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Auto-hide controls
  function resetControls() {
    setShowControls(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
  }

  useEffect(() => {
    resetControls()
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const item = items[index]
  if (!item) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col select-none"
      onMouseMove={resetControls}
    >
      {/* Top bar */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="text-white/70 text-sm tabular-nums">{index + 1} / {items.length}</span>
        <div className="flex items-center gap-3">
          {item.uploader && (
            <span className="text-white/50 text-xs hidden sm:block">by {item.uploader.name}</span>
          )}
          {/* Auto-play */}
          <button
            onClick={() => setAutoPlay(a => !a)}
            title={autoPlay ? 'Pause auto-play' : 'Auto-play (4s)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${autoPlay ? 'bg-brand-red text-white' : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'}`}
          >
            {autoPlay ? '⏸ Pause' : '▶ Auto'}
          </button>
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors text-sm"
          >
            {isFullscreen ? '⊠' : '⛶'}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors text-xl leading-none"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
      </div>

      {/* Media area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Prev */}
        <button
          onClick={() => { prev(); resetControls() }}
          className={`absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-2xl transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Previous"
        >
          ‹
        </button>

        {item.type === 'photo' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.id}
            src={item.displayUrl}
            alt={item.caption ?? ''}
            className="max-h-full max-w-full object-contain"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          />
        ) : (
          <div className="w-full max-w-4xl px-16 aspect-video">
            <iframe
              key={item.id}
              src={toEmbedUrl(item.url)}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}

        {/* Next */}
        <button
          onClick={() => { next(); resetControls() }}
          className={`absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white text-2xl transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Next"
        >
          ›
        </button>
      </div>

      {/* Bottom bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 px-6 py-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        {item.caption && <p className="text-white text-sm mb-1">{item.caption}</p>}
        <div className="flex flex-wrap gap-2 items-center">
          {item.hashtags?.map(h => (
            <span key={h.hashtag.id} className="text-xs text-red-400 font-medium">#{h.hashtag.tag}</span>
          ))}
          {item.tags?.map(t => (
            <span key={t.id} className="text-xs text-white/50">@{t.user.name}</span>
          ))}
        </div>
        {item.forSale && item.price && (
          <p className="text-xs text-white/40 mt-1 italic">${(item.price / 100).toFixed(2)} — unwatermarked available</p>
        )}

        {/* Dot indicators (up to 20) */}
        {items.length <= 20 && (
          <div className="flex gap-1 mt-3 justify-center">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => onChangeIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
