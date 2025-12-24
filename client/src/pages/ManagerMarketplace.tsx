import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, RefreshCw, TrendingUp, Users, Clock, 
  DollarSign, Target, Activity
} from "lucide-react";
import { useLocation } from "wouter";

type MarketplaceCards = {
  marketplaceCreated: number;
  withBids: number;
  totalBids: number;
  acceptedBids: number;
  coverageRate: number;
  acceptRate: number;
};

type MarketplaceTiming = {
  avgMinutesToFirstBid: number;
  p50MinutesToFirstBid: number;
  avgMinutesToAccept: number;
};

type MarketplaceBidAmount = {
  min: number | null;
  avg: number | null;
  p50: number | null;
  p90: number | null;
  max: number | null;
};

type TopDoctor = {
  doctorId: number;
  doctorName: string;
  bids: number;
  accepted: number;
};

type MarketplaceData = {
  ok: boolean;
  range: { days: number; from: string; to: string };
  cards: MarketplaceCards;
  timing: MarketplaceTiming;
  bidAmount: MarketplaceBidAmount;
  topDoctors: TopDoctor[];
  error?: string;
};

function formatCurrency(v: number | null): string {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatMinutes(v: number): string {
  if (v < 60) return `${Math.round(v)} min`;
  const h = Math.floor(v / 60);
  const m = Math.round(v % 60);
  return `${h}h ${m}m`;
}

export default function ManagerMarketplace() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [days, setDays] = useState(7);

  const fetchData = async (selectedDays: number) => {
    setLoading(true);
    setAccessDenied(false);
    try {
      const token = localStorage.getItem("consultorio_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`/api/manager/manager-marketplace?days=${selectedDays}`, {
        credentials: "include",
        headers,
      });

      if (res.status === 403 || res.status === 401) {
        setAccessDenied(true);
        return;
      }

      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setData({ ok: false, error: e?.message } as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <div className="text-red-600 text-lg font-medium">Acesso Restrito</div>
            <p className="text-sm text-gray-500 mt-2">
              Você não tem permissão para acessar o Manager Marketplace.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setLocation("/manager")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = data?.cards ?? {
    marketplaceCreated: 0,
    withBids: 0,
    totalBids: 0,
    acceptedBids: 0,
    coverageRate: 0,
    acceptRate: 0,
  };
  const timing = data?.timing ?? { avgMinutesToFirstBid: 0, p50MinutesToFirstBid: 0, avgMinutesToAccept: 0 };
  const bidAmount = data?.bidAmount ?? { min: null, avg: null, p50: null, p90: null, max: null };
  const topDoctors = data?.topDoctors ?? [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/manager")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2" data-testid="title-marketplace">
              <Activity className="w-5 h-5 text-teal-600" />
              Manager Marketplace
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Métricas de leilão reverso e performance do marketplace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border overflow-hidden">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  days === d ? "bg-teal-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => setDays(d)}
                disabled={loading}
                data-testid={`button-${d}days`}
              >
                {d}d
              </button>
            ))}
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

      {/* Loading */}
      {loading && !data && (
        <Card>
          <CardContent className="p-6 text-sm text-gray-500">Carregando métricas...</CardContent>
        </Card>
      )}

      {/* Error */}
      {data && !data.ok && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-sm text-red-600">{data.error}</CardContent>
        </Card>
      )}

      {/* Content */}
      {data?.ok && (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card data-testid="card-created">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Consultas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{cards.marketplaceCreated}</div>
                <span className="text-xs text-gray-400">marketplace</span>
              </CardContent>
            </Card>

            <Card data-testid="card-with-bids">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Com bids
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{cards.withBids}</div>
                <span className={`inline-flex text-xs px-1.5 py-0.5 rounded ${cards.coverageRate >= 0.7 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                  {(cards.coverageRate * 100).toFixed(1)}% cobertura
                </span>
              </CardContent>
            </Card>

            <Card data-testid="card-total-bids">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Total Bids</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{cards.totalBids}</div>
              </CardContent>
            </Card>

            <Card data-testid="card-accepted">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">Aceitos</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{cards.acceptedBids}</div>
                <span className={`inline-flex text-xs px-1.5 py-0.5 rounded ${cards.acceptRate >= 0.5 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                  {(cards.acceptRate * 100).toFixed(1)}% aceite
                </span>
              </CardContent>
            </Card>

            <Card data-testid="card-time-bid">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 1º Bid
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{formatMinutes(timing.avgMinutesToFirstBid)}</div>
                <span className="text-xs text-gray-400">p50: {formatMinutes(timing.p50MinutesToFirstBid)}</span>
              </CardContent>
            </Card>

            <Card data-testid="card-time-accept">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Aceite
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{formatMinutes(timing.avgMinutesToAccept)}</div>
                <span className="text-xs text-gray-400">tempo médio</span>
              </CardContent>
            </Card>
          </div>

          {/* Distribuição de valores */}
          <Card data-testid="card-bid-distribution">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Distribuição de Valores (Bids)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500">Mínimo</div>
                  <div className="text-lg font-semibold text-gray-700">{formatCurrency(bidAmount.min)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Média</div>
                  <div className="text-lg font-semibold text-gray-700">{formatCurrency(bidAmount.avg)}</div>
                </div>
                <div className="bg-teal-50 rounded-lg p-2">
                  <div className="text-xs text-teal-600 font-medium">Mediana (p50)</div>
                  <div className="text-xl font-bold text-teal-700">{formatCurrency(bidAmount.p50)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">p90</div>
                  <div className="text-lg font-semibold text-gray-700">{formatCurrency(bidAmount.p90)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Máximo</div>
                  <div className="text-lg font-semibold text-gray-700">{formatCurrency(bidAmount.max)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Médicos */}
          <Card data-testid="card-top-doctors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Top Médicos por Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topDoctors.length === 0 ? (
                <div className="text-center text-gray-400 py-4">Nenhum dado disponível</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-2 font-medium text-gray-500">#</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Médico</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-500">Bids</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-500">Aceitos</th>
                        <th className="text-center py-2 px-2 font-medium text-gray-500">Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topDoctors.map((doc, i) => (
                        <tr
                          key={doc.doctorId}
                          className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}
                        >
                          <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                          <td className="py-2 px-2 font-medium">{doc.doctorName}</td>
                          <td className="py-2 px-2 text-center">{doc.bids}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={doc.accepted > 0 ? "text-green-600 font-medium" : "text-gray-400"}>
                              {doc.accepted}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${
                              doc.bids > 0 && (doc.accepted / doc.bids) >= 0.5
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {doc.bids > 0 ? ((doc.accepted / doc.bids) * 100).toFixed(0) : 0}%
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
