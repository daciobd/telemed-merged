import PacienteLayout from '@/components/PacienteLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserCircle, 
  Calendar,
  Clock,
  Video,
  FileText,
  CheckCircle2
} from 'lucide-react';

const DEMO_CONSULTAS_PROXIMAS = [
  {
    id: 'c1',
    medico: 'Dra. Ana Souza',
    specialty: 'Psiquiatria',
    data: '2024-12-15',
    horario: '14:00',
    tipo: 'Retorno',
    status: 'confirmada'
  },
  {
    id: 'c2',
    medico: 'Dr. Carlos Mendes',
    specialty: 'Cardiologia',
    data: '2024-12-20',
    horario: '10:30',
    tipo: 'Acompanhamento',
    status: 'confirmada'
  },
];

const DEMO_CONSULTAS_PASSADAS = [
  {
    id: 'p1',
    medico: 'Dra. Ana Souza',
    specialty: 'Psiquiatria',
    data: '2024-11-10',
    horario: '14:00',
    tipo: 'Consulta Regular',
    status: 'concluida',
    temReceita: true,
    temAtestado: false
  },
  {
    id: 'p2',
    medico: 'Dr. Carlos Mendes',
    specialty: 'Cardiologia',
    data: '2024-10-25',
    horario: '09:00',
    tipo: 'Check-up',
    status: 'concluida',
    temReceita: false,
    temAtestado: false
  },
  {
    id: 'p3',
    medico: 'Dra. Mariana Lima',
    specialty: 'Dermatologia',
    data: '2024-09-15',
    horario: '16:00',
    tipo: 'Primeira Consulta',
    status: 'concluida',
    temReceita: true,
    temAtestado: true
  },
  {
    id: 'p4',
    medico: 'Dr. Roberto Santos',
    specialty: 'Ortopedia',
    data: '2024-08-20',
    horario: '11:00',
    tipo: 'Avaliação',
    status: 'concluida',
    temReceita: true,
    temAtestado: true
  },
];

export default function PatientConsultationsPage() {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <PacienteLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Minhas Consultas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Histórico e próximas consultas agendadas
          </p>
        </div>

        <Tabs defaultValue="proximas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="proximas" data-testid="tab-proximas">
              Próximas ({DEMO_CONSULTAS_PROXIMAS.length})
            </TabsTrigger>
            <TabsTrigger value="passadas" data-testid="tab-passadas">
              Passadas ({DEMO_CONSULTAS_PASSADAS.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="mt-6 space-y-4">
            {DEMO_CONSULTAS_PROXIMAS.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Você não tem consultas agendadas
                  </p>
                </CardContent>
              </Card>
            ) : (
              DEMO_CONSULTAS_PROXIMAS.map((consulta) => (
                <Card key={consulta.id} data-testid={`card-consulta-${consulta.id}`}>
                  <CardContent className="py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <UserCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            {consulta.medico}
                          </h3>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">
                            {consulta.specialty}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(consulta.data)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {consulta.horario}
                            </span>
                          </div>
                          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                            {consulta.tipo}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full font-medium">
                          Confirmada
                        </span>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" data-testid={`button-details-${consulta.id}`}>
                            Detalhes
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" data-testid={`button-enter-${consulta.id}`}>
                            <Video className="h-4 w-4 mr-1" />
                            Entrar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="passadas" className="mt-6 space-y-4">
            {DEMO_CONSULTAS_PASSADAS.map((consulta) => (
              <Card key={consulta.id} data-testid={`card-consulta-passada-${consulta.id}`}>
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <UserCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {consulta.medico}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {consulta.specialty}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(consulta.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {consulta.horario}
                          </span>
                        </div>
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded">
                          {consulta.tipo}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Concluída
                      </span>
                      <div className="flex gap-2 mt-3">
                        {consulta.temReceita && (
                          <Button size="sm" variant="outline" className="text-xs" data-testid={`button-receita-${consulta.id}`}>
                            <FileText className="h-3 w-3 mr-1" />
                            Receita
                          </Button>
                        )}
                        {consulta.temAtestado && (
                          <Button size="sm" variant="outline" className="text-xs" data-testid={`button-atestado-${consulta.id}`}>
                            <FileText className="h-3 w-3 mr-1" />
                            Atestado
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </PacienteLayout>
  );
}
