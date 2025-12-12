import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import DrAiAssistenteClinico from '@/components/dr-ai/DrAiAssistenteClinico';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, Video, Calendar, ArrowLeft, Phone, Mail, AlertCircle } from 'lucide-react';
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

const demoConsultations: Record<string, ConsultationDetails> = {
  'mc1': {
    id: 'mc1',
    especialidade: 'Clínica Geral',
    dataHora: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duracao: 30,
    status: 'confirmada',
    valorAcordado: 150,
    paciente: {
      nome: 'Maria Silva Santos',
      idade: 34,
      sexo: 'feminino',
      email: 'maria.santos@email.com',
      telefone: '(11) 98765-4321'
    },
    queixaPrincipal: 'Dor de cabeça persistente há 3 dias, acompanhada de leve tontura',
    observacoes: 'Paciente relata histórico de enxaqueca. Alérgica a dipirona.'
  },
  'mc2': {
    id: 'mc2',
    especialidade: 'Cardiologia',
    dataHora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    duracao: 45,
    status: 'agendada',
    valorAcordado: 280,
    paciente: {
      nome: 'João Pedro Oliveira',
      idade: 52,
      sexo: 'masculino',
      email: 'joao.oliveira@email.com',
      telefone: '(21) 99876-5432'
    },
    queixaPrincipal: 'Dor no peito ao esforço, falta de ar leve',
    observacoes: 'Hipertenso em tratamento. Usa Losartana 50mg.'
  },
  'mc3': {
    id: 'mc3',
    especialidade: 'Dermatologia',
    dataHora: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    duracao: 20,
    status: 'concluida',
    valorAcordado: 200,
    paciente: {
      nome: 'Ana Clara Ferreira',
      idade: 28,
      sexo: 'feminino',
      email: 'ana.ferreira@email.com',
      telefone: '(31) 97654-3210'
    },
    queixaPrincipal: 'Manchas vermelhas na pele que apareceram há 2 semanas',
    observacoes: 'Prescrito corticoide tópico por 7 dias.'
  }
};

export default function ConsultaDetails() {
  const [, params] = useRoute('/consultas/:id');
  const [location] = useLocation();
  const consultationId = params?.id || location.split('/').pop();

  const { data: apiConsultation, isLoading } = useQuery<ConsultationDetails>({
    queryKey: ['/api/consultorio/consultas', consultationId],
    enabled: !!consultationId,
    retry: false,
  });

  const demoData = consultationId ? demoConsultations[consultationId] : null;
  const consultation = apiConsultation || demoData;
  const isDemo = !apiConsultation && !!demoData;

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

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      agendada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      concluida: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      cancelada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return styles[status] || styles.pendente;
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2" data-testid="text-not-found">
            Consulta não encontrada
          </h2>
          <p className="text-gray-500 mb-4">ID: {consultationId}</p>
          <Link href="/minhas-consultas">
            <Button variant="outline" data-testid="button-back-list">
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
        {isDemo && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Modo Demo:</strong> Exibindo dados simulados para demonstração.
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Link href="/minhas-consultas">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Detalhes da Consulta
            </h1>
            <p className="text-sm text-gray-500">ID: {consultation.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(consultation.status)}`} data-testid="badge-status">
            {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
          </span>
        </div>

        <div className="space-y-6">
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
                      <p className="font-medium" data-testid="text-specialty">{consultation.especialidade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Duração</p>
                      <p className="font-medium" data-testid="text-duration">{consultation.duracao} minutos</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Data e Hora</p>
                      <p className="font-medium flex items-center gap-1" data-testid="text-datetime">
                        <Calendar className="h-4 w-4" />
                        {formatDate(consultation.dataHora)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Valor Acordado</p>
                      <p className="font-medium text-green-600" data-testid="text-value">R$ {consultation.valorAcordado.toFixed(2)}</p>
                    </div>
                  </div>

                  {consultation.queixaPrincipal && (
                    <div className="col-span-2 border-t pt-4 mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Queixa Principal
                        </p>
                      </div>
                      <p className="font-medium bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border" data-testid="text-complaint">
                        {consultation.queixaPrincipal}
                      </p>
                    </div>
                  )}

                  {!isPast && consultation.status !== 'concluida' && consultation.status !== 'cancelada' && (
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
                      <p className="font-medium text-lg" data-testid="text-patient-name">{consultation.paciente.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Idade</p>
                      <p className="font-medium" data-testid="text-patient-age">{consultation.paciente.idade} anos</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Sexo</p>
                      <p className="font-medium capitalize" data-testid="text-patient-sex">{consultation.paciente.sexo}</p>
                    </div>
                  </div>

                  {consultation.paciente.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span data-testid="text-patient-email">{consultation.paciente.email}</span>
                    </div>
                  )}

                  {consultation.paciente.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span data-testid="text-patient-phone">{consultation.paciente.telefone}</span>
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
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-observations">{consultation.observacoes}</p>
              </CardContent>
            </Card>
          )}

          <DrAiAssistenteClinico
            queixaPrincipal={consultation.queixaPrincipal}
            observacoes={consultation.observacoes}
            pacienteNome={consultation.paciente.nome}
            pacienteIdade={consultation.paciente.idade}
            pacienteSexo={consultation.paciente.sexo}
          />
        </div>
      </div>
    </ConsultorioLayout>
  );
}
