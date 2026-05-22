# Jiu-Jitsu App — TODO

## How Claude Should Use This File
- Read this file at the start of every session
- Prompt user with a prioritized list of tasks to choose from, with option to work through in order
- Mark tasks `[x]` when complete and move them to `guides/DO_NOT_REVIEW/COMPLETED_TASKS.md`
- Add new tasks here as they are identified
- Never read `guides/DO_NOT_REVIEW/` files unless explicitly asked

## Constraints
- Do NOT push to git without explicit user instruction
- Do NOT run database commands without explicit user instruction
- Do not generate or guess external URLs
- Do not add features, refactors, or "improvements" beyond what was asked

**Token Conservation:**
- Use Grep to search for specific content rather than reading entire large files
- Keep responses concise — avoid over-explaining unless asked for detail
- Use `/compact` proactively mid-session before context gets large
- Keep sessions short and task-focused — start a new session per discrete task
- When delegating simple tasks (searching, file reads, small edits) to subagents, prefer the haiku model
- Do not re-read files already read in the current session unless content may have changed

## Task Workflow
- All active tasks live in `TODO.md`
- When a task is complete, move it to `guides/DO_NOT_REVIEW/COMPLETED_TASKS.md`
- For complex multi-step tasks, create a guide in `guides/` before starting
- When a guide is fully executed and no longer needed, move it to `guides/DO_NOT_REVIEW/`
- Keep TODO.md current — it is the source of truth for what needs to be done

## Documentation
- Create user/admin documentation for each completed feature in `README.md`
- After completing each feature, update the README — it will later become the in-app help menu

---

## PHASE 1 — Foundation
All scaffolding complete. Database setup pending — see notes below.

### [x] 1.1 — Project scaffold (Next.js 16, TypeScript, Tailwind v4)
### [x] 1.2 — Design system copied from Daily Gap (`app/globals.css`)
### [x] 1.3 — Layout: `app/layout.tsx`, Header, Footer
### [x] 1.4 — Landing page (`/`) — gym name, tagline, sign up CTA
### [x] 1.5 — Auth: NextAuth setup, Credentials + Google OAuth
### [x] 1.6 — Register API (`/api/auth/register`)
### [x] 1.7 — Login page, Register page
### [x] 1.8 — Role-based middleware
### [x] 1.9 — Prisma schema (`prisma/schema.prisma`)
### [x] 1.10 — `prisma.config.ts`, `lib/database.ts`, `lib/adminAuth.ts`, `lib/instructorAuth.ts`
### [x] 1.11 — Onboarding wizard (`/onboarding`)
### [x] 1.12 — Dashboard skeleton (`/dashboard`)
### [x] 1.13 — Seed script (`prisma/seed.ts`)
### [x] 1.14 — Header shows Sign Out when logged in

**Database note:** Connected to CockroachDB cluster `tickle-mole-25903`. Tables created via `prisma db push` (fresh cluster, no enum conflict). Seed has been run — 8 users, 3 classes, 5 forums. See `guides/testCredentials.md` for test accounts.

---

## PHASE 2 — Onboarding & Student Profile

### [x] 2.1 — Student profile page (`/profile`)
### [x] 2.2 — Edit profile (`/profile/edit`)
### [x] 2.3 — Student goals
### [x] 2.4 — Competition history

---

## PHASE 3 — Class Schedule & Commitments
### [x] 3.1 — Weekly schedule view (`/schedule`)
### [x] 3.2 — Class session generation (on-demand)
### [x] 3.3 — Commit / uncommit to a class session
### [x] 3.4 — Dashboard: this week's committed classes
### [x] 3.5 — See who else is committed
### [x] 3.6 — Day view (`/schedule/[date]`)

---

## PHASE 4 — Instructor Dashboard
### [x] 4.1 — Instructor home (`/instructor`)
### [x] 4.2 — Class list (`/instructor/classes`)
### [x] 4.3 — Class detail (`/instructor/classes/[id]`)
### [x] 4.4 — Session detail (`/instructor/sessions/[id]`)
### [x] 4.5 — Mark attendance
### [x] 4.6 — Student notes (`/instructor/students/[id]`)
### [x] 4.7 — Reach-out prompt
### [x] 4.8 — Lesson plans (`/instructor/plans`)
### [x] 4.9 — Create/edit lesson plan

---

## PHASE 5 — Forums & Communication
### [x] 5.1 — Forum list page (`/forum`)
### [x] 5.2 — General + announcement forums
### [x] 5.3 — Per-class forums
### [x] 5.4 — Forum page (`/forum/[id]`)
### [x] 5.5 — Create post
### [x] 5.6 — Threaded replies
### [x] 5.7 — Pin posts
### [x] 5.8 — Forum activity on dashboard

---

## PHASE 6 — Private Lessons
### [x] 6.1 — Request a private lesson (`/lessons/new`)
### [x] 6.2 — Lesson list (`/lessons`)
### [x] 6.3 — Instructor lesson inbox (`/instructor/lessons`)
### [x] 6.4 — Lesson detail + messaging (`/lessons/[id]`)
### [x] 6.5 — Lesson history on profile

---

## PHASE 7 — Admin Dashboard
### [x] 7.1 — Admin home (`/admin`)
### [x] 7.2 — User management (`/admin/users`)
### [x] 7.3 — User detail (`/admin/users/[id]`)
### [x] 7.4 — Rank promotion (`/admin/users/[id]/promote`)
### [x] 7.5 — Attendance reports (`/admin/attendance`)
### [x] 7.6 — Class management (`/admin/classes`)
### [x] 7.7 — Create/edit class
### [x] 7.8 — Forum moderation (`/admin/forum`)

---

## PHASE 8 — Polish & UX
### [x] 8.1 — Empty states (handled inline throughout)
### [x] 8.2 — Loading skeletons (`app/components/Skeleton.tsx`)
### [x] 8.3 — Mobile responsiveness (responsive layouts throughout)
### [x] 8.4 — Error pages (`app/not-found.tsx`, `app/error.tsx`)
### [x] 8.5 — Belt display component (`app/components/BeltBadge.tsx`)

---

## PHASE 9 — Notifications & Messaging UI

### [x] 9.1 — Notification bell + DM icon in header with unread count badges
### [x] 9.2 — In-app notification system: model, API, mark-as-read
### [x] 9.3 — User settings page: push notification opt-out, notification type preferences (instructor notes, private messages, class updates, check-in prompts, post-class feedback prompts), email copy opt-in
### [x] 9.4 — DM permission setting: students can opt out of messages from other students (instructor messages always allowed)

---

## PHASE 10 — Student Check-in & Attendance

### [x] 10.1 — Student self check-in from app (available in window before class starts)
### [x] 10.2 — Pre-class push notification 15 minutes before a committed class with check-in prompt
### [x] 10.3 — Check-in auto-marks student present in instructor attendance portal
### [x] 10.4 — Per-user QR code for gym-side scanning as an alternative to app check-in
### [x] 10.5 — Enhanced admin attendance reports: breakdowns by class group, by instructor, by individual student
### [x] 10.6 — Student attendance record and streak on their dashboard

---

## PHASE 11 — Training Journal

### [x] 11.1 — Training log model and API: linked to class session, private flag, free-form and guided content
### [x] 11.2 — Free-form log entry: plain text box, private toggle with tooltip (private logs hidden from instructors)
### [x] 11.3 — Guided journal mode: toggled per entry, structured prompts (sleep, energy, diet, conditioning, technique notes, class objective, personal goal + did you accomplish it, comfort zone, drill partner quality, rolling intensity, focus, key takeaways, future items). Only answered prompts are saved.
### [x] 11.4 — Default guided questions setting in user settings: students pick which prompts appear by default
### [x] 11.5 — Journal history on student dashboard: list of past logs, filterable by class
### [x] 11.6 — Optional entry title field (replaces "General Entry" label; falls back to class name)

---

## PHASE 12 — Post-class Feedback & Reviews

### [x] 12.1 — Post-class push notification 1 hour after class begins (only if student checked in): "Log Training" and "Give Feedback" buttons
### [x] 12.2 — Feedback flow: branching questions to classify experience as positive, negative, or specific concern. All responses logged and visible to instructors/admins.
### [x] 12.3 — Positive feedback path: if highly rated, prompt for public review and open admin-configured review URL in new tab
### [x] 12.4 — Admin setting for public review URL

---

## PRODUCTION ISSUES — In Progress

### [x] P1 — Service worker registration failing in production
SW errors seen in order (each step was a fix attempt):
1. "The script resource is behind a redirect" — caused by middleware intercepting `/sw.js` for unauthenticated users → **Fixed:** added `sw\\.js`, `manifest\\.json`, `icons/` to middleware matcher exclusion
2. "DOMException: The operation is insecure" — sw.js not served with correct MIME type or blocked by implicit CSP → **Fixed:** added explicit `Content-Type: application/javascript`, `Service-Worker-Allowed: /`, `Cache-Control: no-cache` headers in `next.config.ts`
3. "TypeError: Failed to execute 'clone' on 'Response': Response body is already used" — `res.clone()` was called inside async `caches.open().then()`, after `res` was already consumed → **Fixed:** moved to `const clone = res.clone()` synchronously before the async call. Also excluded all `/api/*` routes from SW caching. Cache bumped to `ascend-v4`.
- **If still broken after deploy:** check browser devtools → Application → Service Workers for the actual error. Also verify `sw.js` returns `Content-Type: application/javascript` (check Network tab). If MIME type is wrong, Vercel may be ignoring `next.config.ts` headers for public/ files — fallback is to add headers in `vercel.json`.

### [x] P2 — Production auth: credentials login 401 on preview deployment URLs
Fixed: removed `NEXTAUTH_URL` from Vercel production env — NextAuth now auto-detects host, works on all deployment URLs.

### [x] P3 — `/api/auth/register` returning 500 in production
Not yet diagnosed. Error is caught and logged as `[register]` in Vercel function logs. Check Vercel logs for the actual exception. Likely a DB connection issue or missing env var.

---

## PHASE 15 — Anonymous Feedback + DM Improvements

### [x] 15.1 — Anonymous feedback toggle on feedback wizard; instructor/admin views show "Anonymous" when flagged
### [x] 15.2 — User search modal for starting new direct message conversations
### [x] 15.3 — Message request system: students DMing restricted users send a request instead; recipient approves/declines from /messages/requests
### [x] 15.4 — Toast notification in Settings when user disables student DMs (explains request flow)
### [x] 15.5 — Toast in MessageThread when message is sent as a request (pending/created states)

**Requires `prisma db push`** — adds `anonymous` to `ClassFeedback` and new `MessageRequest` model + `MessageRequestStatus` enum.

---

## OPTIONAL PHASE 13 — Media Archive

### [x] 13.1 — Photo upload via Cloudinary; video links (YouTube/Vimeo)
### [x] 13.2 — Gallery grid at /gallery with upload modal and item detail modal; tagging via user search
### [x] 13.3 — Filter gallery by tagged person
### [x] 13.4 — `forSale` flag with watermark via Cloudinary transformation; price field; purchase button placeholder for Phase 14
### [x] 13.5 — Hashtag model; #hashtag parsing on upload/edit; hashtag search via unified search bar; event album pages at /gallery/tag/[tag]
### [x] 13.6 — Opt-out of photo tagging setting; tag notifications when tagged
### [x] 13.7 — Unified search bar: # prefix for hashtag autocomplete, name for person autocomplete; filter chips; "Featuring me" shortcut
### [x] 13.8 — Slideshow mode: fullscreen overlay, keyboard nav (← → Esc), caption/hashtag/people display
### [x] 13.9 — Layout modes: grid (2/3/4 col density), masonry (CSS columns), timeline (grouped by month)

**Requires Cloudinary credentials:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — add to .env.local and Vercel.

---

## OPTIONAL PHASE 14 — Gear Store

### [x] 14.1 — Product listings (admin creates): /admin/store — add/edit/delete products with name, description, price, stock, image URL, category, visibility toggle
### [x] 14.2 — Student purchase flow: /store — product grid, add to cart, cart modal, place order (pay at pickup model); students notified when ready
### [x] 14.3 — Pickup confirmation: admin marks orders Ready → Picked Up; student notified at each step; status filter on admin orders view

**Requires `prisma db push`** — adds Product, Order, OrderItem models and OrderStatus enum.

**Note:** Product images use URL input (paste any image URL). Cloudinary upload for product images can be added once Cloudinary credentials are configured.

---

## PHASE 16 — Multi-Role System + Instructor Workflow

### [x] 16.1 — Schema: `roles Role[]`, `VendorType`, `instructor_only` forum, `sessionNotes`, `ClassSubRequest`
### [x] 16.2 — Auth: session/token updated to `roles[]`, middleware updated, all role checks migrated
### [x] 16.3 — `lib/roles.ts` helper: `hasRole`, `hasAnyRole`, `isAdmin`, `isInstructor`, `isVendor`
### [x] 16.4 — Anonymous feedback: filtered from instructor view, UI note added
### [x] 16.5 — Instructor-only forum: access-gated, shown only to instructors, auto-subscribe on role assign
### [x] 16.6 — Admin role manager UI: toggle roles per user, student always required
### [x] 16.7 — `RoleManager` component on admin user detail page

### [x] R4 — DB push + data migration — DONE (Step 1: schema pushed, migration SQL run to populate roles[])
### [x] R4b — Phase 16 cleanup: remove old `role Role` field from User model + `prisma db push` — DONE

### [x] 16.8 — Instructor schedule view: upcoming sessions, registered/checked-in counts
### [x] 16.9 — Per-session notes editor with public/private toggle (visible to committed students on day view)
### [x] 16.10 — Class release/substitution flow (release session → notify instructors → claim)
### [x] 16.11 — Instructor-initiated private lessons (1–2 students; 3–4 needs schema expansion)
### [x] 16.12 — Instructor push notification UI (notify all committed students per session)
### [x] 16.13 — Vendor dashboard placeholder page + route
### [x] 16.14 — Schedule prev/next navigation (Day/Week/Month views, desktop + mobile)
### [x] 16.15 — JWT callback: re-fetch roles from DB on every refresh so role changes take effect immediately (no re-login needed)

---

## PHASE 17 — Class Group Membership & Schedule Grouping

Schema pushed: `ClassGroup` enum (`grappling | striking | kids | competition | seminar`), `blockedClassGroups ClassGroup[]` and `hiddenClassGroups ClassGroup[]` on User, `title String?` on TrainingLog.

**Type → group mapping:**
- Grappling: gi, nogi, fundamentals, nogi_fundamentals, open_mat, wrestling
- Striking: muay_thai, self_defense
- Kids: kids
- Competition: competition_prep
- Seminar: seminar

### [x] 17.1 — Admin class access UI: per-user toggles for each ClassGroup on admin user detail page; `PUT /api/admin/users/[id]/class-access`
### [x] 17.2 — User schedule preferences: "Show on schedule" section in /settings; `PUT /api/user/class-preferences`
### [x] 17.3 — Schedule enforcement: admin-blocked groups → class card grayed out + register/check-in hidden; user-hidden groups → class not shown at all
### [x] 17.4 — Check-in enforcement: self check-in, QR scan, and registration all blocked for admin-blocked groups
### [x] 17.5 — Schedule time-slot grouping headers (6am/Noon/PM/Comp weekdays; by class type weekends)
### [x] 17.6 — Group forums: `group_forum` ForumType, `classGroup` field on Forum; each group has a forum; shown on forum list + settings; blocked groups hidden; access-gated in forum detail

**One-time setup required:** POST to `/api/admin/init-group-forums` (admin only) to seed the 5 group forums into the database.

---

## PENDING USER ACTION

These items are code-complete but require manual steps to fully activate:

- **Vercel env vars (Phase 19):** Add `RESEND_API_KEY` and `EMAIL_FROM=onboarding@resend.dev` to Vercel dashboard → Project → Settings → Environment Variables (Production + Preview). Without this, password reset emails won't send in production.
- **Group forum seeding (Phase 17):** One-time setup — while logged in as admin, POST to `/api/admin/init-group-forums` (e.g. from browser devtools or a REST client) to create the 5 group forums in the database.
- **Production email domain:** Sandbox sender only delivers to your verified Resend email. To send to any user, verify a domain at resend.com and update `EMAIL_FROM` to `noreply@yourdomain.com`.

---

## ACTIVE BUGS

### [x] BUG-1 — Header hydration mismatch — FIXED
Root cause: `SessionProvider` had no initial session, causing server/client mismatch. Fix: `RootLayout` now fetches server session and passes it to `SessionProvider` via the `session` prop in `providers.tsx`. Additional fix: `suppressHydrationWarning` added to `<body>` to suppress browser-extension-injected attribute mismatches (Grammarly, password managers, etc.).

### [ ] BUG-2 — Gallery grid images not displaying correctly — NEEDS VISUAL VERIFICATION
**Symptom:** Gallery view layout/density options may not visually work as expected; images may not fill grid cells properly.
**Root cause identified:** `h-full` inside an `aspect-ratio` container is unreliable cross-browser. Fix applied (use `absolute inset-0` for grid mode, `w-full block` for masonry) in `app/gallery/GalleryClient.tsx` — `GridItem` component.
**Status:** Code fix is in place. Needs browser testing to confirm.

### [ ] BUG-3 — Gallery layout/density buttons — NEEDS VISUAL VERIFICATION
**Status:** Verify after BUG-2 confirmed. Test grid/masonry/timeline and 2/3/4 column density buttons in a clean browser session.

---

## PHASE 18 — UX & Profile Polish

### [x] 18.1 — Favicon + page titles — DONE (title template "%s | Ascend" + per-route metadata on all main pages)
### [x] 18.2 — Logo nav behavior — DONE (logo links to /dashboard when logged in, / when logged out)
### [x] 18.3 — User name links — DONE (forum posts, schedule roster, day view; public profile page at /profile/[userId])
### [x] 18.4 — Profile field privacy controls — DONE (Members/Private toggles on bio, phone, emergency contact, weight class, competitions; enforced on public profile page; stored in profilePrivacy JSON column)
### [x] 18.5 — Profile nav link — DONE (person icon added to desktop header icon row; "Profile" added to mobile dropdown)
### [x] 18.6 — Help icon confirmed — DONE (`?` circle icon in desktop header icon row, only visible when logged in; "Help" in mobile dropdown)

---

## PHASE 20 — Help & Documentation

### [x] 20.1 — Help icon in header — DONE (`?` circle SVG icon in desktop icon row + Help link in mobile menu)
### [x] 20.2 — Help page (`/help`) — DONE (role-aware accordion sections; student always shown; instructor/admin/vendor gated)
### [x] 20.3 — Help content — DONE (full copy for all student, instructor, admin, vendor sections)
### [x] 20.4 — About page (`/about`) — DONE (public page with gym description, features, CTAs)

---

## PHASE 21 — Onboarding Workflows

### [x] 21.1 — Student onboarding wizard — DONE (5-step: profile, contact, schedule prefs, reflection, completion; step progress dots; independent save per step)
### [x] 21.2 — Instructor onboarding — DONE (`/onboarding/instructor` 3-step wizard; chains to admin onboarding if user is also admin)
### [x] 21.3 — Admin onboarding — DONE (`/onboarding/admin` 2-step wizard; completion calls `POST /api/user/complete-onboarding`)
### [x] 21.4 — Starter reflection journal — DONE (optional step 4 in student onboarding; TrainingReflection upsert via `POST /api/reflection`)
### [x] 21.5 — TrainingReflection schema — DONE (pushed to DB; `id`, `userId`, `whyStarted`, `challenges`, `goals`, `privacy`, timestamps)
### [x] 21.6 — Reflection display on profile — DONE (own profile shows "My Reflection"; edit button links to `/reflection/edit`; public profiles enforce privacy tier)

---

## PHASE 22 — Public Profiles & Privacy Expansion

### [x] 22.1 — Third privacy tier — DONE (Public/Members/Private in EditProfileForm; stored in profilePrivacy JSON)
### [x] 22.2 — Public profile access — DONE (/profile/[userId] works without auth; three-tier visibility; ShareButton copies URL)
### [x] 22.3 — Public reflection — DONE (TrainingReflection rendered on public profile when privacy=public or members+authenticated)
### [x] 22.4 — Middleware updated — DONE (/profile/ and /tour/ added to public paths)

---

## PHASE 23 — App Tours (Marketing)

Two separate tours: one for prospective students (`/tour`), one for prospective gym owners/admins (`/tour/admin`). Both use fully static mock data — no DB queries. Both are public routes. Both use CSS keyframe animations (no external animation library needed — keep bundle lean).

### [x] 23.1 — Landing page CTAs — DONE ("See how it works →" and "Managing a gym?" links added to `app/page.tsx`)
### [x] 23.2 — Student tour (`/tour`) — DONE (6 animated sections: Schedule, Check-in, Forum, DMs, Journal, Profile; full-width CTA at end)
### [x] 23.3 — Tour CTAs — DONE (contextual prompts per section; final sign-up CTA with gym branding)
### [x] 23.4 — Mock data (`lib/tourData.ts`) — DONE (personas: Marcus black belt, Jordan blue belt, Sam white belt; messages, schedule, journal, forum content)
### [x] 23.5 — Admin tour entry point — DONE ("Managing a gym?" secondary CTA on landing page links to `/tour/admin`)
### [x] 23.6 — Admin tour (`/tour/admin`) — DONE (6 sections: Student Onboarding, Schedule/Instructors, Attendance/Roster, Feedback, Forums/DMs, Dashboard counters)
### [x] 23.7 — Admin tour CTA — DONE (business-focused copy; final CTA placeholder for Phase 19 email)
### [x] 23.8 — Shared tour infrastructure — DONE (`TourHeader`, `MockBelt`, `AnimatedChat`, `AnimatedCounter` in `app/components/tour/`; CSS keyframes in `app/globals.css`)

---

## PHASE 19 — Email API Integration

### [x] 19.1 — Resend integrated (`lib/email.ts`); sandbox sender `onboarding@resend.dev`; `RESEND_API_KEY` + `EMAIL_FROM` in .env.local. Add both to Vercel env (Production + Preview) via dashboard.
### [x] 19.2 — Admin password reset email — DONE (`POST /api/admin/send-password-reset`; `EmailActions` component on admin user detail page; user-facing `/reset-password?token=` page)
### [x] 19.3 — Admin email address update — DONE (`POST /api/admin/update-email`; confirmation sent to new address; user confirms at `/confirm-email?token=`; token expires 24h)

**Schema:** `PasswordResetToken` and `EmailChangeToken` tables pushed to DB.
**To upgrade to production email:** verify a domain in Resend dashboard, then update `EMAIL_FROM` to `noreply@yourdomain.com` in both `.env.local` and Vercel env.

---

## COMPLETED ITEMS REQUIRING USER RESPONSE

### [x] R1 — prisma db push for Phase 14 — DONE
### [x] R2 — Cloudinary credentials — DONE (diztvzzix cloud, pushed to Vercel)

### [x] R3 — Phase 15 anonymous feedback + DM improvements — DONE (already in sync)
