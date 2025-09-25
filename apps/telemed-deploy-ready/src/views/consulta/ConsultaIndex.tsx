import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Consulta — Telemed (Doc24 style) [PATCHED]
 * - Layout vídeo + Registro Profissional
 * - Campos: Queixa, Doença atual, Hipóteses (chips CID/CIAP)
 * - Abas: Conduta, Notas, Exames, Prescrições, Encaminhamento, Arquivos, Contato
 * - Diretrizes de Cuidados (Dr. AI) com prefill
 * - Autosave localStorage com TTL + namespacing por médico/paciente
 * - Route guard (role=medico) com bypass via ?skipGuard=1
 * - Finalizar: valida obrigatórios, POST /api/consultas e redireciona para /pos-consulta/feedback
 */

// ----------------- Helpers -----------------
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

const CID_SUGESTOES = ["F41.1 Ansiedade","F32 Depressão","J00 Resfriado","I10 HAS","E11 DM2","Z76 Acompanhamento"];

// Namespacing draft keys: tm:reg_consulta:v1:{doctorId}:{patientId}
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
      const { ts, data } = JSON.parse(raw);
      if (!ts || Date.now() - ts > this.ttlMs) {
        localStorage.removeItem(this.key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }
  clear() {
    localStorage.removeItem(this.key);
  }
  start(fn: () => any, interval = 10000) {
    this.stop();
    this.timer = setInterval(() => this.save(fn()), interval);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

export default function ConsultaDoc24Patched() {
  const sp = new URLSearchParams(window.location.search);
  const patientId = sp.get("patientId") || "3335602";
  const sexo = sp.get("sexo") || "F";
  const idade = Number(sp.get("idade") || 36);
  const skipGuard = sp.get("skipGuard") === "1";

  // User (simplificado): pode vir de um global, querystring ou localStorage
  const user = (() => {
    try {
      // prioridade: query -> window.__USER__ -> localStorage
      const roleParam = sp.get("role");
      const idParam = sp.get("doctorId");
      if (roleParam || idParam) return { role: roleParam || "medico", id: idParam || "med1" };
      // @ts-ignore
      if ((window as any).__USER__) return (window as any).__USER__;
      const fromStorage = JSON.parse(localStorage.getItem("user") || "{}");
      return { role: fromStorage.role || "medico", id: fromStorage.id || "med1", name: fromStorage.name || "Médico(a)" };
    } catch {
      return { role: "medico", id: "med1" };
    }
  })();

  // Route guard
  useEffect(() => {
    if (!skipGuard && user?.role !== "medico") {
      window.location.href = "/login";
    }
  }, [skipGuard, user?.role]);

  // Autosave
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
  const [draftFound, setDraftFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial: prefer server (última consulta do paciente), mas oferece rascunho local se existir
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Busca rascunho local (se válido)
        const localDraft = autosave.current.load();

        // Opcional: tentar buscar uma última consulta do backend (se existir API)
        let serverReg: Registro | null = null;
        try {
          const res = await fetch(`/api/consultas?patientId=${encodeURIComponent(patientId)}&_sort=createdAt&_order=desc&_limit=1`);
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list) && list[0]?.registro) {
              serverReg = list[0].registro as Registro;
            }
          }
        } catch {
          // silencia erros de dev
        }

        if (!mounted) return;

        if (localDraft && !serverReg) {
          setReg({ ...emptyReg, ...localDraft });
          setDraftFound(true);
        } else if (!localDraft && serverReg) {
          setReg({ ...emptyReg, ...serverReg });
        } else if (localDraft && serverReg) {
          // Se ambos existem, prioriza server e permite restaurar local
          setReg({ ...emptyReg, ...serverReg });
          setDraftFound(true); // mostra banner oferecendo restaurar
        } else {
          setReg(emptyReg);
        }
      } catch (e: any) {
        setError("Falha ao carregar dados iniciais.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    autosave.current.start(() => reg, 10000);
    return () => {
      mounted = false;
      autosave.current.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Save on change
  useEffect(() => {
    autosave.current.save(reg);
  }, [reg]);

  const restoreLocalDraft = () => {
    const localDraft = autosave.current.load();
    if (localDraft) setReg((r) => ({ ...r, ...localDraft }));
    setDraftFound(false);
  };
  const discardLocalDraft = () => {
    autosave.current.clear();
    setDraftFound(false);
  };

  const addHipotese = (h: string) => setReg((r) => ({ ...r, hipoteses: Array.from(new Set([...r.hipoteses, h])) }));
  const rmHipotese = (h: string) => setReg((r) => ({ ...r, hipoteses: r.hipoteses.filter((x) => x !== h) }));

  const abrirDiretrizes = () => {
    const url = `/dr-ai?queixa=${encodeURIComponent(reg.queixa)}&idade=${idade}&sexo=${sexo}`;
    window.open(url, "_blank");
  };

  const finalizar = async () => {
    // valida obrigatórios
    if (!reg.queixa?.trim() || !reg.doencaAtual?.trim() || reg.hipoteses.length === 0) {
      alert("Preencha Queixa, Doença atual e pelo menos 1 Hipótese.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // envia consulta (idempotente simples: client-side id)
      const payload = {
        id: `c_${Date.now()}`,
        patientId,
        doctorId: user.id || "med1",
        registro: reg,
        createdAt: new Date().toISOString(),
      };
      await fetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(()=>{}); // ignora erro em dev

      // opcional: limpar rascunho
      autosave.current.clear();

      // redireciona p/ feedback (leva alguns dados úteis)
      const q = new URLSearchParams({
        patientId,
        idade: String(idade),
        sexo: String(sexo),
      }).toString();
      window.location.href = `/pos-consulta/feedback?${q}`;
    } catch (e: any) {
      setError("Não foi possível finalizar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* Topbar */}
      <header className="w-full bg-[#1282db] text-white">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="text-xl font-bold">doc24</div>
          <div className="text-sm">Paciente #{patientId}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        {/* Banner de rascunho */}
        {draftFound && (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            Rascunho local encontrado. Você quer <button onClick={restoreLocalDraft} className="underline">restaurar</button> ou{" "}
            <button onClick={discardLocalDraft} className="underline">descartar</button>?
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-900">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Vídeo */}
          <section className="lg:col-span-5 rounded-xl bg-black/90 text-white shadow-md aspect-video flex items-center justify-center">
            {/* Substitua pelo seu componente WebRTC */}
            <div className="text-center">
              <div className="mb-2 text-sm opacity-80">Pré-visualização de vídeo</div>
              <div className="text-3xl font-semibold">🎥</div>
              <div className="mt-2 text-xs opacity-70">Use seu módulo de chamada aqui</div>
            </div>
          </section>

          {/* Registro Profissional */}
          <section className="lg:col-span-7 rounded-xl bg-white shadow-md">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-base font-semibold">Registro Profissional</div>
              <div className="flex items-center gap-2">
                <button onClick={abrirDiretrizes} className="rounded-md border border-sky-500 px-3 py-1.5 text-sky-600 hover:bg-sky-50">
                  Diretrizes de Cuidados
                </button>
                <button className="rounded-md bg-rose-600 px-3 py-1.5 text-white">Marcar como emergência</button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Queixa Principal *</label>
                <textarea value={reg.queixa} onChange={(e) => setReg((r) => ({ ...r, queixa: e.target.value }))} className="min-h-[64px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Doença atual *</label>
                <textarea value={reg.doencaAtual} onChange={(e) => setReg((r) => ({ ...r, doencaAtual: e.target.value }))} className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
              </div>

              {/* Hipóteses com chips */}
              <div>
                <label className="mb-1 block text-sm font-medium">Hipótese Diagnóstica *</label>
                <div className="flex flex-wrap gap-2">
                  {reg.hipoteses.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700">
                      {h}
                      <button onClick={() => rmHipotese(h)} className="ml-1 text-sky-700">×</button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CID_SUGESTOES.map((s) => (
                    <button key={s} onClick={() => addHipotese(s)} className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50">{s}</button>
                  ))}
                </div>
              </div>

              {/* Abas */}
              <Tabs
                tabs={[
                  { id: "conduta", label: "Conduta Terapêutica", content: (
                    <textarea value={reg.conduta} onChange={(e) => setReg((r) => ({ ...r, conduta: e.target.value }))} className="min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
                  )},
                  { id: "notas", label: "Notas privadas", content: (
                    <div>
                      <div className="mb-2 text-xs text-slate-500">Rótulo: <b>não compartilhado</b></div>
                      <textarea value={reg.notasPrivadas} onChange={(e) => setReg((r) => ({ ...r, notasPrivadas: e.target.value }))} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
                    </div>
                  )},
                  { id: "exames", label: "Exames", content: (
                    <textarea value={reg.exames} onChange={(e) => setReg((r) => ({ ...r, exames: e.target.value }))} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
                  )},
                  { id: "presc", label: "Prescrições", content: (
                    <textarea value={reg.prescricoes} onChange={(e) => setReg((r) => ({ ...r, prescricoes: e.target.value }))} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
                  )},
                  { id: "enc", label: "Encaminhamento", content: (
                    <textarea value={reg.encaminhamento} onChange={(e) => setReg((r) => ({ ...r, encaminhamento: e.target.value }))} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
                  )},
                  { id: "arquivos", label: "Arquivos", content: (
                    <UploadBox arquivos={reg.arquivos} onAdd={(f) => setReg((r) => ({ ...r, arquivos: [...r.arquivos, f] }))} />
                  )},
                  { id: "contato", label: "Contato", content: (
                    <textarea value={reg.contato} onChange={(e) => setReg((r) => ({ ...r, contato: e.target.value }))} className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500" />
                  )},
                ]}
              />

              {/* Ações */}
              <div className="mt-2 flex items-center justify-end gap-2">
                <a href={`/phr/${patientId}`} className="rounded-md border px-4 py-2">Ver PHR</a>
                <a href="/meus-pacientes" className="rounded-md border px-4 py-2">Voltar</a>
                <button onClick={finalizar} disabled={loading} className="rounded-md bg-rose-600 px-4 py-2 text-white disabled:opacity-60">
                  {loading ? "Salvando..." : "Finalizar atendimento"}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Atalhos: <kbd className="rounded border px-1">Ctrl</kbd>+<kbd className="rounded border px-1">Enter</kbd> para adicionar hipótese; <kbd className="rounded border px-1">Alt</kbd>+<kbd className="rounded border px-1">D</kbd> abre Diretrizes.
        </div>
      </main>
    </div>
  );
}

// ----------------- UI Helpers -----------------
function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = useMemo(() => tabs.find((t) => t.id === active), [active, tabs]);
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 border-b pb-2 text-sm">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={`rounded-md px-3 py-1 ${active === t.id ? "bg-sky-100 text-sky-700 border border-sky-300" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-3">{current?.content}</div>
    </div>
  );
}

function UploadBox({ arquivos, onAdd }: { arquivos: string[]; onAdd: (f: string) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const selectFile = () => ref.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onAdd(f.name);
  };
  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <div className="text-sm">
        Arraste e solte um arquivo aqui ou{" "}
        <button onClick={selectFile} className="text-sky-600 underline">selecione</button>
      </div>
      <input ref={ref} type="file" className="hidden" onChange={onFile} />
      <ul className="mt-3 list-inside list-disc text-left text-sm">
        {arquivos.map((a) => (<li key={a}>{a}</li>))}
      </ul>
    </div>
  );
}