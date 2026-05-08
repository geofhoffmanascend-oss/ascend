# Phase 11 — Training Journal: Implementation Guide

## Overview

Students can log each training session in two modes:
- **Free-form**: plain text box
- **Guided**: a set of structured prompts — only answered prompts are saved

Logs have a **private** flag. Private logs are hidden from instructors; public logs are visible to the class instructor. Students set default guided prompts in Settings so the same questions appear automatically each time.

---

## Step 1 — Schema Changes

### New model

```prisma
model TrainingLog {
  id             String    @id @default(cuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  classSessionId String?
  classSession   ClassSession? @relation(fields: [classSessionId], references: [id], onDelete: SetNull)
  isPrivate      Boolean   @default(false)
  isGuided       Boolean   @default(false)
  freeFormContent String?
  guidedResponses Json?    // Array of { promptKey, question, answer }
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

### User model — default guided prompts

```prisma
defaultJournalPrompts  String?  // JSON array of promptKey strings
```

### User and ClassSession — add relations

```prisma
// User
trainingLogs  TrainingLog[]

// ClassSession
trainingLogs  TrainingLog[]
```

Run `prisma db push` + `prisma generate`.

---

## Step 2 — Guided Prompts Definition

Define in `lib/journalPrompts.ts` — exported constant used by both client and server:

```ts
export type JournalPrompt = {
  key: string
  category: 'wellness' | 'training' | 'reflection'
  question: string
  inputType: 'text' | 'textarea' | 'rating'  // rating = 1-5 scale
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  { key: 'sleep',           category: 'wellness',    question: 'Hours of sleep',                         inputType: 'text' },
  { key: 'energy',          category: 'wellness',    question: 'Energy level (1–5)',                     inputType: 'rating' },
  { key: 'diet',            category: 'wellness',    question: 'How was your diet today?',               inputType: 'text' },
  { key: 'conditioning',    category: 'wellness',    question: 'How was your conditioning?',             inputType: 'rating' },
  { key: 'class_objective', category: 'training',    question: 'Class objective',                        inputType: 'textarea' },
  { key: 'technique_notes', category: 'training',    question: 'Technique notes',                        inputType: 'textarea' },
  { key: 'rolling_intensity', category: 'training',  question: 'Rolling intensity (1–5)',                inputType: 'rating' },
  { key: 'drill_partner',   category: 'training',    question: 'Was I a good drill partner?',            inputType: 'text' },
  { key: 'focus_learning',  category: 'training',    question: 'Focus while learning (1–5)',             inputType: 'rating' },
  { key: 'focus_rolling',   category: 'training',    question: 'Focus while rolling (1–5)',              inputType: 'rating' },
  { key: 'personal_goal',   category: 'reflection',  question: 'Daily personal goal',                    inputType: 'textarea' },
  { key: 'goal_accomplished', category: 'reflection', question: 'Did you accomplish it? Why?',           inputType: 'textarea' },
  { key: 'comfort_zone',    category: 'reflection',  question: 'Did you push out of your comfort zone?', inputType: 'textarea' },
  { key: 'key_takeaways',   category: 'reflection',  question: 'Key takeaways',                          inputType: 'textarea' },
  { key: 'future_items',    category: 'reflection',  question: 'Future items to work on',                inputType: 'textarea' },
]
```

---

## Step 3 — API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/training-logs` | Create a new log |
| GET  | `/api/training-logs` | Get current user's logs (paginated, optional `?classSessionId=`) |
| GET  | `/api/training-logs/[id]` | Get a single log (owner or instructor of the class, if not private) |
| PATCH | `/api/training-logs/[id]` | Update (owner only) |
| DELETE | `/api/training-logs/[id]` | Delete (owner only) |

---

## Step 4 — Pages

### `/journal`
- List of the student's own training logs
- Each row: date, class name (if linked), guided/free-form badge, private badge
- Link to `/journal/[id]` for each
- "New Entry" button → `/journal/new`

### `/journal/new?sessionId=xxx`
- `sessionId` pre-fills the linked class session (passed from notification link)
- **Private toggle** with tooltip: "Private logs are only visible to you — not your instructor."
- **Mode toggle**: Free-form / Guided
- Free-form: single `<textarea>`
- Guided: renders prompts filtered to user's `defaultJournalPrompts` (all if no defaults set)
  - Each prompt shows its question and an appropriate input
  - Only prompts the student fills in are saved
- Submit → POST `/api/training-logs` → redirect to `/journal/[id]`

### `/journal/[id]`
- Read-only view of a completed log
- Edit button → renders the same form pre-populated
- Shows guided responses as a structured list: category headers, question + answer pairs

---

## Step 5 — Settings Addition

In `SettingsForm.tsx`, add a new section:
- Heading: "Default Journal Prompts"
- Description: "These prompts will be pre-selected each time you open a new guided journal entry."
- Checkbox list of all `JOURNAL_PROMPTS` grouped by category
- Saves as JSON array of selected keys via `PATCH /api/users/[id]` (extend to accept `defaultJournalPrompts`)

---

## Step 6 — Dashboard Addition

In `/dashboard`, add a "Recent Journal Entries" section (after attendance):
- Last 3 entries: date, class name, mode badge
- "View All" link to `/journal`

---

## Step 7 — Instructor Visibility

Instructors can view non-private logs for students in their classes via `/instructor/students/[id]`.
Add a "Training Logs" section to that page — fetch logs where `isPrivate = false` and the log is linked to one of the instructor's class sessions.

---

## Build Order

1. Schema + `prisma db push` + `prisma generate`
2. `lib/journalPrompts.ts`
3. API routes (`/api/training-logs`, `/api/training-logs/[id]`)
4. `/journal` list page
5. `/journal/new` creation form with free-form + guided modes
6. `/journal/[id]` view/edit page
7. Settings — default prompts section
8. Dashboard — recent entries section
9. Instructor student page — non-private logs
10. Mark Phase 11 complete
