-- Design-only migration for the next MailSend phase.
-- It is not applied by the local MVP.

create extension if not exists pgcrypto;

create type public.project_role as enum ('owner', 'member');
create type public.customer_status as enum ('pending', 'in_progress', 'completed');
create type public.delivery_status as enum (
  'draft',
  'queued',
  'sending',
  'sent',
  'partially_failed',
  'failed'
);
create type public.recipient_delivery_status as enum (
  'queued',
  'sending',
  'sent',
  'failed'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.project_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  order_number text not null default '',
  status public.customer_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, normalized_email)
);

create index customers_project_status_idx
  on public.customers(project_id, status);

create table public.mail_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.drafts (
  project_id uuid primary key references public.projects(id) on delete cascade,
  subject text not null default '',
  body text not null default '',
  updated_at timestamptz not null default now()
);

create table public.project_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  mail_provider text not null default 'local'
    check (mail_provider in ('local', 'resend')),
  data_provider text not null default 'local'
    check (data_provider in ('local', 'supabase')),
  from_name text not null default 'MailSend',
  from_email text not null default '',
  reply_to text not null default '',
  subject_prefix text not null default '',
  signature text not null default '',
  footer text not null default '',
  include_unsubscribe_footer boolean not null default true,
  test_mode boolean not null default true,
  batch_size integer not null default 20 check (batch_size between 1 and 100),
  delay_ms integer not null default 500 check (delay_ms between 0 and 60000),
  updated_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  subject text not null,
  body text not null,
  status public.delivery_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index deliveries_project_created_idx
  on public.deliveries(project_id, created_at desc);

create table public.delivery_recipients (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  email text not null,
  personalized_subject text not null,
  personalized_body text not null,
  status public.recipient_delivery_status not null default 'queued',
  provider_message_id text,
  error_message text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz
);

create index delivery_recipients_delivery_status_idx
  on public.delivery_recipients(delivery_id, status);

create table public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  normalized_email text generated always as (lower(trim(email))) stored,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (project_id, normalized_email)
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.customers enable row level security;
alter table public.mail_templates enable row level security;
alter table public.drafts enable row level security;
alter table public.project_settings enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_recipients enable row level security;
alter table public.suppression_list enable row level security;

create function public.is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project_id
      and user_id = auth.uid()
  );
$$;

create policy "members can access projects"
  on public.projects for select
  using (public.is_project_member(id));

create policy "members can access customers"
  on public.customers for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "members can access templates"
  on public.mail_templates for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "members can access drafts"
  on public.drafts for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "members can access project settings"
  on public.project_settings for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "members can access deliveries"
  on public.deliveries for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy "members can access delivery recipients"
  on public.delivery_recipients for all
  using (
    exists (
      select 1
      from public.deliveries
      where deliveries.id = delivery_recipients.delivery_id
        and public.is_project_member(deliveries.project_id)
    )
  );

create policy "members can access suppression list"
  on public.suppression_list for all
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));
