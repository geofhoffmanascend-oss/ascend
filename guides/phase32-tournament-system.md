# Phase 32 — In-App Tournament / Scrimmage System

## Overview

Gym admins can create and run in-house tournaments (scrimmages) through the app. Students register for divisions, brackets are auto-generated, match results are entered by the admin, and brackets update. Results are published on a public or gym-only results page and appear on each student's profile.

Scoped to **participating gyms only** initially.

---

## Dependencies

- Phase 24: `Gym` model, `gymId` on users
- Phase 25: `GymMembership` — only active members can register
- Phase 27: `Belt` enum — divisions are belt-ranged
- `lib/belt.ts` `BELT_ORDER` — used for belt validation on registration

---

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
  open
  in_progress
  complete
}

enum MatchResult {
  pending
  participant_a_wins
  participant_b_wins
  draw
  bye
}
```

### New models

```prisma
model Tournament {
  id          String            @id @default(cuid())
  gymId       String
  title       String
  description String?
  date        DateTime
  format      TournamentFormat
  status      TournamentStatus  @default(draft)
  isPublic    Boolean           @default(false)
  createdById String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  gym         Gym               @relation(fields: [gymId], references: [id], onDelete: Cascade)
  createdBy   User              @relation("TournamentCreator", fields: [createdById], references: [id], onDelete: Restrict)
  divisions   Division[]
}

model Division {
  id            String         @id @default(cuid())
  tournamentId  String
  name          String
  beltMin       Belt
  beltMax       Belt
  weightClass   String?
  ageGroup      String?
  createdAt     DateTime       @default(now())

  tournament    Tournament     @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  registrations Registration[]
  matches       Match[]
}

model Registration {
  id           String     @id @default(cuid())
  divisionId   String
  userId       String
  confirmed    Boolean    @default(false)
  seed         Int?
  createdAt    DateTime   @default(now())

  division     Division   @relation(fields: [divisionId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([divisionId, userId])
}

model Match {
  id            String      @id @default(cuid())
  divisionId    String
  round         Int
  position      Int
  participantA  String?
  participantB  String?
  result        MatchResult @default(pending)
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  division      Division    @relation(fields: [divisionId], references: [id], onDelete: Cascade)
}
```

Add back-relations on User and Gym:

```prisma
// User
  tournamentsCreated  Tournament[]   @relation("TournamentCreator")
  registrations       Registration[]

// Gym
  tournaments  Tournament[]
```

---

## DB Migration Notes

Four new enums, four new tables. `prisma db push` handles it. No data migration.

---

## Bracket Generation Logic

### Single elimination

1. Sort confirmed participants by seed (or randomize if unseeded).
2. Pad to next power of 2 — extra slots are byes.
3. Standard bracket seeding: position 0 = seed 1 vs seed n, position 1 = seed 2 vs seed n-1, etc.
4. Create round-1 Match records. Byes resolve immediately (result = `bye`, winner advances).
5. Create empty placeholder Match records for all subsequent rounds.

**Result propagation:** When a match result is entered:
- Determine winner userId.
- Next match: `nextRound = round + 1`, `nextPosition = floor(position / 2)`, slot = `position % 2 === 0 ? A : B`.
- Write winner into that match's slot.
- If all matches in the final round are complete, set `tournament.status = 'complete'`.

### Round robin

All participants play each other once. `n*(n-1)/2` matches, all in `round = 1`. Standings computed at read time (wins/losses/draws). No bracket propagation.

### Double elimination

Include `double_elim` in enum but do NOT implement bracket logic. Show "Coming soon" in admin UI when this format is selected for seeding.

---

## API Routes

### Gym admin (admin role + gymId match)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/tournaments` | List gym tournaments |
| POST | `/api/admin/tournaments` | Create tournament |
| PUT | `/api/admin/tournaments/[id]` | Update tournament |
| DELETE | `/api/admin/tournaments/[id]` | Delete (draft only) |
| POST | `/api/admin/tournaments/[id]/divisions` | Add division |
| DELETE | `/api/admin/tournaments/[id]/divisions/[divId]` | Remove division |
| GET | `/api/admin/tournaments/[id]/registrations` | List all registrations |
| PUT | `/api/admin/tournaments/[id]/registrations/[regId]` | Confirm/remove registration |
| POST | `/api/admin/tournaments/[id]/divisions/[divId]/seed` | Generate brackets |
| PUT | `/api/admin/tournaments/[id]/matches/[matchId]` | Enter match result |

### Student (authenticated gym member)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tournaments` | List visible tournaments |
| GET | `/api/tournaments/[id]` | Tournament detail + bracket |
| POST | `/api/tournaments/[id]/divisions/[divId]/register` | Register for division |
| DELETE | `/api/tournaments/[id]/divisions/[divId]/register` | Withdraw (open status only) |
| GET | `/api/tournaments/[id]/results` | Full results (public or gym member) |

---

## UI Pages

### Admin

- `/admin/tournaments` — list page with status badges + Create button
- `/admin/tournaments/[id]` — tabbed management: Setup / Registrations / Brackets
  - Setup tab: edit fields, add/remove divisions, change status
  - Registrations tab: per-division list, confirm/remove, Generate Brackets button
  - Brackets tab: bracket tree (single_elim) or standings table (round_robin); inline result entry

### Student / Public

- `/tournaments` — list of visible tournaments; register button per open division
- `/tournaments/[id]` — detail, registration, read-only bracket
- `/tournaments/[id]/results` — shareable results page (public if isPublic)

### Profile update (32.7)

Add a "Tournament History" section on `/profile` showing registrations with placement (computed from match results).

---

## Shared Component

`app/components/BracketView.tsx` — renders single-elim bracket tree or round-robin standings. Takes `matches: Match[]`, `participants: { id: string; name: string }[]`, `isAdmin: boolean` (shows result entry controls if true). Used in both admin and student views.

---

## Implementation Steps

1. Schema + `prisma db push` + `prisma generate`
2. Create `lib/bracket.ts` with pure bracket-generation and result-propagation functions
3. Build all admin API routes
4. Build all student API routes
5. Build `BracketView` component
6. Build admin tournament list + detail pages
7. Build student tournament list + detail pages
8. Build results page
9. Update student profile with tournament history
10. Add "Tournaments" to nav (gym members only)

---

## Edge Cases

- **Re-seeding after results entered:** Block if any match has a non-pending result.
- **Belt validation on register:** Use `BELT_ORDER[user.belt] >= BELT_ORDER[division.beltMin]` and `<= BELT_ORDER[division.beltMax]`.
- **Participating-tier gate:** `POST /api/admin/tournaments` returns 403 for free-tier gyms.
- **Withdrawal after seeding:** Block DELETE /register if tournament status is in_progress or complete.
- **Real-time bracket:** MVP uses polling (10s interval in useEffect). WebSockets is a future enhancement.
- **Double elim:** Stub only — show "Coming soon" on seed step.
