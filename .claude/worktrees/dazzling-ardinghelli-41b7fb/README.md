# JP Archive — Portfolio

Personal portfolio & operator console. Next.js 16 · React 19 · Postgres (Drizzle) · Netlify Blobs for images.

## Quick start (local)

```bash
npm install
cp .env.example .env.local        # fill in DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
npm run db:push                   # create tables in Neon
npm run db:seed                   # one-time: import data/*.json + public/{uploads,artifacts} into Postgres + Blobs
npm run dev                       # http://localhost:3000
```

`db:seed` is idempotent — re-running just re-upserts.

## Environment

See `.env.example` for the full list. The three you must set:

| var | what |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (include `?sslmode=require`) |
| `ADMIN_PASSWORD` | password for `/admin/login` |
| `ADMIN_SESSION_SECRET` | 32+ byte base64 secret signing the session cookie |

In local dev, Netlify Blobs falls back to `./.blobs/` on disk automatically — no Netlify credentials required. To seed directly against live Blobs from your laptop, also set `NETLIFY_SITE_ID` + `NETLIFY_TOKEN`.

## Admin

- Visit `/admin/login`, enter `ADMIN_PASSWORD`.
- Session cookie lasts 7 days (HttpOnly, SameSite=Lax, Secure in prod).
- Middleware (`middleware.ts`) guards `/admin/**` and `/api/admin/**`.
- Sign out from the button in the admin header.

## Deploying to Netlify

1. Push to GitHub.
2. In Netlify: **Add new site → Import from Git**, pick this repo.
3. The `@netlify/plugin-nextjs` plugin is declared in `netlify.toml` — Netlify auto-installs it.
4. Set env vars in **Site settings → Environment**: `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
5. Deploy. Netlify Blobs is wired automatically via the plugin — no extra credentials in env.
6. Visit `<site>/admin/login` to sign in.

Subsequent content changes are runtime (no rebuild needed): uploads go to Blobs, edits go to Postgres.

## Scripts

| command | does |
|---|---|
| `npm run dev` | Next dev server on :3000 |
| `npm run build` | Next production build |
| `npm run start` | Serve the build on :3000 |
| `npm run db:push` | Drizzle-kit push (apply schema to DB) |
| `npm run db:generate` | Drizzle-kit generate (create SQL migration files) |
| `npm run db:seed` | Import `data/*.json` + `public/{uploads,artifacts}` into Postgres + Blobs |
| `npm run lint` | ESLint |

## Layout

```
app/                   # routes (public + /admin + /api)
components/            # React components
lib/
  db/                  # Drizzle schema + pg client
  blobs.ts             # image storage (Netlify Blobs + local fallback)
  auth.ts              # JWT session helpers
  artifacts-server.ts  # DB-backed CRUD used by server code + API routes
  uploads-server.ts
  profile-server.ts
  namegen.ts           # title generator
middleware.ts          # admin route gate
scripts/db-seed.ts     # one-time migration
```

## Notes

- Record page displays full images (`fit=contain`).
- Index page caps at 20 and respects each artifact's `showOnIndex` flag (toggle in the archive edit UI).
- Deletion from the archive edit UI wipes DB row + blob files.
