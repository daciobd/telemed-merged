import React, {useEffect, useMemo, useState} from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Loader2, FlaskConical } from "lucide-react";

/**
 * Drop-in components to wire up:
 * - <ConsultationActions />: place inside /consulta/?appointmentId=...&role=doctor
 * - <DrAIBadge />: place in your Hub header
 * - <DrAITester /> (optional): full-page tester you can route to /dr-ai/test
 *
 * Assumes a health endpoint at GET /api/dr-ai/health returning:
 * { status: "ok" | "fail", details?: string, ts: string }
 * and a notes URL at /consulta/:appointmentId/dr-ai/notas
 */

// --- helpers ---
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

async function fetchHealth(signal?: AbortSignal) {
  const res = await fetch("/api/dr-ai/health", { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ status: "ok" | "fail"; details?: string; ts: string }>
}

// --- Badge for the Hub header ---
export function DrAIBadge({ className = "" }: { className?: string }) {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ok"; ts: string }
    | { kind: "fail"; ts?: string; details?: string }
  >({ kind: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetchHealth(ac.signal)
      .then((j) => setState(j.status === "ok" ? { kind: "ok", ts: j.ts } : { kind: "fail", ts: j.ts, details: j.details }))
      .catch((e) => setState({ kind: "fail", details: e.message }));
    return () => ac.abort();
  }, []);

  const content = (() => {
    switch (state.kind) {
      case "loading":
        return (
          <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-2xl bg-gray-100">
            <Loader2 className="h-4 w-4 animate-spin" /> Dr. AI: verificando…
          </span>
        );
      case "ok":
        return (
          <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-2xl bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4" /> Dr. AI: OK
          </span>
        );
      case "fail":
        return (
          <span className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-2xl bg-red-100 text-red-800" title={state.details}>
            <AlertTriangle className="h-4 w-4" /> Dr. AI: Falha
          </span>
        );
    }
  })();

  return <div className={className}>{content}</div>;
}

// --- Actions inside the /consulta/ page ---
export function ConsultationActions() {
  const q = useQuery();
  const appointmentId = q.get("appointmentId") ?? "";
  const role = q.get("role") ?? "";
  const notesHref = appointmentId ? `/consulta/${appointmentId}/dr-ai/notas` : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {notesHref && role === "doctor" ? (
        <Link to={notesHref} className="w-full">
          <motion.button whileTap={{ scale: 0.98 }} className="w-full px-4 py-3 rounded-2xl shadow-sm border bg-white hover:bg-gray-50 text-left">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              <div className="flex flex-col">
                <span className="font-medium">Dr. AI / Notas</span>
                <span className="text-sm text-gray-500">Gerar & revisar notas com IA</span>
              </div>
            </div>
          </motion.button>
        </Link>
      ) : (
        <div className="px-4 py-3 rounded-2xl border bg-gray-50 text-gray-500">
          Disponível apenas para médicos ou sem appointmentId.
        </div>
      )}

      <TestDrAIButton className="w-full" />
    </div>
  );
}

// --- "Testar Dr. AI" button (inline) ---
export function TestDrAIButton({ className = "" }: { className?: string }) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "ok"; ts: string }
    | { kind: "fail"; details?: string; ts?: string }
  >({ kind: "idle" });

  const onClick = async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetchHealth();
      if (res.status === "ok") setState({ kind: "ok", ts: res.ts });
      else setState({ kind: "fail", details: res.details, ts: res.ts });
    } catch (e: any) {
      setState({ kind: "fail", details: e.message });
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-4 py-3 rounded-2xl shadow-sm border bg-white hover:bg-gray-50 text-left ${className}`}
    >
      <div className="flex items-center gap-3">
        {state.kind === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : state.kind === "ok" ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : state.kind === "fail" ? (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        ) : (
          <FlaskConical className="h-5 w-5" />
        )}
        <div className="flex flex-col">
          <span className="font-medium">Testar Dr. AI</span>
          {state.kind === "idle" && <span className="text-sm text-gray-500">Roda o healthcheck agora</span>}
          {state.kind === "loading" && <span className="text-sm text-gray-500">Executando teste…</span>}
          {state.kind === "ok" && (
            <span className="text-sm text-green-700">OK · {new Date(state.ts).toLocaleString()}</span>
          )}
          {state.kind === "fail" && (
            <span className="text-sm text-red-700">Falha {state.ts ? `· ${new Date(state.ts).toLocaleString()}` : ""}</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// --- Optional: full test page ---
export default function DrAITester() {
  const [result, setResult] = useState<null | { status: string; details?: string; ts: string }>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const r = await fetchHealth();
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Teste do Dr. AI</h1>
        <DrAIBadge />
      </div>

      <div className="space-y-4">
        <TestDrAIButton />
        <div className="rounded-2xl border p-4 bg-white">
          <div className="text-sm text-gray-500 mb-2">Último resultado</div>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600"><Loader2 className="h-4 w-4 animate-spin"/> Rodando…</div>
          ) : result ? (
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          ) : (
            <div className="text-gray-500">Nenhum teste executado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Example Express-like handler (pseudo / Node) ---
// app.get('/api/dr-ai/health', async (req, res) => {
//   try {
//     // 1) Ping your LLM notes endpoint or a lightweight prompt
//     // 2) Check credentials / env vars are present
//     // 3) Optionally run a tiny inference like echoing a string
//     const ok = true; // replace with real checks
//     if (ok) return res.json({ status: 'ok', ts: new Date().toISOString() });
//     return res.status(200).json({ status: 'fail', details: 'LLM timeout', ts: new Date().toISOString() });
//   } catch (e) {
//     return res.status(500).json({ status: 'fail', details: (e as Error).message, ts: new Date().toISOString() });
//   }
// });
