import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import DrAiPanel from '@/features/consultorio/components/DrAiPanel';
import ScribeMedicalPanel from '@/features/consultorio/components/ScribeMedicalPanel';
import AtendimentoForm from '@/features/consultorio/components/AtendimentoForm';
import DiagnosticoCID, { type Hipotese } from '@/features/consultorio/components/DiagnosticoCID';
import ClinicalTabs from '@/features/consultorio/components/ClinicalTabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, Video, ArrowLeft, Phone, Mail, AlertCircle } from 'lucide-react';
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

  const [queixa, setQueixa] = useState(consultation?.queixaPrincipal || "");
  const [anamnese, setAnamnese] = useState(consultation?.observacoes || "");
  const [hipoteses, setHipoteses] = useState<Hipotese[]>([]);
  const [exames, setExames] = useState("");
  const [prescricao, setPrescricao] = useState("");
  const [encaminhamento, setEncaminhamento] = useState("");
  const [notasPrivadas, setNotasPrivadas] = useState("");

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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-teal-600" />
                Vídeo da Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use o vídeo para atender em tempo real.
              </p>

              {!isPast && consultation.status !== 'concluida' && consultation.status !== 'cancelada' ? (
                <Button
                  onClick={handleStartVideo}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  data-testid="button-start-video"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Iniciar Vídeo
                </Button>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Consulta encerrada ou fora do horário.</p>
              )}
            </CardContent>
          </Card>

          <AtendimentoForm
            queixa={queixa}
            setQueixa={setQueixa}
            anamnese={anamnese}
            setAnamnese={setAnamnese}
          />

          <div className="space-y-6">
            <DrAiPanel
              pacienteNome={consultation.paciente.nome}
              pacienteIdade={consultation.paciente.idade}
              pacienteSexo={consultation.paciente.sexo}
              initialQueixaPrincipal={queixa}
              onApplyResumoToEvolucao={(texto) => {
                setAnamnese(prev => (prev ? `${prev}\n\n${texto}` : texto));
              }}
            />

            <ScribeMedicalPanel
              consultaId={consultation.id}
              onApplyToEvolucao={(texto) => {
                setAnamnese(prev => (prev ? `${prev}\n\n${texto}` : texto));
              }}
              onApplyToAnamnese={(bloco) => {
                setAnamnese(prev => (prev ? `${prev}\n\n${bloco}` : bloco));
              }}
              onApplyToPrescricao={(bloco) => {
                setPrescricao(prev => (prev ? `${prev}\n\n${bloco}` : bloco));
              }}
              onApplyToEncaminhamento={(bloco) => {
                setEncaminhamento(prev => (prev ? `${prev}\n\n${bloco}` : bloco));
              }}
              onApplyToExames={(bloco) => {
                setExames(prev => (prev ? `${prev}\n\n${bloco}` : bloco));
              }}
            />
          </div>

          <DiagnosticoCID selected={hipoteses} onChange={setHipoteses} />

          <ClinicalTabs
            exames={exames}
            setExames={setExames}
            prescricao={prescricao}
            setPrescricao={setPrescricao}
            encaminhamento={encaminhamento}
            setEncaminhamento={setEncaminhamento}
            notasPrivadas={notasPrivadas}
            setNotasPrivadas={setNotasPrivadas}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                Paciente & Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Paciente</p>
                <p className="font-medium text-lg" data-testid="text-patient-name">{consultation.paciente.nome}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-patient-info">
                  {consultation.paciente.idade} anos • {consultation.paciente.sexo}
                </p>
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

              <div className="border-t pt-4 space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Consulta</p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Especialidade:</span>{" "}
                  <span className="font-medium" data-testid="text-specialty">{consultation.especialidade}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Data/Hora:</span>{" "}
                  <span className="font-medium" data-testid="text-datetime">{formatDate(consultation.dataHora)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Valor:</span>{" "}
                  <span className="font-medium text-green-600" data-testid="text-value">
                    R$ {consultation.valorAcordado.toFixed(2)}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConsultorioLayout>
  );
}
