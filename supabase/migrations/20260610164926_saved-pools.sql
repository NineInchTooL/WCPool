-- saved_pools: lets authenticated users pin/save pools they don't own
create table if not exists public.saved_pools (
  user_id  uuid        not null references auth.users(id) on delete cascade,
  pool_id  text        not null references public.pools(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, pool_id)
);

alter table public.saved_pools enable row level security;

create policy "Users can view their saved pools"
  on public.saved_pools for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save pools"
  on public.saved_pools for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can unsave pools"
  on public.saved_pools for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.saved_pools to authenticated;
