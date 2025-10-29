import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

// Extend AxiosRequestConfig to include retry flag and count
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

// Fixed: Use window.ENV if available or hardcoded fallback
// Avoid using process.env which is not available in the browser without special handling
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.accessToken;
    
    console.log('Axios interceptor state:', { 
      hasToken: !!token, 
      url: config.url,
      baseURL: API_URL
    });

    // Skip authentication for admin job status update routes
    if (config.url?.includes('/admin/jobs/') && config.url?.includes('/status')) {
      console.log('Admin job status update route - ensuring auth token is included');
      // Don't skip auth for these routes anymore
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added authorization token to request');
    } else {
      // Fallback to localStorage if redux store doesn't have the token
      const localToken = localStorage.getItem('token');
      if (localToken) {
        config.headers.Authorization = `Bearer ${localToken}`;
        console.log('Using localStorage token as fallback');
      } else {
        console.log('No token available for request');
      }
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Axios request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with improved token handling and error recovery
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Log complete error details for debugging
    console.log('Axios error response:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: originalRequest?.url,
      method: originalRequest?.method,
      hasRetried: originalRequest?._retry,
      data: error.response?.data,
      message: error.message
    });

    // Check if there's a network issue
    if (!error.response) {
      console.error('Network or CORS issue detected', error.message);
      
      // For network errors, implement retry with exponential backoff
      if (error.message === 'Network Error' && originalRequest && !originalRequest._retry) {
        console.log('Network error detected, attempting retry after delay');
        originalRequest._retry = true;
        
        return new Promise((resolve) => {
          const retryDelay = Math.min(3000, 1000 * (originalRequest._retryCount || 0) + 1000);
          console.log(`Retrying request after ${retryDelay}ms delay`);
          
          setTimeout(() => {
            console.log('Executing retry for network error');
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
            resolve(axios(originalRequest as AxiosRequestConfig));
          }, retryDelay);
        });
      }
    }

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      console.log('Token issue detected (401)', originalRequest.url);
      originalRequest._retry = true;

      try {
        // Check both localStorage and Redux store for refresh token
        const localRefreshToken = localStorage.getItem('refreshToken');
        const state = store.getState();
        const storeRefreshToken = state.auth.refreshToken;
        
        const refreshToken = storeRefreshToken || localRefreshToken;
        
        if (!refreshToken) {
          console.warn('No refresh token found, cannot refresh session');
          store.dispatch(logout());
          window.location.href = '/login?error=no_refresh_token';
          return Promise.reject(new Error('No refresh token available'));
        }
        
        // The auth endpoint doesn't need authorization header
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');
        
        // For direct token refresh, use a clean axios instance
        console.log('Attempting to refresh access token');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        
        if (!response.data?.accessToken) {
          console.error('Invalid refresh response format:', response.data);
          throw new Error('Invalid refresh token response format');
        }
        
        const { accessToken } = response.data;
        
        // Log success but not the actual token
        console.log('Token refreshed successfully');
        
        // Update both Redux store and localStorage
        store.dispatch({ type: 'auth/setAccessToken', payload: accessToken });
        localStorage.setItem('token', accessToken);
        
        // Prepare retry with new token
        const newRequest = { ...originalRequest };
        if (newRequest.headers && !isAuthEndpoint) {
          newRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        // Execute retry with new token
        return axios(newRequest as AxiosRequestConfig);
      } catch (refreshError: any) {
        // Detailed logging for refresh errors
        console.error('Token refresh failed:', {
          error: refreshError,
          status: refreshError.response?.status,
          message: refreshError.response?.data?.message || refreshError.message
        });
        
        // Clean up and redirect
        store.dispatch(logout());
        
        // Different errors get different messages
        if (refreshError.response?.status === 400) {
          window.location.href = '/login?error=invalid_refresh_token';
        } else if (refreshError.response?.status === 404) {
          window.location.href = '/login?error=refresh_endpoint_not_found';
        } else {
          window.location.href = '/login?error=refresh_failed';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Special handling for 500 server errors
    if (error.response?.status && error.response.status >= 500 && originalRequest && !originalRequest._retry) {
      console.error('Server error detected:', {
        status: error.response?.status,
        data: error.response?.data,
        url: originalRequest.url
      });
      
      // Retry server errors once after a short delay
      originalRequest._retry = true;
      
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          console.log('Retrying after server error');
          axios(originalRequest as AxiosRequestConfig)
            .then(response => resolve(response))
            .catch(retryError => {
              console.error('Retry after server error also failed:', retryError.message);
              reject(retryError);
            });
        }, 2000);
      });
    }

    // Enhanced error object with more details
    const enhancedError = error;
    if (error.response?.data) {
      // @ts-ignore - Adding custom property to error object
      enhancedError.serverMessage = error.response.data.message || 'Unknown server error';
    }

    return Promise.reject(enhancedError);
  }
);

export default axiosInstance; 
