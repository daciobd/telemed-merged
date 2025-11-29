import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getToken, setToken as persistToken, clearToken } from "../lib/auth";

type UserRole = "doctor" | "patient";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
};

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar token inicial
  useEffect(() => {
    const stored = getToken();
    if (stored) {
      setToken(stored);
      fetchCurrentUser(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchCurrentUser(currentToken: string) {
    try {
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!res.ok) throw new Error("Não autenticado");
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      console.error(err);
      setUser(null);
      clearToken();
      setToken(null);
    }
  }

  async function login(newToken: string) {
    persistToken(newToken);
    setToken(newToken);
    await fetchCurrentUser(newToken);
  }

  function logout() {
    clearToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
