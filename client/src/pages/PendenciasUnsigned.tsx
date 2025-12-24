import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Clock, AlertTriangle, RefreshCw, 
  ExternalLink, User, FileText, ChevronLeft, ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";

type PendingItem = {
  id: string;
  consultaId: string;
  medicoId: string;
  medicoNome: string;
  medicoEmail: string;
  createdAt: string;
  finalizedAt: string;
  signedAt: string | null;
  hasAssinaturaProxy: boolean;
  tempoParadoMin: number;
  tempoAteFinalizarMin: number | null;
};

type PendingResponse = {
  ok: boolean;
  range: { days: number; since: string };
  paging: { limit: number; offset: number; total: number };
  items: PendingItem[];
  error?: string;
};

function formatMinutes(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  const rounded = Math.round(v);
  if (rounded < 60) return `${rounded} min`;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  const hRest = h % 24;
  return `${d}d ${hRest}h`;
}

function getUrgencyColor(min: number): string {
  if (min > 1440) return "text-red-600 bg-red-50"; // >24h
  if (min > 480) return "text-orange-600 bg-orange-50"; // >8h
  if (min > 60) return "text-yellow-600 bg-yellow-50"; // >1h
  return "text-green-600 bg-green-50";
}

export default function PendenciasUnsigned() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<PendingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("consultorio_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const offset = page * limit;
      
      const res = await fetch(
        `/api/manager/metrics/v2/pending/unsigned?days=${days}&limit=${limit}&offset=${offset}`,
        { credentials: "include", headers }
      );

      if (res.status === 403 || res.status === 401) {
        setData({ ok: false, error: "Acesso negado" } as any);
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
    fetchData();
  }, [days, page]);

  const totalPages = data?.paging ? Math.ceil(data.paging.total / limit) : 0;

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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2" data-testid="title-pendencias">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Pendências - Finalizados sem Assinatura
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data?.paging?.total ?? 0} prontuários aguardando assinatura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border overflow-hidden">
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                days === 7 ? "bg-teal-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => { setDays(7); setPage(0); }}
              disabled={loading}
              data-testid="button-7days"
            >
              7d
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                days === 30 ? "bg-teal-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => { setDays(30); setPage(0); }}
              disabled={loading}
              data-testid="button-30days"
            >
              30d
            </button>
            <button
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                days === 90 ? "bg-teal-600 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => { setDays(90); setPage(0); }}
              disabled={loading}
              data-testid="button-90days"
            >
              90d
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!data ? (
        <Card>
          <CardContent className="p-6 text-sm text-gray-500">Carregando...</CardContent>
        </Card>
      ) : !data.ok ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-sm text-red-600">{data.error}</CardContent>
        </Card>
      ) : data.items.length === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-8 text-center">
            <div className="text-green-600 text-lg font-medium">Nenhuma pendência!</div>
            <p className="text-sm text-green-500 mt-1">
              Todos os prontuários finalizados foram assinados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card data-testid="card-pendencias-list">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Lista de Prontuários Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Médico</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Finalizado em</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500">Tempo Parado</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500">Tempo p/ Finalizar</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                        i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""
                      }`}
                      data-testid={`row-pendencia-${item.id}`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {item.medicoNome}
                            </div>
                            <div className="text-xs text-gray-400">{item.medicoEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                        {new Date(item.finalizedAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(item.tempoParadoMin)}`}>
                          <Clock className="w-3 h-3" />
                          {formatMinutes(item.tempoParadoMin)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2 text-gray-500">
                        {formatMinutes(item.tempoAteFinalizarMin)}
                      </td>
                      <td className="text-center py-3 px-2">
                        <Link
                          href={`/consultorio/consulta/${item.consultaId}`}
                          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-medium"
                          data-testid={`link-abrir-${item.id}`}
                        >
                          Abrir <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Página {page + 1} de {totalPages} • {data.paging.total} itens
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                    data-testid="button-prev"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || loading}
                    data-testid="button-next"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
