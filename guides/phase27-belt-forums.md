# Phase 27 — Belt Forums

## Overview

Five permanent platform-wide forums, one per belt level (White, Blue, Purple, Brown, Black). These are community spaces for practitioners at each level to discuss techniques, share experiences, and connect across gyms.

Access rules:
- **Read:** any authenticated user can read any belt forum
- **Post:** users can only post in forums at or below their own belt level (white posts anywhere; black posts in black only... wait — inverted: white can post in white; black can post in all five)
- **Belt display:** posts in belt forums show the author's belt with a verified/unverified indicator

Site admin initializes the five forums via a one-time API call. Site admin can delete any post in belt forums.

## Dependencies

- Phase 24: `beltVerified`, `beltVerifiedBy` fields on User exist
- Phase 24: `lib/siteAdminAuth.ts` exists
- Existing forum/post infrastructure
- Belt verification in admin user detail (Phase 24 schema is enough; the UI button is built here)

## Schema Changes

### ForumType enum — add `belt_forum`

```prisma
enum ForumType {
  class_forum
  general
  announcement
  private_lesson
  instructor_only
  group_forum
  gym_forum    // from Phase 26
  belt_forum   // new
}
```

### Forum model — add `beltLevel`

```prisma
model Forum {
  id          String      @id @default(cuid())
  type        ForumType
  classId     String?     @unique
  classGroup  ClassGroup?
  gymId       String?     // from Phase 24
  beltLevel   Belt?       // new — only set for belt_forum type
  title       String
  description String?
  createdAt   DateTime    @default(now())

  class         Class?              @relation(fields: [classId], references: [id], onDelete: Cascade)
  gym           Gym?                @relation(fields: [gymId], references: [id], onDelete: SetNull)
  posts         Post[]
  subscriptions ForumSubscription[]
}
```

## DB Migration Notes

Two changes:
1. Add `belt_forum` to `ForumType` enum
2. Add `beltLevel Belt?` column to `Forum`

```sql
-- Step 1: Add enum value (if prisma db push fails)
ALTER TYPE "ForumType" ADD VALUE IF NOT EXISTS 'belt_forum';

-- Step 2: Add column (if prisma db push fails)
ALTER TABLE "Forum" ADD COLUMN IF NOT EXISTS "beltLevel" "Belt";
```

After manual SQL, run `prisma generate`.

No data migration needed — existing forums have `beltLevel = NULL`.

## API Routes

### Site admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/site-admin/belt-forums/init` | site_admin | Idempotent. Creates the 5 belt forums if they don't exist. Returns array of forum objects. Safe to run multiple times. |
| DELETE | `/api/site-admin/forums/posts/[id]` | site_admin | Delete any post in any belt forum. Returns 404 if post doesn't exist, 403 if forum is not a belt_forum (site admin should use regular moderation tools for other forum types). |

### Gym admin (belt verification)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/admin/users/[id]/verify-belt` | admin | Verify a user's belt. Sets `beltVerified = true`, `beltVerifiedBy = session.user.id`. Returns updated user. |
| DELETE | `/api/admin/users/[id]/verify-belt` | admin | Revoke belt verification. Sets `beltVerified = false`, `beltVerifiedBy = null`. |

### Forums (updates to existing routes)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/forums/[id]/posts` | authenticated | Updated: if forum.type === 'belt_forum', check that user's belt level >= forum.beltLevel (using belt hierarchy). Return 403 with `{ error: 'Your belt level does not allow posting in this forum' }` if check fails. |
| GET | `/api/forums` | authenticated | Updated: include all 5 belt forums in response (readable by all). Mark each with `canPost: boolean` based on user's belt. |

## Belt Hierarchy

Define in a shared utility (add to `lib/roles.ts` or a new `lib/belt.ts`):

```typescript
// lib/belt.ts
export const BELT_ORDER: Record<string, number> = {
  white: 0,
  blue: 1,
  purple: 2,
  brown: 3,
  black: 4,
  coral: 4,  // treated as black for forum purposes
  red: 4,    // treated as black for forum purposes
}

export function canPostInBeltForum(userBelt: string, forumBelt: string): boolean {
  return (BELT_ORDER[userBelt] ?? 0) >= (BELT_ORDER[forumBelt] ?? 0)
}
```

Posting in the White forum requires belt >= white (everyone).
Posting in the Black forum requires belt >= black (only black, coral, red).

## UI Pages & Components

### Forum List Page Update

Add a "Belt Forums" section. Recommended placement: below general forums, above gym forums.

```
── BELT FORUMS ───────────────────────────
⬜ White Belt           Read · Post    >
🔵 Blue Belt            Read · Post    >
🟣 Purple Belt          Read · 🔒 Post >
🟤 Brown Belt           Read · 🔒 Post >
⬛ Black Belt           Read · 🔒 Post >
```

- User's current belt row is highlighted (e.g., slightly bolder or with an indicator arrow)
- Forums above the user's belt: show lock icon on "Post" — clicking it shows tooltip "You can read this forum, but posting is restricted to [belt] belts and above"
- Read access always shown (no lock)
- Clicking any forum row navigates to the forum detail page

Belt color swatches (use Tailwind custom classes or inline styles):
- White: `bg-white border border-smoke`
- Blue: `bg-blue-600`
- Purple: `bg-purple-600`
- Brown: `bg-amber-800`
- Black: `bg-ink`

### Forum Detail Page Update (`app/forums/[id]/page.tsx`)

For `belt_forum` type forums:
- Show belt level heading badge: large belt-colored swatch + "Blue Belt Forum" etc.
- If user cannot post (belt too low): show banner "You can read this forum, but you need to reach [belt] to post." Hide the post compose box or disable the Post button.
- If user can post: show compose box as normal.

### Post Display in Belt Forums

In post cards within belt forums, show the author's belt badge next to their name:
- Belt swatch (small colored circle) + belt name
- If `beltVerified = false`: show "(Unverified)" in `text-ash` italic after the belt name, with a tooltip: "Self-reported — not verified by a gym"
- If `beltVerified = true`: show a small checkmark icon + "Verified by [gym name of beltVerifiedBy]" on hover (fetch beltVerifiedBy user's gym name if needed, or just show "Verified")

### Admin User Detail Page Update (`app/admin/users/[id]/page.tsx`)

Add a "Belt Verification" section:
- Current belt displayed (same as before)
- If `beltVerified = false`: "Verify Belt" button → calls `PUT /api/admin/users/[id]/verify-belt`. Button style: secondary button. Confirmation: "Are you sure you want to verify [Name]'s [belt] belt?" (inline confirm pattern, not a modal).
- If `beltVerified = true`: green "Verified" badge + verifier name (fetched by `beltVerifiedBy` userId). "Revoke Verification" button → calls `DELETE /api/admin/users/[id]/verify-belt`.

### Site Admin Belt Forum Moderation (`app/site-admin/forums/page.tsx`)

Covered in Phase 29, but the API route is built here. The page lists recent posts across all belt forums with delete buttons.

## Implementation Steps

1. **Add `belt_forum` to `ForumType` enum and `beltLevel Belt?` to `Forum`.** Run `prisma db push`. Fall back to manual SQL if needed. Run `prisma generate`.

2. **Create `lib/belt.ts`** with `BELT_ORDER` map and `canPostInBeltForum` helper.

3. **Build `POST /api/site-admin/belt-forums/init`** — use `requireSiteAdmin()`. For each belt in `['white', 'blue', 'purple', 'brown', 'black']`, upsert a Forum:
   ```typescript
   await prisma.forum.upsert({
     where: { /* no unique field for this — use findFirst then create */ },
     // Use findFirst + conditional create pattern
   })
   ```
   Since Forum has no unique index for `type + beltLevel`, use `findFirst({ where: { type: 'belt_forum', beltLevel: belt } })` and create only if null. Return array of all 5 forums.

4. **Call `POST /api/site-admin/belt-forums/init`** once via curl or admin UI after deploy:
   ```bash
   curl -X POST https://your-domain/api/site-admin/belt-forums/init \
     -H "Cookie: next-auth.session-token=..." 
   ```
   Or add an "Initialize Belt Forums" button on the site admin dashboard.

5. **Update `POST /api/forums/[id]/posts`** — add belt check. Look up the forum, check `type === 'belt_forum'`, then call `canPostInBeltForum(session.user.belt, forum.beltLevel)`.

6. **Update `GET /api/forums`** — include all `belt_forum` forums in the response. Add `canPost: boolean` field to each belt forum in the response (computed from user's belt).

7. **Build `PUT /api/admin/users/[id]/verify-belt`** — use `requireAdmin()`. Update `beltVerified = true`, `beltVerifiedBy = session.user.id`.

8. **Build `DELETE /api/admin/users/[id]/verify-belt`** — use `requireAdmin()`. Update `beltVerified = false`, `beltVerifiedBy = null`.

9. **Build `DELETE /api/site-admin/forums/posts/[id]`** — use `requireSiteAdmin()`. Look up post, confirm its forum is `type: 'belt_forum'`, then delete. Return 403 if forum is not a belt forum (site admin has no special power over gym/class forums here).

10. **Update forum list page** — add Belt Forums section with lock icon logic.

11. **Update forum detail page** — add belt badge, posting restriction banner, and belt display on posts.

12. **Update admin user detail page** — add belt verification UI.

13. **Smoke test:**
    - White belt user: can read all 5 forums, can post only in white forum
    - Blue belt user: can post in white and blue, cannot post in purple/brown/black
    - Black belt user: can post in all 5
    - Site admin deletes a post from belt forum — post is gone
    - Admin verifies a user's belt — post shows "Verified" badge
    - Init endpoint is idempotent (run twice, still 5 forums)

## Edge Cases & Gotchas

- **Belt forum init idempotency.** `findFirst` + conditional create is not perfectly atomic — two concurrent requests to `/init` could both see no forum and both try to create. For a one-time admin operation this is acceptable. If needed, add a `@@unique([type, beltLevel])` constraint to `Forum` (only valid when both fields are non-null, but CockroachDB doesn't support partial unique indexes). Alternative: use a DB-level upsert with a fallback unique field. Since this is a one-time admin action, the simple pattern is fine.

- **Coral and red belts.** These are senior ranks above black. Treat them as `black` in `BELT_ORDER` so they can post in all forums. They do not need their own forum.

- **`session.user.belt` in JWT.** Confirm the NextAuth `jwt` callback includes `belt` in the token. If not, add it in Phase 24's JWT update. The belt value must be current — if an admin promotes a user's belt, the user needs to log out and back in for the JWT to reflect the change, unless you add a DB lookup in the session callback for belt (slight performance cost).

- **Belt verification and forum posting.** Belt verification is informational — it does NOT gate forum posting. A white belt user who is actually a blue belt (mis-entered) could post in white forums. That is acceptable — this is honor-system community content, not a security boundary.

- **The 5 belt forums are global (no gymId).** They appear in every user's forum list. They are not scoped to any gym. The `gymId` field on Forum is `null` for belt forums.

- **Deleting a user who is `beltVerifiedBy` for others.** If the verifier's account is deleted, `beltVerifiedBy` becomes a dangling foreign key reference (it's a `String?`, not a FK). Add a cleanup in the user deletion handler, or simply tolerate dangling references since the field is informational.
