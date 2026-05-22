const BELT_COLORS: Record<string, string> = {
  white: 'bg-white border border-smoke',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  brown: 'bg-amber-800',
  black: 'bg-gray-900',
}

export function MockBelt({ belt }: { belt: string }) {
  return <span className={`inline-block w-8 h-2 rounded-sm ${BELT_COLORS[belt] ?? 'bg-gray-400'}`} />
}
