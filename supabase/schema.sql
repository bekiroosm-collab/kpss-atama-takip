create extension if not exists pgcrypto;
create table if not exists public.notices (
 id text primary key,
 title text not null,
 institution text not null,
 source text not null check (source in ('İŞKUR','Kariyer Kapısı','Resmî Gazete','Kamu İlanları')),
 city text,
 position text,
 quota integer,
 education text,
 kpss text,
 published_at timestamptz,
 application_start timestamptz,
 application_end timestamptz,
 url text not null,
 summary text,
 tags text[] default '{}',
 raw_hash text,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);
create index if not exists notices_published_at_idx on public.notices(published_at desc);
create index if not exists notices_source_idx on public.notices(source);
create table if not exists public.source_runs (
 id bigint generated always as identity primary key,
 source text not null,
 status text not null,
 message text,
 checked_at timestamptz default now(),
 finished_at timestamptz
);
create table if not exists public.push_subscriptions (
 id bigint generated always as identity primary key,
 endpoint text unique not null,
 subscription jsonb not null,
 created_at timestamptz default now()
);
alter table public.notices enable row level security;
alter table public.source_runs enable row level security;
alter table public.push_subscriptions enable row level security;
-- Public read-only access for published notices and source status.
create policy "public can read notices" on public.notices for select using (true);
create policy "public can read source runs" on public.source_runs for select using (true);
-- Do not add public policies for subscriptions. Server writes with service role.
