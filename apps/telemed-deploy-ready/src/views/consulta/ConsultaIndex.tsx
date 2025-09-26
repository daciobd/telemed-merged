import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Consulta — Telemed (Doc24 style) [SECURE PATCH]
 * - Segurança: sanitização HTML/JS, limites de caracteres + hints/contador
 * - Autosave TTL (7d) com namespacing por médico/paciente + compat retro
 * - Guard de rota (role=medico) com redirect para /login e bypass ?skipGuard=1
 * - Validações obrigatórias: Queixa + Doença atual + ≥1 Hipótese
 * - API: GET última consulta, POST /api/consultas (credentials: include)
 * - Redireciona p/ /pos-consulta/feedback preservando todos os query params, com alert + delay 1s
 * - Atalhos: Alt+D (Diretrizes), Ctrl/Cmd+S (Salvar rascunho) + toast
 */

// ----------------- Tipos -----------------
 type Registro = {
  queixa: string;
  doencaAtual: string;
  hipoteses: string[];
  conduta: string;
  notasPrivadas: string;
  exames: string;
  prescricoes: string;
  encaminhamento: string;
  arquivos: string[];
  contato: string;
};

const CID_SUGESTOES = [
  "F41.1 Ansiedade",
  "F32 Depressão",
  "J00 Resfriado",
  "I10 HAS",
  "E11 DM2",
  "Z76 Acompanhamento",
];

// ----------------- Segurança & UX helpers -----------------
const LIMITS = {
  queixa: 500,
  doencaAtual: 1000,
  conduta: 1000,
  notasPrivadas: 2000,
  exames: 1000,
  prescricoes: 1000,
  encaminhamento: 500,
  contato: 200,
} as const;

// remove <script>, handlers on*, "javascript:" e tags HTML
function sanitize(input: string): string {
  if (!input) return "";
  let s = String(input);
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "");
  s = s.replace(/javascript\s*:/gi, "");
  s = s.replace(/<\/?[^>]+>/g, "");
  return s;
}

type Hints = Partial<Record<keyof Registro, string>>;

function useSanitizedField(
  setReg: React.Dispatch<React.SetStateAction<Registro>>,
  setHints: React.Dispatch<React.SetStateAction<Hints>>
) {
  return (field: keyof Registro, max: number) => (raw: string) => {
    const cleaned = sanitize(raw);
    let val = cleaned;
    const notes: string[] = [];
    if (cleaned !== raw) notes.push("Conteúdo potencialmente perigoso foi removido.");
    if (val.length > max) {
      val = val.slice(0, max);
      notes.push(`Limite de ${max} caracteres aplicado.`);
    }
    setReg((r) => ({ ...r, [field]: val }));
    setHints((h) => {
      const next = { ...h };
      if (notes.length) next[field] = notes.join(" ");
      else delete next[field];
      return next;
    });
  };
}

// ----------------- AutoSave com TTL + retro -----------------
const DRAFT_KEY = (doctorId: string, patientId: string) => `tm:reg_consulta:v1:${doctorId}:${patientId}`;

class AutoSave {
  key: string;
  ttlMs: number;
  timer: any;
  constructor(key: string, ttlDays = 7) {
    this.key = key;
    this.ttlMs = ttlDays * 24 * 3600 * 1000;
  }
  save(data: any) {
    localStorage.setItem(this.key, JSON.stringify({ ts: Date.now(), data }));
  }
  load(): any | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // compat retro: draft antigo sem wrapper {ts,data}
      if (parsed && !("ts" in parsed) && (parsed.queixa !== undefined || parsed.doencaAtual !== undefined)) {
        return parsed;
      }
      const { ts, data } = parsed || {};
      if (!ts || Date.now() - ts > this.ttlMs) {
        localStorage.removeItem(this.key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }
  clear() { localStorage.removeItem(this.key); }
  start(fn: () => any, interval = 10000) {
    this.stop();
    this.timer = setInterval(() => this.save(fn()), interval);
  }
  stop() { if (this.timer) clearInterval(this.timer); }
}

// ----------------- Tabs Component -----------------
type Tab = { id: string; label: string; content: React.ReactNode };

function Tabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id || "");
  const activeTab = tabs.find(t => t.id === active) || tabs[0];
  
  return (
    <div>
      <div className="border-b border-slate-200">
        <div className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`pb-2 text-sm font-medium ${
                active === tab.id
                  ? "border-b-2 border-sky-500 text-sky-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        {activeTab?.content}
      </div>
    </div>
  );
}

// ----------------- Componente -----------------
export default function ConsultaSecurePatch() {
  const sp = new URLSearchParams(window.location.search);
  const patientId = sp.get("patientId") || "3335602";
  const sexo = sp.get("sexo") || "F";
  const idade = Number(sp.get("idade") || 36);
  const skipGuard = sp.get("skipGuard") === "1";

  // User hierarquia: query → window.__USER__ → localStorage → default
  const user = (() => {
    try {
      const roleParam = sp.get("role");
      const idParam = sp.get("doctorId");
      if (roleParam || idParam) return { role: roleParam || "medico", id: idParam || "med1" };
      // @ts-ignore
      if ((window as any).__USER__) return (window as any).__USER__;
      const fromStorage = JSON.parse(localStorage.getItem("user") || "{}");
      return { role: fromStorage.role || "medico", id: fromStorage.id || "med1", name: fromStorage.name || "Médico(a)" };
    } catch { return { role: "medico", id: "med1" }; }
  })();

  // Guard
  useEffect(() => {
    if (!skipGuard && user?.role !== "medico") {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${redirect}`;
    }
  }, [skipGuard, user?.role]);

  const draftKey = DRAFT_KEY(user.id || "med1", patientId);
  const autosave = useRef(new AutoSave(draftKey, 7));

  const emptyReg: Registro = {
    queixa: "",
    doencaAtual: "",
    hipoteses: [],
    conduta: "",
    notasPrivadas: "",
    exames: "",
    prescricoes: "",
    encaminhamento: "",
    arquivos: [],
    contato: "",
  };

  const [reg, setReg] = useState<Registro>(emptyReg);
  const [hints, setHints] = useState<Hints>({});
  const [draftFound, setDraftFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const updateField = useSanitizedField(setReg, setHints);

  // Inicialização: local vs servidor + iniciar autosave
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const localDraft = autosave.current.load();
        let serverReg: Registro | null = null;
        try {
          const res = await fetch(`/api/consultas?patientId=${encodeURIComponent(patientId)}&_sort=createdAt&_order=desc&_limit=1`, { credentials: "include" });
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list[0]?.registro) serverReg = list[0].registro as Registro;
          }
        } catch {}

        if (!mounted) return;
        if (localDraft && !serverReg) { setReg({ ...emptyReg, ...localDraft }); setDraftFound(true); }
        else if (!localDraft && serverReg) { setReg({ ...emptyReg, ...serverReg }); }
        else if (localDraft && serverReg) { setReg({ ...emptyReg, ...serverReg }); setDraftFound(true); }
        else { setReg(emptyReg); }
      } catch { setError("Falha ao carregar dados iniciais."); }
      finally { if (mounted) setLoading(false); }
    })();

    autosave.current.start(() => reg, 10000);
    return () => { mounted = false; autosave.current.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Persiste on-change
  useEffect(() => { autosave.current.save(reg); }, [reg]);

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { // salvar rascunho
        e.preventDefault();
        autosave.current.save(reg);
        setToast("Rascunho salvo");
        setTimeout(() => setToast(null), 1500);
      }
      if (e.altKey && e.key.toLowerCase() === "d") { // diretrizes
        e.preventDefault();
        abrirDiretrizes();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reg]);

  const restoreLocalDraft = () => { const d = autosave.current.load(); if (d) setReg((r) => ({ ...r, ...d })); setDraftFound(false); };
  const discardLocalDraft = () => { autosave.current.clear(); setDraftFound(false); };

  const addHipotese = (h: string) => setReg((r) => ({ ...r, hipoteses: Array.from(new Set([...r.hipoteses, h])) }));
  const rmHipotese = (h: string) => setReg((r) => ({ ...r, hipoteses: r.hipoteses.filter((x) => x !== h) }));

  const abrirDiretrizes = () => {
    const url = `/dr-ai?queixa=${encodeURIComponent(reg.queixa)}&idade=${idade}&sexo=${sexo}`;
    window.open(url, "_blank");
  };

  const finalizar = async () => {
    if (!reg.queixa?.trim() || !reg.doencaAtual?.trim() || reg.hipoteses.length === 0) {
      alert("Preencha Queixa, Doença atual e pelo menos 1 Hipótese.");
      return;
    }
    try {
      setLoading(true); setError(null);
      const payload = { id: `c_${Date.now()}`, patientId, doctorId: user.id || "med1", registro: reg, createdAt: new Date().toISOString() };
      await fetch("/api/consultas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), credentials: "include" }).catch(()=>{});
      autosave.current.clear();
      // Preserva todos os params
      const preserved = new URLSearchParams(window.location.search);
      if (!preserved.get("patientId")) preserved.set("patientId", patientId);
      alert("✅ Consulta finalizada com sucesso!");
      setTimeout(() => { window.location.href = `/pos-consulta/feedback?${preserved.toString()}`; }, 1000);
    } catch { setError("Não foi possível finalizar. Tente novamente."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md bg-green-600 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Topbar */}
      <header className="w-full bg-[#1282db] text-white">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="text-xl font-bold">doc24</div>
          <div className="text-sm">Paciente #{patientId}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        {/* Banner rascunho / erro */}
        {draftFound && (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            Rascunho local encontrado. Você quer <button onClick={restoreLocalDraft} className="underline">restaurar</button> ou <button onClick={discardLocalDraft} className="underline">descartar</button>?
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-900">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Vídeo */}
          <section className="lg:col-span-5 rounded-xl bg-black/90 text-white shadow-md aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="mb-2 text-sm opacity-80">Pré-visualização de vídeo</div>
              <div className="text-3xl font-semibold">🎥</div>
              <div className="mt-2 text-xs opacity-70">Integre seu módulo de chamada aqui</div>
            </div>
          </section>

          {/* Registro Profissional */}
          <section className="lg:col-span-7 rounded-xl bg-white shadow-md">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-base font-semibold">Registro Profissional</div>
              <div className="flex items-center gap-2">
                <button onClick={abrirDiretrizes} className="rounded-md border border-sky-500 px-3 py-1.5 text-sky-600 hover:bg-sky-50" data-testid="button-diretrizes">Diretrizes de Cuidados</button>
                <button className="rounded-md bg-rose-600 px-3 py-1.5 text-white" data-testid="button-emergencia">Marcar como emergência</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4">
              {/* Queixa */}
              <div>
                <label className="mb-1 block text-sm font-medium">Queixa Principal *</label>
                <textarea value={reg.queixa} onChange={(e)=> updateField("queixa", LIMITS.queixa)(e.target.value)} className="min-h-[64px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" data-testid="textarea-queixa" />
                <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.queixa}</span><span className="text-slate-500">{reg.queixa.length}/{LIMITS.queixa}</span></div>
              </div>

              {/* Doença atual */}
              <div>
                <label className="mb-1 block text-sm font-medium">Doença atual *</label>
                <textarea value={reg.doencaAtual} onChange={(e)=> updateField("doencaAtual", LIMITS.doencaAtual)(e.target.value)} className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" data-testid="textarea-doenca" />
                <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.doencaAtual}</span><span className="text-slate-500">{reg.doencaAtual.length}/{LIMITS.doencaAtual}</span></div>
              </div>

              {/* Hipóteses */}
              <div>
                <label className="mb-1 block text-sm font-medium">Hipótese Diagnóstica *</label>
                <div className="flex flex-wrap gap-2">
                  {reg.hipoteses.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700" data-testid={`chip-hipotese-${h}`}>
                      {h}
                      <button onClick={() => rmHipotese(h)} className="ml-1 text-sky-700" data-testid={`button-remove-${h}`}>×</button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CID_SUGESTOES.map((s) => (
                    <button key={s} onClick={() => addHipotese(s)} className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50" data-testid={`button-add-${s}`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Abas */}
              <Tabs
                tabs={[
                  { id: "conduta", label: "Conduta Terapêutica", content: (
                    <div>
                      <textarea value={reg.conduta} onChange={(e)=> updateField("conduta", LIMITS.conduta)(e.target.value)} className="min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" data-testid="textarea-conduta" />
                      <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.conduta}</span><span className="text-slate-500">{reg.conduta.length}/{LIMITS.conduta}</span></div>
                    </div>
                  )},
                  { id: "notas", label: "Notas privadas", content: (
                    <div>
                      <div className="mb-2 text-xs text-slate-500">Rótulo: <b>não compartilhado</b></div>
                      <textarea value={reg.notasPrivadas} onChange={(e)=> updateField("notasPrivadas", LIMITS.notasPrivadas)(e.target.value)} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" data-testid="textarea-notas" />
                      <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.notasPrivadas}</span><span className="text-slate-500">{reg.notasPrivadas.length}/{LIMITS.notasPrivadas}</span></div>
                    </div>
                  )},
                  { id: "exames", label: "Exames", content: (
                    <div>
                      <textarea value={reg.exames} onChange={(e)=> updateField("exames", LIMITS.exames)(e.target.value)} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" data-testid="textarea-exames" />
                      <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.exames}</span><span className="text-slate-500">{reg.exames.length}/{LIMITS.exames}</span></div>
                    </div>
                  )},
                  { id: "presc", label: "Prescrições", content: (
                    <div>
                      <textarea value={reg.prescricoes} onChange={(e)=> updateField("prescricoes", LIMITS.prescricoes)(e.target.value)} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" data-testid="textarea-prescricoes" />
                      <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.prescricoes}</span><span className="text-slate-500">{reg.prescricoes.length}/{LIMITS.prescricoes}</span></div>
                    </div>
                  )},
                  { id: "encaminhamento", label: "Encaminhamento", content: (
                    <div>
                      <textarea value={reg.encaminhamento} onChange={(e)=> updateField("encaminhamento", LIMITS.encaminhamento)(e.target.value)} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" data-testid="textarea-encaminhamento" />
                      <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.encaminhamento}</span><span className="text-slate-500">{reg.encaminhamento.length}/{LIMITS.encaminhamento}</span></div>
                    </div>
                  )},
                  { id: "arquivos", label: "Arquivos", content: (
                    <div className="text-center py-8 text-slate-500">
                      <div className="text-2xl mb-2">📎</div>
                      <div>Nenhum arquivo anexado</div>
                      <button className="mt-2 text-sky-600 text-sm underline" data-testid="button-upload">Anexar arquivo</button>
                    </div>
                  )},
                  { id: "contato", label: "Contato do paciente", content: (
                    <div>
                      <textarea value={reg.contato} onChange={(e)=> updateField("contato", LIMITS.contato)(e.target.value)} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" placeholder="Telefone, e-mail, observações de contato..." data-testid="textarea-contato" />
                      <div className="mt-1 flex items-center justify-between text-xs"><span className="text-amber-700">{hints.contato}</span><span className="text-slate-500">{reg.contato.length}/{LIMITS.contato}</span></div>
                    </div>
                  )},
                ]}
              />

              {/* Botões */}
              <div className="mt-4 flex items-center justify-end gap-3">
                <a href="/meus-pacientes" className="rounded-md border px-4 py-2" data-testid="button-voltar">Voltar</a>
                <button onClick={finalizar} disabled={loading} className="rounded-md bg-[#1282db] px-4 py-2 text-white hover:bg-[#0e6fb9] disabled:opacity-60" data-testid="button-finalizar">
                  {loading ? "Finalizando..." : "Finalizar consulta"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}