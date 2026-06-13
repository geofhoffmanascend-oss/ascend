// Phase 58 — Match rulesets.
//
// Static config consumed by the live match console (and later tournaments +
// challenge matches). Point values + match durations below are taken from
// official sources and verified via web research (2026-06) — do not edit from
// memory. When a table is created we snapshot the resolved config onto the
// MatchTable (`rulesetConfig`) so later edits to these presets never mutate a
// finished match.
//
// Sources:
//   IBJJF points + adult durations — https://ibjjf.com/news/new-rules-updates
//   ADCC rules & regulations       — https://adcombat.com/adcc-rules-regulations/

export type ScoringAction = {
  key: string // matches MatchScoreEvent intent; 'points' bucket
  label: string
  points: number
  side: true // always per-competitor
}

export type RulesetConfig = {
  id: string
  name: string
  summary: string[] // 5–10 bullets shown on selection
  periodMs: number // default match length (ms)
  periods: { label: string; ms: number }[]
  // per-competitor scoring buttons (positive points)
  actions: ScoringAction[]
  advantages: boolean
  penalties: boolean
  fullRulesUrl: string | null
  // free-form for Custom: banned holds/notes rendered into the summary
  notes?: string
}

const min = (m: number) => m * 60_000

// ── IBJJF (Gi, Adult) ───────────────────────────────────────────────────────
// Verified point values: takedown 2, sweep 2, knee-on-belly 2, guard pass 3,
// mount 4, back control 4. Adult durations by belt: white 5, blue 6, purple 7,
// brown 8, black 10 (min). Default the preset to black-belt 10:00; editable.
const IBJJF_ACTIONS: ScoringAction[] = [
  { key: 'takedown', label: 'Takedown', points: 2, side: true },
  { key: 'sweep', label: 'Sweep', points: 2, side: true },
  { key: 'knee_on_belly', label: 'Knee on Belly', points: 2, side: true },
  { key: 'guard_pass', label: 'Guard Pass', points: 3, side: true },
  { key: 'mount', label: 'Mount', points: 4, side: true },
  { key: 'back_control', label: 'Back Control', points: 4, side: true },
]

const IBJJF_SUMMARY = [
  'Takedown — 2 points',
  'Sweep — 2 points',
  'Knee on belly — 2 points',
  'Guard pass — 3 points',
  'Mount — 4 points',
  'Back control (two hooks) — 4 points',
  'Each position must be controlled for 3 seconds to score',
  'Advantages break ties (near-sweep / near-pass / near-submission)',
  'Penalties for stalling and fouls',
]

export const RULESETS: RulesetConfig[] = [
  {
    id: 'ibjjf_gi',
    name: 'IBJJF Gi (Adult)',
    summary: [
      ...IBJJF_SUMMARY,
      'Adult match time by belt: white 5 / blue 6 / purple 7 / brown 8 / black 10 min',
    ],
    periodMs: min(10),
    periods: [{ label: 'Regulation', ms: min(10) }],
    actions: IBJJF_ACTIONS,
    advantages: true,
    penalties: true,
    fullRulesUrl: 'https://ibjjf.com/news/new-rules-updates',
  },
  {
    id: 'ibjjf_nogi',
    name: 'IBJJF No-Gi (Adult)',
    summary: [
      ...IBJJF_SUMMARY,
      'No-Gi follows the same point values as Gi',
      'Adult match time by belt mirrors the Gi durations',
    ],
    periodMs: min(10),
    periods: [{ label: 'Regulation', ms: min(10) }],
    actions: IBJJF_ACTIONS,
    advantages: true,
    penalties: true,
    fullRulesUrl: 'https://ibjjf.com/news/new-rules-updates',
  },
  {
    id: 'ibjjf_masters',
    name: 'IBJJF Masters',
    summary: [
      ...IBJJF_SUMMARY,
      'Masters divisions use a 5-minute regulation time',
    ],
    periodMs: min(5),
    periods: [{ label: 'Regulation', ms: min(5) }],
    actions: IBJJF_ACTIONS,
    advantages: true,
    penalties: true,
    fullRulesUrl: 'https://ibjjf.com/news/new-rules-updates',
  },
  {
    // Verified ADCC values: clean takedown (past guard) 4, sweep 2, clean sweep 4,
    // guard pass 3, knee-on-stomach 2, mount 2, back (two hooks/body triangle) 3.
    // Negative points (minus) for stalling/pulling guard etc. — tracked as penalties.
    id: 'adcc',
    name: 'ADCC',
    summary: [
      'Clean takedown (past guard) — 4 points',
      'Takedown to guard / sweep — 2 points',
      'Clean sweep (past guard) — 4 points',
      'Guard pass — 3 points',
      'Knee on stomach — 2 points',
      'Mount — 2 points',
      'Back control (two hooks / body triangle) — 3 points',
      'Negative points for stalling, pulling guard, disengaging',
      'No points in the first half (qualifiers 5 min / finals 6 min)',
    ],
    periodMs: min(10), // qualifier round; finals 6 min — editable per match
    periods: [{ label: 'Regulation', ms: min(10) }],
    actions: [
      { key: 'clean_takedown', label: 'Clean Takedown', points: 4, side: true },
      { key: 'takedown', label: 'Takedown / Sweep', points: 2, side: true },
      { key: 'clean_sweep', label: 'Clean Sweep', points: 4, side: true },
      { key: 'guard_pass', label: 'Guard Pass', points: 3, side: true },
      { key: 'knee_on_stomach', label: 'Knee on Stomach', points: 2, side: true },
      { key: 'mount', label: 'Mount', points: 2, side: true },
      { key: 'back_control', label: 'Back Control', points: 3, side: true },
    ],
    advantages: false,
    penalties: true, // negative points
    fullRulesUrl: 'https://adcombat.com/adcc-rules-regulations/',
  },
  {
    id: 'sub_only',
    name: 'Submission-only / EBI Overtime',
    summary: [
      'No points — win by submission only in regulation',
      'If regulation ends with no submission, go to overtime',
      'EBI overtime: each athlete attempts from back-take or spider-web',
      'Fastest escape time / submission across rounds wins',
      'Set regulation time below; overtime handled manually',
    ],
    periodMs: min(10),
    periods: [{ label: 'Regulation', ms: min(10) }],
    actions: [],
    advantages: false,
    penalties: false,
    fullRulesUrl: null,
  },
  {
    id: 'custom',
    name: 'Custom',
    summary: [
      'Set the match time and rules yourself',
      'List any banned holds, positions, or submissions',
      'No automatic point buttons unless you keep a standard set',
    ],
    periodMs: min(5),
    periods: [{ label: 'Regulation', ms: min(5) }],
    actions: IBJJF_ACTIONS, // sensible default; operator can ignore
    advantages: true,
    penalties: true,
    fullRulesUrl: null,
  },
]

export function getRuleset(id: string | null | undefined): RulesetConfig | null {
  if (!id) return null
  return RULESETS.find(r => r.id === id) ?? null
}
