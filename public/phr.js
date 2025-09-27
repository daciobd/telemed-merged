<script>
(async () => {
  const qs = new URLSearchParams(location.search);
  const id = (qs.get("id") || qs.get("patientId") || "").replace(/\D/g,"");
  const app = document.getElementById("app");
  const title = document.getElementById("title");

  if (!id) { app.innerHTML = `<div class="card"><div class="bd">ID ausente.</div></div>`; return; }

  title.textContent = `PHR — ${id}`;

  async function load() {
    try {
      const r = await fetch(`/api/phr/${id}`);        // tenta API
      if (r.ok) return r.json();
    } catch(_) {}
    try {
      const r = await fetch(`/data/phr/${id}.json`);  // fallback estático
      if (r.ok) return r.json();
    } catch(_) {}
    return null;
  }

  const p = await load();
  if (!p) {
    app.innerHTML = `
      <div class="card"><div class="bd">
        PHR não encontrado para ID <b>${id}</b>.<br><br>
        <a href="/meus-pacientes" class="small">← Voltar para Meus Pacientes</a>
      </div></div>`;
    return;
  }

  title.textContent = `PHR — ${p.nomeCompleto} · ID ${p.idPersona}`;

  const dados = (k,v)=>`<div class="row"><div class="k">${k}</div><div>${v||"—"}</div></div>`;
  const list = a => a && a.length ? a.join(", ") : "—";
  const eventos = (p.eventos||[]).map(ev=>`
    <div class="item">
      <b>${ev.titulo||ev.tipo||"Evento"}</b> — ${new Date(ev.data||Date.now()).toLocaleString()}
      ${ev.profissional?` · ${ev.profissional}`:""} ${ev.especialidade?` · ${ev.especialidade}`:""}
    </div>`).join("") || `<div class="empty">Sem eventos registrados.</div>`;

  app.innerHTML = `
  <section class="card">
    <div class="hd">Dados pessoais</div>
    <div class="bd grid">
      ${dados("Nome", p.nomeCompleto)}
      ${dados("ID Persona", p.idPersona)}
      ${dados("CPF", p.cpf)}
      ${dados("Idade", p.idade)}
      ${dados("Nascimento", p.nascimento)}
      ${dados("Gênero", p.genero)}
    </div>
  </section>

  <section class="card">
    <div class="hd">Histórico de Eventos</div>
    <div class="bd timeline">${eventos}</div>
  </section>

  <section class="card"><div class="hd">Equipe de Saúde</div><div class="bd">${list(p.equipe)}</div></section>
  <section class="card"><div class="hd">Alergias</div><div class="bd">${list(p.alergias)}</div></section>
  <section class="card"><div class="hd">Medicação Atual</div><div class="bd">${list(p.medicacoes)}</div></section>
  <div class="small">* Conteúdo de apoio educacional. Não substitui julgamento clínico.</div>
  `;
})();
</script>
