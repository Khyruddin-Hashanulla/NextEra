import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@/types/user';
import { authApi } from '@/api/endpoints/auth';
import { TOKEN_KEYS } from '@/lib/constants';
import { ApiError } from '@/types/api';
import { queryClient } from '@/api/queryClient';
import axiosInstance, { fetchCsrfToken } from '@/api/axiosInstance';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchCsrfToken();

      const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await axiosInstance.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data.data);
      } catch {
        localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    const { user: userData, accessToken, refreshToken } = data.data;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { data } = await authApi.register({ name, email, password });
    setUser(data.data);
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const { data } = await authApi.googleAuth(credential);
    const { user: userData, accessToken, refreshToken } = data.data;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
      setUser(null);
      queryClient.clear();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
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
