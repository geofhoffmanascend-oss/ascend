# AscendIt — Feature Audit

This document tracks every user-facing feature end-to-end:
- **Schema** — database model exists ✅/❌
- **API** — route exists and enforces auth correctly ✅/⚠️/❌
- **UI** — page/component renders and reflects state ✅/⚠️/❌
- **Enforcement** — restrictions are real (API blocks, not just hidden in UI) ✅/⚠️/❌
- **Side effects** — linked notifications, visibility changes, cascades wired correctly ✅/⚠️/❌

Status key: ✅ Complete · ⚠️ Partial / known gap · ❌ Missing

---

## Authentication

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Register (credentials) | ✅ | ✅ | ✅ | ✅ | ✅ Assigns student role, triggers onboarding |  |
| Login (credentials) | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| Google OAuth | ✅ | ✅ | ✅ | ✅ | ✅ Assigns student role on first login |  |
| Password reset | ✅ `PasswordResetToken` | ✅ | ✅ | ✅ Token expiry enforced | ✅ Email sent via Resend | Requires `RESEND_API_KEY` in Vercel env |
| Email change | ✅ `EmailChangeToken` | ✅ | ✅ (admin-triggered) | ✅ Token expiry enforced | ✅ Confirmation email sent | Only admins can initiate |
| Delete account | ✅ | ✅ | ✅ | ✅ | ⚠️ Cascades on most relations; beltVerifiedBy is string FK (dangling ref possible) | Dev convenience tool |

---

## Onboarding

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Student wizard (6 steps) | ✅ `onboardingDone`, `onboardedRoles` | ✅ | ✅ | ✅ Redirects incomplete users | ✅ Gym joined, forum prompt shown | Back button on all steps except step 1 ✅ |
| Gym forum prompt (sub-step) | ✅ | ✅ | ✅ | ✅ | ✅ Notifies gym members | `onDone` must be optional (server component constraint) |
| Instructor wizard | ✅ | ✅ | ✅ | ✅ | ✅ Chains to admin wizard if user is also admin |  |
| Admin wizard | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| Re-entry (settings) | N/A | N/A | ✅ Home gym + schedule prefs editable from /settings | N/A | ⚠️ No full wizard re-entry; settings covers gym + schedule prefs only |  |

---

## Schedule

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Weekly view | ✅ | ✅ | ✅ | ✅ Hidden groups filtered | ✅ |  |
| Day view | ✅ | ✅ | ✅ | ✅ Hidden + blocked groups filtered | ✅ |  |
| Month view | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| Register for session | ✅ `Commitment` | ✅ | ✅ Week ✅ Day | ✅ Blocked groups rejected at API | ✅ |  |
| Check-in (app) | ✅ `Attendance` | ✅ | ✅ Week ✅ Day | ✅ Window enforced, blocked groups rejected | ✅ Marks present in instructor view |  |
| Check-in (QR) | ✅ | ✅ | ✅ (instructor scan page) | ✅ | ✅ |  |
| Admin class access gating | ✅ `blockedClassGroups` | ✅ | ✅ Grayed card, no register button | ✅ API rejects blocked groups | ✅ |  |
| User schedule preferences | ✅ `hiddenClassGroups` | ✅ | ✅ Hidden from schedule view | ✅ Hidden groups not shown | ⚠️ **GAP: hidden groups' group forums still visible in /forum — see Forum Visibility row** |  |
| Session generation | ✅ `ClassSession` | ✅ Auto-generated | N/A | ✅ | N/A |  |

---

## Forums

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| General + announcement forums | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| Instructor-only forum | ✅ `instructor_only` | ✅ | ✅ Hidden for non-instructors | ✅ API redirects | ✅ Auto-subscribe on role assign |  |
| Class group forums | ✅ `group_forum` | ✅ | ⚠️ **GAP: admin-blocked groups are hidden, but user-hidden groups are NOT hidden** | ✅ API enforces blocked | ⚠️ **GAP: toggling a class group off in settings does not mute its forum notifications** |  |
| Gym forum | ✅ `gym_forum` | ✅ | ✅ | ✅ API checks gymId membership | ✅ Notifies gym members on create | `onDone` must be optional — no function props from server components |
| Belt forums | ✅ `belt_forum` | ✅ | ✅ Lock icon for above-belt forums | ✅ API rejects if belt too low | ✅ Belt shown with verified/unverified tag | **One-time setup: POST /api/site-admin/belt-forums/init** |
| Post creation | ✅ | ✅ | ✅ | ✅ Belt + gym checks at API level | ✅ Notifies subscribers |  |
| Subscribe / unsubscribe | ✅ `ForumSubscription` | ✅ | ✅ | ✅ | ✅ Affects notification delivery |  |
| Pin posts | ✅ | ✅ | ✅ | ✅ Instructor/admin only | ✅ |  |
| Forum list pagination | N/A | N/A | ⚠️ No pagination — all forums loaded at once | N/A | N/A | Acceptable at current scale |

---

## **Known Gap: Forum Visibility vs. Settings**

**Problem:** `hiddenClassGroups` in user settings controls which class types appear on the schedule AND which group forums appear in `/forum`. The schedule correctly hides them. The forum list only checks `blockedClassGroups` (admin-set), not `hiddenClassGroups` (user-set).

**Fix needed:** In `app/forum/page.tsx`, the `groupForums` filter must also exclude forums whose `classGroup` is in the user's `hiddenClassGroups`.

**Notification side effect:** Even if the forum is hidden from the UI, the user will still receive notifications for new posts in that forum if they are subscribed. The fix should also either: (a) auto-unsubscribe from hidden group forums, or (b) check `hiddenClassGroups` in the notification delivery logic.

**Status: FIXED in this session for UI visibility. Notification side effect: ⚠️ still needs work.**

---

## Private Lessons

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Request lesson | ✅ `PrivateLesson` | ✅ | ✅ | ✅ | ✅ Notifies instructor |  |
| Instructor inbox | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| Lesson messaging | ✅ | ✅ | ✅ | ✅ Participants only | ✅ Notifies recipient |  |
| Status transitions | ✅ `LessonStatus` | ✅ | ✅ | ✅ | ✅ Notifies student |  |
| Lesson history on profile | ✅ | ✅ | ✅ | ✅ | N/A |  |

---

## Training Journal

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Free-form entry | ✅ `TrainingLog` | ✅ | ✅ | ✅ | ✅ |  |
| Guided mode | ✅ JSON prompts field | ✅ | ✅ | ✅ | ✅ |  |
| Private flag | ✅ | ✅ | ✅ | ✅ Hidden from instructor view at API | ✅ |  |
| Default prompt settings | ✅ `defaultJournalPrompts` | ✅ | ✅ | ✅ | ✅ |  |
| Dashboard activity | ✅ | ✅ | ✅ | ✅ | N/A |  |

---

## Feedback

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Post-class feedback wizard | ✅ `ClassFeedback` | ✅ | ✅ | ✅ Only checked-in students | ✅ |  |
| Anonymous feedback | ✅ `anonymous` field | ✅ | ✅ | ✅ Hidden from instructor view | ✅ |  |
| Positive feedback → review URL | ✅ `GymSettings.reviewUrl` | ✅ | ✅ | ✅ | ✅ Opens URL in new tab |  |
| Push notification trigger | ✅ | ✅ Cron | ✅ | ✅ 1 hour post-class, checked-in only | ✅ Respects `notifyFeedbackPrompts` pref |  |

---

## Direct Messages

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| DM thread | ✅ `DirectMessage` | ✅ | ✅ | ✅ | ✅ Notifies recipient |  |
| Message request (restricted users) | ✅ `MessageRequest` | ✅ | ✅ | ✅ | ✅ Notifies on approval/denial |  |
| DM opt-out setting | ✅ `allowDmsFromStudents` | ✅ | ✅ | ✅ API enforces — sends request instead | ✅ Toast shown in settings |  |
| Unread badge | ✅ | ✅ | ✅ | ✅ | ✅ |  |

---

## Notifications

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| In-app notifications | ✅ `Notification` | ✅ | ✅ | ✅ | ✅ |  |
| Push notifications | ✅ `PushSubscription` | ✅ | ✅ Opt-in button | ✅ Respects preferences | ✅ |  |
| Check-in reminder push | ✅ | ✅ Cron | N/A (background) | ✅ Committed + window | ✅ Respects `notifyCheckinPrompts` |  |
| Feedback prompt push | ✅ | ✅ Cron | N/A | ✅ Checked-in only | ✅ Respects `notifyFeedbackPrompts` |  |
| Notification preferences | ✅ | ✅ | ✅ | ✅ | ⚠️ Prefs checked in push logic but not always in in-app notification creation | Not all `createNotification` calls check prefs first |
| Mark read / mark all read | ✅ | ✅ | ✅ | ✅ | ✅ |  |

---

## Gallery & Media

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Upload photo (Cloudinary) | ✅ `MediaItem` | ✅ | ✅ | ✅ | ✅ |  |
| Upload video link | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| Visibility (public/gym/private) | ✅ `MediaVisibility` | ✅ | ✅ Selector in upload modal | ✅ Compound OR query at API | ✅ |  |
| Custom access list | ✅ `MediaAccess` | ✅ | ⚠️ No UI to edit after upload (API exists, UI not built) | ✅ | N/A | Custom access UI (`PUT /api/media/[id]/access`) exists but no settings UI |
| Tag users | ✅ `MediaTag` | ✅ | ✅ | ✅ | ✅ Notifies tagged user |  |
| Opt out of tagging | ✅ `allowMediaTagging` | ✅ | ✅ (settings) | ⚠️ API checks pref but UI doesn't confirm if user can be tagged before submitting | ✅ |  |
| For sale / watermark | ✅ `forSale`, `price` | ✅ | ✅ (admin only) | ✅ | ✅ Watermark via Cloudinary transformation |  |
| Hashtags | ✅ `Hashtag`, `MediaHashtag` | ✅ | ✅ | ✅ | ✅ |  |
| Slideshow | N/A | N/A | ✅ | N/A | N/A |  |
| Grid / masonry / timeline layouts | N/A | N/A | ✅ | N/A | N/A |  |
| Gallery list visibility filter | ✅ | ✅ | ✅ | ✅ | N/A | Tag album page also filtered |

---

## Gear Store

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Product listing (gym + platform) | ✅ `Product`, `gymId` | ✅ Gym-scoped | ✅ | ✅ Gym admin can't edit platform products | ✅ |  |
| Cart + order | ✅ `Order`, `OrderItem` | ✅ | ✅ | ✅ | ✅ Notifies student on status change |  |
| Order status (ready/pickup) | ✅ `OrderStatus` | ✅ | ✅ (admin) | ✅ | ✅ Notifies student |  |

---

## Community Events

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Public calendar | ✅ `PublicEvent` | ✅ | ✅ | ✅ Only approved events | N/A |  |
| Submit event | ✅ | ✅ | ✅ | ✅ Start date must be future | ✅ Notifies site admins |  |
| Approval queue | ✅ | ✅ | ✅ `/site-admin/events` | ✅ site_admin only | ✅ Notifies submitter on decision |  |
| My submissions | ✅ | ✅ | ✅ | ✅ Own only | N/A |  |
| Pending event visibility | ✅ | ✅ | ✅ Banner shown | ✅ Only submitter + site_admin can view | N/A |  |

---

## Gyms & Membership

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Gym profile (public) | ✅ `Gym` | ✅ | ✅ | ✅ | N/A |  |
| Register gym | ✅ | ✅ | ✅ | ✅ | ✅ Notifies site admins |  |
| Join gym | ✅ `GymMembership` | ✅ | ✅ | ✅ Free=active, participating=pending | ✅ |  |
| Gym forum prompt | ✅ | ✅ | ✅ (onboarding + gym profile) | ✅ Must be active member | ✅ Notifies gym members |  |
| Gym tier upgrade | ✅ `GymTier` | ✅ | ✅ (site admin) | ✅ | ✅ Notifies gym admins + forum becomes "official" |  |

---

## Tournaments

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Create tournament | ✅ `Tournament` | ✅ | ✅ | ✅ Participating gym only | ✅ |  |
| Divisions | ✅ `Division` | ✅ | ✅ | ✅ Draft only can add/remove | ✅ |  |
| Registration | ✅ `Registration` | ✅ | ✅ | ✅ Belt range + active membership checked | ✅ |  |
| Bracket generation (single_elim) | ✅ `TournamentMatch` | ✅ | ✅ | ✅ ≥2 confirmed needed; no re-seed after results | ✅ |  |
| Bracket generation (round_robin) | ✅ | ✅ | ✅ | ✅ | ✅ |  |
| Double elimination | ✅ enum value | ✅ Returns 400 | ✅ "Coming soon" message | ✅ | N/A | Stub only |
| Match result entry | ✅ | ✅ | ✅ (admin) | ✅ | ✅ Winner propagated (single_elim) · tournament auto-completes |  |
| Results page | ✅ | ✅ | ✅ | ✅ isPublic or gym member | N/A |  |
| Tournament history on profile | ✅ | ✅ | ✅ W/L record | ✅ | N/A |  |
| Withdrawal after seeding | ✅ | ✅ 400 returned | ✅ Button hidden | ✅ API blocks | N/A |  |

---

## Belt Verification

| Feature | Schema | API | UI | Enforcement | Side Effects | Notes |
|---------|--------|-----|----|-------------|--------------|-------|
| Self-reported belt | ✅ `belt`, `stripes` | ✅ | ✅ | ✅ | ⚠️ Belt in JWT updated on refresh; user needs re-login after admin changes belt | JWT refreshes on every token rotation |
| Belt verification (admin) | ✅ `beltVerified`, `beltVerifiedBy` | ✅ | ✅ `BeltVerification` component | ✅ Admin only | ✅ Badge shown on profile + forum posts |  |
| Belt in JWT | ✅ | ✅ | N/A | ✅ | ✅ Used for belt forum post gating | Added to JWT in Phase 27 |

---

## One-Time Setup Required

These items are code-complete but require a manual action before they are fully active:

| Item | How to activate | Status |
|------|-----------------|--------|
| Belt forums (5 forums) | POST `/api/site-admin/belt-forums/init` while logged in as site_admin | ⚠️ Pending |
| Group forums (5 forums) | POST `/api/admin/init-group-forums` while logged in as admin | ⚠️ Pending |
| Resend email (password reset, email change) | Add `RESEND_API_KEY` + `EMAIL_FROM` to Vercel env | ⚠️ Pending |
| Production email domain | Verify domain in Resend dashboard, update `EMAIL_FROM` | ⚠️ Pending |

---

## Summary of Gaps

| Priority | Gap | Location | Fix |
|----------|-----|----------|-----|
| ~~**HIGH**~~ | ~~User-hidden class groups still show their group forums~~ | `app/forum/page.tsx` | ✅ FIXED — `groupForums` now filters both `blocked` and `hidden` |
| **HIGH** | Hiding a group forum does not mute notifications for it | `lib/notify.ts` + post creation | Check recipient's `hiddenClassGroups` before sending group forum notifications |
| **MED** | Custom media access list has no edit UI after upload | `app/gallery/` | Build access management modal on `MediaModal` or linked page |
| **MED** | `allowMediaTagging` opt-out not checked before submitting tag in UI | `UploadModal.tsx` | Validate tag targets against their `allowMediaTagging` setting before submitting |
| **MED** | In-app notifications don't always check per-type preferences | `lib/notify.ts` | Thread `notifyClassUpdates`, `notifyInstructorNotes` etc. through `createNotification` |
| **LOW** | `beltVerifiedBy` uses a string FK (not a Prisma relation) — dangling ref if verifier is deleted | `prisma/schema.prisma` | Acceptable for MVP; add cleanup in delete account handler if needed |
| **LOW** | No pagination on forum list | `app/forum/page.tsx` | Add at scale; acceptable now |

