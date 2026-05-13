# Phase 16 — Multi-Role System + Instructor Workflow

## Overview
- `roles Role[]` replaces single `role Role` on User
- New `vendor` role + `VendorType` enum (placeholder dashboard)
- Instructor = student + instructor access (additive)
- Vendor = student + vendor access (additive)
- Anonymous feedback → admin only (filter from instructor view)
- Instructor-only forum (auto-subscribed on role assignment)
- Per-session notes on ClassSession (private/public toggle)
- ClassSubRequest model for class release/substitution

## Schema migration (TWO pushes required)

### Push 1 — add new fields alongside old `role`
- Add `roles Role[] @default([student])` to User
- Add `vendorType VendorType?` to User
- Add `vendor` to Role enum
- Add `VendorType` enum
- Add `instructor_only` to ForumType enum
- Add `sessionNotes String?`, `notesPublic Boolean @default(false)` to ClassSession
- Add `ClassSubRequest` model + `SubStatus` enum

### Migration SQL (run after Push 1)
```sql
UPDATE "User" SET roles = ARRAY['student'::"Role"] WHERE role = 'student';
UPDATE "User" SET roles = ARRAY['instructor'::"Role", 'student'::"Role"] WHERE role = 'instructor';
UPDATE "User" SET roles = ARRAY['admin'::"Role", 'student'::"Role"] WHERE role = 'admin';
```

### Push 2 — remove old `role` field
Drop `role Role` from User model, push again.

## Code changes
1. `lib/roles.ts` — helper: `hasRole(roles, role)`
2. `types/next-auth.d.ts` — `role` → `roles: string[]`
3. `app/api/auth/[...nextauth]/route.ts` — session callback
4. `middleware.ts` — role checks
5. All files with `session.user.role` checks (~50 spots)
6. `app/instructor/feedback/page.tsx` — filter `anonymous: false`
7. `app/feedback/` — add anonymous routing note to UI
8. Admin role assignment API — auto-subscribe to instructor forum

## New UI (Phase 16B — next session)
- Instructor schedule view with registered/checked-in counts
- Per-session notes editor with public toggle
- Class release/sub request flow
- Instructor-initiated private lessons (1–4 students)
- Vendor dashboard placeholder
- Instructor-only forum page
