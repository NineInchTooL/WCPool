# WCPool QA Regression Checklist

Use this checklist for any meaningful feature, bug fix, refactor, or release.

## Core Views

### Landing
- Loads without auth
- Correct branding and CTA
- Theme toggle works
- Locale switcher works
- No mixed-language strings
- Mobile layout fits cleanly

### Dashboard
- Requires auth
- Pool list loads correctly
- Create pool modal opens/closes correctly
- Participant count helper updates correctly
- Delete pool modal works
- View/Admin buttons route correctly
- Locale switcher re-renders correctly
- Mobile card layout is clean

### Viewer
- Public access works without auth
- Pool loads by shared URL
- Allocation cards render correctly
- Team names localize correctly
- Alive/eliminated banner is accurate
- Realtime updates reflect without refresh
- Header/back nav fits on mobile

### Admin
- Owner-only access enforced
- Non-owner gets denied state
- Inline title editing works
- Participant add/remove/edit works
- Extra-team flag works
- Allocation controls work
- Lock/unlock/clear behaves correctly
- Copy/share controls work
- Elimination tracker updates correctly
- Sync scores flow works
- Locale switcher works

## Auth & Access

- Signed-out users see landing page
- Sign-in with Google succeeds
- Sign-out returns to correct state
- Owner can access dashboard and admin
- Viewer route remains public
- Non-owner cannot use admin route
- Refresh with existing session behaves correctly

## Pool Lifecycle

- Create pool succeeds
- Create pool validation errors display correctly
- Pool limit behavior is correct
- Delete pool succeeds
- Deleted pool disappears from dashboard
- Viewer/admin routes for deleted pool fail gracefully

## Participants

- Add participant works
- Remove participant works
- Save count change works
- Prevent invalid counts
- Participant totals and helper text stay accurate
- Over-limit warnings display correctly

## Allocation

- Allocate teams works from empty state
- Re-allocation confirm works
- Lock prevents accidental changes
- Unlock confirm works
- Clear confirm works
- Allocation status text is accurate
- Empty allocation guard states display correctly
- WhatsApp copy/export only enabled when valid

## Elimination Tracker

- Manual elimination toggles correctly
- Suggested eliminations from score sync display correctly
- Sync error state displays correctly
- Debounce/lock prevents rapid duplicate saves
- Eliminated teams affect allocation card display correctly
- Alive-first sorting remains correct

## Realtime

- Viewer updates when admin changes allocation
- Viewer updates when teams are eliminated
- JSONB fields are parsed correctly on realtime payloads
- Route changes clean up subscriptions/intervals correctly
- No duplicate listeners after repeated navigation

## Localization

Run at least one pass in each locale:
- `en-US`
- `es-MX`
- `pt-PT`

For each locale verify:
- all screens translated
- no hardcoded mixed-language strings
- team names displayed correctly
- dynamic count/helper strings are correct
- buttons and headers fit on mobile
- locale persists after reload

## Responsive Checks

Minimum breakpoints to test:
- 375px mobile
- 390px mobile
- 768px tablet
- 1280px desktop

Focus on:
- header overflow
- button wrapping
- card spacing
- modal usability
- touch target size
- scroll traps

## Error / Empty / Loading States

- Loading states appear where expected
- Empty dashboard state looks correct
- No-allocation states look intentional
- Error messages appear and recover properly
- Missing pool / denied access states are clean

## Release Smoke Test

Before ship, validate:
1. Sign in
2. Create a pool
3. Add participants
4. Allocate teams
5. Open viewer in another tab
6. Eliminate a team in admin
7. Confirm viewer updates live
8. Switch locale and refresh
9. Test mobile width
10. Confirm no critical console errors
