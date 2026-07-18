create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null unique,
  title text not null,
  subtitle text not null,
  summary text not null,
  total_collected integer not null default 0,
  total_selected integer not null default 0,
  total_recommended integer not null default 0,
  total_high_risk integer not null default 0,
  total_low_barrier integer not null default 0,
  total_ai_assisted integer not null default 0,
  trend_analysis jsonb not null default '{}'::jsonb,
  action_suggestions jsonb not null default '{}'::jsonb,
  jenny_daily_comment text,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'unpublished')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.daily_report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  rank integer not null check (rank between 1 and 10),
  title text not null,
  source text not null,
  source_url text not null,
  opportunity_type text not null,
  audiences text[] not null default '{}',
  skill_level text,
  time_requirement text,
  risk_level text not null,
  score integer not null check (score between 0 and 100),
  ai_summary text not null,
  reason_for_selection text not null,
  action_step text not null,
  jenny_comment text,
  jenny_recommended boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (report_id, source_url)
);

create index if not exists daily_reports_public_date_idx
  on public.daily_reports (is_public, status, report_date desc);
create index if not exists daily_report_items_report_rank_idx
  on public.daily_report_items (report_id, rank);

drop trigger if exists daily_reports_set_updated_at on public.daily_reports;
create trigger daily_reports_set_updated_at
before update on public.daily_reports
for each row execute function public.set_updated_at();

drop trigger if exists daily_report_items_set_updated_at
  on public.daily_report_items;
create trigger daily_report_items_set_updated_at
before update on public.daily_report_items
for each row execute function public.set_updated_at();

alter table public.daily_reports enable row level security;
alter table public.daily_report_items enable row level security;

revoke all on public.daily_reports from anon;
revoke all on public.daily_report_items from anon;
grant select on public.daily_reports to anon;
grant select on public.daily_report_items to anon;
grant all on public.daily_reports to service_role;
grant all on public.daily_report_items to service_role;

create policy "public can read published daily reports"
on public.daily_reports
for select
to anon
using (status = 'published' and is_public = true);

create policy "public can read published daily report items"
on public.daily_report_items
for select
to anon
using (
  exists (
    select 1
    from public.daily_reports report
    where report.id = report_id
      and report.status = 'published'
      and report.is_public = true
  )
);

create or replace function public.ingest_daily_report(
  p_report jsonb,
  p_items jsonb
)
returns table (report_id uuid, action text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_id uuid;
  v_action text;
  v_item jsonb;
begin
  insert into public.daily_reports (
    report_date, title, subtitle, summary, total_collected, total_selected,
    total_recommended, total_high_risk, total_low_barrier, total_ai_assisted,
    trend_analysis, action_suggestions, raw_payload, status, is_public
  )
  values (
    (p_report->>'report_date')::date,
    p_report->>'title',
    p_report->>'subtitle',
    p_report->>'summary',
    (p_report->>'total_collected')::integer,
    (p_report->>'total_selected')::integer,
    (p_report->>'total_recommended')::integer,
    (p_report->>'total_high_risk')::integer,
    (p_report->>'total_low_barrier')::integer,
    (p_report->>'total_ai_assisted')::integer,
    coalesce(p_report->'trend_analysis', '{}'::jsonb),
    coalesce(p_report->'action_suggestions', '{}'::jsonb),
    coalesce(p_report->'raw_payload', '{}'::jsonb),
    'pending',
    false
  )
  on conflict (report_date) do nothing
  returning id into v_report_id;

  if v_report_id is not null then
    v_action := 'inserted';
  else
    -- REPORT_MACHINE_UPDATE_START
    update public.daily_reports
    set
      title = p_report->>'title',
      subtitle = p_report->>'subtitle',
      summary = p_report->>'summary',
      total_collected = (p_report->>'total_collected')::integer,
      total_selected = (p_report->>'total_selected')::integer,
      total_recommended = (p_report->>'total_recommended')::integer,
      total_high_risk = (p_report->>'total_high_risk')::integer,
      total_low_barrier = (p_report->>'total_low_barrier')::integer,
      total_ai_assisted = (p_report->>'total_ai_assisted')::integer,
      trend_analysis = coalesce(p_report->'trend_analysis', '{}'::jsonb),
      action_suggestions = coalesce(p_report->'action_suggestions', '{}'::jsonb),
      raw_payload = coalesce(p_report->'raw_payload', '{}'::jsonb),
      updated_at = now()
    where report_date = (p_report->>'report_date')::date
    returning id into v_report_id;
    -- REPORT_MACHINE_UPDATE_END
    v_action := 'updated';
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(p_items, '[]'))
  loop
    insert into public.daily_report_items (
      report_id, opportunity_id, rank, title, source, source_url,
      opportunity_type, audiences, skill_level, time_requirement, risk_level,
      score, ai_summary, reason_for_selection, action_step, tags
    )
    values (
      v_report_id,
      nullif(v_item->>'opportunity_id', '')::uuid,
      (v_item->>'rank')::integer,
      v_item->>'title',
      v_item->>'source',
      v_item->>'source_url',
      v_item->>'opportunity_type',
      array(select jsonb_array_elements_text(coalesce(v_item->'audiences', '[]'))),
      v_item->>'skill_level',
      v_item->>'time_requirement',
      v_item->>'risk_level',
      (v_item->>'score')::integer,
      v_item->>'ai_summary',
      v_item->>'reason_for_selection',
      v_item->>'action_step',
      array(select jsonb_array_elements_text(coalesce(v_item->'tags', '[]')))
    )
    on conflict (report_id, source_url) do update
    -- ITEM_MACHINE_UPDATE_START
    set
      opportunity_id = excluded.opportunity_id,
      rank = excluded.rank,
      title = excluded.title,
      source = excluded.source,
      opportunity_type = excluded.opportunity_type,
      audiences = excluded.audiences,
      skill_level = excluded.skill_level,
      time_requirement = excluded.time_requirement,
      risk_level = excluded.risk_level,
      score = excluded.score,
      ai_summary = excluded.ai_summary,
      reason_for_selection = excluded.reason_for_selection,
      action_step = excluded.action_step,
      tags = excluded.tags,
      updated_at = now();
    -- ITEM_MACHINE_UPDATE_END
  end loop;

  return query select v_report_id, v_action;
end;
$$;

revoke all on function public.ingest_daily_report(jsonb, jsonb) from public;
revoke all on function public.ingest_daily_report(jsonb, jsonb) from anon;
revoke all on function public.ingest_daily_report(jsonb, jsonb)
  from authenticated;
grant execute on function public.ingest_daily_report(jsonb, jsonb)
  to service_role;
