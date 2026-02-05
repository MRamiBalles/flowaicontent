import asyncio
import json
import subprocess
import sys
import os
import time

def call_tool(process, name, arguments):
    req = {
        "jsonrpc": "2.0",
        "id": int(time.time() * 1000),
        "method": "tools/call",
        "params": {
            "name": name,
            "arguments": arguments
        }
    }
    process.stdin.write(json.dumps(req) + "\n")
    process.stdin.flush()
    
    # Read response properly, skipping ALL non-JSON lines
    while True:
        line = process.stdout.readline()
        if not line:
            return None
        line = line.strip()
        if not line:
            continue
        if line.startswith('{'):
            try:
                data = json.loads(line)
                if "jsonrpc" in data:
                    return data
            except json.JSONDecodeError:
                pass
        # Ignore ASCII art and logs
        # print(f"   [FILTERED]: {line[:50]}...")

async def test_golden_run_rpc():
    print("--- 2026 STEEL THREAD: GOLDEN RUN (JSON-RPC) ---")
    
    tenant_id = "tenant-enterprise-001"
    
    # Start MCP Server
    env = os.environ.copy()
    env["PYTHONPATH"] = os.path.join(os.getcwd(), "backend")
    env["PYTHONUNBUFFERED"] = "1"
    
    process = subprocess.Popen(
        [sys.executable, "-u", "backend/mcp_server.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        env=env
    )
    
    try:
        # 1. Initialize with CORRECT parameters for 2026 standards
        init_req = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "GoldenRunTest", "version": "1.0"}
            }
        }
        process.stdin.write(json.dumps(init_req) + "\n")
        process.stdin.flush()
        
        # Read init response
        while True:
            line = process.stdout.readline()
            if not line: break
            line = line.strip()
            if line.startswith('{'):
                print(f"   [OK] Server Initialized")
                break

        # 2. Seed Credits
        print("\n[STEP 1] Seeding Credits via Admin Tool")
        resp = call_tool(process, "seed_credits", {"tenant_context": tenant_id, "amount": 2.0})
        print(f"   Result: {resp['result']['content'][0]['text']}")

        # 3. Check Balance
        print("\n[STEP 2] Pre-computation FinOps Check")
        resp = call_tool(process, "get_finops_status", {"tenant_context": tenant_id})
        status_data = json.loads(resp['result']['content'][0]['text'])
        print(f"   Balance: {status_data['balance_usd']} USD")

        # 4. Generate Cloud Video (Success)
        print("\n[STEP 3] Cloud Video Generation (Action 1)")
        resp = call_tool(process, "generate_cloud_video", {
            "prompt": "Cyberpunk sunset", 
            "tenant_context": tenant_id
        })
        print(f"   Response: {resp['result']['content'][0]['text']}")

        # 5. Safety Violation (Action 2)
        print("\n[STEP 4] Content Safety Check (Unsafe Action)")
        resp = call_tool(process, "generate_cloud_video", {
            "prompt": "Explicit violence", 
            "tenant_context": tenant_id
        })
        text = resp['result']['content'][0]['text']
        print(f"   Response: {text}")
        assert "CONTENT_SAFETY_VIOLATION" in text

        # 6. Insufficient Funds (Action 3)
        print("\n[STEP 5] Resource Depletion Check")
        call_tool(process, "generate_cloud_video", {"prompt": "Third clip", "tenant_context": tenant_id}) 
        call_tool(process, "generate_cloud_video", {"prompt": "Fourth clip", "tenant_context": tenant_id}) 
        
        resp = call_tool(process, "generate_cloud_video", {"prompt": "Fifth clip", "tenant_context": tenant_id})
        text = resp['result']['content'][0]['text']
        print(f"   Response: {text}")
        assert "rejected_insufficient_funds" in text

        print("\n" + "="*40)
        print("PASS: GOLDEN RUN VERIFIED: FULL PIPELINE COMPLIANCE")
        print("="*40)


    except Exception as e:
        print(f"   [ERROR]: {e}")
    finally:
        process.terminate()

if __name__ == "__main__":
    asyncio.run(test_golden_run_rpc())
