-- Drop the old vulnerable 2-parameter versions of voice credit functions
-- These accept p_user_id which allows authorization bypass

DROP FUNCTION IF EXISTS public.check_voice_credits(uuid, integer);
DROP FUNCTION IF EXISTS public.consume_voice_credits(uuid, integer);