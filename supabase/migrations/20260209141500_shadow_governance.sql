-- Protocol SDD: Phase 1 - Governance & Traceability
-- Implements ISO 42001 Audit Trail Requirements
-- Migration: 20260209141500_shadow_governance.sql

CREATE TABLE IF NOT EXISTS public.shadow_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL, -- Link to specific agent instance
    tenant_id UUID NOT NULL, -- RLS Isolation
    input_hash TEXT NOT NULL, -- Integrity check (SHA-256)
    predicted_action TEXT NOT NULL,
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    decision_vector JSONB, -- The "Why" (SHAP values or reasoning trace)
    metadata JSONB DEFAULT '{}'::jsonb, -- Contextual info
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.shadow_actions ENABLE ROW LEVEL SECURITY;

-- Policy: Tenants can only see their own shadow logs
-- Uses the app.current_tenant setting defined in previous RLS migrations
CREATE POLICY "Tenant Isolation Policy"
ON public.shadow_actions
FOR ALL
USING (tenant_id = (current_setting('app.current_tenant', true)::uuid));

-- Indexing for fast retrieval during audits
CREATE INDEX IF NOT EXISTS idx_shadow_actions_tenant_created ON public.shadow_actions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shadow_actions_input_hash ON public.shadow_actions(input_hash);

COMMENT ON TABLE public.shadow_actions IS 'Audit trail for Shadow Mode agent decisions (ISO 42001 Traceability)';
