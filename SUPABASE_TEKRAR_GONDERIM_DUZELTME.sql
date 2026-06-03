alter table public.email_events
add column if not exists issue_id uuid references public.issues(id) on delete set null;

create index if not exists email_events_issue_id_idx
on public.email_events(issue_id);

create index if not exists email_events_issue_delivery_idx
on public.email_events(issue_id, subscriber_id, status)
where kind = 'issue';
