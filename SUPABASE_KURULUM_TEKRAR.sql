-- InsightQuotes Supabase kurulum SQL'i
-- Bu surum Supabase'in otomatik RLS ekleme davranisi ile carpismaz.
-- SQL Editor'de tek parca calistir.

create extension if not exists pgcrypto;

create schema if not exists private;

do 'begin
  create type public.app_role as enum (''admin'', ''user'');
exception when duplicate_object then null;
end';

do 'begin
  create type public.subscriber_status as enum (
    ''pending'',
    ''active'',
    ''unsubscribed'',
    ''bounced'',
    ''complained''
  );
exception when duplicate_object then null;
end';

do 'begin
  create type public.issue_status as enum (''draft'', ''published'');
exception when duplicate_object then null;
end';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as 'begin
  new.updated_at = now();
  return new;
end';

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status public.subscriber_status not null default 'pending',
  confirmation_token uuid not null default gen_random_uuid(),
  unsubscribe_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email)
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  issue_number int not null,
  slug text not null unique,
  title text not null,
  insight text not null,
  insight_author text,
  quote text not null,
  quote_author text,
  action_text text not null,
  body text,
  status public.issue_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_number)
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references public.subscribers(id) on delete set null,
  issue_id uuid references public.issues(id) on delete set null,
  email text not null,
  kind text not null,
  status text not null,
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as 'select exists (
  select 1
  from public.user_roles
  where user_id = _user_id
    and role = _role
)';

alter table public.user_roles enable row level security;
alter table public.subscribers enable row level security;
alter table public.issues enable row level security;
alter table public.email_events enable row level security;

drop trigger if exists subscribers_updated on public.subscribers;
create trigger subscribers_updated
before update on public.subscribers
for each row execute function public.set_updated_at();

drop trigger if exists issues_updated on public.issues;
create trigger issues_updated
before update on public.issues
for each row execute function public.set_updated_at();

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

grant select on public.subscribers to authenticated;
grant all on public.subscribers to service_role;

grant select on public.issues to anon, authenticated;
grant all on public.issues to service_role;

grant select on public.email_events to authenticated;
grant all on public.email_events to service_role;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke execute on function private.has_role(uuid, public.app_role) from public, anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop policy if exists "Users read own roles" on public.user_roles;
create policy "Users read own roles" on public.user_roles
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins read all roles" on public.user_roles;
create policy "Admins read all roles" on public.user_roles
for select to authenticated
using (private.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins read subscribers" on public.subscribers;
create policy "Admins read subscribers" on public.subscribers
for select to authenticated
using (private.has_role(auth.uid(), 'admin'));

drop policy if exists "Anyone reads published issues" on public.issues;
create policy "Anyone reads published issues" on public.issues
for select to anon, authenticated
using (status = 'published');

drop policy if exists "Admins read all issues" on public.issues;
create policy "Admins read all issues" on public.issues
for select to authenticated
using (private.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins read email events" on public.email_events;
create policy "Admins read email events" on public.email_events
for select to authenticated
using (private.has_role(auth.uid(), 'admin'));

insert into public.issues (
  issue_number,
  slug,
  title,
  insight,
  insight_author,
  quote,
  quote_author,
  action_text,
  status,
  published_at
)
select
  128,
  'issue-128-cost-of-inaction',
  'The Cost of Inaction',
  'The cost of inaction is usually far greater than the cost of a mistake.',
  'Tim Ferriss',
  'The question you should be asking is, what''s the worst that can happen?',
  'Tim Ferriss',
  'What''s one bold move you''ve been avoiding? Do it this week.',
  'published',
  now()
where not exists (
  select 1 from public.issues where issue_number = 128
);
