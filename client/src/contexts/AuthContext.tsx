import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiRequest } from '@/lib/api';

const DEMO_USERS: Record<string, { name: string; role: 'doctor' | 'patient' }> = {
  'dra.anasilva@teste.com': {
    name: 'Dra. Ana Silva',
    role: 'doctor',
  },
  'paciente@teste.com': {
    name: 'João da Silva',
    role: 'patient',
  },
};

const isDemoEnv =
  typeof window !== 'undefined' &&
  window.location.hostname.includes('onrender.com');

interface User {
  id: number | string;
  email: string;
  role: 'patient' | 'doctor';
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerPatient: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<User>;
  registerDoctor: (data: { email: string; password: string; fullName: string; crm: string; specialty: string; phone?: string }) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('consultorio_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      if (authToken.startsWith('demo-token-')) {
        const storedDemoUser = localStorage.getItem('telemed_demo_user');
        if (storedDemoUser) {
          const demoUser = JSON.parse(storedDemoUser);
          setUser(demoUser);
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/consultorio/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('consultorio_token');
        localStorage.removeItem('telemed_demo_user');
        setToken(null);
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      localStorage.removeItem('consultorio_token');
      localStorage.removeItem('telemed_demo_user');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await apiRequest<{ token: string; user: User }>('/api/consultorio/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('consultorio_token', response.token);
      return response.user;
    } catch (err: any) {
      const demoConfig = DEMO_USERS[email.toLowerCase()];

      if (isDemoEnv && demoConfig && password === '123456') {
        console.warn('[Auth] Usando modo DEMO para login de', email);

        const demoUser: User = {
          id: 'demo-' + demoConfig.role,
          email,
          fullName: demoConfig.name,
          role: demoConfig.role,
        };

        setUser(demoUser);
        setToken('demo-token-' + demoConfig.role);
        try {
          localStorage.setItem('consultorio_token', 'demo-token-' + demoConfig.role);
          localStorage.setItem('telemed_demo_user', JSON.stringify(demoUser));
        } catch {}

        return demoUser;
      }

      throw err;
    }
  };

  const registerPatient = async (data: { email: string; password: string; fullName: string; phone?: string }): Promise<User> => {
    const response = await apiRequest<{ token: string; user: User }>('/api/consultorio/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('consultorio_token', response.token);
    return response.user;
  };

  const registerDoctor = async (data: { email: string; password: string; fullName: string; crm: string; specialty: string; phone?: string }): Promise<User> => {
    const response = await apiRequest<{ token: string; user: User }>('/api/consultorio/auth/register/doctor', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('consultorio_token', response.token);
    return response.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('consultorio_token');
    localStorage.removeItem('telemed_demo_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated: !!user,
      isLoading, 
      login, 
      registerPatient, 
      registerDoctor, 
      logout,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
