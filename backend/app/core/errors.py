from typing import Optional, Dict, Any

class FlowAIError(Exception):
    """Base class for structured FlowAI exceptions."""
    def __init__(self, message: str, error_code: str, retryable: bool = False, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.retryable = retryable
        self.details = details or {}

    def to_mcp_response(self) -> Dict[str, Any]:
        """Formats the error for JSON-RPC MCP responses."""
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "data": {
                    "retryable": self.retryable,
                    **self.details
                }
            }
        }

class RateLimitError(FlowAIError):
    def __init__(self, retry_after: int):
        super().__init__(
            message=f"Rate limit exceeded. Retry after {retry_after}s.",
            error_code="RATE_LIMIT_EXCEEDED",
            retryable=True,
            details={"retry_after": retry_after}
        )

class ContentViolationError(FlowAIError):
    def __init__(self, reason: str):
        super().__init__(
            message=f"Content safety violation: {reason}",
            error_code="CONTENT_SAFETY_VIOLATION",
            retryable=False,
            details={"reason": reason}
        )

class ContextOverflowError(FlowAIError):
    def __init__(self, current_tokens: int, max_tokens: int):
        super().__init__(
            message="Context window exceeded.",
            error_code="CONTEXT_WINDOW_EXCEEDED",
            retryable=False,
            details={"current": current_tokens, "max": max_tokens}
        )

class QuotaExhaustedError(FlowAIError):
    def __init__(self, resource: str):
        super().__init__(
            message=f"Quota exhausted for resource: {resource}",
            error_code="QUOTA_EXHAUSTED",
            retryable=False,
            details={"resource": resource}
        )

class UpstreamServiceError(FlowAIError):
    def __init__(self, service: str, details: str):
        super().__init__(
            message=f"Upstream service error: {service}",
            error_code="UPSTREAM_SERVICE_ERROR",
            retryable=True,
            details={"service": service, "details": details}
        )
