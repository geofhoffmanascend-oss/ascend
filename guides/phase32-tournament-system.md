# Phase 32 — Tournament System

## Overview

A gym-managed tournament system for internal competitions. Participating-tier gyms can create and run tournaments with bracket management. Students register for divisions, gym admins approve registrations and generate brackets, and match results are entered in real time.

Tournaments with public visibility can be submitted as public events (Phase 28), driving external discovery.

This is the most complex feature in the multi-gym series. Build incrementally — start with tournament creation and registration, then add bracket generation and match tracking.

## Dependencies

- Phase 24: `Gym` model, `site_admin` role
- Phase 25: `GymMembership` model — only participating gyms can create tournaments
- Phase 28: `PublicEvent` model — for optional auto-submission of public tournaments
- Phase 29: Site admin — for visibility into tournaments across the platform (optional, can defer)
- Existing `Belt` enum, user belt data

## Schema Changes

### New enums

```prisma
enum TournamentFormat {
  round_robin
  single_elim
  double_elim
}

enum TournamentStatus {
  draft
  registration_open
  in_progress
  complete
}

enum TournamentVisibility {
  public
  gym_only
}
```

### New model: Tournament

```prisma
model Tournament {
  id                   String               @id @default(cuid())
  gymId                String
  name                 String
  description          String?
  date                 DateTime
  registrationDeadline DateTime?
  format               TournamentFormat     @default(single_elim)
  status               TournamentStatus     @default(draft)
  visibility           TournamentVisibility @default(gym_only)
  createdById          String
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt

  gym          Gym                    @relation(fields: [gymId], references: [id], onDelete: Cascade)
  createdBy    User                   @relation("TournamentCreator", fields: [createdById], references: [id])
  divisions    TournamentDivision[]
  registrations TournamentRegistration[]
}
```

### New model: TournamentDivision

```prisma
model TournamentDivision {
  id               String   @id @default(cuid())
  tournamentId     String
  name             String
  beltMin          Belt
  beltMax          Belt
  weightClassLabel String?
  maxParticipants  Int?
  createdAt        DateTime @default(now())

  tournament    Tournament              @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  registrations TournamentRegistration[]
  brackets      TournamentBracket[]
}
```

### New model: TournamentRegistration

```prisma
model TournamentRegistration {
  id           String   @id @default(cuid())
  tournamentId String
  divisionId   String
  userId       String
  approved     Boolean  @default(false)
  createdAt    DateTime @default(now())

  tournament Tournament         @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  division   TournamentDivision @relation(fields: [divisionId], references: [id], onDelete: Cascade)
  user       User               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tournamentId, divisionId, userId])
}
```

### New model: TournamentBracket

```prisma
model TournamentBracket {
  id          String   @id @default(cuid())
  divisionId  String   @unique
  bracketData Json
  generatedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt

  division TournamentDivision @relation(fields: [divisionId], references: [id], onDelete: Cascade)
  matches  TournamentMatch[]
}
```

### New model: TournamentMatch

```prisma
model TournamentMatch {
  id             String    @id @default(cuid())
  bracketId      String
  roundNumber    Int
  matchNumber    Int
  participant1Id String?
  participant2Id String?
  winnerId       String?
  result         String?
  completedAt    DateTime?
  createdAt      DateTime  @default(now())

  bracket TournamentBracket @relation(fields: [bracketId], references: [id], onDelete: Cascade)

  @@unique([bracketId, roundNumber, matchNumber])
}
```

Add back-relations to `User` and `Gym`:

On `User`:
```prisma
  tournamentsCreated     Tournament[]             @relation("TournamentCreator")
  tournamentRegistrations TournamentRegistration[]
```

On `Gym`:
```prisma
  tournaments Tournament[]
```

## DB Migration Notes

Five new models, three new enums. This is the largest single migration in the series.

```sql
-- Create enums (run in psql if prisma db push fails)
CREATE TYPE "TournamentFormat"    AS ENUM ('round_robin', 'single_elim', 'double_elim');
CREATE TYPE "TournamentStatus"    AS ENUM ('draft', 'registration_open', 'in_progress', 'complete');
CREATE TYPE "TournamentVisibility" AS ENUM ('public', 'gym_only');
```

After creating enums manually, run `prisma db push` to create the tables. If that fails, create tables manually from the schema above following the `prisma/create-tables.sql` template.

Run `prisma generate` after all changes.

No data migration needed — all tables are new.

## API Routes

### Gym admin (participating gyms only)

All gym admin tournament routes verify: `requireAdmin()` + `gym.participatingStatus === 'participating'`. Return 403 for free-tier gyms.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/tournaments` | admin, participating gym | Create tournament. Body: `{ name, description?, date, registrationDeadline?, format, visibility, gymId }`. Creates with `status: 'draft'`. |
| PUT | `/api/tournaments/[id]` | admin, owns tournament's gym | Edit tournament. Accepts: name, description, date, registrationDeadline, format, visibility, status. Validate status transitions (draft→registration_open→in_progress→complete — no going back). |
| POST | `/api/tournaments/[id]/divisions` | admin, owns tournament's gym | Add division. Body: `{ name, beltMin, beltMax, weightClassLabel?, maxParticipants? }`. |
| PUT | `/api/tournaments/[id]/divisions/[divisionId]` | admin | Edit division. Only allowed when tournament.status = 'draft'. |
| DELETE | `/api/tournaments/[id]/divisions/[divisionId]` | admin | Delete division. Only when status = 'draft' and no registrations. |
| GET | `/api/tournaments/[id]/registrations` | admin, owns tournament's gym | List all registrations with user info (name, belt, beltVerified). Filterable by divisionId. |
| PUT | `/api/tournaments/[id]/registrations/[regId]` | admin | Approve or reject registration. Body: `{ approved: boolean }`. |
| POST | `/api/tournaments/[id]/brackets/generate` | admin | Generate brackets from approved registrations for all divisions. Requires `status = 'in_progress'`. Creates/replaces TournamentBracket per division, creates TournamentMatch records. Returns brackets. |
| PUT | `/api/tournaments/[id]/matches/[matchId]` | admin | Enter match result. Body: `{ winnerId: string, result?: string }`. Sets `completedAt = now()`, updates bracket JSON to reflect progression. |

### Student

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tournaments` | authenticated | List upcoming tournaments. Public visibility tournaments are shown to all. Gym-only tournaments shown only to members of that gym. Query: `status` (default: registration_open + in_progress). |
| GET | `/api/tournaments/[id]` | authenticated | Get tournament detail. Access check: if `visibility = 'gym_only'`, require user to be a gym member. Include divisions, bracket (if generated), and whether current user is registered. |
| POST | `/api/tournaments/[id]/register` | authenticated | Register for a division. Body: `{ divisionId }`. Validates: tournament.status = 'registration_open', registrationDeadline not passed, user's belt is within division beltMin–beltMax, user is a gym member (for gym_only tournaments), maxParticipants not reached. Creates TournamentRegistration (approved = false). |
| DELETE | `/api/tournaments/[id]/register` | authenticated | Withdraw registration. Only before tournament.status = 'in_progress'. |

### Public event auto-submission

When `POST /api/tournaments` creates a tournament with `visibility = 'public'`, optionally auto-create a draft `PublicEvent` (status: pending, auto-submitted). Include logic in the create handler, behind a flag:
```typescript
if (body.visibility === 'public' && body.autoSubmitEvent !== false) {
  await prisma.publicEvent.create({
    data: {
      title: tournament.name,
      type: 'other', // or a mapped type
      description: tournament.description,
      city: gym.city,
      state: gym.state,
      startDate: tournament.date,
      gymId: tournament.gymId,
      submittedById: session.user.id,
      status: 'pending',
    }
  })
}
```

## UI Pages & Components

### `app/tournaments/page.tsx` — Server Component

Public-facing tournament list.

Header: "Upcoming Tournaments"

Filter tabs: All / Open Registration / In Progress / My Gym

Tournament card:
- Tournament name (font-display, link to detail)
- Gym name + city/state
- Date formatted: "Saturday, June 14, 2026"
- Status badge: "Registration Open" (green) / "In Progress" (yellow) / "Complete" (gray)
- Format badge: "Single Elimination" / "Round Robin" / "Double Elimination"
- Division count: "X divisions"
- "Register" button (if registration_open and user is not yet registered)

Empty state: "No upcoming tournaments. Check back later."

### `app/tournaments/[id]/page.tsx` — Mixed (server fetch + client interactions)

Tournament detail page.

Sections:

**Header:** Name, date, gym name (link to gym profile), format, status badge.

**Divisions:** List of divisions (name, belt range, weight class, max participants, registered count).
- If `status = 'registration_open'`: each division shows a "Register" button (if user meets belt requirement). Grayed out if user is already registered, belt is out of range, or division is full.
- Belt range display: "White – Blue" using belt color swatches.

**Bracket View** (shown when `status = 'in_progress'` or `'complete'`): See bracket rendering below.

**My Registration:** If user is registered, show which division + status (pending approval / approved).

### Bracket Rendering Component (`app/components/TournamentBracket.tsx`) — Client Component

Renders the bracket from `TournamentBracket.bracketData` JSON. No external library.

**Bracket JSON structure (single elimination):**

```typescript
interface BracketNode {
  matchId: string      // TournamentMatch.id
  round: number
  matchNumber: number
  participant1: { userId: string; name: string; belt: string } | null
  participant2: { userId: string; name: string; belt: string } | null
  winnerId: string | null
  nextMatchId: string | null   // where the winner advances
}

type BracketData = BracketNode[]
```

**Visual layout:** Column-based layout. Each round is a column. Matches within a round are spaced vertically. Lines connect matches to their advancement slots.

Implement using CSS `flexbox` columns. Each match is a card:
```
┌─────────────────────────┐
│ [Name] · [Belt badge]   │  ← winner highlighted with green border
│ [Name] · [Belt badge]   │
└─────────────────────────┘
```

For completed matches: winner's row has `bg-green-50 font-bold`, loser has `text-ash line-through`.

For upcoming matches: both rows neutral.

Connecting lines: use CSS borders or SVG. CSS approach is simpler — right border on each match card in a non-final round with a vertical connecting line to the next round. This is a known CSS bracket pattern.

**Round Robin:** Display as a results table (not implemented as a bracket). Rows and columns are participants; cells show W/L/pending. Build separately from the `BracketNode` tree.

**Double Elimination:** Generate a winners bracket and a losers bracket. Render side by side. More complex — implement after single_elim is working.

### `app/instructor/tournaments/page.tsx` — Server Component (Admin/Instructor)

Gym admin tournament management list.

Shows all tournaments for the caller's gym. Status badge for each.

Actions: "Edit" (link to manage page), "Add Division", status change buttons.

"Create Tournament" button → opens form or links to `/instructor/tournaments/new`.

### `app/instructor/tournaments/[id]/page.tsx` — Client Component (Admin)

Tournament management dashboard. Tabs:

1. **Details** — edit tournament fields (name, date, format, visibility, status). Status change button (advance to next status with confirmation).

2. **Divisions** — list of divisions, add/edit/delete. Each division shows registration count.

3. **Registrations** — table of all registrations. Columns: participant name, belt, division, registration date, approved status. "Approve" / "Reject" buttons per row. Bulk approve all button.

4. **Bracket** — bracket view (same component as public view). If not generated: "Generate Brackets" button (only after status = 'in_progress'). After generation: bracket display with match result entry (admin view adds result input forms on each match).

Match result entry: clicking on a completed-enough match opens a small inline form:
- "Winner: [Participant 1] / [Participant 2]" (radio or two buttons)
- "Result notes" (text, optional)
- "Save" → calls `PUT /api/tournaments/[id]/matches/[matchId]`

### Profile Page Update (`app/profile/[userId]/page.tsx`)

Add "Tournaments" section to the student profile (visible to the user themselves, hidden from public view unless `profilePrivacy` allows it).

Shows:
- Past tournament registrations with tournament name, date, division, result (won/lost/placed)
- Result is derived from `TournamentMatch` — find matches where participant1Id or participant2Id = userId and `completedAt` is set, check if winnerId = userId

## Bracket Generation Logic

Build in `lib/bracket.ts`:

### Single elimination

```typescript
export function generateSingleElimBracket(
  participants: { userId: string; name: string; belt: string }[]
): BracketData {
  // Pad to next power of 2 with byes (null participants)
  const size = nextPowerOf2(participants.length)
  const seeded = shuffle(participants) // random seeding for now
  while (seeded.length < size) seeded.push(null) // byes

  const nodes: BracketNode[] = []
  const totalRounds = Math.log2(size)

  // Round 1: pair up participants
  for (let i = 0; i < size; i += 2) {
    nodes.push({
      matchId: generateId(),
      round: 1,
      matchNumber: i / 2 + 1,
      participant1: seeded[i],
      participant2: seeded[i + 1],
      winnerId: null,
      nextMatchId: null, // set in next pass
    })
  }

  // Subsequent rounds: create empty match slots
  for (let round = 2; round <= totalRounds; round++) {
    const matchesThisRound = size / Math.pow(2, round)
    for (let m = 0; m < matchesThisRound; m++) {
      nodes.push({
        matchId: generateId(),
        round,
        matchNumber: m + 1,
        participant1: null,
        participant2: null,
        winnerId: null,
        nextMatchId: null,
      })
    }
  }

  // Link nextMatchId: each match in round R feeds into round R+1
  // Match m feeds into floor((m-1)/2)+1 in next round
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.round < totalRounds) {
      const nextRound = node.round + 1
      const nextMatchNumber = Math.ceil(node.matchNumber / 2)
      const nextNode = nodes.find(n => n.round === nextRound && n.matchNumber === nextMatchNumber)
      if (nextNode) node.nextMatchId = nextNode.matchId
    }
  }

  // Auto-advance byes (participant2 = null → participant1 wins automatically)
  for (const node of nodes) {
    if (node.round === 1 && node.participant1 && !node.participant2) {
      node.winnerId = node.participant1.userId
      // Advance winner to next round
      advanceWinner(nodes, node)
    }
  }

  return nodes
}
```

### Advancing a winner

```typescript
function advanceWinner(nodes: BracketNode[], completedNode: BracketNode): void {
  if (!completedNode.winnerId || !completedNode.nextMatchId) return
  const nextNode = nodes.find(n => n.matchId === completedNode.nextMatchId)
  if (!nextNode) return
  const winner = [completedNode.participant1, completedNode.participant2]
    .find(p => p?.userId === completedNode.winnerId)
  if (!nextNode.participant1) {
    nextNode.participant1 = winner ?? null
  } else {
    nextNode.participant2 = winner ?? null
  }
}
```

### Round robin

For round robin: generate a schedule using a round-robin algorithm (e.g., the "polygon method"). Store as a flat list of matches, not a tree. The `bracketData` for round_robin is:
```typescript
{ format: 'round_robin', matches: RoundRobinMatch[], standings: Standings[] }
```

### Saving the bracket

After `generateSingleElimBracket`:
1. Create `TournamentBracket { divisionId, bracketData: nodes }`
2. For each `BracketNode`, create a `TournamentMatch` record with `participant1Id`, `participant2Id` (from node data, or null)
3. Store `matchId` in the BracketNode to link JSON to DB record

When recording a result via `PUT /api/tournaments/[id]/matches/[matchId]`:
1. Update `TournamentMatch.winnerId`, `result`, `completedAt`
2. Load `TournamentBracket.bracketData` JSON
3. Find the node with matching `matchId`, set `winnerId`
4. Call `advanceWinner` logic to populate the next match's participants in the JSON
5. Save updated `bracketData` back to `TournamentBracket`
6. Create/update the next round's `TournamentMatch` record with the new participant

## Implementation Steps

1. **Add all new enums to schema.** Run `prisma db push`. Fall back to manual SQL if needed.

2. **Add all five new models to schema.** Add back-relations to User and Gym. Run `prisma db push`. Run `prisma generate`.

3. **Create `lib/bracket.ts`** with `generateSingleElimBracket`, `advanceWinner`, `nextPowerOf2`, `shuffle` helpers.

4. **Build `POST /api/tournaments`** — validate participating gym status. Create tournament. Handle optional auto-PublicEvent creation.

5. **Build `PUT /api/tournaments/[id]`** — update fields. Validate status transitions. Reject backward transitions.

6. **Build `POST /api/tournaments/[id]/divisions`** and related division CRUD.

7. **Build `GET /api/tournaments`** — visibility-aware query. Return gym-only tournaments only to gym members.

8. **Build `GET /api/tournaments/[id]`** — visibility check. Include divisions, registration status for viewer, bracket (if exists).

9. **Build `POST /api/tournaments/[id]/register`** — belt validation against division beltMin/beltMax. Registration deadline check. maxParticipants check.

10. **Build `DELETE /api/tournaments/[id]/register`** — withdrawal before in_progress.

11. **Build `GET /api/tournaments/[id]/registrations`** — admin route.

12. **Build `PUT /api/tournaments/[id]/registrations/[regId]`** — approve/reject.

13. **Build `POST /api/tournaments/[id]/brackets/generate`** — for each division, get approved registrations, call `generateSingleElimBracket`, create `TournamentBracket`, create `TournamentMatch` records.

14. **Build `PUT /api/tournaments/[id]/matches/[matchId]`** — record result, advance bracket JSON, update match records.

15. **Build `TournamentBracket` React component.** Start with single_elim only. Test with 4, 8, and odd numbers of participants (to verify bye handling).

16. **Build public-facing pages:** `app/tournaments/page.tsx`, `app/tournaments/[id]/page.tsx`.

17. **Build admin pages:** `app/instructor/tournaments/page.tsx`, `app/instructor/tournaments/[id]/page.tsx`.

18. **Add tournament history to student profile.**

19. **Smoke test (full flow):**
    - Gym admin creates tournament
    - Gym admin adds 3 divisions
    - Students register (check belt validation blocks out-of-range)
    - Gym admin approves all registrations
    - Gym admin advances status to in_progress
    - Gym admin generates brackets — verify bye handling for odd participant count
    - Gym admin enters match results — verify bracket advances winner to next round
    - Tournament reaches complete status — profile shows placement

## Edge Cases & Gotchas

- **Belt validation: white <= blue check.** Use `BELT_ORDER` from `lib/belt.ts`. A division with `beltMin: 'blue', beltMax: 'purple'` should accept blue and purple belts. Check: `BELT_ORDER[userBelt] >= BELT_ORDER[division.beltMin] && BELT_ORDER[userBelt] <= BELT_ORDER[division.beltMax]`.

- **Odd number of participants (byes).** A division with 5 participants gets a bracket of size 8 — three participants get byes in round 1 (they auto-advance). The `generateSingleElimBracket` function pads to the next power of 2. Ensure the visual bracket clearly labels bye matches.

- **Bracket JSON divergence from TournamentMatch records.** The `bracketData` JSON is the source of truth for the bracket structure. The `TournamentMatch` records are the source of truth for results. When recording a result, update BOTH atomically in a Prisma transaction. If they diverge due to an error, the admin page should show the TournamentMatch records as authoritative and offer a "Repair Bracket JSON" button.

- **Bracket regeneration after recording results.** Do not allow regenerating brackets once matches have been recorded (`status = 'in_progress'` AND any `TournamentMatch.completedAt` is set). Only allow regeneration in the early in_progress state before any results.

- **`TournamentBracket` `@unique` on `divisionId`.** This means you cannot have a winners bracket AND a losers bracket as separate records for double elimination. For double_elim, store both in a single `bracketData` JSON with a top-level `{ winners: [...], losers: [...] }` structure. Or use a suffix on the unique field — but changing the model is cleaner. For MVP, implement only `single_elim` and `round_robin`; defer `double_elim`.

- **`maxParticipants` enforcement.** Check `count(TournamentRegistration where divisionId = X)` < `maxParticipants` before creating a registration. This is a race condition under concurrent registrations — use a DB-level check or accept occasional over-registration with admin tools to resolve.

- **Public event auto-submission scope.** Only create the `PublicEvent` auto-submission if `visibility === 'public'`. Gym-only tournaments should never auto-submit. The site admin will still need to review and approve the submitted event before it appears on the public calendar.

- **Profile tournament history.** Joining TournamentRegistration → TournamentMatch to determine "placed" results requires finding matches where the user was a participant and whether they won or lost, and in which round. A simple heuristic: find the highest round the user reached and whether they won the final match in that round. For MVP, just show "Registered" vs "Result recorded" without detailed placement.

- **CockroachDB JSON field updates.** `TournamentBracket.bracketData` is a `Json` field. CockroachDB stores this as JSONB. Updating it requires reading the full JSON, modifying in TypeScript, and writing it back — there is no partial JSON update. This is fine at tournament scale (brackets are small). Use `prisma.tournamentBracket.update({ data: { bracketData: updatedNodes } })`.
