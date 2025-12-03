import "./phr-doc24.css";
import React, { useEffect, useState } from "react";

type Phr = {
  idPersona: string;
  nomeCompleto: string;
  cpf?: string;
  idade?: number;
  nascimento?: string;
  genero?: string;
  notasPrivadas?: string;
  parametros?: { altura?:string; peso?:string; pa?:string; cintura?:string; imc?:string };
  eventos?: Array<{ id:string; tipo:string; titulo:string; data:string; profissional?:string; especialidade?:string }>;
  equipe?: string[];
  alergias?: string[];
  patologias?: string[];
  medicacoes?: string[];
};

export default function PHRDoc24() {
  const sp = new URLSearchParams(window.location.search);
  const pathId = (window.location.pathname.match(/\/phr\/(\w+)/) || [])[1];
  const id = (pathId || sp.get("patientId") || sp.get("id") || "3335602").replace(/\D/g,"");
  const [data, setData] = useState<Phr | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/phr/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("404")))
      .then(d => { if (alive) setData(d); })
      .catch(async () => {
        // fallback estático
        try {
          const r = await fetch(`/data/phr/${id}.json`);
          if (!r.ok) throw new Error("no static");
          const d = await r.json();
          if (alive) setData(d);
        } catch {
          if (alive) setErr(`PHR não encontrado para ID: ${id}.`);
        }
      });
    return () => { alive = false; };
  }, [id]);

  if (err) return (
    <div className="phr-wrap" style={{padding:16}}>
      <a href="/meus-pacientes" className="link-back">← Voltar para Meus Pacientes</a>
      <div style={{marginTop:8,color:"#fca5a5"}}>{err}</div>
    </div>
  );

  if (!data) return <div className="phr-wrap" style={{padding:16}}>Carregando PHR…</div>;

  const p = data;
  return (
    <div className="phr-wrap">
      <div className="topbar">
        PHR — {p.nomeCompleto} <span style={{opacity:.8, fontWeight:400}}> · ID Persona: {p.idPersona}</span>
        <a href="/meus-pacientes" className="link-back" style={{float:"right"}}>← Voltar</a>
      </div>

      <div style={{padding:"12px 16px"}}>
        <section className="section">
          <div className="hd">Dados pessoais</div>
          <div className="bd grid-2">
            <div className="row"><div className="k">Nome</div><div>{p.nomeCompleto}</div></div>
            <div className="row"><div className="k">ID Persona</div><div>{p.idPersona}</div></div>
            <div className="row"><div className="k">CPF</div><div>{p.cpf || "—"}</div></div>
            <div className="row"><div className="k">Idade</div><div>{p.idade ?? "—"}</div></div>
            <div className="row"><div className="k">Nascimento</div><div>{p.nascimento || "—"}</div></div>
            <div className="row"><div className="k">Gênero</div><div>{p.genero || "—"}</div></div>
          </div>
        </section>

        <section className="section">
          <div className="hd">Histórico de Eventos</div>
          <div className="bd timeline">
            {(p.eventos?.length ? p.eventos : []).map(ev => (
              <div key={ev.id} className="item">
                <b>{ev.titulo}</b> — {ev.tipo} · {new Date(ev.data).toLocaleString()}
                {ev.profissional && <> · {ev.profissional}</>}
                {ev.especialidade && <> · {ev.especialidade}</>}
              </div>
            )) || "Sem eventos registrados."}
          </div>
        </section>

        <section className="section">
          <div className="hd">Equipe de Saúde</div>
          <div className="bd">{(p.equipe?.length ? p.equipe.join(", ") : "—")}</div>
        </section>

        <section className="section">
          <div className="hd">Alergias</div>
          <div className="bd">{(p.alergias?.length ? p.alergias.join(", ") : "—")}</div>
        </section>

        <section className="section">
          <div className="hd">Medicação Atual</div>
          <div className="bd">{(p.medicacoes?.length ? p.medicacoes.join(", ") : "—")}</div>
        </section>
      </div>
    </div>
  );
}