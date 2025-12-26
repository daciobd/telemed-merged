import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Users, DollarSign, Target, BarChart3, ArrowRight, RefreshCw } from "lucide-react";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ""}`} />;
}

interface FunnelEvent {
  events: number;
  sessions: number;
}

interface FunnelRow {
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  all?: string;
  funnel: Record<string, FunnelEvent>;
  conversionRates: {
    landing_to_booking: string;
    booking_to_finished: string;
  };
}

interface RevenueRow {
  utm_campaign?: string;
  gmv: number;
  platform_fee: number;
  doctor_earnings: number;
}

interface FunnelData {
  from: string | null;
  to: string | null;
  groupBy: string;
  events: string[];
  rows: FunnelRow[];
  revenue: RevenueRow[] | null;
}

interface RetargetStats {
  pending: { total: number; last_24h: number; last_7d: number };
  sent: { total: number; last_24h: number; last_7d: number };
  skipped: { total: number; last_24h: number; last_7d: number };
  failed: { total: number; last_24h: number; last_7d: number };
}

const FUNNEL_LABELS: Record<string, string> = {
  landing_view: "Visitas",
  offer_created: "Ofertas",
  booking_started: "Início Agendamento",
  booking_confirmed: "Agendamentos",
  consult_started: "Consultas Iniciadas",
  consult_finished: "Consultas Finalizadas",
  consult_signed: "Consultas Assinadas",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function FunnelCard({ label, value, sessions, trend }: { label: string; value: number; sessions: number; trend?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700" data-testid={`funnel-card-${label}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1" data-testid={`funnel-value-${label}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sessions} sessões únicas</p>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{trend >= 0 ? "+" : ""}{trend.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

interface RevenueRowExtended extends RevenueRow {
  utm_source?: string;
  utm_medium?: string;
}

function CampaignTable({ rows, revenue, groupBy }: { rows: FunnelRow[]; revenue: RevenueRowExtended[] | null; groupBy: string }) {
  const revenueMap = new Map<string, RevenueRowExtended>();
  if (revenue) {
    for (const r of revenue) {
      let key = "all";
      if (groupBy === "utm_campaign") key = r.utm_campaign || "all";
      else if (groupBy === "utm_source") key = r.utm_source || "all";
      else if (groupBy === "utm_medium") key = r.utm_medium || "all";
      revenueMap.set(key, r);
    }
  }

  function getRowKey(row: FunnelRow): string {
    if (groupBy === "utm_campaign") return row.utm_campaign || "all";
    if (groupBy === "utm_source") return row.utm_source || "all";
    if (groupBy === "utm_medium") return row.utm_medium || "all";
    return "all";
  }

  const groupLabel = groupBy === "utm_campaign" ? "Campanha" : groupBy === "utm_source" ? "Source" : groupBy === "utm_medium" ? "Medium" : "Total";

  return (
    <div className="overflow-x-auto" data-testid="campaign-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{groupLabel}</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Visitas</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Agendamentos</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">CVR</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">GMV</th>
            <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Taxa Plat.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const rowKey = getRowKey(row);
            const displayLabel = row.utm_campaign || row.utm_source || row.utm_medium || row.all || "(sem dados)";
            const rev = revenueMap.get(rowKey);
            const landingSessions = row.funnel.landing_view?.sessions || 0;
            const bookingSessions = row.funnel.booking_confirmed?.sessions || 0;

            return (
              <tr 
                key={idx} 
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                data-testid={`campaign-row-${idx}`}
              >
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{displayLabel}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{landingSessions}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{bookingSessions}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-medium ${parseFloat(row.conversionRates.landing_to_booking) > 5 ? "text-green-600" : "text-amber-600"}`}>
                    {row.conversionRates.landing_to_booking}%
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">
                  {rev ? formatCurrency(rev.gmv) : "-"}
                </td>
                <td className="py-3 px-4 text-right text-teal-600 font-medium">
                  {rev ? formatCurrency(rev.platform_fee) : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ManagerMarketing() {
  const [groupBy, setGroupBy] = useState<string>("utm_campaign");
  const [period, setPeriod] = useState<string>("7d");

  const fromDate = period === "30d" 
    ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: funnelData, isLoading: funnelLoading, refetch: refetchFunnel } = useQuery<FunnelData>({
    queryKey: ["/metrics/v2/funnel", groupBy, period],
    queryFn: async () => {
      const res = await fetch(`/metrics/v2/funnel?groupBy=${groupBy}&includeRevenue=1&from=${fromDate}`);
      if (!res.ok) throw new Error("Erro ao carregar funil");
      return res.json();
    },
  });

  const { data: retargetStats, isLoading: retargetLoading } = useQuery<RetargetStats>({
    queryKey: ["/api/internal/retarget/stats"],
    queryFn: async () => {
      const res = await fetch("/api/internal/retarget/stats");
      if (!res.ok) throw new Error("Erro ao carregar stats retarget");
      return res.json();
    },
  });

  const totalLanding = funnelData?.rows.reduce((acc, r) => acc + (r.funnel.landing_view?.sessions || 0), 0) || 0;
  const totalBooking = funnelData?.rows.reduce((acc, r) => acc + (r.funnel.booking_confirmed?.sessions || 0), 0) || 0;
  const totalFinished = funnelData?.rows.reduce((acc, r) => acc + (r.funnel.consult_finished?.sessions || 0), 0) || 0;
  const totalGMV = funnelData?.revenue?.reduce((acc, r) => acc + (r.gmv || 0), 0) || 0;
  const totalFee = funnelData?.revenue?.reduce((acc, r) => acc + (r.platform_fee || 0), 0) || 0;

  const overallCVR = totalLanding > 0 ? ((totalBooking / totalLanding) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6" data-testid="page-manager-marketing">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="title-marketing">
              Marketing & Funil
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Análise de conversão, campanhas UTM e receita
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
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[160px]" data-testid="select-groupby">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utm_campaign">Por Campanha</SelectItem>
                <SelectItem value="utm_source">Por Source</SelectItem>
                <SelectItem value="utm_medium">Por Medium</SelectItem>
                <SelectItem value="none">Consolidado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={() => refetchFunnel()} data-testid="button-refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {funnelLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-testid="card-landing">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs opacity-80">Visitas</span>
                  </div>
                  <p className="text-2xl font-bold">{totalLanding}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white" data-testid="card-booking">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4" />
                    <span className="text-xs opacity-80">Agendamentos</span>
                  </div>
                  <p className="text-2xl font-bold">{totalBooking}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white" data-testid="card-finished">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs opacity-80">Finalizadas</span>
                  </div>
                  <p className="text-2xl font-bold">{totalFinished}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white" data-testid="card-cvr">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs opacity-80">CVR Geral</span>
                  </div>
                  <p className="text-2xl font-bold">{overallCVR}%</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white" data-testid="card-gmv">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs opacity-80">GMV</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(totalGMV)}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white" data-testid="card-fee">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs opacity-80">Taxa Plataforma</span>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(totalFee)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Desempenho por {groupBy === "utm_campaign" ? "Campanha" : groupBy === "utm_source" ? "Source" : groupBy === "utm_medium" ? "Medium" : "Total"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {funnelData?.rows && funnelData.rows.length > 0 ? (
                    <CampaignTable rows={funnelData.rows} revenue={funnelData.revenue} groupBy={groupBy} />
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      Nenhum dado de funil no período selecionado
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Retargeting</CardTitle>
                </CardHeader>
                <CardContent>
                  {retargetLoading ? (
                    <Skeleton className="h-32" />
                  ) : retargetStats ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg" data-testid="retarget-pending">
                        <span className="text-sm text-amber-700 dark:text-amber-300">Pendentes</span>
                        <span className="font-bold text-amber-700 dark:text-amber-300">{retargetStats.pending.last_24h}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg" data-testid="retarget-sent">
                        <span className="text-sm text-green-700 dark:text-green-300">Enviados (24h)</span>
                        <span className="font-bold text-green-700 dark:text-green-300">{retargetStats.sent.last_24h}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" data-testid="retarget-total">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total (7d)</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{retargetStats.sent.last_7d + retargetStats.pending.last_7d}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Sem dados</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {funnelData?.rows && funnelData.rows.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funil Visual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {["landing_view", "booking_confirmed", "consult_finished", "consult_signed"].map((event, idx, arr) => {
                      const total = funnelData.rows.reduce((acc, r) => acc + (r.funnel[event]?.sessions || 0), 0);
                      return (
                        <div key={event} className="flex items-center gap-2">
                          <FunnelCard
                            label={FUNNEL_LABELS[event]}
                            value={funnelData.rows.reduce((acc, r) => acc + (r.funnel[event]?.events || 0), 0)}
                            sessions={total}
                          />
                          {idx < arr.length - 1 && <ArrowRight className="h-5 w-5 text-gray-400" />}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
