type Belt = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red'

const BELT_STYLES: Record<Belt, string> = {
  white:  'bg-gray-100 text-gray-700 border border-gray-300',
  blue:   'bg-blue-600 text-white',
  purple: 'bg-purple-600 text-white',
  brown:  'bg-amber-800 text-white',
  black:  'bg-zinc-900 text-white',
  coral:  'bg-orange-400 text-white',
  red:    'bg-brand-red text-white',
}

export function BeltBadge({ belt, stripes }: { belt: Belt; stripes: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest ${BELT_STYLES[belt]}`}>
        {belt}
      </span>
      {stripes > 0 && (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: stripes }).map((_, i) => (
            <span key={i} className="w-1 h-3.5 bg-gray-400 inline-block" />
          ))}
        </span>
      )}
    </span>
  )
}
