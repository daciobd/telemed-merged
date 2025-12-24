import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, CheckCircle, PenTool, RefreshCw, 
  Clock, TrendingUp, Shield, AlertTriangle, Users
} from "lucide-react";

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
};

type MetricsV2 = {
  ok: boolean;
  range: { days: number; since: string };
  funnel: FunnelData;
  tempos: TemposData;
  pendencias: PendenciasData;
  error?: string;
};

type DoctorMetrics = {
  medicoId: string;
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

function getTaxaColor(taxa: number): string {
  if (taxa >= 85) return "text-green-600";
  if (taxa >= 70) return "text-yellow-600";
  return "text-red-600";
}

function getTaxaBg(taxa: number): string {
  if (taxa >= 85) return "bg-green-50 dark:bg-green-900/20";
  if (taxa >= 70) return "bg-yellow-50 dark:bg-yellow-900/20";
  return "bg-red-50 dark:bg-red-900/20";
}

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState<MetricsV2 | null>(null);
  const [doctors, setDoctors] = useState<DoctorsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [days, setDays] = useState(30);

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

      if (metricsRes.status === 403 || doctorsRes.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (metricsRes.status === 401 || doctorsRes.status === 401) {
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
              Se você deveria ter acesso, entre em contato com o administrador do sistema.
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
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={days === 7 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(7)}
            data-testid="button-7days"
          >
            7 dias
          </Button>
          <Button
            variant={days === 30 ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(30)}
            data-testid="button-30days"
          >
            30 dias
          </Button>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <Card className={`hover:shadow-md transition-shadow ${getTaxaBg(funnel.taxaFinalizacao)}`} data-testid="card-finalizados">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Finalizados</CardTitle>
                <CheckCircle className={`w-5 h-5 ${getTaxaColor(funnel.taxaFinalizacao)}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{funnel.finalizados}</div>
                <div className={`text-sm font-medium ${getTaxaColor(funnel.taxaFinalizacao)}`}>
                  {funnel.taxaFinalizacao}%
                </div>
              </CardContent>
            </Card>

            {/* Assinados */}
            <Card className={`hover:shadow-md transition-shadow ${getTaxaBg(funnel.taxaAssinatura)}`} data-testid="card-assinados">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Assinados</CardTitle>
                <PenTool className={`w-5 h-5 ${getTaxaColor(funnel.taxaAssinatura)}`} />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{funnel.assinados}</div>
                <div className={`text-sm font-medium ${getTaxaColor(funnel.taxaAssinatura)}`}>
                  {funnel.taxaAssinatura}%
                </div>
              </CardContent>
            </Card>

            {/* Tempo até finalizar */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-tempo-finalizar">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Até finalizar</CardTitle>
                <Clock className="w-5 h-5 text-orange-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tempos.tempoMedioAteFinalizarMin != null ? `${tempos.tempoMedioAteFinalizarMin} min` : "—"}
                </div>
                <div className="text-xs text-gray-400">média</div>
              </CardContent>
            </Card>

            {/* Tempo até assinar */}
            <Card className="hover:shadow-md transition-shadow" data-testid="card-tempo-assinar">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">Até assinar</CardTitle>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tempos.tempoMedioAteAssinarMin != null ? `${tempos.tempoMedioAteAssinarMin} min` : "—"}
                </div>
                <div className="text-xs text-gray-400">média</div>
              </CardContent>
            </Card>
          </div>

          {/* Bloco B - Alertas */}
          {pendencias.finalizadosSemAssinatura > 0 && (
            <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20" data-testid="card-alerta-pendencias">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      {pendencias.finalizadosSemAssinatura} prontuários finalizados sem assinatura
                    </div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-300">
                      Requerem atenção do médico
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-400">
                  Ver lista
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bloco C - Produção por Médico */}
          <Card data-testid="card-doctors">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Produção por Médico
              </CardTitle>
              <span className="text-sm text-gray-500">{doctors?.total || 0} médicos</span>
            </CardHeader>
            <CardContent>
              {!doctors?.doctors?.length ? (
                <div className="text-center text-gray-400 py-8">
                  Nenhum dado de médicos no período.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-2 font-medium text-gray-500">Médico</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500">Total</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500">Finalizados</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500">Assinados</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500">Rascunhos</th>
                        <th className="text-center py-3 px-2 font-medium text-gray-500">Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.doctors.map((doc, i) => (
                        <tr 
                          key={doc.medicoId} 
                          className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}`}
                          data-testid={`row-doctor-${doc.medicoId}`}
                        >
                          <td className="py-3 px-2 font-medium text-gray-700 dark:text-gray-300">
                            {doc.medicoId?.substring(0, 8) || "—"}
                          </td>
                          <td className="text-center py-3 px-2">{doc.total}</td>
                          <td className="text-center py-3 px-2 text-green-600">{doc.finalizados}</td>
                          <td className="text-center py-3 px-2 text-purple-600">{doc.assinados}</td>
                          <td className="text-center py-3 px-2">
                            <span className={doc.rascunhos > 3 ? "text-red-600 font-medium" : "text-yellow-600"}>
                              {doc.rascunhos}
                            </span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className={`font-medium ${getTaxaColor(doc.taxaFinalizacao)}`}>
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
