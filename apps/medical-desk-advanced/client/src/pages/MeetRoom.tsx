import { useMemo } from "react";
import { Link, useLocation } from "wouter";

function useQuery() {
  const [loc] = useLocation();
  return useMemo(() => {
    const qs = loc.includes("?") ? loc.split("?")[1] : "";
    return new URLSearchParams(qs);
  }, [loc]);
}

export default function MeetRoom() {
  const q = useQuery();

  const meet = q.get("meet") || "";
  const t = q.get("t") || "";

  const consultationId = meet.trim();
  const token = t.trim();

  const canOpen = Boolean(consultationId);

  const directUrl = canOpen
    ? `/consultorio/meet/${encodeURIComponent(consultationId)}?t=${encodeURIComponent(token)}`
    : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Sala de espera</h1>
              <p className="mt-1 text-sm text-slate-600">
                Link de entrada gerado após confirmação de pagamento.
              </p>
            </div>
            <span className="rounded-full bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 border border-teal-100">
              Consultório
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Consulta</div>
              <div className="text-lg font-semibold">
                {consultationId || "—"}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Token</div>
              <div className="text-sm font-mono break-all">{token || "—"}</div>
              <div className="mt-2 text-xs text-slate-500">
                (Em produção, você pode esconder isso e só usar no backend.)
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700"
            >
              Ir para o Dashboard
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200"
            >
              Recarregar
            </button>

            {canOpen ? (
              <a
                href={directUrl}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50"
              >
                Abrir link direto
              </a>
            ) : null}
          </div>

          {!canOpen ? (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Falta o parâmetro <b>meet</b> na URL. Exemplo:
              <div className="mt-2 font-mono text-xs break-all">
                /consultorio/meet/36?t=... → /consultorio/?meet=36&t=...
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
