# AscendIt — Role Capability Matrix

Roles: **student** (all authenticated users), **instructor**, **admin**, **site_admin**, **vendor**  
A user can hold multiple roles simultaneously. `student` is always present.

**Vendor sub-types (`VendorType` enum):** `photographer` · `merchant`  
⚠️ The vendor role and dashboard (`/vendor`) are currently a stub. Vendor-specific capabilities (sell photos, manage products) are planned but not yet enforced in the API. Rows marked `⚠️ Planned` reflect intended behavior, not current enforcement.

Legend: ✅ Full access · 👁 View only · ✏️ Own records only · ❌ No access · ⚠️ Planned (not yet built)

---

## Authentication & Account

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| Google OAuth | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change password | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change email | ❌ | ❌ | Trigger via admin | ✅ | ❌ |
| Delete own account | ✅ | ✅ | ✅ | ✅ | ✅ |
| Password reset (request) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send password reset to another user | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## Profile & Onboarding

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Own profile — view | ✅ | ✅ | ✅ | ✅ | ✅ |
| Own profile — edit | ✅ | ✅ | ✅ | ✅ | ✅ |
| Privacy controls (bio, phone, competitions) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Public profile page `/profile/[id]` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Training reflection | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| Competition history | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| Training goals | ✏️ | ✏️ | ✏️ | ✏️ | ✏️ |
| Belt rank (self-reported) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Belt verification (set verified=true) | ❌ | ❌ | ✅ | ✅ | ❌ |
| Onboarding wizard | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Schedule & Classes

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| View schedule (week/day/month) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register for a class (commit) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Self check-in | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR check-in (own QR) | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR scan check-in (scan others) | ❌ | ✅ | ✅ | ✅ | ❌ |
| See who's registered for a session | ✅ | ✅ | ✅ | ✅ | ✅ |
| Schedule class group preferences | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin-block class groups for a student | ❌ | ❌ | ✅ | ✅ | ❌ |
| Create / edit classes | ❌ | ❌ | ✅ | ✅ | ❌ |
| Session notes (public/private) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Mark attendance | ❌ | ✅ | ✅ | ✅ | ❌ |
| Release session for substitution | ❌ | ✅ | ✅ | ✅ | ❌ |
| Claim a substitution | ❌ | ✅ | ✅ | ✅ | ❌ |
| Push notify committed students | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## Forums

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| View general + announcement forums | ✅ | ✅ | ✅ | ✅ | ✅ |
| View instructor-only forum | ❌ | ✅ | ✅ | ✅ | ❌ |
| View class group forums (not blocked) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View gym forum (own gym) | ✅ | ✅ | ✅ | bypass | ✅ |
| View belt forums (any belt — read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Post in belt forum (own belt or lower) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create gym forum | ✅ (own gym) | ✅ | ✅ | ✅ | ✅ |
| Pin / unpin posts | ❌ | ✅ | ✅ | ✅ | ❌ |
| Delete own posts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete any post | ❌ | ❌ | ✅ (non-belt) | ✅ (belt only) | ❌ |
| Post announcements | ❌ | ✅ | ✅ | ✅ | ❌ |
| Subscribe / unsubscribe to forums | ✅ | ✅ | ✅ | ✅ | ✅ |
| Forum notification opt-out (per group) | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Private Lessons

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Request a lesson | ✅ | ✅ | ✅ | ✅ | ✅ |
| Initiate a lesson (instructor → student) | ❌ | ✅ | ✅ | ✅ | ❌ |
| View own lesson requests | ✅ | ✅ | ✅ | ✅ | ✅ |
| Respond to / manage lessons | ❌ | ✅ (theirs) | ✅ | ✅ | ❌ |
| Lesson messaging thread | ✅ (participants) | ✅ | ✅ | ✅ | ✅ |

---

## Training Journal

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Create journal entry | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own entries | ✅ | ✅ | ✅ | ✅ | ✅ |
| Private entries | ✏️ (own) | ✏️ (own) | ✏️ (own) | ✏️ (own) | ✏️ (own) |
| View student entries (non-private) | ❌ | ✅ | ✅ | ✅ | ❌ |
| Default prompt preferences | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Feedback

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Submit post-class feedback | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own feedback history | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all feedback (anonymized where flagged) | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## Direct Messages

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Send DM to instructor/admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send DM to another student | ✅ (if allowed) | ✅ | ✅ | ✅ | ✅ |
| Message request flow (restricted users) | ✅ | ✅ | ✅ | ✅ | ✅ |
| DM opt-out from other students | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Gallery & Media

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| View public photos | ✅ | ✅ | ✅ | ✅ | ✅ |
| View gym-only photos (own gym) | ✅ | ✅ | ✅ | bypass | ✅ |
| View private photos | ✏️ (own) | ✏️ (own) | ✏️ (own) | bypass | ✏️ (own) |
| Upload photos/videos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Set visibility (public/gym/private) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tag other users | ✅ | ✅ | ✅ | ✅ | ✅ |
| Opt out of being tagged | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete own media | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete any media | ❌ | ❌ | ✅ | ✅ | ❌ |
| Mark media for sale | ❌ | ❌ | ✅ | ✅ | ⚠️ Planned (photographer) |

---

## Gear Store

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Browse products (gym + platform) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Place an order | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own orders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/edit products (gym-scoped) | ❌ | ❌ | ✅ | ✅ | ⚠️ Planned (merchant) |
| Create platform-wide products | ❌ | ❌ | ❌ | ✅ | ❌ |
| Update order status (ready/pickup) | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## Notifications

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Receive in-app notifications | ✅ | ✅ | ✅ | ✅ | ✅ |
| Receive push notifications | ✅ (opt-in) | ✅ | ✅ | ✅ | ✅ |
| Notification preferences per type | ✅ | ✅ | ✅ | ✅ | ✅ |
| Email copy opt-in | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Community Events (Public Calendar)

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| View public calendar `/events` | ✅ (public) | ✅ | ✅ | ✅ | ✅ |
| Submit an event | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own pending/rejected submissions | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve / reject events | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Gyms & Membership

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Browse gym profiles | ✅ (public) | ✅ | ✅ | ✅ | ✅ |
| Join a gym | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register a new gym | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve membership requests | ❌ | ❌ | ✅ | ✅ | ❌ |
| Edit gym details | ❌ | ❌ | ✅ (own gym) | ✅ (all) | ❌ |
| Upgrade gym tier | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Tournaments

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| View open/active tournaments (own gym) | ✅ | ✅ | ✅ | ✅ | ✅ |
| View public tournament results | ✅ (public) | ✅ | ✅ | ✅ | ✅ |
| Register for a division | ✅ (active member) | ✅ | ✅ | ✅ | ✅ |
| Withdraw registration (while open) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create tournaments | ❌ | ❌ | ✅ (participating gym only) | ✅ | ❌ |
| Manage registrations + brackets | ❌ | ❌ | ✅ | ✅ | ❌ |
| Enter match results | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## Admin Area (per-gym)

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| View admin dashboard | ❌ | ❌ | ✅ | ✅ | ❌ |
| User management (roles, access, email, belt) | ❌ | ❌ | ✅ | ✅ | ❌ |
| Attendance reports | ❌ | ❌ | ✅ | ✅ | ❌ |
| Forum moderation | ❌ | ❌ | ✅ | ✅ | ❌ |
| Gym settings (review URL etc.) | ❌ | ❌ | ✅ | ✅ | ❌ |

---

## Site Admin Area (platform-wide)

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Platform metrics dashboard | ❌ | ❌ | ❌ | ✅ | ❌ |
| All gyms management | ❌ | ❌ | ❌ | ✅ | ❌ |
| Event approval queue | ❌ | ❌ | ❌ | ✅ | ❌ |
| Belt forum moderation | ❌ | ❌ | ❌ | ✅ | ❌ |
| New gym review | ❌ | ❌ | ❌ | ✅ | ❌ |
| Grant / revoke site_admin role | ❌ | ❌ | ❌ | ✅ | ❌ |
| Initialize belt forums | ❌ | ❌ | ❌ | ✅ | ❌ |


---

## Vendor Area (stub — not yet built)

| Feature | student | instructor | admin | site_admin | vendor |
|---------|---------|------------|-------|------------|--------|
| Access `/vendor` dashboard | ❌ | ❌ | ❌ | ❌ | ⚠️ Stub page only |
| Photographer: upload + sell photos | ❌ | ❌ | ❌ | ❌ | ⚠️ Planned |
| Photographer: set watermark + price | ❌ | ❌ | ❌ | ❌ | ⚠️ Planned |
| Merchant: manage store products | ❌ | ❌ | ❌ | ❌ | ⚠️ Planned |
| View own sales / revenue | ❌ | ❌ | ❌ | ❌ | ⚠️ Planned |

> **Note:** The `vendor` role can be assigned via the admin RoleManager UI. The `VendorType` field (`photographer` or `merchant`) specifies the sub-type. No vendor-specific API enforcement exists yet — vendors currently have the same capabilities as students.
