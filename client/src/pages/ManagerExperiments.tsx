import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical, TrendingUp, Users, DollarSign, RefreshCw, Plus, Trash2, Eye, Crown } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ""}`} />;
}

interface Experiment {
  id: string;
  is_active: boolean;
  traffic_percent: number;
  variants: Array<{ name: string; weight: number }>;
  created_at: string;
  updated_at: string;
}

interface AbVariant {
  variant: string;
  landingSessions: number;
  bookingSessions: number;
  signedSessions: number;
  cvr: string;
  gmv: number;
  platformFee: number;
  gmvPerSession: number;
  feePerSession: number;
}

interface AbData {
  experiment: string;
  range: { from: string | null; to: string | null };
  variants: AbVariant[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function ExperimentCard({ exp, onToggle, onViewResults }: { exp: Experiment; onToggle: (active: boolean) => void; onViewResults: () => void }) {
  return (
    <Card className={`${!exp.is_active ? "opacity-60" : ""}`} data-testid={`experiment-card-${exp.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-purple-500" />
            {exp.id}
          </CardTitle>
          <Button 
            variant={exp.is_active ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(!exp.is_active)}
            data-testid={`toggle-${exp.id}`}
          >
            {exp.is_active ? "Ativo" : "Inativo"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Users className="h-4 w-4" />
          <span>Tráfego: {exp.traffic_percent}%</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {exp.variants.map((v, i) => (
            <span 
              key={i} 
              className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              {v.name}: {v.weight}%
            </span>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onViewResults} data-testid={`button-view-${exp.id}`}>
          <Eye className="h-4 w-4 mr-2" />
          Ver Resultados
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateExperimentForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [id, setId] = useState("");
  const [trafficPercent, setTrafficPercent] = useState("100");
  const [variantA, setVariantA] = useState("50");
  const [variantB, setVariantB] = useState("50");

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Erro ao criar experimento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experiments"] });
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      id,
      traffic_percent: parseInt(trafficPercent),
      variants: [
        { name: "A", weight: parseInt(variantA) },
        { name: "B", weight: parseInt(variantB) }
      ],
      is_active: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>ID do Experimento</Label>
        <Input 
          value={id} 
          onChange={e => setId(e.target.value)} 
          placeholder="Ex: landing_headline_v1"
          data-testid="input-experiment-id"
        />
      </div>
      <div>
        <Label>Tráfego (%)</Label>
        <Input 
          type="number" 
          min="0" 
          max="100" 
          value={trafficPercent} 
          onChange={e => setTrafficPercent(e.target.value)}
          data-testid="input-traffic"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Peso Variante A (%)</Label>
          <Input 
            type="number" 
            min="0" 
            max="100" 
            value={variantA} 
            onChange={e => setVariantA(e.target.value)}
            data-testid="input-variant-a"
          />
        </div>
        <div>
          <Label>Peso Variante B (%)</Label>
          <Input 
            type="number" 
            min="0" 
            max="100" 
            value={variantB} 
            onChange={e => setVariantB(e.target.value)}
            data-testid="input-variant-b"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.isPending || !id} data-testid="button-create">
          {mutation.isPending ? "Criando..." : "Criar Experimento"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function AbResultsPanel({ experimentId, onClose }: { experimentId: string; onClose: () => void }) {
  const [period, setPeriod] = useState("30d");

  const fromDate = period === "7d" 
    ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data, isLoading } = useQuery<AbData>({
    queryKey: ["/api/experiments/ab", experimentId, period],
    queryFn: async () => {
      const res = await fetch(`/api/experiments/ab?experiment=${experimentId}&from=${fromDate}`);
      if (!res.ok) throw new Error("Erro ao carregar resultados");
      return res.json();
    },
  });

  const variants = data?.variants || [];
  const winner = variants.length > 1 
    ? variants.reduce((best, v) => parseFloat(v.cvr) > parseFloat(best.cvr) ? v : best, variants[0])
    : null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-500" />
            Resultados: {experimentId}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[100px]" data-testid="select-ab-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-results">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : variants.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum dado ainda. Aguarde eventos com esse experimento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Variante</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Sessões</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Bookings</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">CVR</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">GMV</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Fee/Sessão</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-gray-100 dark:border-gray-800 ${winner?.variant === v.variant ? "bg-green-50 dark:bg-green-900/20" : ""}`}
                    data-testid={`ab-row-${v.variant}`}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {v.variant}
                      {winner?.variant === v.variant && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{v.landingSessions}</td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{v.bookingSessions}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className={parseFloat(v.cvr) > 5 ? "text-green-600" : "text-amber-600"}>
                        {v.cvr}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(v.gmv)}</td>
                    <td className="py-3 px-4 text-right text-teal-600 font-medium">{formatCurrency(v.feePerSession)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ManagerExperiments() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewingResults, setViewingResults] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{ ok: boolean; experiments: Experiment[] }>({
    queryKey: ["/api/experiments"],
    queryFn: async () => {
      const res = await fetch("/api/experiments");
      if (!res.ok) throw new Error("Erro ao carregar experimentos");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/experiments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active })
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experiments"] });
    }
  });

  const experiments = data?.experiments || [];
  const activeCount = experiments.filter(e => e.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="page-manager-experiments">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="title-experiments">
              Experimentos A/B
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Teste variantes de landing, oferta e preço
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowCreate(!showCreate)} data-testid="button-new">
              <Plus className="h-4 w-4 mr-2" />
              Novo Experimento
            </Button>

            <Button variant="outline" size="icon" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Criar Experimento</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateExperimentForm onClose={() => setShowCreate(false)} />
            </CardContent>
          </Card>
        )}

        {viewingResults && (
          <AbResultsPanel experimentId={viewingResults} onClose={() => setViewingResults(null)} />
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="card-total">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FlaskConical className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{experiments.length}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Ativos</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-inactive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Inativos</span>
              </div>
              <p className="text-2xl font-bold text-gray-500">{experiments.length - activeCount}</p>
            </CardContent>
          </Card>

          <Card data-testid="card-hint">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-teal-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Dica</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Teste headlines e preços para aumentar conversão
              </p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : experiments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Nenhum experimento ainda</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Crie seu primeiro experimento A/B para testar variantes.
              </p>
              <Button className="mt-4" onClick={() => setShowCreate(true)} data-testid="button-create-first">
                <Plus className="h-4 w-4 mr-2" />
                Criar Experimento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {experiments.map((exp) => (
              <ExperimentCard 
                key={exp.id} 
                exp={exp} 
                onToggle={(active) => toggleMutation.mutate({ id: exp.id, is_active: active })}
                onViewResults={() => setViewingResults(exp.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
