# Phase 31 — Gallery & Store Scoping

## Overview

As AscendIt becomes multi-gym, media (photos/videos) and store products need visibility controls:

- **Gallery:** each upload can be Public, Gym Only, Private, or Custom (specific users)
- **Store:** products can be gym-specific (visible to gym members only) or platform-wide

This phase also introduces a `MediaAccess` model for custom per-user visibility grants on media items.

Note: Phase 30 is not in this guide series. Phase numbering follows the TODO.md sequence.

## Dependencies

- Phase 24: `MediaItem.gymId`, `Product.gymId`, `Order.gymId` fields exist on models
- Phase 25: `GymMembership` model exists; `User.gymId` is set
- Existing gallery upload flow and store management pages

## Schema Changes

### New enum: MediaVisibility

```prisma
enum MediaVisibility {
  public
  gym_only
  private
  custom
}
```

### Modified model: MediaItem

Add `visibility` field:

```prisma
model MediaItem {
  id           String          @id @default(cuid())
  uploaderId   String
  uploader     User            @relation("UploaderMedia", fields: [uploaderId], references: [id], onDelete: Cascade)
  url          String
  publicId     String?
  thumbnailUrl String?
  type         MediaType
  caption      String?
  forSale      Boolean         @default(false)
  price        Int?
  gymId        String?         // from Phase 24
  visibility   MediaVisibility @default(public)  // new
  createdAt    DateTime        @default(now())

  tags         MediaTag[]
  hashtags     MediaHashtag[]
  gym          Gym?            @relation(fields: [gymId], references: [id], onDelete: SetNull)
  accessGrants MediaAccess[]   // new relation
}
```

### New model: MediaAccess

```prisma
model MediaAccess {
  id          String    @id @default(cuid())
  mediaItemId String
  userId      String
  createdAt   DateTime  @default(now())

  mediaItem   MediaItem @relation(fields: [mediaItemId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([mediaItemId, userId])
}
```

Add back-relation on `User`:
```prisma
  mediaAccessGrants  MediaAccess[]
```

### Store scoping

No new schema changes needed — `Product.gymId` already exists from Phase 24. The filtering logic is implemented in the API.

## DB Migration Notes

One new enum and one new column on MediaItem, plus the MediaAccess table.

```sql
-- New enum (run in psql if db push fails)
CREATE TYPE "MediaVisibility" AS ENUM ('public', 'gym_only', 'private', 'custom');

-- Add column to MediaItem (all existing items default to public)
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "visibility" "MediaVisibility" NOT NULL DEFAULT 'public';
```

After enum creation, `prisma db push` should handle the MediaAccess table creation and MediaItem column addition. If not, create the table manually.

Run `prisma generate` after all changes.

No data migration needed for visibility — existing items are public by default. No data migration needed for store scoping — existing products have `gymId = null` (platform-wide), which is the correct behavior.

## API Routes

### Gallery

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gallery` | authenticated | Updated: filter results based on visibility rules (see below). Existing behavior unchanged for `public` items. |
| GET | `/api/gallery/[id]` | authenticated | Updated: enforce visibility check on single item. Return 403 if viewer doesn't have access. |
| POST | `/api/gallery` | authenticated | Updated: accept `visibility` field in body. Accept `gymId` (defaults to uploader's `session.user.gymId` if `gym_only` selected). |
| PUT | `/api/gallery/[id]` | authenticated, uploader only | Updated: allow updating `visibility` and `gymId`. |
| PUT | `/api/gallery/[id]/access` | authenticated, uploader only | Set custom access list. Body: `{ userIds: string[] }`. Replaces existing MediaAccess records for this item with the new list. Returns updated access list. |
| GET | `/api/gallery/[id]/access` | authenticated, uploader only | Get current custom access list (array of users with id + name + avatarUrl). |

### Store

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/store/products` | authenticated | Updated: filter by gym. Returns platform-wide products (`gymId = null`) + products for user's gym (`gymId = session.user.gymId`). Site admin sees all. |
| POST | `/api/store/products` | admin | Updated: accept `gymId` field. If `gymId` set, verify caller is admin of that gym. |
| PUT | `/api/store/products/[id]` | admin | Updated: verify admin has rights to edit this product (must own the gym it belongs to, or be site_admin for platform-wide products). |

### Gym admin store

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/store/products` | admin | Existing route: update to return only products where `gymId = caller's gymId OR gymId = null` (legacy). Site admin sees all. |

## Visibility Rules (enforced server-side)

Implement this as a helper function in `lib/mediaAccess.ts`:

```typescript
// lib/mediaAccess.ts
import { prisma } from './database'

export async function canViewMedia(
  mediaItem: { visibility: string; uploaderId: string; gymId: string | null },
  viewerUserId: string | null,
  viewerGymId: string | null,
  viewerRoles: string[],
  mediaItemId: string
): Promise<boolean> {
  // Site admins see everything
  if (viewerRoles.includes('site_admin')) return true

  switch (mediaItem.visibility) {
    case 'public':
      return true

    case 'gym_only':
      if (!viewerUserId) return false
      if (!mediaItem.gymId) return false
      return viewerGymId === mediaItem.gymId

    case 'private':
      if (!viewerUserId) return false
      return viewerUserId === mediaItem.uploaderId

    case 'custom':
      if (!viewerUserId) return false
      // Uploader always has access
      if (viewerUserId === mediaItem.uploaderId) return true
      // Check MediaAccess table
      const grant = await prisma.mediaAccess.findUnique({
        where: { mediaItemId_userId: { mediaItemId, userId: viewerUserId } },
      })
      return grant !== null

    default:
      return false
  }
}
```

Apply this in both `GET /api/gallery` (as a filter) and `GET /api/gallery/[id]` (as a gate).

For `GET /api/gallery` (list), do not run the `canViewMedia` function per-item in a loop — it would be too slow for `custom` items (N+1 queries). Instead:

```typescript
// Efficient gallery query with visibility filtering
const items = await prisma.mediaItem.findMany({
  where: {
    OR: [
      { visibility: 'public' },
      { visibility: 'gym_only', gymId: session.user.gymId ?? undefined },
      { visibility: 'private', uploaderId: session.user.id },
      {
        visibility: 'custom',
        OR: [
          { uploaderId: session.user.id },
          { accessGrants: { some: { userId: session.user.id } } },
        ],
      },
    ],
  },
  // ...pagination, ordering
})
```

## UI Pages & Components

### Gallery Upload Form Update

When uploading, add a privacy selector section below the caption field:

**Label:** "WHO CAN SEE THIS?"

Four options as radio buttons or segmented control:
- `public` — "Everyone" (default)
- `gym_only` — "My Gym Only" (only shown if `session.user.gymId` is set; show gym name in parentheses)
- `private` — "Only Me"
- `custom` — "Specific People"

If `custom` is selected: show a user search field. Reuse the existing user search pattern from the DM flow (there should be a user search component — find and reuse it). Selected users appear as chips below the field with an × to remove.

Submit: include `visibility` and `userIds` (if custom) in the form body.

### Gallery Item Display Update

On the gallery page/grid, show a small privacy badge on each item (only visible to the uploader):
- `public`: no badge (default, no indicator needed)
- `gym_only`: gym icon (small building icon) in the corner
- `private`: lock icon in the corner
- `custom`: people icon in the corner

On the gallery item detail modal/page, show the privacy setting and (if custom) the list of users who have access. Include an "Edit access" link (for the uploader only).

### `app/gallery/[id]/access/page.tsx` — Client Component (Uploader Only)

Or implement as a modal on the gallery item page. Shows:
- Current visibility setting (editable)
- If custom: current access list as user cards with × to remove
- User search to add new people
- "Save" button — calls `PUT /api/gallery/[id]/access`

### Store Admin Page Update (`app/admin/store/page.tsx`)

No new UI needed, but behavior changes:
- Product list now only shows products where `gymId = session.user's gym` (or `gymId = null` for legacy/platform products)
- "Add Product" form: add a note "Products you add are visible only to members of your gym."
- For site admins: show all products grouped by gym

## Implementation Steps

1. **Add `MediaVisibility` enum to schema.** Run `prisma db push`. Fall back to manual SQL if needed.

2. **Add `visibility` field to `MediaItem`** (default `public`) and `MediaAccess` model. Run `prisma db push`. Run `prisma generate`.

3. **Create `lib/mediaAccess.ts`** with the `canViewMedia` helper.

4. **Update `GET /api/gallery`** — replace current query with the visibility-aware compound `OR` query above. Test that existing public items still appear.

5. **Update `GET /api/gallery/[id]`** — add `canViewMedia` check after fetching the item. Return 403 if fails.

6. **Update `POST /api/gallery`** (upload handler) — accept `visibility` field (default `public`). If `gym_only`, set `gymId = session.user.gymId`. If `custom`, after creating the MediaItem, create `MediaAccess` records for each userId in the request body.

7. **Build `PUT /api/gallery/[id]/access`** — verify session user is the uploader. Delete all existing `MediaAccess` for this `mediaItemId`. Create new `MediaAccess` for each userId in the request body. Return the new access list.

8. **Build `GET /api/gallery/[id]/access`** — verify session user is the uploader. Return `MediaAccess` records with user data.

9. **Update gallery upload form** — add privacy selector. Implement custom user search using the existing DM user search pattern (find that component in `app/components/`).

10. **Add privacy badges to gallery grid** — small icons visible only to the uploader.

11. **Build or update gallery item detail** — show privacy info and "Edit access" link for uploader.

12. **Update `GET /api/store/products`** — filter by `gymId = null OR gymId = session.user.gymId`. Site admin bypass.

13. **Update `POST /api/store/products`** and `PUT /api/store/products/[id]` — accept `gymId`, validate caller has rights.

14. **Update store admin page** — product list now gym-scoped.

15. **Smoke test:**
    - Upload photo as `private` → only uploader can see it in gallery
    - Upload photo as `gym_only` → member of same gym sees it, member of different gym does not
    - Upload photo as `custom` with User A → User A can see it, User B cannot
    - Uploader edits access: removes User A, adds User B → access updates correctly
    - Store: gym admin sees only their gym's products + platform-wide products
    - Site admin sees all products

## Edge Cases & Gotchas

- **N+1 query for custom access in gallery list.** The compound `OR` query using `accessGrants: { some: { userId } }` is a subquery — CockroachDB should handle it efficiently, but test with realistic data volumes. Add an index on `MediaAccess.userId` if queries are slow.

- **`gym_only` with no gymId.** If the uploader has `gymId = null` and somehow selects `gym_only`, the media item's `gymId` is null. In this case, no one can see it (the query filters `gymId: session.user.gymId ?? undefined` — if gymId is null, this becomes `gymId: undefined` which matches nothing). Prevent this in the upload form: only show `gym_only` option if `session.user.gymId` is set.

- **Changing visibility after upload.** When `PUT /api/gallery/[id]` changes visibility from `custom` to `public`, the `MediaAccess` records still exist but are unused. They are not harmful. When changing FROM anything TO `custom`, prompt the user to set the access list. Do not automatically clear access grants when switching away from `custom` — the user might switch back.

- **`PUT /api/gallery/[id]/access` — replacing the list.** Delete-then-insert is not atomic. If the connection drops between delete and insert, access grants are lost. Wrap in a Prisma transaction:
  ```typescript
  await prisma.$transaction([
    prisma.mediaAccess.deleteMany({ where: { mediaItemId: id } }),
    prisma.mediaAccess.createMany({ data: userIds.map(uid => ({ mediaItemId: id, userId: uid })) }),
  ])
  ```

- **Store product gymId enforcement.** A gym admin must not be able to create `gymId = null` (platform-wide) products — that is a site admin privilege. Validate: if caller has `admin` but not `site_admin`, require `gymId = session.user.gymId`. If caller has `site_admin`, allow any gymId including null.

- **Order gymId.** `Order.gymId` from Phase 24 should be set when an order is placed based on the products in the order. If an order contains products from multiple gyms (which shouldn't happen given the scoping), pick the first product's gymId or require single-gym carts. For now, set `Order.gymId = product.gymId` of the first item on order creation.

- **Legacy products with gymId = null.** Existing products have no gymId. These are treated as platform-wide and visible to all authenticated users. Gym admins can see them in their store admin but cannot edit them (only site admin can). Add a "(Platform Product)" label on these in the admin UI.
