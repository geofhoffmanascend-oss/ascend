// Phase 60 — onboarding/feature tour types.

export type TourRole = 'member' | 'gym' | 'instructor'

// Each ScreenKey maps to a mock screen component in app/tour/screens/MockScreen.tsx.
export type ScreenKey = string

export type TourStep = {
  /** Which mock screen to render for this step. */
  screen: ScreenKey
  /** CSS selector (a [data-tour="…"] hook) inside that screen for the spotlight. */
  selector: string
  title: string
  body: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  /** Stable key the survey records against. */
  featureKey: string
  /** Optional "if your gym enables this" style note shown in the popover. */
  note?: string
  /** When the highlighted element lives in the collapsed mobile nav, open it first. */
  mobileOpensNav?: boolean
}

export type TourConfig = {
  role: TourRole
  label: string
  /** Route to the matching interactive tour. */
  href: string
  steps: TourStep[]
}
