import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Filter, ChevronLeft, ChevronRight, Clock, User, FileText } from "lucide-react";

type NotificationItem = {
  id: string;
  createdAt: string;
  kind: string;
  payload: any;
  medicoId: string;
  medicoNome: string | null;
  medicoEmail: string | null;
  prontuarioId: string | null;
  managerUserId: string | null;
};

type NotificationsResponse = {
  range: { days: number; since: string };
  filters: { kind: string | null; medico_id: string | null };
  paging: { limit: number; offset: number; total: number };
  items: NotificationItem[];
};

function getQuery() {
  return new URLSearchParams(window.location.search);
}

async function apiGet<T>(url: string): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} - ${msg || res.statusText}`);
  }
  return res.json();
}

function kindLabel(kind: string) {
  if (kind === "unsigned_prontuario_auto") return "Automática";
  if (kind === "unsigned_prontuario") return "Manual";
  return kind;
}

function pillTone(kind: string) {
  if (kind === "unsigned_prontuario_auto") return "bg-red-100 text-red-800 border-red-200";
  if (kind === "unsigned_prontuario") return "bg-gray-100 text-gray-800 border-gray-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}

function safeSummary(payload: any) {
  if (!payload) return "—";
  const parts: string[] = [];
  if (typeof payload.criticos === "number") parts.push(`críticos=${payload.criticos}`);
  if (typeof payload.days === "number") parts.push(`janela=${payload.days}d`);
  if (payload.reason) parts.push(String(payload.reason));
  if (payload.prontuarioId) parts.push(`prontuário=${payload.prontuarioId}`);
  return parts.length ? parts.join(" • ") : JSON.stringify(payload);
}

export default function ManagerNotificacoes() {
  const [, setLocation] = useLocation();
  const q = getQuery();

  const initialDays = q.get("days") === "30" ? 30 : 7;
  const initialKind = q.get("kind");
  const initialMedicoId = q.get("medico_id");

  const [days, setDays] = useState<7 | 30>(initialDays as 7 | 30);
  const [kind, setKind] = useState<string | null>(initialKind);
  const [medicoId, setMedicoId] = useState<string | null>(initialMedicoId);

  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    if (kind) params.set("kind", kind);
    if (medicoId) params.set("medico_id", medicoId);
    params.set("offset", String(offset));
    setLocation(`/manager/notificacoes?${params.toString()}`, { replace: true });
  }, [days, kind, medicoId, offset, setLocation]);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    params.set("limit", String(limit));
    params.set("offset", String(offset));
    if (kind) params.set("kind", kind);
    if (medicoId) params.set("medico_id", medicoId);
    return `/api/manager/metrics/v2/notifications?${params.toString()}`;
  }, [days, limit, offset, kind, medicoId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    apiGet<NotificationsResponse>(url)
      .then((r) => alive && setData(r))
      .catch((e: any) => alive && setError(e?.message || "Erro ao carregar"))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [url]);

  const total = data?.paging.total ?? 0;
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/manager")}
            data-testid="btn-back-manager"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-teal-600" />
              Notificações
            </h1>
            <p className="text-sm text-muted-foreground">
              Logs de ações manuais e automáticas • últimos {days} dias
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border overflow-hidden">
            <Button
              variant={days === 7 ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => { setDays(7); setOffset(0); }}
              disabled={loading}
              data-testid="btn-days-7"
            >
              7 dias
            </Button>
            <Button
              variant={days === 30 ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => { setDays(30); setOffset(0); }}
              disabled={loading}
              data-testid="btn-days-30"
            >
              30 dias
            </Button>
          </div>

          <div className="inline-flex rounded-lg border overflow-hidden">
            <Button
              variant={kind === "unsigned_prontuario_auto" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => { setKind("unsigned_prontuario_auto"); setOffset(0); }}
              disabled={loading}
              data-testid="btn-kind-auto"
            >
              Automáticas
            </Button>
            <Button
              variant={kind === "unsigned_prontuario" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => { setKind("unsigned_prontuario"); setOffset(0); }}
              disabled={loading}
              data-testid="btn-kind-manual"
            >
              Manuais
            </Button>
            <Button
              variant={kind === null ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => { setKind(null); setOffset(0); }}
              disabled={loading}
              data-testid="btn-kind-all"
            >
              Todas
            </Button>
          </div>

          {medicoId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setMedicoId(null); setOffset(0); }}
              disabled={loading}
              data-testid="btn-clear-medico"
            >
              <Filter className="h-4 w-4 mr-1" />
              Limpar filtro
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-800 font-medium">Erro: {error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-lg">
              Total: {loading ? "…" : total} notificações
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => canPrev && setOffset((o) => Math.max(0, o - limit))}
                disabled={loading || !canPrev}
                data-testid="btn-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => canNext && setOffset((o) => o + limit)}
                disabled={loading || !canNext}
                data-testid="btn-next-page"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3 font-medium">Quando</th>
                  <th className="py-2 pr-3 font-medium">Tipo</th>
                  <th className="py-2 pr-3 font-medium">Médico</th>
                  <th className="py-2 pr-3 font-medium">Resumo</th>
                  <th className="py-2 pr-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                )}

                {!loading && (data?.items?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Sem notificações no período.
                    </td>
                  </tr>
                )}

                {!loading && data?.items?.map((it) => (
                  <tr key={it.id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(it.createdAt).toLocaleString("pt-BR")}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {it.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <span className={`inline-flex px-2 py-1 rounded-full border text-xs font-medium ${pillTone(it.kind)}`}>
                        {kindLabel(it.kind)}
                      </span>
                    </td>

                    <td className="py-3 pr-3">
                      <button
                        className="text-left hover:opacity-80"
                        title="Filtrar por este médico"
                        onClick={() => { setMedicoId(it.medicoId); setOffset(0); }}
                        data-testid={`btn-filter-medico-${it.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{it.medicoNome || "—"}</div>
                            <div className="text-xs text-muted-foreground">
                              {it.medicoEmail || "—"}
                            </div>
                          </div>
                        </div>
                      </button>
                    </td>

                    <td className="py-3 pr-3">
                      <div className="text-foreground">{safeSummary(it.payload)}</div>
                      {it.prontuarioId && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <FileText className="h-3 w-3" />
                          {it.prontuarioId.slice(0, 8)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLocation(`/manager/pendencias?days=${days}&medico_id=${it.medicoId}`);
                          }}
                          data-testid={`btn-ver-pendencias-${it.id}`}
                        >
                          Ver pendências
                        </Button>

                        {it.prontuarioId && (
                          <a
                            href={`/consultorio/prontuario/${it.prontuarioId}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-muted"
                          >
                            Abrir prontuário
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Clique no médico para filtrar. "Automáticas" são geradas pelo cron (1x/dia às 08:00 São Paulo).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
