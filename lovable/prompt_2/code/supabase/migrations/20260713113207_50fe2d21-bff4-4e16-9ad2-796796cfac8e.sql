
-- Enums
CREATE TYPE public.app_role AS ENUM ('reader', 'author', 'editor');
CREATE TYPE public.article_status AS ENUM ('draft', 'in_review', 'published');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  api_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles read own or editor" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'editor'));

-- has_role function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Trigger: create profile + assign first-user editor / others reader on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  first_role app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    first_role := 'editor';
  ELSE
    first_role := 'reader';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, first_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Articles
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status article_status NOT NULL DEFAULT 'draft',
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Public reads only published
CREATE POLICY "articles public read published" ON public.articles FOR SELECT TO anon
  USING (status = 'published');
-- Authenticated: published OR own OR editor
CREATE POLICY "articles auth read" ON public.articles FOR SELECT TO authenticated
  USING (status = 'published' OR author_id = auth.uid() OR public.has_role(auth.uid(), 'editor'));
-- Authors and editors can insert own
CREATE POLICY "articles insert" ON public.articles FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'editor')));
-- Authors update own (except publishing); editors can update anything
CREATE POLICY "articles update own or editor" ON public.articles FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'editor'));
-- Delete own or editor
CREATE POLICY "articles delete own or editor" ON public.articles FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'editor'));

-- Only editors can set status to 'published'
CREATE OR REPLACE FUNCTION public.enforce_publish_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    IF NOT public.has_role(auth.uid(), 'editor') THEN
      RAISE EXCEPTION 'Only editors can publish articles';
    END IF;
    NEW.published_at := COALESCE(NEW.published_at, now());
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status <> 'published' THEN
    IF NOT public.has_role(auth.uid(), 'editor') THEN
      RAISE EXCEPTION 'Only editors can unpublish articles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER articles_publish_guard
  BEFORE INSERT OR UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_publish_role();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX articles_status_idx ON public.articles(status);
CREATE INDEX articles_tags_idx ON public.articles USING GIN(tags);
CREATE INDEX articles_search_idx ON public.articles USING GIN (to_tsvector('simple', title || ' ' || content));

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments read on published" ON public.comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND (a.status = 'published' OR a.author_id = auth.uid() OR public.has_role(auth.uid(), 'editor'))));
CREATE POLICY "comments insert authenticated on published" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.status = 'published'));
CREATE POLICY "comments update own" ON public.comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments delete own or editor" ON public.comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'editor'));
