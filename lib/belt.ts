export const BELT_ORDER: Record<string, number> = {
  white: 0,
  blue: 1,
  purple: 2,
  brown: 3,
  black: 4,
  coral: 4,
  red: 4,
}

export function canPostInBeltForum(userBelt: string, forumBelt: string): boolean {
  return (BELT_ORDER[userBelt] ?? 0) >= (BELT_ORDER[forumBelt] ?? 0)
}

export const BELT_LABELS: Record<string, string> = {
  white: 'White Belt',
  blue: 'Blue Belt',
  purple: 'Purple Belt',
  brown: 'Brown Belt',
  black: 'Black Belt',
  coral: 'Coral Belt',
  red: 'Red Belt',
}

export const BELT_COLORS: Record<string, string> = {
  white: 'bg-white border border-smoke',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  brown: 'bg-amber-800',
  black: 'bg-ink',
  coral: 'bg-orange-500',
  red: 'bg-red-600',
}
