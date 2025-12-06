import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  ShoppingCart, 
  FileText, 
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'wouter';

interface DashboardStats {
  consultasHoje: number;
  consultasSemana: number;
  novasMarketplace: number;
  ganhosEsteMes: number;
}

interface Consultation {
  id: string;
  paciente: string;
  dataHora: string;
  especialidade: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/consultorio/dashboard/stats'],
  });

  const { data: proximasConsultas, isLoading: isLoadingProximas } = useQuery<Consultation[]>({
    queryKey: ['/api/consultorio/dashboard/proximas'],
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    testId 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ElementType; 
    color: string;
    testId: string;
  }) => (
    <Card data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ConsultorioLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Olá, {user?.fullName?.split(' ')[0] || 'Doutor'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Aqui está um resumo do seu consultório virtual
          </p>
        </div>

        {/* Banner: Saiba como funciona o TeleMed */}
        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 rounded-md">
          <h2 className="text-teal-700 dark:text-teal-300 font-semibold text-lg">Saiba como funciona o TeleMed</h2>
          <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm">
            Entenda como usar o Consultório Virtual e, se quiser, como receber pacientes via Marketplace.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href="/medico/como-funciona-marketplace.html"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-teal-600 text-white rounded-md text-sm font-semibold hover:bg-teal-700 transition-colors"
              data-testid="btn-como-funciona-medico"
            >
              Como funciona para médicos
            </a>
            <a
              href="/paciente/como-funciona-bids.html"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-600 text-teal-700 dark:text-teal-300 rounded-md text-sm font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
              data-testid="btn-como-funciona-paciente"
            >
              Como funciona para pacientes
            </a>
          </div>
        </div>

        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Consultas Hoje"
              value={stats?.consultasHoje ?? 0}
              icon={Clock}
              color="bg-blue-500"
              testId="stat-consultas-hoje"
            />
            <StatCard
              title="Esta Semana"
              value={stats?.consultasSemana ?? 0}
              icon={Calendar}
              color="bg-teal-500"
              testId="stat-consultas-semana"
            />
            <StatCard
              title="Novas no Marketplace"
              value={stats?.novasMarketplace ?? 0}
              icon={ShoppingCart}
              color="bg-orange-500"
              testId="stat-marketplace"
            />
            <StatCard
              title="Ganhos do Mês"
              value={`R$ ${(stats?.ganhosEsteMes ?? 0).toFixed(2)}`}
              icon={TrendingUp}
              color="bg-green-500"
              testId="stat-ganhos"
            />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                Próximas Consultas
              </CardTitle>
              <CardDescription>Suas consultas agendadas para hoje</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProximas ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : proximasConsultas && proximasConsultas.length > 0 ? (
                <div className="space-y-3">
                  {proximasConsultas.slice(0, 3).map((consulta) => (
                    <div 
                      key={consulta.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      data-testid={`proxima-${consulta.id}`}
                    >
                      <div>
                        <p className="font-medium">{consulta.paciente}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {consulta.especialidade}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-teal-600">{formatTime(consulta.dataHora)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Nenhuma consulta agendada para hoje
                </p>
              )}
              
              <Link href="/agenda">
                <Button variant="outline" className="w-full mt-4" data-testid="button-ver-agenda">
                  Ver Agenda Completa
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>Acesse as principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/marketplace">
                <Button className="w-full justify-start bg-teal-600 hover:bg-teal-700" data-testid="button-ir-marketplace">
                  <ShoppingCart className="h-4 w-4 mr-3" />
                  Ir para o Marketplace
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/minhas-consultas">
                <Button variant="outline" className="w-full justify-start" data-testid="button-ver-consultas">
                  <FileText className="h-4 w-4 mr-3" />
                  Ver Minhas Consultas
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
              
              <Link href="/agenda">
                <Button variant="outline" className="w-full justify-start" data-testid="button-abrir-agenda">
                  <Calendar className="h-4 w-4 mr-3" />
                  Abrir Agenda
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConsultorioLayout>
  );
}
