# WCPool — Architecture Notes

Additive notes for contributors. The full original architecture writeup is in
[`DEVELOPMENT.md § 3`](../DEVELOPMENT.md#3-architecture).

---

## RLS Policy Performance Pattern

All RLS ownership predicates must wrap `auth.uid()` in a subquery:

```sql
-- Do this:
USING ((select auth.uid()) = owner_id)

-- Not this:
USING (auth.uid() = owner_id)
```

**Why:** Without the subquery, Postgres re-evaluates `auth.uid()` for every row
scanned. With `(select auth.uid())`, it evaluates once per query and the result
is reused. On the `pools` table this is low-impact today, but the pattern is
enforced consistently via `20260610_rls_performance_pass.sql` across `pools`,
`profiles`, and `saved_pools`.

Apply this pattern to every new policy that checks the current user's identity.

---

## Realtime Subscription Rules

The viewer opens one Supabase Realtime channel per pool page load. New
subscriptions must follow these rules:

1. **Keep a channel reference.** Store the result of `db.channel(...)` so you
   can call `.unsubscribe()` on unmount.
2. **Clean up on unmount.** Call `channel.unsubscribe()` (or `db.removeChannel(channel)`)
   when navigating away. Stale listeners accumulate silently across hash-route
   changes otherwise.
3. **Filter to the relevant pool.** Use `filter: \`id=eq.${poolId}\`` — never
   subscribe to the full `pools` table without a row filter.
4. **Guard JSON/JSONB parsing.** Realtime payloads return JSONB columns as raw
   strings. Always check `typeof field === 'string'` before `JSON.parse()`.

See [`docs/realtime.md`](realtime.md) for implementation details and the
elimination banner subscription.

---

## Viewer Routing

All shareable links use the hash-based route:

```
https://{origin}/#/pool/{pool_id}
```

- No server-side route needed — `vercel.json` rewrites everything to `index.html`
- `router()` is called on `hashchange` and initial load; it parses `location.hash`
- The viewer route (`#/pool/:id`) is public and requires no auth
- The admin route (`#/pool/:id/admin`) checks `pool.owner_id === auth.uid()`
  and redirects non-owners back to the viewer

Do not link directly to the Supabase row or use pool IDs in any other URL form.
Pool IDs are nanoid(6) strings — treat them as opaque tokens.

---

## Edge Function: `wc-scores`

Two query modes, selected via `?mode=`:

| Mode | Used by | Returns |
|---|---|---|
| `scores` (default) | Admin elimination sync | Finished GROUP_STAGE matches |
| `today` | Viewer Today's Matches strip | All fixtures for today |

**Today mode data strategy:**
- Always queries both football-data.org (UTC date filter) and worldcup26.ir
  (local date filter)
- Merges results, preferring football-data.org entries (proper UTC timestamps)
- Supplements with worldcup26.ir for evening games that fall past UTC midnight
- Deduplication key: `"${home}|${away}"`

**`worldcup26.ir` quirk:** The API requires `Accept: application/json` in the
request headers. Without it, the response is an unquoted JS-object schema that
fails `JSON.parse`. Always set this header on requests to that API.
