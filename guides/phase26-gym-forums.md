# Phase 26 — Gym Forums

## Overview

Each gym can have one community forum. This phase builds the creation flow, access rules, and the "forum discovery" UX that occurs during onboarding when a user selects their gym.

Key behaviors:
- After gym selection (onboarding or gym profile), check if a gym_forum exists
- If yes: offer to join it
- If no: show existing-member count and offer to create it
- Creating a forum notifies all existing gym members
- Forum visibility: gym_forum posts are only visible to users with matching gymId
- When a gym upgrades to `participating`, the forum disclaimer is removed and it becomes the "official" gym forum

## Dependencies

- Phase 24: `Forum.gymId` field exists, `Gym` model exists
- Phase 25: `GymMembership` model, gym profile pages exist
- Existing forum infrastructure: `Forum`, `Post`, `ForumSubscription` models

## Schema Changes

### ForumType enum — add `gym_forum`

```prisma
enum ForumType {
  class_forum
  general
  announcement
  private_lesson
  instructor_only
  group_forum
  gym_forum      // new
}
```

No other model changes required (Forum.gymId was added in Phase 24).

## DB Migration Notes

Adding a value to `ForumType` requires either `prisma db push` or manual SQL.

```sql
-- Run in psql if db push fails
ALTER TYPE "ForumType" ADD VALUE IF NOT EXISTS 'gym_forum';
```

After the enum is updated, run `prisma generate` to regenerate the client.

No data migration needed — existing forums keep their current types.

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gyms/[id]/forum` | authenticated | Get the gym_forum for this gym (if exists). Returns forum id, title, post count, subscriber count, or `null` if none exists. Also returns `gymMemberCount` (number of active members with this gymId). |
| POST | `/api/gyms/[gymId]/forum` | authenticated, must be gym member | Create a gym_forum for this gym. Idempotent — returns existing forum if one already exists (with 200, not 409). On creation: creates Forum (type: gym_forum, gymId, title: "[Gym Name] Community"), creates ForumSubscription for creator, sends Notification to all users where gymId = this gymId (excluding creator). Returns created forum. |
| POST | `/api/forums/[id]/subscribe` | authenticated | Subscribe to any forum. Already exists — no changes needed unless it lacks gym_forum support. Verify it doesn't have type restrictions. |
| GET | `/api/forums` | authenticated | Updated: include gym forums where user.gymId matches Forum.gymId. |
| GET | `/api/forums/[id]` | authenticated | Updated: if forum.type === 'gym_forum', verify viewer.gymId === forum.gymId (or site_admin). Return 403 if not. |
| GET | `/api/forums/[id]/posts` | authenticated | Updated: same gym membership check as above. |
| POST | `/api/forums/[id]/posts` | authenticated | Updated: same gym membership check. |

## UI Pages & Components

### Forum List Page Update (`app/forums/page.tsx` or wherever forum list lives)

Add a "Gym Forum" section at the top (above general forums), visible only if user has a gymId:

```
── YOUR GYM ──────────────────────────────
[Gym Logo] [Gym Name] Community         >
  47 members · 12 posts this week
```

If no gym forum exists yet, show a subdued prompt:
```
No forum for [Gym Name] yet.
[Create one →]
```

If user has no gym: do not show this section.

### Gym Forum Discovery Modal / Inline Prompt (`app/components/GymForumPrompt.tsx`) — Client Component

This component is embedded in two places:
1. Onboarding wizard (after gym selection step)
2. Gym profile page (for logged-in members who haven't joined the forum)

Props:
```typescript
interface GymForumPromptProps {
  gymId: string
  gymName: string
  onDone: () => void
}
```

Behavior:
1. On mount: call `GET /api/gyms/[gymId]/forum`
2. **Forum exists:** Show "A community forum exists for [Gym Name]. Join it to connect with your training partners." + "Join Forum" button (calls `POST /api/forums/[forumId]/subscribe`) + "Skip" link
3. **No forum:** Show "X members from [Gym Name] are on AscendIt. Be the first to create a community forum for your gym." + "Create Forum" button (calls `POST /api/gyms/[gymId]/forum`) + "Skip" link
4. After joining or creating: show success message, then call `onDone()`

Styling: card style (`border border-smoke bg-paper p-6`), section header label at top ("GYM COMMUNITY"), primary button for main CTA, secondary button/link for skip.

### Gym Profile Page Update (`app/gyms/[slug]/page.tsx`)

Add a section below the gym info:

- If user is authenticated + is a gym member + forum exists: show "Community Forum" card with link to forum and post count
- If user is authenticated + is a gym member + no forum: show `GymForumPrompt` inline
- If user is not a member (or not authenticated): do not show forum section

### Forum Detail Page (`app/forums/[id]/page.tsx`)

Update access check: if `forum.type === 'gym_forum'` and user's `gymId !== forum.gymId`, show a "This forum is for members of [Gym Name]" message with a link to join the gym.

Add a badge near the forum title:
- If `gym.participatingStatus === 'free'`: show subdued label "Community forum — not officially managed by [Gym Name]"
- If `participatingStatus === 'participating'`: show green badge "Official [Gym Name] Forum"

### Onboarding Wizard Update

After the gym selection step resolves (user has a gymId), add a sub-step: render `GymForumPrompt`. This is a logical extension of the gym step, not a separate numbered step. After the user handles the forum prompt (joins, creates, or skips), proceed to the next onboarding step.

## Implementation Steps

1. **Add `gym_forum` to ForumType enum.** Run `prisma db push`. If it fails, run the manual SQL, then `prisma generate`.

2. **Update `GET /api/forums`** to include gym forums. In the Prisma query, add an `OR` condition:
   ```typescript
   const session = await getServerSession(authOptions)
   // existing forums query...
   // add:
   { type: 'gym_forum', gymId: session.user.gymId }
   ```
   If `session.user.gymId` is null, skip this clause.

3. **Update `GET /api/forums/[id]`** to enforce gym membership for `gym_forum` type:
   ```typescript
   if (forum.type === 'gym_forum') {
     if (!session?.user?.gymId || session.user.gymId !== forum.gymId) {
       if (!session?.user?.roles?.includes('site_admin')) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
       }
     }
   }
   ```

4. **Apply the same check to `GET /api/forums/[id]/posts` and `POST /api/forums/[id]/posts`.**

5. **Build `GET /api/gyms/[id]/forum`** — look up `Forum` where `gymId = id AND type = 'gym_forum'`. Return `null` if not found. Include `_count: { posts: true, subscriptions: true }`. Also query `GymMembership` count for `gymMemberCount`.

6. **Build `POST /api/gyms/[gymId]/forum`** — check caller is an active member of this gym (`GymMembership` where userId = session.user.id, gymId = gymId, status = 'active'). Check no forum exists (idempotent: return existing if found). Create `Forum { type: 'gym_forum', gymId, title: '[gym.name] Community' }`. Create `ForumSubscription` for caller. Query all users with `gymId = gymId` (excluding caller) and create `Notification` for each (`type: 'general'`, title: `'[gym.name] now has a community forum'`, link: `/forums/[forumId]`).

7. **Build `GymForumPrompt` component.** Handle both states (forum exists / no forum). Test loading state (show skeleton while fetching).

8. **Update forum list page.** Add gym forum section. Query the gym forum in the server component if `session.user.gymId` is set.

9. **Update gym profile page.** Add forum section for authenticated members.

10. **Update forum detail page.** Add the participating/free disclaimer badge.

11. **Update `PUT /api/site-admin/gyms/[id]`** (from Phase 25): when `participatingStatus` changes to `participating`, find the gym's `gym_forum` (if exists) and update a field to mark it as official. No schema change needed — the badge logic reads from `gym.participatingStatus` directly, not a forum field. Notify the gym's admin users that the forum is now official.

12. **Test all paths:**
    - User joins a gym with existing forum → sees join prompt → joins → sees forum in forum list
    - User joins a gym with no forum → sees create prompt → creates → all gym members receive notification → forum appears in their list
    - User not in gym tries to access gym forum URL directly → gets 403
    - Site admin can access any gym forum

## Edge Cases & Gotchas

- **Idempotent forum creation.** Two users at the same gym might both click "Create Forum" simultaneously. The check-then-create is not atomic. Mitigate by catching the unique constraint violation at the DB level (if you add `@@unique([gymId, type])` to Forum for the `gym_forum` case). Alternatively, add a unique partial index: `@@unique([gymId])` where `type = 'gym_forum'` — but CockroachDB partial unique indexes have limited support. Safest approach: wrap creation in a transaction and use `upsert` semantics.

- **Notification fan-out on forum creation.** If a gym has 500 members, creating a forum triggers 499 notifications. For free tier gyms this is fine initially. Once the platform scales, move notification fan-out to a background job. For now, create them synchronously but wrap in `Promise.all` to batch.

- **Forum gym disclaimer on tier upgrade.** The badge logic reads `gym.participatingStatus` in real time (server component or fresh API call). No caching issue if using server components. If the forum detail page caches aggressively, add `revalidatePath('/forums/[id]')` in the gym tier upgrade API handler.

- **`ForumSubscription` on gym forum.** Users who joined the gym after the forum was created are NOT auto-subscribed to the forum. The forum is visible to them (via the gym membership check), but they are not "subscribed" for notification purposes until they explicitly join. Consider auto-subscribing members when they join a gym if a gym forum already exists — add this to `PUT /api/gyms/[id]/membership`.

- **Multiple gym forums per gym.** The `POST /api/gyms/[gymId]/forum` handler must check that only one `gym_forum` per gymId exists. The idempotent return handles this for concurrent requests, but also add a server-side check before creation.

- **Site admin gymId.** Site admins may have `gymId = null` if they are unaffiliated. Ensure that site_admin bypass in forum access checks uses role check only, not gymId check.
