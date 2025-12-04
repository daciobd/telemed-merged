import { useQuery } from '@tanstack/react-query';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Clock, User, Video, Eye, Calendar } from 'lucide-react';
import { Link } from 'wouter';

interface Consultation {
  id: string;
  paciente: string;
  especialidade: string;
  dataHora: string;
  duracao: number;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  valorAcordado: number;
}

export default function MinhasConsultas() {
  const { data: consultations, isLoading } = useQuery<Consultation[]>({
    queryKey: ['/api/consultorio/minhas-consultas'],
  });

  const now = new Date();
  const proximasConsultas = consultations?.filter(
    (c) => new Date(c.dataHora) >= now && c.status !== 'concluida' && c.status !== 'cancelada'
  ) || [];
  const passadasConsultas = consultations?.filter(
    (c) => new Date(c.dataHora) < now || c.status === 'concluida'
  ) || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    agendada: { label: 'Agendada', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' },
    em_andamento: { label: 'Em Andamento', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' },
    concluida: { label: 'Concluída', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' },
    cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' },
  };

  const ConsultationCard = ({ consultation }: { consultation: Consultation }) => {
    const status = statusLabels[consultation.status] || statusLabels.agendada;
    const isPast = new Date(consultation.dataHora) < now;

    return (
      <Card data-testid={`card-consultation-${consultation.id}`}>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-teal-600" />
                Paciente: {consultation.paciente}
              </CardTitle>
              <CardDescription className="mt-1">
                {consultation.especialidade}
              </CardDescription>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Data: {formatDate(consultation.dataHora)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Duração: {consultation.duracao} min</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isPast && consultation.status === 'agendada' && (
              <Link href={`/consultas/${consultation.id}`}>
                <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700" data-testid={`button-enter-${consultation.id}`}>
                  <Video className="h-4 w-4 mr-2" />
                  Entrar na consulta
                </Button>
              </Link>
            )}
            <Link href={`/consultas/${consultation.id}`}>
              <Button variant="outline" className="w-full sm:w-auto" data-testid={`button-details-${consultation.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message, showMarketplaceLink }: { message: string; showMarketplaceLink?: boolean }) => (
    <Card>
      <CardContent className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400 text-lg">{message}</p>
        {showMarketplaceLink && (
          <Link href="/marketplace">
            <Button className="mt-4 bg-teal-600 hover:bg-teal-700" data-testid="button-go-marketplace">
              Ir para o Marketplace
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ConsultorioLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-teal-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Minhas Consultas
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie suas consultas agendadas e passadas
            </p>
          </div>
        </div>

        <Tabs defaultValue="proximas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="proximas" data-testid="tab-proximas">
              Próximas ({proximasConsultas.length})
            </TabsTrigger>
            <TabsTrigger value="passadas" data-testid="tab-passadas">
              Passadas ({passadasConsultas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : proximasConsultas.length > 0 ? (
              <div className="grid gap-4">
                {proximasConsultas.map((consultation) => (
                  <ConsultationCard key={consultation.id} consultation={consultation} />
                ))}
              </div>
            ) : (
              <EmptyState 
                message="Você não tem consultas agendadas" 
                showMarketplaceLink 
              />
            )}
          </TabsContent>

          <TabsContent value="passadas" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : passadasConsultas.length > 0 ? (
              <div className="grid gap-4">
                {passadasConsultas.map((consultation) => (
                  <ConsultationCard key={consultation.id} consultation={consultation} />
                ))}
              </div>
            ) : (
              <EmptyState message="Você ainda não realizou nenhuma consulta" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ConsultorioLayout>
  );
}
