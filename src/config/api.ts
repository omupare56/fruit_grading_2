/**
 * API Configuration
 * 
 * In production / deployed environments, API_BASE_URL resolves to the current origin ('')
 * or import.meta.env.VITE_API_BASE_URL if explicitly configured.
 * All API requests communicate with same-origin /api endpoints.
 * Never hardcodes localhost in production code.
 */

const getBaseUrl = (): string => {
  // If an explicit API base URL is provided via environment variable, use it
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env && meta.env.VITE_API_BASE_URL) {
    return meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // In browser context, use empty string to trigger same-origin requests (e.g., /api/health)
  if (typeof window !== 'undefined' && window.location) {
    return '';
  }

  return '';
};

export const API_BASE_URL = getBaseUrl();
export const API_PREFIX = '/api';

export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
