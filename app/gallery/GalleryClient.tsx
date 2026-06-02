'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { UploadModal } from './UploadModal'
import { MediaModal } from './MediaModal'
import { Slideshow } from './Slideshow'
import { getWatermarkedUrl } from '@/lib/cloudinaryUrl'

export type HashtagRef = { id: string; tag: string }
export type TagRef = { id: string; userId: string; user: { id: string; name: string | null; avatarUrl: string | null } }

export type MediaItem = {
  id: string
  url: string
  displayUrl: string
  thumbnailUrl: string | null
  publicId: string | null
  type: 'photo' | 'video_link'
  caption: string | null
  forSale: boolean
  price: number | null
  createdAt: string
  visibility: string
  uploader: { id: string; name: string | null }
  tags: TagRef[]
  hashtags: { hashtag: HashtagRef }[]
}

type Layout  = 'grid' | 'masonry' | 'timeline'
type Density = 2 | 3 | 4

type ActiveFilters = {
  caption:   string | null
  hashtag:   string | null
  person:    { id: string; name: string } | null
  myTags:    boolean
}

type Props = {
  initialItems: MediaItem[]
  nextCursor: string | null
  currentUserId: string
  currentUserRoles: string[]
  currentUserGymId: string | null
  canUpload: boolean
}

function gridStyle(density: Density) {
  return { gridTemplateColumns: `repeat(${density}, minmax(0, 1fr))` }
}

function masonryStyle(density: Density) {
  return { columnCount: density, columnGap: '0.5rem' }
}

function groupByMonth(items: MediaItem[]): { label: string; items: MediaItem[] }[] {
  const groups: Record<string, MediaItem[]> = {}
  for (const item of items) {
    const label = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    groups[label] = [...(groups[label] ?? []), item]
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }))
}

function serializeItem(item: MediaItem & { publicId?: string | null; forSale?: boolean }): MediaItem {
  return {
    ...item,
    displayUrl: item.type === 'photo' && item.forSale && item.publicId
      ? getWatermarkedUrl(item.publicId)
      : item.url,
  }
}

export function GalleryClient({ initialItems, nextCursor: initialCursor, currentUserId, currentUserRoles, currentUserGymId, canUpload }: Props) {
  const [items,       setItems]       = useState<MediaItem[]>(initialItems)
  const [cursor,      setCursor]      = useState(initialCursor)
  const [loading,     setLoading]     = useState(false)
  const [layout,      setLayout]      = useState<Layout>('grid')
  const [density,     setDensity]     = useState<Density>(4)
  const [filters,     setFilters]     = useState<ActiveFilters>({ caption: null, hashtag: null, person: null, myTags: false })
  const [showUpload,  setShowUpload]  = useState(false)
  const [selected,    setSelected]    = useState<MediaItem | null>(null)
  const [slideshow,   setSlideshow]   = useState<{ open: boolean; index: number }>({ open: false, index: 0 })

  async function fetchItems(newFilters: ActiveFilters, newCursor?: string) {
    setLoading(true)
    const sp = new URLSearchParams()
    if (newFilters.caption)          sp.set('q',            newFilters.caption)
    if (newFilters.hashtag)          sp.set('hashtag',      newFilters.hashtag)
    if (newFilters.person)           sp.set('taggedUserId', newFilters.person.id)
    if (newFilters.myTags)           sp.set('myTags',       '1')
    if (newCursor)                   sp.set('cursor',       newCursor)
    const res  = await fetch(`/api/media?${sp}`)
    const data = await res.json()
    setLoading(false)
    return data as { items: MediaItem[]; nextCursor: string | null }
  }

  async function applyFilters(newFilters: ActiveFilters) {
    setFilters(newFilters)
    const data = await fetchItems(newFilters)
    setItems(data.items.map(serializeItem))
    setCursor(data.nextCursor)
  }

  async function loadMore() {
    if (!cursor || loading) return
    const data = await fetchItems(filters, cursor)
    setItems(p => [...p, ...data.items.map(serializeItem)])
    setCursor(data.nextCursor)
  }

  const onUploaded = useCallback((item: MediaItem) => {
    setItems(p => [serializeItem(item), ...p])
    setShowUpload(false)
  }, [])

  const onUpdated = useCallback((item: MediaItem) => {
    setItems(p => p.map(i => i.id === item.id ? serializeItem(item) : i))
    setSelected(prev => prev?.id === item.id ? serializeItem(item) : prev)
  }, [])

  const onDeleted = useCallback((id: string) => {
    setItems(p => p.filter(i => i.id !== id))
    setSelected(null)
  }, [])

  function openSlideshow(item: MediaItem) {
    const idx = items.findIndex(i => i.id === item.id)
    setSlideshow({ open: true, index: idx >= 0 ? idx : 0 })
  }

  const hasFilters = !!(filters.caption || filters.hashtag || filters.person || filters.myTags)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">Gallery</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Media Archive</h1>
        </div>
        {canUpload && (
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors self-start"
          >
            + Upload
          </button>
        )}
      </div>

      {/* Unified search + toolbar */}
      <GalleryToolbar
        filters={filters}
        layout={layout}
        density={density}
        itemCount={items.length}
        currentUserId={currentUserId}
        onFiltersChange={applyFilters}
        onLayoutChange={setLayout}
        onDensityChange={setDensity}
        onSlideshow={() => setSlideshow({ open: true, index: 0 })}
      />

      {/* Empty state */}
      {items.length === 0 && !loading && (
        <div className="border border-smoke bg-paper p-16 text-center">
          <p className="text-ash text-sm">
            {hasFilters ? 'No photos match your search.' : canUpload ? 'No media yet. Be the first to upload!' : 'No media yet.'}
          </p>
        </div>
      )}

      {/* Grid */}
      {layout === 'grid' && items.length > 0 && (
        <div className="grid gap-2" style={gridStyle(density)}>
          {items.map((item, i) => (
            <GridItem key={item.id} item={item} onOpen={() => setSelected(item)} onSlideshow={() => openSlideshow(item)} index={i} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      {/* Masonry */}
      {layout === 'masonry' && items.length > 0 && (
        <div style={masonryStyle(density)}>
          {items.map((item, i) => (
            <div key={item.id} style={{ breakInside: 'avoid', marginBottom: '0.5rem' }}>
              <GridItem item={item} onOpen={() => setSelected(item)} onSlideshow={() => openSlideshow(item)} masonry index={i} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {layout === 'timeline' && items.length > 0 && (
        <div className="flex flex-col gap-8">
          {groupByMonth(items).map(({ label, items: group }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-block bg-brand-red px-3 py-1">
                  <span className="font-display text-xs font-bold tracking-widest uppercase text-paper">{label}</span>
                </div>
                <span className="text-xs text-ash">{group.length} photo{group.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid gap-2" style={gridStyle(density)}>
                {group.map((item, i) => (
                  <GridItem key={item.id} item={item} onOpen={() => setSelected(item)} onSlideshow={() => openSlideshow(item)} index={i} currentUserId={currentUserId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {cursor && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {showUpload && canUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={onUploaded} userGymId={currentUserGymId} />}

      {selected && (
        <MediaModal
          item={selected}
          currentUserId={currentUserId}
          currentUserRoles={currentUserRoles}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
          onFilterByHashtag={tag => applyFilters({ ...filters, hashtag: tag })}
          onFilterByUser={(id, name) => applyFilters({ ...filters, person: { id, name } })}
          onSlideshow={() => openSlideshow(selected)}
        />
      )}

      {slideshow.open && (
        <Slideshow
          items={items}
          index={slideshow.index}
          onChangeIndex={i => setSlideshow(s => ({ ...s, index: i }))}
          onClose={() => setSlideshow(s => ({ ...s, open: false }))}
        />
      )}
    </div>
  )
}

// ── Grid item ─────────────────────────────────────────────────────────────────

const VISIBILITY_ICONS: Record<string, string> = {
  gym_only: '🏠',
  private: '🔒',
  custom: '👥',
}

function GridItem({ item, onOpen, onSlideshow, masonry, currentUserId }: {
  item: MediaItem
  onOpen: () => void
  onSlideshow: () => void
  masonry?: boolean
  index: number
  currentUserId: string
}) {
  const isOwner = item.uploader.id === currentUserId
  const privacyIcon = item.visibility !== 'public' ? VISIBILITY_ICONS[item.visibility] : null
  return (
    <div
      className="relative bg-mist border border-smoke hover:border-steel transition-colors overflow-hidden group cursor-pointer"
      style={masonry ? {} : { aspectRatio: '1 / 1' }}
      onClick={onOpen}
    >
      {/* Media — fills container via absolute positioning in grid, natural height in masonry */}
      {item.type === 'photo' ? (
        masonry ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.displayUrl} alt={item.caption ?? ''} className="w-full block" loading="lazy" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.displayUrl} alt={item.caption ?? ''} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        )
      ) : (
        <div className={`${masonry ? 'aspect-video' : 'absolute inset-0'} w-full bg-ink flex items-center justify-center`}>
          {item.thumbnailUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={item.thumbnailUrl} alt={item.caption ?? ''} className="w-full h-full object-cover" loading="lazy" />
            : <span className="text-paper/40 text-xs">Video</span>
          }
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-ink/60 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-ink/20" />

      {/* Slideshow button */}
      <button
        onClick={e => { e.stopPropagation(); onSlideshow() }}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-ink/60 text-paper text-xs px-2 py-1 pointer-events-auto z-10"
        title="Start slideshow"
      >
        ▶
      </button>

      {/* Badges */}
      {isOwner && privacyIcon && (
        <span className="absolute top-2 right-2 bg-ink/70 text-paper text-[11px] px-1.5 py-0.5 z-10" title={item.visibility}>
          {privacyIcon}
        </span>
      )}
      {!isOwner && item.forSale && (
        <span className="absolute top-2 right-2 bg-brand-red text-paper text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide z-10">
          For Sale
        </span>
      )}
      {isOwner && item.forSale && !privacyIcon && (
        <span className="absolute top-2 right-2 bg-brand-red text-paper text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide z-10">
          For Sale
        </span>
      )}
      {item.tags.length > 0 && (
        <span className="absolute bottom-2 left-2 bg-ink/60 text-paper text-[10px] px-1.5 py-0.5 z-10">
          {item.tags.length} tagged
        </span>
      )}
      {item.hashtags.length > 0 && (
        <span className="absolute bottom-2 right-2 bg-ink/60 text-brand-red text-[10px] px-1.5 py-0.5 font-medium z-10">
          #{item.hashtags[0].hashtag.tag}{item.hashtags.length > 1 ? ` +${item.hashtags.length - 1}` : ''}
        </span>
      )}
    </div>
  )
}

// ── Toolbar ──────────────────────────────────────────────────────────────────

type ToolbarProps = {
  filters: ActiveFilters
  layout: Layout
  density: Density
  itemCount: number
  currentUserId: string
  onFiltersChange: (f: ActiveFilters) => void
  onLayoutChange: (l: Layout) => void
  onDensityChange: (d: Density) => void
  onSlideshow: () => void
}

function GalleryToolbar({ filters, layout, density, itemCount, currentUserId, onFiltersChange, onLayoutChange, onDensityChange, onSlideshow }: ToolbarProps) {
  const [input,       setInput]       = useState('')
  const [suggestions, setSuggestions] = useState<{ id: string; name?: string | null; tag?: string; count?: number }[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [mode,        setMode]        = useState<'hashtag' | 'person' | 'caption'>('caption')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (input.length < 1) { setSuggestions([]); setSuggestOpen(false); return }

    const isHashtag = input.startsWith('#')
    const query     = isHashtag ? input.slice(1) : input
    setMode(isHashtag ? 'hashtag' : 'person')

    const timer = setTimeout(async () => {
      if (isHashtag) {
        if (query.length < 1) { setSuggestions([]); return }
        const res  = await fetch(`/api/hashtags/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      } else {
        const res  = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
      }
      setSuggestOpen(true)
    }, 250)
    return () => clearTimeout(timer)
  }, [input])

  function pickHashtag(tag: string) {
    onFiltersChange({ ...filters, hashtag: tag })
    setInput(''); setSuggestions([]); setSuggestOpen(false)
  }

  function pickPerson(id: string, name: string | null) {
    onFiltersChange({ ...filters, person: { id, name: name ?? id } })
    setInput(''); setSuggestions([]); setSuggestOpen(false)
  }

  function submitCaption() {
    if (!input.trim() || input.startsWith('#')) return
    onFiltersChange({ ...filters, caption: input.trim() })
    setInput(''); setSuggestions([]); setSuggestOpen(false)
  }

  function clearFilter(key: keyof ActiveFilters) {
    onFiltersChange({ ...filters, [key]: key === 'myTags' ? false : null })
  }

  const hasFilters = !!(filters.caption || filters.hashtag || filters.person || filters.myTags)

  return (
    <div className="mb-6 flex flex-col gap-3">
      {/* Row 1: search + featuring me + slideshow */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Unified search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitCaption() }}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
            placeholder="Search captions, #hashtags, or @people…"
            className="w-full px-4 py-2 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors"
          />
          {suggestOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-paper border border-smoke shadow-lg">
              {mode === 'hashtag'
                ? suggestions.map(s => (
                    <button key={s.id} onMouseDown={() => pickHashtag(s.tag!)}
                      className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-mist flex items-center justify-between">
                      <span className="font-medium text-brand-red">#{s.tag}</span>
                      <span className="text-xs text-ash">{s.count} photo{s.count !== 1 ? 's' : ''}</span>
                    </button>
                  ))
                : suggestions.map(s => (
                    <button key={s.id} onMouseDown={() => pickPerson(s.id, s.name ?? null)}
                      className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-mist">
                      {s.name ?? 'Unknown'}
                    </button>
                  ))
              }
            </div>
          )}
        </div>

        {/* Featuring me */}
        <button
          onClick={() => onFiltersChange({ ...filters, myTags: !filters.myTags, person: null })}
          className={`px-3 py-2 text-sm font-medium border transition-colors ${filters.myTags ? 'bg-brand-red border-brand-red text-paper' : 'border-smoke text-steel hover:border-steel hover:text-ink'}`}
        >
          Featuring me
        </button>

        {/* Slideshow */}
        {itemCount > 0 && (
          <button
            onClick={onSlideshow}
            className="px-3 py-2 text-sm font-medium border border-smoke text-steel hover:border-steel hover:text-ink transition-colors"
          >
            ▶ Slideshow
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.caption && (
            <Chip label={`"${filters.caption}"`} onRemove={() => clearFilter('caption')} />
          )}
          {filters.hashtag && (
            <Chip label={`#${filters.hashtag}`} onRemove={() => clearFilter('hashtag')} color="red" />
          )}
          {filters.person && (
            <Chip label={filters.person.name} onRemove={() => clearFilter('person')} />
          )}
          {filters.myTags && (
            <Chip label="Featuring me" onRemove={() => clearFilter('myTags')} />
          )}
          <button
            onClick={() => onFiltersChange({ caption: null, hashtag: null, person: null, myTags: false })}
            className="text-xs text-ash hover:text-ink underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Row 2: layout + density */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex border border-smoke">
          {(['grid', 'masonry', 'timeline'] as Layout[]).map(l => (
            <button key={l} onClick={() => onLayoutChange(l)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${layout === l ? 'bg-ink text-paper' : 'text-steel hover:bg-mist'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-ash mr-1">Columns:</span>
          {([2, 3, 4] as Density[]).map(d => (
            <button key={d} onClick={() => onDensityChange(d)}
              className={`w-7 h-7 text-xs font-bold border transition-colors ${density === d ? 'bg-ink text-paper border-ink' : 'border-smoke text-steel hover:border-steel'}`}>
              {d}
            </button>
          ))}
        </div>
        {itemCount > 0 && (
          <span className="text-xs text-ash ml-auto">{itemCount} photo{itemCount !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}

function Chip({ label, onRemove, color }: { label: string; onRemove: () => void; color?: 'red' }) {
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 border border-smoke text-xs ${color === 'red' ? 'text-brand-red' : 'text-ink'}`}>
      {label}
      <button onClick={onRemove} className="text-ash hover:text-ink leading-none">×</button>
    </span>
  )
}
