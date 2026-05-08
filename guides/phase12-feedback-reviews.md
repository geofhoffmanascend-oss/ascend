# Phase 12 — Post-class Feedback & Reviews: Implementation Guide

## Overview

After class, students who checked in receive a notification with two buttons: **Log Training** (→ `/journal/new?sessionId=`) and **Give Feedback** (→ `/feedback/[classSessionId]`). The feedback flow branches based on sentiment. Positive feedback prompts for a public review redirect. All feedback is logged and visible to instructors and admins.

The cron route `GET /api/cron/feedback-prompts` already exists and fires 1 hour after class — it just needs the correct link (`/feedback/[classSessionId]`) which is already in place.

---

## Step 1 — Schema Changes

### New enum

```prisma
enum FeedbackSentiment {
  positive
  neutral
  negative
  concern
}
```

### New models

```prisma
model ClassFeedback {
  id               String            @id @default(cuid())
  userId           String
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  classSessionId   String
  classSession     ClassSession      @relation(fields: [classSessionId], references: [id], onDelete: Cascade)
  sentiment        FeedbackSentiment
  rating           Int?              // 1–5 overall
  responses        Json              // Array of { question: string, answer: string }
  reviewRequested  Boolean           @default(false)
  createdAt        DateTime          @default(now())

  @@unique([userId, classSessionId])
}

model GymSettings {
  id        String   @id @default(cuid())
  reviewUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### User + ClassSession — add relations

```prisma
// User
classFeedback  ClassFeedback[]

// ClassSession
feedback       ClassFeedback[]
```

Run `prisma db push` + `prisma generate`.

---

## Step 2 — Feedback Flow Design

### Step 1: Rating screen
- "How was today's class?" — star/number rating 1–5
- Based on rating:
  - 4–5 → **positive** path
  - 3   → **neutral** path
  - 1–2 → **negative/concern** path

### Step 2: Follow-up questions (per path)

**Positive (4–5):**
1. "What did you enjoy most about today's class?" (textarea)
2. "How would you rate your instructor today?" (1–5 rating)

**Neutral (3):**
1. "What did you enjoy?" (textarea)
2. "What could have been better?" (textarea)

**Negative/Concern (1–2):**
1. "What could have been better?" (textarea)
2. "Is there a specific concern you'd like to share with your instructor?" (textarea)
3. "Would you like an instructor to follow up with you?" (yes/no)

### Step 3: Review prompt (positive path only, rating ≥ 4)
- "Would you be willing to share your experience with others?"
- Button: "Leave a Review" → opens `reviewUrl` in new tab
- Button: "No thanks" → completes flow
- Track `reviewRequested: true` when shown

### Step 4: Thank you screen
- Simple confirmation. Links to dashboard.

---

## Step 3 — API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/feedback` | Submit feedback for a class session |
| GET  | `/api/feedback?classSessionId=` | Get feedback for a session (instructor/admin only) |
| GET  | `/api/admin/feedback` | All feedback, paginated (admin only) |

`POST /api/feedback`:
- Auth required
- Check student attended (has Attendance record for this session)
- Upsert `ClassFeedback` (one per student per session)
- Return created record

---

## Step 4 — Pages

### `/feedback/[classSessionId]`
Client component — multi-step wizard:
1. Rating screen (1–5 stars)
2. Follow-up questions (vary by sentiment)
3. Review prompt (positive only)
4. Thank you

State machine: `step: 'rating' | 'questions' | 'review' | 'done'`

On "done" at step 2: POST to `/api/feedback`, then advance to review (if positive) or done.

### `/instructor/feedback` (or extend session detail page)
- List of feedback for instructor's class sessions
- Sorted by date desc
- Sentiment badge (color-coded: green/yellow/red/orange)
- Expandable to see full responses

### `/admin/feedback`
- All feedback across all classes
- Filter by sentiment, class, date range

---

## Step 5 — Admin Settings Page

Create `/admin/settings`:
- Input for **Review URL** (Google Business Profile, Yelp, etc.)
- Saved to `GymSettings` singleton (upsert on id)
- API: `PATCH /api/admin/settings`

Add link on `/admin` dashboard.

---

## Step 6 — Review URL Helper

`lib/gymSettings.ts` — server-side helper:

```ts
export async function getGymSettings() {
  return prisma.gymSettings.findFirst() ?? { reviewUrl: null }
}
```

Used on the feedback page to pass `reviewUrl` to the client wizard.

---

## Build Order

1. Schema + push + generate
2. `lib/gymSettings.ts`
3. `POST /api/feedback` + `GET /api/feedback`
4. `PATCH /api/admin/settings` + `/admin/settings` page
5. `/feedback/[classSessionId]` multi-step wizard
6. `/instructor/feedback` list
7. `/admin/feedback` list
8. Mark Phase 12 complete
