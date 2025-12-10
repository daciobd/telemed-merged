import { useState } from 'react';
import PacienteLayout from '@/components/PacienteLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  UserCircle, 
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { DEMO_PATIENT_PEDIDOS } from '@/demo/demoData';

export default function PatientRequestsPage() {
  const { toast } = useToast();
  const [acceptedOffers, setAcceptedOffers] = useState<string[]>([]);

  const handleAccept = (offerId: string, medicoName: string) => {
    setAcceptedOffers(prev => [...prev, offerId]);
    toast({
      title: 'Oferta aceita!',
      description: `Modo demo: Consulta com ${medicoName} seria agendada aqui.`,
    });
  };

  const pedidosEmAndamento = DEMO_PATIENT_PEDIDOS.filter(p => p.status === 'em_andamento');
  const pedidosAntigos = DEMO_PATIENT_PEDIDOS.filter(p => p.status !== 'em_andamento');

  return (
    <PacienteLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Meus Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Acompanhe suas solicitações de consulta no marketplace
          </p>
        </div>

        <Tabs defaultValue="andamento" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="andamento" data-testid="tab-andamento">
              Em Andamento ({pedidosEmAndamento.length})
            </TabsTrigger>
            <TabsTrigger value="antigos" data-testid="tab-antigos">
              Finalizados ({pedidosAntigos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="andamento" className="mt-6 space-y-4">
            {pedidosEmAndamento.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Você não tem pedidos em andamento
                  </p>
                </CardContent>
              </Card>
            ) : (
              pedidosEmAndamento.map((pedido) => (
                <Card key={pedido.id} data-testid={`card-pedido-${pedido.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{pedido.motivo}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Enviado em {new Date(pedido.dataEnvio).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded-full font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Aguardando
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {pedido.ofertas.length} médico(s) enviaram ofertas:
                    </p>
                    <div className="space-y-3">
                      {pedido.ofertas.map((oferta) => {
                        const isAccepted = acceptedOffers.includes(oferta.id);
                        return (
                          <div
                            key={oferta.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              isAccepted 
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            }`}
                            data-testid={`oferta-${oferta.id}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <UserCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {oferta.medico}
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                  {oferta.specialty}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {oferta.mensagem}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                  R$ {oferta.valor}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Consulta online
                                </p>
                              </div>
                              {isAccepted ? (
                                <span className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Aceito
                                </span>
                              ) : (
                                <Button 
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleAccept(oferta.id, oferta.medico)}
                                  data-testid={`button-accept-${oferta.id}`}
                                >
                                  Aceitar
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="antigos" className="mt-6 space-y-4">
            {pedidosAntigos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhum pedido finalizado ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              pedidosAntigos.map((pedido) => (
                <Card key={pedido.id} className="opacity-75" data-testid={`card-pedido-antigo-${pedido.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{pedido.motivo}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(pedido.dataEnvio).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        pedido.status === 'concluido' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {pedido.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PacienteLayout>
  );
}
