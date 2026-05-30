---
name: feedback_hydration
description: suppressHydrationWarning required on any element rendering toLocaleDateString in a client component
metadata:
  type: feedback
---

Any element in a **client component** that renders `toLocaleDateString` (or any `Intl`-based date formatting) must have `suppressHydrationWarning` on the element directly containing the date text.

**Why:** Next.js SSRs client components on the server first, then hydrates on the client. Node.js and the browser can produce slightly different output from `Intl.DateTimeFormat` even with an explicit locale like `'en-US'`, causing React to report a hydration mismatch.

**How to apply:** Add `suppressHydrationWarning` to the `<span>`, `<p>`, or `<td>` that directly wraps the formatted date string. This does NOT apply to server components (they emit static HTML that React reuses without comparison).

Example:
```tsx
// ❌ causes hydration warning
<span className="text-xs text-ash">{new Date(iso).toLocaleDateString('en-US', ...)}</span>

// ✅ correct
<span suppressHydrationWarning className="text-xs text-ash">{new Date(iso).toLocaleDateString('en-US', ...)}</span>
```

Files fixed in this incident: EventsClient.tsx, EventApprovalClient.tsx, ForumModerationClient.tsx, GymListClient.tsx, my/page.tsx (events), StoreClient.tsx, AdminStoreClient.tsx, ForumClient.tsx.
