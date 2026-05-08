# Phase 10 — Student Check-in & Attendance: Implementation Guide

## Overview

Students can check themselves in via the app or via a QR code scan at the gym.
Check-in automatically creates/updates the `Attendance` record so instructors see it in the portal without manual entry.
Two cron-triggered notifications drive the flow: a 15-minute pre-class check-in prompt and a 1-hour post-class feedback prompt.

---

## Step 1 — Schema Changes

### New enum

```prisma
enum CheckInSource {
  manual   // instructor marked via portal
  app      // student self check-in
  qr_code  // QR scan at gym
}
```

### Attendance model — add source + timestamp

```prisma
checkedInAt    DateTime?     // null = instructor-entered, set = student/QR self check-in
checkInSource  CheckInSource @default(manual)
```

### User model — add QR token

```prisma
qrToken  String @unique @default(cuid())
```

Run `prisma db push` after changes.

---

## Step 2 — Check-in Logic

### What counts as "in window"?

A student may check in from **30 minutes before** class starts until **30 minutes after** class starts.
Outside that window the API returns 400 with a clear message.

### Time calculation

`ClassSession.date` is date-only. `Class.startTime` is a string `"HH:MM"`.
Combine them to produce a UTC `Date`:

```ts
function sessionStartTime(date: Date, startTime: string): Date {
  const [h, m] = startTime.split(':').map(Number)
  const d = new Date(date)
  d.setUTCHours(h, m, 0, 0)
  return d
}
```

### Check-in creates Attendance

- If an `Attendance` row already exists for `(userId, classSessionId)`, update it:
  `attended = true`, `checkedInAt = now()`, `checkInSource = source`
- Otherwise create it with `markedById = userId` (self), source as given.

---

## Step 3 — API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/checkin` | Student self check-in (body: `{ classSessionId }`) |
| POST | `/api/checkin/qr` | QR scan check-in (body: `{ qrToken, classSessionId }`) — instructor/admin only |
| GET  | `/api/checkin/qr-token` | Returns current user's qrToken for display |
| GET  | `/api/cron/checkin-reminders` | Cron: send 15-min pre-class notifications |
| GET  | `/api/cron/feedback-prompts` | Cron: send 1-hr post-class feedback notifications |

Cron routes are protected by a `CRON_SECRET` env var checked as a query param (`?secret=XXX`).
Add `CRON_SECRET=<random>` to `.env.local`.

### POST /api/checkin
1. Auth — must be logged in
2. Fetch classSession with class (for `startTime`, `date`)
3. Verify student is committed to this session
4. Verify current time is within check-in window (−30 min to +30 min of start)
5. Upsert Attendance with `source = app`, `checkedInAt = now()`
6. Return `{ ok: true }`

### POST /api/checkin/qr
1. Auth — must be instructor or admin
2. Look up user by `qrToken`
3. Resolve `classSessionId`: if provided use it, otherwise find the next session
   the user is committed to that's currently in window
4. Same upsert as above with `source = qr_code`

### GET /api/cron/checkin-reminders
Runs every 5 minutes (via system cron or external scheduler).
1. Verify `?secret` matches `CRON_SECRET`
2. Find all ClassSessions where start time is 10–20 minutes from now
3. For each committed student on those sessions, call `createNotification(userId, 'checkin_prompt', ...)`
   — `createNotification` already checks `notifyCheckinPrompts` pref
4. Return count of notifications sent

### GET /api/cron/feedback-prompts
Same cadence.
1. Find sessions where start time was 55–65 minutes ago
2. For each student who checked in (has Attendance with `checkedInAt != null`), call
   `createNotification(userId, 'feedback_prompt', ...)` with link to `/feedback/[classSessionId]`

---

## Step 4 — Pages

### Student check-in (on Schedule / Session card)
- Add a **Check In** button to `SessionCard` in `WeeklySchedule.tsx`
  — visible only if: student is committed AND current time is within check-in window AND not already checked in
- On click: `POST /api/checkin` with the classSessionId
- On success: button changes to "Checked In ✓" (green/disabled)

### QR code on student profile/dashboard
- Show QR code image on `/profile` and `/dashboard`
- Generate client-side with the `qrcode` package: `QRCode.toDataURL(qrToken)` → `<img src={dataUrl} />`
- Install: `npm install qrcode && npm install -D @types/qrcode`

### QR scan page for instructor (`/instructor/scan`)
- Simple form: text input or camera input for QR value
- On submit: `POST /api/checkin/qr` with `{ qrToken, classSessionId? }`
- Show success with student name and class, or error

---

## Step 5 — Enhanced Attendance Reports (10.5)

Extend `/admin/attendance` to add views grouped by:
- **By class**: total committed vs. checked-in vs. marked-attended, per class
- **By instructor**: aggregate attendance rate across all their classes
- **By student**: individual attendance history, streaks, rate

Add a `view` query param: `?view=class|instructor|student`

---

## Step 6 — Student Attendance on Dashboard (10.6)

Add a section to `/dashboard`:
- Classes attended this month (count)
- Current streak (consecutive weeks with at least one attended class)
- Last 8 sessions: mini calendar showing attended / missed / upcoming

---

## Build Order

1. Schema + `prisma db push` + `prisma generate`
2. `POST /api/checkin` + `GET /api/checkin/qr-token`
3. Check-in button on SessionCard in WeeklySchedule
4. QR code display on profile + dashboard
5. `POST /api/checkin/qr` + `/instructor/scan` page
6. `GET /api/cron/checkin-reminders` + `GET /api/cron/feedback-prompts`
7. Enhanced admin attendance reports (10.5)
8. Student attendance section on dashboard (10.6)
9. Mark all Phase 10 items complete
