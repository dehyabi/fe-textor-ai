import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface TranscriptionItem {
  id: string;
  text: string | null;
  audio_url: string;
  language_code: string;
  created_at: string;
  completed_at: string | null;
  error: string | null;
  status: 'queued' | 'processing' | 'completed' | 'error';
}

export interface TranscriptionStatusCounts {
  queued: number;
  processing: number;
  completed: number;
  error: number;
}

export interface TranscriptionsByStatus {
  queued: TranscriptionItem[];
  processing: TranscriptionItem[];
  completed: TranscriptionItem[];
  error: TranscriptionItem[];
}

export interface TranscriptionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  current_page: number;
  total_pages: number;
  total_count: number;
  status_counts: TranscriptionStatusCounts;
  transcriptions: TranscriptionsByStatus;
}

interface TranscriptionData {
  id: string;
  status: string;
  text?: string;
  error?: string;
  created_at?: string;
}

interface TranscriptionHistoryResponse {
  transcriptions: {
    queued: TranscriptionData[];
    processing: TranscriptionData[];
    completed: TranscriptionData[];
    error: TranscriptionData[];
  };
  status_counts: {
    queued: number;
    processing: number;
    completed: number;
    error: number;
  };
}

interface TranscriptionResponse {
  id?: string;
  text?: string | null;
  status?: string;
  error?: string;
  transcription_id?: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN}`,
  }
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`API Response [${response.config.url}]:`, response.data);
    return response;
  },
  error => {
    console.error(`API Error [${error.config?.url}]:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Add delay utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const uploadAudioForTranscription = async (
  audioBlob: Blob,
  onProgress?: UploadProgressCallback,
  languageCode?: string
): Promise<string> => {
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');

      console.log('Upload Request:', {
        url: '/api/transcribe/upload/',
        blobType: audioBlob.type,
        blobSize: audioBlob.size,
        attempt: attempt + 1
      });

      const response = await api.post<TranscriptionResponse>('/api/transcribe/upload/', formData, {
        headers: {
          'Accept': 'application/json',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      console.log('Upload Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      if (!response.data) {
        throw new Error('No response data received from server');
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      // Get ID from various possible response formats
      const transcriptionId = response.data.transcription_id || response.data.id;
      
      if (transcriptionId) {
        console.log('Got transcription ID:', {
          id: transcriptionId,
          rawId: String(transcriptionId),
          type: typeof transcriptionId,
          length: String(transcriptionId).length
        });
        return String(transcriptionId); // Ensure we return a string
      }

      // If we have text directly, it's a direct response
      if (response.data.text !== undefined) {
        return 'direct-response';
      }

      // Extract ID from response URL if available
      const responseUrl = response.headers?.location || response.request?.responseURL;
      if (responseUrl) {
        const urlMatch = responseUrl.match(/\/([^\/]+)\/?$/);
        if (urlMatch) {
          const extractedId = urlMatch[1];
          console.log('Extracted ID from URL:', {
            id: extractedId,
            url: responseUrl
          });
          return extractedId;
        }
      }

      // Log the full response for debugging
      console.error('Unexpected response format:', {
        data: response.data,
        headers: response.headers,
        url: response.request?.responseURL
      });

      throw new Error('Could not determine transcription ID from server response');

    } catch (error: any) {
      console.error('Upload Error:', {
        attempt: attempt + 1,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after']) || baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Waiting ${retryAfter}ms before retry...`);
        
        if (attempt < maxRetries - 1) {
          await delay(retryAfter);
          continue;
        }
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      }

      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.error || 'Invalid request. Please ensure the audio file is in a supported format and under 5MB.';
        throw new Error(errorMessage);
      }
      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw error;
    }
  }

  throw new Error('Failed to upload after multiple attempts. Please try again later.');
};

export const getTranscriptionHistory = async (): Promise<TranscriptionResponse> => {
  try {
    console.log('Fetching transcription history...');
    const response = await api.get<TranscriptionResponse>('/api/transcribe/');
    console.log('History response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Get history error:', error);
    throw error;
  }
};

export const checkTranscriptionStatus = async (id: string): Promise<TranscriptionResponse> => {
  if (id === 'direct-response') {
    return { status: 'completed' };
  }

  try {
    console.log('Checking status for ID:', {
      id,
      type: typeof id,
      length: id.length,
      rawId: String(id)
    });
    
    const response = await api.get<any>('/api/transcribe/'); // Using 'any' temporarily to inspect structure
    
    // Log the raw response structure
    console.log('Raw Response Structure:', {
      keys: Object.keys(response.data),
      hasTranscriptions: 'transcriptions' in response.data,
      dataType: typeof response.data,
      fullData: response.data
    });

    // If response has results directly
    if (Array.isArray(response.data)) {
      console.log('Response is an array, searching directly');
      const found = response.data.find(t => {
        const matches = String(t.id) === String(id);
        console.log('Comparing array item:', {
          searchId: id,
          itemId: t.id,
          matches
        });
        return matches;
      });

      if (found) {
        console.log('Found in array:', found);
        return {
          id: found.id,
          status: found.status,
          text: found.text,
          error: found.error
        };
      }
    }

    // If response has nested transcriptions
    if (response.data?.transcriptions) {
      console.log('Response has transcriptions object:', {
        structure: Object.keys(response.data.transcriptions),
        types: Object.entries(response.data.transcriptions).map(([k, v]) => ({
          status: k,
          type: typeof v,
          isArray: Array.isArray(v),
          length: Array.isArray(v) ? v.length : 0
        }))
      });

      const { transcriptions } = response.data;
      let foundTranscription: any;

      for (const status of ['queued', 'processing', 'completed', 'error'] as const) {
        if (Array.isArray(transcriptions[status])) {
          console.log(`Checking ${status} transcriptions:`, {
            count: transcriptions[status].length,
            items: transcriptions[status].map(t => ({
              id: t.id,
              type: typeof t.id,
              status: t.status
            }))
          });
          
          const found = transcriptions[status].find(t => String(t.id) === String(id));
          if (found) {
            foundTranscription = found;
            console.log(`Found in ${status}:`, found);
            break;
          }
        }
      }

      if (foundTranscription) {
        return {
          id: foundTranscription.id,
          status: foundTranscription.status,
          text: foundTranscription.text,
          error: foundTranscription.error
        };
      }
    }

    // Log what we actually received
    console.error('Could not find transcription. Response structure:', {
      searchId: id,
      responseType: typeof response.data,
      hasTranscriptions: 'transcriptions' in response.data,
      availableData: response.data
    });

    throw new Error('Transcription not found');

  } catch (error: any) {
    console.error('Status Check Error:', {
      id,
      endpoint: '/api/transcribe/',
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    if (error.response?.status === 404) {
      throw new Error('Transcription not found. Please check the ID and try again.');
    }
    if (error.response?.status === 405) {
      throw new Error('Method not allowed. Please ensure the API endpoint is correct.');
    }
    throw new Error(error.message || 'Failed to check transcription status');
  }
};
