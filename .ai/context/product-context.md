# WCPool Product Context

## What WCPool Is

WCPool is a World Cup pool web app for creating and managing team-allocation pools around the FIFA World Cup 2026. The current product is centered on a pool owner/admin who creates a pool, adds participants, allocates teams fairly, tracks eliminations, and shares a public viewer link.

## Primary Users

### 1. Pool Owner / Admin
The owner creates the pool, signs in with Google, manages participants, runs the allocation, locks or unlocks allocation, syncs scores, marks eliminations, and shares links.

### 2. Public Viewer
A viewer can open a pool through a shared URL without signing in. Viewers can see allocations, which teams are still alive, and which teams have been eliminated.

### 3. Future Participant Flow
A likely future feature is participant claim/invite flow, where a participant can claim or access their own card more directly without needing full admin permissions.

## Current Product Scope

The app currently supports:
- Google OAuth via Supabase Auth for admin/owner access
- A multi-pool dashboard
- Up to 10 pools per user
- World Cup 2026 teams only
- 48 teams split into 4 tiers
- Participant count from 2 to 12
- Fair randomized team allocation
- Optional extra-team preference on participants
- Public viewer mode
- Owner-only admin mode
- Elimination tracking
- Live score sync suggestions
- PWA installability
- Full localization in en-US, es-MX, and pt-PT

## Product Principles

### Keep the core loop simple
The main flow should stay easy to understand:
1. Create pool
2. Add participants
3. Allocate teams
4. Share viewer link
5. Track eliminations through the tournament

### Respect role clarity
- Viewer should stay simple and read-only.
- Admin should be powerful but not cluttered.
- Public sharing is intentional.
- Owner-only actions must remain clearly protected.

### Build for real tournament use
Features should support actual pool behavior during a live tournament:
- Quick updates
- Easy sharing
- Mobile-friendly viewer/admin use
- Clear team status visibility
- Reliable live sync suggestions without auto-destructive changes

### Internationalization is a product requirement
Localization is not optional. New product work must support:
- US English (`en-US`)
- Mexican Spanish (`es-MX`)
- Portugal Portuguese (`pt-PT`)

Any new feature with UI copy must ship fully localized.

## Current Constraints

- Team set is fixed to FIFA World Cup 2026 for now.
- Canonical team names are stored in Spanish internally.
- The app uses a hash-based SPA router.
- Viewer access is public by design.
- Admin access is owner-only.
- Pool title, participants, allocation, and eliminations all live in a single `pools` row.

## Success Criteria for Features

A good feature for WCPool should usually improve one or more of these:
- Faster pool setup
- Clearer participant/viewer understanding
- Better mobile usability
- Lower admin effort during the tournament
- Safer realtime behavior
- Better localization quality
- Cleaner long-term extensibility

## Non-Goals Right Now

Unless explicitly requested, avoid turning WCPool into:
- A social network
- A complex stats platform
- A heavy enterprise admin app
- A multi-sport product
- A broad tournament builder with custom formats

## Near-Term Product Roadmap Themes

These are natural next-step themes to evaluate:
- Participant invite / claim flow
- Better PWA offline behavior and install UX
- Standings / leaderboard view
- Notification or share flows for eliminations
- Support for additional tournaments in the future

## Product Review Questions

When reviewing a request, ask:
- Does this help the owner/admin complete the core loop faster or better?
- Does this keep the viewer experience clean?
- Does this complicate the app more than the value justifies?
- Does this create new strings or states that require localization?
- Does this create new role or permission complexity?
