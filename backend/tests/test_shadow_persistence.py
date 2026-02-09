import pytest
from unittest.mock import MagicMock, patch
import sys

# MOCK missing dependencies (supabase) due to environment constraints
mock_supabase = MagicMock()
sys.modules["supabase"] = mock_supabase

import os
os.environ["SUPABASE_URL"] = "https://mock.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "mock-anon-key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "mock-service-key"

from app.services.agent_ops.shadow_deployment import shadow_service
import app.services.supabase_service # Ensure module is loaded for patch
import json

@pytest.mark.asyncio
async def test_shadow_persistence():
    """
    Verify that record_shadow_action:
    1. Calculates input_hash correctly (SHA-256)
    2. Calls supabase_admin.table().insert()
    3. Handles DB errors gracefully
    """
    # Mock data
    agent_id = "agent-123"
    tenant_id = "tenant-456"
    input_data = {"prompt": "test prompt"}
    predicted = "tool_call"
    conf = 0.95
    
    # Mock Supabase
    with patch("app.services.supabase_service.supabase_admin") as mock_supabase:
        mock_table = MagicMock()
        mock_insert = MagicMock()
        mock_execute = MagicMock()
        
        mock_supabase.table.return_value = mock_table
        mock_table.insert.return_value = mock_insert
        mock_insert.execute.return_value = mock_execute
        mock_execute.data = [{"id": "log-1"}]
        
        # Test Success
        result = await shadow_service.record_shadow_action(
            agent_id, tenant_id, input_data, predicted, conf
        )
        
        # Verify persistence call
        mock_table.insert.assert_called_once()
        call_args = mock_table.insert.call_args[0][0]
        
        assert call_args["agent_id"] == agent_id
        assert "input_hash" in call_args
        # SHA-256 of {"prompt": "test prompt"}
        assert len(call_args["input_hash"]) == 64 
        
        assert result == [{"id": "log-1"}]

@pytest.mark.asyncio
async def test_shadow_persistence_failure():
    """Verify graceful degradation when DB fails"""
    with patch("app.services.supabase_service.supabase_admin") as mock_supabase:
        mock_supabase.table.side_effect = Exception("DB Down")
        
        result = await shadow_service.record_shadow_action(
            "a", "t", {}, "p", 0.5
        )
        
        # Should return the log dict instead of crashing
        assert result["agent_id"] == "a"
        assert "input_hash" in result
