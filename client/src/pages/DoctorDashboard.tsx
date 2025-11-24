import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, DollarSign, Clock, TrendingDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Consultation {
  id: number;
  consultationType: string;
  isMarketplace: boolean;
  status: string;
  patientOffer: string | null;
  agreedPrice: string | null;
  chiefComplaint: string;
  scheduledFor: string | null;
  createdAt: string;
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bidForms, setBidForms] = useState<Record<number, { amount: string; message: string }>>({});

  const { data: marketplaceConsultations, isLoading: isLoadingMarketplace } = useQuery<Consultation[]>({
    queryKey: ['/api/consultorio/consultations/marketplace'],
  });

  const { data: myConsultations, isLoading: isLoadingMine } = useQuery<Consultation[]>({
    queryKey: ['/api/consultorio/consultations'],
  });

  const createBidMutation = useMutation({
    mutationFn: async ({ consultationId, bidAmount, message }: { consultationId: number; bidAmount: number; message: string }) => {
      return apiRequest('/api/consultorio/bids', {
        method: 'POST',
        body: JSON.stringify({ consultationId, bidAmount, message }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultorio/consultations/marketplace'] });
      toast({
        title: 'Lance enviado!',
        description: 'O paciente foi notificado',
      });
      setBidForms((prev) => {
        const newForms = { ...prev };
        delete newForms[variables.consultationId];
        return newForms;
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar lance',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  const handleBidSubmit = (consultationId: number) => {
    const form = bidForms[consultationId];
    if (!form || !form.amount) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Informe o valor do lance',
      });
      return;
    }

    createBidMutation.mutate({
      consultationId,
      bidAmount: parseFloat(form.amount),
      message: form.message,
    });
  };

  const statusLabels: Record<string, string> = {
    pending: 'Aguardando',
    doctor_matched: 'Confirmado',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard do Médico</h1>
            <p className="text-gray-600 dark:text-gray-400">Bem-vindo, {user?.fullName}</p>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            Sair
          </Button>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="marketplace" data-testid="tab-marketplace">
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="myconsultations" data-testid="tab-myconsultations">
              Minhas Consultas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Consultas Disponíveis no Marketplace
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Envie lances para as consultas que você pode atender
              </p>
            </div>

            {isLoadingMarketplace ? (
              <p className="text-center py-8">Carregando...</p>
            ) : marketplaceConsultations && marketplaceConsultations.length > 0 ? (
              <div className="grid gap-4">
                {marketplaceConsultations.map((consultation) => (
                  <Card key={consultation.id} data-testid={`card-marketplace-${consultation.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {consultation.consultationType.replace('_', ' ')}
                          </CardTitle>
                          <CardDescription className="mt-2">{consultation.chiefComplaint}</CardDescription>
                        </div>
                        {consultation.patientOffer && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Oferta do Paciente</p>
                            <p className="text-xl font-bold text-teal-600">
                              R$ {parseFloat(consultation.patientOffer).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(consultation.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Seu Lance (R$)</label>
                            <Input
                              type="number"
                              placeholder="120.00"
                              value={bidForms[consultation.id]?.amount || ''}
                              onChange={(e) => setBidForms({
                                ...bidForms,
                                [consultation.id]: {
                                  ...bidForms[consultation.id],
                                  amount: e.target.value,
                                },
                              })}
                              data-testid={`input-bid-amount-${consultation.id}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Mensagem (opcional)</label>
                            <Input
                              placeholder="Ex: Posso atendê-lo hoje às 15h"
                              value={bidForms[consultation.id]?.message || ''}
                              onChange={(e) => setBidForms({
                                ...bidForms,
                                [consultation.id]: {
                                  ...bidForms[consultation.id],
                                  message: e.target.value,
                                },
                              })}
                              data-testid={`input-bid-message-${consultation.id}`}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleBidSubmit(consultation.id)}
                          disabled={createBidMutation.isPending}
                          className="w-full"
                          data-testid={`button-submit-bid-${consultation.id}`}
                        >
                          <TrendingDown className="mr-2 h-4 w-4" />
                          {createBidMutation.isPending ? 'Enviando...' : 'Enviar Lance'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma consulta disponível no marketplace no momento
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="myconsultations" className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Consultas</h2>

            {isLoadingMine ? (
              <p className="text-center py-8">Carregando...</p>
            ) : myConsultations && myConsultations.length > 0 ? (
              <div className="grid gap-4">
                {myConsultations.map((consultation) => (
                  <Card key={consultation.id} data-testid={`card-consultation-${consultation.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {consultation.consultationType.replace('_', ' ')}
                          </CardTitle>
                          <CardDescription className="mt-2">{consultation.chiefComplaint}</CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          consultation.status === 'doctor_matched' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                          consultation.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                          consultation.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                        }`} data-testid={`status-${consultation.id}`}>
                          {statusLabels[consultation.status] || consultation.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {consultation.agreedPrice && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Preço Acordado</p>
                              <p className="font-semibold text-green-600">
                                R$ {parseFloat(consultation.agreedPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Data</p>
                            <p className="font-semibold">{new Date(consultation.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Você ainda não tem consultas confirmadas</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
