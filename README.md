# WCPool — World Cup 2026 Pool Manager

A lightweight single-page web app for managing informal World Cup betting
pools among friends. Live at https://wc-pool-three.vercel.app

## Features

- Google OAuth sign-in (no passwords stored)
- Create up to 10 pools per account
- Add 2–48 participants per pool
- Automatic team allocation algorithm:
  - 48 FIFA World Cup 2026 teams split across 4 tiers
  - Tier-balanced distribution: every player gets teams from all 4 tiers
  - Guarantees `floor(48/N)` teams per player; `(48 % N)` players get one extra
  - Fully correct for all N in [2, 48]; N > 12 is noted in code comments
- Real-time elimination tracker (updates across all open viewers instantly)
- Viewer mode: shareable public link — no login required to view a pool
- Admin mode: owner-only panel for managing participants, allocation, and eliminations
- WhatsApp export: copy formatted pool results to share in a chat
- Dark / light theme toggle (persists via localStorage)
- Mobile-responsive design

## Tech Stack

- **Frontend:** Vanilla JS, HTML, CSS (no framework, no build step)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Realtime)
- **Hosting:** Vercel (static deployment)
- **Auth:** Google OAuth via Supabase Auth

## Project Structure

```
/
├── index.html       # App shell + Supabase config
├── app.js           # All routing, views, and business logic (~900 lines)
└── styles.css       # All styles, dark/light mode, mobile responsive
```

## Database Schema (Supabase)

**Table: `pools`**

| Column | Type | Notes |
|---|---|---|
| id | text (PK) | 6-char nanoid |
| owner_id | uuid (FK → auth.users) | Pool owner |
| title | text | Pool display name |
| participant_count | int | Target number of participants |
| participants | jsonb | Array of `{ id, name, extraTeam }` |
| allocation | jsonb | Map of `participantId → team[]` |
| allocation_locked | bool | Prevents re-allocation when true |
| eliminated_teams | jsonb | Array of eliminated team identifier strings |
| team_set | text | Always `"WC2026"` for now |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Updated on save |

**Table: `profiles`**

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, FK → auth.users) | |
| display_name | text | From Google OAuth metadata |
| avatar_url | text | From Google OAuth metadata |

## Row Level Security

- `pools`: Public SELECT (viewer mode); INSERT/UPDATE/DELETE restricted to `owner_id = auth.uid()`
- `profiles`: Public SELECT; INSERT/UPDATE restricted to own row

## Local Development

No build step required. Serve the root directory with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open http://localhost:8080. Note: Google OAuth `redirectTo` is hardcoded to
the Vercel URL — for local dev you'll need to add `http://localhost:8080` as an
allowed redirect URL in your Supabase project's Auth settings.

## Allocation Algorithm

See the `allocate()` function in `app.js`. Three phases:

1. **Tier base rounds** — `floor(12/N)` teams per tier to every player (guarantees tier balance)
2. **Extra base rounds** — fills the gap between tier-base total and `floor(48/N)` using leftover cross-tier teams, one per player per round
3. **Final partial round** — one extra team to exactly `48 % N` players

## Notes

- The Supabase anon key in `index.html` is public/publishable by design — safe for client-side use
- Pool IDs are 6-char nanoids (case-sensitive alphanumeric, ~56 billion combinations)
- Realtime uses Supabase Postgres Changes on UPDATE events only

## Author

Built by [NineInchTooL](https://github.com/NineInchTooL) for family and friends during the World Cup 2026 🏆
