# Bowling Stat Tracker

A mobile app for tracking bowling scores, stats, and league play, built with React Native and a remote (cloud-hosted) backend. Users create an account, log games frame-by-frame, and get computed stats (averages, strike/spare rates, trends) synced across devices. Users can also connect with friends and view each other's stats.

This project is in early planning/scaffolding — this file describes the intended architecture and will be updated as implementation decisions are finalized.

## Tech Stack

- **Client**: React Native via Expo (managed workflow), TypeScript
- **Navigation**: React Navigation
- **Server state / caching**: TanStack Query (React Query) over the Supabase client
- **Local UI state**: Zustand
- **Validation**: Zod
- **Backend**: Supabase (Postgres, Auth, Row Level Security, Realtime, Storage)
- **Auth**: Supabase Auth — email/password + magic link, optionally Google/Apple OAuth (Apple Sign-In required by App Store if other social logins are offered)
- **Builds/deploy**: EAS Build / EAS Submit

### Why Supabase over Firebase

Bowling data is relational: bowler → league → series → game → 10 frames, each with individual rolls. Postgres joins and foreign keys map directly to this domain. Firestore's document model would force denormalization for cross-entity queries like "average across all league games this season." Supabase also gives per-row auth enforcement via Row Level Security, so "a user can only read/write their own games" is enforced at the database layer, not just in app code.

## Data Model (planned)

- `profiles` — one per authenticated user, linked to `auth.users`; includes a `stats_visibility` setting (`public` / `friends_only` / `private`, default `friends_only`)
- `leagues` — optional grouping; a user can belong to multiple
- `series` — a set of games bowled in one session (typically 3 games in league play)
- `games` — one game, belongs to a series and a profile
- `frames` — 10 per game, storing individual roll/pin data needed to compute scores
- `friendships` — a connection between two profiles: `requester_id`, `addressee_id`, `status` (`pending` / `accepted`), timestamps. Declining a request deletes the row outright (no persisted "declined" state) — see below.
- `blocks` — a one-directional `blocker_id` blocks `blocked_id` relationship, kept as its own table rather than a `friendships` status since it has no acceptance step and must coexist independently of whatever friendship/request state already exists between the two users

By default, tables are scoped to the owning user via RLS policies keyed on `auth.uid()`. The social feature is the one deliberate exception — see below.

### Friend request rules

- Anyone can send a friend request. Declining deletes the row entirely, as if nothing happened.
- At most one *pending* row per ordered pair, but both directions can be pending at once (A invited B and B invited A, independently) — enforced by a partial unique index on `(requester_id, addressee_id) where status = 'pending'`.
- Accepting a request converts that row to `accepted` and deletes the reverse pending row (if one existed), so a pair ends up with exactly one row. This happens atomically via the `accept_friend_request` Postgres function rather than a plain client-side update, since it's a two-statement operation. At most one *accepted* row per unordered pair — enforced by a second partial unique index.
- Either party can unfriend, which deletes the row — the same delete covers unfriending, cancelling an outgoing request, and declining an incoming one.

### Blocking

- Blocking (`block_user` Postgres function) atomically inserts into `blocks` and deletes any existing `friendships` row between the two users, so "blocked" is a clean, exclusive state.
- Only the blocker can remove their own block; the blocked party has no RLS access to the `blocks` table at all.
- A blocker's profile — and any `friendships` row between the two — becomes invisible to the person they blocked (checked via a `security definer` `is_blocked_by` function). This is one-directional: the blocker still sees the blocked party normally, since they need to find them again to unblock.
- Enforcement is implemented as **invisibility, not write-rejection**: sending a friend request to someone who blocked you still succeeds at the database level, but the resulting row is permanently hidden from both parties (the `friendships` SELECT policy hides a row from both parties if a block exists between them in either direction). This is deliberate — rejecting the insert would let a blocked user distinguish "blocked" from "not blocked" by the specific error they get back, which defeats the purpose of hiding the block in the first place.

### Social data access

- `friendships` rows are readable by either party (`requester_id = auth.uid() OR addressee_id = auth.uid()`), unless a block exists between them (see above). Only the addressee can move `pending` to `accepted`, and only via `accept_friend_request`; all other transitions are deletes, not updates.
- Raw `games`/`frames` rows stay owner-only — friends never get direct table access to another user's roll-by-roll data.
- "View a friend's stats" goes through a security-definer Postgres function (or a view built on one) that checks for an `accepted` friendship (and the target's `stats_visibility`) before returning aggregated stats. This keeps the trust boundary at computed stats, not raw frames, and keeps the friend-check logic in one place instead of duplicated across RLS policies.
- `stats_visibility = private` short-circuits the function for everyone but the owner; `public` skips the friendship check.

## Core Logic Notes

- Bowling scoring (strikes, spares, 10th-frame bonus rolls) is the highest-risk logic in the app — validate frame input client-side before writing, and cover the scoring calculation with unit tests.
- Stats (average, high game/series, strike %, spare %, open-frame %) are derived from `frames`/`games` data, not stored redundantly — compute on read or via a Postgres view, not duplicated in application state.
- Friend-facing stats reuse the same calculation functions as the owner's own stats view — there should be one source of truth for "how a stat is computed," parameterized by whose data it's reading, not a second implementation for the social view.

## Social Features (planned)

- Users find each other by username/handle (not email, to avoid turning the friend search into an email-enumeration oracle) and send a friend request.
- A friendship becomes mutual once the addressee accepts; either side can remove a friend, and either side can block the other, afterward. See "Friend request rules" and "Blocking" above.
- The friends list surfaces each connection's headline stats (average, recent trend) with a drill-in to their full stats view, gated by `stats_visibility` as described above.
- Out of scope for v1: activity feeds, comments/reactions, in-app messaging, and league-wide leaderboards — these compound the privacy surface (whose data is visible to whom, and how) and should wait until the friendship/visibility model has proven out.

## Offline Behavior

Bowling alleys often have poor connectivity. V1 relies on React Query's cache and optimistic updates to tolerate flaky connections. True offline-first (log a full game with zero signal, sync later) is not in scope for v1 — if it becomes a hard requirement, evaluate expo-sqlite as a local write queue rather than building it preemptively.

## Conventions

- TypeScript everywhere; no implicit `any`.
- Data access goes through React Query hooks (e.g. `useGames`, `useCreateGame`, `useFriends`, `useFriendRequests`, `useSendFriendRequest`, `useAcceptFriendRequest`, `useRemoveFriendship`, `useBlockUser`, `useFriendStats`) wrapping the typed Supabase client — no direct Supabase calls scattered in components.
- Keep scoring/stat calculation logic in plain, unit-testable functions separate from UI components.
