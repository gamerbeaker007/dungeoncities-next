# Dungeon Cities Companion

Next.js (App Router, TypeScript) companion app for the Dungeon Cities blockchain game on Hive. Built with MUI and deployed as fully static pages on Vercel.

## Features

- **Resource Finder** — search which monsters drop which resources, with drop rates and encounter counts
- **Forge Search** — look up forge recipes and required resources
- **Undiscovered Monsters** — browse monsters the community hasn't fully mapped yet
- **Community Monster Dex** — aggregated discovery data stored in Supabase Storage; any authenticated player can contribute by syncing their monster dex
- **Personal Monster Dex Sync** — authenticated players sync their own dex via Hive Keychain; data is saved locally and uploaded to the shared community dataset

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (community dex) | Supabase project URL (or `http://127.0.0.1:54321` for local) |
| `SUPABASE_SECRET_KEY` | Yes (community dex) | Supabase secret key — bypasses RLS, **server-side only** |

## Supabase Setup (Community Dex)

The community dex stores a single `combined.json` file in a Supabase Storage bucket. No database tables or RLS policies are needed.

### Cloud (production)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Storage** → create a bucket named `monster-dex` (private).
3. Copy the **Project URL** and **Secret** key (formerly *service_role*) from **Project Settings → API**.
4. Add both to your Vercel environment variables.

### Local development

Requires [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.

```bash
npx supabase start          # starts local Supabase stack
```

This prints a local URL and keys — copy the `API URL` and `service_role key` into `.env`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SECRET_KEY=<service_role key from supabase start output>
```

Create the storage bucket in the local dashboard at `http://127.0.0.1:54323` → **Storage** → new bucket `monster-dex`.

> Without Supabase configured, the community dex tab will show a warning and fall back to the current player's local sync data.

## Sync bundled monster data

Fetches the full monster dex and writes it to `src/data/monster-details.json` (checked into the repo). Re-run whenever new monsters are added to the game.

```bash
npm run sync:monster-data
```

## Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

## Deploy

Deploy directly to Vercel as a standard Next.js project. All public pages are `force-static` — no serverless compute on the free tier. Server Actions only run on explicit user interactions (login, dex sync).
