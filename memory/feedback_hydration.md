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

## Pattern 2 — Session-dependent nav mismatch

Client components using `useSession()` can produce different output on the initial client render vs. server render, because `useSession()` may return a stale/undefined value while the session is being reconciled from `SessionProvider`.

**Fix:** Pass the server-resolved session as a prop (`initialSession`) from the layout server component to the Header client component. Use it as a fallback: `const session = liveSession ?? initialSession`. This guarantees the SSR and initial CSR renders are identical.

```tsx
// layout.tsx (server component)
const session = await getServerSession(authOptions)
<Header initialSession={session} />

// Header.tsx (client component)
export function Header({ initialSession }) {
  const { data: liveSession } = useSession()
  const session = liveSession ?? initialSession  // liveSession takes over after hydration
```
