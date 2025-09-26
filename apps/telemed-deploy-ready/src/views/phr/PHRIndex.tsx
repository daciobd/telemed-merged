import React, { useEffect, useMemo, useState } from "react";

/**
 * /phr/:id — PHR (Doc24 → Telemed) [API-enabled]
 *
 * - Busca PHR via GET /api/phr/:id (fallback: /data/phr/:id.json)
 * - Loading, erro, e botão "Tentar novamente"
 * - Timeline de eventos com link para /consulta?patientId=:id&evento=:id
 * - Botões "Iniciar consulta" e "Voltar"
 */

interface Evento {
  id: string;
  tipo: "VIDEO_CONSULTA" | "TEXTO" | "EXAME";
  titulo: string;
  data: string; // ISO
  profissional: string;
  especialidade?: string;
}

interface PHRData {
  idPersona: string;
  nomeCompleto: string;
  cpf?: string;
  idade: number;
  nascimento: string; // ISO
  genero: "Masculino" | "Feminino" | "Outro" | string;
  nacionalidade?: string;
  equipe: string[];
  alergias: string[];
  patologias: string[];
  medicacoes: string[];
  laboratoriais: string[];
  estudos: string[];
  vacinas: string[];
  parametros?: {
    altura?: number | null;
    peso?: number | null;
    cintura?: number | null;
    pa?: string | null;
    imc?: number | null;
  };
  notasPrivadas?: string;
  eventos: Evento[];
}

const Card: React.FC<{ title: string; children?: React.ReactNode; right?: React.ReactNode; tone?: "neutral"|"green"|"red"|"blue" }>=({title,children,right,tone="neutral"})=>{
  const tones: Record<string,string>={
    neutral:"border-slate-200",
    green:"border-emerald-200",
    red:"border-rose-200",
    blue:"border-sky-200",
  };
  return (
    <div className={`rounded-xl border ${tones[tone]} bg-white shadow-sm`}>
      <div className="flex items-center justify-between border-b px-4 py-2 text-slate-700">
        <div className="text-sm font-semibold">{title}</div>
        {right}
      </div>
      <div className="p-4 text-sm text-slate-700">{children}</div>
    </div>
  );
};

export default function PHRDoc24API() {
  const params = new URLSearchParams(window.location.search);
  const pathId = (()=>{
    const m = window.location.pathname.match(/\/phr\/(\w+)/);
    return m?m[1]:null;
  })();
  const id =
    pathId ||
    params.get("patientId") ||   // novo: compat com ?patientId=
    params.get("id") ||          // compat com ?id=
    "3335602";

  const [data, setData] = useState<PHRData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async ()=>{
    setLoading(true); setError(null);
    try{
      // tenta API real
      const r = await fetch(`/api/phr/${id}`);
      if(r.ok){
        const d = await r.json();
        setData(d);
        return;
      }
      // fallback estático
      const s = await fetch(`/data/phr/${id}.json`);
      if(s.ok){
        const d = await s.json();
        setData(d);
        return;
      }
      setData(null);
      setError("PHR não encontrado para este paciente.");
    } catch(e){
      setError("Falha ao carregar PHR. Verifique sua conexão.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  if(loading){
    return (
      <div className="min-h-screen bg-[#f4f6f8]">
        <header className="w-full bg-[#1282db] text-white">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold">doc24</div>
            <div className="text-sm opacity-90"><a className="underline" href="/meus-pacientes">← Voltar</a></div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">
          <div className="rounded-xl bg-white p-4 shadow-sm">Carregando PHR...</div>
        </main>
      </div>
    );
  }

  if(error || !data){
    return (
      <div className="min-h-screen bg-[#f4f6f8]">
        <header className="w-full bg-[#1282db] text-white">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold">doc24</div>
            <div className="text-sm opacity-90"><a className="underline" href="/meus-pacientes">← Voltar</a></div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">
          <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-rose-900">{error || "Erro desconhecido."}</div>
          <button onClick={load} className="rounded-md bg-[#1282db] px-4 py-2 text-white hover:bg-[#0e6fb9]">Tentar novamente</button>
        </main>
      </div>
    );
  }

  const DetalheEvento = (ev: Evento)=> (
    <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold">{ev.titulo}</div>
        <a href={`/consulta?patientId=${data.idPersona}&evento=${ev.id}`} className="text-[12px] text-sky-600 underline">Detalhe</a>
      </div>
      <div className="mt-1 text-[12px] text-slate-600">{ev.especialidade} • {new Date(ev.data).toLocaleString()}</div>
      <div className="text-[12px] text-slate-600">{ev.profissional}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* Topbar */}
      <header className="w-full bg-[#1282db] text-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">doc24</div>
          <div className="text-sm opacity-90">
            <a className="underline" href="/meus-pacientes">← Voltar</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Coluna 1 */}
          <div className="md:col-span-2 space-y-4">
            <Card title="Dados pessoais" right={<a className="text-sky-600 text-sm underline" href="#">Editar</a>}>
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded bg-slate-200" />
                <div>
                  <div className="text-base font-semibold">{data.nomeCompleto}</div>
                  <div className="text-sm text-slate-600">{data.idade} anos, CPF {data.cpf || "-"}</div>
                  <div className="text-sm text-slate-600">Data de nascimento: {new Date(data.nascimento).toLocaleDateString()}</div>
                  <div className="text-sm text-slate-600">Gênero: {data.genero} • Nacionalidade: {data.nacionalidade || "-"}</div>
                </div>
              </div>
            </Card>

            <Card title="Notas privadas" right={<button className="rounded-md border px-3 py-1 text-sm">Adicionar</button>}>
              {data.notasPrivadas ? (
                <div>{data.notasPrivadas}</div>
              ) : (
                <div className="text-slate-500">Sem notas registradas</div>
              )}
            </Card>

            <Card title="Parâmetros básicos" right={<a className="text-sky-600 text-sm underline" href="#">Editar</a>}>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                <div>Altura: <span className="text-slate-500">{data.parametros?.altura ?? "sem dados"}</span></div>
                <div>Peso: <span className="text-slate-500">{data.parametros?.peso ?? "sem dados"}</span></div>
                <div>Pressão Arterial: <span className="text-slate-500">{data.parametros?.pa ?? "sem dados"}</span></div>
                <div>Cintura: <span className="text-slate-500">{data.parametros?.cintura ?? "sem dados"}</span></div>
                <div>I.M.C.: <span className="text-slate-500">{data.parametros?.imc ?? "sem dados"}</span></div>
              </div>
            </Card>

            <Card title="Histórico de Eventos">
              <div className="space-y-3">
                {data.eventos.map((ev)=> (
                  <DetalheEvento key={ev.id} {...ev} />
                ))}
              </div>
            </Card>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <Card title="Equipe de Saúde" tone="green" right={<div className="text-xs text-slate-500">{data.equipe.length} prof.</div>}>
              <ul className="list-inside list-disc text-sm">
                {data.equipe.map((n)=> <li key={n}>{n}</li>)}
              </ul>
            </Card>

            <Card title="Alergias" tone="red" right={<button className="rounded-md border px-2 py-1 text-xs">Adicionar</button>}>
              {data.alergias.length ? (
                <ul className="list-inside list-disc text-sm">{data.alergias.map(a=> <li key={a}>{a}</li>)}</ul>
              ) : <div className="text-slate-500">Sem alergias registradas</div>}
            </Card>

            <Card title="Patologias Atuais" tone="red" right={<button className="rounded-md border px-2 py-1 text-xs">Adicionar</button>}>
              {data.patologias.length ? (
                <ul className="list-inside list-disc text-sm">{data.patologias.map(a=> <li key={a}>{a}</li>)}</ul>
              ) : <div className="text-slate-500">Sem patologias registradas</div>}
            </Card>

            <Card title="Medicação Atual" tone="blue" right={<button className="rounded-md border px-2 py-1 text-xs">Adicionar</button>}>
              {data.medicacoes.length ? (
                <ul className="list-inside list-disc text-sm">{data.medicacoes.map(a=> <li key={a}>{a}</li>)}</ul>
              ) : <div className="text-slate-500">Sem medicações registradas</div>}
            </Card>

            <Card title="Laboratoriais" right={<button className="rounded-md border px-2 py-1 text-xs">Adicionar</button>}>
              {data.laboratoriais.length ? (
                <ul className="list-inside list-disc text-sm">{data.laboratoriais.map(a=> <li key={a}>{a}</li>)}</ul>
              ) : <div className="text-slate-500">Sem laboratoriais registrados</div>}
            </Card>

            <Card title="Estudos" right={<button className="rounded-md border px-2 py-1 text-xs">Adicionar</button>}>
              {data.estudos.length ? (
                <ul className="list-inside list-disc text-sm">{data.estudos.map(a=> <li key={a}>{a}</li>)}</ul>
              ) : <div className="text-slate-500">Sem estudos registrados</div>}
            </Card>

            <Card title="Vacinas" right={<button className="rounded-md border px-2 py-1 text-xs">Adicionar</button>}>
              {data.vacinas.length ? (
                <ul className="list-inside list-disc text-sm">{data.vacinas.map(a=> <li key={a}>{a}</li>)}</ul>
              ) : <div className="text-slate-500">Sem vacinas registradas</div>}
            </Card>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <a href={`/consulta?patientId=${data.idPersona}`} className="rounded-md bg-[#1282db] px-4 py-2 text-white hover:bg-[#0e6fb9]">Iniciar consulta</a>
          <a href="/meus-pacientes" className="rounded-md border px-4 py-2">Voltar</a>
        </div>
      </main>
    </div>
  );
}