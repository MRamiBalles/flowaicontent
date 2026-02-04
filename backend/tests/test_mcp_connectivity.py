import subprocess
import json
import os
import sys

def test_steel_thread():
    """
    Verifies the Agent -> MCP -> DB connection (Steel Thread).
    Uses stdio communication to simulate a local agent (Claude Desktop).
    """
    print("🧵 Starting Steel Thread Verification...")
    
    # Path to the server script
    server_script = os.path.join("backend", "mcp_server.py")
    
    # Needs fastmcp installed. If running in a fresh venv, ensure it's available.
    # We invoke it with the current python interpreter.
    
    process = subprocess.Popen(
        [sys.executable, server_script],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=sys.stderr,
        text=True,
        bufsize=0 # Unbuffered for real-time interaction
    )
    
    try:
        # 1. Initialize
        print("   -> Sending 'initialize'...")
        init_request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "0.1.0",
                "capabilities": {},
                "clientInfo": {"name": "TestClient", "version": "1.0"}
            }
        }
        process.stdin.write(json.dumps(init_request) + "\n")
        process.stdin.flush()
        
        response_str = process.stdout.readline()
        response = json.loads(response_str)
        assert response["result"]["serverInfo"]["name"] == "FlowAI Core", "Server name mismatch"
        print("   ✅ Server Initialized: FlowAI Core")
        
        # 1b. Notifications: 'notifications/initialized'
        # The official spec usually expects this after initialize response, 
        # but FastMCP might be lenient or handled internally. 
        # Let's send it to be compliant.
        init_notif = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized"
        }
        process.stdin.write(json.dumps(init_notif) + "\n")
        process.stdin.flush()

        # 2. List Tools
        print("   -> Listing tools...")
        list_tools_req = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/list",
            "params": {}
        }
        process.stdin.write(json.dumps(list_tools_req) + "\n")
        process.stdin.flush()
        
        response_str = process.stdout.readline()
        response = json.loads(response_str)
        tools = response["result"]["tools"]
        tool_names = [t["name"] for t in tools]
        assert "query_project_status" in tool_names, "Tool 'query_project_status' missing"
        print(f"   ✅ Tools Found: {tool_names}")
        
        # 3. Call Tool (Steel Thread Action)
        print("   -> Calling tool 'query_project_status'...")
        call_req = {
            "jsonrpc": "2.0",
            "id": 3,
            "method": "tools/call",
            "params": {
                "name": "query_project_status",
                "arguments": {
                    "project_id": "proj-123",
                    "tenant_context": "tenant-007" # CRITICAL: Context Injection
                }
            }
        }
        process.stdin.write(json.dumps(call_req) + "\n")
        process.stdin.flush()
        
        response_str = process.stdout.readline()
        response = json.loads(response_str)
        
        # Result logic for FastMCP tools often returns a list of content blocks
        # fastmcp usually returns: {"content": [{"type": "text", "text": "..."}]}
        content_text = response["result"]["content"][0]["text"]
        result_json = json.loads(content_text)
        
        assert result_json["status"] == "success", "Tool execution failed"
        assert result_json["tenant_id"] == "tenant-007", "Tenant context lost"
        print(f"   ✅ Tool Result Valid: {result_json}")
        
        print("\n🎉 STEEL THREAD VERIFIED! The Agent can successfully query the Core.")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        process.kill()
        sys.exit(1)
    finally:
        process.terminate()

if __name__ == "__main__":
    test_steel_thread()
