import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { api, setAuthToken, UserProfile } from '../api/client';

type AuthValue = {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, passcode: string) => Promise<void>;
  register: (payload: { email: string; passcode: string; name?: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = (nextToken: string | null, profile: UserProfile | null) => {
    if (nextToken && profile) {
      localStorage.setItem('amily-session', JSON.stringify({ token: nextToken, user: profile }));
    } else {
      localStorage.removeItem('amily-session');
    }
  };

  const logout = useCallback(() => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    persist(null, null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('amily-session');
    if (stored) {
      const parsed = JSON.parse(stored);
      setTokenState(parsed.token);
      setAuthToken(parsed.token);
      setUser(parsed.user);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await api.get('/me');
        setUser(data);
        persist(token, data);
      } catch {
        logout();
      }
    })();
  }, [token, logout]);

  const login = async (email: string, passcode: string) => {
    const { data } = await api.post('/auth/login', { email, passcode });
    setAuthToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    persist(data.token, data.user);
  };

  const register = async (payload: { email: string; passcode: string; name?: string }) => {
    const { data } = await api.post('/auth/register', payload);
    setAuthToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    persist(data.token, data.user);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthContext missing');
  return ctx;
}
