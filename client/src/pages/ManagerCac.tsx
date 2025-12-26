import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, DollarSign, Users, Target, Download, RefreshCw, Filter, TrendingUp } from "lucide-react";

type Channel = "all" | "google" | "meta" | "tiktok" | "outros" | "google_ads" | "meta_ads";

type CacRow = {
  period: string;
  channel: string;
  campaign: string;
  spend_cents: number;
  signups: number;
  revenue_cents: number;
  cac_cents: number | null;
};

type CacTotals = {
  spend_cents: number;
  signups: number;
  revenue_cents: number;
  cac_cents: number | null;
};

type CacResponse = {
  range: { from: string; to: string; groupBy: string; channel: string | null; campaign: string | null; onlySigned: boolean };
  totals: CacTotals;
  rows: CacRow[];
  currency?: "BRL";
  unit?: "cents";
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function rowsToCSV(rows: CacRow[]) {
  const header = ["periodo", "canal", "campanha", "gasto_brl", "assinaturas", "receita_brl", "cac_brl"];
  const lines = rows.map((r) => {
    return [
      r.period,
      r.channel,
      (r.campaign || "").replace(/"/g, '""'),
      (r.spend_cents / 100).toFixed(2),
      String(r.signups),
      (r.revenue_cents / 100).toFixed(2),
      r.cac_cents === null ? "" : (r.cac_cents / 100).toFixed(2),
    ]
      .map((v) => `"${v}"`)
      .join(",");
  });
  return [header.join(","), ...lines].join("\n");
}

function formatMoney(cents: number | null) {
  if (cents === null) return "—";
  const reais = cents / 100;
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ""}`} />;
}

export default function ManagerCac() {
  const [location, setLocation] = useLocation();

  const today = useMemo(() => new Date(), []);
  const defaultTo = useMemo(() => toISODate(today), [today]);
  const defaultFrom = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29);
    return toISODate(d);
  }, [today]);

  const params = useMemo(() => new URLSearchParams(location.split("?")[1] || ""), [location]);

  const [from, setFrom] = useState(params.get("from") || defaultFrom);
  const [to, setTo] = useState(params.get("to") || defaultTo);
  const [channel, setChannel] = useState<Channel>((params.get("channel") as Channel) || "all");
  const [campaign, setCampaign] = useState(params.get("campaign") || "");
  const [onlySigned, setOnlySigned] = useState(params.get("onlySigned") === "1");
  const [groupBy, setGroupBy] = useState<"day" | "week">((params.get("groupBy") as "day" | "week") || "day");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CacResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyFiltersToURL() {
    const q = new URLSearchParams();
    q.set("from", from);
    q.set("to", to);
    if (channel !== "all") q.set("channel", channel);
    if (campaign) q.set("campaign", campaign);
    if (onlySigned) q.set("onlySigned", "1");
    if (groupBy !== "day") q.set("groupBy", groupBy);
    setLocation(`/manager/cac?${q.toString()}`);
  }

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const q = new URLSearchParams();
      q.set("from", from);
      q.set("to", to);
      if (channel !== "all") q.set("channel", channel);
      if (campaign) q.set("campaign", campaign);
      if (onlySigned) q.set("onlySigned", "1");
      if (groupBy) q.set("groupBy", groupBy);

      const token = localStorage.getItem("consultorio_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/metrics/v2/marketing/cac-real/details?${q.toString()}`, {
        credentials: "include",
        headers,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CacResponse;
      setData(json);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao carregar CAC.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [from, to, channel, campaign, onlySigned, groupBy]);

  const cacAlertThreshold = 10800; // R$108 = 60% de R$180 (ticket médio) em centavos
  const isHighCacTotal = data?.totals?.cac_cents && data.totals.cac_cents > cacAlertThreshold;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/consultorio/manager")}
            data-testid="btn-back-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            CAC Real (Detalhado)
          </h1>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/manager/marketing/spend")}
            data-testid="btn-marketing-spend"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Gastos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            disabled={loading}
            data-testid="btn-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">De</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-36"
                data-testid="input-from"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Até</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-36"
                data-testid="input-to"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as Channel)}>
                <SelectTrigger className="w-32" data-testid="select-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="google_ads">Google Ads</SelectItem>
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Campanha</Label>
              <Input
                type="text"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="Buscar..."
                className="w-32"
                data-testid="input-campaign"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Agrupar</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "day" | "week")}>
                <SelectTrigger className="w-28" data-testid="select-groupby">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={onlySigned}
                onChange={(e) => setOnlySigned(e.target.checked)}
                className="rounded"
                data-testid="checkbox-only-signed"
              />
              Somente com assinatura
            </label>

            <Button
              variant="outline"
              size="sm"
              onClick={applyFiltersToURL}
              data-testid="btn-apply-filters"
            >
              Fixar na URL
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!data?.rows?.length}
              onClick={() => {
                if (!data) return;
                const csv = rowsToCSV(data.rows);
                downloadCSV(`cac-real_${from}_a_${to}.csv`, csv);
              }}
              data-testid="btn-export-csv"
            >
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gasto Total</p>
                {loading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="kpi-spend">
                    {data ? formatMoney(data.totals.spend_cents) : "—"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assinaturas</p>
                {loading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="kpi-signups">
                    {data ? data.totals.signups : "—"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receita (Platform Fee)</p>
                {loading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white" data-testid="kpi-revenue">
                    {data ? formatMoney(data.totals.revenue_cents) : "—"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={isHighCacTotal ? "border-red-400 bg-red-50 dark:bg-red-900/20" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isHighCacTotal ? "bg-red-100 dark:bg-red-900" : "bg-purple-100 dark:bg-purple-900"}`}>
                <Target className={`w-5 h-5 ${isHighCacTotal ? "text-red-600 dark:text-red-400" : "text-purple-600 dark:text-purple-400"}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">CAC</p>
                {loading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className={`text-xl font-bold ${isHighCacTotal ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`} data-testid="kpi-cac">
                    {data ? formatMoney(data.totals.cac_cents) : "—"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhamento por {groupBy === "week" ? "Semana" : "Dia"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 p-4 text-center">
              Erro: {error}
            </div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto" data-testid="cac-table">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Período</th>
                    <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Canal</th>
                    <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300">Campanha</th>
                    <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Gasto</th>
                    <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Assinaturas</th>
                    <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">Receita</th>
                    <th className="py-3 px-4 font-medium text-gray-600 dark:text-gray-300 text-right">CAC</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows || []).map((r, idx) => {
                    const isHighCac = r.cac_cents !== null && r.cac_cents > cacAlertThreshold;
                    const isNoConversion = r.spend_cents > 0 && r.signups === 0;

                    return (
                      <tr
                        key={`${r.period}-${r.channel}-${r.campaign}-${idx}`}
                        className={`border-b border-gray-100 dark:border-gray-800 ${isHighCac || isNoConversion ? "bg-red-50 dark:bg-red-900/20" : ""}`}
                        data-testid={`cac-row-${idx}`}
                      >
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{r.period}</td>
                        <td className="py-3 px-4 capitalize text-gray-600 dark:text-gray-300">{r.channel}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{r.campaign || "—"}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatMoney(r.spend_cents)}</td>
                        <td className="py-3 px-4 text-right">{r.signups}</td>
                        <td className="py-3 px-4 text-right">{formatMoney(r.revenue_cents)}</td>
                        <td className={`py-3 px-4 text-right font-medium ${isHighCac ? "text-red-600 dark:text-red-400" : ""}`}>
                          {formatMoney(r.cac_cents)}
                        </td>
                      </tr>
                    );
                  })}

                  {!data?.rows?.length && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        Sem dados no período selecionado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
