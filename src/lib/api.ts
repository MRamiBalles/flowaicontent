// API URL configuration with environment variable support
// Uses VITE_API_URL for production, falls back to localhost for development
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  console.warn('[API] VITE_API_URL not set, using localhost fallback');
  return 'http://localhost:8000/api/v1';
};

export const API_URL = getApiUrl();

export interface IngestResponse {
    ingestion_id: string;
    status: string;
    processed_tokens: number;
    summary: string;
    compass_metrics?: any;
    video_result?: any;
}

export const ingestContext = async (
    content: string,
    sourceType: 'text' | 'script' | 'repo' | 'video_clip' = 'text'
): Promise<IngestResponse> => {
    try {
        const response = await fetch(`${API_URL}/context/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                source_type: sourceType,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error ingesting context:', error);
        throw error;
    }
};
