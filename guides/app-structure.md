# AscendIt — App Structure

Last updated: 2026-05-30. Update this file when adding new routes, pages, or lib files.

---

## Directory Overview

```
app/
├── (public)
│   ├── page.tsx                    Landing page with hero, CTAs, tour links
│   ├── about/page.tsx              Public about page
│   ├── tour/page.tsx               Student product tour (static mock data)
│   ├── tour/admin/page.tsx         Admin/gym-owner product tour
│   ├── events/page.tsx             Public community events calendar
│   ├── events/[id]/page.tsx        Public event detail
│   ├── gyms/[slug]/page.tsx        Public gym profile page
│   └── profile/[userId]/page.tsx   Public user profile (privacy-gated)
│
├── (auth)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── onboarding/page.tsx                 Student onboarding wizard (6 steps)
│   ├── onboarding/instructor/page.tsx      Instructor onboarding wizard
│   ├── onboarding/admin/page.tsx           Admin onboarding wizard
│   ├── confirm-email/page.tsx              Email change confirmation
│   └── reset-password/page.tsx            Password reset
│
├── (student — requires login)
│   ├── dashboard/page.tsx          Attendance streak, upcoming classes, forum activity
│   ├── schedule/page.tsx           Week/month view with register + check-in
│   ├── schedule/[date]/page.tsx    Day view with register + check-in
│   ├── forum/page.tsx              Forum list (general, class group, gym, belt)
│   ├── forum/[id]/page.tsx         Forum detail with posts and replies
│   ├── events/new/page.tsx         Submit a community event
│   ├── events/my/page.tsx          My submitted events with status
│   ├── lessons/page.tsx            Private lesson requests list
│   ├── lessons/new/page.tsx        Request a new private lesson
│   ├── lessons/[id]/page.tsx       Lesson detail + messaging thread
│   ├── journal/page.tsx            Training journal history
│   ├── journal/new/page.tsx        New journal entry (free-form or guided)
│   ├── journal/[id]/page.tsx       Edit journal entry
│   ├── gallery/page.tsx            Photo/video gallery with upload
│   ├── gallery/tag/[tag]/page.tsx  Hashtag album
│   ├── store/page.tsx              Gear store — browse + cart + orders
│   ├── tournaments/page.tsx        Community tournament list
│   ├── tournaments/[id]/page.tsx   Tournament detail + division registration
│   ├── tournaments/[id]/results/page.tsx  Results page (public if isPublic)
│   ├── messages/page.tsx           DM inbox
│   ├── messages/[userId]/page.tsx  DM thread
│   ├── messages/requests/page.tsx  Message request inbox
│   ├── notifications/page.tsx      Notification list
│   ├── profile/page.tsx            Own profile (full view + QR code)
│   ├── profile/edit/page.tsx       Edit profile fields + privacy toggles
│   ├── reflection/edit/page.tsx    Edit training reflection
│   ├── settings/page.tsx           Notification prefs, DM settings, home gym, schedule prefs, forum subscriptions
│   ├── feedback/[sessionId]/page.tsx  Post-class feedback wizard
│   ├── checkin/[token]/page.tsx    QR check-in confirmation
│   └── gyms/register/page.tsx     Register a new gym
│
├── (instructor — requires instructor or admin role)
│   ├── instructor/page.tsx             Instructor home
│   ├── instructor/schedule/page.tsx    Upcoming sessions with counts
│   ├── instructor/classes/page.tsx     Class list
│   ├── instructor/classes/[id]/page.tsx  Class detail
│   ├── instructor/sessions/[id]/page.tsx  Session detail + attendance + notes + notify
│   ├── instructor/students/[id]/page.tsx  Student notes + reach-out
│   ├── instructor/lessons/page.tsx     Private lesson inbox
│   ├── instructor/lessons/new/page.tsx  Initiate a private lesson
│   ├── instructor/plans/page.tsx       Lesson plans list
│   ├── instructor/plans/new/page.tsx   Create lesson plan
│   ├── instructor/plans/[id]/page.tsx  Edit lesson plan
│   ├── instructor/scan/page.tsx        QR code scanner for check-in
│   └── instructor/sub-requests/page.tsx  Class sub requests
│
├── (admin — requires admin role)
│   ├── admin/page.tsx                  Admin home with nav cards
│   ├── admin/users/page.tsx            User list with search
│   ├── admin/users/[id]/page.tsx       User detail — roles, belt verify, class access, email actions
│   ├── admin/users/[id]/promote/page.tsx  Belt promotion form
│   ├── admin/classes/page.tsx          Class list
│   ├── admin/classes/new/page.tsx      Create class
│   ├── admin/classes/[id]/page.tsx     Edit class
│   ├── admin/attendance/page.tsx       Attendance reports
│   ├── admin/feedback/page.tsx         Student feedback viewer
│   ├── admin/forum/page.tsx            Forum moderation
│   ├── admin/store/page.tsx            Product + order management
│   ├── admin/settings/page.tsx         Review URL, gym config
│   └── admin/tournaments/             Tournament management (list + create + manage)
│
├── (site-admin — requires site_admin role)
│   ├── site-admin/page.tsx             Platform dashboard with metrics
│   ├── site-admin/gyms/page.tsx        All gyms list with search/filter
│   ├── site-admin/gyms/[id]/page.tsx   Gym detail + edit + members + tier + payment terms
│   ├── site-admin/gyms/new-review/     Free-tier gyms registered in last 30 days
│   ├── site-admin/events/page.tsx      Event approval queue
│   ├── site-admin/forums/page.tsx      Belt forum moderation
│   └── site-admin/admins/page.tsx      Grant/revoke site_admin role
│
└── components/
    ├── Header.tsx              Nav, badges, sign-out
    ├── Footer.tsx
    ├── BeltBadge.tsx           Belt + stripe display component
    ├── BracketView.tsx         Tournament bracket (single_elim + round_robin)
    ├── GymForumPrompt.tsx      Gym forum join/create prompt (client, used in onboarding + gym profile)
    ├── GymPicker.tsx           Debounced gym search input
    ├── NavBadges.tsx           Notification + DM unread count badges
    ├── PushPermissionButton.tsx  Push notification opt-in
    ├── QRCodeDisplay.tsx
    ├── Toast.tsx
    ├── Skeleton.tsx
    └── tour/                   Tour-specific animation components
```

---

## API Routes

```
app/api/
├── auth/
│   ├── [...nextauth]/          NextAuth — credentials + Google OAuth
│   ├── register/               POST — create account
│   ├── reset-password/         POST — apply password reset token
│   └── confirm-email/          POST — apply email change token
│
├── account/                    DELETE — delete own account
│
├── users/
│   ├── [id]/                   GET/PATCH — fetch or update user profile
│   └── search/                 GET — user search (for DM + media tag)
│
├── user/
│   ├── class-preferences/      PUT — update hiddenClassGroups
│   └── complete-onboarding/    POST — mark onboarding done
│
├── admin/
│   ├── classes/[id]/           GET/PUT/DELETE — class management
│   ├── classes/                GET/POST
│   ├── feedback/               GET — all feedback (admin view)
│   ├── init-group-forums/      POST — one-time seed group forums ⚠️ needs running
│   ├── promote/                POST — belt promotion
│   ├── send-password-reset/    POST — send password reset email
│   ├── update-email/           POST — trigger email change
│   ├── settings/               GET/PUT — gym settings (review URL etc.)
│   ├── users/[id]/class-access/ PUT — block/unblock class groups
│   ├── users/[id]/roles/        PUT — assign roles
│   ├── users/[id]/verify-belt/  PUT/DELETE — verify or revoke belt
│   └── tournaments/             Full CRUD for tournament management
│
├── site-admin/
│   ├── stats/                  GET — platform metrics
│   ├── gyms/                   GET — all gyms list
│   ├── gyms/[id]/              GET/PUT — gym detail + edit + tier upgrade
│   ├── gyms/new-review/        GET — new free-tier gyms
│   ├── events/                 GET — pending/approved/rejected events
│   ├── events/[id]/            PUT — approve or reject event
│   ├── belt-forums/init/       POST — seed 5 belt forums ⚠️ needs running
│   ├── forums/belt-posts/      GET — recent posts across belt forums
│   ├── forums/posts/[id]/      DELETE — remove belt forum post
│   └── users/[id]/site-admin-role/ PUT/DELETE — grant/revoke site_admin
│
├── commitments/                POST — register for a class session
├── commitments/[id]/           DELETE — unregister
│
├── checkin/                    POST — self check-in
├── checkin/qr/                 POST — QR scan check-in (instructor)
├── checkin/qr-token/           GET — get user's QR token
├── checkin/public/             GET — public QR check-in page data
│
├── competitions/               GET/POST — competition history
├── competitions/[id]/          PUT/DELETE
│
├── cron/
│   ├── checkin-reminders/      POST — send check-in push notifications
│   └── feedback-prompts/       POST — send post-class feedback push notifications
│
├── events/                     GET (public) / POST (submit event)
├── events/[id]/                GET (public, pending gated)
├── events/my/                  GET — own submissions
│
├── feedback/                   POST — submit class feedback
│
├── forums/[id]/posts/          POST — create post (belt + gym enforcement)
├── forums/[id]/subscribe/      POST/DELETE — subscribe/unsubscribe
│
├── goals/                      GET/POST
├── goals/[id]/                 PUT/DELETE
│
├── gyms/                       GET/POST — list gyms / register gym
├── gyms/search/                GET — gym search
├── gyms/[id]/                  GET — gym detail
├── gyms/[id]/forum/            GET/POST — gym forum
├── gyms/[id]/membership/       PUT/DELETE — join/leave gym
├── gyms/[id]/members/          GET — gym member list
├── gyms/[id]/members/[userId]/ PUT — approve/reject membership
│
├── hashtags/search/            GET — hashtag autocomplete
│
├── instructor/
│   ├── lessons/                GET — instructor lesson inbox
│   ├── notes/                  POST — create student note
│   ├── notes/[id]/             PUT/DELETE
│   ├── plans/                  GET/POST — lesson plans
│   ├── plans/[id]/             GET/PUT/DELETE
│   ├── sessions/[id]/notes/    PUT — session notes
│   ├── sessions/[id]/notify/   POST — push notify committed students
│   ├── sessions/[id]/release/  POST — release session for substitution
│   └── sub-requests/[id]/      PUT — claim a sub request
│
├── lessons/                    GET/POST — private lessons
├── lessons/[id]/               GET/PUT — lesson detail + status
├── lessons/[id]/messages/      GET/POST — lesson message thread
│
├── media/                      GET/POST — gallery items (visibility-filtered)
├── media/[id]/                 PATCH/DELETE — edit or delete media
├── media/[id]/access/          GET/PUT — custom access list
├── media/[id]/tags/            GET/POST — tag users
├── media/[id]/tags/[userId]/   DELETE — remove tag
│
├── messages/                   GET — DM inbox
├── messages/[userId]/          GET/POST — DM thread
├── messages/[userId]/read/     POST — mark thread read
├── messages/unread-count/      GET
├── messages/requests/          GET — DM request list
├── messages/requests/[id]/     PUT — approve/deny DM request
│
├── notifications/              GET — notification list
├── notifications/[id]/         PATCH — mark read
├── notifications/mark-all-read/ POST
├── notifications/unread-count/  GET
│
├── posts/[id]/                 PATCH/DELETE — edit/delete forum post
│
├── push/subscribe/             POST — register push subscription
├── push/vapid-key/             GET — public VAPID key
│
├── reflection/                 POST/PUT — training reflection
├── reflection/[userId]/        GET — view a user's reflection
│
├── store/products/             GET/POST — product list
├── store/products/[id]/        GET/PATCH/DELETE
├── store/orders/               GET/POST
├── store/orders/[id]/          PATCH — update order status
│
├── tournaments/                GET — visible tournaments
├── tournaments/[id]/           GET — tournament detail
├── tournaments/[id]/divisions/[divId]/register/  POST/DELETE — register/withdraw
├── tournaments/[id]/results/   GET — public results
│
├── training-logs/              GET/POST
└── training-logs/[id]/         GET/PUT/DELETE
```

---

## lib/ Helpers

| File | Purpose |
|------|---------|
| `adminAuth.ts` | `requireAdmin()` — 401/403 guard for admin routes |
| `instructorAuth.ts` | `requireInstructor()` |
| `siteAdminAuth.ts` | `requireSiteAdmin()` |
| `roles.ts` | `hasRole`, `isAdmin`, `isInstructor`, `isSiteAdmin`, `hasAnyRole` |
| `database.ts` | Prisma singleton with CockroachDB adapter |
| `belt.ts` | `BELT_ORDER`, `canPostInBeltForum`, belt color/label maps |
| `bracket.ts` | Pure bracket generation — `generateSingleElim`, `generateRoundRobin`, `nextMatchSlot` |
| `classGroups.ts` | `classTypeToGroup`, `ALL_GROUPS`, `GROUP_LABELS` |
| `cloudinary.ts` | Upload + watermark helpers |
| `cloudinaryUrl.ts` | Client-safe URL transformations |
| `email.ts` | Resend email sender |
| `generateSessions.ts` | Class session generation logic |
| `gymSettings.ts` | Fetch gym settings |
| `journalPrompts.ts` | Guided journal prompt definitions |
| `mediaAccess.ts` | `canViewMedia`, `visibilityFilter` for gallery queries |
| `notify.ts` | `createNotification` — in-app notification helper |
| `push.ts` | Push notification sender |
| `tourData.ts` | Static mock data for tour pages |
| `checkin.ts` | Check-in time window logic |

