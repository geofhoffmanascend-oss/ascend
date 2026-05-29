# Phase 24 — Multi-Gym Architecture

## Overview

This is the foundational migration that transforms AscendIt from a single-gym app into a multi-gym platform. Every subsequent phase (25–32) depends on this work. The core changes are:

1. Introduce a `Gym` model as a first-class entity
2. Introduce `GymMembership` to associate users with gyms (many-to-many)
3. Add `gymId` FK to all content models (Class, Forum, MediaItem, Product, Order, GymSettings)
4. Introduce the `site_admin` role for platform-wide administration
5. Add belt verification fields to User
6. Migrate existing data to a single "Ascend BJJ Test Gym" so nothing breaks

Do NOT remove any existing data or schema fields in this phase. This is additive only, plus one data migration.

## Dependencies

- Phases 1–23 complete and deployed
- Access to the CockroachDB cluster via `psql` (needed for enum addition)
- `.env.local` with valid `DATABASE_URL`

## Schema Changes

### New enum additions

```prisma
enum GymTier {
  free
  participating
  inactive
}

enum MembershipStatus {
  active
  pending
}
```

Add `site_admin` to the existing `Role` enum:

```prisma
enum Role {
  admin
  instructor
  student
  vendor
  site_admin
}
```

### New model: Gym

```prisma
model Gym {
  id                  String    @id @default(cuid())
  name                String
  slug                String    @unique
  address             String?
  city                String?
  state               String?
  zip                 String?
  phone               String?
  website             String?
  logoUrl             String?
  headInstructorName  String?
  description         String?
  participatingStatus GymTier   @default(free)
  paymentTerms        Json?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  members     GymMembership[]
  classes     Class[]
  forums      Forum[]
  media       MediaItem[]
  products    Product[]
  orders      Order[]
  settings    GymSettings[]
}
```

### New model: GymMembership

```prisma
model GymMembership {
  id       String           @id @default(cuid())
  userId   String
  gymId    String
  status   MembershipStatus @default(active)
  joinedAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  gym  Gym  @relation(fields: [gymId], references: [id], onDelete: Cascade)

  @@unique([userId, gymId])
}
```

### Modified model: User

Add these fields to the `User` model:

```prisma
  gymId          String?   // home gym (nullable for unaffiliated users)
  beltVerified   Boolean   @default(false)
  beltVerifiedBy String?   // userId of the admin who verified

  gym            Gym?           @relation(fields: [gymId], references: [id], onDelete: SetNull)
  gymMemberships GymMembership[]
```

Add a `gym` relation back-reference on the `User` model (simple FK for "home gym" as a convenience field — the authoritative membership list is `GymMembership`).

### Modified model: Class

```prisma
  gymId  String?
  gym    Gym?    @relation(fields: [gymId], references: [id], onDelete: SetNull)
```

### Modified model: Forum

```prisma
  gymId  String?
  gym    Gym?    @relation(fields: [gymId], references: [id], onDelete: SetNull)
```

### Modified model: MediaItem

```prisma
  gymId  String?
  gym    Gym?    @relation(fields: [gymId], references: [id], onDelete: SetNull)
```

### Modified model: Product

```prisma
  gymId  String?
  gym    Gym?    @relation(fields: [gymId], references: [id], onDelete: SetNull)
```

### Modified model: Order

```prisma
  gymId  String?
  gym    Gym?    @relation(fields: [gymId], references: [id], onDelete: SetNull)
```

### Modified model: GymSettings

Replace the singleton model with a per-gym version:

```prisma
model GymSettings {
  id        String   @id @default(cuid())
  gymId     String   @unique
  gym       Gym      @relation(fields: [gymId], references: [id], onDelete: Cascade)
  reviewUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

The `@unique` on `gymId` preserves the one-settings-per-gym invariant.

## DB Migration Notes

### Why manual SQL may be required

CockroachDB does not support adding values to an existing enum via `prisma db push` when the cluster has a TLS region enum conflict. For any enum modification (`Role`, new enums), be prepared to fall back to manual `psql`.

### Step-by-step SQL for enum additions (run in psql if db push fails)

```sql
-- Add site_admin to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'site_admin';

-- Create GymTier enum
CREATE TYPE "GymTier" AS ENUM ('free', 'participating', 'inactive');

-- Create MembershipStatus enum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'pending');
```

### Table creation (if db push fails entirely)

Run `prisma db push` first. If it fails on the enum step, create the enums manually with the SQL above, then run `prisma db push` again. If it still fails, create the `Gym` and `GymMembership` tables manually referencing `prisma/create-tables.sql` as a template, then add the nullable FK columns to existing tables with separate `ALTER TABLE` statements:

```sql
-- Add gymId columns to existing tables (all nullable, no constraint violations)
ALTER TABLE "User"      ADD COLUMN IF NOT EXISTS "gymId"        STRING;
ALTER TABLE "User"      ADD COLUMN IF NOT EXISTS "beltVerified" BOOL NOT NULL DEFAULT false;
ALTER TABLE "User"      ADD COLUMN IF NOT EXISTS "beltVerifiedBy" STRING;
ALTER TABLE "Class"     ADD COLUMN IF NOT EXISTS "gymId"        STRING;
ALTER TABLE "Forum"     ADD COLUMN IF NOT EXISTS "gymId"        STRING;
ALTER TABLE "MediaItem" ADD COLUMN IF NOT EXISTS "gymId"        STRING;
ALTER TABLE "Product"   ADD COLUMN IF NOT EXISTS "gymId"        STRING;
ALTER TABLE "Order"     ADD COLUMN IF NOT EXISTS "gymId"        STRING;

-- GymSettings: add gymId column, backfill, then add unique constraint
ALTER TABLE "GymSettings" ADD COLUMN IF NOT EXISTS "gymId" STRING;
```

### Data migration script

After schema changes are live, run this one-time migration (can be a script at `scripts/migrate-to-multigym.ts`, run with `npx ts-node scripts/migrate-to-multigym.ts`):

```typescript
// scripts/migrate-to-multigym.ts
import { prisma } from '../lib/database'

async function main() {
  // 1. Create the seed gym
  const gym = await prisma.gym.upsert({
    where: { slug: 'ascend-bjj-test' },
    update: {},
    create: {
      name: 'Ascend BJJ Test Gym',
      slug: 'ascend-bjj-test',
      participatingStatus: 'participating',
    },
  })

  // 2. Set all existing users' gymId to this gym
  await prisma.user.updateMany({
    where: { gymId: null },
    data: { gymId: gym.id },
  })

  // 3. Create GymMembership records for all existing users
  const users = await prisma.user.findMany({ select: { id: true } })
  for (const user of users) {
    await prisma.gymMembership.upsert({
      where: { userId_gymId: { userId: user.id, gymId: gym.id } },
      update: {},
      create: { userId: user.id, gymId: gym.id, status: 'active' },
    })
  }

  // 4. Set gymId on all Classes
  await prisma.class.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })

  // 5. Set gymId on all Forums
  await prisma.forum.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })

  // 6. Set gymId on all MediaItems
  await prisma.mediaItem.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })

  // 7. Set gymId on all Products and Orders
  await prisma.product.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })
  await prisma.order.updateMany({ where: { gymId: null }, data: { gymId: gym.id } })

  // 8. Migrate existing GymSettings row
  const existingSettings = await prisma.gymSettings.findFirst()
  if (existingSettings && !existingSettings.gymId) {
    await prisma.gymSettings.update({
      where: { id: existingSettings.id },
      data: { gymId: gym.id },
    })
  }

  // 9. Grant site_admin to all existing admin users
  const admins = await prisma.user.findMany({
    where: { roles: { has: 'admin' } },
  })
  for (const admin of admins) {
    if (!admin.roles.includes('site_admin')) {
      await prisma.user.update({
        where: { id: admin.id },
        data: { roles: { push: 'site_admin' } },
      })
    }
  }

  console.log('Migration complete.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

Run with: `npx ts-node --project tsconfig.json scripts/migrate-to-multigym.ts`

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gyms` | public | List gyms (paginated). Query: `page`, `limit`. |
| GET | `/api/gyms/search` | public | Search gyms by name/instructor/city/state/zip. |
| GET | `/api/gyms/[id]` | public | Get a single gym by id or slug. |
| POST | `/api/gyms` | authenticated | Create new gym (free tier). |
| PUT | `/api/gyms/[id]/membership` | authenticated | Join a gym (creates GymMembership). |

Site admin gym management routes are covered in Phase 29.

## UI Pages & Components

| Path | Type | Purpose |
|------|------|---------|
| `app/components/GymPicker.tsx` | client component | Debounced gym search input with dropdown — introduced here, used in onboarding |
| `lib/roles.ts` | lib update | Add `isSiteAdmin` helper |
| `lib/siteAdminAuth.ts` | new lib | Mirror of `adminAuth.ts` — checks `site_admin` role |
| `middleware.ts` | update | Add `/site-admin/*` protection for `site_admin` role |
| `types/next-auth.d.ts` | update | Add `gymId: string \| null` to session user type |

No new pages are introduced in Phase 24 itself — pages come in later phases.

## Implementation Steps

1. **Add enum values.** Attempt `prisma db push`. If it fails on enum changes, run the manual SQL above in `psql`, then retry `db push`.

2. **Add new models to schema.** Add `Gym` and `GymMembership` to `prisma/schema.prisma` with the exact model blocks above.

3. **Add fields to existing models.** Add `gymId`, `beltVerified`, `beltVerifiedBy` to `User`; add `gymId` to `Class`, `Forum`, `MediaItem`, `Product`, `Order`; update `GymSettings` to be per-gym with `gymId`.

4. **Run `prisma db push`** (or manual SQL fallback). Confirm tables and columns exist.

5. **Generate Prisma client.** `npx prisma generate`

6. **Update `lib/roles.ts`.** Add `site_admin` to `AppRole` type and add `isSiteAdmin` function:
   ```typescript
   export type AppRole = 'admin' | 'instructor' | 'student' | 'vendor' | 'site_admin'

   export function isSiteAdmin(session: Session | null): boolean {
     return hasRole(session, 'site_admin')
   }
   ```

7. **Create `lib/siteAdminAuth.ts`:**
   ```typescript
   import { getServerSession } from 'next-auth'
   import { authOptions } from '@/app/api/auth/[...nextauth]/route'
   import { NextResponse } from 'next/server'

   export async function requireSiteAdmin() {
     const session = await getServerSession(authOptions)
     if (!session?.user?.id) {
       return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
     }
     if (!session.user.roles?.includes('site_admin')) {
       return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
     }
     return { error: null, session }
   }
   ```

8. **Update `types/next-auth.d.ts`.** Add `gymId: string | null` to the session user interface.

9. **Update NextAuth JWT callback** in `app/api/auth/[...nextauth]/route.ts`. In the `jwt` callback, when a user signs in, read `user.gymId` from the DB and set `token.gymId`. In the `session` callback, set `session.user.gymId = token.gymId`.

10. **Update middleware.** Add to the role-check block:
    ```typescript
    if (pathname.startsWith('/site-admin') && !roles.includes('site_admin')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    ```

11. **Build basic gym API routes.** Create `app/api/gyms/route.ts` (GET list, POST create), `app/api/gyms/search/route.ts` (GET search), `app/api/gyms/[id]/route.ts` (GET single), `app/api/gyms/[id]/membership/route.ts` (PUT join).

12. **Run data migration script** (only once, after schema is live on the database). Confirm in psql that `Gym`, `GymMembership` rows exist and user `gymId` fields are populated.

13. **Smoke test.** Log in as an existing admin user. Confirm session includes `gymId`. Confirm no existing features are broken.

## Edge Cases & Gotchas

- **CockroachDB enum values are permanent.** Once `site_admin` is added to `Role`, it cannot be removed without dropping and recreating the enum. Don't add it until you're sure of the spelling.

- **`prisma db push` enum order.** CockroachDB requires enum values to be added in a specific way. `IF NOT EXISTS` in the `ALTER TYPE` SQL prevents duplicate errors if re-run.

- **JWT does not auto-refresh.** After the data migration sets `gymId` on users, existing logged-in sessions will not have `gymId` in their JWT until they log out and back in. For development this is fine; in production, consider adding a fallback DB lookup in the session callback if `token.gymId` is undefined.

- **`User.gymId` vs `GymMembership`.** `User.gymId` is a convenience "home gym" field — it stores the user's primary gym. `GymMembership` is the authoritative membership list (supports multi-gym in the future). Keep them in sync: when a user joins their first gym, set both. When they join a second gym, add a `GymMembership` record but do not change `User.gymId` unless they explicitly set a new home gym.

- **`GymSettings` migration.** The existing singleton `GymSettings` row has no `gymId`. After running the migration script, add the `@unique` constraint on `gymId` only after all rows are backfilled. If `prisma db push` tries to add the constraint before backfill, it will fail. Handle this by running the migration script before adding the `@unique` annotation, then running `db push` a second time.

- **`paymentTerms` JSON shape.** No schema enforcement. Agreed shape for future phases: `{ membershipPct: number, merchPct: number, photoPct: number, flatMonthlyFee: number }`. Document this in the Gym admin UI.

- **Slug uniqueness.** Use a URL-safe slug (lowercase, hyphens only). Validate on the server with a regex: `/^[a-z0-9-]+$/`. The `@unique` constraint on `Gym.slug` handles DB-level enforcement, but return a clear 409 error on conflict.
