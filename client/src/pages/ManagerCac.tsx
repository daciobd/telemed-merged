import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Upload, Target } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ""}`} />;
}

interface CacRow {
  provider: string;
  campaign: string;
  spend: number;
  consultasAssinadas: number;
  receitaPlataforma: number;
  cac: number | null;
  cacPercentual: number | null;
}

interface CacData {
  range: { from: string | null; to: string | null };
  groupBy: string;
  summary: {
    totalSpend: number;
    totalConsultas: number;
    totalReceita: number;
    avgCac: number | null;
    avgCacPercent: number | null;
  };
  rows: CacRow[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "-";
  return (value * 100).toFixed(1) + "%";
}

function CacTable({ rows }: { rows: CacRow[] }) {
  return (
    <div className="overflow-x-auto" data-testid="cac-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Campanha</th>
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Canal</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Gasto</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Consultas</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Receita</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">CAC</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">CAC %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const isHighCac = row.cacPercentual !== null && row.cacPercentual > 0.6;
            const isNoConversion = row.spend > 0 && row.consultasAssinadas === 0;

            return (
              <tr 
                key={idx} 
                className={`border-b border-gray-100 dark:border-gray-800 ${isHighCac || isNoConversion ? "bg-red-50 dark:bg-red-900/20" : ""}`}
                data-testid={`cac-row-${idx}`}
              >
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                  {row.campaign}
                  {isNoConversion && (
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400" data-testid="alert-no-conversion">
                      <AlertTriangle className="h-3 w-3 inline" /> Sem conversão
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-300 capitalize">{row.provider}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(row.spend)}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{row.consultasAssinadas}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{formatCurrency(row.receitaPlataforma)}</td>
                <td className="py-3 px-4 text-right font-medium">
                  <span className={row.cac !== null && row.cac > 100 ? "text-amber-600" : "text-gray-900 dark:text-white"}>
                    {row.cac !== null ? formatCurrency(row.cac) : "-"}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-medium">
                  <span className={isHighCac ? "text-red-600" : "text-green-600"}>
                    {formatPercent(row.cacPercentual)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ImportSpendForm() {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState("google");
  const [campaignName, setCampaignName] = useState("");
  const [spend, setSpend] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/metrics/v2/marketing/ads/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Erro ao importar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/metrics/v2/marketing/cac-real"] });
      setSpend("");
      setCampaignName("");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      provider,
      account_id: "manual",
      campaign_name: campaignName,
      spend: parseFloat(spend),
      date
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Canal</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger data-testid="select-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google Ads</SelectItem>
              <SelectItem value="meta">Meta Ads</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Data</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} data-testid="input-date" />
        </div>
      </div>
      <div>
        <Label>Nome da Campanha</Label>
        <Input 
          value={campaignName} 
          onChange={e => setCampaignName(e.target.value)} 
          placeholder="Ex: Psiquiatria Urgente"
          data-testid="input-campaign"
        />
      </div>
      <div>
        <Label>Gasto (R$)</Label>
        <Input 
          type="number" 
          step="0.01" 
          value={spend} 
          onChange={e => setSpend(e.target.value)} 
          placeholder="0.00"
          data-testid="input-spend"
        />
      </div>
      <Button type="submit" disabled={mutation.isPending || !spend || !campaignName} data-testid="button-import">
        <Upload className="h-4 w-4 mr-2" />
        {mutation.isPending ? "Importando..." : "Importar Gasto"}
      </Button>
    </form>
  );
}

export default function ManagerCac() {
  const [period, setPeriod] = useState<string>("30d");
  const [showImport, setShowImport] = useState(false);

  const fromDate = period === "7d" 
    ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : period === "90d"
    ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data, isLoading, refetch } = useQuery<CacData>({
    queryKey: ["/metrics/v2/marketing/cac-real", period],
    queryFn: async () => {
      const res = await fetch(`/metrics/v2/marketing/cac-real?from=${fromDate}`);
      if (!res.ok) throw new Error("Erro ao carregar CAC");
      return res.json();
    },
  });

  const summary = data?.summary;
  const rows = data?.rows || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="page-manager-cac">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="title-cac">
              CAC Real (Ads)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Custo de Aquisição por campanha baseado em gastos reais
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[120px]" data-testid="select-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">90 dias</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setShowImport(!showImport)} data-testid="button-toggle-import">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>

            <Button variant="outline" size="icon" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showImport && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Importar Gasto Manual</CardTitle>
            </CardHeader>
            <CardContent>
              <ImportSpendForm />
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white" data-testid="card-spend">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs opacity-80">Gasto Total</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(summary?.totalSpend || 0)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white" data-testid="card-consultas">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4" />
                    <span className="text-xs opacity-80">Consultas Assinadas</span>
                  </div>
                  <p className="text-xl font-bold">{summary?.totalConsultas || 0}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white" data-testid="card-receita">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs opacity-80">Receita Plataforma</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(summary?.totalReceita || 0)}</p>
                </CardContent>
              </Card>

              <Card className={`text-white ${summary?.avgCac && summary.avgCac > 100 ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-teal-500 to-teal-600"}`} data-testid="card-cac">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs opacity-80">CAC Médio</span>
                  </div>
                  <p className="text-xl font-bold">
                    {summary?.avgCac !== null ? formatCurrency(summary?.avgCac || 0) : "-"}
                  </p>
                </CardContent>
              </Card>

              <Card className={`text-white ${summary?.avgCacPercent && summary.avgCacPercent > 0.6 ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-blue-500 to-blue-600"}`} data-testid="card-cac-percent">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {summary?.avgCacPercent && summary.avgCacPercent > 0.6 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    <span className="text-xs opacity-80">CAC % Receita</span>
                  </div>
                  <p className="text-xl font-bold">{formatPercent(summary?.avgCacPercent || null)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CAC por Campanha</CardTitle>
              </CardHeader>
              <CardContent>
                {rows.length > 0 ? (
                  <CacTable rows={rows} />
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum dado de gasto no período</p>
                    <p className="text-sm mt-2">Importe gastos das suas campanhas para calcular o CAC real.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowImport(true)} data-testid="button-import-empty">
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Gasto
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {(summary?.avgCacPercent && summary.avgCacPercent > 0.6) || rows.some(r => r.spend > 100 && r.consultasAssinadas === 0) ? (
              <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <CardHeader>
                  <CardTitle className="text-lg text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas de CAC
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summary?.avgCacPercent && summary.avgCacPercent > 0.6 && (
                    <div className="flex items-start gap-2 text-red-700 dark:text-red-300" data-testid="alert-high-cac">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>CAC está acima de 60% da receita. Considere pausar campanhas menos eficientes.</span>
                    </div>
                  )}
                  {rows.filter(r => r.spend > 100 && r.consultasAssinadas === 0).map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-amber-700 dark:text-amber-300" data-testid={`alert-campaign-${i}`}>
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Campanha "{r.campaign}" gastou {formatCurrency(r.spend)} sem conversões.</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
