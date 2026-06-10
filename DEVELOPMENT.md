# WCPool — Full Development Documentation

> **Live app:** https://wc-pool-three.vercel.app
> **Repository:** https://github.com/NineInchTooL/WCPool
> **Built by:** NineInchTooL (Oscar Salazar) with Claude (Sonnet 4.6) in VS Code, June 8–10 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Supabase Setup](#4-supabase-setup)
5. [Full Commit History](#5-full-commit-history)
6. [Feature Build Log & Claude Prompts](#6-feature-build-log--claude-prompts)
7. [Bugs Encountered & Fixes](#7-bugs-encountered--fixes)
8. [Security Notes](#8-security-notes)
9. [Deployment](#9-deployment)
10. [Future Ideas](#10-future-ideas)

---

## 1. Project Overview

**WCPool** is a World Cup 2026 pool manager for a friend/family group. It allows an admin to:

- Add up to 10 participants
- Fairly allocate all 48 World Cup 2026 teams across participants (balanced by tier)
- Lock the allocation to prevent re-randomizing
- Track team eliminations as the tournament progresses
- Export the full allocation as a WhatsApp-ready text

Participants (viewers) open the same URL and see the allocation in real time — no login required for viewing.

### Team Tier System

Teams are divided into 4 tiers of 12 teams each:

| Tier | Label | Color | Teams |
|------|-------|-------|-------|
| 1 | Favoritos | ⭐ | Argentina, Francia, Inglaterra, Brasil, España, Alemania, Portugal, Países Bajos, Bélgica, Uruguay, Colombia, Estados Unidos |
| 2 | Contendientes | 🔵 | México, Croacia, Suiza, Senegal, Japón, Marruecos, Corea del Sur, Ecuador, Austria, Turquía, Canadá, Suecia |
| 3 | Intermedios | 🟢 | Australia, Noruega, Paraguay, Túnez, Bosnia y Herzegovina, Ghana, República Checa, Escocia, Costa de Marfil, Argelia, Irán, Egipto |
| 4 | Sorpresas | ⚪ | Arabia Saudita, Sudáfrica, Irak, Jordania, Catar, Uzbekistán, Curazao, Haití, Panamá, Nueva Zelanda, Rep. Democrática del Congo, Cabo Verde |

### Fair Allocation Algorithm

With 10 players and 48 teams (12 per tier):
- Base = 4 teams per player (1 per tier — **guaranteed**)
- Extras = 8 players get a 5th team (from remaining pool)

The algorithm guarantees **every player gets exactly 1 Tier 1, 1 Tier 2, 1 Tier 3, 1 Tier 4 team**. The 5th team for the 8 "big group" players is drawn randomly from the 8 leftover teams (2 per tier).

---

## 2. Tech Stack

| Layer          | Technology                                                  |
|----------------|-------------------------------------------------------------|
| Frontend       | Vanilla HTML + CSS + JavaScript (no framework)              |
| Auth           | Supabase Auth (Google OAuth)                                |
| Database       | [Supabase](https://supabase.com) — PostgreSQL               |
| Realtime       | Supabase Realtime (postgres_changes)                        |
| Edge Function  | Supabase Edge Function (`wc-scores`)                        |
| Hosting        | [Vercel](https://vercel.com) — auto-deploy from GitHub      |
| PWA            | Web App Manifest + Service Worker                           |
| i18n           | Custom `t()` system — en-US, es-MX, pt-PT                   |
| Source control | GitHub                                                      |
| Development    | VS Code + Claude (Sonnet 4.6) via Claude Code extension     |

---

## 3. Architecture

### Files

```
WCPool/
├── index.html              — App shell, Supabase CDN, PWA meta tags
├── app.js                  — All app logic: auth, routing, state,
│                             allocation, i18n, rendering
├── styles.css              — Design system + component styles
├── manifest.json           — PWA manifest (installable)
├── sw.js                   — Service worker (network-first, shell cache)
├── favicon.svg             — SVG logo (⚽ on teal)
├── icons/
│   └── icon.svg            — Maskable PWA icon
├── supabase/
│   └── functions/
│       └── wc-scores/
│           └── index.ts    — Score proxy edge function
└── vercel.json             — SPA routing (all → index.html)
```

### State Shape

The app is a multi-pool SPA. Each pool is a row in the `pools` table.
The pool object shape (from DB):

```js
{
  id:                string,    // nanoid(6), client-generated
  owner_id:          uuid,      // auth.users.id
  title:             string,    // editable inline
  participant_count: number,    // 2–12, configured at creation
  participants:      [{ id, name, extraTeam }],
  allocation:        { [participantId]: [{ name, tier }] } | null,
  allocation_locked: boolean,
  eliminated_teams:  string[],  // canonical Spanish team names
  created_at:        timestamptz,
}
```

### Supabase Table: `pools`

| Column              | Type          | Notes                          |
|---------------------|---------------|--------------------------------|
| `id`                | `text` PK     | nanoid(6), client-generated    |
| `owner_id`          | `uuid`        | references auth.users.id       |
| `title`             | `text`        | editable pool name             |
| `participant_count` | `int`         | 2–12                           |
| `participants`      | `jsonb`       | `[{ id, name, extraTeam }]`    |
| `allocation`        | `jsonb`       | `{ participantId: [...] }`     |
| `allocation_locked` | `boolean`     | prevents re-randomizing        |
| `eliminated_teams`  | `jsonb`       | `string[]` of Spanish names    |
| `created_at`        | `timestamptz` | auto                           |

### RLS Policies

- `SELECT` — public (anyone with pool ID can read)
- `INSERT` — authenticated; `owner_id = auth.uid()`
- `UPDATE` — authenticated; `owner_id = auth.uid()`
- `DELETE` — authenticated; `owner_id = auth.uid()`

### Real-Time Sync

```js
db.channel(`pool-${poolId}`)
  .on('postgres_changes', {
    event: 'UPDATE', schema: 'public', table: 'pools',
    filter: `id=eq.${poolId}`
  }, payload => {
    // parse JSON fields (Realtime returns raw strings)
    const updated = payload.new;
    if (typeof updated.allocation === 'string')
      updated.allocation = JSON.parse(updated.allocation);
    if (typeof updated.eliminated_teams === 'string')
      updated.eliminated_teams = JSON.parse(updated.eliminated_teams);
    if (typeof updated.participants === 'string')
      updated.participants = JSON.parse(updated.participants);
    renderViewerContent(updated);
  })
  .subscribe();
```

Each pool's viewer subscribes only to changes for that pool's row.
JSON fields must be manually parsed — Realtime payloads return raw
strings even for JSONB columns.

### Routing

Hash-based SPA router with 4 routes:

| Hash                    | View        | Auth required       |
|-------------------------|-------------|---------------------|
| `#/`                    | Dashboard   | ✅ yes              |
| `#/pool/:id`            | Viewer      | ❌ no               |
| `#/pool/:id/admin`      | Admin panel | ✅ yes (owner only) |
| (no hash / unmatched)   | Landing     | ❌ no               |

`router()` is called on `hashchange` and on initial load.
All navigation uses `location.hash = ...` — no server routing needed.

### i18n System

All user-facing strings pass through `t(key, ...args)`:

```js
function t(key, ...args) {
  const val = TRANSLATIONS[currentLocale][key];
  return typeof val === 'function' ? val(...args) : val ?? key;
}
```

- `TRANSLATIONS` — object with `en-US`, `es-MX`, `pt-PT` keys,
  each containing ~60 string or function entries
- `TEAM_NAMES_I18N` — Spanish→locale display maps for all 48 teams
- `localTeamName(nameEs)` — display-only translation; DB always stores
  the canonical Spanish team name
- Locale auto-detected from `navigator.language`, persisted to
  `localStorage` as `wcpool_locale`
- `setLocale(locale)` persists + calls `router()` to re-render

---

## 4. Supabase Setup

### Create the table

```sql
create table pools (
  id                text primary key,
  owner_id          uuid references auth.users not null,
  title             text,
  participant_count int,
  participants      jsonb default '[]',
  allocation        jsonb,
  allocation_locked boolean default false,
  eliminated_teams  jsonb default '[]',
  created_at        timestamptz default now()
);
```

### Enable RLS

```sql
alter table pools enable row level security;

-- Public read (anyone with the pool ID can view)
create policy "Public read" on pools
  for select using (true);

-- Owner insert
create policy "Owner insert" on pools
  for insert with check (auth.uid() = owner_id);

-- Owner update
create policy "Owner update" on pools
  for update using (auth.uid() = owner_id);

-- Owner delete
create policy "Owner delete" on pools
  for delete using (auth.uid() = owner_id);
```

### Enable Realtime

In Supabase Dashboard → Database → Replication → enable `pools` table
for INSERT and UPDATE events.

### Auth setup

In Supabase Dashboard → Authentication → Providers → enable Google.
Add your Google OAuth Client ID and Secret.
Add allowed redirect URLs:

- `https://wc-pool-three.vercel.app`
- `http://localhost:8080` (for local dev)

### Edge Function secret

In Supabase Dashboard → Settings → Edge Functions → Secrets:

| Secret                  | Used by      |
|-------------------------|--------------|
| `FOOTBALL_DATA_API_KEY` | `wc-scores`  |

---

## 5. Full Commit History

| # | SHA | Date | Message |
|---|-----|------|---------|
| 1 | [c7c8c29](https://github.com/NineInchTooL/WCPool/commit/c7c8c29bb2804f37625492a08a4877555e841a91) | 2026-06-09 | Initial commit: World Cup 2026 Pool app |
| 2 | [df47ed4](https://github.com/NineInchTooL/WCPool/commit/df47ed43629c8e9f1a5c1ef1b7ab20457bc04712) | 2026-06-09 | Remove hardcoded password; add first-run setup flow |
| 3 | [b9f4804](https://github.com/NineInchTooL/WCPool/commit/b9f48044cfb08928c11612ce87540e83e43c5b64) | 2026-06-09 | Apply 5 UI/UX fixes |
| 4 | [091f4c3](https://github.com/NineInchTooL/WCPool/commit/091f4c380589438887d0df9fafde0d2289b92f20) | 2026-06-09 | Add vercel.json, rename entry to index.html, inject Supabase CDN placeholders |
| 5 | [a1a71a0](https://github.com/NineInchTooL/WCPool/commit/a1a71a03015c6e33f1f32408245c62ff5af39159) | 2026-06-09 | Remove old world-cup-pool.html |
| 6 | [148218d](https://github.com/NineInchTooL/WCPool/commit/148218d4171c454e1579f451e23a16fcafbff324) | 2026-06-09 | Fill in real Supabase URL and anon key in index.html |
| 7 | [d7b3b81](https://github.com/NineInchTooL/WCPool/commit/d7b3b81900bb2364dc966ebae5ed92ae8508961c) | 2026-06-09 | Migrate persistence from localStorage to Supabase |
| 8 | [2fbde39](https://github.com/NineInchTooL/WCPool/commit/2fbde39657a7e9281da737d53de8ff88c4b6e617) | 2026-06-09 | Fix Admin button: use password_set flag from Supabase |
| 9 | [fcd1e9b](https://github.com/NineInchTooL/WCPool/commit/fcd1e9b2bf3055a982672975df4ac82b6df553e5) | 2026-06-09 | Fix crash: rename local supabase var to db to avoid global collision |
| 10 | [a64e8d6](https://github.com/NineInchTooL/WCPool/commit/a64e8d62f8557ebf16d1f00289a893cf880f3b38) | 2026-06-09 | Add prominent pool title hero and NineInchTooL branding |
| 11 | [3cbff91](https://github.com/NineInchTooL/WCPool/commit/3cbff91d4b7dd545383b20c00c53fa16773721a1) | 2026-06-09 | Add team elimination tracker |
| 12 | [b085d9c](https://github.com/NineInchTooL/WCPool/commit/b085d9c2ac67dcacfdfb5977232c113fcd6da431) | 2026-06-09 | Fix allocation algorithm to guarantee balanced tier distribution |
| 13 | [24b05fd](https://github.com/NineInchTooL/WCPool/commit/24b05fd) | 2026-06-09 | Rewrite app with Supabase Auth, multi-pool dashboard, and hash routing |
| 14 | [f081554](https://github.com/NineInchTooL/WCPool/commit/f081554) | 2026-06-09 | feat: v2 multi-pool architecture with Supabase Auth + hash routing |
| 15 | [82b67b1](https://github.com/NineInchTooL/WCPool/commit/82b67b1) | 2026-06-09 | feat: live score sync via football-data.org with worldcup26.ir fallback |
| 16 | [0cbf103](https://github.com/NineInchTooL/WCPool/commit/0cbf103) | 2026-06-09 | feat: PWA manifest + service worker + app icon |
| 17 | [91a86f0](https://github.com/NineInchTooL/WCPool/commit/91a86f0) | 2026-06-09 | design: visual uplift — Syne/Inter fonts, SVG logo, premium surfaces |
| 18 | [6baac35](https://github.com/NineInchTooL/WCPool/commit/6baac35) | 2026-06-09 | fix: apple-touch-icon points to favicon.svg |
| 19 | [e292203](https://github.com/NineInchTooL/WCPool/commit/e292203) | 2026-06-09 | docs: full project README — schema, stack, PWA, deployment |
| 20 | [adb27dd](https://github.com/NineInchTooL/WCPool/commit/adb27dd) | 2026-06-09 | docs: add thorough DEVELOPMENT.md with full build history |
| 21 | [3048c2f](https://github.com/NineInchTooL/WCPool/commit/3048c2f) | 2026-06-09 | polish: mobile nav, realtime json parse, elim chip debounce, alloc card status |
| 22 | [abf0773](https://github.com/NineInchTooL/WCPool/commit/abf0773) | 2026-06-10 | feat: full i18n — en-US, es-MX, pt-PT with locale switcher |

---

## 6. Feature Build Log & Claude Prompts

This section documents every feature built, the problem it solved, and the exact prompt used with Claude.

---

### Feature 1 — Initial App

**What:** Static vanilla HTML/CSS/JS app with fair team allocator, admin mode, localStorage persistence, and WhatsApp export.

**Claude prompt used:**
```
Build a World Cup 2026 pool manager web app using only HTML, CSS, and JavaScript vanilla.
Requirements:
- 48 teams divided into 4 tiers of 12 teams each (by strength)
- Admin can add up to 10 participants
- Fair allocation: each participant gets 1 team per tier as base (4 teams),
  with some participants getting a 5th team
- Admin password protection (hardcoded initially)
- WhatsApp export button that copies formatted text to clipboard
- Persist state to localStorage
- Clean, mobile-friendly UI
Keep code in a single HTML file with embedded CSS and JS.
```

---

### Feature 2 — First-Run Password Setup

**What:** Replace hardcoded password with a first-run setup modal. On first Admin click with no password set, show a "create password" modal instead of a login prompt.

**Claude prompt used:**
```
Remove the hardcoded admin password from the source code.
Instead, implement a first-run setup flow:
- On first click of the Admin button (when no password exists in localStorage),
  show a modal asking the user to set a new password with confirmation field
- Store the password only in localStorage under key 'wc2026_pool_password'
- On subsequent Admin clicks, show the normal login modal
- Add a one-time dismissible warning banner explaining the password is stored
  in plain text in localStorage and should not be a reused password
```

---

### Feature 3 — 5 UI/UX Fixes

**What:** Five improvements applied in one commit.

**Claude prompt used:**
```
Apply these 5 fixes to the World Cup pool app:

1. Translate any remaining hardcoded Spanish UI strings to English
2. Fix the team distribution hint text to accurately describe the 4-team base + extra logic
3. Add inline editing for participant rows: clicking an edit icon (✏️) transforms
   the row into an editable input with name field, extraTeam checkbox, Save and Cancel buttons.
   Enter key saves, Escape cancels.
4. Add allocation lock/unlock: a "Lock allocation" button that disables the Allocate and
   Clear buttons when locked. Show a visible lock badge. Persist locked state to localStorage.
5. Show a one-time dismissible warning banner about plain-text password storage in localStorage.
   Banner should only appear after admin sets or changes their password.
```

---

### Feature 4 — Vercel Deployment Setup

**What:** Add `vercel.json`, rename entry file to `index.html`, prepare for Supabase integration.

**Claude prompt used:**
```
Prepare the app for Vercel deployment and Supabase integration:
1. Rename the main HTML file to index.html
2. Create a vercel.json that routes all requests to index.html (SPA routing)
3. Add the Supabase CDN script tag to index.html:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
4. Add two global JS config variables as placeholders in a <script> tag in index.html:
   window.SUPABASE_URL = 'YOUR_SUPABASE_URL'
   window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
   (These will be filled in manually after Supabase project is created)
5. Do not wire up any Supabase logic yet — just prepare the scaffolding
```

---

### Feature 5 — Migrate Persistence to Supabase

**What:** Replace all localStorage state with Supabase. Password stays in localStorage only. Add real-time subscription so all viewers update instantly.

**Claude prompt used (via Claude's own summary of changes):**
```
Migrate all app state persistence from localStorage to Supabase.

Requirements:
- Create a Supabase table called pool_state with a single row (id = 'singleton')
  containing: title, participants (JSONB), allocation (JSONB),
  allocation_locked (BOOLEAN), updated_at (TIMESTAMPTZ)
- saveState() should become async and upsert to pool_state on every save
- loadState() should become async and read from pool_state on init
- The admin password must NEVER be sent to Supabase — keep it in localStorage only
- All event handlers that call saveState() must be made async and await the call
- Rename renderAll() to render() (required by real-time callback naming convention)
- Replace the DOMContentLoaded init with an async IIFE that awaits loadState()
  before the first render()
- Add a Supabase real-time subscription at the end of init:
  Listen for UPDATE events on pool_state table.
  When triggered, update local state from payload.new and call render().
- Add a security comment at the top of app.js explaining the password model
```

---

### Feature 6 — Fix Admin Button (password_set flag)

**What:** Admin button did nothing on non-admin devices because `state.password` was empty (localStorage only). Fixed by storing `password_set: boolean` in Supabase.

**Root cause:** The Admin button checked `state.password` to decide whether to show setup or login modal. But the password only exists in the admin's localStorage — all other devices had `state.password = null`, so they got the setup modal. Clicking Cancel on the setup modal had no visible effect, making the button appear broken.

**Claude prompt used:**
```
Fix the Admin button — it does nothing on non-admin devices.

Root cause: The Admin toggle checks state.password to decide whether to show
the setup modal or login modal. But state.password is loaded from localStorage,
which is empty on every device except the admin's. So all participants get the
setup modal, and clicking Cancel makes it disappear with no feedback — looks broken.

Fix:
1. Add a new state field: passwordSet: boolean (default false)
2. In saveState(), include password_set: !!state.password in the Supabase upsert
   (boolean only — the actual password never goes to Supabase)
3. In loadState(), read state.passwordSet = data.password_set ?? false
4. Change the Admin toggle condition from:
     if (!state.password)  →  show setup modal
   to:
     if (!state.passwordSet)  →  show setup modal
   This way ALL devices correctly show the login modal once a password has been set,
   because passwordSet comes from Supabase (shared across all devices).
5. In trySetup(), also set state.passwordSet = true after setting the password
6. In save-settings-btn handler, also set state.passwordSet = true if pw is set
7. In the real-time subscription callback, sync state.passwordSet = d.password_set

Also run this SQL in Supabase:
  ALTER TABLE pool_state ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false;
```

---

### Feature 7 — Fix JS Crash (supabase variable collision)

**What:** Entire app was dead — no buttons worked. Console showed `Uncaught SyntaxError: redeclaration of non-configurable global property supabase`.

**Root cause:** The Supabase CDN script registers `window.supabase` as a non-configurable global. Then `app.js` declared `const supabase = window.supabase.createClient(...)`, which attempted to redeclare the existing global — throwing a SyntaxError that killed the entire script before any event listeners attached.

**Claude prompt used:**
```
There is a critical JS crash in app.js that prevents the entire app from running.
The browser console shows:
  Uncaught SyntaxError: redeclaration of non-configurable global property supabase — app.js:1

Root cause: index.html loads the Supabase CDN script which registers window.supabase
as a non-configurable global. Then app.js does:
  const supabase = window.supabase.createClient(...)
Declaring `const supabase` redeclares the existing global window.supabase and crashes
with a SyntaxError, so no event listeners attach at all — every button is dead.

Fix: Rename the local variable to avoid the collision. In app.js, change:
  const supabase = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
to:
  const db = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

Then replace every other reference to `supabase` in app.js with `db`.
There are references in saveState(), loadState(), the real-time subscription, etc.
Do a full find-and-replace of `supabase.` → `db.` throughout app.js,
being careful NOT to change `window.supabase.createClient` on the first line.

After the fix, commit and push to GitHub so Vercel redeploys automatically.
```

---

### Feature 8 — Prominent Pool Title + Branding

**What:** Move pool title from header/nav to a large centered `<h1>` hero below the navbar. Add "by NineInchTooL" branding in the title area and footer.

**Claude prompt used:**
```
Add two UI improvements to index.html and app.js:

1. Pool title — prominent in viewer mode
In index.html, the pool title (<span id="pool-title-display">) is currently in the
header/nav area. Move it so it appears large and centered as the main heading of the
page in viewer mode — think <h1> size, centered, below the navbar. It should be the
first thing a participant sees when they open the app. It must still update dynamically
when the admin changes it (the renderPoolTitle() function in app.js sets textContent on
#pool-title-display — keep that working).

2. "by NineInchTooL" branding
- Next to the page <title> tag in <head>, change it to:
  World Cup 2026 Pool · by NineInchTooL
- Add a small, subtle "by NineInchTooL" text (muted color, small font ~12px) in two places:
  - Next to the pool title heading (inline, after the title text)
  - In a centered footer at the very bottom of every screen
- Style it tastefully — not distracting, just a quiet signature.

Files to edit: index.html (layout + footer + title tag), possibly a few lines in
style.css for the new title heading size and footer styles. No logic changes needed
in app.js — renderPoolTitle() stays the same, just make sure #pool-title-display
still exists in the DOM.

After changes, commit and push to GitHub.
```

---

### Feature 9 — Team Elimination Tracker

**What:** Admin can mark teams as eliminated. Eliminated teams show with strikethrough in all allocation cards. Real-time sync to all viewers.

**Claude prompt used:**
```
New feature: Team elimination tracker for World Cup phases.

Overview: The admin can mark teams as eliminated as the tournament progresses.
Eliminated teams still appear in every participant's allocation card, but are
visually marked as crossed out.

1. State changes (app.js)
Add a new field to state:
  eliminatedTeams: [], // array of team names (strings)

In saveState(), include eliminated_teams: state.eliminatedTeams in the Supabase upsert.
In loadState(), read it back: state.eliminatedTeams = data.eliminated_teams ?? []
In the real-time subscription callback, also sync:
  state.eliminatedTeams = d.eliminated_teams ?? []

In Supabase, run this SQL:
  ALTER TABLE pool_state ADD COLUMN IF NOT EXISTS eliminated_teams JSONB DEFAULT '[]';

2. Admin panel — elimination UI (index.html + app.js)
Inside the admin panel, add a new collapsible section titled "⚽ Elimination Tracker"
below the participants section.

Render all 48 teams grouped by tier (Tier 1 through Tier 4). Each team appears as a
small pill/chip button. Clicking a team toggles its eliminated status:
- Active (not eliminated): normal chip, flag emoji + name
- Eliminated: chip with strikethrough text, dimmed/muted color, and ❌ indicator

Add a function renderEliminationTracker() that rebuilds this section.
Call it from the main render() function.

Each chip click handler should:
  const idx = state.eliminatedTeams.indexOf(team.name);
  if (idx === -1) state.eliminatedTeams.push(team.name);
  else state.eliminatedTeams.splice(idx, 1);
  await saveState();
  renderEliminationTracker();
  renderAllocation();

3. Allocation cards — show eliminated state (app.js)
In renderAllocation(), when building each team <li>, check if the team is eliminated:
  const isElim = state.eliminatedTeams.includes(t.name);
If eliminated, add CSS class team-eliminated to the <li> and render ❌ before the name.

Add this CSS to styles.css:
  .team-eliminated {
    text-decoration: line-through;
    opacity: 0.45;
    color: var(--text-muted, #888);
  }
  .team-eliminated .tier-dot { opacity: 0.4; }

4. Viewer mode — alive/out badge
On each participant's allocation card, add a small badge showing:
  ✅ N alive · ❌ N out
in small muted text below the participant name.

Files to edit: app.js, index.html, styles.css. Commit and push after all changes.
```

---

### Feature 10 — Fix Allocation Algorithm (balanced tiers)

**What:** The original algorithm could give one player 3 Tier 1 teams and another 0. Fixed to guarantee exactly 1 team per tier per player.

**Root cause:** The original `allocate()` built a global interleaved `drawOrder` cycling Tier 1-2-3-4 across all 12 rounds, then assigned sequentially. The interleaving was global — not per-player — so assignment order determined tier distribution, not tier fairness.

**Example of the bug:**
```
Maya:    ⭐ Argentina  ⭐ Francia   ⭐ Uruguay   🟢 Escocia   🟢 Irán    ← 3 Tier 1!
Ana:     🔵 Canadá    ⚪ Cabo Verde 🔵 Suecia    ⚪ Sudáfrica ⚪ NZ     ← 0 Tier 1!
```

**Claude prompt used:**
```
Bug fix: The team allocation algorithm does not guarantee balanced tier distribution
per participant.

The problem: Currently allocate() in app.js builds a global drawOrder array cycling
through tiers 1-2-3-4 for all 12 rounds, then assigns sequentially. This causes some
players to receive 3 Tier 1 teams and others to receive 0 Tier 1 teams — completely unfair.

The correct guarantee: With 10 players and 48 teams (12 per tier), every player must
receive exactly 1 team per tier per base round. With 10 players and 48 teams:
  base = 4 teams per person, extras = 8 people get a 5th team.

Strict rule:
- Every player gets exactly 1 Tier 1, 1 Tier 2, 1 Tier 3, 1 Tier 4 team (4 base teams)
- The 8 players who get a 5th team get 1 additional team from any tier

Replace the entire allocate() function with this correct implementation:

  function allocate(participants) {
    if (participants.length === 0) return null;
    const n = participants.length;
    const total = TEAMS.length; // 48
    const base = Math.floor(total / n); // 4
    const extras = total % n; // 8 extra teams

    const shuffled = [...participants];
    shuffle(shuffled);

    const flagged = shuffled.filter(p => p.extraTeam);
    const unflagged = shuffled.filter(p => !p.extraTeam);
    const ordered = [...flagged, ...unflagged];
    const bigGroup = new Set(ordered.slice(0, extras).map(p => p.id));

    const tierPools = { 1: [], 2: [], 3: [], 4: [] };
    for (const t of TEAMS) tierPools[t.tier].push({ name: t.name, tier: t.tier });
    for (const pool of Object.values(tierPools)) shuffle(pool);

    const result = {};
    for (const p of participants) result[p.id] = [];

    // BASE ROUNDS: 1 team per tier per player — guaranteed
    for (let tier = 1; tier <= 4; tier++) {
      const pool = [...tierPools[tier]];
      const roundOrder = [...participants.map(p => p.id)];
      shuffle(roundOrder);
      for (let i = 0; i < roundOrder.length; i++) {
        result[roundOrder[i]].push(pool[i]);
      }
    }

    // EXTRA ROUND: distribute remaining teams to bigGroup players
    const remaining = [];
    for (let tier = 1; tier <= 4; tier++) {
      for (let i = n; i < tierPools[tier].length; i++) {
        remaining.push(tierPools[tier][i]);
      }
    }
    shuffle(remaining);

    const bigList = [...bigGroup];
    shuffle(bigList);
    for (let i = 0; i < bigList.length; i++) {
      result[bigList[i]].push(remaining[i]);
    }

    return result;
  }

Why this works:
- 4 base rounds each assign exactly 1 team from a single tier to every participant
- Extra round picks from leftover teams (2 remaining per tier after 10 players took 1 each)
- Assignment order reshuffled each round independently

Commit and push to GitHub after fixing.
```

---

---

### Feature 11 — Full Architecture Migration (Multi-Pool + Auth)

**What:** Rewrote the entire app from a single shared pool with
localStorage persistence to a multi-pool SPA with Google OAuth auth,
each pool as its own Supabase row, and hash-based client-side routing.

**Key changes:**

- Replaced localStorage state with a `pools` table (one row per pool)
- Added Google OAuth via Supabase Auth — dashboard requires sign-in
- Viewer mode remains public (no auth required)
- Admin panel restricted to pool owner (`owner_id = auth.uid()`)
- Hash router: `#/` dashboard, `#/pool/:id` viewer, `#/pool/:id/admin` admin
- Pool creation modal: title + participant count slider (2–12)
- Up to 10 pools per user
- Pool cards: View, Admin, Delete buttons
- Realtime subscription scoped to single pool (`filter: id=eq.${poolId}`)

---

### Feature 12 — Live Score Sync (Edge Function)

**What:** Admin can sync live World Cup scores to get suggested team
eliminations based on group stage standings.

**How it works:**

1. Admin clicks "🔄 Sync Scores" in the Elimination Tracker
2. App calls the `wc-scores` Supabase Edge Function
3. Edge Function queries football-data.org (primary) or worldcup26.ir (fallback)
4. Returns finished group-stage matches as JSON
5. App builds group standings; teams with 0 points after 3 games
   surface as clickable suggested elimination chips
6. Suggestions are **never auto-applied** — admin clicks each chip to confirm

**Files:** `supabase/functions/wc-scores/index.ts`

**Required secret:** `FOOTBALL_DATA_API_KEY` in Supabase Edge Function secrets

---

### Feature 13 — PWA (Progressive Web App)

**What:** Made WCPool installable as a native-like app on iOS and Android.

**Changes:**

- `manifest.json` — name, icons, theme color (`#01696f`), display standalone
- `sw.js` — network-first service worker; caches shell files
  (`/`, `app.js`, `styles.css`, `manifest.json`, `favicon.svg`)
- `icons/icon.svg` — ⚽ on teal maskable icon
- `index.html` — `<link rel="manifest">`, `apple-mobile-web-app-*` meta tags,
  service worker registration

**Install instructions:**

- Android: Chrome shows "Add to Home Screen" banner automatically
- iOS: Safari → Share → "Add to Home Screen" → Add

---

### Feature 14 — Visual Design Uplift

**What:** Replaced the flat default browser styles with a polished
design system: Syne (display) + Inter (body), teal accent palette,
surface layering, SVG logo, dark/light mode toggle.

**Key design tokens:**

- `--color-primary: #01696f` (Hydra Teal)
- `--font-display: 'Syne'` / `--font-body: 'Inter'`
- 4px spacing system, fluid `clamp()` type scale
- Warm beige surfaces (light) / deep charcoal (dark)
- SVG inline logo in all four headers

---

### Feature 15 — Polish Pass

**What:** 7 targeted UX and defensive-coding improvements.

**Changes made:**

1. `countHelper` text updates on modal open (not just slider drag)
2. Allocation card shows `— equipos` guard when `teams.length === 0`
3. Verified `copy-wa-btn` ID match in `refreshAllocUI`
4. Realtime `onUpdate` now parses JSON string fields before render
   (Supabase Realtime returns raw strings for JSONB columns)
5. Mobile nav: "← My Pools" collapses to "←" on screens ≤ 480px;
   `.header-center` byline hidden on mobile
6. Elimination chip click debounced with `saving` lock to prevent
   concurrent `savePool()` calls
7. `.alloc-status` omits "❌ 0 eliminados" when `out === 0`

---

### Feature 16 — Full i18n

**What:** Complete internationalization supporting US English (en-US),
Mexican Spanish (es-MX), and Portuguese from Portugal (pt-PT).

**System design:**

- `TRANSLATIONS` object — ~60 keys per locale, string or function values
  (functions handle plurals and interpolated strings)
- `t(key, ...args)` — resolves and calls string/function, falls back to en-US
- `TEAM_NAMES_I18N` — Spanish→English and Spanish→Portuguese display maps
  for all 48 teams; canonical DB storage stays Spanish
- `localTeamName(nameEs)` — display-only translation layer
- `currentLocale` — auto-detected from `navigator.language`, persisted
  to `localStorage` as `wcpool_locale`
- `setLocale(locale)` — persists + re-renders via `router()`
- `localeSwitcherHTML()` / `bindLocaleSwitcher()` — pill buttons rendered
  in all 4 page headers (landing, dashboard, viewer, admin)

**i18n rule for future features:**

> Every new user-facing string must be added to all three locale objects
> in `TRANSLATIONS` before use. Call `t('key')` — never hardcode UI strings.
> Team names displayed to users must go through `localTeamName()`.
> DB writes always use the canonical Spanish name.

**styles.css additions:**

- `.locale-switcher` — flex row of pill buttons in header
- `.locale-btn` — compact, muted by default
- `.locale-btn.active` — teal highlight for current locale

---

## 7. Bugs Encountered & Fixes

### Bug 1 — Admin Button Did Nothing (all devices)

**Symptom:** Clicking Admin button showed setup modal briefly then disappeared, no login modal appeared.

**Cause:** `state.password` checked in Admin toggle was loaded from localStorage — empty on all non-admin devices.

**Fix:** Added `password_set: boolean` flag to Supabase. Admin toggle now checks `state.passwordSet` (from Supabase, shared across all devices). See [Feature 6](#feature-6--fix-admin-button-password_set-flag).

**Supabase SQL required:**
```sql
ALTER TABLE pool_state ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false;
```

---

### Bug 2 — App Completely Dead (no buttons responded)

**Symptom:** After Supabase migration, every button was non-functional. Console showed:
```
Uncaught SyntaxError: redeclaration of non-configurable global property supabase — app.js:1
```

**Cause:** Supabase CDN registers `window.supabase` as a non-configurable global. `app.js` then declared `const supabase = ...` which attempted to redeclare it — throwing a SyntaxError that terminated the entire script before any `addEventListener` calls ran.

**Fix:** Renamed the local variable from `supabase` to `db` throughout `app.js`. See [Feature 7](#feature-7--fix-js-crash-supabase-variable-collision).

---

### Bug 3 — Unfair Team Distribution

**Symptom:** Some players got 3 Tier 1 teams, others got 0 Tier 1 teams.

**Cause:** The original algorithm built a global interleaved draw order cycling tiers 1-2-3-4 and assigned sequentially. Assignment position in the queue (not per-tier guarantees) determined what tiers each player received.

**Fix:** Rewrote `allocate()` to assign exactly 1 team per tier per player in separate passes. See [Feature 10](#feature-10--fix-allocation-algorithm-balanced-tiers).

---

### Bug 4 — Realtime JSON Fields Not Parsed

**Symptom:** Viewer didn't update correctly on real-time events —
allocation cards showed raw JSON strings instead of rendered teams.

**Cause:** Supabase REST responses auto-parse JSONB columns, but
Realtime `payload.new` returns them as raw JSON strings.

**Fix:** Added explicit `JSON.parse()` guards in the `onUpdate`
callback before passing the pool object to `renderViewerContent`.

---

## 8. Security Notes

| Aspect            | Detail                                                                   |
|-------------------|--------------------------------------------------------------------------|
| Authentication    | Google OAuth via Supabase Auth — no passwords in the app                 |
| Pool ownership    | All writes gated by `owner_id = auth.uid()` RLS policy                   |
| Viewer access     | Public by design — anyone with the pool ID URL can view                  |
| Supabase anon key | Public/publishable — safe to commit, only allows RLS-scoped ops          |
| Edge Function key | `FOOTBALL_DATA_API_KEY` stored as Supabase secret, never in code         |
| Locale storage    | `wcpool_locale` in localStorage — non-sensitive preference               |

---

## 9. Deployment

### Auto-deploy flow

Every `git push` to `main` triggers an automatic Vercel deployment. No manual steps needed.

```
git push origin main
# → Vercel detects push → builds in ~10s → live at wc-pool-three.vercel.app
```

### Production URLs

| URL | Type |
|-----|------|
| https://wc-pool-three.vercel.app | ✅ Permanent production alias — share this |
| https://wc-pool-nine-inch-too-l-s-projects.vercel.app | Permanent (team-scoped) |
| https://wc-pool-git-main-nine-inch-too-l-s-projects.vercel.app | Branch alias |

The `wc-pool-m0j75qlxo-...` style URLs are deployment-specific and change each deploy — do not share those.

### vercel.json

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 10. Future Ideas

- **Prompt 6 — Magic Link invite** — pool owner shares a link;
  participant clicks it and claims their allocation card without
  needing a Google account
- **Prompt 7 — PWA polish + offline shell** — proper caching strategy,
  "Install App" prompt for mobile users
- **Prompt 8 — Live standings / leaderboard** — participants ranked by
  teams still alive, auto-computed from `eliminated_teams`
- **Prompt 9 — Push notifications** — notify participants when a team
  is eliminated; shareable "❌ [Team] is out!" WhatsApp card
- **Prompt 10 — Multi-tournament** — Copa América, Euros, custom
  team lists and tier configurations
