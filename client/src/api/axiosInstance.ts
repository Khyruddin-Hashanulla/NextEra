import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, TOKEN_KEYS } from '@/lib/constants';
import { mockAdapter } from '@/mocks/adapter';
import { isMockingEnabled } from '@/mocks/config';

let csrfToken: string | null = null;
let csrfFetchPromise: Promise<void> | null = null;

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function fetchCsrfToken(signal?: AbortSignal): Promise<void> {
  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }

  csrfFetchPromise = (async () => {
    try {
      const { data } = await axiosInstance.get('/csrf-token', { signal });
      csrfToken = data.data?.csrfToken ?? null;
    } catch {
      csrfToken = null;
    } finally {
      csrfFetchPromise = null;
    }
  })();

  return csrfFetchPromise;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

function setCsrfHeader(config: InternalAxiosRequestConfig, token: string | null): void {
  if (config.headers && token) {
    config.headers['X-CSRF-Token'] = token;
  }
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
});

if (isMockingEnabled()) {
  axiosInstance.defaults.adapter = mockAdapter;
}

axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (
      config.method &&
      !SAFE_METHODS.includes(config.method.toUpperCase()) &&
      config.headers
    ) {
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      setCsrfHeader(config, csrfToken);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, newRefreshToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const errorData = error.response?.data as { message?: string } | undefined;
    if (error.response?.status === 403 && errorData?.message?.toLowerCase().includes('csrf')) {
      const csrfRetried = (originalRequest as { _csrfRetry?: boolean })._csrfRetry;
      if (!csrfRetried) {
        (originalRequest as { _csrfRetry?: boolean })._csrfRetry = true;
        await fetchCsrfToken();
        if (csrfToken) {
          setCsrfHeader(originalRequest, csrfToken);
          return axiosInstance(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
