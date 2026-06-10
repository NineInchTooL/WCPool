# WCPool Technical Context

## Current Architecture

WCPool is a static frontend web app deployed on Vercel, backed by Supabase for auth, data storage, and realtime updates. It is a hash-based SPA with four major views:
- Landing
- Dashboard
- Viewer
- Admin

## Core Frontend Files

- `index.html` — app shell, CDN includes, PWA meta tags
- `app.js` — routing, state, rendering, auth, allocation, i18n, admin/viewer logic
- `styles.css` — visual system, layout, components, mobile behavior
- `manifest.json` — PWA manifest
- `sw.js` — service worker

## Routing Model

Hash-based SPA routes:
- `#/` → authenticated dashboard
- `#/pool/:id` → public viewer
- `#/admin/:id` → owner-only admin panel
- no hash → landing page

The router should remain simple and deterministic. Navigation should not depend on server-side routes.

## Auth Model

- Supabase Auth with Google OAuth
- Admin/dashboard actions require sign-in
- Viewer does not require auth
- Ownership is tied to `owner_id`
- Owner-only admin access is enforced by both frontend checks and RLS

## Database Model

Main table: `pools`

Expected row shape:
- `id`
- `owner_id`
- `title`
- `participant_count`
- `participants` JSONB
- `allocation` JSONB or null
- `allocation_locked` boolean
- `eliminated_teams` JSONB
- `created_at`

Current design keeps most pool state in one row for simplicity.

## Realtime Model

Viewer subscribes to Supabase realtime updates for a single pool row.

Important caveat:
- Realtime payloads may return JSONB fields as strings
- `allocation`, `participants`, and `eliminated_teams` may need manual `JSON.parse()` guards before rendering

Any feature touching realtime should preserve this behavior.

## Allocation Rules

- Team allocation logic is already working and should not be casually changed
- Allocation must remain fair across the fixed 48-team, 4-tier system
- `allocation_locked` prevents accidental rerandomization
- Extra-team preference exists for uneven division cases

Do not change the core allocation algorithm unless a task explicitly requires it and Product + Tech + QA review it.

## Team Model

- Team definitions are currently fixed for World Cup 2026
- Canonical/internal team names remain in Spanish
- Display names must be localized via the display translation layer

Any DB write or internal comparison should use canonical Spanish names.

## Live Score Sync

- Admin can sync live scores
- Sync calls the Supabase Edge Function: `wc-scores`
- That function proxies score providers and returns structured match data
- Client computes suggested eliminations from the returned data
- Suggestions are not auto-applied; admin must confirm by clicking

Any score-sync work must consider API limits, fallback behavior, and manual admin control.

## PWA / Deployment

- Frontend is deployed on Vercel
- `vercel.json` handles SPA routing fallback
- `manifest.json` and `sw.js` enable installability
- Service worker currently supports shell caching

Any routing or asset-path change must be checked against Vercel and PWA behavior.

## i18n Architecture

- Locale system supports `en-US`, `es-MX`, `pt-PT`
- UI strings must go through `t(key, ...args)`
- Team display must go through `localTeamName(nameEs)`
- Locale persists in `localStorage`
- Locale switch should re-render current route cleanly

## Engineering Guardrails

### Safe to change more freely
- UI rendering details
- Styling and layout
- Copy via translation keys
- New helper functions
- Docs and prompts

### High-risk areas
- Auth initialization
- Routing logic
- Realtime subscriptions / cleanup
- RLS assumptions
- Pool row shape
- Allocation algorithm
- Score sync plumbing
- Service worker caching behavior

## Default Technical Review Questions

- Which files change?
- Does this affect auth, routing, data shape, or realtime?
- Does this introduce new UI states?
- Does this require localization support?
- Could this create duplicate listeners, stale renders, or cleanup leaks?
- Does this preserve public viewer + owner-only admin separation?
