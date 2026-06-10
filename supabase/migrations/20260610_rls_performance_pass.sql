-- Wrap auth.uid() in (select ...) so it evaluates once per query, not per row.

-- ── pools ────────────────────────────────────────────────────────────
drop policy if exists "Owner can insert pools" on public.pools;
create policy "Owner can insert pools" on public.pools
  for insert to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owner can update pools" on public.pools;
create policy "Owner can update pools" on public.pools
  for update to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owner can delete pools" on public.pools;
create policy "Owner can delete pools" on public.pools
  for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- ── profiles ──────────────────────────────────────────────────────────
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id);

-- ── saved_pools (already optimised — recreate for consistency) ────────
drop policy if exists "Users can view their saved pools" on public.saved_pools;
create policy "Users can view their saved pools" on public.saved_pools
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can save pools" on public.saved_pools;
create policy "Users can save pools" on public.saved_pools
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can unsave pools" on public.saved_pools;
create policy "Users can unsave pools" on public.saved_pools
  for delete to authenticated
  using ((select auth.uid()) = user_id);
