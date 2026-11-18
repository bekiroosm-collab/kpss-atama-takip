-- Run in the same project as schema.sql.
create table if not exists public.push_keypair (
  id boolean primary key check (id),
  public_key text not null,
  private_key text not null
);
alter table public.push_keypair enable row level security;
revoke all on public.push_keypair from public, anon, authenticated;
grant select, insert on public.push_keypair to service_role;

alter table public.push_subscriptions add column if not exists baseline text[] not null default '{}';
create table if not exists public.push_deliveries (
  subscription_id bigint references public.push_subscriptions(id) on delete cascade,
  notice_id text not null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key (subscription_id, notice_id)
);
alter table public.push_deliveries enable row level security;
revoke all on public.push_deliveries from public, anon, authenticated;
grant all on public.push_deliveries to service_role;

create or replace function public.claim_p94_delivery(sid bigint, nid text) returns boolean
language sql as $$
  with acquired as (
    insert into public.push_deliveries(subscription_id,notice_id) values(sid,nid)
    on conflict(subscription_id,notice_id) do update set claimed_at=now()
    where push_deliveries.sent_at is null and push_deliveries.claimed_at < now()-interval '5 minutes'
    returning 1
  ) select exists(select from acquired)
$$;
revoke all on function public.claim_p94_delivery(bigint,text) from public, anon, authenticated;
grant execute on function public.claim_p94_delivery(bigint,text) to service_role;
