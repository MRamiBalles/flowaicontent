-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id uuid NOT NULL,
    action text NOT NULL,
    target_user_id uuid,
    details jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role (edge functions) to insert
CREATE POLICY "Service role can insert logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (true);
