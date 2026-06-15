# Changelog

All notable changes to WCPool are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

## [2026-06-15]

### Added

#### Live scores and match results on Upcoming Matches VS cards

- `wc-scores?mode=today` now returns `homeScore`, `awayScore`, and `elapsed` fields
  from both football-data.org and worldcup26.ir in today mode
- VS cards render three distinct states:
  - **TIMED** — kickoff time with day-aware label ("Today 1:00 PM", "Tomorrow 1:00 PM", "Fri 1:00 PM")
  - **IN_PLAY** — live score (`2 – 1`) with pulsing green dot + elapsed minutes (`67'`)
  - **FINISHED** — final score with muted `FT` label; losing team name dimmed

#### Winner animation on FINISHED cards

- Winning team side shows a ⭐ icon that fades in with a scale-up on viewport entry
- One-shot gold shimmer sweeps across the winning side on entry, then repeats every
  3 seconds via `setInterval` stored on the element (`el._winnerInterval`)
- `IntersectionObserver` (threshold 0.5) starts the cycle on enter, clears on exit
- `prefers-reduced-motion`: shimmer skipped entirely; ⭐ icon shown statically

#### Skeleton loader for Upcoming Matches section

- While `wc-scores?mode=today` is in-flight, 3 shimmer placeholder cards appear
  in place of real match cards
- Rotating status text cycles through 6 locale-aware messages every 1.8 s with a
  300 ms opacity fade (EN / ES / PT strings inline, no new locale keys)
- Loader is suppressed if the result is already cached (navigating back to the viewer)
- `renderTodayMatchesStrip` clears the rotation interval before replacing content

### Changed

#### "Today's Matches" renamed to "Upcoming Matches"

- Section label changed in all three locales (`upcoming_matches` i18n key)
- Card chips and empty states updated to match (`noMatchesToday` strings updated)
- Per-card day-aware time labels: "Today / Tomorrow / weekday" instead of bare time
  (`match_today`, `match_tomorrow` i18n keys added to all three locales)

#### Upcoming Matches section — responsive CSS grid

- Replaced horizontal overflow-x scroll strip with a wrapping CSS grid
- `border-bottom` separator moved to `#today-matches-wrap` (full viewport width);
  grid content constrained to `max-width: 960px` centered — aligned with `.main-content`
- Breakpoints: 3 columns ≥ 1024 px · 2 columns 640–1023 px · 1 column < 640 px
- Cards fill their grid cell (`width: 100%`); team sides grow via `flex: 1`
- No horizontal scrollbar; no `overflow-x: hidden` band-aid

#### "by NineInchTooL" byline placement

- Removed from the viewer header bar (`header-center` div removed entirely)
- Removed from the pool name subtitle below the pool title
- Footer attribution on all pages is unchanged

### Fixed

#### `wc-scores` edge function — `verify_jwt` misconfiguration

- Redeployed with `--no-verify-jwt`; the endpoint is intentionally public and was
  returning `401 UNAUTHORIZED_NO_AUTH_HEADER` for all frontend calls

#### Cape Verde deduplication (football-data.org vs worldcup26.ir)

- Added `'cape verde islands': 'cape verde'` to the `ALIASES` normalization map
- The two sources spell the team differently; without the alias both entries passed
  the dedup check and two cards appeared for the same match

#### Cape Verde participant and display name

- Added `'Cape Verde Islands': 'Cabo Verde'` to `EN_TO_LOCAL`
- Without this entry the football-data.org card (kept after dedup) couldn't resolve
  the canonical Spanish name, so `getTeamOwner` returned null and the team displayed
  as the raw English API string "Cape Verde Islands"

---

## [2026-06-11]

### Added

#### Share Pool Link

- Viewer header now includes a Share button
- Uses `navigator.share()` (native sheet) when the browser supports it
- Falls back to `navigator.clipboard.writeText()` on desktop
- Shared URL format: `{window.location.origin}/#/pool/{pool_id}`
- Button label and success/failure feedback localized in en-US, es-MX, pt-PT

#### Auth Modal — Google OAuth + Magic Link

- Sign-in modal shown to unauthenticated viewers who tap Save or Share
- Supports Google OAuth and email magic link in one UI
- Shared `renderAuthForm(container)` helper used by both the modal and the landing splash
- `redirectTo` / `emailRedirectTo` always set to `window.location.href`

#### Elimination Banner (saved-pool viewers)

- Non-owner viewers who have saved a pool see a banner when teams are eliminated in real time
- Triggered by the Supabase Realtime `UPDATE` subscription on `pools`
- Diffs `eliminated_teams` from the previous known state — only newly eliminated teams are shown
- Banner is dismissed in memory for the session (no DB write)
- Checks undismissed eliminations on initial load, not just on Realtime events
- Channel reference is cleaned up on viewer unmount

#### Today's Matches Strip

- Horizontal strip in the viewer header showing today's World Cup fixtures
- Cards are player-vs-player: shows the pool participant name above each team
- Teams not allocated in this pool show `—` and are visually dimmed (opacity 0.45)
- Time badge shows local kickoff time; live matches show a pulsing dot + "Live"
- Inline chip on each team row in player cards: `Today 1:00 PM` / `Hoy 1:00 PM` / `Hoje 1:00 PM`
- Localized in en-US, es-MX, pt-PT via `today_badge`, `live_indicator` keys

#### PWA Install Prompt + Viewer UX

- `beforeinstallprompt` captured synchronously; prompt shown after first interaction
- Dismissed state stored in `sessionStorage` under `pwa-prompt-dismissed`
- Live viewer shows a pulsing dot indicator while Realtime is subscribed
- "Updated just now" label refreshed on each Realtime event

### Changed

#### Today's Matches — mobile layout (≤640px)

- Match cards stack vertically on screens ≤640px; each card is full width
- Horizontal scroll removed on mobile; all matches visible at a glance
- The 3-column home · vs/time · away layout inside each card is preserved
- Label stacks above the card row so it doesn't clip the first card
- Tablet (768px+) and desktop keep the horizontal scrolling row

### Performance

#### RLS policy optimization (`20260610_rls_performance_pass.sql`)

- All ownership predicates on `pools`, `profiles`, and `saved_pools` now use
  `(select auth.uid())` instead of bare `auth.uid()`
- Rationale: wrapped in a subquery, the function is evaluated once per query
  rather than once per row, which matters on tables with many rows
- Applies to INSERT `with check`, UPDATE `using`, DELETE `using` clauses

### Fixed

#### `wc-scores` edge function — today mode

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
