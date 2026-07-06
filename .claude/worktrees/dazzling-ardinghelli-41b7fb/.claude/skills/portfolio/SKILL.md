---
name: portfolio
description: Load full context for the Joshua Powell portfolio project — architecture, deployment workflow, known gotchas, and the tweaks-queue mindset. Invoke at the start of any portfolio session before touching code.
---

# Portfolio project · context bootstrap

When the user invokes `/portfolio`, absorb everything below before responding. Don't re-read files to confirm facts that are in here — act on them. Verify specifics only when you're about to recommend or change something that depends on them still being true.

## Live + source

- **Site:** https://joshuapowell.netlify.app
- **Repo:** https://github.com/robotjoshua/portfolio (branch: `main`)
- **Local path:** `C:\Users\ROBOT\Desktop\Portfolio`
- **Netlify Site ID:** `1fdae11a-4d13-4fd0-be35-090bc4f83ccf` (needed for blob sync)

## Stack

- Next.js 16 App Router (RSC). `export const dynamic = 'force-dynamic'` on pages that read DB.
- **Postgres: Neon**, via Drizzle ORM. See `lib/db/client.ts` — auto-selects driver:
  - Neon URL → `@neondatabase/serverless` HTTP driver (serverless-safe)
  - Other URLs → `pg` Pool (local dev)
  - **Never revert to `pg` on Netlify** — pool stalls on Functions cold start caused "Signing in…" hangs. Known scar.
- **Images: Netlify Blobs**, store name `portfolio-images`. Served through `/api/img/[...key]` (lib/blobs.ts). Local dev falls back to `.blobs/` folder. No `next/image` — plain `<img>` so GIFs animate.
- **Admin auth:** `jose` JWT (HS256), cookie `admin_session`, 1-week expiry. `middleware.ts` guards `/admin/**` and `/api/admin/**`; `/admin/login` and `/api/admin/auth/*` are whitelisted. Server-component check: `isAdminServer()` from `lib/auth.ts`.
- **Deploy:** Netlify, `@netlify/plugin-nextjs`. Auto-redeploys on push to `main`.

## Required env vars (Netlify + .env.local)

- `DATABASE_URL` — Neon connection string
- `ADMIN_PASSWORD` — login password
- `ADMIN_SESSION_SECRET` — 32+ char random (`openssl rand -base64 48`)

## Deployment workflow (every change)

1. Edit files.
2. `npx tsc --noEmit` — catch type errors before Netlify does. Netlify **will** fail the build on TS errors (learned: `current.images[0]?.src` needed to be `current.images?.[0]?.src`).
3. `git add -A && git commit -m "..." && git push` — Netlify picks it up.
4. Watch the deploy log if the change is load-bearing.

CRLF warnings on Windows are benign — ignore.

## Preview dev server

A preview server typically runs on port 3001. Use `preview_list` to find it, then `preview_eval` / `preview_inspect` to verify changes. Prefer `preview_inspect` over screenshots for CSS verification. For TS/build errors, verify with `tsc --noEmit` — those aren't browser-observable.

## Image/upload pipeline

Two routes, both in `app/api/admin/`:

- `upload/route.ts` — images for an **existing artifact**; blob key `artifacts/<id>/NNN.{webp,gif}`.
- `uploads/route.ts` — **unclaimed** uploads; blob key `uploads/<stamp>-<slug>.{webp,gif}`.

Both: Sharp converts raster to webp at quality ~86/94; **GIFs are stored raw** (animation preserved) with `image/gif` content-type; thumb is always webp from the first frame.

## Migrating local blobs → prod

If local `.blobs/` has images not in the prod store:

```bash
NETLIFY_SITE_ID=<id> NETLIFY_TOKEN=<token> npx tsx scripts/blobs-sync.ts
```

PowerShell syntax differs: `$env:NETLIFY_SITE_ID="x"; $env:NETLIFY_TOKEN="y"; npx tsx scripts/blobs-sync.ts`.

Tokens from https://app.netlify.com/user/applications#personal-access-tokens. **Rotate any token that gets pasted into chat or screenshotted.**

## UI notes

- **Mobile breakpoints:** 900, 600, 380px. Mobile edges are tight — `.shell` and `.vf-wrap` trimmed to ~4px side margin on ≤600. Don't re-widen without checking.
- **Nav icons (icon-only):** `♪`/`♫` (AmbientHum music), `◑` (theme toggle), `▣` (admin). Class `.nav-icon`.
- **Layout order** (see `app/layout.tsx`): `Nav` → `shell/children` → `DataTicker` (vertical side rails, desktop only) → `NavStrip` (scrolling telemetry ticker at bottom) → `TermBar` (footer menu links). NavStrip lives at the bottom, above TermBar — not in the Nav.
- **Design system:** CSS vars `--paper`, `--paper-2`, `--ink`, `--muted`, `--faint`, `--rule-2/3`, `--accent`. Fonts `--f-d` (Space Grotesk), `--f-m` (JetBrains Mono). Geometric glyph set: ◈ ◆ ◇ ▣ ◑ ◎ △ ◤. Dark mode via `html[data-dark]`.

## How the user works

- Brief, ALL-CAPS messages with typos — read intent, not spelling.
- Wants changes shipped end-to-end: commit + push + live verification, not just local edits.
- Screenshots are the primary bug report format — look for annotations, window width, and visible state.
- Trusts you to execute without over-asking; confirm only risky/destructive ops.
- Prefers terse responses. No trailing summaries. Don't narrate internal reasoning.

## Common tweak shapes

- **Mobile layout fix** — check 600px and 900px media query blocks at the end of `app/globals.css`; verify in preview at mobile preset.
- **Nav/header content change** — `components/Nav.tsx` + `components/NavStrip.tsx`; icon styles in `.nav-icon`.
- **New/changed upload behavior** — touch both `app/api/admin/upload/route.ts` and `app/api/admin/uploads/route.ts` to keep parity.
- **Admin-only UI** — gate server-side via `isAdminServer()` on a page, pass `readOnly`/`isAdmin` prop down. Middleware already blocks non-admins from `/admin` and `/api/admin` routes.
