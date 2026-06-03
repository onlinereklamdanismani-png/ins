
-- Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscriber_status AS ENUM ('pending','active','unsubscribed','bounced','complained');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.issue_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ user_roles ============
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ subscribers ============
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status public.subscriber_status NOT NULL DEFAULT 'pending',
  confirmation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);
GRANT SELECT ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS subscribers_updated ON public.subscribers;
CREATE TRIGGER subscribers_updated BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Admins read subscribers" ON public.subscribers;
CREATE POLICY "Admins read subscribers" ON public.subscribers
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ issues ============
CREATE TABLE IF NOT EXISTS public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number int NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  insight text NOT NULL,
  insight_author text,
  quote text NOT NULL,
  quote_author text,
  action_text text NOT NULL,
  body text,
  status public.issue_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issue_number)
);
GRANT SELECT ON public.issues TO anon, authenticated;
GRANT ALL ON public.issues TO service_role;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS issues_updated ON public.issues;
CREATE TRIGGER issues_updated BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Anyone reads published issues" ON public.issues;
CREATE POLICY "Anyone reads published issues" ON public.issues
  FOR SELECT TO anon, authenticated USING (status = 'published');
DROP POLICY IF EXISTS "Admins read all issues" ON public.issues;
CREATE POLICY "Admins read all issues" ON public.issues
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ email_events ============
CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid REFERENCES public.subscribers(id) ON DELETE SET NULL,
  issue_id uuid REFERENCES public.issues(id) ON DELETE SET NULL,
  email text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL,
  provider_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read email events" ON public.email_events;
CREATE POLICY "Admins read email events" ON public.email_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Seed sample published issue
INSERT INTO public.issues (issue_number, slug, title, insight, insight_author, quote, quote_author, action_text, status, published_at)
SELECT 128, 'issue-128-cost-of-inaction', 'The Cost of Inaction',
  'The cost of inaction is usually far greater than the cost of a mistake.',
  'Tim Ferriss',
  'The question you should be asking is, what''s the worst that can happen?',
  'Tim Ferriss',
  'What''s one bold move you''ve been avoiding? Do it this week.',
  'published',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.issues WHERE issue_number = 128
);
