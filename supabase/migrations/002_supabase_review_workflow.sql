alter table public.opportunities
  add column if not exists jenny_comment_status text not null default 'ai_draft',
  add column if not exists jenny_comment_updated_at timestamptz,
  add column if not exists review_note text,
  add column if not exists ai_comment_suggestion text,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

alter table public.opportunities
  drop constraint if exists opportunities_status_check;
alter table public.opportunities
  add constraint opportunities_status_check
  check (status in ('pending', 'published', 'unpublished'));

alter table public.opportunities
  drop constraint if exists opportunities_jenny_comment_status_check;
alter table public.opportunities
  add constraint opportunities_jenny_comment_status_check
  check (jenny_comment_status in ('ai_draft', 'approved'));

create unique index if not exists opportunities_source_url_unique_idx
  on public.opportunities (source_url);

drop policy if exists "public can read published opportunities"
  on public.opportunities;
create policy "public can read reviewed opportunities"
on public.opportunities
for select
to anon
using (
  is_public = true
  and status = 'published'
  and jenny_comment_status = 'approved'
  and nullif(btrim(jenny_comment), '') is not null
);

create or replace function public.ingest_opportunity(p_payload jsonb)
returns table (
  record_id uuid,
  action text,
  needs_jenny_comment boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record_id uuid;
  v_action text;
  v_needs_jenny_comment boolean;
begin
  insert into public.opportunities (
    source_url,
    title,
    opportunity_type,
    audiences,
    time_requirement,
    skill_threshold,
    risk_level,
    ai_assistance,
    summary,
    ai_comment_suggestion,
    action_suggestion,
    published_date,
    source,
    tags,
    score,
    raw_payload,
    status,
    is_public,
    jenny_comment_status,
    last_synced_at
  )
  values (
    p_payload->>'source_url',
    p_payload->>'title',
    p_payload->>'opportunity_type',
    array(
      select jsonb_array_elements_text(
        coalesce(p_payload->'audiences', '[]'::jsonb)
      )
    ),
    p_payload->>'time_requirement',
    p_payload->>'skill_threshold',
    p_payload->>'risk_level',
    p_payload->>'ai_assistance',
    p_payload->>'summary',
    p_payload->>'ai_comment_suggestion',
    p_payload->>'action_suggestion',
    nullif(p_payload->>'published_date', '')::date,
    p_payload->>'source',
    array(
      select jsonb_array_elements_text(
        coalesce(p_payload->'tags', '[]'::jsonb)
      )
    ),
    (p_payload->>'score')::integer,
    coalesce(p_payload->'raw_payload', '{}'::jsonb),
    'pending',
    false,
    'ai_draft',
    now()
  )
  on conflict (source_url) do nothing
  returning id into v_record_id;

  if v_record_id is not null then
    v_action := 'inserted';
  else
    -- MACHINE_UPDATE_START
    update public.opportunities
    set
      title = p_payload->>'title',
      source = p_payload->>'source',
      published_date = nullif(p_payload->>'published_date', '')::date,
      opportunity_type = p_payload->>'opportunity_type',
      audiences = array(
        select jsonb_array_elements_text(
          coalesce(p_payload->'audiences', '[]'::jsonb)
        )
      ),
      time_requirement = p_payload->>'time_requirement',
      skill_threshold = p_payload->>'skill_threshold',
      risk_level = p_payload->>'risk_level',
      ai_assistance = p_payload->>'ai_assistance',
      summary = p_payload->>'summary',
      action_suggestion = p_payload->>'action_suggestion',
      score = (p_payload->>'score')::integer,
      tags = array(
        select jsonb_array_elements_text(
          coalesce(p_payload->'tags', '[]'::jsonb)
        )
      ),
      raw_payload = coalesce(p_payload->'raw_payload', '{}'::jsonb),
      ai_comment_suggestion = p_payload->>'ai_comment_suggestion',
      last_synced_at = now(),
      updated_at = now()
    where source_url = p_payload->>'source_url'
    returning id into v_record_id;
    -- MACHINE_UPDATE_END
    v_action := 'updated';
  end if;

  select (
    opportunity.jenny_comment_status <> 'approved'
    or nullif(btrim(opportunity.jenny_comment), '') is null
  )
  into v_needs_jenny_comment
  from public.opportunities as opportunity
  where opportunity.id = v_record_id;

  return query
  select v_record_id, v_action, v_needs_jenny_comment;
end;
$$;

revoke all on function public.ingest_opportunity(jsonb) from public;
revoke all on function public.ingest_opportunity(jsonb) from anon;
revoke all on function public.ingest_opportunity(jsonb) from authenticated;
grant execute on function public.ingest_opportunity(jsonb) to service_role;
