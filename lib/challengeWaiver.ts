// Public-launch pivot — platform "friendly challenge" waiver for challenge matches.
// Both the challenger and the challenged e-sign this (typed legal name + affirmations)
// BEFORE a challenge becomes scheduled. There is no gym-admin approval step — the
// responsibility to obtain venue permission and sign any gym-required waivers rests
// with the participants, as stated below.
//
// ⚠️ DRAFT for the owner's review. Written to align with Virginia law (e.g. Va. Code
// and Virginia's treatment of pre-injury releases for recreational activity). NOT a
// substitute for attorney review. Confirm minors handling — this draft is 18+ only.

export const CHALLENGE_WAIVER_VERSION = 1

export const CHALLENGE_WAIVER_TITLE = 'Friendly Challenge Match — Release & Acknowledgement'

export const CHALLENGE_WAIVER_BODY = `This is a FRIENDLY challenge match — arranged between training partners for fun, growth, and camaraderie. It is not a sanctioned competition, and AscendIt is only the tool used to arrange it.

By typing my name below, I acknowledge and agree:

1. VOLUNTARY & FRIENDLY. I am entering this challenge match voluntarily and in a spirit of friendly competition. I am physically able to participate and assume the inherent risks of Brazilian Jiu-Jitsu and grappling, which can include serious injury.

2. ADULTS ONLY. I am at least 18 years of age.

3. VENUE PERMISSION IS MY RESPONSIBILITY. Before conducting this match at any gym, academy, or facility, I will obtain the permission of that facility's owner or instructor, and I will read and sign any liability waivers, releases, or rules that the facility requires. I will not hold a match anywhere I am not authorized to do so.

4. REFEREE STRONGLY ENCOURAGED. I understand it is strongly recommended that a qualified black belt referee the match for safety, and I will seek one out.

5. ASSUMPTION OF RISK & RELEASE. To the fullest extent permitted by Virginia law, I assume all risk of injury and release, waive, and agree not to sue the other participant, any host facility, and AscendIt (and their owners, instructors, and staff) for any injury, loss, or damage arising out of this match, except for harm caused by gross negligence or willful misconduct.

6. CONDUCT. I will compete with control and good sportsmanship, honor the agreed ruleset and any added stipulations, and stop immediately on a tap, a referee's command, or if continuing would be unsafe.

7. ARRANGEMENT ONLY. AscendIt does not organize, supervise, referee, insure, or take responsibility for this match. Any agreement is solely between the participants.

I have read and understood this release. Typing my name is my legal signature.`

// Convenience: which side of a challenge a given user is, for signature storage.
export function challengeSide(c: { challengerId: string; challengedId: string }, userId: string): 'challenger' | 'challenged' | null {
  if (c.challengerId === userId) return 'challenger'
  if (c.challengedId === userId) return 'challenged'
  return null
}
