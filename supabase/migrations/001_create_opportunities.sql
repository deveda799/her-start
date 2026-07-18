create extension if not exists pgcrypto;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  feishu_record_id text unique,
  source_url text not null unique,
  title text not null,
  opportunity_type text not null,
  audiences text[] not null default '{}',
  time_requirement text,
  skill_threshold text,
  risk_level text not null,
  ai_assistance text,
  summary text not null,
  jenny_comment text,
  action_suggestion text,
  published_date date,
  source text not null,
  tags text[] not null default '{}',
  score integer not null check (score between 0 and 100),
  status text not null check (status in ('published', 'unpublished')),
  is_public boolean not null default false,
  published_at timestamptz,
  unpublished_at timestamptz,
  last_synced_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists opportunities_public_list_idx
  on public.opportunities (is_public, status, published_at desc);

create index if not exists opportunities_tags_idx
  on public.opportunities using gin (tags);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists opportunities_set_updated_at on public.opportunities;
create trigger opportunities_set_updated_at
before update on public.opportunities
for each row execute function public.set_updated_at();

alter table public.opportunities enable row level security;

revoke all on public.opportunities from anon;
grant select on public.opportunities to anon;
grant all on public.opportunities to service_role;

drop policy if exists "public can read published opportunities"
  on public.opportunities;
create policy "public can read published opportunities"
on public.opportunities
for select
to anon
using (is_public = true and status = 'published');
