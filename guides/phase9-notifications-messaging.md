# Phase 9 — Notifications & Messaging: Implementation Guide

## Overview

Two parallel systems:
1. **Notifications** — system-generated alerts (class updates, check-in prompts, etc.), displayed via a bell icon
2. **Direct Messages** — user-to-user messaging, displayed via an envelope icon

Both show unread count badges in the header. Counts are polled every 30 seconds via SWR.

---

## Step 1 — Schema Changes

### New enums

```prisma
enum NotificationType {
  class_update
  instructor_note
  private_message
  checkin_prompt
  feedback_prompt
  general
}
```

### New models

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String?
  link      String?          // optional deep-link (e.g. /lessons/abc)
  read      Boolean          @default(false)
  readAt    DateTime?
  createdAt DateTime         @default(now())
}

model DirectMessage {
  id          String    @id @default(cuid())
  senderId    String
  sender      User      @relation("SentMessages",     fields: [senderId],    references: [id], onDelete: Cascade)
  recipientId String
  recipient   User      @relation("ReceivedMessages", fields: [recipientId], references: [id], onDelete: Cascade)
  body        String
  readAt      DateTime?
  createdAt   DateTime  @default(now())
}
```

### User model additions (notification settings + DM pref)

Add under the Profile section:

```prisma
// Notification preferences
notifyClassUpdates    Boolean @default(true)
notifyInstructorNotes Boolean @default(true)
notifyPrivateMessages Boolean @default(true)
notifyCheckinPrompts  Boolean @default(true)
notifyFeedbackPrompts Boolean @default(true)
notifyByEmail         Boolean @default(false)
allowDmsFromStudents  Boolean @default(true)
```

### User model — add relations

```prisma
notifications       Notification[]
sentMessages        DirectMessage[]  @relation("SentMessages")
receivedMessages    DirectMessage[]  @relation("ReceivedMessages")
```

Run `prisma db push` after schema changes.

---

## Step 2 — API Routes

### Notifications

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/notifications` | List notifications for current user (latest 50) |
| GET | `/api/notifications/unread-count` | Returns `{ count: number }` — used by header badge |
| PATCH | `/api/notifications/[id]` | Mark single notification read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |

### Direct Messages

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/messages` | Conversation list (one entry per unique other user, sorted by latest message) |
| GET | `/api/messages/unread-count` | Returns `{ count: number }` — used by header badge |
| GET | `/api/messages/[userId]` | Full message thread with a specific user |
| POST | `/api/messages/[userId]` | Send a message to a user (enforces `allowDmsFromStudents` pref) |
| PATCH | `/api/messages/[userId]/read` | Mark all messages in thread as read |

### User settings

| Method | Route | Purpose |
|--------|-------|---------|
| PATCH | `/api/users/[id]` | Already exists — extend to accept all new notification pref fields |

---

## Step 3 — Pages

### `/notifications`
- Server component, lists all notifications newest-first
- Mark-all-read button (client action)
- Each row: icon by type, title, body, timestamp, link if present
- Clicking a row marks it read and navigates to `link`

### `/messages`
- Conversation list: avatar, name, last message preview, unread count per thread
- Link to `/messages/[userId]` for each thread

### `/messages/[userId]`
- Full chat thread, paginated older messages
- Text input to send new message
- Auto-marks thread read on mount
- Check `allowDmsFromStudents` on recipient before allowing send; show error if blocked

### `/settings`
- Notification preferences (toggles for each NotificationType)
- Email copy opt-in
- DM permission toggle
- Saves via `PATCH /api/users/[id]`

---

## Step 4 — Header Changes

Replace the static header with a version that fetches unread counts.

```tsx
// Polling hook (SWR, 30s interval)
const { data: notifData } = useSWR('/api/notifications/unread-count', fetcher, { refreshInterval: 30000 })
const { data: msgData }   = useSWR('/api/messages/unread-count',      fetcher, { refreshInterval: 30000 })
```

Bell icon: links to `/notifications`, shows red badge if `notifData.count > 0`  
Envelope icon: links to `/messages`, shows red badge if `msgData.count > 0`

SWR must be added as a dependency: `npm install swr`

---

## Step 5 — Notification Creation Utility

Create `lib/notify.ts` — a server-side helper called by other API routes when events occur:

```ts
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  options?: { body?: string; link?: string }
)
```

Checks the user's notification preferences before inserting. If `notifyByEmail` is true, also sends an email (use nodemailer or a future email integration — stub for now with a TODO comment).

---

## Step 6 — DM Permission Enforcement

In `POST /api/messages/[userId]`:
1. Look up the recipient's `allowDmsFromStudents` setting
2. Look up the sender's role
3. If recipient has `allowDmsFromStudents: false` AND sender role is `student`, return 403 with a clear message
4. Instructors and admins can always message any student

---

## Build Order

1. Schema + `prisma db push`
2. `lib/notify.ts` utility
3. API routes (notifications, then messages)
4. `/notifications` page
5. `/messages` and `/messages/[userId]` pages
6. `/settings` page
7. Header badge UI (install SWR, add polling)
8. `PATCH /api/users/[id]` extended for new pref fields
9. Mark 9.1, 9.2, 9.3, 9.4 complete in TODO.md
