import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('prjct_iris_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.auth.me()
        .then(setUser)
        .catch(() => { localStorage.removeItem('prjct_iris_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  async function login(email: string, password: string) {
    const { token: t, user: u } = await api.auth.login(email, password);
    localStorage.setItem('prjct_iris_token', t);
    setToken(t);
    setUser(u);
  }

  async function register(email: string, name: string, password: string) {
    const { token: t, user: u } = await api.auth.register(email, name, password);
    localStorage.setItem('prjct_iris_token', t);
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('prjct_iris_token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
