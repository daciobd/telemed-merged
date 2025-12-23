import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ConsultorioLayout from '@/components/ConsultorioLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Clock, User, Video, Eye, Calendar, Plus, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { DEMO_PATIENTS, isDemo } from '@/demo/demoData';
import { useToast } from '@/hooks/use-toast';

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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    paciente_nome: '',
    paciente_cpf: '',
    paciente_telefone: '',
    datahora: '',
    tipo: 'primeira_consulta' as string,
  });

  const { data: consultationsAPI, isLoading: isLoadingAPI } = useQuery<Consultation[]>({
    queryKey: ['/api/consultorio/minhas-consultas'],
    enabled: !isDemo,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const token = localStorage.getItem('consultorio_token');
      const r = await fetch('/api/consultorio/consultations/doctor-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar consulta');
      }
      return r.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Consulta criada!', description: `Consulta com ${data.paciente_nome} criada.` });
      setDialogOpen(false);
      setFormData({ paciente_nome: '', paciente_cpf: '', paciente_telefone: '', datahora: '', tipo: 'primeira_consulta' });
      queryClient.invalidateQueries({ queryKey: ['/api/consultorio/minhas-consultas'] });
      if (data.consulta_id) {
        navigate(`/consultas/${data.consulta_id}`);
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paciente_nome.trim()) {
      toast({ title: 'Atenção', description: 'Nome do paciente é obrigatório', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const now = new Date();

  const demoConsultations: Consultation[] = [
    ...DEMO_PATIENTS.slice(0, 3).map((p, idx) => ({
      id: `demo-next-${idx}`,
      paciente: p.name,
      especialidade: 'Clínica Geral',
      dataHora: new Date(Date.now() + (idx + 1) * 86400000).toISOString(),
      duracao: 30,
      status: 'agendada' as const,
      valorAcordado: 200,
    })),
    ...DEMO_PATIENTS.slice(3, 8).map((p, idx) => ({
      id: `demo-past-${idx}`,
      paciente: p.name,
      especialidade: idx % 2 === 0 ? 'Clínica Geral' : 'Psiquiatria',
      dataHora: new Date(Date.now() - (idx + 1) * 86400000 * 2).toISOString(),
      duracao: 30,
      status: 'concluida' as const,
      valorAcordado: 180 + idx * 20,
    })),
  ];

  const consultations = isDemo ? demoConsultations : consultationsAPI;
  const isLoading = isDemo ? false : isLoadingAPI;
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
        <div className="flex items-center justify-between gap-3">
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

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700" data-testid="button-nova-consulta">
                <Plus className="h-4 w-4 mr-2" />
                Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Consulta</DialogTitle>
                <DialogDescription>
                  Preencha os dados do paciente para criar uma nova consulta.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente_nome">Nome do Paciente *</Label>
                  <Input
                    id="paciente_nome"
                    placeholder="Nome completo"
                    value={formData.paciente_nome}
                    onChange={(e) => setFormData({ ...formData, paciente_nome: e.target.value })}
                    data-testid="input-paciente-nome"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paciente_cpf">CPF (opcional)</Label>
                    <Input
                      id="paciente_cpf"
                      placeholder="00000000000"
                      maxLength={11}
                      value={formData.paciente_cpf}
                      onChange={(e) => setFormData({ ...formData, paciente_cpf: e.target.value.replace(/\D/g, '') })}
                      data-testid="input-paciente-cpf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paciente_telefone">Telefone (opcional)</Label>
                    <Input
                      id="paciente_telefone"
                      placeholder="(11) 99999-9999"
                      value={formData.paciente_telefone}
                      onChange={(e) => setFormData({ ...formData, paciente_telefone: e.target.value })}
                      data-testid="input-paciente-telefone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Consulta</Label>
                  <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger data-testid="select-tipo">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primeira_consulta">Primeira Consulta</SelectItem>
                      <SelectItem value="retorno">Retorno</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="check_up">Check-up</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="presencial">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datahora">Data/Hora (opcional)</Label>
                  <Input
                    id="datahora"
                    type="datetime-local"
                    value={formData.datahora}
                    onChange={(e) => setFormData({ ...formData, datahora: e.target.value })}
                    data-testid="input-datahora"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancelar">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={createMutation.isPending}
                    data-testid="button-criar-consulta"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Consulta'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
