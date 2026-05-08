@AGENTS.md

# Jiu-Jitsu App — Claude Code Instructions

## Session Start
Always begin every session by reading TODO.md and giving the user a prioritized list of tasks to choose from.

## Constraints
- Do NOT push to git without explicit user instruction
- Do NOT run database commands (`prisma db push`, `db:seed`, etc.) without explicit user instruction
- Do not generate or guess external URLs
- Do not add features, refactors, or "improvements" beyond what was asked

**Token Conservation:**
- Use Grep to search for specific content rather than reading entire large files
- Keep responses concise — avoid over-explaining unless asked for detail
- Use `/compact` proactively mid-session before context gets large
- Keep sessions short and task-focused — start a new session per discrete task
- When delegating simple tasks (searching, file reads, small edits) to subagents, prefer the haiku model
- Do not re-read files already read in the current session unless content may have changed

## Task Workflow
- All active tasks live in `TODO.md`
- When a task is complete, mark it `[x]` and move it to `guides/DO_NOT_REVIEW/COMPLETED_TASKS.md`
- For complex multi-step tasks, create a guide in `guides/` before starting
- When a guide is fully executed, move it to `guides/DO_NOT_REVIEW/`
- Keep TODO.md current — it is the source of truth

## Documentation
- After completing each feature, update `README.md` with user/admin instructions for that feature
- This README will later become the in-app help menu

## Code Standards
- TypeScript everywhere
- Tailwind CSS v4 — CSS-only config in `app/globals.css` via `@theme {}`. No `tailwind.config.js`
- Next.js 16 App Router — server components by default, `'use client'` only when needed
- API routes in `app/api/`
- Shared components in `app/components/`
- Database access via `lib/database.ts` (Prisma singleton with pg adapter)
- Admin-only routes use `lib/adminAuth.ts`
- Instructor/admin routes use `lib/instructorAuth.ts`
- Session: `getServerSession(authOptions)` from `@/app/api/auth/[...nextauth]/route`
- Session includes `user.id` and `user.role` (types in `types/next-auth.d.ts`)
- `params` in dynamic routes is a **Promise** in Next.js 15+: `const { id } = await params`

## Tech Stack
- Next.js 16 (App Router, TypeScript) — dev port **3002**
- CockroachDB via Prisma 7 + @prisma/adapter-pg
- NextAuth v4 (JWT strategy) — Credentials + Google OAuth
- Tailwind CSS v4
- bcryptjs for password hashing

## Database
- Schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts` (reads DATABASE_URL from .env.local, loads dotenv)
- Connection: `lib/database.ts` — URL-parsed Pool + PrismaPg adapter + SSL cert from `~/.postgresql/root.crt`
- **Use `prisma db push` for schema changes** — never `prisma migrate dev`
- **CockroachDB quirk:** `prisma db push` may fail with `crdb_internal_region` TLS enum error on this cluster. If it does, create tables manually via `psql` using `prisma/create-tables.sql` as a reference template, then re-run with updated SQL
- Seed: `npm run db:seed` — seeds users, classes, forums

## Design System (Tailwind v4 tokens — defined in app/globals.css)
Colors: `bg-brand-red` (#CC0000), `text-ink` (#0A0A0A), `text-slate` (#737373), `text-ash` (#A3A3A3),
`bg-paper` (#FAFAFA), `bg-mist` (#F0F0F0), `border-smoke` (#D4D4D4), `text-steel` (#404040),
`bg-ink-soft` (#1F1F1F), `bg-steel` (#404040)
Fonts: `font-display` = Space Grotesk (headings), `font-sans` = Inter (body)

Component patterns:
- Labels: `text-xs font-bold uppercase tracking-widest text-steel`
- Primary button: `bg-brand-red text-paper font-bold text-sm tracking-wide hover:bg-red-700 transition-colors`
- Secondary button: `border border-smoke text-steel text-sm font-medium hover:border-steel hover:text-ink transition-colors`
- Inputs: `w-full px-4 py-3 border border-smoke bg-paper text-ink text-sm focus:outline-none focus:border-brand-red transition-colors`
- Cards: `border border-smoke bg-paper` + `hover:border-steel transition-colors` when clickable
- Section header: `inline-block bg-brand-red px-3 py-1` with `font-display text-xs font-bold tracking-widest uppercase text-paper`

## Roles & Auth
- Three roles: `admin`, `instructor`, `student`
- Middleware in `middleware.ts` protects routes by role
- Public routes: `/`, `/about`, `/login`, `/register`
- Student: `/dashboard`, `/schedule`, `/profile`, `/lessons`, `/forum`
- Instructor: `/instructor/*` — role `instructor` or `admin`
- Admin: `/admin/*` — role `admin` only
- `onboardingDone` flag on User — new users redirected to `/onboarding` after register

## Dev Notes
- Port 3002 (3000 and 3001 are taken by other apps on this machine)
- Start dev server: `npm run dev` from `/home/geoff/Desktop/projects/jiujitsu`
- Google OAuth callback must be registered for `http://localhost:3002`
- Delete account button on dashboard (`DELETE /api/account`) — dev convenience tool
