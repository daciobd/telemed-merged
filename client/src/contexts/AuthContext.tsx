import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiRequest } from '@/lib/api';

interface User {
  id: number;
  email: string;
  role: 'patient' | 'doctor';
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerPatient: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>;
  registerDoctor: (data: { email: string; password: string; fullName: string; crm: string; specialty: string; phone?: string }) => Promise<void>;
  logout: () => void;
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
        setToken(null);
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      localStorage.removeItem('consultorio_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: User }>('/api/consultorio/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('consultorio_token', response.token);
  };

  const registerPatient = async (data: { email: string; password: string; fullName: string; phone?: string }) => {
    const response = await apiRequest<{ token: string; user: User }>('/api/consultorio/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('consultorio_token', response.token);
  };

  const registerDoctor = async (data: { email: string; password: string; fullName: string; crm: string; specialty: string; phone?: string }) => {
    const response = await apiRequest<{ token: string; user: User }>('/api/consultorio/auth/register/doctor', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('consultorio_token', response.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('consultorio_token');
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
      logout 
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
