import { getApiUrl } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  institution?: string;
  role?: string;
}

export interface HealthStatus {
  api: string;
  database: string;
  models: {
    yolo: string;
    efficientnet_v2: string;
  };
  optional_modules: {
    defect_detection: string;
    shelf_life_prediction: string;
    market_grade: string;
  };
  timestamp: string;
}

export interface SystemStats {
  total_analyses: number;
  total_fruits_detected: number;
  average_quality_confidence: number;
  fruit_distribution: Record<string, number>;
  quality_distribution: Record<string, number>;
  recent_analyses: any[];
  is_empty: boolean;
}

const TOKEN_STORAGE_KEY = 'fruitvision_auth_token';
const USER_STORAGE_KEY = 'fruitvision_auth_user';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }
  }

  public getToken(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!stored || stored === 'undefined' || stored === 'null' || stored.trim() === '') {
        this.token = null;
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } else {
        this.token = stored;
      }
    }
    return this.token;
  }

  public setToken(token: string, user?: AuthUser): void {
    if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
      this.clearToken();
      return;
    }
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }
    }
  }

  public clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  public getStoredUser(): AuthUser | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Centralized safe request wrapper:
   * 1. Appends auth header if token exists
   * 2. Inspects HTTP status code
   * 3. Safely parses JSON; catches HTML responses to prevent "Unexpected token <"
   * 4. Returns typed ApiResponse or throws normalized Error
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = getApiUrl(endpoint);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token && token.trim() !== '' && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Do not set Content-Type for FormData / multipart
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!isJson) {
        // Prevent "Unexpected token '<', "The page..." is not valid JSON" crash
        const text = await response.text();
        console.warn(`[API Client Warning] Non-JSON response received from ${endpoint}:`, text.substring(0, 120));
        throw new Error('Backend endpoint returned an invalid response.');
      }

      const json = await response.json();

      if (!response.ok || json.success === false) {
        if (response.status === 401 && endpoint === '/api/auth/me') {
          this.clearToken();
        }
        const errorMessage =
          json.error?.message ||
          json.message ||
          `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).code = json.error?.code || `HTTP_${response.status}`;
        (error as any).status = response.status;
        throw error;
      }

      return json as ApiResponse<T>;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Network failure. Please check your internet connection or server status.');
      }
      throw err;
    }
  }

  // ==========================================
  // 1. HEALTH CHECK
  // GET /api/health
  // ==========================================
  public async getHealth(): Promise<ApiResponse<HealthStatus>> {
    return this.request<HealthStatus>('/api/health', {
      method: 'GET',
    });
  }

  // ==========================================
  // 2. AUTHENTICATION
  // ==========================================
  public async signup(data: {
    name: string;
    email: string;
    password: string;
    institution?: string;
  }): Promise<ApiResponse<{ token: string; user: AuthUser }>> {
    const res = await this.request<{ token: string; user: AuthUser }>(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if (res.data?.token) {
      this.setToken(res.data.token, res.data.user);
    }
    return res;
  }

  public async login(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string; user: AuthUser }>> {
    const res = await this.request<{ token: string; user: AuthUser }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if (res.data?.token) {
      this.setToken(res.data.token, res.data.user);
    }
    return res;
  }

  public async logout(): Promise<ApiResponse<{ logged_out: boolean }>> {
    try {
      const res = await this.request<{ logged_out: boolean }>('/api/auth/logout', {
        method: 'POST',
      });
      return res;
    } finally {
      this.clearToken();
    }
  }

  public async getMe(): Promise<ApiResponse<{ user: AuthUser }>> {
    return this.request<{ user: AuthUser }>('/api/auth/me', {
      method: 'GET',
    });
  }

  // ==========================================
  // 3. IMAGE UPLOAD VALIDATION
  // POST /api/upload
  // ==========================================
  public async uploadImage(file: File): Promise<ApiResponse<{
    filename: string;
    width?: number;
    height?: number;
    size: number;
    preview_url: string;
  }>> {
    const formData = new FormData();
    formData.append('image', file);

    return this.request('/api/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // ==========================================
  // 4. PREDICTIONS PIPELINE
  // POST /api/predict
  // ==========================================
  public async predict(
    file: File | Blob,
    options?: {
      isBenchmark?: boolean;
      benchmarkData?: any[];
    }
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('image', file, (file as File).name || 'fruit_sample.jpg');

    if (options?.isBenchmark) {
      formData.append('is_benchmark_test', 'true');
      if (options.benchmarkData) {
        formData.append('benchmark_data', JSON.stringify(options.benchmarkData));
      }
    }

    return this.request('/api/predict', {
      method: 'POST',
      body: formData,
    });
  }

  // ==========================================
  // 5. PREDICTIONS HISTORY & MANAGEMENT
  // ==========================================
  public async getPredictions(): Promise<ApiResponse<{ predictions: any[]; count: number }>> {
    return this.request('/api/predictions', {
      method: 'GET',
    });
  }

  public async getPredictionById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/api/predictions/${id}`, {
      method: 'GET',
    });
  }

  public async deletePrediction(id: string): Promise<ApiResponse<{ deleted_id: string }>> {
    return this.request(`/api/predictions/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // 6. ANALYTICS & STATS
  // GET /api/stats
  // ==========================================
  public async getStats(): Promise<ApiResponse<SystemStats>> {
    return this.request<SystemStats>('/api/stats', {
      method: 'GET',
    });
  }
}

export const api = new ApiClient();
