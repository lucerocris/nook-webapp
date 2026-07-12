# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: this is Next.js 16, not the version you were trained on

Per `AGENTS.md`, APIs, conventions, and file structure differ from older Next.js. **Read the relevant guide in `node_modules/next/dist/docs/` before writing app code** (`01-app`, `02-pages`, `03-architecture`). Heed deprecation notices. Concrete divergences already in this repo:

- **`cacheComponents: true`** is enabled in `next.config.ts`. Data functions opt into caching with the **`"use cache"`** directive plus `cacheLife("hours")` from `next/cache` — not the older `fetch`-cache / `revalidate` model. Everything reachable from a page is dynamic-by-default unless wrapped in `"use cache"` or a `<Suspense>` boundary.
- **Middleware lives in `proxy.ts` at the repo root**, exporting `proxy(request)` (not `middleware.ts` / `middleware()`). It refreshes the Supabase auth cookie on every matched request and is the single source of truth for that refresh.
- `searchParams` and `params` are **Promises** — `await` them in the component.

## Commands

- `pnpm dev` — dev server (this project uses **pnpm**; `pnpm-lock.yaml` is committed)
- `pnpm build` — production build
- `pnpm lint` — ESLint (flat config in `eslint.config.mjs`, extends `next/core-web-vitals` + `next/typescript`)

There is no test suite. To verify runtime behavior, use the `next-dev-loop` skill in `.agents/skills/` against a running `pnpm dev`.

## Environment

Requires `.env.local` (gitignored) with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Architecture

Nook is a café-discovery app (Cebu City) on Next.js App Router + React 19 + Tailwind v4, backed by Supabase (Postgres + PostGIS + Auth).

### Three Supabase clients — pick by context
- `lib/supabase/server.ts` `createClient()` — **RLS-aware, cookie-authed** server client (`@supabase/ssr`). Use in Server Components, Server Actions, and route handlers that need the current user. Its `setAll` is a deliberate no-op during render; `proxy.ts` owns cookie refresh.
- `lib/supabase/client.ts` `createClient()` — browser client for Client Components.
- **`createAnonClient()` (private, duplicated in `lib/data/cafes.ts` and `lib/data/search.ts`)** — a bare `@supabase/supabase-js` client with no session. This exists because **cookies/`headers()` are unavailable inside `"use cache"` functions**, so cached data-fetchers must not use the cookie-based client. Anything user-specific (favorites, current user) is passed in as an argument (e.g. `userId`) rather than read from the session inside the cache.

### Data layer (`lib/data/`)
Server-only (`import "server-only"`) fetchers wrap Supabase calls in React `cache()` **and** `"use cache"` + `cacheLife("hours")`. Reads go almost entirely through **Postgres RPCs** — `get_cafes` (unified query for sort modes `top_rated` / `trending` / `newest` / `nearby`, text search via `p_query`, tag filtering via `p_tag_names`, geo via `p_lat`/`p_lng`), `get_menu_items`. Detail views use direct `.select()` with nested joins instead.

- `cafes-mappers.ts` is the **snake_case → camelCase boundary**: RPC/row shapes (`CafeRpcRow`, raw join rows) map to domain types (`CafeSummary`, `CafeDetails`, `MenuItem`, `Review`, `Tag`). Supabase nested relations may come back as an object *or* a one-element array — the `asArray()` helper normalizes this; follow that pattern for new joins.
- `lib/data/auth.ts` `getCurrentUserId()` resolves the user id from `supabase.auth.getClaims()` (the `sub` claim), cached per request.

### Types & schema
`lib/supabase/types.ts` is a **hand-maintained** `Database` type with `Insert`/`Update` set to `never` (this app is read-only against these tables). `docs/database/db.md` is the full schema dump for context (tables: `cafes`, `tags`, `cafe_tags`, `menu_items`, `menu_categories`, `profiles`, `reviews`, plus PostGIS `spatial_ref_sys`). Keep `types.ts` and mappers in sync with `db.md` when the schema changes.

### Auth
Email/password via Server Actions in `app/(auth)/actions.ts` (`signIn` / `signUp` / `signOut`), validated with **Zod**, driving `useActionState` forms. `safeNext()` guards open-redirects on the `next` param. The `(auth)` route group has its own centered layout.

### Rendering conventions
Pages stream: static shell renders immediately, data-dependent sections sit behind `<Suspense>` with skeleton fallbacks (`CafeRowSkeleton`, `CafeDetailSkeleton`). Search has both a page (`app/search/`) and a JSON route handler (`app/api/search/cafes/route.ts`) for the live dropdown.

### Conventions
- Path alias `@/*` → repo root.
- `lib/utils.ts` exports `cn()` (clsx + tailwind-merge). Formatting helpers in `lib/utils/format.ts` (`formatPrice` → `P#.##`, `formatDistance`); operating-hours logic in `lib/utils/hours.ts`; tag→icon mapping in `lib/utils/tag-icon.ts`.
- Icons: `@phosphor-icons/react`.

## Bundled skills (`.agents/skills/`)
Consult before relevant work: `supabase` and `supabase-postgres-best-practices` (RLS, indexing, query patterns), `next-cache-components-adoption` / `next-cache-components-optimizer` (`"use cache"` / PPR strategy), `next-dev-loop` (runtime verification).
