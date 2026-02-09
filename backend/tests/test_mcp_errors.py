import pytest
import json
from app.core.errors import RateLimitError, ContentViolationError
from fastmcp import FastMCP

# Mock the mcp object to test the decorator logic indirectly
# or test the error classes directly. 
# Since FastMCP testing is tricky without running a server, we test the error serialization.

def test_error_serialization():
    err = RateLimitError(retry_after=30)
    resp = err.to_mcp_response()
    
    assert resp["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert resp["error"]["data"]["retryable"] is True
    assert resp["error"]["data"]["retry_after"] == 30

def test_content_violation_serialization():
    err = ContentViolationError("Bad keyword")
    resp = err.to_mcp_response()
    
    assert resp["error"]["code"] == "CONTENT_SAFETY_VIOLATION"
    assert resp["error"]["data"]["retryable"] is False

# We can also mock the decorator if we want to test the wrapper logic
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from mcp_server import mcp_error_handler
import asyncio

@pytest.mark.asyncio
async def test_decorator_captures_error():
    
    @mcp_error_handler
    async def failing_tool():
        raise RateLimitError(60)

    result_json = await failing_tool()
    result = json.loads(result_json)
    
    assert "error" in result
    assert result["error"]["code"] == "RATE_LIMIT_EXCEEDED"
    assert result["error"]["data"]["retry_after"] == 60

@pytest.mark.asyncio
async def test_decorator_masks_internal_error():
    
    @mcp_error_handler
    async def crashing_tool():
        raise ValueError("Unexpected crash")

    result_json = await crashing_tool()
    result = json.loads(result_json)
    
    assert "error" in result
    assert result["error"]["code"] == -32603
    assert result["error"]["message"] == "Internal Server Error"
