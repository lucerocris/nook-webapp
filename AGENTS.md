<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# nook-webapp

## Stack

- **Next.js 16.2.10** (App Router) + **React 19.2.4**
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.*` — use CSS `@theme` directives in `app/globals.css`)
- **pnpm** (package manager). Lockfile is `pnpm-lock.yaml`.
- **TypeScript** strict mode, path alias `@/*` → `./*`
- **ESLint v9** flat config (`eslint.config.mjs`) — run with `pnpm lint`
- **No testing framework** configured. No CI/CD.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server at `localhost:3000` |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | ESLint (flat config) |
| `pnpm exec tsc --noEmit` | Type-check without emitting |

No typecheck script in `package.json` — use `pnpm exec tsc --noEmit` explicitly.

## Architecture

- **`app/`** — Next.js App Router layout + pages
  - `layout.tsx` — root layout (Poppins font, Navbar)
  - `page.tsx` — home page (Hero + CafeRow sections)
  - `components/` — `Navbar` (client), `Hero`, `CafeRow`, `CafeCard`
- **`lib/utils.ts`** — `cn()` helper (clsx + tailwind-merge)
- **`public/`** — static assets (logo, icons, grain.gif)
- **No database yet** — cafe data is hardcoded in components. Empty `docs/database/db.md`.

## Conventions

- `"use client"` for interactive components (Navbar). Server components by default elsewhere.
- Phosphor icons from `@phosphor-icons/react` — prefer SSR subpath (`@phosphor-icons/react/dist/ssr`) for server components.
- Class merging: use `cn()` from `@/lib/utils` instead of raw `clsx`.
