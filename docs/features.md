# WCPool — Feature Reference

Contributor-facing reference for shipped features.  
For the full build history and original architecture, see [`DEVELOPMENT.md`](../DEVELOPMENT.md).

---

## Share Pool Link

**Where:** Viewer header, next to the pool title.

**Behavior:**

- Tapping Share calls `navigator.share()` if available (mobile native sheet)
- Falls back to `navigator.clipboard.writeText()` on browsers without Web Share API
- URL format: `{origin}/#/pool/{pool_id}` — always the hash-based public viewer route
- Unauthenticated viewers are prompted to sign in if they attempt to save before sharing

**Localization:** Button label and success/failure toast are in `en-US`, `es-MX`, `pt-PT`.

---

## Elimination Banner

**Who sees it:** Authenticated viewers who have saved a pool but are not its owner.

**What triggers it:**

- Supabase Realtime `UPDATE` on the `pools` table, filtered to the current pool
- Also checked on initial viewer load (catches eliminations that happened while offline)

**What it shows:** Only teams eliminated since the viewer last acknowledged — not the
full `eliminated_teams` list. Diff is computed against `lastKnownEliminated` (a
`Set` held in the viewer's closure).

**Dismiss behavior:**

- Dismissed in memory only — no write to the DB
- Reappears for newly eliminated teams in the same session
- Resets on page reload

**Cleanup:** The Realtime channel is removed when the viewer unmounts.

---

## Upcoming Matches

**Where:** Grid section at the top of the viewer, below the pool hero.

**What it shows:**

Each VS card displays one World Cup fixture and renders one of three states:

| State | Center display | Side styling |
| --- | --- | --- |
| TIMED | Day-aware: "Today 1:00 PM" / "Tomorrow 1:00 PM" / "Fri 1:00 PM" | Normal |
| IN_PLAY | Live score (`2 – 1`) + pulsing green dot + elapsed (`67'`) | Normal |
| FINISHED | Final score + muted `FT` label | Winner full colour + ⭐; loser dimmed |

- Participant names pulled from `pool.allocation` at render time — no extra fetch
- Teams not in this pool's allocation show `—` and are dimmed at 45% opacity

**Winner animation (FINISHED cards):**

- A ⭐ icon fades in with a scale-up when the winning side enters the viewport
- A one-shot gold shimmer sweeps the winning side, then repeats every 3 s via
  `IntersectionObserver` + `setInterval` (`el._winnerInterval`) while visible
- `prefers-reduced-motion`: shimmer suppressed; ⭐ shown statically

**Skeleton loader:**

- While `wc-scores?mode=today` is in-flight, 3 shimmer placeholder cards appear
- Rotating status text cycles through 6 locale-aware messages every 1.8 s
- Loader does not appear on repeat views (result is already cached)

**Player card chips:**

- Each team row in the allocation grid shows an inline chip if that team plays
- Chip text uses `match_today` / `match_tomorrow` i18n keys → "Today 1:00 PM" / "Tomorrow 1:00 PM"
- Live chip uses `.today-chip--live` (green) instead of primary colour

**Layout:**

- `max-width: 960px` centered — aligned with `.main-content` below it
- Full-width `border-bottom` separator on `#today-matches-wrap`
- CSS grid: 3 columns ≥ 1024 px · 2 columns 640–1023 px · 1 column < 640 px
- No horizontal scroll at any breakpoint

**Data source:** `wc-scores?mode=today` returns `home`, `away`, `utcDate`, `status`,
`homeScore`, `awayScore`, and `elapsed` for each fixture. Always queries both
football-data.org (UTC date filter, proper timestamps) and worldcup26.ir (local date
filter, catches evening games past UTC midnight) and merges results. See
[`CHANGELOG.md`](../CHANGELOG.md) and [`docs/architecture.md`](architecture.md).

---

## Roles: Owner vs Viewer

| Role | How to identify | What they can do |
| --- | --- | --- |
| **Owner** | `pool.owner_id === auth.uid()` | Full admin: edit title, run allocation, mark eliminations, delete pool |
| **Authenticated viewer** | Signed in, not owner | Save pool, share link, see elimination banner |
| **Anonymous viewer** | Not signed in | Read-only; can share via clipboard; prompted to sign in for save |

**Routing:**

- `#/pool/:id` → public viewer (no auth required)
- `#/pool/:id/admin` → admin panel (owner only; redirects non-owners to viewer)

The viewer is intentionally public. Anyone with the pool URL can see the full allocation
and track eliminations in real time. The owner-only admin distinction is enforced by
both the router and Supabase RLS policies.

---

## Localization

All user-facing strings must exist in all three locales.

| Locale | Code |
| --- | --- |
| English (US) | `en-US` |
| Spanish (Mexico) | `es-MX` |
| Portuguese (Portugal) | `pt-PT` |

**Rules:**

- Add every new key to the `TRANSLATIONS` object in `app.js` for all three locales
- Function-valued entries (`key: arg => \`...\``) are fine for interpolation
- Team display names are localized via `TEAM_NAMES_I18N` / `localTeamName(nameEs)` — display only
- The DB always stores canonical Spanish team names (e.g. `"Corea del Sur"`)
- `EN_TO_LOCAL` maps English API names → canonical Spanish for incoming score data

**Never store a localized display name in the DB or use it in logic.** Always go through
`localTeamName()` at render time.
