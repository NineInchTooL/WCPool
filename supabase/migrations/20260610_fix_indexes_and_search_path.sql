-- Fix mutable search_path on check_pool_cap (security hardening)
alter function public.check_pool_cap set search_path = public;

-- Index on saved_pools.pool_id (FK to pools)
create index if not exists idx_saved_pools_pool_id on public.saved_pools(pool_id);

-- Index on pools.owner_id (FK to profiles)
create index if not exists idx_pools_owner_id on public.pools(owner_id);
