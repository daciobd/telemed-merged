import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Clock, MapPin, DollarSign, TrendingDown, Eye } from 'lucide-react';
import { Link } from 'wouter';
import { DEMO_MARKETPLACE, isDemo } from '@/demo/demoData';

interface MarketplaceConsultation {
  id: string;
  especialidade: string;
  inicio: string;
  duracaoMinutos: number;
  valorBase: number;
  cidade: string;
  origem: string;
  status: string;
  chiefComplaint?: string;
}

export default function Marketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [especialidadeFilter, setEspecialidadeFilter] = useState('all');
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [bidModal, setBidModal] = useState<{ consultationId: string; valorBase: number } | null>(null);
  const [bidAmount, setBidAmount] = useState('');

  const { data: consultationsAPI, isLoading: isLoadingAPI } = useQuery<MarketplaceConsultation[]>({
    queryKey: ['/api/consultorio/marketplace'],
    enabled: !isDemo,
  });

  const demoConsultations: MarketplaceConsultation[] = DEMO_MARKETPLACE.map((m, idx) => ({
    id: m.id,
    especialidade: idx % 2 === 0 ? 'Clínica Geral' : 'Psiquiatria',
    inicio: new Date(Date.now() + (idx + 1) * 86400000).toISOString(),
    duracaoMinutos: 30,
    valorBase: 150 + idx * 25,
    cidade: idx % 3 === 0 ? 'São Paulo, SP' : idx % 3 === 1 ? 'Rio de Janeiro, RJ' : 'Belo Horizonte, MG',
    origem: 'Marketplace',
    status: 'disponivel',
    chiefComplaint: m.motivo,
  }));

  const consultations = isDemo ? demoConsultations : consultationsAPI;
  const isLoading = isDemo ? false : isLoadingAPI;

  const createBidMutation = useMutation({
    mutationFn: async ({ consultationId, bidAmount }: { consultationId: string; bidAmount: number }) => {
      return apiRequest('/api/consultorio/lances', {
        method: 'POST',
        body: JSON.stringify({ consultationId, bidAmount }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultorio/marketplace'] });
      toast({
        title: 'Lance enviado!',
        description: 'O paciente será notificado do seu lance.',
      });
      setBidModal(null);
      setBidAmount('');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar lance',
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    },
  });

  const handleSubmitBid = () => {
    if (!bidModal || !bidAmount) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Informe o valor do lance',
      });
      return;
    }
    createBidMutation.mutate({
      consultationId: bidModal.consultationId,
      bidAmount: parseFloat(bidAmount),
    });
  };

  const especialidades = consultations
    ? [...new Set(consultations.map((c) => c.especialidade))]
    : [];

  const filteredConsultations = consultations?.filter((c) => {
    if (especialidadeFilter !== 'all' && c.especialidade !== especialidadeFilter) return false;
    if (cidadeFilter && !c.cidade.toLowerCase().includes(cidadeFilter.toLowerCase())) return false;
    return true;
  });

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

  return (
    <ConsultorioLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-teal-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Marketplace
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Consultas disponíveis para você atender
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Especialidade</label>
                <Select value={especialidadeFilter} onValueChange={setEspecialidadeFilter}>
                  <SelectTrigger data-testid="select-especialidade">
                    <SelectValue placeholder="Todas as especialidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as especialidades</SelectItem>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cidade/UF</label>
                <Input
                  placeholder="Ex: São Paulo"
                  value={cidadeFilter}
                  onChange={(e) => setCidadeFilter(e.target.value)}
                  data-testid="input-cidade"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredConsultations && filteredConsultations.length > 0 ? (
          <div className="grid gap-4">
            {filteredConsultations.map((consultation) => (
              <Card key={consultation.id} data-testid={`card-marketplace-${consultation.id}`}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-teal-700 dark:text-teal-400">
                        {consultation.especialidade} – {consultation.duracaoMinutos} min
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {consultation.chiefComplaint || 'Consulta disponível no marketplace'}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Valor base</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {consultation.valorBase.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Data: {formatDate(consultation.inicio)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{consultation.cidade}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Origem: {consultation.origem}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/marketplace/${consultation.id}`}>
                      <Button variant="outline" className="w-full sm:w-auto" data-testid={`button-details-${consultation.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => {
                        setBidModal({ consultationId: consultation.id, valorBase: consultation.valorBase });
                        setBidAmount(consultation.valorBase.toString());
                      }}
                      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                      data-testid={`button-bid-${consultation.id}`}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Enviar lance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Nenhuma consulta disponível no marketplace no momento
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Novas consultas aparecem quando pacientes solicitam atendimento
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {bidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Enviar Lance</CardTitle>
              <CardDescription>
                Informe o valor que deseja cobrar pela consulta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do lance (R$)</label>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder={bidModal.valorBase.toString()}
                  data-testid="input-modal-bid"
                />
                <p className="text-xs text-gray-500">
                  Valor base sugerido: R$ {bidModal.valorBase.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setBidModal(null)}
                  className="flex-1"
                  data-testid="button-cancel-bid"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitBid}
                  disabled={createBidMutation.isPending}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  data-testid="button-confirm-bid"
                >
                  {createBidMutation.isPending ? 'Enviando...' : 'Confirmar lance'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ConsultorioLayout>
  );
}
