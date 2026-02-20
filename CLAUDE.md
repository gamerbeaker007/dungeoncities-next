# Dungeon Cities — Claude Project Instructions

## Project Overview
Companion web app for the **Dungeon Cities** blockchain game on Hive.
Players can search resource drops, explore undiscovered monsters, look up forge recipes, and (when authenticated with Hive Keychain) view their own inventory and market listings.

## Tech Stack
- **Next.js 16** — App Router, TypeScript, `src/` layout
- **React 19** — Server Components by default
- **MUI v7** — UI library (`@emotion` for styling, `AppRouterCacheProvider` for SSR)
- **Hive Keychain** — browser-extension-based wallet auth (`keychain-sdk`)
- **Axios + retry-axios** — DC game API client with retry on 5xx/429/408

## Vercel Free Tier Constraints
**Goal: zero runtime compute for public pages.**
- All public pages use `export const dynamic = "force-static"` → built as static HTML, served from CDN.
- **Never use ISR (`revalidate`)** — background revalidation constantly consumes serverless CPU.
- Server Actions only run on explicit user interaction (login, player data fetch).
- No API routes; use Server Actions for server-side logic.

## Rendering Strategy (critical — read before adding pages)

| Page | Strategy | Reason |
|---|---|---|
| `/` Resource Finder | `force-static` | All data from bundled JSON |
| `/forge` Forge Search | `force-static` | All data from bundled JSON |
| `/undiscovered` | `force-static` | All data from bundled JSON |
| `/faq` | Static (no data) | Hardcoded constants |
| Any new public page | `force-static` | Default unless auth-gated |

**Client components** are only used when a component needs:
- `useSearchParams`, `useRouter`, `usePathname`
- Auth context (`useAuth`)
- Browser-only APIs (localStorage, `window.hive_keychain`)
- Interactive state (`useState`, `useEffect`)

## Data Flow

```
src/data/monster-details.json   ← synced by: npm run sync:monster-data
src/data/forge_druantia.json    ← static game data

monster-data.ts → resource-search-data.ts → page.tsx (force-static) → ResourceSearch (client)
monster-data.ts → monster-discovery-data.ts → page.tsx (force-static) → UndiscoveredMonstersList (client)
               → forge-items.ts → page.tsx (force-static) → ForgeResourceSearch (client)
```

All data is bundled at build time. Pages pass data as props to client components which handle filtering/pagination entirely in the browser — no server calls for search.

## Authentication Flow
1. Browser polls for `window.hive_keychain` (Chrome injects extensions late — use `waitForKeychainAvailability`, never synchronous `isKeychainAvailable` in `useEffect`)
2. Server Action `requestAuthChallenge` → DC API `/authenticate`
3. `KeychainSDK.decode()` signs the challenge in the user's wallet
4. Server Action `submitAuthSignature` → DC API → JWT token
5. Token + username stored in `localStorage`; validated via `validateGameTokenAction` on load

## Key Files
- `src/lib/dc-api.ts` — shared axios DC API client (auth, game state, market)
- `src/lib/keychain-auth.ts` — keychain detection + login flow
- `src/providers/auth-provider.tsx` — auth context (token, username, isKeychainInstalled)
- `src/hooks/use-player-items.ts` — fetches player inventory + market listings (authenticated only)
- `src/actions/auth-actions.ts` — Server Actions: challenge + token exchange
- `src/actions/game-actions.ts` — Server Actions: game state, market, location
- `src/lib/statics.ts` — API endpoint URLs

## Conventions
- Server Actions: `"use server"` at top, named `*Action` suffix
- Client components: `"use client"` at top, never `force-static` in client files
- Lib functions are pure (no side effects, no `"use server"`)
- TypeScript strict — no `any`, cast with explicit types
- Prettier + ESLint enforced — run `npm run format:all` before committing
