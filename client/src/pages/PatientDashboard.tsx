import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import PatientOnboardingCard from '@/components/PatientOnboardingCard';
import PacienteLayout from '@/components/PacienteLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  FileText, 
  Clock, 
  Calendar,
  Search,
  Heart,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Star,
  UserCircle,
  MessageSquare
} from 'lucide-react';
import { 
  isDemo, 
  DEMO_DOCTORS, 
  DEMO_PATIENT_PEDIDOS 
} from '@/demo/demoData';

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
  const { user } = useAuth();
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

  const metrics = useMemo(() => {
    if (!consultations) return { next: null, scheduled: 0, pending: 0, completed: 0 };
    
    const now = new Date();
    const upcoming = consultations.filter(c => 
      c.scheduledFor && new Date(c.scheduledFor) > now && 
      ['pending', 'doctor_matched', 'in_progress'].includes(c.status)
    ).sort((a, b) => 
      new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime()
    );
    
    return {
      next: upcoming[0] || null,
      scheduled: upcoming.length,
      pending: consultations.filter(c => c.status === 'pending' && c.isMarketplace).length,
      completed: consultations.filter(c => c.status === 'completed').length,
    };
  }, [consultations]);

  const { upcomingConsultations, pastConsultations } = useMemo(() => {
    if (!consultations) return { upcomingConsultations: [], pastConsultations: [] };
    
    return {
      upcomingConsultations: consultations.filter(c => 
        ['pending', 'doctor_matched', 'in_progress'].includes(c.status)
      ),
      pastConsultations: consultations.filter(c => 
        ['completed', 'cancelled'].includes(c.status)
      ),
    };
  }, [consultations]);

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
      queryClient.invalidateQueries({ queryKey: ['/api/consultorio/bids/consultation', selectedConsultation] });
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

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    doctor_matched: { label: 'Médico Confirmado', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    completed: { label: 'Concluída', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <PacienteLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando...</span>
        </div>
      </PacienteLayout>
    );
  }

  return (
    <PacienteLayout>
      <div className="space-y-6">
        {/* Saudação */}
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white" data-testid="text-patient-greeting">
            Olá, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aqui está um resumo das suas consultas e pedidos no TeleMed.
          </p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-800" data-testid="card-next-appointment">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Próxima consulta</p>
              </div>
              {metrics.next ? (
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {metrics.next.scheduledFor ? formatDate(metrics.next.scheduledFor) : 'A definir'}
                  </p>
                  {metrics.next.scheduledFor && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      às {formatTime(metrics.next.scheduledFor)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma agendada</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800" data-testid="card-scheduled-count">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Consultas agendadas</p>
              </div>
              <p className="text-2xl font-semibold text-teal-700 dark:text-teal-400">
                {metrics.scheduled}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800" data-testid="card-pending-count">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Pedidos em andamento</p>
              </div>
              <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400">
                {metrics.pending}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800" data-testid="card-completed-count">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Consultas concluídas</p>
              </div>
              <p className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
                {metrics.completed}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bloco Educativo */}
        <PatientOnboardingCard />

        {/* Grid: Minhas Consultas + Meus Pedidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Minhas Consultas */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  Minhas Consultas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="proximas">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="proximas" data-testid="tab-upcoming">
                    Próximas ({upcomingConsultations.length})
                  </TabsTrigger>
                  <TabsTrigger value="passadas" data-testid="tab-past">
                    Passadas ({pastConsultations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="proximas" className="space-y-3 max-h-[400px] overflow-y-auto">
                  {upcomingConsultations.length > 0 ? (
                    upcomingConsultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        data-testid={`consultation-upcoming-${consultation.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {consultation.consultationType.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                              {consultation.chiefComplaint}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${statusLabels[consultation.status]?.color || 'bg-gray-100'}`}>
                                {statusLabels[consultation.status]?.label || consultation.status}
                              </span>
                              {consultation.scheduledFor && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(consultation.scheduledFor)}
                                </span>
                              )}
                            </div>
                          </div>
                          {consultation.status === 'pending' && consultation.isMarketplace && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedConsultation(
                                selectedConsultation === consultation.id ? null : consultation.id
                              )}
                              data-testid={`button-view-bids-${consultation.id}`}
                            >
                              Ver lances
                            </Button>
                          )}
                        </div>

                        {selectedConsultation === consultation.id && bids && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Lances recebidos:
                            </p>
                            {bids.length > 0 ? (
                              bids.map((bid) => (
                                <div
                                  key={bid.id}
                                  className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
                                  data-testid={`bid-${bid.id}`}
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      R$ {parseFloat(bid.bidAmount).toFixed(2)}
                                    </p>
                                    {bid.message && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {bid.message}
                                      </p>
                                    )}
                                  </div>
                                  {!bid.isAccepted ? (
                                    <Button
                                      size="sm"
                                      onClick={() => acceptBidMutation.mutate(bid.id)}
                                      disabled={acceptBidMutation.isPending}
                                      data-testid={`button-accept-bid-${bid.id}`}
                                    >
                                      Aceitar
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Aceito
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                                Nenhum lance ainda. Aguarde médicos responderem.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <AlertCircle className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma consulta agendada
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="passadas" className="space-y-3 max-h-[400px] overflow-y-auto">
                  {pastConsultations.length > 0 ? (
                    pastConsultations.map((consultation) => (
                      <div
                        key={consultation.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        data-testid={`consultation-past-${consultation.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {consultation.consultationType.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                              {consultation.chiefComplaint}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${statusLabels[consultation.status]?.color || 'bg-gray-100'}`}>
                                {statusLabels[consultation.status]?.label || consultation.status}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(consultation.createdAt)}
                              </span>
                            </div>
                          </div>
                          {consultation.agreedPrice && (
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              R$ {parseFloat(consultation.agreedPrice).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma consulta passada
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Nova Consulta / Pedido */}
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  {showNewConsultation ? 'Novo Pedido de Consulta' : 'Fazer Pedido'}
                </CardTitle>
                {!showNewConsultation && (
                  <Button
                    size="sm"
                    onClick={() => setShowNewConsultation(true)}
                    data-testid="button-new-consultation"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Pedido
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showNewConsultation ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo de Consulta
                    </label>
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Quanto você oferece? (R$)
                    </label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={formData.patientOffer}
                      onChange={(e) => setFormData({ ...formData, patientOffer: e.target.value })}
                      data-testid="input-patient-offer"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Motivo da Consulta
                    </label>
                    <Textarea
                      placeholder="Descreva seus sintomas ou motivo..."
                      value={formData.chiefComplaint}
                      onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                      rows={3}
                      data-testid="input-chief-complaint"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => createConsultationMutation.mutate(formData)}
                      disabled={createConsultationMutation.isPending || !formData.chiefComplaint}
                      className="flex-1"
                      data-testid="button-create-consultation"
                    >
                      {createConsultationMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Pedido'
                      )}
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
              ) : (
                <div className="text-center py-6">
                  <Search className="h-10 w-10 text-emerald-500/50 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Descreva o que precisa e receba ofertas de médicos disponíveis.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Você compara e escolhe o profissional que preferir.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Meus Médicos - Seção Demo */}
        {isDemo && (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Meus Médicos
                </CardTitle>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {DEMO_DOCTORS.length} profissionais
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {DEMO_DOCTORS.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-lg border border-blue-100 dark:border-gray-600"
                    data-testid={`card-doctor-${doctor.id}`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {doctor.specialty}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{doctor.rating}</span>
                        <span className="mx-1">•</span>
                        <span>{doctor.consultations} consultas</span>
                      </div>
                      <p>Última: {new Date(doctor.lastConsult).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/paciente/medicos/${doctor.id}`}>
                        <Button size="sm" variant="outline" className="flex-1 text-xs h-8" data-testid={`button-profile-${doctor.id}`}>
                          Ver perfil
                        </Button>
                      </Link>
                      <Link href={`/paciente/agendar/${doctor.id}`}>
                        <Button size="sm" className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700" data-testid={`button-schedule-${doctor.id}`}>
                          Agendar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meus Pedidos com Ofertas - Seção Demo */}
        {isDemo && DEMO_PATIENT_PEDIDOS.filter(p => p.status === 'em_andamento').length > 0 && (
          <Card className="bg-white dark:bg-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                Meus Pedidos em Andamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEMO_PATIENT_PEDIDOS.filter(p => p.status === 'em_andamento').map((pedido) => (
                <div
                  key={pedido.id}
                  className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800"
                  data-testid={`card-pedido-${pedido.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {pedido.motivo}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Enviado em {new Date(pedido.dataEnvio).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200 text-xs rounded-full font-medium">
                      {pedido.ofertas.length} ofertas
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pedido.ofertas.map((oferta) => (
                      <div
                        key={oferta.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {oferta.medico}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {oferta.specialty} • {oferta.mensagem}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            R$ {oferta.valor}
                          </span>
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                              toast({
                                title: 'Oferta aceita!',
                                description: `Modo demo: Consulta com ${oferta.medico} seria agendada aqui.`,
                              });
                            }}
                            data-testid={`button-accept-${oferta.id}`}
                          >
                            Aceitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Atalhos Rápidos */}
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
              Atalhos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowNewConsultation(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="shortcut-new-consultation"
                title="Clique aqui para descrever sua necessidade de atendimento. Médicos compatíveis poderão enviar ofertas (bids) com horário e valor, e você escolhe com quem quer se consultar."
              >
                <Plus className="h-4 w-4 mr-2" />
                Fazer novo pedido de consulta
              </Button>
              <Link href="/paciente/medicos">
                <Button variant="outline" data-testid="shortcut-doctors" title="Veja os médicos com quem você já se consultou e seus links diretos">
                  <Users className="h-4 w-4 mr-2" />
                  Ver meus médicos
                </Button>
              </Link>
              <Link href="/paciente/phr">
                <Button variant="outline" data-testid="shortcut-phr" title="Se você desejar, pode responder a perguntas guiadas pelo Dr. AI. Isso não substitui o médico, mas ajuda a organizar seus sintomas e histórico.">
                  <Heart className="h-4 w-4 mr-2" />
                  Atualizar meu registro de saúde
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PacienteLayout>
  );
}
