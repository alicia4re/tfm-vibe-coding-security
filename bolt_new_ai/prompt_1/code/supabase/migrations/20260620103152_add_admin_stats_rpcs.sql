/*
# Add admin statistics RPC functions

1. Overview
Two SECURITY DEFINER functions for the admin dashboard:
- `task_counts_by_status()` returns a single row with counts of tasks per status (pendiente / en_curso / completada).
- `user_task_stats()` returns one row per user with email, full_name and task_count.

2. Security
- Both functions are SECURITY DEFINER so the anon-key client can run them without being blocked by RLS on tasks.
- However, they should ONLY expose aggregate counts. `task_counts_by_status` returns counts (not rows); `user_task_stats` returns email + count per user.
- IMPORTANT: these reveal aggregate data. Guard with an admin check inside the function body so only admins can call them and get data back; non-admins get an error.
*/

CREATE OR REPLACE FUNCTION public.task_counts_by_status()
RETURNS TABLE (pendiente bigint, en_curso bigint, completada bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'pendiente')::bigint,
    COUNT(*) FILTER (WHERE status = 'en_curso')::bigint,
    COUNT(*) FILTER (WHERE status = 'completada')::bigint
  FROM public.tasks
  WHERE public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.user_task_stats()
RETURNS TABLE (id uuid, email text, full_name text, task_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.email,
    p.full_name,
    COUNT(t.id)::bigint AS task_count
  FROM public.profiles p
  LEFT JOIN public.tasks t ON t.user_id = p.id
  WHERE public.is_admin()
  GROUP BY p.id, p.email, p.full_name
  ORDER BY task_count DESC;
$$;
