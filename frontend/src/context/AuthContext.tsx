import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { User, Role } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');

    if (!stored || stored === 'undefined' || stored === 'null') {
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('token')
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await authService.me();

        setUser(me);
        localStorage.setItem('user', JSON.stringify(me));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);

    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));

    setToken(result.token);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles: Role[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}