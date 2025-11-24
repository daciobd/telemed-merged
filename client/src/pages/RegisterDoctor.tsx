import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function RegisterDoctor() {
  const [, setLocation] = useLocation();
  const { registerDoctor } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    crm: '',
    specialty: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await registerDoctor(formData);
      toast({
        title: 'Cadastro realizado!',
        description: 'Bem-vindo ao Consultório Virtual',
      });
      setLocation('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Cadastro de Médico</CardTitle>
          <CardDescription className="text-center">
            Crie sua conta para atender pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium">
                Nome Completo
              </label>
              <Input
                id="fullName"
                placeholder="Dr. João da Silva"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                data-testid="input-fullname"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="crm" className="text-sm font-medium">
                  CRM
                </label>
                <Input
                  id="crm"
                  placeholder="123456"
                  value={formData.crm}
                  onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                  required
                  data-testid="input-crm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="specialty" className="text-sm font-medium">
                  Especialidade
                </label>
                <Input
                  id="specialty"
                  placeholder="Cardiologia"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  required
                  data-testid="input-specialty"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="dr.joao@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Telefone (opcional)
              </label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-phone"
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-register"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setLocation('/login')}
              data-testid="link-login"
            >
              Já tem uma conta? Faça login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
