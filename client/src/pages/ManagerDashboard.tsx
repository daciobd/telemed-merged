import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, CheckCircle, Edit3, PenTool, RefreshCw, 
  CalendarDays, Clock, TrendingUp, Shield 
} from "lucide-react";

type Stats = {
  ok: boolean;
  available?: boolean;
  updated_at?: string;
  totals?: {
    prontuarios_total: number;
    prontuarios_final: number;
    prontuarios_draft: number;
    prontuarios_assinados: number;
  };
  today?: {
    total: number;
    final: number;
    draft: number;
  };
  avg_time_to_finalize_minutes?: number | null;
  conversion?: {
    finalized_rate: number;
    signed_rate_of_final: number;
  };
  last7days?: Array<{ date: string; total: number; final: number; draft: number }>;
  note?: string;
  error?: string;
};

export default function ManagerDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const token = localStorage.getItem("consultorio_token");
      const r = await fetch("/api/consultorio/stats", { 
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (r.status === 403) {
        setAccessDenied(true);
        setStats(null);
        return;
      }
      
      const j = (await r.json()) as Stats;
      setStats(j);
    } catch (e: any) {
      setStats({ ok: false, error: e?.message || "Falha ao carregar stats" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totals = stats?.totals || {
    prontuarios_total: 0,
    prontuarios_final: 0,
    prontuarios_draft: 0,
    prontuarios_assinados: 0,
  };

  const today = stats?.today || { total: 0, final: 0, draft: 0 };
  const conversion = stats?.conversion || { finalized_rate: 0, signed_rate_of_final: 0 };
  const avgTime = stats?.avg_time_to_finalize_minutes;

  const kpis = useMemo(
    () => [
      { label: "Prontuários", value: totals.prontuarios_total, icon: FileText, color: "text-blue-600" },
      { label: "Finalizados", value: totals.prontuarios_final, icon: CheckCircle, color: "text-green-600" },
      { label: "Rascunhos", value: totals.prontuarios_draft, icon: Edit3, color: "text-yellow-600" },
      { label: "Assinados", value: totals.prontuarios_assinados, icon: PenTool, color: "text-purple-600" },
    ],
    [totals]
  );

  const extraKpis = useMemo(
    () => [
      { label: "Hoje", value: today.total, sub: `${today.final} finalizados`, icon: CalendarDays, color: "text-teal-600" },
      { label: "% Finalizados", value: `${conversion.finalized_rate}%`, icon: TrendingUp, color: "text-indigo-600" },
      { label: "% Assinados", value: `${conversion.signed_rate_of_final}%`, sub: "dos finalizados", icon: Shield, color: "text-emerald-600" },
      { label: "Tempo Médio", value: avgTime != null ? `${avgTime} min` : "—", sub: "até finalizar", icon: Clock, color: "text-orange-600" },
    ],
    [today, conversion, avgTime]
  );

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white" data-testid="title-manager-dashboard">
            Manager Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Indicadores operacionais do TeleMed.
            {stats?.updated_at
              ? ` Atualizado em ${new Date(stats.updated_at).toLocaleString("pt-BR")}.`
              : ""}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchStats}
          disabled={loading}
          data-testid="button-refresh-stats"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {!stats ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-500">Carregando...</CardContent>
        </Card>
      ) : !stats.ok ? (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Erro</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600 dark:text-red-300">
            {stats.error || "Falha ao carregar"}
          </CardContent>
        </Card>
      ) : stats.available === false ? (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-700 dark:text-yellow-400">Stats indisponível</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-yellow-600 dark:text-yellow-300">
            <div>O endpoint respondeu, mas não conseguiu acessar o DB.</div>
            {stats.note ? <div className="text-muted-foreground">{stats.note}</div> : null}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kpis.map((k) => (
              <Card key={k.label} className="hover:shadow-md transition-shadow" data-testid={`card-kpi-${k.label.toLowerCase()}`}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {k.label}
                  </CardTitle>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{k.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* KPIs extras */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {extraKpis.map((k) => (
              <Card key={k.label} className="hover:shadow-md transition-shadow bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900" data-testid={`card-extra-${k.label.toLowerCase().replace(/\s|%/g, '-')}`}>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {k.label}
                  </CardTitle>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</div>
                  {"sub" in k && k.sub && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{k.sub}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Últimos 7 dias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos 7 dias</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {stats.last7days?.length ? (
                <div className="space-y-3">
                  {stats.last7days.map((d) => (
                    <div
                      key={d.date}
                      className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2"
                      data-testid={`row-day-${d.date}`}
                    >
                      <div className="font-medium text-gray-700 dark:text-gray-300">{d.date}</div>
                      <div className="flex gap-4 text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> {d.total}
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" /> {d.final}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Edit3 className="w-3.5 h-3.5" /> {d.draft}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 dark:text-gray-500 py-4 text-center">
                  Sem dados nos últimos 7 dias.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
