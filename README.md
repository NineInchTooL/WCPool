# WCPool ⚽

A lightweight World Cup 2026 pool manager. Create a pool, assign teams
to participants via a fair allocation algorithm, track eliminations in
real-time, and share results via WhatsApp — all from a mobile-first
progressive web app.

**Live:** <https://wc-pool-three.vercel.app>

---

## Features

- **Pool creation** — configure participant count (2–12), auto-allocate
  all 48 WC2026 teams across participants using a tiered fairness algorithm
- **Admin panel** — manage participants, run allocation, track eliminations,
  export results as a WhatsApp-ready text block
- **Viewer mode** — shareable read-only link per pool; updates in real-time
  via Supabase Realtime subscriptions
- **Live score sync** — admin can sync current elimination suggestions from
  a live football scores edge function; auto-syncs on open + every 5 min
- **PWA** — installable on Android (Chrome) and iOS (Safari → Share →
  Add to Home Screen)
- **Dark / light mode** — follows system preference, manually toggleable

---

## Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | Vanilla JS, HTML, CSS (no framework)            |
| Auth           | Supabase Auth (Google OAuth)                    |
| Database       | Supabase Postgres                               |
| Realtime       | Supabase Realtime (postgres_changes)            |
| Edge Function  | Supabase Edge Function (`wc-scores`)            |
| Hosting        | Vercel (static)                                 |
| PWA            | Web App Manifest + Service Worker               |

---

## Project Structure

```text
/
├── index.html                        # Single-page app shell + PWA meta tags
├── app.js                            # All application logic (~1 file SPA)
├── styles.css                        # Design system + component styles
├── manifest.json                     # PWA manifest
├── sw.js                             # Service worker (network-first, shell cache)
├── icons/
│   └── icon.svg                      # App icon (⚽ on teal, maskable)
├── supabase/
│   └── functions/
│       └── wc-scores/
│           └── index.ts              # Edge Function: score proxy
└── README.md
```

---

## Database Schema

### Table: `pools`

| Column              | Type          | Notes                              |
| ------------------- | ------------- | ---------------------------------- |
| `id`                | `text` (PK)   | nanoid(6) generated on client      |
| `owner_id`          | `uuid`        | references `auth.users.id`         |
| `title`             | `text`        | pool name, editable inline         |
| `participant_count` | `int`         | configured max (2–12)              |
| `participants`      | `jsonb`       | array of `{ id, name }` objects    |
| `allocation`        | `jsonb`       | `{ participantId: [team, ...] }`   |
| `eliminated_teams`  | `jsonb`       | array of team name strings         |
| `created_at`        | `timestamptz` | auto                               |

### RLS Policies

- `SELECT` — public (anyone with the pool ID can read)
- `INSERT` — authenticated users only (`owner_id = auth.uid()`)
- `UPDATE` — authenticated users where `owner_id = auth.uid()`
- `DELETE` — authenticated users where `owner_id = auth.uid()`

---

## Edge Function: `wc-scores`

Proxies live World Cup match results server-side to keep API keys out
of the browser. Tries football-data.org first; falls back to
worldcup26.ir if the primary fails or returns no data.

**Endpoint:** `GET /functions/v1/wc-scores`  
**Auth:** Supabase anon key (passed via `apikey` header)  
**Response:** array of finished group-stage matches

```json
[
  { "home": "TeamA", "away": "TeamB", "homeScore": 2, "awayScore": 0, "group": "GROUP_A" }
]
```

The admin panel calls this endpoint, builds group standings from the
match data, and surfaces teams with 0 points after 3 games as
clickable elimination suggestion chips. Suggestions are never
persisted automatically — the admin confirms each one.

**Required secret** (set in Supabase Dashboard → Settings → Edge Functions → Secrets):

| Secret                   | Used by           |
| ------------------------ | ----------------- |
| `FOOTBALL_DATA_API_KEY`  | `wc-scores` only  |

---

## Allocation Algorithm

Teams are divided into 4 tiers by FIFA ranking (12 teams each).
Each participant receives a proportional slice across all tiers
to ensure no participant gets all top-tier or all bottom-tier teams.

- Max supported participants: **12**
- Total teams: **48** (WC2026 expanded format)
- Each participant gets: **floor(48 ÷ N)** teams; `48 % N` players get one extra

---

## Local Development

```bash
# No build step — serve the repo root with any static server
npx serve .
# or
python3 -m http.server 8080
```

Supabase credentials (`SUPABASE_URL` and `SUPABASE_ANON_KEY`) are set
as inline globals in `index.html`. These are public anon keys — safe
to commit.

For local OAuth to work, add `http://localhost:8080` as an allowed
redirect URL in your Supabase project's Auth settings.

---

## Deployment

Deployed on Vercel via GitHub integration. Every push to `main`
triggers a new deployment automatically.

```bash
git push origin main   # → Vercel auto-deploys in ~30s
```

No build command or output directory needed — Vercel serves the repo
root as static files.

**Edge Function** must be deployed separately via the Supabase CLI:

```bash
supabase login
supabase functions deploy wc-scores --project-ref <project-ref> --no-verify-jwt
```

After adding or changing secrets in the dashboard, redeploy the
function for changes to take effect.

---

## PWA Installation

**Android (Chrome):** Browser shows "Add to Home Screen" banner
automatically after a few visits.

**iOS (Safari):** Tap Share → "Add to Home Screen" → Add.

The service worker caches the app shell (`/`, `app.js`, `styles.css`,
`manifest.json`) for offline-capable loading. Supabase API calls
always go network-first and are never intercepted by the SW.

---

## Author

Built by [@NineInchTooL](https://github.com/NineInchTooL) for
WC2026 office pools. 🏆
