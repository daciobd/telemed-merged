import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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

function buildDemoUser(email: string) {
  const cfg = DEMO_USERS[email.toLowerCase()];
  if (!cfg) return null;
  return {
    id: 'demo-' + cfg.role,
    email,
    fullName: cfg.name,
    role: cfg.role,
  };
}

export default function Login() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { login, user, setUser } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const params = new URLSearchParams(searchString);
  const profileParam = params.get('profile');

  const redirectByRole = (u: { role: string }) => {
    if (u.role === 'patient') {
      setLocation('/paciente/dashboard');
    } else {
      setLocation('/dashboard');
    }
  };

  useEffect(() => {
    if (user) {
      redirectByRole(user);
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const emailLower = email.trim().toLowerCase();

    // 🔥 1) MODO DEMO PRIORITÁRIO NO RENDER - nem tenta chamar API
    if (isDemoEnv && password === '123456') {
      const demoUser = buildDemoUser(emailLower);
      if (demoUser) {
        console.warn('[Login] MODO DEMO → pulando API para', emailLower);
        setUser(demoUser as any);
        try {
          localStorage.setItem('consultorio_token', 'demo-token-' + demoUser.role);
          localStorage.setItem('telemed_demo_user', JSON.stringify(demoUser));
        } catch {}
        toast({
          title: 'Login DEMO realizado!',
          description: 'Modo demonstração ativo',
        });
        redirectByRole(demoUser);
        setIsLoading(false);
        return;
      }
    }

    // 2) FLUXO NORMAL (local / ambiente real)
    try {
      const loggedUser = await login(email, password);
      
      if (loggedUser) {
        toast({
          title: 'Login realizado!',
          description: 'Redirecionando...',
        });
        redirectByRole(loggedUser);
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: 'Email ou senha inválidos',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: error instanceof Error ? error.message : 'Credenciais inválidas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDescription = () => {
    if (profileParam === 'paciente') {
      return 'Acesse sua área de paciente';
    }
    if (profileParam === 'medico') {
      return 'Acesse seu consultório virtual';
    }
    return 'Entre com suas credenciais para acessar';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Consultório Virtual</CardTitle>
          <CardDescription className="text-center">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Não tem uma conta?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation('/register/patient')}
                data-testid="button-register-patient"
              >
                Sou Paciente
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/register/doctor')}
                data-testid="button-register-doctor"
              >
                Sou Médico
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
