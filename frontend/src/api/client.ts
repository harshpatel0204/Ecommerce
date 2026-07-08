import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "@/store/authStore";
import type { TokenResponse } from "@/types/auth";

// Same-origin "/api" in production (FE + BE on one Vercel domain); overridable for
// local dev via VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Serialize concurrent refreshes so a burst of 401s triggers a single refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setAccessToken, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    // Plain axios (not apiClient) so this call itself isn't intercepted/retried.
    const { data } = await axios.post<TokenResponse>(`${baseURL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    setAccessToken(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clear();
    return null;
  }
}

// Pre-auth endpoints must never trigger a refresh-and-retry (avoids loops).
// Note: /auth/me IS eligible for refresh.
const NO_REFRESH_PATHS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/google",
  "/auth/firebase-phone",
];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const skipRefresh = NO_REFRESH_PATHS.some((p) => original?.url?.includes(p));

    if (error.response?.status === 401 && original && !original._retry && !skipRefresh) {
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);
