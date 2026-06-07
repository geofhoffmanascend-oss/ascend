This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# Feature Guide

_(This section will become the in-app help menu.)_

## Registering as a Gym Owner (Phase 38)

AscendIt has two ways to sign up:

- **Join as an athlete** — the standard student experience (profile, schedule, forums, journal).
- **Register or claim a gym** — for gym owners/operators. From the landing page choose "Register or claim a gym", or go straight to `/register?intent=owner`.

**Owner sign-up flow:**

1. Create your account (name, email, password, or Google).
2. **Add your gym.** You're sent to the gym registration form. As you submit, AscendIt checks for an existing gym with the same name in your state/zip:
   - **Likely duplicate** (same name + zip) or **Similar** (same name + state) gyms are shown. If one is yours, choose **"This is mine — claim it"** (claiming/verification is coming soon — Phase 39). Otherwise choose **"It's different — create new"**.
3. Creating your gym **instantly makes you its admin and an instructor** — you get both the admin dashboard and the instructor dashboard. (No verification step during testing.)
4. **Owner setup wizard** (`/onboarding/owner`):
   - **Who's already here** — see members already affiliated with your gym.
   - **Get your gym running** — links to add your class schedule, add/invite instructors, upload your logo, and build your roster.
   - **Finish** — lands you on your admin dashboard. Your athlete profile is separate; build it anytime from your profile settings.

The owner flow is **gym-only** — it never asks for your belt or athlete profile, and there is no pricing/tier step (all features are free during testing).

## Gym Setup Checklist (admin dashboard)

Once you're an admin, the top of `/admin` shows a **"Finish setting up your gym"** card with four items:

- Add your class schedule (`/admin/classes`)
- Add or invite instructors (`/admin/users`)
- Upload your gym logo (`/admin/settings`)
- Build your student roster (`/admin/users`)

Check items off as you complete them — progress is saved per gym and the card disappears once all four are done. (Bulk student/instructor import lands with Phase 40 — for now assign roles manually under Users.)

## Adding Classes & Class Programs (Phase 52)

Two ways to add classes from **Admin → Classes**:

- **+ Add Classes** (the wizard, `/admin/classes/wizard`) — the fast path. Pick a **program** (optional), enter the class details once, and **check the days of the week** it runs. One class is created per checked day (same time/instructor/program), each with its own forum. Use **"Create & Add Another"** to keep the program selected and quickly enter the next class — ideal when setting up a new gym's whole schedule. **"Create & Finish"** returns to the class list.
- **+ Single Class** — the original one-class form (now also has a Program selector).

**Class Programs** (`/admin/programs`) let you group classes under your own labels — e.g. **Basics**, **Advanced**, **Comp Team** — independent of the class *type* (Gi/No-Gi/Kids…). Create, rename, and delete programs there. Deleting a program leaves its classes intact (they just become ungrouped). Each class shows its program as a badge on the class list, and you can assign/change a class's program from the wizard or the edit form.

_Notes:_ a class spanning several days is stored as **separate class records** (one per day), so each day keeps its own roster, sessions, and forum. Per-program forums and per-program access control are coming next (Phase 52.4–52.5).
