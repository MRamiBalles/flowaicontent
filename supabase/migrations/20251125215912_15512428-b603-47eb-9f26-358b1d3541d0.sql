-- Enable realtime for admin_audit_logs table
ALTER TABLE public.admin_audit_logs REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs;