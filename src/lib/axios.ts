import axios from 'axios';
import { getCookie, setCookie, deleteCookie } from 'cookies-next';

// Use the Next.js API proxy to avoid CORS issues
// This will route through /api/* which is proxied to the backend in next.config.js
const baseURL = '/api';

// Only log URLs in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL (proxied through Next.js):', baseURL);
  console.log(
    'Backend API URL (proxied to):',
    process.env.NEXT_PUBLIC_API_BASE_URL
  );
}

const COOKIE_OPTIONS = {
  path: '/',
  secure: false, // Changed from process.env.NODE_ENV === 'production' to false for HTTP support
  sameSite: 'lax' as const,
};

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: true, // Include cookies in cross-site requests
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getCookie('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request details only in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          headers: config.headers,
          data: config.data,
        }
      );
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses only in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`, {
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    // Ensure error is properly structured for logging
    const errorDetails = {
      url: error.config?.url || 'unknown',
      method: error.config?.method || 'unknown',
      status: error.response?.status || 'no response',
      statusText: error.response?.statusText || '',
      data: error.response?.data || {},
      message: error.message || 'Unknown error',
    };

    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', errorDetails);
    }

    const originalRequest = error.config;

    // Handle network errors (CORS, server down, etc.)
    if (!error.response) {
      console.error(
        `Network Error (${error.message}): The API server might be down or CORS might be misconfigured`
      );
      // Add more context to the error for better handling
      error.isNetworkError = true;
      return Promise.reject(error);
    }

    // If the error is 401 and we haven't retried the request yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getCookie('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('Attempting token refresh');

        // Use the same axios instance for token refresh to benefit from the proxy
        const response = await axiosInstance.post('/auth/refresh-token', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store both tokens
        setCookie('accessToken', accessToken, COOKIE_OPTIONS);
        if (newRefreshToken) {
          setCookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (error) {
        console.error('Token refresh failed:', error);

        // Clear all auth cookies
        deleteCookie('accessToken', COOKIE_OPTIONS);
        deleteCookie('refreshToken', COOKIE_OPTIONS);
        deleteCookie('verificationPending', COOKIE_OPTIONS);
        deleteCookie('verificationEmail', COOKIE_OPTIONS);

        // Trigger auth expired event to redirect user
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
