
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rate limits (rolling window counter)
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, bucket, window_start)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- service_role only; no client policies needed.
CREATE INDEX rate_limits_lookup ON public.rate_limits (user_id, bucket, window_start DESC);

-- AI response cache (shared across users)
CREATE TABLE public.ai_cache (
  cache_key TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  payload JSONB NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_cache TO service_role;
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
CREATE INDEX ai_cache_mode_idx ON public.ai_cache (mode);

-- Usage events (feeds analytics dashboard)
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'text' | 'visual' | 'slides'
  ms INTEGER,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ok', -- 'ok' | 'error' | 'rate_limited'
  tokens INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own usage" ON public.usage_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all usage" ON public.usage_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX usage_events_created_idx ON public.usage_events (created_at DESC);
CREATE INDEX usage_events_user_idx ON public.usage_events (user_id, created_at DESC);
