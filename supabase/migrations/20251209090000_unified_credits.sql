-- ==========================================
-- Economic Infrastructure: Unified Credits
-- Migration: 20251209090000_unified_credits.sql
-- consolidates all usage quotas into a single currency "FlowCredits"
-- ==========================================

-- 1. User Credits Balance
CREATE TABLE IF NOT EXISTS public.user_credits (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    balance integer NOT NULL DEFAULT 50, -- Start with 50 free credits
    is_frozen boolean DEFAULT false,     -- For admin moderation
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own balance
CREATE POLICY "Users can view own balance"
ON public.user_credits FOR SELECT
USING (auth.uid() = user_id);

-- Only system/admin can update balance (via Edge Functions)
-- No generic UPDATE policy for users

-- 2. Credit Transactions Ledger (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount integer NOT NULL, -- Positive for deposits, Negative for usage
    transaction_type text NOT NULL CHECK (transaction_type IN (
        'signup_bonus', 'subscription_grant', 'purchase', 'admin_adjustment', 
        'ai_generation', 'video_dubbing', 'thumbnail_gen', 'refund'
    )),
    description text,
    metadata jsonb DEFAULT '{}'::jsonb, -- Store service-specific IDs (e.g. dubbing_job_id)
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own history
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

-- 3. Trigger to update User Balance on Transaction
CREATE OR REPLACE FUNCTION public.update_credit_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (NEW.user_id, NEW.amount)
    ON CONFLICT (user_id) DO UPDATE
    SET 
        balance = user_credits.balance + NEW.amount,
        updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_credit_transaction_created
AFTER INSERT ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_credit_balance();

-- 4. Seed initial balance for existing users who don't have a record
INSERT INTO public.user_credits (user_id, balance)
SELECT id, 50 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
