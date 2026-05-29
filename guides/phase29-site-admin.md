# Phase 29 — Site Admin

## Overview

A dedicated administration area for platform-wide management. Only users with the `site_admin` role can access it. This is separate from the per-gym `/admin/*` area.

Responsibilities covered here:
- Platform metrics dashboard
- Gym management (list, upgrade tier, edit details)
- Event approval queue (from Phase 28)
- Belt forum moderation (delete posts)
- New gym review queue

The site admin area is intentionally minimal — it is not a CMS or a full-featured back-office. It is a focused tool for platform-level operations.

## Dependencies

- Phase 24: `site_admin` role, `lib/siteAdminAuth.ts`, middleware updated
- Phase 25: Gym model, gym registration
- Phase 26: Gym forums
- Phase 27: Belt forums, belt verification
- Phase 28: PublicEvent model, event submission

## Schema Changes

None. All required schema was introduced in earlier phases.

## DB Migration Notes

None.

## API Routes

All routes use `lib/siteAdminAuth.ts` → `requireSiteAdmin()`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/site-admin/stats` | site_admin | Returns: `{ totalGyms, participatingGyms, totalUsers, unaffiliatedUsers, pendingEventsCount, newGymsCount (free tier, last 7 days) }`. Single Prisma query with `_count` and aggregates. |
| GET | `/api/site-admin/gyms` | site_admin | Paginated list of all gyms. Query: `page` (default 1), `limit` (default 25), `status` (filter by GymTier). Returns id, name, slug, participatingStatus, memberCount (active GymMembership count), headInstructorName, createdAt. Order by createdAt DESC. |
| GET | `/api/site-admin/gyms/[id]` | site_admin | Full gym detail: all Gym fields, member list (id, name, email, roles, belt), forum (if exists), paymentTerms. |
| PUT | `/api/site-admin/gyms/[id]` | site_admin | Update gym. Accepts any Gym fields. Special handling for `participatingStatus` change (see Phase 25/26 notes). Triggers notifications on tier upgrade. |
| GET | `/api/site-admin/events` | site_admin | List events. Query: `status` (default: `pending`). Returns event + submitter {name, email}. Order by createdAt DESC. |
| PUT | `/api/site-admin/events/[id]` | site_admin | Approve or reject. Body: `{ status: 'approved' \| 'rejected', rejectionNote? }`. Notifies submitter. |
| GET | `/api/site-admin/forums/belt-posts` | site_admin | Recent posts across all belt forums. Query: `limit` (default 50), `forumId` (optional, filter by specific belt forum). Returns post + author {name, belt, beltVerified} + forum {title, beltLevel}. Orders by createdAt DESC. |
| DELETE | `/api/site-admin/forums/posts/[id]` | site_admin | Delete a post. Verify it belongs to a belt_forum before deleting. |
| GET | `/api/site-admin/gyms/new-review` | site_admin | List free-tier gyms created in the last 30 days, ordered by createdAt DESC. Intended for initial outreach/review workflow. |

## UI Pages & Components

### Shared: Site Admin Layout

Create `app/site-admin/layout.tsx`:
- Server component
- Calls `requireSiteAdmin()` — redirect to `/dashboard` if not site admin
- Renders a left sidebar nav (desktop) or top tabs (mobile) with links:
  - Dashboard (`/site-admin`)
  - Gyms (`/site-admin/gyms`)
  - Events (`/site-admin/events`)
  - Forums (`/site-admin/forums`)
  - New Gyms (`/site-admin/gyms/new-review`)

Sidebar styling: `bg-ink-soft text-paper` sidebar (dark), active link with `bg-brand-red` indicator on left edge.

### `app/site-admin/page.tsx` — Server Component

Dashboard with metric cards.

Cards (use grid layout, 2-3 columns):
- **Total Gyms** — count with "X participating" sub-label
- **Total Users** — count with "X unaffiliated" sub-label
- **Pending Events** — count with "Requires review" label. If > 0: card has a yellow border. Link to `/site-admin/events`.
- **New Gyms (7 days)** — count of free-tier gyms registered this week. Link to `/site-admin/gyms/new-review`.

Card styling: `border border-smoke bg-paper p-6`. Metric value: `font-display text-3xl font-bold text-ink`. Label: standard label token (`text-xs font-bold uppercase tracking-widest text-steel`).

Below cards: two side-by-side panels
- **Recent Gyms** — last 5 gyms registered, with tier badge and "View" link
- **Pending Events** — first 3 pending events, with "Review" link

### `app/site-admin/gyms/page.tsx` — Server Component + Client Filters

Paginated gym list. Data fetched server-side via Prisma.

Table columns: Name | Tier | Members | Head Instructor | Created | Actions
- Tier: badge — `participating` = green (`bg-green-100 text-green-800`), `free` = gray, `inactive` = red/muted
- Actions: "View" (links to `/site-admin/gyms/[id]`) and "Upgrade" (inline button that opens a confirm modal or inline form)
- Filter: tier dropdown (All / Free / Participating / Inactive)
- Search: text input that filters client-side (or server-side with query param)

Pagination: simple prev/next with page number, 25 per page.

### `app/site-admin/gyms/[id]/page.tsx` — Client Component

Gym detail and edit form.

Sections:
1. **Gym Info** — editable fields: name, headInstructorName, address, city, state, zip, phone, website, description, logoUrl. "Save" button calls `PUT /api/site-admin/gyms/[id]`.
2. **Tier & Payment** — participating status dropdown (Free / Participating / Inactive). Payment terms: four number inputs (membershipPct, merchPct, photoPct, flatMonthlyFee). Label explanation: "These are the revenue share percentages agreed upon with this gym." "Save" button.
3. **Members** — table of active members: Name, Email, Belt, Roles, Joined. No editing here (use per-gym admin tools for that).
4. **Gym Forum** — if gym_forum exists: link to it + post count. If not: "No forum yet."
5. **Danger Zone** — "Mark as Inactive" button (sets participatingStatus = inactive). Confirmation required.

### `app/site-admin/events/page.tsx` — Client Component

Event approval queue.

Default view: pending events only. Toggle to show approved/rejected.

Each event card:
- Event title, type badge, date, city/state
- Submitted by: "[Name] ([email]) · [date]"
- Gym affiliation (if set): gym name link
- Description (truncated, expandable)
- Actions: **Approve** (green primary button) | **Reject** (opens inline rejection form with a text field for `rejectionNote` + "Send Rejection" button)

After approve/reject: remove card from pending queue with a brief success animation (opacity fade out).

Empty state (no pending events): "All caught up! No pending events."

### `app/site-admin/forums/page.tsx` — Client Component

Belt forum moderation.

Layout:
- Left panel: list of 5 belt forums as tabs (White / Blue / Purple / Brown / Black)
- Right panel: recent posts for the selected forum

Post list item:
- Author name + belt badge (verified indicator)
- Post content (full text)
- Posted timestamp
- "Delete Post" button — confirmation inline ("Delete this post?") → calls `DELETE /api/site-admin/forums/posts/[id]` → removes from list

Load more: paginated with "Load more" button at bottom.

### `app/site-admin/gyms/new-review/page.tsx` — Server Component

List of free-tier gyms registered in the last 30 days. Ordered by newest first.

Each row: Gym name, city/state, head instructor, member count, registered date, "View" link to `/site-admin/gyms/[id]`.

Purpose is to help site admin reach out to newly registered gyms and pitch the participating tier. No automated actions — this is a human workflow.

Heading: "New Gym Review — Free-tier gyms registered in the last 30 days."

### Header Update (`app/components/Header.tsx`)

Add "Site Admin" link for users with `site_admin` role. Place it in the admin/user menu dropdown, above or separate from the regular "Admin" link.

Use `isSiteAdmin(session)` from `lib/roles.ts` to conditionally render.

## Implementation Steps

1. **Verify `lib/siteAdminAuth.ts` exists** (from Phase 24). If not, create it (see Phase 24 guide).

2. **Build `GET /api/site-admin/stats`**. Use a single set of Prisma count queries. Include `unaffiliatedUsers` as `count(User where gymId is null)`.

3. **Build `GET /api/site-admin/gyms`**. Include `_count: { members: true }` (filter to active only in `where`). Accept `page`, `limit`, `status` query params.

4. **Build `GET /api/site-admin/gyms/[id]`**. Include member list (use `include: { members: { include: { user: true } } }`), forum (find by gymId + type='gym_forum'), paymentTerms.

5. **Build `PUT /api/site-admin/gyms/[id]`**. Accept partial update. Handle tier change side effects (Phase 26 forum disclaimer logic, gym admin notifications).

6. **Build `GET /api/site-admin/events` and `PUT /api/site-admin/events/[id]`** (from Phase 28 — may already exist; verify here).

7. **Build `GET /api/site-admin/forums/belt-posts`**. Query `Post` where `forum.type = 'belt_forum'`, include `author {name, belt, beltVerified}` and `forum {title, beltLevel}`. Order by `createdAt DESC`. Accept `forumId` filter.

8. **Build `DELETE /api/site-admin/forums/posts/[id]`** (from Phase 27 — may already exist; verify here).

9. **Build `GET /api/site-admin/gyms/new-review`**. Query `Gym where participatingStatus = 'free' AND createdAt >= 30 days ago`, include member count.

10. **Build `app/site-admin/layout.tsx`** with auth check and sidebar nav.

11. **Build `app/site-admin/page.tsx`** — fetch stats from API.

12. **Build `app/site-admin/gyms/page.tsx`** — gym list with pagination.

13. **Build `app/site-admin/gyms/[id]/page.tsx`** — gym detail/edit.

14. **Build `app/site-admin/events/page.tsx`** — event queue.

15. **Build `app/site-admin/forums/page.tsx`** — belt forum moderation.

16. **Build `app/site-admin/gyms/new-review/page.tsx`** — new gym review list.

17. **Update `app/components/Header.tsx`** — add "Site Admin" link.

18. **Verify middleware** — `/site-admin/*` requires `site_admin` role (from Phase 24).

19. **Smoke test:**
    - Non-site-admin user tries to access `/site-admin` → redirected to `/dashboard`
    - Site admin sees correct stats on dashboard
    - Site admin approves a pending event → submitter gets notification → event appears in public calendar
    - Site admin upgrades gym tier → gym admin gets notification
    - Site admin deletes a belt forum post → post disappears

## Edge Cases & Gotchas

- **`requireSiteAdmin()` in layout vs each page.** Put it in the layout so all child pages are covered. Individual API routes also call `requireSiteAdmin()` — belt-and-suspenders is correct here.

- **Gym member list privacy.** Site admins see emails of gym members. This is intentional — they need it for support/billing. Ensure this data is not accidentally exposed to non-site-admins via the API.

- **`PUT /api/site-admin/gyms/[id]` paymentTerms.** Store as raw JSON. No server-side schema validation — the admin UI enforces the shape. If the JSON is malformed on the client side, the API should return a 400. Add a basic `typeof === 'object'` check.

- **Rejecting an event and the rejection note.** The rejection note is stored on `PublicEvent.rejectionNote`. It is also included in the notification body sent to the submitter. Do not expose the rejection note in the public `GET /api/events/[id]` response — only to the submitter and site admins.

- **Belt forum moderation scope.** `DELETE /api/site-admin/forums/posts/[id]` only applies to `belt_forum` posts. Site admins do not automatically have moderation rights over gym-scoped or class-scoped forums (that is a gym admin responsibility). This is a policy decision — enforce it in the API.

- **Pagination cursor vs offset.** Using offset pagination (`skip`, `take`) is fine for admin use cases with modest data volumes. CockroachDB handles it fine. If the gym list grows to tens of thousands, switch to cursor-based pagination.

- **Site admin impersonation.** This phase does not include user impersonation (logging in as another user). Do not add it without careful security review.

- **Two admin areas.** The regular `/admin/*` is gym-scoped (per-gym admin). `/site-admin/*` is platform-wide. Both use different auth helpers. Keep them clearly separated in the codebase. Do not reuse components between them without clear prop-based scoping.
