# Changelog

All notable changes to WCPool are documented here.  
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

## [2026-06-11]

### Added

**Share Pool Link**
- Viewer header now includes a Share button
- Uses `navigator.share()` (native sheet) when the browser supports it
- Falls back to `navigator.clipboard.writeText()` on desktop
- Shared URL format: `{window.location.origin}/#/pool/{pool_id}`
- Button label and success/failure feedback localized in en-US, es-MX, pt-PT

**Auth Modal — Google OAuth + Magic Link**
- Sign-in modal shown to unauthenticated viewers who tap Save or Share
- Supports Google OAuth and email magic link in one UI
- Shared `renderAuthForm(container)` helper used by both the modal and the landing splash
- `redirectTo` / `emailRedirectTo` always set to `window.location.href`

**Elimination Banner (saved-pool viewers)**
- Non-owner viewers who have saved a pool see a banner when teams are eliminated in real time
- Triggered by the Supabase Realtime `UPDATE` subscription on `pools`
- Diffs `eliminated_teams` from the previous known state — only newly eliminated teams are shown
- Banner is dismissed in memory for the session (no DB write)
- Checks undismissed eliminations on initial load, not just on Realtime events
- Channel reference is cleaned up on viewer unmount

**Today's Matches Strip**
- Horizontal strip in the viewer header showing today's World Cup fixtures
- Cards are player-vs-player: shows the pool participant name above each team
- Teams not allocated in this pool show `—` and are visually dimmed (opacity 0.45)
- Time badge shows local kickoff time; live matches show a pulsing dot + "Live"
- Inline chip on each team row in player cards: `Today 1:00 PM` / `Hoy 1:00 PM` / `Hoje 1:00 PM`
- Localized in en-US, es-MX, pt-PT via `today_badge`, `live_indicator` keys

**PWA Install Prompt + Viewer UX**
- `beforeinstallprompt` captured synchronously; prompt shown after first interaction
- Dismissed state stored in `sessionStorage` under `pwa-prompt-dismissed`
- Live viewer shows a pulsing dot indicator while Realtime is subscribed
- "Updated just now" label refreshed on each Realtime event

### Changed

**Today's Matches — mobile layout (≤640px)**
- Match cards stack vertically on screens ≤640px; each card is full width
- Horizontal scroll removed on mobile; all matches visible at a glance
- The 3-column home · vs/time · away layout inside each card is preserved
- Label stacks above the card row so it doesn't clip the first card
- Tablet (768px+) and desktop keep the horizontal scrolling row

### Performance

**RLS policy optimization** (`20260610_rls_performance_pass.sql`)
- All ownership predicates on `pools`, `profiles`, and `saved_pools` now use
  `(select auth.uid())` instead of bare `auth.uid()`
- Rationale: wrapped in a subquery, the function is evaluated once per query
  rather than once per row, which matters on tables with many rows
- Applies to INSERT `with check`, UPDATE `using`, DELETE `using` clauses

### Fixed

**`wc-scores` edge function — today mode**
- `worldcup26.ir` requires `Accept: application/json` header to return JSON;
  without it the API returns an unquoted JS-object schema that fails `JSON.parse`
- Football-data.org filters by UTC date, so evening local games (e.g. 20:00 ET =
  00:00 UTC next day) were silently dropped
- Fix: both sources always run; results merged and deduplicated by `home|away` key;
  football-data.org entries preferred (proper UTC timestamps)
- Fallback date field corrected from `date/datetime/kickoff` (non-existent) to
  `local_date` in `"MM/DD/YYYY HH:MM"` format; converted to ISO 8601 for `new Date()`
- Status now derived from `time_elapsed` (`1st/ht/2nd/et/pen → IN_PLAY`) not just
  `finished` flag
