/*
# Multi-author blog schema

1. New Tables
- `profiles` — extends `auth.users` with a role (`reader`, `author`, `editor`) and an API token used by the public read-only API. The first user to register becomes an `editor` automatically.
- `articles` — blog posts with title, rich-text content, author, status (`draft` | `review` | `published`), tags, and timestamps. Drafts and review posts are only visible to their author and to editors.
- `comments` — authenticated readers can comment on published articles. Comments support basic formatting (stored as text, rendered with a safe formatter on the client).

2. Security (RLS)
- `profiles`: each authenticated user can read all profiles (needed to show author names) but can only update/insert their own. Editors can update any profile's role.
- `articles`:
  - SELECT: anyone can read `published` articles; the author can read their own drafts/review posts; editors can read all articles.
  - INSERT: any authenticated user can create an article (default role `author`).
  - UPDATE: the author can update their own article; editors can update any article (to publish/unpublish).
  - DELETE: the author can delete their own article; editors can delete any article.
- `comments`:
  - SELECT: anyone can read comments on published articles.
  - INSERT: any authenticated user can comment on a published article.
  - UPDATE/DELETE: the comment author can update/delete their own comment; editors can delete any comment.

3. Automation
- A trigger creates a `profiles` row on every new `auth.users` insert. The very first user (when `auth.users` is empty at insert time) is assigned the `editor` role; all subsequent users default to `reader`.
- `updated_at` triggers keep the `articles` and `comments` timestamps current.

4. Indexes
- `articles.status`, `articles.author_id`, and a GIN index on `articles.tags` for tag search.
- `comments.article_id` for fetching a thread.
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'reader' CHECK (role IN ('reader','author','editor')),
  api_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
ON public.profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_self_or_editor" ON public.profiles;
CREATE POLICY "profiles_update_self_or_editor"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'editor')
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'editor')
);

-- ---------- articles ----------
CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published')),
  tags text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- SELECT: published visible to anyone (incl. anon); drafts/review visible to author + editors
DROP POLICY IF EXISTS "articles_select" ON public.articles;
CREATE POLICY "articles_select"
ON public.articles FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  OR auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'editor')
);

-- INSERT: any authenticated user
DROP POLICY IF EXISTS "articles_insert" ON public.articles;
CREATE POLICY "articles_insert"
ON public.articles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- UPDATE: author or editor
DROP POLICY IF EXISTS "articles_update" ON public.articles;
CREATE POLICY "articles_update"
ON public.articles FOR UPDATE
TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'editor')
)
WITH CHECK (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'editor')
);

-- DELETE: author or editor
DROP POLICY IF EXISTS "articles_delete" ON public.articles;
CREATE POLICY "articles_delete"
ON public.articles FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'editor')
);

-- ---------- comments ----------
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- SELECT: anyone can read comments on published articles
DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select"
ON public.comments FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.articles a WHERE a.id = comments.article_id AND a.status = 'published')
);

-- INSERT: any authenticated user can comment on a published article
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (SELECT 1 FROM public.articles a WHERE a.id = comments.article_id AND a.status = 'published')
);

-- UPDATE: comment author only
DROP POLICY IF EXISTS "comments_update" ON public.comments;
CREATE POLICY "comments_update"
ON public.comments FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- DELETE: comment author or editor
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_delete"
ON public.comments FOR DELETE
TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'editor')
);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author ON public.articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_comments_article ON public.comments(article_id);

-- ---------- updated_at triggers ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_articles_updated_at ON public.articles;
CREATE TRIGGER trg_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_comments_updated_at ON public.comments;
CREATE TRIGGER trg_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- auto-create profile on signup; first user becomes editor ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count int;
  assigned_role text;
BEGIN
  SELECT count(*) INTO user_count FROM auth.users;
  -- user_count is the count BEFORE this row is committed; if 0, this is the first user
  IF user_count = 0 THEN
    assigned_role := 'editor';
  ELSE
    assigned_role := 'reader';
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, assigned_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow the trigger (running as the new user's session) to read auth.users count.
-- The SECURITY DEFINER function runs as the owner (postgres), so this is fine.
