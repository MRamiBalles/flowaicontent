import json
import asyncio
import uuid
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from app.services.handoff_service import handoff_service

# MCP Specification Constants
MCP_VERSION = "0.1.0"
JSONRPC_VERSION = "2.0"

@dataclass
class Resource:
    uri: str
    name: str
    description: str
    mimeType: str

@dataclass
class Tool:
    name: str
    description: str
    inputSchema: Dict[str, Any]
    requires_approval: bool = False

class MCPServer:
    """
    2026 Gold Standard MCP Server.
    Integrated with Multi-Tenant RLS Data Core and Audit Logging.
    """
    def __init__(self, name: str, version: str):
        self.name = name
        self.version = version
        self.resources: Dict[str, Resource] = {}
        self.tools: Dict[str, Tool] = {}
        self.handlers = {
            "initialize": self._handle_initialize,
            "resources/list": self._handle_list_resources,
            "resources/read": self._handle_read_resource,
            "tools/list": self._handle_list_tools,
            "tools/call": self._handle_call_tool,
        }

    def register_resource(self, resource: Resource):
        self.resources[resource.uri] = resource

    def register_tool(self, tool: Tool):
        self.tools[tool.name] = tool

    async def _log_operation(self, session_id: str, user_id: str, tenant_id: str, 
                               operation: str, resource_type: str, resource_id: str, 
                               input_data: Any, output_data: Any = None, 
                               status: str = "completed", error_message: str = None):
        """
        Logs every agent operation to public.mcp_operation_logs for 2026 auditability.
        """
        log_entry = {
            "session_id": session_id,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "operation": operation,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "input_data": input_data,
            "output_data": output_data,
            "status": status,
            "error_message": error_message,
            "created_at": datetime.utcnow().isoformat()
        }
        # In production, this would be a DB insert:
        # await db.table("mcp_operation_logs").insert(log_entry).execute()
        print(f"[AUDIT LOG] {json.dumps(log_entry)}")

    async def _handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "protocolVersion": MCP_VERSION,
            "capabilities": {"resources": {}, "tools": {}},
            "serverInfo": {"name": self.name, "version": self.version}
        }

    async def _handle_list_resources(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return {"resources": [asdict(r) for r in self.resources.values()]}

    async def _handle_read_resource(self, params: Dict[str, Any]) -> Dict[str, Any]:
        uri = params.get("uri")
        if uri not in self.resources:
            raise Exception(f"Resource not found: {uri}")
        
        return {
            "contents": [{
                "uri": uri,
                "mimeType": self.resources[uri].mimeType,
                "text": f"Mock data for {uri} (RLS enforced in DB session)"
            }]
        }

    async def _handle_list_tools(self, params: Dict[str, Any]) -> Dict[str, Any]:
        return {"tools": [asdict(t) for t in self.tools.values()]}

    async def _handle_call_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        name = params.get("name")
        arguments = params.get("arguments", {})
        session_token = params.get("session_token")
        
        # 1. Auth & Context Identification
        # In a real app, query mcp_agent_sessions to get user_id and tenant_id
        session_id = str(uuid.uuid4()) # Mock
        user_id = "user_123" # Mock
        tenant_id = "tenant_456" # Mock
        
        if name not in self.tools:
            raise Exception(f"Tool not found: {name}")
            
        tool = self.tools[name]

        # 2. Safety Check: Human-in-the-Loop (HITL)
        if tool.requires_approval and not params.get("approved"):
            await self._log_operation(session_id, user_id, tenant_id, name, "tool", None, arguments, status="pending_approval")
            return {
                "status": "pending_approval",
                "message": f"Action '{name}' requires human confirmation.",
                "approval_token": str(uuid.uuid4())
            }

        # 3. Confidence Check & Handoff (Steel Thread Step 3)
        confidence = params.get("confidence", 1.0) # Imagine model provides this
        if confidence < 0.7:
            reason = f"Low confidence ({confidence}) for tool '{name}'"
            handoff_result = await handoff_service.initiate_handoff(
                session_id=session_id,
                reason=reason,
                agent_context={
                    "last_tool": name,
                    "arguments": arguments,
                    "confidence": confidence,
                    "reasoning_trace": ["Checking permissions", "Validating schema", "High ambiguity detected"]
                }
            )
            await self._log_operation(session_id, user_id, tenant_id, name, "tool", None, arguments, status="handed_off", error_message=reason)
            return {
                "status": "handed_off",
                "message": "Confidence too low. Handing off to human expert.",
                "handoff_details": handoff_result
            }

        # 4. Execution & Logging
        try:
            result_data = None
            if name == "create_project":
                # Simulated DB operation on public.video_projects
                project_id = str(uuid.uuid4())
                result_data = {"project_id": project_id, "status": "created", "tenant_id": tenant_id}
                
            elif name == "list_assets":
                # Simulated RLS-aware query
                result_data = {"assets": [{"id": "asset_1", "type": "video"}], "count": 1}
                
            elif name == "query_logs":
                # Simulated audit log query
                result_data = {"logs": [{"operation": "create_project", "timestamp": "2026-01-05"}]}

            # 4. Success Logging
            await self._log_operation(session_id, user_id, tenant_id, name, "tool", None, arguments, output_data=result_data)
            return {"content": [{"type": "text", "text": json.dumps(result_data)}]}

        except Exception as e:
            # 5. Error Logging
            await self._log_operation(session_id, user_id, tenant_id, name, "tool", None, arguments, status="failed", error_message=str(e))
            raise e

    async def handle_request(self, request_str: str) -> str:
        try:
            request = json.loads(request_str)
            method = request.get("method")
            params = request.get("params", {})
            id_ = request.get("id")

            if method in self.handlers:
                result = await self.handlers[method](params)
                response = {"jsonrpc": JSONRPC_VERSION, "id": id_, "result": result}
            else:
                response = {"jsonrpc": JSONRPC_VERSION, "id": id_, "error": {"code": -32601, "message": "Method not found"}}
        except Exception as e:
            response = {"jsonrpc": JSONRPC_VERSION, "id": request.get("id") if 'request' in locals() else None, "error": {"code": -32603, "message": str(e)}}
        
        return json.dumps(response)

async def main():
    server = MCPServer("FlowAI Steel Thread Server", "1.0.0")
    
    # Register Core Tools for Step 3
    server.register_tool(Tool(
        name="create_project",
        description="Creates a new video project in the multi-tenant data core",
        inputSchema={
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "description": {"type": "string"}
            },
            "required": ["name"]
        },
        requires_approval=True
    ))

    server.register_tool(Tool(
        name="list_assets",
        description="Lists all video assets available to the current tenant",
        inputSchema={"type": "object", "properties": {}}
    ))

    server.register_tool(Tool(
        name="query_logs",
        description="Queries the agent operation logs for auditing",
        inputSchema={"type": "object", "properties": {"limit": {"type": "integer"}}}
    ))

    print(f"FlowAI MCP Steel Thread Server started.")
    
if __name__ == "__main__":
    asyncio.run(main())
