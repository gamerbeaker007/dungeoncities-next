# Dungeon Cities — Copilot Instructions

## Project
Next.js 16 (App Router) + React 19 + MUI v7 companion app for the Dungeon Cities blockchain game on Hive.
Deployed on **Vercel Hobby (free tier)** — keep runtime compute near zero.

---

## Architecture at a Glance

```
src/
├── app/                    # Next.js App Router pages (all force-static)
│   ├── layout.tsx          # Server component — AppRouterCacheProvider + AppProviders
│   ├── providers.tsx       # "use client" — ThemeProvider + AuthProvider wrapper
│   ├── page.tsx            # / Resource Finder  (force-static)
│   ├── forge/page.tsx      # /forge             (force-static)
│   ├── undiscovered/page.tsx # /undiscovered    (force-static)
│   └── faq/page.tsx        # /faq               (static, no data)
├── actions/                # Server Actions ("use server")
│   ├── auth-actions.ts     # requestAuthChallenge, submitAuthSignature
│   └── game-actions.ts     # getGameStateAction, getAllMarketListingsAction, etc.
├── components/             # UI components (mostly "use client")
│   ├── top-nav.tsx
│   ├── login/
│   ├── resource-search/
│   ├── forge-search/
│   └── undiscovered/
├── hooks/
│   └── use-player-items.ts # Client hook — fetches player inventory + market
├── lib/                    # Pure server-side logic (no "use client")
│   ├── dc-api.ts           # Axios DC game API client (with retry)
│   ├── keychain-auth.ts    # Hive Keychain detection + login
│   ├── resource-search-data.ts
│   ├── monster-discovery-data.ts
│   ├── monster-data.ts
│   ├── forge-items.ts
│   ├── format-utils.ts
│   └── statics.ts          # API endpoint constants
├── providers/
│   └── auth-provider.tsx   # Auth context (token, username, isKeychainInstalled)
├── types/                  # TypeScript types (dc/, forge, resource, monster)
└── data/                   # Bundled JSON (synced offline via npm run sync:monster-data)
    ├── monster-details.json
    └── forge_druantia.json
```

---

## Rendering Rules — Follow These Strictly

### Always `force-static` for public pages
```typescript
// Every page that reads from bundled JSON must have this:
export const dynamic = "force-static";
```
Data is bundled at build time from `src/data/*.json`. Never fetch data at request time in page components.

### Never use ISR
```typescript
// WRONG — causes continuous serverless CPU usage on free tier:
export const revalidate = 3600;

// RIGHT — rebuild + redeploy to update data:
export const dynamic = "force-static";
```

### When to use `"use client"`
Only add `"use client"` when the component needs:
- `useSearchParams` / `useRouter` / `usePathname`
- `useAuth()` from auth-provider
- `useState` / `useEffect` / `useCallback`
- Browser APIs (`localStorage`, `window.hive_keychain`)

Pages themselves stay server components; pass data as props to client components.

---

## Keychain Extension Detection

Chrome injects extensions **after** React hydration. Never do a synchronous check at mount:

```typescript
// WRONG — fails in Chrome, works in Brave:
const keychainAvailable = isKeychainAvailable();

// RIGHT — polls with 2.5s timeout:
const keychainAvailable = await waitForKeychainAvailability();
```

Both are exported from `src/lib/keychain-auth.ts`.

---

## Server Actions Pattern

```typescript
"use server";
// Rules:
// - Named with *Action suffix
// - Validate token before any API call (return null if missing)
// - Never throw to the client — catch and return null or error shape
// - Call lib/dc-api.ts functions, never call the DC API directly

export async function getSomeDataAction(token: string): Promise<SomeResponse | null> {
  if (!token) return null;
  try {
    return await getSomeData({ token });
  } catch (error) {
    console.error("getSomeDataAction failed", error);
    return null;
  }
}
```

---

## DC API Client (`src/lib/dc-api.ts`)

- Shared axios instance with retry-axios (3 retries, exponential backoff)
- Retries: HTTP 408, 429, 5xx only
- Application-level errors (`success: false` in response body) are **not** retried — surface immediately
- All game calls go through `postDcApiAction<T>()` with a typed payload union

---

## Auth Flow Summary

```
1. waitForKeychainAvailability()     ← polls window.hive_keychain (handles Chrome latency)
2. requestAuthChallenge(username)    ← Server Action → DC API /authenticate
3. KeychainSDK.decode()              ← signs challenge in user's Hive wallet
4. submitAuthSignature(username, sig) ← Server Action → DC API → JWT token
5. store token + username in localStorage
6. validateGameTokenAction(token)    ← called on app load to check token validity
```

---

## MUI + SSR Setup

- `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter` wraps the app in `layout.tsx`
- `ThemeProvider` and `CssBaseline` are in `providers.tsx` (`"use client"`)
- Never import MUI components in server components without checking if they need client context
- Custom theme defined in `src/app/theme.ts`

---

## Code Conventions

| Rule          | Detail                                                                           |
|---------------|----------------------------------------------------------------------------------|
| TypeScript    | Strict — no `any`. Cast with explicit named types.                               |
| Naming        | Server Actions: `*Action`. Hooks: `use*`. Types in `src/types/`.                 |
| Formatting    | Prettier — run `npm run format` before committing                                |
| Linting       | ESLint — run `npm run lint` or `npm run format:all`                              |
| Imports       | Alias `@/` maps to `src/`                                                        |
| API constants | Always use `API_ENDPOINTS` from `src/lib/statics.ts`                            |
| Data sync     | Update `src/data/*.json` via `npm run sync:monster-data` (needs `.env` + token) |

---

## External APIs

| Endpoint | Usage |
|---|---|
| `https://api.dungeoncities.com/api/user/authenticate` | Auth challenge + token exchange |
| `https://api.dungeoncities.com/api/game/action` | Game state, inventory, market, location |
| `https://images.hive.blog/u/{username}/avatar` | User avatar images (via next/image) |

---

## Vercel Free Tier Checklist

Before adding any new feature, verify:
- [ ] Public pages: `force-static` — no runtime server execution
- [ ] No `revalidate` or ISR on any page
- [ ] Server Actions only triggered by explicit user actions (not on timer/interval)
- [ ] No new API routes — use Server Actions instead
- [ ] `next/image` for all external images (bandwidth optimization)
