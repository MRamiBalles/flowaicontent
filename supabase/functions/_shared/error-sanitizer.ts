/**
 * Error Sanitizer for Edge Functions
 * 
 * Prevents leaking internal database schema, table names, and constraint
 * details to clients. All errors are mapped to safe, generic messages.
 * 
 * Full error details are logged server-side for debugging.
 */

export interface SanitizedError {
  message: string;
  code: string;
}

/**
 * Maps internal errors to safe client-facing messages.
 * Always logs the full error server-side before sanitizing.
 * 
 * @param error - The caught error (can be any type)
 * @param context - Optional context for server-side logging
 * @returns A sanitized error object safe to return to clients
 */
export function sanitizeError(
  error: unknown, 
  context?: { functionName?: string; action?: string; userId?: string }
): SanitizedError {
  // Always log full error server-side for debugging
  console.error('[INTERNAL ERROR]', {
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    timestamp: new Date().toISOString()
  });
  
  if (!(error instanceof Error)) {
    return { 
      message: 'An unexpected error occurred', 
      code: 'UNKNOWN_ERROR' 
    };
  }
  
  const msg = error.message.toLowerCase();
  
  // Database constraint errors - hide table/column names
  if (msg.includes('foreign key') || msg.includes('fkey')) {
    return { 
      message: 'Invalid reference provided', 
      code: 'INVALID_REFERENCE' 
    };
  }
  
  if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('already exists')) {
    return { 
      message: 'Resource already exists', 
      code: 'DUPLICATE_RESOURCE' 
    };
  }
  
  if (msg.includes('not-null') || msg.includes('null value') || msg.includes('violates not-null')) {
    return { 
      message: 'Required field is missing', 
      code: 'MISSING_FIELD' 
    };
  }
  
  if (msg.includes('check constraint') || msg.includes('violates check')) {
    return { 
      message: 'Invalid value provided', 
      code: 'VALIDATION_ERROR' 
    };
  }
  
  // RLS and permission errors
  if (msg.includes('permission denied') || msg.includes('rls') || msg.includes('row-level security')) {
    return { 
      message: 'Access denied', 
      code: 'FORBIDDEN' 
    };
  }
  
  if (msg.includes('unauthorized') || msg.includes('not authenticated')) {
    return { 
      message: 'Authentication required', 
      code: 'UNAUTHORIZED' 
    };
  }
  
  // Rate limiting
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return { 
      message: 'Too many requests. Please try again later.', 
      code: 'RATE_LIMITED' 
    };
  }
  
  // Timeout errors
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return { 
      message: 'Request timed out. Please try again.', 
      code: 'TIMEOUT' 
    };
  }
  
  // Connection errors
  if (msg.includes('connection') || msg.includes('network') || msg.includes('econnrefused')) {
    return { 
      message: 'Service temporarily unavailable', 
      code: 'SERVICE_UNAVAILABLE' 
    };
  }
  
  // Invalid input errors
  if (msg.includes('invalid input') || msg.includes('invalid syntax') || msg.includes('malformed')) {
    return { 
      message: 'Invalid input provided', 
      code: 'INVALID_INPUT' 
    };
  }
  
  // Not found errors
  if (msg.includes('not found') || msg.includes('no rows') || msg.includes('does not exist')) {
    return { 
      message: 'Resource not found', 
      code: 'NOT_FOUND' 
    };
  }
  
  // Default safe message for all other errors
  return { 
    message: 'An error occurred while processing your request', 
    code: 'PROCESSING_ERROR' 
  };
}

/**
 * Creates a JSON Response with sanitized error.
 * Use this as a drop-in replacement for error responses in catch blocks.
 * 
 * @param error - The caught error
 * @param corsHeaders - CORS headers to include
 * @param context - Optional context for logging
 * @param statusCode - HTTP status code (default: 500)
 * @returns Response object with sanitized error
 */
export function createErrorResponse(
  error: unknown,
  corsHeaders: Record<string, string>,
  context?: { functionName?: string; action?: string; userId?: string },
  statusCode: number = 500
): Response {
  const { message, code } = sanitizeError(error, context);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code: code
    }), 
    { 
      status: statusCode, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
