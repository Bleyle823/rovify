import { useError } from '@/context/ErrorContext';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  total?: number;
  limit?: number;
  offset?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ApiError extends Error {
  public code?: string;
  public status?: number;
  public details?: any;

  constructor(message: string, code?: string, status?: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
  timeout?: number;
}

export class EnhancedApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(baseUrl: string = '', defaultTimeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultTimeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    errorHandler?: (error: ApiError) => void
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      showErrorToast = true,
      showSuccessToast = false,
      successMessage,
      timeout = this.defaultTimeout,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      // Add auth token if available
      const token = this.getAuthToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let responseData: any;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const error = new ApiError(
          responseData?.message || responseData?.error || `HTTP ${response.status}: ${response.statusText}`,
          responseData?.code,
          response.status,
          responseData
        );

        if (errorHandler) {
          errorHandler(error);
        } else if (showErrorToast) {
          this.showErrorToast(error);
        }

        return { error: error.message };
      }

      // Show success toast if requested
      if (showSuccessToast && successMessage) {
        this.showSuccessToast(successMessage);
      }

      return {
        data: responseData.data || responseData,
        total: responseData.total,
        limit: responseData.limit,
        offset: responseData.offset,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        if (errorHandler) {
          errorHandler(error);
        } else if (showErrorToast) {
          this.showErrorToast(error);
        }
        return { error: error.message };
      }

      // Handle network errors, timeouts, etc.
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }

      const apiError = new ApiError(errorMessage, 'NETWORK_ERROR');
      
      if (errorHandler) {
        errorHandler(apiError);
      } else if (showErrorToast) {
        this.showErrorToast(apiError);
      }

      return { error: errorMessage };
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private showErrorToast(error: ApiError): void {
    // This will be handled by the ErrorContext when used in components
    console.error('API Error:', error);
  }

  private showSuccessToast(message: string): void {
    // This will be handled by the ErrorContext when used in components
    console.log('API Success:', message);
  }

  // Public API methods
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create a default instance
export const apiClient = new EnhancedApiClient();

// Hook for using the API client with error handling
export function useApiClient() {
  const { showError, showSuccess } = useError();

  const client = new EnhancedApiClient();
  
  // Override the toast methods to use the context
  client['showErrorToast'] = (error: ApiError) => {
    showError(
      error.message,
      error.status ? `Error ${error.status}` : undefined,
      error.code === 'NETWORK_ERROR' ? {
        label: 'Retry',
        onClick: () => window.location.reload()
      } : undefined
    );
  };

  client['showSuccessToast'] = (message: string) => {
    showSuccess(message);
  };

  return client;
}
