console.log('PHR.js carregado!');

(async () => {
  const qs = new URLSearchParams(location.search);
  const id = (qs.get("id") || qs.get("patientId") || "").replace(/\D/g,"");
  const app = document.getElementById("app");
  const title = document.getElementById("title");

  if (!id) { 
    app.innerHTML = `<div class="card"><div class="bd">ID ausente.</div></div>`; 
    return; 
  }

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

  const dados = (k,v) => `<div class="row"><div class="k">${k}</div><div>${v||"—"}</div></div>`;
  const list = a => a && a.length ? a.join(", ") : "—";
  const eventos = (p.eventos||[]).map(ev => `
    <div class="item">
      <b>${ev.titulo||ev.tipo||"Evento"}</b> — ${new Date(ev.data||Date.now()).toLocaleString()}
      ${ev.profissional?` · ${ev.profissional}`:""} ${ev.especialidade?` · ${ev.especialidade}`:""}
    </div>`).join("") || `<div class="empty">Sem eventos registrados.</div>`;

  // Laboratoriais
  const labs = (p.laboratoriais||[]).map(lab => `
    <div class="item">
      <b>${lab.exame||"Exame"}</b> — ${new Date(lab.data||Date.now()).toLocaleString()}
      ${lab.laboratorio ? ` · ${lab.laboratorio}` : ""}
      ${lab.resultado ? `<div class="small"><b>Resultado:</b> ${lab.resultado}</div>` : ""}
    </div>`).join("") || `<div class="empty">Sem exames registrados.</div>`;

  // Estudos
  const est = (p.estudos||[]).map(estudo => `
    <div class="item">
      <b>${estudo.tipo||"Estudo"}</b> — ${new Date(estudo.data||Date.now()).toLocaleString()}
      ${estudo.local ? ` · ${estudo.local}` : ""}
      ${estudo.resultado ? `<div class="small"><b>Resultado:</b> ${estudo.resultado}</div>` : ""}
    </div>`).join("") || `<div class="empty">Sem estudos registrados.</div>`;

  // Vacinas 
  const vac = (p.vacinas||[]).map(vacina => `
    <div class="item">
      <b>${vacina.vacina||"Vacina"}</b> — ${new Date(vacina.data||Date.now()).toLocaleString()}
      ${vacina.lote ? `<div class="small"><b>Lote:</b> ${vacina.lote}</div>` : ""}
    </div>`).join("") || `<div class="empty">Sem vacinas registradas.</div>`;

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
      ` : "" }
    </div>
  `).join("") || `<div class="empty">Sem consultas registradas.</div>`;

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
      ${p.contatos ? dados("Contato", `${p.contatos.telefone||"—"} · ${p.contatos.email||"—"}`) : ""}
      ${p.endereco ? dados("Endereço", `${p.endereco.cidade||"—"} / ${p.endereco.uf||"—"}`) : ""}
    </div>
  </section>

  <section class="card">
    <div class="hd">Parâmetros</div>
    <div class="bd grid">
      ${p.parametros ? Object.entries(p.parametros).map(([k,v]) => dados(k.toUpperCase(),v)).join("") : "—"}
    </div>
  </section>

  <section class="card"><div class="hd">Histórico de Eventos</div><div class="bd timeline">${eventos}</div></section>
  <section class="card"><div class="hd">Consultas</div><div class="bd timeline">${consultas}</div></section>
  <section class="card"><div class="hd">Laboratoriais</div><div class="bd timeline">${labs}</div></section>
  <section class="card"><div class="hd">Estudos</div><div class="bd timeline">${est}</div></section>

  <section class="card"><div class="hd">Equipe de Saúde</div><div class="bd">${list(p.equipe)||"Nenhuma equipe registrada"}</div></section>
  <section class="card"><div class="hd">Alergias</div><div class="bd">${list(p.alergias)||"Nenhuma alergia conhecida"}</div></section>
  <section class="card"><div class="hd">Patologias Atuais</div><div class="bd">${list(p.patologias)||"Nenhuma patologia registrada"}</div></section>
  <section class="card"><div class="hd">Medicação Atual</div><div class="bd">${list(p.medicacoes)||"Nenhuma medicação em uso"}</div></section>
  <section class="card"><div class="hd">Vacinas</div><div class="bd timeline">${vac}</div></section>
  <div class="small">* Conteúdo de apoio educacional. Não substitui julgamento clínico.</div>
  `;

  // ===== após app.innerHTML = `…` =====
  function wireInteractions() {
    console.log('Configurando interações...');
    
    // Torna cada header (.hd) focável e "clicável" (mouse, Enter, Espaço)
    const headers = document.querySelectorAll('.card .hd');
    console.log(`Encontrados ${headers.length} headers`);
    
    headers.forEach(hd => {
      hd.setAttribute('tabindex', '0');
      hd.setAttribute('role', 'button');

      // Abre/fecha a seção ao clicar
      function toggle() {
        const bd = hd.parentElement.querySelector('.bd');
        if (!bd) return;
        
        const isOpen = !bd.hasAttribute('hidden');
        bd.toggleAttribute('hidden', isOpen);
        hd.classList.toggle('is-open', !isOpen);
        
        console.log(`Seção ${hd.textContent} ${isOpen ? 'fechada' : 'aberta'}`);
      }

      // clique do mouse
      hd.addEventListener('click', toggle);

      // teclado
      hd.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });

    // Garante cursor pointer em tudo que pareça botão/anchor dentro do PHR
    document.querySelectorAll('a, button, .btn').forEach(el => {
      el.style.cursor = 'pointer';
    });
  }

  wireInteractions();
})();