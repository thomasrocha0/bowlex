# Bowling Stat Tracker

See [CLAUDE.md](./CLAUDE.md) for the intended architecture, data model, and conventions.

## Prerequisites

- Node.js (LTS)
- The [Expo Go](https://expo.dev/go) app on your phone, or an Android/iOS simulator, for running on-device
- A [Supabase](https://supabase.com) project (free tier is fine)

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Copy the env template and fill in your Supabase project's URL and anon key (found in Project Settings → API):

   ```
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   ```

   The app won't start without these — `src/lib/supabase.ts` throws on missing config rather than failing silently later.

## Running the app

```
npm start
```

This opens the Expo dev tools. From there, scan the QR code with Expo Go, or press `a` / `i` to launch an Android/iOS simulator. Platform-specific shortcuts:

```
npm run android
npm run ios
npm run web
```

## Testing

Scoring and frame-validation logic (`src/lib/scoring.ts`) is unit tested — this is the highest-risk logic in the app, so keep it covered as it changes.

```
npm test
```

## Type checking

```
npx tsc --noEmit
```

## Project structure

```
src/
  screens/       # auth, games, stats, social, profile — one folder per feature area
  navigation/     # React Navigation stack + route param types
  hooks/          # React Query hooks wrapping the Supabase client (useGames, useFriends, ...)
  store/          # Zustand stores for local-only UI state
  lib/            # Supabase client, scoring/stat calculation functions
  types/          # Database types (stand-in for `supabase gen types`) and shared domain types
supabase/
  migrations/     # SQL migrations (schema, RLS policies, views, functions)
  functions/      # Edge Functions, if/when needed
```

## Backend

The database schema itself isn't created yet — `src/types/database.ts` is a hand-written stand-in for what `supabase gen types typescript` will eventually produce. Once real migrations exist under `supabase/migrations/`, regenerate the types against your project:

```
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```
