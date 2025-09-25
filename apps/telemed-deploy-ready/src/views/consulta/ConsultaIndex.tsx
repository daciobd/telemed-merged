import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * /consulta — Sala de Videoconsulta (Doc24 → Telemed)
 *
 * ✔️ Layout: vídeo à esquerda + painel de Registro Profissional à direita
 * ✔️ Campos obrigatórios: Queixa, Doença atual, Hipótese diagnóstica (com chips)
 * ✔️ Abas: Conduta, Notas privadas, Exames, Prescrições, Encaminhamento, Arquivos, Contato
 * ✔️ Botão Diretrizes (Dr. AI) com pré-preenchimento da queixa/idade/sexo
 * ✔️ Autosave (localStorage) a cada 10s e onChange
 * ✔️ Ações: Marcar emergência, Finalizar → /pos-consulta/feedback, Voltar
 * ✔️ Mock do vídeo (placeholder) + atalhos de teclado (indicados)
 */

// Utilidades simples
const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

// Validações e sanitização
const MAX_LENGTHS = {
  queixa: 500,
  doencaAtual: 1000,
  conduta: 1000,
  notasPrivadas: 2000,
  exames: 1000,
  prescricoes: 1000,
  encaminhamento: 500,
  contato: 200
};

const sanitizeText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

const validateLength = (text: string, maxLength: number): string => {
  const sanitized = sanitizeText(text);
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
};

class AutoSave {
  timer: any;
  key: string;
  private TTL = 7 * 24 * 3600 * 1000; // 7 dias
  
  constructor(key: string) {
    this.key = key;
  }
  
  save(payload: any) {
    const data = {
      ts: Date.now(),
      data: payload
    };
    localStorage.setItem(this.key, JSON.stringify(data));
  }
  
  load() {
    try {
      const item = localStorage.getItem(this.key);
      if (!item) return {};
      
      const parsed = JSON.parse(item);
      
      // Verifica se é formato antigo (sem timestamp)
      if (!parsed.ts) {
        return parsed; // Retorna dados antigos para compatibilidade
      }
      
      // Verifica TTL
      if (Date.now() - parsed.ts > this.TTL) {
        localStorage.removeItem(this.key); // Remove dados expirados
        return {};
      }
      
      return parsed.data || {};
    } catch {
      return {};
    }
  }
  
  hasExpiredDraft() {
    try {
      const item = localStorage.getItem(this.key);
      if (!item) return false;
      
      const parsed = JSON.parse(item);
      return parsed.ts && (Date.now() - parsed.ts > this.TTL);
    } catch {
      return false;
    }
  }
  
  start(fn: () => any, interval = 10000) {
    this.stop();
    this.timer = setInterval(() => this.save(fn()), interval);
  }
  
  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}

interface Registro {
  queixa: string;
  doencaAtual: string;
  hipoteses: string[]; // CID/CIAP chips
  conduta: string;
  notasPrivadas: string;
  exames: string;
  prescricoes: string;
  encaminhamento: string;
  arquivos: string[];
  contato: string;
}

const CID_SUGESTOES = [
  "F41.1 Ansiedade",
  "F32 Depressão",
  "J00 Resfriado",
  "I10 HAS",
  "E11 DM2",
  "Z76 Acompanhamento",
];

export default function ConsultaDoc24() {
  const sp = new URLSearchParams(window.location.search);
  const patientId = sp.get("patientId") || "3335602";
  const sexo = sp.get("sexo") || "F";
  const idade = Number(sp.get("idade") || 36);

  // Registro com autosave
  const storageKey = `reg_consulta_${patientId}`;
  const autosave = useRef(new AutoSave(storageKey));
  const [reg, setReg] = useState<Registro>(() => ({
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
  }));

  // Load saved data on mount
  useEffect(() => {
    const draft = autosave.current.load();
    if (Object.keys(draft).length > 0) {
      setReg((r) => ({ ...r, ...draft }));
    }
  }, []);

  // Save data whenever reg changes
  useEffect(() => {
    autosave.current.save(reg);
  }, [reg]);

  // Auto-save timer
  useEffect(() => {
    const timer = setInterval(() => {
      autosave.current.save(reg);
    }, 10000);
    return () => clearInterval(timer);
  }, [reg]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+D para diretrizes
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        abrirDiretrizes();
      }
      // Ctrl+S para salvar rascunho manual
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        autosave.current.save(reg);
        // Mostrar feedback visual brevemente
        const toast = document.createElement('div');
        toast.textContent = 'Rascunho salvo!';
        toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md z-50';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [reg]);

  const addHipotese = (h: string) =>
    setReg((r) => ({ ...r, hipoteses: Array.from(new Set([...r.hipoteses, h])) }));
  const rmHipotese = (h: string) =>
    setReg((r) => ({ ...r, hipoteses: r.hipoteses.filter((x) => x !== h) }));

  const abrirDiretrizes = () => {
    const url = `/dr-ai?queixa=${encodeURIComponent(reg.queixa)}&idade=${idade}&sexo=${sexo}`;
    window.open(url, "_blank");
  };

  const finalizar = () => {
    // Validações obrigatórias
    if (!reg.queixa?.trim() || !reg.doencaAtual?.trim() || reg.hipoteses.length === 0) {
      alert("Preencha Queixa Principal, Doença atual e ao menos 1 Hipótese Diagnóstica.");
      return;
    }
    
    // aqui você pode chamar o backend e depois…
    window.location.href = `/pos-consulta-feedback.html?patientId=${patientId}`;
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* Topbar */}
      <header className="w-full bg-[#1282db] text-white">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="text-xl font-bold" data-testid="logo-doc24">doc24</div>
          <div className="text-sm" data-testid="paciente-id">Paciente #{patientId}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Vídeo */}
          <section className="lg:col-span-5 rounded-xl bg-black/90 text-white shadow-md aspect-video flex items-center justify-center" data-testid="video-container">
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
              <div className="text-base font-semibold" data-testid="titulo-registro">Registro Profissional</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={abrirDiretrizes}
                  className="rounded-md border border-sky-500 px-3 py-1.5 text-sky-600 hover:bg-sky-50"
                  data-testid="botao-diretrizes">
                  Diretrizes de Cuidados
                </button>
                <button className="rounded-md bg-rose-600 px-3 py-1.5 text-white" data-testid="botao-emergencia">
                  Marcar como emergência
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium" data-testid="label-queixa">Queixa Principal *</label>
                <textarea
                  value={reg.queixa}
                  onChange={(e) => setReg((r) => ({ ...r, queixa: validateLength(e.target.value, MAX_LENGTHS.queixa) }))}
                  className="min-h-[64px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                  data-testid="textarea-queixa"
                  maxLength={MAX_LENGTHS.queixa}
                  placeholder={`Máximo ${MAX_LENGTHS.queixa} caracteres`}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium" data-testid="label-doenca-atual">Doença atual *</label>
                <textarea
                  value={reg.doencaAtual}
                  onChange={(e) => setReg((r) => ({ ...r, doencaAtual: validateLength(e.target.value, MAX_LENGTHS.doencaAtual) }))}
                  className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                  data-testid="textarea-doenca-atual"
                  maxLength={MAX_LENGTHS.doencaAtual}
                  placeholder={`Máximo ${MAX_LENGTHS.doencaAtual} caracteres`}
                />
              </div>

              {/* Hipóteses com chips */}
              <div>
                <label className="mb-1 block text-sm font-medium" data-testid="label-hipoteses">Hipótese Diagnóstica *</label>
                <div className="flex flex-wrap gap-2" data-testid="chips-hipoteses">
                  {reg.hipoteses.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-700"
                      data-testid={`chip-hipotese-${h.replace(/\s+/g, '-').toLowerCase()}`}>
                      {h}
                      <button onClick={() => rmHipotese(h)} className="ml-1 text-sky-700" data-testid={`remove-hipotese-${h.replace(/\s+/g, '-').toLowerCase()}`}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2" data-testid="sugestoes-cid">
                  {CID_SUGESTOES.map((s) => (
                    <button
                      key={s}
                      onClick={() => addHipotese(s)}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                      data-testid={`sugestao-${s.replace(/\s+/g, '-').toLowerCase()}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Abas simples */}
              <Tabs
                tabs={[
                  {
                    id: "conduta",
                    label: "Conduta Terapêutica",
                    content: (
                      <textarea
                        value={reg.conduta}
                        onChange={(e) => setReg((r) => ({ ...r, conduta: validateLength(e.target.value, MAX_LENGTHS.conduta) }))}
                        className="min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        data-testid="textarea-conduta"
                        maxLength={MAX_LENGTHS.conduta}
                        placeholder={`Máximo ${MAX_LENGTHS.conduta} caracteres`}
                      />
                    ),
                  },
                  {
                    id: "notas",
                    label: "Notas privadas",
                    content: (
                      <div>
                        <div className="mb-2 text-xs text-slate-500">
                          Rótulo: <b>não compartilhado</b>
                        </div>
                        <textarea
                          value={reg.notasPrivadas}
                          onChange={(e) =>
                            setReg((r) => ({ ...r, notasPrivadas: validateLength(e.target.value, MAX_LENGTHS.notasPrivadas) }))
                          }
                          className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                          data-testid="textarea-notas-privadas"
                          maxLength={MAX_LENGTHS.notasPrivadas}
                          placeholder={`Máximo ${MAX_LENGTHS.notasPrivadas} caracteres`}
                        />
                      </div>
                    ),
                  },
                  {
                    id: "exames",
                    label: "Exames",
                    content: (
                      <textarea
                        value={reg.exames}
                        onChange={(e) => setReg((r) => ({ ...r, exames: validateLength(e.target.value, MAX_LENGTHS.exames) }))}
                        className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        data-testid="textarea-exames"
                        maxLength={MAX_LENGTHS.exames}
                        placeholder={`Máximo ${MAX_LENGTHS.exames} caracteres`}
                      />
                    ),
                  },
                  {
                    id: "presc",
                    label: "Prescrições",
                    content: (
                      <textarea
                        value={reg.prescricoes}
                        onChange={(e) => setReg((r) => ({ ...r, prescricoes: validateLength(e.target.value, MAX_LENGTHS.prescricoes) }))}
                        className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        data-testid="textarea-prescricoes"
                        maxLength={MAX_LENGTHS.prescricoes}
                        placeholder={`Máximo ${MAX_LENGTHS.prescricoes} caracteres`}
                      />
                    ),
                  },
                  {
                    id: "enc",
                    label: "Encaminhamento",
                    content: (
                      <textarea
                        value={reg.encaminhamento}
                        onChange={(e) =>
                          setReg((r) => ({ ...r, encaminhamento: validateLength(e.target.value, MAX_LENGTHS.encaminhamento) }))
                        }
                        className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        data-testid="textarea-encaminhamento"
                        maxLength={MAX_LENGTHS.encaminhamento}
                        placeholder={`Máximo ${MAX_LENGTHS.encaminhamento} caracteres`}
                      />
                    ),
                  },
                  {
                    id: "arquivos",
                    label: "Arquivos",
                    content: (
                      <UploadBox
                        arquivos={reg.arquivos}
                        onAdd={(f) => setReg((r) => ({ ...r, arquivos: [...r.arquivos, f] }))}
                      />
                    ),
                  },
                  {
                    id: "contato",
                    label: "Contato",
                    content: (
                      <textarea
                        value={reg.contato}
                        onChange={(e) => setReg((r) => ({ ...r, contato: validateLength(e.target.value, MAX_LENGTHS.contato) }))}
                        className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                        data-testid="textarea-contato"
                        maxLength={MAX_LENGTHS.contato}
                        placeholder={`Máximo ${MAX_LENGTHS.contato} caracteres`}
                      />
                    ),
                  },
                ]}
              />

              {/* Ações */}
              <div className="mt-2 flex items-center justify-end gap-2">
                <a href={`/phr-react.html?id=${patientId}`} className="rounded-md border px-4 py-2" data-testid="botao-ver-phr">
                  Ver PHR
                </a>
                <a href="/meus-pacientes-react.html" className="rounded-md border px-4 py-2" data-testid="botao-voltar">
                  Voltar
                </a>
                <button onClick={finalizar} className="rounded-md bg-rose-600 px-4 py-2 text-white" data-testid="botao-finalizar">
                  Finalizar atendimento
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 text-xs text-slate-500" data-testid="atalhos-teclado">
          Atalhos: <kbd className="rounded border px-1">Ctrl</kbd>+
          <kbd className="rounded border px-1">Enter</kbd> para adicionar hipótese;{" "}
          <kbd className="rounded border px-1">Alt</kbd>+
          <kbd className="rounded border px-1">D</kbd> abre Diretrizes.
        </div>
      </main>
    </div>
  );
}

// ----------------- Componentes auxiliares -----------------

function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = useMemo(() => tabs.find((t) => t.id === active), [active, tabs]);
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 border-b pb-2 text-sm" data-testid="tabs-header">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-md px-3 py-1 ${
              active === t.id
                ? "bg-sky-100 text-sky-700 border border-sky-300"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
            data-testid={`tab-${t.id}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-3" data-testid="tab-content">
        {current?.content}
      </div>
    </div>
  );
}

function UploadBox({
  arquivos,
  onAdd,
}: {
  arquivos: string[];
  onAdd: (f: string) => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const selectFile = () => ref.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onAdd(f.name);
  };
  return (
    <div className="rounded-lg border border-dashed p-6 text-center" data-testid="upload-box">
      <div className="text-sm">
        Arraste e solte um arquivo aqui ou{" "}
        <button onClick={selectFile} className="text-sky-600 underline" data-testid="botao-selecionar-arquivo">
          selecione
        </button>
      </div>
      <input ref={ref} type="file" className="hidden" onChange={onFile} data-testid="input-arquivo" />
      <ul className="mt-3 list-inside list-disc text-left text-sm" data-testid="lista-arquivos">
        {arquivos.map((a) => (
          <li key={a} data-testid={`arquivo-${a}`}>{a}</li>
        ))}
      </ul>
    </div>
  );
}