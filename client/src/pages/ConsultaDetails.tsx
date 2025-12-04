import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, User, Video, Calendar, ArrowLeft, Phone, Mail } from 'lucide-react';
import { Link } from 'wouter';

interface ConsultationDetails {
  id: string;
  especialidade: string;
  dataHora: string;
  duracao: number;
  status: string;
  valorAcordado: number;
  paciente: {
    nome: string;
    idade: number;
    sexo: string;
    email?: string;
    telefone?: string;
  };
  queixaPrincipal?: string;
  observacoes?: string;
}

export default function ConsultaDetails() {
  const [match, params] = useRoute('/consultas/:id');
  const consultationId = params?.id;

  const { data: consultation, isLoading } = useQuery<ConsultationDetails>({
    queryKey: ['/api/consultorio/consultas', consultationId],
    enabled: !!consultationId,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartVideo = () => {
    window.open('https://meet.jit.si/telemed-demo-' + consultationId, '_blank');
  };

  if (isLoading) {
    return (
      <ConsultorioLayout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </CardContent>
          </Card>
        </div>
      </ConsultorioLayout>
    );
  }

  if (!consultation) {
    return (
      <ConsultorioLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Consulta não encontrada
          </h2>
          <Link href="/minhas-consultas">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Minhas Consultas
            </Button>
          </Link>
        </div>
      </ConsultorioLayout>
    );
  }

  const isPast = new Date(consultation.dataHora) < new Date();

  return (
    <ConsultorioLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/minhas-consultas">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Detalhes da Consulta
            </h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                Informações da Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Especialidade</p>
                  <p className="font-medium">{consultation.especialidade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Duração</p>
                  <p className="font-medium">{consultation.duracao} minutos</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Data e Hora</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(consultation.dataHora)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valor Acordado</p>
                  <p className="font-medium text-green-600">R$ {consultation.valorAcordado.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-medium capitalize">{consultation.status.replace('_', ' ')}</p>
                </div>
              </div>

              {consultation.queixaPrincipal && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Queixa Principal</p>
                  <p className="font-medium">{consultation.queixaPrincipal}</p>
                </div>
              )}

              {!isPast && (
                <Button 
                  onClick={handleStartVideo} 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  data-testid="button-start-video"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Iniciar Vídeo
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                Dados do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                  <p className="font-medium text-lg">{consultation.paciente.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Idade</p>
                  <p className="font-medium">{consultation.paciente.idade} anos</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sexo</p>
                  <p className="font-medium capitalize">{consultation.paciente.sexo}</p>
                </div>
              </div>

              {consultation.paciente.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{consultation.paciente.email}</span>
                </div>
              )}

              {consultation.paciente.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{consultation.paciente.telefone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {consultation.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">{consultation.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ConsultorioLayout>
  );
}
