(async () => {
  const qs = new URLSearchParams(location.search);
  const id = (qs.get("id") || qs.get("patientId") || "").replace(/\D/g,"");
  const app = document.getElementById("app");
  const title = document.getElementById("title");
  if (!id) { app.innerHTML = `<div class="card"><div class="bd">ID ausente.</div></div>`; return; }
  title.textContent = `PHR — ${id}`;

  async function load() {
    try { 
      const r = await fetch(`/api/phr/${id}`); 
      if (r.ok) return r.json(); 
    } catch(_){}
    try { 
      const r = await fetch(`/data/phr/${id}.json`); 
      if (r.ok) return r.json(); 
    } catch(_){}
    return null;
  }

  const p = await load();
  if (!p) { app.innerHTML = `<div class="card"><div class="bd">PHR não encontrado para ID <b>${id}</b>.<br><br><a href="/meus-pacientes" class="small">← Voltar</a></div></div>`; return; }
  title.textContent = `PHR — ${p.nomeCompleto} · ID ${p.idPersona}`;

  const dados = (k,v)=>`<div class="row"><div class="k">${k}</div><div>${v||"—"}</div></div>`;
  const list  = a => a&&a.length ? a.map(x=>typeof x==="string"?x:(x.rotulo||x.vacina||x.tipo)).join(", ") : "—";
  const rows  = (arr, cols) => arr && arr.length
    ? arr.map(o => `<div class="item">${cols.map(c => `<b>${c[0]}:</b> ${o[c[1]]||"—"}`).join(" · ")}</div>`).join("")
    : `<div class="empty">Sem registros.</div>`;

  // Eventos (timeline)
  const eventos = rows(p.eventos, [["Evento","titulo"],["Tipo","tipo"],["Data","data"],["Prof.","profissional"],["Esp.","especialidade"]]);

  // Laboratoriais / Estudos / Vacinas
  const labs   = rows(p.laboratoriais, [["Data","data"],["Exame","exame"],["Resultado","resultado"],["Valores","valores"],["Lab","laboratorio"]]);
  const est    = rows(p.estudos, [["Data","data"],["Tipo","tipo"],["Achados","achados"],["Serviço","servico"]]);
  const vac    = rows(p.vacinas, [["Vacina","vacina"],["Data","data"]]);

  // Consultas com registro
  const consultas = (p.consultas||[]).map(c => `
    <div class="item">
      <b>${c.especialidade||"Consulta"}</b> — ${new Date(c.data||Date.now()).toLocaleString()} · ${c.profissional||"—"}
      ${c.registro ? `
        <div class="small"><b>Queixa:</b> ${c.registro.queixa||"—"} · <b>Doença atual:</b> ${c.registro.doencaAtual||"—"}</div>
        <div class="small"><b>Hipóteses:</b> ${list(c.registro.hipoteses)||"—"}</div>
        <div class="small"><b>Conduta:</b> ${c.registro.conduta||"—"}</div>
        <div class="small"><b>Prescrições:</b> ${c.registro.prescricoes?.map(p=>`${p.produto} — ${p.posologia}`).join("; ")||"—"}</div>
        <div class="small"><b>Encaminhamentos:</b> ${c.registro.encaminhamentos?.map(e=>`${e.destino} (${e.motivo||""})`).join("; ")||"—"}</div>
      `: "" }
    </div>
  `).join("") || `<div class="empty">Sem consultas registradas.</div>`;

  app.innerHTML = `
    <section class="card"><div class="hd">Dados pessoais</div>
      <div class="bd grid">
        ${dados("Nome", p.nomeCompleto)} ${dados("ID Persona", p.idPersona)}
        ${dados("CPF", p.cpf)} ${dados("Idade", p.idade)}
        ${dados("Nascimento", p.nascimento)} ${dados("Gênero", p.genero)}
        ${p.contatos ? dados("Contato", `${p.contatos.telefone||"—"} · ${p.contatos.email||"—"}`) : ""}
        ${p.endereco ? dados("Endereço", `${p.endereco.cidade||"—"} / ${p.endereco.uf||"—"}`) : ""}
      </div>
    </section>

    <section class="card"><div class="hd">Parâmetros</div>
      <div class="bd grid">
        ${p.parametros ? Object.entries(p.parametros).map(([k,v])=>dados(k.toUpperCase(),v)).join("") : "—"}
      </div>
    </section>

    <section class="card"><div class="hd">Histórico de Eventos</div><div class="bd timeline">${eventos}</div></section>
    <section class="card"><div class="hd">Consultas</div><div class="bd timeline">${consultas}</div></section>
    <section class="card"><div class="hd">Laboratoriais</div><div class="bd timeline">${labs}</div></section>
    <section class="card"><div class="hd">Estudos</div><div class="bd timeline">${est}</div></section>

    <section class="card"><div class="hd">Equipe de Saúde</div><div class="bd">${list(p.equipe)}</div></section>
    <section class="card"><div class="hd">Alergias</div><div class="bd">${list(p.alergias)}</div></section>
    <section class="card"><div class="hd">Patologias Atuais</div><div class="bd">${list(p.patologias)}</div></section>
    <section class="card"><div class="hd">Medicação Atual</div><div class="bd">${list(p.medicacoes)}</div></section>
    <section class="card"><div class="hd">Vacinas</div><div class="bd timeline">${vac}</div></section>
    ${p.notasPrivadas ? `<div class="small">Notas privadas: ${p.notasPrivadas}</div>` : ""}
  `;
})();