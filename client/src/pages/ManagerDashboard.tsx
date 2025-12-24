import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, CheckCircle, PenTool, RefreshCw, 
  Clock, TrendingUp, Shield, AlertTriangle, Users,
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink
} from "lucide-react";
import { useLocation } from "wouter";

type FunnelData = {
  criados: number;
  finalizados: number;
  assinados: number;
  taxaFinalizacao: number;
  taxaAssinatura: number;
};

type TemposData = {
  tempoMedioAteFinalizarMin: number | null;
  tempoMedioAteAssinarMin: number | null;
};

type PendenciasData = {
  finalizadosSemAssinatura: number;
  atencao?: number; // >= 1h parado
  critico?: number; // >= 4h parado
};

type MetricsV2 = {
  ok: boolean;
  range: { days: number; since: string };
  funnel: FunnelData;
  tempos: TemposData;
  pendencias: PendenciasData;
  notas?: { assinadosUsaProxy?: boolean };
  error?: string;
};

type DoctorMetrics = {
  medicoId: string;
  medicoNome: string;
  medicoEmail: string;
  total: number;
  finalizados: number;
  rascunhos: number;
  assinados: number;
  finalizadosSemAssinatura: number;
  taxaFinalizacao: number;
};

type DoctorsData = {
  ok: boolean;
  range: { days: number; since: string };
  doctors: DoctorMetrics[];
  total: number;
  error?: string;
};

type SortKey = "total" | "finalizados" | "rascunhos" | "assinados" | "taxaFinalizacao" | "pendencias";

function getTaxaColor(taxa: number): string {
  if (taxa >= 85) return "text-green-600";
  if (taxa >= 70) return "text-yellow-600";
  return "text-red-600";
}

function getTaxaBg(taxa: number): string {
  if (taxa >= 85) return "bg-green-50 dark:bg-green-900/20 border-green-200";
  if (taxa >= 70) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200";
  return "bg-red-50 dark:bg-red-900/20 border-red-200";
}

function getBadgeClass(taxa: number): string {
  if (taxa >= 85) return "bg-green-100 text-green-800 border-green-200";
  if (taxa >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function formatMinutes(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  const rounded = Math.round(v);
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return `${h}h ${m}m`;
}

export default function ManagerDashboard() {
  const [, setLocation] = useLocation();
  const [metrics, setMetrics] = useState<MetricsV2 | null>(null);
  const [doctors, setDoctors] = useState<DoctorsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [days, setDays] = useState(7);
  
  // Ordenação e filtros
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [onlyWithPendencies, setOnlyWithPendencies] = useState(false);

  const fetchData = async (selectedDays: number) => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const token = localStorage.getItem("consultorio_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [metricsRes, doctorsRes] = await Promise.all([
        fetch(`/api/manager/metrics/v2?days=${selectedDays}`, { credentials: "include", headers }),
        fetch(`/api/manager/metrics/v2/doctors?days=${selectedDays}`, { credentials: "include", headers }),
      ]);

      if (metricsRes.status === 403 || metricsRes.status === 401) {
        setAccessDenied(true);
        return;
      }

      const metricsData = await metricsRes.json();
      const doctorsData = await doctorsRes.json();

      setMetrics(metricsData);
      setDoctors(doctorsData);
    } catch (e: any) {
      setMetrics({ ok: false, error: e?.message } as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  // Ordenação da tabela de médicos
  const sortedDoctors = useMemo(() => {
    const list = doctors?.doctors ? [...doctors.doctors] : [];
    
    const filtered = onlyWithPendencies
      ? list.filter((r) => r.finalizadosSemAssinatura > 0)
      : list;

    filtered.sort((a, b) => {
      let av: number, bv: number;
      
      if (sortKey === "pendencias") {
        av = a.finalizadosSemAssinatura;
        bv = b.finalizadosSemAssinatura;
      } else {
        av = (a as any)[sortKey] ?? 0;
        bv = (b as any)[sortKey] ?? 0;
      }

      const diff = bv - av;
      return sortDir === "desc" ? diff : -diff;
    });

    return filtered;
  }, [doctors, sortKey, sortDir, onlyWithPendencies]);

  const onSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === "desc" 
      ? <ArrowDown className="w-3 h-3 ml-1" /> 
      : <ArrowUp className="w-3 h-3 ml-1" />;
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600 dark:text-red-300 space-y-3">
            <p>Esta página é restrita a gerentes e administradores.</p>
            <p className="text-xs text-red-500">
              Se você deveria ter acesso, entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const funnel = metrics?.funnel || { criados: 0, finalizados: 0, assinados: 0, taxaFinalizacao: 0, taxaAssinatura: 0 };
  const tempos = metrics?.tempos || { tempoMedioAteFinalizarMin: null, tempoMedioAteAssinarMin: null };
  const pendencias = metrics?.pendencias || { finalizadosSemAssinatura: 0 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white" data-testid="title-manager-dashboard">
            Manager Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Painel de comando operacional • Últimos {days} dias
            {metrics?.range?.since && (
              <span> • Desde {new Date(metrics.range.since).toLocaleDateString("pt-BR")}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/manager/marketplace")}
            data-testid="button-marketplace"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Marketplace
          </Button>
          <div className="inline-flex rounded-lg border overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                days === 7 
                  ? "bg-teal-600 text-white" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setDays(7)}
              disabled={loading}
              data-testid="button-7days"
            >
              7 dias
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                days === 30 
                  ? "bg-teal-600 text-white" 
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setDays(30)}
              disabled={loading}
              data-testid="button-30days"
            >
              30 dias
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(days)}
            disabled={loading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {!metrics ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-500">Carregando...</CardContent>
        </Card>
      ) : !metrics.ok ? (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Erro</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600 dark:text-red-300">
            {metrics.error || "Falha ao carregar métricas"}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bloco A - Funil Clínico */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Criados */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-criados">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Criados</CardTitle>
                <FileText className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{funnel.criados}</div>
              </CardContent>
            </Card>

            {/* Finalizados */}
            <Card className={`hover:shadow-md transition-shadow border ${getTaxaBg(funnel.taxaFinalizacao)}`} data-testid="card-finalizados">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Finalizados</CardTitle>
                <CheckCircle className={`w-5 h-5 ${getTaxaColor(funnel.taxaFinalizacao)}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{funnel.finalizados}</div>
                <span className={`inline-flex mt-1 px-2 py-0.5 text-xs border rounded-full ${getBadgeClass(funnel.taxaFinalizacao)}`}>
                  {funnel.taxaFinalizacao}% finalização
                </span>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMinutes(tempos.tempoMedioAteFinalizarMin)} até finalizar
                </div>
              </CardContent>
            </Card>

            {/* Assinados */}
            <Card className={`hover:shadow-md transition-shadow border ${getTaxaBg(funnel.taxaAssinatura)}`} data-testid="card-assinados">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Assinados</CardTitle>
                <PenTool className={`w-5 h-5 ${getTaxaColor(funnel.taxaAssinatura)}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{funnel.assinados}</div>
                <span className={`inline-flex mt-1 px-2 py-0.5 text-xs border rounded-full ${getBadgeClass(funnel.taxaAssinatura)}`}>
                  {funnel.taxaAssinatura}% assinatura
                </span>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {formatMinutes(tempos.tempoMedioAteAssinarMin)} até assinar
                </div>
              </CardContent>
            </Card>

            {/* Pendências - Card SLA Completo */}
            {(() => {
              const pendingTotal = pendencias.finalizadosSemAssinatura ?? 0;
              const pendingAtencao = pendencias.atencao ?? 0;
              const pendingCritico = pendencias.critico ?? 0;
              
              const pendTone = pendingCritico > 0
                ? "border-red-300 bg-red-50 dark:bg-red-900/20"
                : pendingAtencao > 0
                ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20"
                : pendingTotal > 0
                ? "border-orange-200 bg-orange-50 dark:bg-orange-900/20"
                : "border-green-200 bg-green-50 dark:bg-green-900/20";
              
              const iconColor = pendingCritico > 0
                ? "text-red-600"
                : pendingAtencao > 0
                ? "text-yellow-600"
                : pendingTotal > 0
                ? "text-orange-500"
                : "text-green-600";
              
              return (
                <Card className={`hover:shadow-md transition-shadow border ${pendTone}`} data-testid="card-pendencias">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-500">Pendências</CardTitle>
                    <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {loading ? "…" : pendingTotal}
                    </div>
                    <span className="inline-flex mt-1 px-2 py-0.5 text-xs border rounded-full bg-gray-100 text-gray-700 border-gray-200">
                      finalizados sem assinatura
                    </span>
                    
                    {/* Painel SLA detalhado */}
                    <div className="mt-3 space-y-2" data-testid="painel-risco-sla">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">🟡 Atenção (≥ 1h)</span>
                        <span className={`font-semibold ${pendingAtencao > 0 ? "text-yellow-700" : "text-gray-400"}`}>
                          {loading ? "…" : pendingAtencao}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">🔴 Crítico (≥ 4h)</span>
                        <span className={`font-semibold ${pendingCritico > 0 ? "text-red-700" : "text-gray-400"}`}>
                          {loading ? "…" : pendingCritico}
                        </span>
                      </div>
                    </div>
                    
                    {/* Botão Ver lista */}
                    <button
                      className="mt-3 w-full px-3 py-2 text-sm rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setLocation(`/manager/pendencias?days=${days}`)}
                      disabled={loading || pendingTotal <= 0}
                      data-testid="link-ver-pendencias"
                    >
                      Ver lista
                    </button>
                    
                    {/* Mensagens de ação */}
                    {pendingCritico > 0 && (
                      <div className="text-xs text-red-800 mt-2 font-medium">
                        ⚠️ Ação recomendada: cobrar assinatura imediatamente.
                      </div>
                    )}
                    {pendingCritico === 0 && pendingAtencao > 0 && (
                      <div className="text-xs text-yellow-900 mt-2">
                        Atenção: pendências acima de 1h.
                      </div>
                    )}
                    {pendingCritico === 0 && pendingAtencao === 0 && pendingTotal > 0 && (
                      <div className="text-xs text-gray-600 mt-2">
                        Pendências recentes (dentro do SLA).
                      </div>
                    )}
                    {pendingTotal === 0 && (
                      <div className="text-xs text-green-700 mt-2">
                        ✓ Sem pendências no período.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Bloco C - Produção por Médico */}
          <Card data-testid="card-doctors">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Produção por Médico
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Identifica gargalos (rascunhos) e performance (taxa de finalização)
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyWithPendencies}
                  onChange={(e) => setOnlyWithPendencies(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Somente com pendências
              </label>
            </CardHeader>
            <CardContent>
              {!sortedDoctors.length ? (
                <div className="text-center text-gray-400 py-8">
                  {onlyWithPendencies 
                    ? "Nenhum médico com pendências no período." 
                    : "Nenhum dado de médicos no período."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-medium text-gray-500">Médico</th>
                        <th 
                          className="text-center py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                          onClick={() => onSort("total")}
                        >
                          <span className="inline-flex items-center">Total <SortIcon col="total" /></span>
                        </th>
                        <th 
                          className="text-center py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                          onClick={() => onSort("finalizados")}
                        >
                          <span className="inline-flex items-center">Finalizados <SortIcon col="finalizados" /></span>
                        </th>
                        <th 
                          className="text-center py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                          onClick={() => onSort("assinados")}
                        >
                          <span className="inline-flex items-center">Assinados <SortIcon col="assinados" /></span>
                        </th>
                        <th 
                          className="text-center py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                          onClick={() => onSort("rascunhos")}
                        >
                          <span className="inline-flex items-center">Rascunhos <SortIcon col="rascunhos" /></span>
                        </th>
                        <th 
                          className="text-center py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                          onClick={() => onSort("pendencias")}
                        >
                          <span className="inline-flex items-center">Pendências <SortIcon col="pendencias" /></span>
                        </th>
                        <th 
                          className="text-center py-3 px-2 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                          onClick={() => onSort("taxaFinalizacao")}
                        >
                          <span className="inline-flex items-center">Taxa <SortIcon col="taxaFinalizacao" /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDoctors.map((doc, i) => (
                        <tr 
                          key={doc.medicoId} 
                          className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                            i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""
                          }`}
                          data-testid={`row-doctor-${doc.medicoId}`}
                        >
                          <td className="py-3 px-2">
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {doc.medicoNome || "—"}
                            </div>
                            {doc.medicoEmail && (
                              <div className="text-xs text-gray-400">{doc.medicoEmail}</div>
                            )}
                          </td>
                          <td className="text-center py-3 px-2 font-medium">{doc.total}</td>
                          <td className="text-center py-3 px-2 text-green-600">{doc.finalizados}</td>
                          <td className="text-center py-3 px-2 text-purple-600">{doc.assinados}</td>
                          <td className="text-center py-3 px-2">
                            <span className={doc.rascunhos > 3 ? "text-red-600 font-semibold" : "text-yellow-600"}>
                              {doc.rascunhos}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            {doc.finalizadosSemAssinatura > 0 ? (
                              <button
                                onClick={() => setLocation(`/manager/pendencias?days=${days}&medico_id=${doc.medicoId}`)}
                                className="inline-flex px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800 border border-orange-200 hover:bg-orange-200 cursor-pointer transition-colors"
                                title="Ver pendências deste médico"
                              >
                                {doc.finalizadosSemAssinatura}
                              </button>
                            ) : (
                              <span className="text-gray-400">{doc.finalizadosSemAssinatura}</span>
                            )}
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getBadgeClass(doc.taxaFinalizacao)}`}>
                              {doc.taxaFinalizacao}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
