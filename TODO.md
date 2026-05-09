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

---

## PHASE 12 — Post-class Feedback & Reviews

### [x] 12.1 — Post-class push notification 1 hour after class begins (only if student checked in): "Log Training" and "Give Feedback" buttons
### [x] 12.2 — Feedback flow: branching questions to classify experience as positive, negative, or specific concern. All responses logged and visible to instructors/admins.
### [x] 12.3 — Positive feedback path: if highly rated, prompt for public review and open admin-configured review URL in new tab
### [x] 12.4 — Admin setting for public review URL

---

## PRODUCTION ISSUES — In Progress

### [ ] P1 — Service worker registration failing in production
SW errors seen in order (each step was a fix attempt):
1. "The script resource is behind a redirect" — caused by middleware intercepting `/sw.js` for unauthenticated users → **Fixed:** added `sw\\.js`, `manifest\\.json`, `icons/` to middleware matcher exclusion
2. "DOMException: The operation is insecure" — sw.js not served with correct MIME type or blocked by implicit CSP → **Fixed:** added explicit `Content-Type: application/javascript`, `Service-Worker-Allowed: /`, `Cache-Control: no-cache` headers in `next.config.ts`
3. "TypeError: Failed to execute 'clone' on 'Response': Response body is already used" — `res.clone()` was called inside async `caches.open().then()`, after `res` was already consumed → **Fixed:** moved to `const clone = res.clone()` synchronously before the async call. Also excluded all `/api/*` routes from SW caching. Cache bumped to `ascend-v4`.
- **If still broken after deploy:** check browser devtools → Application → Service Workers for the actual error. Also verify `sw.js` returns `Content-Type: application/javascript` (check Network tab). If MIME type is wrong, Vercel may be ignoring `next.config.ts` headers for public/ files — fallback is to add headers in `vercel.json`.

### [ ] P2 — Production auth: credentials login 401 on preview deployment URLs
Symptom: `POST /api/auth/callback/credentials → 401` on `ascend-nj8ondsyc-*.vercel.app` URLs.
Root cause: `NEXTAUTH_URL` is set to `https://ascend-ten-olive.vercel.app`. NextAuth v4 validates CSRF tokens against this URL — any other hostname (preview deploys) gets 401.
Fix options:
- Use `https://ascend-ten-olive.vercel.app` (canonical URL) — works, no code change needed
- OR remove `NEXTAUTH_URL` from Vercel env vars entirely so NextAuth auto-detects from request host (`vercel env rm NEXTAUTH_URL production` after `vercel link --project ascend --yes`)
- **NOT YET APPLIED** — confirm which URL the user is hitting first

### [ ] P3 — `/api/auth/register` returning 500 in production
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

### [ ] 13.1 — Photo/video upload (Vercel Blob or S3)
### [ ] 13.2 — Gallery with user tagging
### [ ] 13.3 — Search gallery by tagged user

---

## OPTIONAL PHASE 14 — Gear Store

### [ ] 14.1 — Product listings (admin creates)
### [ ] 14.2 — Student purchase flow
### [ ] 14.3 — Pickup confirmation
