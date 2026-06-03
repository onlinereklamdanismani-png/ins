ALTER TABLE public.email_events
ADD COLUMN IF NOT EXISTS issue_id uuid REFERENCES public.issues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS email_events_issue_id_idx
ON public.email_events(issue_id);

CREATE INDEX IF NOT EXISTS email_events_issue_delivery_idx
ON public.email_events(issue_id, subscriber_id, status)
WHERE kind = 'issue';

UPDATE public.email_events event
SET issue_id = issue.id
FROM public.issues issue
WHERE event.kind = 'issue'
  AND event.issue_id IS NULL
  AND event.error IS NULL
  AND event.created_at >= issue.created_at
  AND event.created_at <= coalesce(issue.published_at, issue.created_at) + interval '30 days'
  AND issue.issue_number = (
    SELECT max(candidate.issue_number)
    FROM public.issues candidate
    WHERE candidate.created_at <= event.created_at
  );
