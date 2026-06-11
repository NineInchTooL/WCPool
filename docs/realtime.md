# WCPool — Realtime Notes

Covers all Supabase Realtime subscriptions in the app.  
For setup steps (enabling replication in the dashboard), see
[`DEVELOPMENT.md § 4`](../DEVELOPMENT.md#4-supabase-setup).

---

## Pool viewer subscription

The viewer subscribes to `UPDATE` events on the `pools` table, filtered to the
current pool:

```js
const channel = db.channel(`pool-${poolId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'pools',
    filter: `id=eq.${poolId}`,
  }, payload => {
    const updated = payload.new;
    // JSONB columns arrive as raw strings — always parse before use
    if (typeof updated.allocation       === 'string') updated.allocation       = JSON.parse(updated.allocation);
    if (typeof updated.eliminated_teams === 'string') updated.eliminated_teams = JSON.parse(updated.eliminated_teams);
    if (typeof updated.participants     === 'string') updated.participants      = JSON.parse(updated.participants);
    renderViewerContent(updated);
  })
  .subscribe(status => {
    // status: 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT'
  });
```

Channel is removed when the viewer unmounts (hash route changes away).

---

## Elimination banner subscription

Same channel and event as the pool viewer subscription above — no second channel
is opened. The elimination diff runs inside the `UPDATE` handler:

```js
// Inside the UPDATE handler, after re-rendering:
const newElim = updated.eliminated_teams || [];
const newly   = newElim.filter(name => !lastKnownEliminated.has(name));
if (newly.length && isNonOwnerSavedViewer) {
  showEliminationBanner(poolId, newly);
}
lastKnownEliminated = new Set(newElim);
```

- `lastKnownEliminated` is a `Set` held in the viewer's closure, initialized from
  the pool's `eliminated_teams` at page load
- Only newly eliminated teams (not in the previous set) are shown in the banner
- The banner is dismissed in memory — no DB write
- On initial load, the same diff runs against a `lastChecked` timestamp stored
  per pool in `sessionStorage` to catch eliminations that occurred while offline

---

## Live score sync (admin only)

The admin panel polls the `wc-scores` edge function (`?mode=scores`) on open
and every 5 minutes:

- Response: array of finished GROUP_STAGE matches
- Admin builds group standings client-side, surfaces 0-point teams as
  elimination suggestions
- Suggestions are never applied automatically — admin must confirm each one

This is a REST poll, not a Realtime subscription. No channel is opened by the
admin for score data.

---

## Implementation rules

Follow these rules for any new Realtime subscription:

- **One channel per pool page.** Don't open a second channel for the same table
  and row; add extra `.on(...)` handlers to the existing channel instead.
- **Always store the channel reference** so you can call `channel.unsubscribe()`
  on unmount.
- **Filter to the relevant row.** Use `filter: \`id=eq.${poolId}\`` — an
  unscoped subscription to `pools` would receive every pool's updates.
- **Parse JSONB fields defensively.** Realtime returns JSONB as raw strings in
  `payload.new`. Check `typeof field === 'string'` before calling `JSON.parse()`.
- **Guard against ghost listeners.** Hash-route navigation in this SPA does not
  reload the page. If you open a channel inside a render function without
  cleaning up, each navigation accumulates another listener.
