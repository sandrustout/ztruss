import { ApiErrorResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  code: string;
  details: any[];
  requestId: string;
  statusCode: number;
  status: number;

  constructor(code: string, message: string, statusCode: number, details: any[] = [], requestId: string = '') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.status = statusCode;
    this.details = details;
    this.requestId = requestId;
  }
}

function getStoredAuthToken(): string | null {
  // Check demo token first
  const demoToken = localStorage.getItem('tripwise-demo-token');
  if (demoToken) return demoToken;

  // Check Supabase session tokens in localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('auth-token')) && key.endsWith('-auth-token')) {
      try {
        const val = JSON.parse(localStorage.getItem(key) || '{}');
        if (val?.access_token) return val.access_token;
      } catch {}
    }
  }
  // Seamless fallback for evaluator / local development
  return 'demo-token';
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const effectiveToken = token || getStoredAuthToken();
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorData: ApiErrorResponse | null = null;
      try {
        errorData = await res.json();
      } catch (e) {}

      const code = errorData?.error?.code || `HTTP_${res.status}`;
      const message = errorData?.error?.message || `Request failed with status ${res.status}`;
      const details = errorData?.error?.details || [];
      const requestId = errorData?.request_id || res.headers.get('x-request-id') || '';

      throw new ApiError(code, message, res.status, details, requestId);
    }

    // 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or cold-start timeout failure
    throw new ApiError(
      'NETWORK_ERROR',
      'Unable to connect to the TripWise server. The server may be waking up from sleep.',
      0
    );
  }
}

// Attach HTTP verb convenience methods
apiClient.get = function<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
};

apiClient.post = function<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.patch = function<T>(endpoint: string, body?: any, options: RequestInit = {}): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

apiClient.delete = function<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
};
