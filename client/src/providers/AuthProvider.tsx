import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types/user';
import { authApi } from '@/api/endpoints/auth';
import { userApi } from '@/api/endpoints/user';
import { TOKEN_KEYS, QUERY_KEYS } from '@/lib/constants';
import { fetchCsrfToken } from '@/api/axiosInstance';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const abortController = new AbortController();
    fetchCsrfToken(abortController.signal);
    return () => abortController.abort();
  }, []);

  const {
    data: user,
    isLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.auth.user,
    queryFn: ({ signal }) => userApi.getMe(signal).then(r => r.data.data),
    enabled: !!localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN),
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const { user: userData, accessToken, refreshToken } = data.data;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    queryClient.setQueryData(QUERY_KEYS.auth.user, userData);
  }, [queryClient]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await authApi.register({ name, email, password });
    queryClient.setQueryData(QUERY_KEYS.auth.user, data.data);
  }, [queryClient]);

  const googleLogin = useCallback(async (credential: string) => {
    const { data } = await authApi.googleAuth(credential);
    const { user: userData, accessToken, refreshToken } = data.data;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    queryClient.setQueryData(QUERY_KEYS.auth.user, userData);
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.user });
      queryClient.clear();
    }
  }, [queryClient]);

  const setUser = useCallback((user: User | null) => {
    if (user) {
      queryClient.setQueryData(QUERY_KEYS.auth.user, user);
    } else {
      queryClient.removeQueries({ queryKey: QUERY_KEYS.auth.user });
    }
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
