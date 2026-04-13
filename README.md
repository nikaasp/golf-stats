# Golf Stats

Golf Stats is a React + Vite app for logging rounds hole by hole, saving shot-by-shot data, and reviewing trends like strokes gained, fairways, GIR, putts, and miss patterns.

## What the app does

- Start a round on a saved course or create a new course.
- Log each hole shot by shot with lie, distance, miss pattern, strike quality, and penalties.
- Save course par and hole-length data as you play.
- Review completed rounds with scorecards, strokes gained, and miss-pattern charts.
- Explore round-to-round analytics for SG, fairway/GIR percentage, and putts.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Supabase values:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

3. Start the app:

```bash
npm run dev
```

## Scripts

- `npm run dev` starts the Vite dev server.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm run test` runs the utility test suite with Node's built-in test runner.
- `npm run preview` previews the production build locally.

## Project notes

- The live round flow is currently centered on shot-by-shot entry.
- Supabase config is loaded from Vite environment variables.
- The tests focus on the golf logic in `src/utils`, which is where the most important derived stats live.
