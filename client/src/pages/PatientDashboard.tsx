import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, DollarSign, Clock, User } from 'lucide-react';

interface Consultation {
  id: number;
  consultationType: string;
  isMarketplace: boolean;
  status: string;
  patientOffer: string | null;
  agreedPrice: string | null;
  platformFee: string | null;
  doctorEarnings: string | null;
  chiefComplaint: string;
  scheduledFor: string | null;
  createdAt: string;
}

interface Bid {
  id: number;
  doctorId: number;
  bidAmount: string;
  message: string | null;
  isAccepted: boolean;
  createdAt: string;
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    consultationType: 'primeira_consulta',
    isMarketplace: true,
    patientOffer: '',
    chiefComplaint: '',
  });

  const { data: consultations, isLoading } = useQuery<Consultation[]>({
    queryKey: ['/api/consultorio/consultations'],
  });

  const { data: bids } = useQuery<Bid[]>({
    queryKey: ['/api/consultorio/bids/consultation', selectedConsultation],
    enabled: !!selectedConsultation,
  });

  const createConsultationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/consultorio/consultations', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          patientOffer: data.patientOffer ? parseFloat(data.patientOffer) : null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultorio/consultations'] });
      toast({
        title: 'Consulta criada!',
        description: 'Sua consulta foi publicada no marketplace',
      });
      setShowNewConsultation(false);
      setFormData({
        consultationType: 'primeira_consulta',
        isMarketplace: true,
        patientOffer: '',
        chiefComplaint: '',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar consulta',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      return apiRequest(`/api/consultorio/bids/${bidId}/accept`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultorio/consultations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/consultorio/bids/consultation'] });
      toast({
        title: 'Lance aceito!',
        description: 'O médico foi notificado',
      });
      setSelectedConsultation(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao aceitar lance',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  const statusLabels: Record<string, string> = {
    pending: 'Aguardando',
    doctor_matched: 'Médico Confirmado',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard do Paciente</h1>
            <p className="text-gray-600 dark:text-gray-400">Bem-vindo, {user?.fullName}</p>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            Sair
          </Button>
        </div>

        <div className="mb-6">
          <Button
            onClick={() => setShowNewConsultation(!showNewConsultation)}
            data-testid="button-new-consultation"
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Consulta
          </Button>
        </div>

        {showNewConsultation && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Nova Consulta</CardTitle>
              <CardDescription>Preencha os dados para criar sua consulta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Consulta</label>
                  <Select
                    value={formData.consultationType}
                    onValueChange={(value) => setFormData({ ...formData, consultationType: value })}
                  >
                    <SelectTrigger data-testid="select-consultation-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                      <SelectItem value="retorno">Retorno</SelectItem>
                      <SelectItem value="urgencia">Urgência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quanto você oferece? (R$)</label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={formData.patientOffer}
                    onChange={(e) => setFormData({ ...formData, patientOffer: e.target.value })}
                    data-testid="input-patient-offer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo da Consulta</label>
                  <Textarea
                    placeholder="Descreva seus sintomas..."
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    data-testid="input-chief-complaint"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => createConsultationMutation.mutate(formData)}
                    disabled={createConsultationMutation.isPending || !formData.chiefComplaint}
                    data-testid="button-create-consultation"
                    className="flex-1"
                  >
                    {createConsultationMutation.isPending ? 'Criando...' : 'Criar Consulta'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewConsultation(false)}
                    data-testid="button-cancel-consultation"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Minhas Consultas</h2>
          {consultations && consultations.length > 0 ? (
            consultations.map((consultation) => (
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
                      consultation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                      consultation.status === 'doctor_matched' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                    }`} data-testid={`status-${consultation.id}`}>
                      {statusLabels[consultation.status] || consultation.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {consultation.patientOffer && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sua Oferta</p>
                          <p className="font-semibold">R$ {parseFloat(consultation.patientOffer).toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                    {consultation.agreedPrice && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Preço Acordado</p>
                          <p className="font-semibold text-green-600">R$ {parseFloat(consultation.agreedPrice).toFixed(2)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Criado em</p>
                        <p className="font-semibold">{new Date(consultation.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {consultation.status === 'pending' && consultation.isMarketplace && (
                    <Button
                      onClick={() => setSelectedConsultation(
                        selectedConsultation === consultation.id ? null : consultation.id
                      )}
                      variant="outline"
                      className="w-full"
                      data-testid={`button-view-bids-${consultation.id}`}
                    >
                      {selectedConsultation === consultation.id ? 'Ocultar' : 'Ver'} Lances
                    </Button>
                  )}

                  {selectedConsultation === consultation.id && bids && (
                    <div className="mt-4 space-y-2">
                      <h3 className="font-semibold text-sm">Lances Recebidos:</h3>
                      {bids.length > 0 ? (
                        bids.map((bid) => (
                          <div
                            key={bid.id}
                            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            data-testid={`bid-${bid.id}`}
                          >
                            <div>
                              <p className="font-semibold text-green-600">R$ {parseFloat(bid.bidAmount).toFixed(2)}</p>
                              {bid.message && <p className="text-sm text-gray-600 dark:text-gray-400">{bid.message}</p>}
                            </div>
                            {!bid.isAccepted && (
                              <Button
                                size="sm"
                                onClick={() => acceptBidMutation.mutate(bid.id)}
                                disabled={acceptBidMutation.isPending}
                                data-testid={`button-accept-bid-${bid.id}`}
                              >
                                Aceitar
                              </Button>
                            )}
                            {bid.isAccepted && (
                              <span className="text-sm text-green-600 font-semibold">✓ Aceito</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum lance ainda</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Você ainda não tem consultas</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
