# Phase 25 — Gym Registration

## Overview

This phase builds the user-facing gym discovery and registration flows. Users can search for their gym, join an existing gym, or register a new gym. Gym owners can self-register at the `free` tier. Site admins can upgrade a gym to `participating`.

Key interactions:
- Onboarding wizard gains a gym-selection step (using `GymPicker`)
- Gym registration form at `/gyms/register`
- Public gym profile pages at `/gyms/[slug]`
- Site admin can upgrade gym tier via API

## Dependencies

- Phase 24 complete: `Gym`, `GymMembership` models exist, `site_admin` role exists
- `GymPicker` component scaffolded (can be built in this phase)
- Onboarding wizard exists at `app/onboarding/OnboardingWizard.tsx`

## Schema Changes

No new models. Phase 24 added all required fields. Confirm the following exist:
- `Gym` model with `slug`, `participatingStatus`, `paymentTerms`
- `GymMembership` model with `status` (active|pending)
- `User.gymId`

If `paymentTerms Json?` was not added to `Gym` in Phase 24, add it now:

```prisma
model Gym {
  // ... existing fields ...
  paymentTerms  Json?
}
```

Run `prisma db push` if this field is missing.

## DB Migration Notes

No enum changes in this phase. A simple `prisma db push` is sufficient if only adding the `paymentTerms` column.

```sql
-- Manual fallback if db push fails
ALTER TABLE "Gym" ADD COLUMN IF NOT EXISTS "paymentTerms" JSONB;
```

## API Routes

### Public

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gyms/search` | none | Search gyms. Query: `q` (string, min 2 chars). Returns id, name, slug, headInstructorName, city, state, participatingStatus. Uses `ILIKE '%q%'` across name, headInstructorName, city, state, zip. Max 20 results. |
| GET | `/api/gyms/[id]` | none | Get gym by id or slug. Returns full public info + member count (count of active GymMembership records). |

### Authenticated

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/gyms` | authenticated | Create a new gym at `free` tier. Body: `{ name, address?, city?, state?, zip?, phone?, website?, headInstructorName?, description? }`. Validates slug uniqueness (auto-generated from name). Creates GymMembership for creator (active). Sends Notification to all site_admin users: "New gym registered: [name]". Returns created gym. |
| PUT | `/api/gyms/[id]/membership` | authenticated | Join an existing gym. Creates GymMembership. Status: `active` if gym.participatingStatus === 'free'; `pending` if 'participating'. Returns `{ status: 'active' \| 'pending' }`. 409 if membership already exists. |
| DELETE | `/api/gyms/[id]/membership` | authenticated | Leave a gym (deletes GymMembership). Cannot leave if it is the user's only gym. |

### Site admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/api/site-admin/gyms/[id]` | site_admin | Update gym: name, participatingStatus, paymentTerms, headInstructorName, description, logoUrl. On tier change to `participating`: sends Notification to gym's admin users ("Your gym has been upgraded to Participating"). |

### Gym admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gyms/[id]/members` | admin or gym member | List gym members. Admin sees all; regular member sees only active members. Returns user id, name, belt, roles. |
| PUT | `/api/gyms/[id]/members/[userId]` | admin | Approve or deny a pending GymMembership. Body: `{ status: 'active' \| 'rejected' }`. |

## UI Pages & Components

### `app/components/GymPicker.tsx` — Client Component

Debounced gym search input. Props:
```typescript
interface GymPickerProps {
  value?: { id: string; name: string } | null
  onChange: (gym: { id: string; name: string } | null) => void
  onCreateNew?: (name: string) => void  // called when user clicks "Add my gym"
}
```

Behavior:
- Text input with placeholder "Search for your gym..."
- On input change: debounce 300ms, call `GET /api/gyms/search?q=value`
- Show dropdown list under input: each item shows `name`, `headInstructorName` (if present), `city + state`, participating badge (green dot) or free tier label
- Clicking an item: calls `onChange(gym)`, collapses dropdown
- If search returns 0 results: show "No results — Add my gym" option at bottom
- If user clicks "Add my gym": calls `onCreateNew(inputValue)` so parent can open the registration form pre-filled with the typed name
- Close dropdown on outside click (use `useEffect` + `mousedown` listener)
- Accessible: `role="listbox"` on dropdown, `role="option"` on items

Styling: input uses standard input token (`border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red`). Dropdown: `absolute z-50 w-full bg-paper border border-smoke shadow-md mt-1 max-h-60 overflow-y-auto`.

### `app/gyms/[slug]/page.tsx` — Server Component (Public)

Public gym profile page. Fetch gym by slug via Prisma (not API call — server component can query directly).

Display:
- Gym name (`font-display text-2xl font-bold`) with participating badge if tier === 'participating'
- Logo if `logoUrl` is set (next/image, 80x80, rounded)
- Head instructor name (label: "HEAD INSTRUCTOR")
- Address: city, state, zip
- Phone and website link (if present)
- Description (if present)
- Member count: "X members on AscendIt"
- If authenticated and not already a member: "Join this gym" button → calls `PUT /api/gyms/[id]/membership`
- If authenticated and already a member: "You're a member" badge (no action)
- If gym has a gym_forum (see Phase 26): link to forum (authenticated only)

Metadata: `export async function generateMetadata` — set title to gym name.

Route param: `const { slug } = await params`

### `app/gyms/register/page.tsx` — Client Component (Auth Required)

Free-tier gym self-registration form. Shown after a user's gym search finds no match and they click "Add my gym."

Fields:
- Gym name (required, pre-filled from search if coming from GymPicker redirect)
- Head instructor name
- Address (street)
- City, State, Zip (inline, 3 columns)
- Phone
- Website URL
- Description (textarea)

On submit:
1. POST to `/api/gyms`
2. On success: show confirmation message "Your gym has been registered. A platform admin will review it shortly." + count of existing members with that gymId ("X members are already using AscendIt from your gym"). Then redirect to `/gyms/[slug]`.

Show a note below the form: "Registering your gym is free. Once approved, you can upgrade to a Participating gym to unlock class management, scheduling, and more."

### Onboarding Wizard Update (`app/onboarding/OnboardingWizard.tsx`)

Add a new step (insert as step 2, after profile basics, before belt info): **"Your Gym"**

Step content:
- Heading: "Which gym do you train at?"
- `GymPicker` component
- If user selects a gym: show gym name + city/state confirmation, "Continue" button enabled
- If user clicks "Add my gym": redirect to `/gyms/register?returnTo=onboarding`
- Skip option: "I train independently" — sets gymId to null, continues
- On "Continue": call `PUT /api/gyms/[id]/membership` (if gym selected), update user's gymId via `PATCH /api/user/profile`

Note: if user came from `/gyms/register?returnTo=onboarding` and just registered a gym, auto-select that gym in the picker and pre-confirm.

### Registration Page Update (`app/register/page.tsx`)

Optionally include gym selection after email/password fields. This can be minimal — just the `GymPicker` component with a "Skip" option. Keep it optional; the onboarding wizard handles this in more detail.

## Implementation Steps

1. **Confirm Phase 24 schema is live.** Check that `Gym` and `GymMembership` tables exist and `User.gymId` column is present.

2. **Build `GET /api/gyms/search`** — public route. Use Prisma `findMany` with `OR` conditions using `contains` + `mode: 'insensitive'`. Fields to search: `name`, `headInstructorName`, `city`, `state`, `zip`. Return max 20 results. Include `participatingStatus` in response.

3. **Build `GET /api/gyms/[id]`** — public route. Accept either `id` or `slug` (try id first, fallback to slug lookup). Include `_count: { members: true }` in Prisma query to get member count. Filter member count to `status: 'active'` only.

4. **Build `POST /api/gyms`** — authenticated route. Generate slug from name: lowercase, replace spaces/special chars with hyphens, strip non-alphanumeric (except hyphens). Check slug uniqueness; append `-2`, `-3`, etc. if taken. Create Gym record, create GymMembership for the session user (active), update `User.gymId` if user has no gym yet. Send Notification to all `site_admin` users.

5. **Build `PUT /api/gyms/[id]/membership`** — authenticated. Look up gym. If `participatingStatus === 'free'`, create membership with `status: 'active'`. If `participating`, create with `status: 'pending'`. Update `User.gymId` if null. Return 409 with `{ alreadyMember: true }` if membership exists.

6. **Build `PUT /api/site-admin/gyms/[id]`** — use `requireSiteAdmin()` from `lib/siteAdminAuth.ts`. Accept partial update of gym fields. Handle tier upgrade notifications.

7. **Build gym members API routes.** `GET /api/gyms/[id]/members` and `PUT /api/gyms/[id]/members/[userId]`.

8. **Build `GymPicker` component.** Test debounce behavior. Ensure dropdown closes on outside click.

9. **Build `app/gyms/register/page.tsx`.** Wire to `POST /api/gyms`. Handle `?returnTo=onboarding` query param for redirect after success.

10. **Build `app/gyms/[slug]/page.tsx`.** Make it a server component that queries Prisma directly. Add join button as a client sub-component (needs session).

11. **Update onboarding wizard.** Add gym step. Test full onboarding flow with gym selection, gym creation, and skip path.

12. **Update middleware** to keep `/gyms/*` accessible without auth (public gym profiles) while requiring auth for `/gyms/register`. Add to the `authorized` callback:
    ```typescript
    if (pathname.startsWith('/gyms/') && !pathname.startsWith('/gyms/register')) return true
    ```

13. **Smoke test all paths:**
    - New user registers → onboarding → selects gym (participating) → membership is pending
    - New user registers → onboarding → selects gym (free) → membership is active
    - New user registers → onboarding → no gym found → creates gym → gym registered
    - Public gym profile loads without auth
    - Site admin upgrades gym tier → gym admin receives notification

## Edge Cases & Gotchas

- **Slug collisions.** Two gyms named "Lions BJJ" both try to register. The second gets `lions-bjj-2`. Implement the suffix logic in the `POST /api/gyms` handler — loop and check until a free slug is found.

- **Joining a gym the user already has a membership for.** Return 409 with a descriptive message. Do not create duplicate `GymMembership` rows — the `@@unique([userId, gymId])` constraint will catch this at the DB level, but return a friendly error before hitting it.

- **Free tier vs participating membership approval.** Free tier gyms have no admin to approve memberships, so status is `active` immediately. Participating gyms have a gym admin who must approve. Do not assume the gym admin will be watching — notify them via the Notification system when a pending membership is created.

- **`User.gymId` and GymMembership sync.** `User.gymId` is the "home gym" shortcut. It should always point to a gym the user has an `active` GymMembership for. If a membership is rejected, also clear `User.gymId` if it pointed to that gym. Handle this in `PUT /api/gyms/[id]/members/[userId]` when rejecting.

- **Participating badge definition.** Only `participatingStatus === 'participating'` gyms show the badge. `free` gyms are listed without any special badge. `inactive` gyms should not appear in search results (filter them out in `GET /api/gyms/search`).

- **`?returnTo=onboarding` redirect.** After gym registration, if this param is present, redirect to `/onboarding` (not `/gyms/[slug]`). The onboarding wizard should detect the newly created gym and auto-select it.

- **Notification to site admins on gym creation.** Query `prisma.user.findMany({ where: { roles: { has: 'site_admin' } } })` and create a `Notification` record for each. Use `type: 'general'`, link to `/site-admin/gyms/[id]`.
