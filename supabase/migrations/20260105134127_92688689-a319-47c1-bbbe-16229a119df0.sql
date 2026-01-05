-- Fix function search path security warning
-- Update functions to explicitly set search_path

-- Recreate user_belongs_to_tenant with explicit search_path
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enterprise_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND status = 'active'
  )
$$;

-- Recreate get_user_tenant with explicit search_path
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT tenant_id
  FROM public.enterprise_users
  WHERE user_id = _user_id
    AND status = 'active'
  LIMIT 1
$$;