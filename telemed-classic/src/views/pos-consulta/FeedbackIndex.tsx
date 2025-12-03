import React, { useEffect, useState } from "react";

/**
 * /pos-consulta/feedback — Doc24 → Telemed [API-enabled]
 *
 * - NPS 0–10, problemas de plataforma, observações
 * - Autosave em localStorage por paciente
 * - POST /api/feedback (fallback: ignora erro e segue)
 * - Busca dados do paciente para card via /api/pacientes/:id (fallback: /data/pacientes.json + query params)
 */

interface FeedbackData {
  nps: number | null;
  dificuldadeInteracao: boolean;
  dificuldadeInteracaoObs: string;
  problemasPlataforma: boolean;
  plAudio: boolean;
  plVideo: boolean;
  plLento: boolean;
  plOutros: boolean;
  obs: string;
}

const STORAGE_KEY = (pid:string)=> `feedback:${pid}`;

type PacienteCard = { nome?: string; idade?: string; cpf?: string };

export default function PosConsultaFeedbackAPI(){
  const sp = new URLSearchParams(window.location.search);
  const patientId = sp.get("patientId") || "3335602";

  const [card, setCard] = useState<PacienteCard>({
    nome: sp.get("nome") || undefined,
    idade: sp.get("idade") || undefined,
    cpf: sp.get("cpf") || undefined,
  });
  const [espera] = useState(sp.get("espera") || "—");
  const [atendimento] = useState(sp.get("atendimento") || "—");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const [fb, setFb] = useState<FeedbackData>(()=>{
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY(patientId))||"{}"); }catch{ return {}; }
  }) as any as [FeedbackData, any];

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY(patientId), JSON.stringify(fb));
  }, [fb, patientId]);

  // Tenta completar o card via API
  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        // tenta /api/pacientes/:id
        const r = await fetch(`/api/pacientes/${patientId}`);
        if(r.ok){
          const p = await r.json();
          if(!mounted) return;
          setCard((c)=> ({
            nome: c.nome || `${p.nome} ${p.sobrenome}`.trim(),
            idade: c.idade || (p.dataNascimento ? String(new Date().getFullYear() - new Date(p.dataNascimento).getFullYear()) : undefined),
            cpf: c.cpf || p.identificacao
          }));
          return;
        }
        // fallback: /data/pacientes.json
        const s = await fetch(`/data/pacientes.json`);
        if(s.ok){
          const arr = await s.json();
          const found = Array.isArray(arr) ? arr.find((x:any)=> x.idPersona === patientId || x.id === patientId) : null;
          if(found && mounted){
            setCard((c)=> ({
              nome: c.nome || `${found.nome} ${found.sobrenome}`.trim(),
              idade: c.idade || (found.dataNascimento ? String(new Date().getFullYear() - new Date(found.dataNascimento).getFullYear()) : undefined),
              cpf: c.cpf || found.identificacao
            }));
          }
        }
      }catch(e){ /* silencioso em dev */ }
    })();
    return ()=>{ mounted = false; };
  }, [patientId]);

  const set = (patch: Partial<FeedbackData>)=> setFb((f:FeedbackData)=> ({...f, ...patch}));

  const enviar = async (e: React.FormEvent)=>{
    e.preventDefault();
    if(fb.nps === null || fb.nps === undefined){
      alert("Selecione um score NPS (0–10).");
      return;
    }
    setSending(true);
    setError(null);
    try{
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, ...fb, createdAt: new Date().toISOString() })
      }).catch(()=>{});
      localStorage.removeItem(STORAGE_KEY(patientId));
      window.location.href = "/meus-pacientes";
    }catch(e:any){
      setError("Falha ao enviar feedback. Tente novamente.");
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800">
      {/* Topbar */}
      <header className="w-full bg-[#1282db] text-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold">doc24</div>
          <div className="text-sm">Pós‑consulta</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {/* Card do paciente */}
        <section className="mb-6 rounded-xl bg-white shadow-sm">
          <div className="border-b px-5 py-3 text-base font-semibold">Você finalizou o atendimento</div>
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded bg-slate-200" />
                <div>
                  <div className="text-base font-semibold">{card.nome || `Paciente #${patientId}`}</div>
                  <div className="text-sm text-slate-600">{card.idade ? `${card.idade} anos` : "—"}{", CPF • "}{card.cpf || "—"}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-slate-500">Tempo de espera</div><div className="text-slate-800">{espera} minutos</div></div>
              <div className="rounded-lg bg-slate-50 p-3"><div className="text-slate-500">Tempo de atendimento</div><div className="text-slate-800">{atendimento} minutos</div></div>
            </div>
          </div>
        </section>

        {error && <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-900">{error}</div>}

        <form onSubmit={enviar} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* NPS */}
          <section className="rounded-xl bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-2 text-base font-semibold">Por favor, qualifique sua experiência</div>
            <div className="text-sm text-slate-600">De 0 a 10, o quanto você recomendaria esta plataforma a um colega?</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({length:11}, (_,i)=> i).map((n)=> (
                <button key={n} type="button" onClick={()=> set({nps:n})} className={`h-9 w-9 rounded-full border text-sm ${fb.nps===n? 'bg-[#1282db] text-white border-[#1282db]':'border-slate-300 hover:bg-slate-50'}`}>{n}</button>
              ))}
            </div>
          </section>

          {/* Dificuldades na interação */}
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Dificuldades na interação com o paciente?</div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={!!fb.dificuldadeInteracao} onChange={(e)=> set({dificuldadeInteracao: e.target.checked})} />
                <span>Sim</span>
              </label>
            </div>
            <textarea placeholder="Especifique as dificuldades" value={fb.dificuldadeInteracaoObs || ''} onChange={(e)=> set({dificuldadeInteracaoObs: e.target.value})} className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]" />
          </section>

          {/* Problemas da plataforma */}
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Experimentou inconvenientes com a plataforma?</div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={!!fb.problemasPlataforma} onChange={(e)=> set({problemasPlataforma: e.target.checked})} />
                <span>Sim</span>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!fb.plAudio} onChange={(e)=> set({plAudio: e.target.checked})} />Dificuldades com a qualidade do áudio</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!fb.plVideo} onChange={(e)=> set({plVideo: e.target.checked})} />Dificuldades com a qualidade do vídeo</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!fb.plLento} onChange={(e)=> set({plLento: e.target.checked})} />Sistema lento</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!fb.plOutros} onChange={(e)=> set({plOutros: e.target.checked})} />Outros</label>
            </div>
          </section>

          {/* Observações */}
          <section className="rounded-xl bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-2 text-sm font-semibold">Observações</div>
            <textarea placeholder="Deixe aqui seus comentários" value={fb.obs || ''} onChange={(e)=> set({obs: e.target.value})} className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]" />
          </section>

          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <a href={`/consulta?patientId=${patientId}`} className="rounded-md border px-4 py-2">Seguir atendendo</a>
            <button type="submit" disabled={sending} className="rounded-md bg-[#1282db] px-4 py-2 text-white hover:bg-[#0e6fb9] disabled:opacity-60">{sending? "Enviando..." : "Enviar e encerrar"}</button>
          </div>
        </form>
      </main>
    </div>
  );
}