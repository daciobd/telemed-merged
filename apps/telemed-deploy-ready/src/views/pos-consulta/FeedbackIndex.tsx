import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * /pos-consulta/feedback — Doc24 → Telemed
 *
 * ✔️ Cartão do paciente (nome/idade/CPF + tempos)
 * ✔️ NPS (0–10) com seleção de score
 * ✔️ Perguntas curtas: dificuldades com paciente, problemas da plataforma
 * ✔️ Checkboxes para áudio/vídeo/sistema lento/outros + campo Observações
 * ✔️ Botões: Voltar à consulta | Enviar e encerrar
 * ✔️ Autosave simples no localStorage
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

const STORAGE_KEY = (pid:string)=> `feedback_${pid}`;

export default function PosConsultaFeedback(){
  const sp = new URLSearchParams(window.location.search);
  const patientId = sp.get("patientId") || "3335602";
  const nome = sp.get("nome") || "Claudio Felipe Montanha Correa";
  const idade = sp.get("idade") || "36";
  const cpf = sp.get("cpf") || "39232384876";
  const espera = sp.get("espera") || "28"; // min
  const atendimento = sp.get("atendimento") || "20"; // min

  const [fb, setFb] = useState<FeedbackData>(()=>{
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY(patientId))||"{}"); }catch{ return {}; }
  }) as any as [FeedbackData, any];

  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY(patientId), JSON.stringify(fb));
  }, [fb, patientId]);

  const set = (patch: Partial<FeedbackData>)=> setFb((f:FeedbackData)=> ({...f, ...patch}));

  const enviar = (e: React.FormEvent)=>{
    e.preventDefault();
    if(fb.nps === null || fb.nps === undefined){
      alert("Selecione um score NPS (0–10).");
      return;
    }
    // Aqui você pode fazer fetch('/api/feedback', {method:'POST', body: JSON.stringify({...fb, patientId})})
    localStorage.removeItem(STORAGE_KEY(patientId));
    window.location.href = "/meus-pacientes-react.html";
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-800">
      {/* Topbar */}
      <header className="w-full bg-[#1282db] text-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold" data-testid="logo-doc24">doc24</div>
          <div className="text-sm" data-testid="titulo-pos-consulta">Pós‑consulta</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        {/* Card do paciente */}
        <section className="mb-6 rounded-xl bg-white shadow-sm">
          <div className="border-b px-5 py-3 text-base font-semibold" data-testid="titulo-atendimento-finalizado">Você finalizou o atendimento</div>
          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded bg-slate-200" data-testid="avatar-paciente" />
                <div>
                  <div className="text-base font-semibold" data-testid="nome-paciente">{nome}</div>
                  <div className="text-sm text-slate-600" data-testid="idade-cpf-paciente">{idade} anos, CPF • {cpf}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-slate-500">Tempo de espera</div>
                <div className="text-slate-800" data-testid="tempo-espera">{espera} minutos</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <div className="text-slate-500">Tempo de atendimento</div>
                <div className="text-slate-800" data-testid="tempo-atendimento">{atendimento} minutos</div>
              </div>
            </div>
          </div>
        </section>

        <form onSubmit={enviar} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* NPS */}
          <section className="rounded-xl bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-2 text-base font-semibold" data-testid="titulo-nps">Por favor, qualifique sua experiência</div>
            <div className="text-sm text-slate-600" data-testid="subtitulo-nps">De 0 a 10, o quanto você recomendaria esta plataforma a um colega?</div>
            <div className="mt-3 flex flex-wrap gap-2" data-testid="botoes-nps">
              {Array.from({length:11}, (_,i)=> i).map((n)=> (
                <button 
                  key={n} 
                  type="button" 
                  onClick={()=> set({nps:n})} 
                  className={`h-9 w-9 rounded-full border text-sm ${fb.nps===n? 'bg-[#1282db] text-white border-[#1282db]':'border-slate-300 hover:bg-slate-50'}`}
                  data-testid={`botao-nps-${n}`}>
                  {n}
                </button>
              ))}
            </div>
            {fb.nps !== null && fb.nps !== undefined && (
              <div className="mt-2 text-sm text-slate-600" data-testid="nps-selecionado">
                Score selecionado: <span className="font-semibold">{fb.nps}</span>
              </div>
            )}
          </section>

          {/* Dificuldades na interação */}
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold" data-testid="titulo-dificuldades">Dificuldades na interação com o paciente?</div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={!!fb.dificuldadeInteracao} 
                  onChange={(e)=> set({dificuldadeInteracao: e.target.checked})}
                  data-testid="checkbox-dificuldade-interacao" />
                <span>Sim</span>
              </label>
            </div>
            <textarea 
              placeholder="Especifique as dificuldades" 
              value={fb.dificuldadeInteracaoObs || ''} 
              onChange={(e)=> set({dificuldadeInteracaoObs: e.target.value})} 
              className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]"
              data-testid="textarea-dificuldade-observacoes" />
          </section>

          {/* Problemas da plataforma */}
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold" data-testid="titulo-problemas-plataforma">Experimentou inconvenientes com a plataforma?</div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={!!fb.problemasPlataforma} 
                  onChange={(e)=> set({problemasPlataforma: e.target.checked})}
                  data-testid="checkbox-problemas-plataforma" />
                <span>Sim</span>
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <label className="inline-flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!!fb.plAudio} 
                  onChange={(e)=> set({plAudio: e.target.checked})}
                  data-testid="checkbox-problema-audio" />
                Dificuldades com a qualidade do áudio
              </label>
              <label className="inline-flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!!fb.plVideo} 
                  onChange={(e)=> set({plVideo: e.target.checked})}
                  data-testid="checkbox-problema-video" />
                Dificuldades com a qualidade do vídeo
              </label>
              <label className="inline-flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!!fb.plLento} 
                  onChange={(e)=> set({plLento: e.target.checked})}
                  data-testid="checkbox-problema-lento" />
                Sistema lento
              </label>
              <label className="inline-flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={!!fb.plOutros} 
                  onChange={(e)=> set({plOutros: e.target.checked})}
                  data-testid="checkbox-problema-outros" />
                Outros
              </label>
            </div>
          </section>

          {/* Observações */}
          <section className="rounded-xl bg-white p-5 shadow-sm md:col-span-2">
            <div className="mb-2 text-sm font-semibold" data-testid="titulo-observacoes">Observações</div>
            <textarea 
              placeholder="Deixe aqui seus comentários" 
              value={fb.obs || ''} 
              onChange={(e)=> set({obs: e.target.value})} 
              className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-[#1282db]"
              data-testid="textarea-observacoes" />
          </section>

          <div className="md:col-span-2 flex items-center justify-end gap-3">
            <a 
              href={`/consulta.html?patientId=${patientId}`} 
              className="rounded-md border px-4 py-2"
              data-testid="botao-seguir-atendendo">
              Seguir atendendo
            </a>
            <button 
              type="submit" 
              className="rounded-md bg-[#1282db] px-4 py-2 text-white hover:bg-[#0e6fb9]"
              data-testid="botao-enviar-encerrar">
              Enviar e encerrar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}