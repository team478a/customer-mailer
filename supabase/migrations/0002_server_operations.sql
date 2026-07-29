alter table public.deliveries
  add column if not exists idempotency_key text;

create unique index if not exists deliveries_project_idempotency_idx
  on public.deliveries(project_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.webhook_events (
  id text primary key,
  provider text not null,
  event_type text not null,
  provider_message_id text,
  payload jsonb not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists webhook_events_message_idx
  on public.webhook_events(provider_message_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_project_created_idx
  on public.audit_logs(project_id, created_at desc);

alter table public.webhook_events enable row level security;
alter table public.audit_logs enable row level security;

create policy "members can read audit logs"
  on public.audit_logs for select
  using (project_id is not null and public.is_project_member(project_id));

create policy "members can create own audit logs"
  on public.audit_logs for insert
  with check (
    actor_id = auth.uid()
    and project_id is not null
    and public.is_project_member(project_id)
  );

create policy "authenticated users can create projects"
  on public.projects for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "owners can update projects"
  on public.projects for update
  using (
    exists (
      select 1 from public.project_members
      where project_id = projects.id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

create policy "owners can delete projects"
  on public.projects for delete
  using (
    exists (
      select 1 from public.project_members
      where project_id = projects.id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

create policy "members can view project memberships"
  on public.project_members for select
  using (public.is_project_member(project_id));

create or replace function public.add_project_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members(project_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

drop trigger if exists projects_add_owner on public.projects;
create trigger projects_add_owner
after insert on public.projects
for each row execute function public.add_project_owner();

create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_touch_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();
create trigger customers_touch_updated_at
before update on public.customers
for each row execute function public.touch_updated_at();
create trigger templates_touch_updated_at
before update on public.mail_templates
for each row execute function public.touch_updated_at();
create trigger drafts_touch_updated_at
before update on public.drafts
for each row execute function public.touch_updated_at();
create trigger settings_touch_updated_at
before update on public.project_settings
for each row execute function public.touch_updated_at();
