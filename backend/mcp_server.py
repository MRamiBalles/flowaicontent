import json
import asyncio
import uuid
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from app.services.handoff_service import handoff_service
from app.services.collaboration_service import collaboration_service
from app.services.video_generation_service import video_generation_service
from app.services.streaming_service import streaming_service
from app.services.client_ai_service import client_ai_service
from app.services.finops_service import finops_service
from app.services.portability_service import portability_service

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

            elif name == "edit_timeline":
                # 2026 Gold Standard: Direct agent-to-timeline editing
                project_id = arguments.get("project_id")
                action = arguments.get("action")
                
                await collaboration_service.handle_agent_action(project_id, action)
                result_data = {"status": "applied", "action": action["type"]}

            elif name == "generate_clip":
                # 2026 Gold Standard: Shadow Mode Generation
                prompt = arguments.get("prompt")
                provider = arguments.get("provider", "runway-gen3")
                
                # Check if this is an approval call or a new proposal
                proposal_id = arguments.get("proposal_id")
                if not proposal_id:
                    # Step 1: Propose (Shadow Mode)
                    pid = await video_generation_service.propose_generation(tenant_id, prompt, provider)
                    return {
                        "status": "pending_approval",
                        "proposal_id": pid,
                        "message": f"Generation of '{prompt}' requires approval. Estimated cost: $5.00"
                    }
                else:
                    # Step 2: Execute (After approval)
                    result_data = await video_generation_service.execute_generation(proposal_id)
                    # Automatically add to timeline once generated? 
                    # Yes, for the Steel Thread "Text-to-Edit" workflow.
                    project_id = arguments.get("project_id", "default_proj")
                    await collaboration_service.handle_agent_action(project_id, {
                        "type": "add_clip",
                        "name": f"AI Gen: {prompt[:20]}",
                        "url": result_data["url"],
                        "start": 0,
                        "duration": result_data["duration"]
                    })

            elif name == "manage_stream":
                # 2026 Gold Standard: Agent-led streaming ops
                action = arguments.get("action")
                if action == "start":
                    result_data = await streaming_service.create_stream(tenant_id, arguments.get("title", "Live Edit Session"))
                elif action == "status":
                    result_data = await streaming_service.get_stream_health(arguments.get("stream_id"))
                elif action == "stop":
                    await streaming_service.stop_stream(arguments.get("stream_id"))
                    result_data = {"status": "offline"}

            elif name == "local_process":
                # 2026 Gold Standard: Instructing client to run local AI
                task = arguments.get("task")
                model_desc = await client_ai_service.get_model_descriptor(task)
                
                # We return an instruction for the frontend to follow
                result_data = {
                    "instruction": "execute_on_client",
                    "model_descriptor": model_desc,
                    "arguments": arguments.get("payload", {})
                }

            elif name == "cost_aware_task":
                # 2026 Gold Standard: Model Routing based on FinOps
                complexity = arguments.get("complexity", "low")
                model = await finops_service.route_model(complexity)
                
                # Check budget before proceeding
                if not await finops_service.check_budget_gate(tenant_id, estimated_cost=0.05):
                    return {"status": "blocked", "reason": "Budget exceeded"}
                
                # Record initial usage
                await finops_service.record_usage(tenant_id, model, tokens=5000) # Mock
                
                result_data = {
                    "routed_model": model,
                    "status": "processing",
                    "estimated_cost": "$0.00075" if complexity == "low" else "$0.075"
                }

            elif name == "export_data":
                # 2026 Gold Standard: EU Data Act Compliance
                format = arguments.get("format", "parquet")
                result_data = await portability_service.generate_exit_package(tenant_id, format)

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

    server.register_tool(Tool(
        name="edit_timeline",
        description="Performs an edit action on the live collaborative timeline",
        inputSchema={
            "type": "object",
            "properties": {
                "project_id": {"type": "string"},
                "action": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["add_clip"]},
                        "name": {"type": "string"},
                        "url": {"type": "string"},
                        "start": {"type": "number"},
                        "duration": {"type": "number"}
                    },
                    "required": ["type", "name", "url", "start", "duration"]
                }
            },
            "required": ["project_id", "action"]
        }
    ))

    server.register_tool(Tool(
        name="generate_clip",
        description="Generates a new AI video clip (Runway/Luma) with Shadow Mode cost protection",
        inputSchema={
            "type": "object",
            "properties": {
                "prompt": {"type": "string"},
                "provider": {"type": "string", "enum": ["runway-gen3", "luma-ray-2"]},
                "proposal_id": {"type": "string", "description": "Required only for final execution after approval"},
                "project_id": {"type": "string"}
            },
            "required": ["prompt"]
        },
        requires_approval=True
    ))

    server.register_tool(Tool(
        name="manage_stream",
        description="Manages SRT/WebRTC live streams for real-time broadcasting",
        inputSchema={
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["start", "status", "stop"]},
                "title": {"type": "string"},
                "stream_id": {"type": "string"}
            },
            "required": ["action"]
        }
    ))

    server.register_tool(Tool(
        name="local_process",
        description="Instructs the client browser to process an AI task using local WebGPU/Transformers.js",
        inputSchema={
            "type": "object",
            "properties": {
                "task": {"type": "string", "enum": ["scene_detection", "smart_crop", "transcription"]},
                "payload": {"type": "object", "description": "Resource identifiers or parameters for local processing"}
            },
            "required": ["task"]
        }
    ))

    server.register_tool(Tool(
        name="cost_aware_task",
        description="Executes a task using dynamic model routing for optimal unit economics",
        inputSchema={
            "type": "object",
            "properties": {
                "complexity": {"type": "string", "enum": ["low", "medium", "high"]},
                "task_description": {"type": "string"}
            },
            "required": ["complexity", "task_description"]
        }
    ))

    server.register_tool(Tool(
        name="export_data",
        description="Generates a legally compliant data export (EU Data Act) for the user",
        inputSchema={
            "type": "object",
            "properties": {
                "format": {"type": "string", "enum": ["parquet", "json", "csv"]}
            }
        },
        requires_approval=True
    ))

    print(f"FlowAI MCP Steel Thread Server started.")
    
if __name__ == "__main__":
    asyncio.run(main())
