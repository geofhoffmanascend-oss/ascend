# Phase 28 — Public Events

## Overview

A community calendar for the broader jiu-jitsu world. Any authenticated user can submit an event (open mat, competition, seminar, or other). Site admins approve or reject submissions. Approved events are publicly visible without login.

This gives AscendIt a reason for non-members to visit the site — browsable event listings drive organic discovery.

## Dependencies

- Phase 24: `site_admin` role and `lib/siteAdminAuth.ts` exist
- Phase 29 (Site Admin Dashboard) will consume the pending event queue — the API routes built here power that UI
- `lib/notify.ts` (existing) for sending notifications

## Schema Changes

### New enums

```prisma
enum PublicEventType {
  open_mat
  competition
  seminar
  other
}

enum PublicEventStatus {
  pending
  approved
  rejected
}
```

### New model: PublicEvent

```prisma
model PublicEvent {
  id             String            @id @default(cuid())
  title          String
  type           PublicEventType
  description    String?
  location       String?           // venue/location name
  address        String?
  city           String?
  state          String?
  zip            String?
  startDate      DateTime
  endDate        DateTime?
  submittedById  String
  gymId          String?           // optional — if submitted by/for a gym
  status         PublicEventStatus @default(pending)
  rejectionNote  String?
  approvedById   String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  submittedBy    User  @relation("EventSubmitter", fields: [submittedById], references: [id], onDelete: Cascade)
  approvedBy     User? @relation("EventApprover",  fields: [approvedById],  references: [id], onDelete: SetNull)
  gym            Gym?  @relation(fields: [gymId], references: [id], onDelete: SetNull)
}
```

Add back-relations to User and Gym:

On `User`:
```prisma
  eventsSubmitted  PublicEvent[] @relation("EventSubmitter")
  eventsApproved   PublicEvent[] @relation("EventApprover")
```

On `Gym`:
```prisma
  publicEvents  PublicEvent[]
```

## DB Migration Notes

Two new enums and one new table.

```sql
-- Create enums (run in psql if prisma db push fails)
CREATE TYPE "PublicEventType"   AS ENUM ('open_mat', 'competition', 'seminar', 'other');
CREATE TYPE "PublicEventStatus" AS ENUM ('pending', 'approved', 'rejected');

-- The PublicEvent table will be created by prisma db push or manually from prisma/create-tables.sql template
```

After enums are created, `prisma db push` should handle the table. If it fails, construct the `CREATE TABLE` manually following the existing pattern in `prisma/create-tables.sql`.

Run `prisma generate` after schema changes.

No data migration needed — this is a brand new table.

## API Routes

### Public (no auth)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | none | List approved events. Query params: `type` (PublicEventType), `startDate` (ISO date), `endDate` (ISO date), `zip` (for future radius filtering — store but don't filter yet). Orders by `startDate ASC`. Default: events from today forward. Returns id, title, type, location, city, state, startDate, endDate, gym {name, slug, logoUrl} (if gymId set). |
| GET | `/api/events/[id]` | none | Get single event. Returns full data if `status === 'approved'`. If `status === 'pending'`: return full data only if viewer is the submitter (auth required) or site_admin. Return 404 for rejected events to non-submitters. |

### Authenticated

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/events` | authenticated | Submit new event. Body: `{ title, type, description?, location?, address?, city, state, zip?, startDate, endDate?, gymId? }`. Creates event with `status: 'pending'`. Sends Notification to all site_admin users: "New event submitted: [title]" with link to `/site-admin/events`. Returns created event. |
| GET | `/api/events/my` | authenticated | List events submitted by the current user (all statuses). Used for "your submissions" view. |

### Site admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/site-admin/events` | site_admin | List events with optional `status` filter (default: `pending`). Returns full event data including submitter name/email. |
| PUT | `/api/site-admin/events/[id]` | site_admin | Approve or reject event. Body: `{ status: 'approved' \| 'rejected', rejectionNote?: string }`. Sets `approvedById` (even for rejections — records who acted). Sends Notification to the submitter: "Your event [title] has been approved/rejected." For rejection, include `rejectionNote` in the notification body. |

## UI Pages & Components

### `app/events/page.tsx` — Server Component (Public)

Public community calendar. No auth required.

Layout:
- Page heading: "Community Events" with subtitle "Open mats, competitions, and seminars in the jiu-jitsu community."
- Filter chips row: `All` | `Open Mat` | `Competition` | `Seminar` (client-side filter using query params, or use URL search params with server-side filtering)
- "Submit an Event" button (top right) — links to `/events/new` (auth required, middleware redirects to login if not authed)
- Event cards in chronological order

Event card display:
```
[Type badge]  [Date: Sat, Jun 14]
[Title in font-display text-lg font-bold]
[Location name · City, State]
[Gym badge if gymId set: small logo + gym name]
```

Card is a link to `/events/[id]`.

Empty state: "No upcoming events found. Be the first to submit one."

Implement pagination or infinite scroll if event volume grows — for now, limit to 50.

### `app/events/[id]/page.tsx` — Server Component (Public)

Full event detail page.

Display:
- Type badge (color-coded: open_mat=green, competition=red, seminar=blue, other=gray)
- Title (font-display, large)
- Date/time: formatted with day-of-week (e.g., "Saturday, June 14, 2026 · 10:00 AM – 2:00 PM")
- Location: venue name, full address (clickable → opens Google Maps URL)
- Description
- Gym section (if gymId): gym logo (if set), gym name, link to `/gyms/[slug]`
- Submitted by: "[Name] · Submitted [date]" (show name but not email)
- "Report this event" link (future feature — stubbed as mailto for now)

For pending events viewed by the submitter: show a yellow banner "This event is awaiting review. We'll notify you when it's approved."

### `app/events/new/page.tsx` — Client Component (Auth Required)

Event submission form.

Fields:
- Title (required)
- Type: radio buttons or dropdown — Open Mat / Competition / Seminar / Other
- Description (textarea, optional but encouraged)
- Location name (e.g., "Gracie Barra HQ")
- Address, City (required), State (required), Zip
- Start date + time (required) — use `<input type="datetime-local">`
- End date + time (optional)
- Gym affiliation: show `GymPicker` — "Is this event hosted by a gym on AscendIt? (optional)"

Validation:
- End date must be after start date if provided
- Start date must be in the future

After successful submit:
- Show success banner: "Your event has been submitted for review. We'll email you when it's approved."
- Show "Submit another event" link and "View your submissions" link

### `app/events/my/page.tsx` — Client Component (Auth Required)

"My Submissions" — list of events submitted by the user. Shows status badges (Pending / Approved / Rejected). For rejected events: shows rejection note.

### Middleware Update

Add to `authorized` callback:
```typescript
if (pathname === '/events' || pathname.startsWith('/events/')) return true
if (pathname.startsWith('/api/events') && req.method === 'GET') return true
```

Keep `/events/new` protected (requires login).

## Implementation Steps

1. **Add new enums and model to `prisma/schema.prisma`.** Run `prisma db push`. Fall back to manual SQL + table creation if needed. Run `prisma generate`.

2. **Add back-relations** to `User` and `Gym` models for `PublicEvent`.

3. **Build `POST /api/events`** — validate required fields (`title`, `type`, `city`, `state`, `startDate`). Parse `startDate` and `endDate` as `new Date()`. Reject if `startDate` is in the past (UTC). Create event. Notify site admins.

4. **Build `GET /api/events`** — Prisma query with `where: { status: 'approved', startDate: { gte: new Date() } }`. Apply type filter if `type` param provided. Include gym data. Order by `startDate ASC`. Limit 50.

5. **Build `GET /api/events/[id]`** — fetch event. Check status + auth for non-approved events.

6. **Build `GET /api/events/my`** — fetch all events by `session.user.id`, all statuses.

7. **Build site admin routes** `GET /api/site-admin/events` and `PUT /api/site-admin/events/[id]`. In the PUT handler: send a `Notification` to `event.submittedById`. Use `type: 'general'`.

8. **Update middleware** — add public event paths to the `authorized` callback.

9. **Build `app/events/page.tsx`** — server component. Fetch events via Prisma directly (no API call needed from server component). Add filter chip state as a client wrapper or use searchParams.

10. **Build `app/events/[id]/page.tsx`** — server component. Export `generateMetadata` for SEO.

11. **Build `app/events/new/page.tsx`** — client component with form. Include `GymPicker` for optional gym affiliation.

12. **Build `app/events/my/page.tsx`** — client component. Fetch from `GET /api/events/my`.

13. **Add "Submit Event" link to Header** for authenticated users.

14. **Smoke test:**
    - Submit event → pending → site admin approves → submitter gets notification → event appears on public calendar
    - Submit event → site admin rejects with note → submitter gets notification with note
    - Public (unauthenticated) user can browse `/events` and `/events/[id]`
    - Filter chips narrow results correctly

## Edge Cases & Gotchas

- **Time zones.** `startDate` and `endDate` are stored as UTC in CockroachDB. The submission form uses `datetime-local` which produces local time. Convert to UTC on the server before storing. On the detail page, display in the user's local time (use `toLocaleDateString` / `toLocaleTimeString` in a client component, not on the server). Alternatively, store a `timezone` string and display accordingly — for simplicity, just store UTC and display in UTC with a note "Times shown in UTC."

- **Past event filtering.** `GET /api/events` defaults to `startDate >= now`. But "today's" events should still show even if the start time has passed (same day). Consider filtering by `startDate >= startOfDay(now)` instead.

- **Gym affiliation on event submission.** The `gymId` field is optional and unverified — any user can claim any gym. In Phase 29 (site admin review), the admin sees the gym name and can reject if it looks spurious. No automatic verification is needed.

- **Duplicate event submissions.** No deduplication logic — rely on admin review to catch obvious duplicates. A future phase could add a "this looks like a duplicate" warning based on title + date + city matching.

- **Approved event editing.** Not handled in this phase. If the submitter wants to correct an approved event, they must contact a site admin. This is acceptable for MVP.

- **SEO for event pages.** `generateMetadata` on `app/events/[id]/page.tsx` should set title and description. Only approved events should be indexable — add `noindex` meta for pending/rejected events.

- **Notification spam to site admins.** If many events are submitted simultaneously, each triggers N notifications (one per site admin). This is fine for early platform. At scale, consider a digest or a dashboard counter instead of per-event notifications.
