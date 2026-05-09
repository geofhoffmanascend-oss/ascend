# Anonymous Feedback + DM User Search + Message Requests

## Overview
Three features:
1. Anonymous feedback submission option
2. User search when composing a new DM
3. Message request system (Instagram-style) for restricted DM recipients

## Schema Changes (requires `prisma db push`)

### ClassFeedback — add `anonymous` field
```prisma
anonymous Boolean @default(false)
```

### New enum + model
```prisma
enum MessageRequestStatus {
  pending
  approved
  denied
}

model MessageRequest {
  id             String               @id @default(cuid())
  senderId       String
  sender         User                 @relation("SentRequests", ...)
  recipientId    String
  recipient      User                 @relation("ReceivedRequests", ...)
  initialMessage String
  status         MessageRequestStatus @default(pending)
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt
  @@unique([senderId, recipientId])
}
```

### User — add relations
```prisma
sentMessageRequests     MessageRequest[] @relation("SentRequests")
receivedMessageRequests MessageRequest[] @relation("ReceivedRequests")
```

## Files to Create
- `app/components/Toast.tsx` — reusable fixed-position toast
- `app/api/users/search/route.ts` — GET ?q=name, returns matching users
- `app/api/messages/requests/route.ts` — GET pending requests for current user
- `app/api/messages/requests/[id]/route.ts` — PATCH approve/deny
- `app/messages/NewMessageButton.tsx` — search + open new thread
- `app/messages/requests/page.tsx` — manage incoming requests

## Files to Modify
- `prisma/schema.prisma`
- `app/api/messages/[userId]/route.ts` — create request instead of 403
- `app/api/feedback/route.ts` — handle anonymous flag
- `app/feedback/[classSessionId]/FeedbackWizard.tsx` — anonymous toggle
- `app/components/FeedbackRow.tsx` — show "Anonymous" when flagged
- `app/instructor/feedback/page.tsx` — anonymous display
- `app/admin/feedback/page.tsx` — anonymous display
- `app/messages/page.tsx` — New Message button + requests badge
- `app/messages/[userId]/page.tsx` — pass request status
- `app/messages/[userId]/MessageThread.tsx` — toast on request sent

## Message Request Logic
- Student → restricted user: API checks for existing request
  - None: create request, notify recipient, return `{ type: 'request', status: 'created' }`
  - Pending: return `{ type: 'request', status: 'pending' }`
  - Approved: allow normal DM
- Recipient approves: create DirectMessage from initialMessage, update status
- Recipient denies: update status to denied

## Toast Triggers
- Sender: "Message sent as a request — [Name] will be notified."
- Sender (already pending): "You already have a pending request with this user."
- Settings page: when toggling allowDmsFromStudents OFF, show info about request flow
