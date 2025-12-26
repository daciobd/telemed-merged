import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

type Bucket = {
  bucket: string;
  consultas: number;
  gmv: number;
  ticketMedio: number;
  tempoMedioFinalizarMin: number | null;
  tempoMedioAssinarMin: number | null;
  pctFinalizadosDentroSla: number;
  pctAssinadosDentroSla: number;
  pctCamposCriticosFaltantes: number;
};

type Resp = {
  ok: boolean;
  range: { days: number; since: string };
  sla: { finalizeSlaMin: number; signSlaMin: number };
  buckets: Bucket[];
};

function getQuery() {
  return new URLSearchParams(window.location.search);
}

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function minutes(v: number | null) {
  if (v == null || Number.isNaN(v)) return "—";
  const m = Math.round(v);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function tonePct(v: number) {
  if (v < 0.7) return "bg-red-50 text-red-800 border-red-200";
  if (v < 0.85) return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-green-50 text-green-800 border-green-200";
}

function toneQuality(v: number) {
  if (v > 0.15) return "bg-red-50 text-red-800 border-red-200";
  if (v > 0.05) return "bg-yellow-50 text-yellow-800 border-yellow-200";
  return "bg-green-50 text-green-800 border-green-200";
}

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ManagerReceitaOperacao() {
  const [, setLocation] = useLocation();
  const q = getQuery();

  const initialDays = q.get("days") === "7" ? 7 : 30;
  const [days, setDays] = useState<7 | 30>(initialDays as 7 | 30);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("days", String(days));
    setLocation(`/manager/receita/operacao?${params.toString()}`, { replace: true });
  }, [days, setLocation]);

  const url = useMemo(() => {
    return `/api/manager/revenue/operation?days=${days}`;
  }, [days]);

  const { data, isLoading, error } = useQuery<Resp>({
    queryKey: ["/api/manager/revenue/operation", days],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    },
    staleTime: 30_000,
  });

  return (
    <div className="p-4 space-y-4" data-testid="manager-receita-operacao">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Receita x Operacao</h1>
          <p className="text-sm text-gray-600">
            Impacto do preco em tempo, SLA e qualidade - ultimos {days} dias
          </p>
        </div>

        <div className="inline-flex rounded-xl border overflow-hidden">
          <button
            className={`px-3 py-2 text-sm ${days === 7 ? "bg-black text-white" : "bg-white"}`}
            onClick={() => setDays(7)}
            disabled={isLoading}
            data-testid="btn-7-dias"
          >
            7 dias
          </button>
          <button
            className={`px-3 py-2 text-sm ${days === 30 ? "bg-black text-white" : "bg-white"}`}
            onClick={() => setDays(30)}
            disabled={isLoading}
            data-testid="btn-30-dias"
          >
            30 dias
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border p-4 bg-red-50 text-red-900">
          <div className="font-semibold">Erro</div>
          <div className="text-sm mt-1">{(error as Error)?.message || "Erro ao carregar"}</div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4 overflow-auto">
        <table className="min-w-[1100px] w-full text-sm" data-testid="table-receita-operacao">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-3">Faixa de preco</th>
              <th className="py-2 pr-3">Consultas</th>
              <th className="py-2 pr-3">GMV</th>
              <th className="py-2 pr-3">Ticket medio</th>
              <th className="py-2 pr-3">Finalizar</th>
              <th className="py-2 pr-3">% SLA (fin)</th>
              <th className="py-2 pr-3">Assinar</th>
              <th className="py-2 pr-3">% SLA (ass)</th>
              <th className="py-2 pr-3">Qualidade</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="py-3 text-gray-600">Carregando...</td></tr>
            )}
            {!isLoading && (data?.buckets?.length ?? 0) === 0 && (
              <tr><td colSpan={9} className="py-3 text-gray-600">Sem dados no periodo.</td></tr>
            )}
            {!isLoading && data?.buckets?.map((b) => (
              <tr key={b.bucket} className="border-b last:border-b-0" data-testid={`row-bucket-${b.bucket}`}>
                <td className="py-2 pr-3 font-medium">{b.bucket}</td>
                <td className="py-2 pr-3">{b.consultas}</td>
                <td className="py-2 pr-3">{money(b.gmv)}</td>
                <td className="py-2 pr-3">{money(b.ticketMedio)}</td>
                <td className="py-2 pr-3">{minutes(b.tempoMedioFinalizarMin)}</td>
                <td className="py-2 pr-3">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${tonePct(b.pctFinalizadosDentroSla)}`}>
                    {pct(b.pctFinalizadosDentroSla)}
                  </span>
                </td>
                <td className="py-2 pr-3">{minutes(b.tempoMedioAssinarMin)}</td>
                <td className="py-2 pr-3">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${tonePct(b.pctAssinadosDentroSla)}`}>
                    {pct(b.pctAssinadosDentroSla)}
                  </span>
                </td>
                <td className="py-2 pr-3">
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${toneQuality(b.pctCamposCriticosFaltantes)}`}>
                    {pct(b.pctCamposCriticosFaltantes)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-xs text-gray-500 mt-3">
          Interpretacao rapida: faixas com <b>tempo alto</b> + <b>SLA baixo</b> + <b>qualidade ruim</b> tendem a destruir margem.
        </div>
      </div>
    </div>
  );
}
