const API_URL = 'http://localhost:8000/api/v1';

export interface IngestResponse {
    ingestion_id: string;
    status: string;
    processed_tokens: number;
    summary: string;
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
