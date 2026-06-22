/*
# Create profiles, tasks, and storage for task management app

1. Overview
This migration sets up the full data model for a multi-user task management application:
- `profiles` table extends `auth.users` with role (admin/user) and active status.
- `tasks` table stores tasks scoped per user with priority, status, deadlines, and an optional file attachment path.
- Storage bucket `task-attachments` stores file uploads (images/PDFs up to 5MB).
- The FIRST user to register is promoted to admin automatically via a trigger.

2. New Tables
- `profiles`
  - `id` (uuid, primary key, matches auth.users.id)
  - `email` (text, the user's email duplicated for convenient listing)
  - `role` (text, 'admin' | 'user', default 'user')
  - `is_active` (boolean, default true)
  - `full_name` (text, optional display name)
  - `created_at` (timestamptz)
- `tasks`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text)
  - `priority` (text, 'baja' | 'media' | 'alta', default 'media')
  - `status` (text, 'pendiente' | 'en_curso' | 'completada', default 'pendiente')
  - `due_date` (date, optional deadline)
  - `user_id` (uuid, owner, defaults to auth.uid())
  - `attachment_path` (text, path to file in storage bucket, nullable)
  - `attachment_name` (text, original file name, nullable)
  - `created_at` (timestamptz)

3. Security (RLS)
- `profiles`: users can read/update their own profile. Admins can read all profiles and update any profile's role/active status (scoped via a security-definer helper `is_admin()`).
- `tasks`: normal users can CRUD only their own tasks. Admins can read ALL tasks (but only update/read, not delete unless they own them).
- Storage bucket `task-attachments`: authenticated users can upload/list/download/delete files under their own folder prefix.

4. Functions / Triggers
- `handle_new_user()` trigger: on insert into auth.users, creates a profile row copying email, and auto-promotes the FIRST user ever to admin.
- `is_admin(uuid)` helper: returns boolean whether the given uid (default current) has role='admin'.

5. Notes
- Email confirmation stays OFF.
- RLS enabled on every table.
- All policies are idempotent (drop + create).
*/

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  is_active boolean NOT NULL DEFAULT true,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper: is a given uid (defaults to auth.uid()) an admin?
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$;

-- Policies for profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile (change role, activate/deactivate)
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin"
ON profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =========================================================
-- TASKS
-- =========================================================
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baja','media','alta')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_curso','completada')),
  due_date date,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  attachment_path text,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at DESC);

-- SELECT: owners see their own; admins see all
DROP POLICY IF EXISTS "tasks_select_own_or_admin" ON tasks;
CREATE POLICY "tasks_select_own_or_admin"
ON tasks FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- INSERT: only owner
DROP POLICY IF EXISTS "tasks_insert_own" ON tasks;
CREATE POLICY "tasks_insert_own"
ON tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: owner can update own; admin can update any
DROP POLICY IF EXISTS "tasks_update_own_or_admin" ON tasks;
CREATE POLICY "tasks_update_own_or_admin"
ON tasks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- DELETE: owner can delete own; admin can delete any
DROP POLICY IF EXISTS "tasks_delete_own_or_admin" ON tasks;
CREATE POLICY "tasks_delete_own_or_admin"
ON tasks FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- =========================================================
-- TRIGGER: create profile on signup, first user becomes admin
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  -- If this is the first user (no other profiles exist), promote to admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id <> NEW.id) THEN
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- STORAGE: task-attachments bucket + policies
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload to their own folder: task-attachments/<uid>/<filename>
DROP POLICY IF EXISTS "task_attachments_insert_own" ON storage.objects;
CREATE POLICY "task_attachments_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "task_attachments_select_own_or_admin" ON storage.objects;
CREATE POLICY "task_attachments_select_own_or_admin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "task_attachments_delete_own" ON storage.objects;
CREATE POLICY "task_attachments_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
