# Dungeon Cities Resource Finder

Next.js (App Router, TypeScript) app with default dark theme using MUI.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DUNGEONCITIES_TOKEN` in `.env`.
3. Optional: tune `REQUEST_DELAY_MS` to avoid rate limits.

## Sync monster data

This command fetches monster dex entries, then loops each monster detail request with a configurable delay, and writes the checked-in dataset to `src/data/monster-details.json`.

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

Deploy directly to Vercel as a standard Next.js project.
