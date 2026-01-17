import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

function useQuery() {
  const [loc] = useLocation();
  return useMemo(() => {
    const qs = loc.includes("?") ? loc.split("?")[1] : "";
    return new URLSearchParams(qs);
  }, [loc]);
}

type ValidateResponse =
  | {
      valid: true;
      role: "doctor" | "patient";
      consultation: {
        id: number;
        doctorName: string;
        patientName: string;
        scheduledFor: string | null;
        duration: number;
        status: string;
      };
    }
  | {
      valid: false;
      message?: string;
    };

export default function MeetRoom() {
  const q = useQuery();

  const meet = (q.get("meet") || "").trim();
  const token = (q.get("t") || "").trim();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [info, setInfo] = useState<ValidateResponse | null>(null);

  const canTryValidate = Boolean(meet && token);

  const directUrl = canTryValidate
    ? `/consultorio/meet/${encodeURIComponent(meet)}?t=${encodeURIComponent(token)}`
    : "";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErrorMsg("");
      setInfo(null);

      if (!canTryValidate) return;

      setLoading(true);
      try {
        const res = await fetch(
          `/api/consultorio/meet/${encodeURIComponent(meet)}/validate?t=${encodeURIComponent(token)}`,
        );

        const data = (await res.json()) as ValidateResponse;

        if (cancelled) return;

        setInfo(data);

        if (res.ok && "valid" in data && data.valid === true) {
          // ✅ token ok + DB ok → entra na sala
          window.location.assign(directUrl);
          return;
        }

        // caso inválido
        const msg =
          ("message" in data && data.message) ||
          (res.status === 401 ? "Token inválido." : "") ||
          (res.status === 403 ? "Acesso não autorizado." : "") ||
          (res.status === 404 ? "Consulta não encontrada." : "") ||
          (res.status === 410 ? "Link expirado. Solicite um novo." : "") ||
          `Não foi possível validar (HTTP ${res.status}).`;

        setErrorMsg(msg);
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e?.message || "Erro ao validar link.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [canTryValidate, meet, token, directUrl]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Sala de espera</h1>
              <p className="mt-1 text-sm text-slate-600">
                Validando o link de entrada do consultório…
              </p>
            </div>
            <span className="rounded-full bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 border border-teal-100">
              Consultório
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs text-slate-500">Consulta</div>
              <div className="text-lg font-semibold">{meet || "—"}</div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                Validando…
              </div>
            ) : null}

            {errorMsg ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {errorMsg}
                {canTryValidate ? (
                  <div className="mt-2 text-xs text-amber-900/80">
                    Se você acha que está correto, tente recarregar.
                  </div>
                ) : null}
              </div>
            ) : null}

            {"valid" in (info || {}) && info?.valid ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                Link validado. Entrando na sala…
              </div>
            ) : null}

            {!meet ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Falta o parâmetro <b>meet</b> na URL.
                <div className="mt-2 font-mono text-xs break-all">
                  /consultorio/?meet=36&t=...
                </div>
              </div>
            ) : null}

            {meet && !token ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Falta o parâmetro <b>t</b> (token) na URL.
              </div>
            ) : null}
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

            {canTryValidate ? (
              <a
                href={directUrl}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white border border-slate-200 hover:bg-slate-50"
              >
                Abrir link direto
              </a>
            ) : null}
          </div>

          <div className="mt-6 text-xs text-slate-500">
            Dica: o token não é exibido por segurança.
          </div>
        </div>
      </div>
    </div>
  );
}
