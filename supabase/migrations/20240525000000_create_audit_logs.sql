-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    action text NOT NULL,
    target_user_id uuid REFERENCES auth.users(id),
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  )
);

-- Allow service role (edge functions) to insert
CREATE POLICY "Service role can insert logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (true);
