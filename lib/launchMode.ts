// Public-launch pivot (2026-06): the app ships as a simple social + personal-practice product
// with gym-management functionality HIDDEN in production (code retained, just not surfaced).
//
// Per-surface gating: each gym-management surface checks SIMPLE_LAUNCH and hides itself.
// Activate in production by setting NEXT_PUBLIC_LAUNCH_MODE=simple (Vercel env). Leave it unset
// (or =full) in local dev so the gym-management features stay visible and buildable.
//
// Readable on both server and client because it is a NEXT_PUBLIC_ var.
export const SIMPLE_LAUNCH = process.env.NEXT_PUBLIC_LAUNCH_MODE === 'simple'

// Member-facing features paused in simple-launch mode (forced off in getEffectiveFeatures).
// Gallery, forums, feed, journal, private lessons, events and schedule are kept.
export const PAUSED_FEATURES = ['store', 'tournaments'] as const
