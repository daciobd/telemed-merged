console.log('🚀 PHR.js CARREGADO E EXECUTANDO!');
console.log('🔧 Iniciando funcionalidade de hover e colapso...');

(async () => {
  const qs = new URLSearchParams(location.search);
  const id = (qs.get("id") || qs.get("patientId") || "").replace(/\D/g,"");
  const app = document.getElementById("app");
  const title = document.getElementById("title");

  console.log('📋 PHR ID:', id);

  if (!id) { 
    app.innerHTML = `<div class="card"><div class="bd">ID ausente.</div></div>`; 
    return; 
  }

  title.textContent = `PHR — ${id}`;

  async function load() {
    console.log('🔄 Carregando dados PHR...');
    try {
      const r = await fetch(`/api/phr/${id}`);
      if (r.ok) {
        console.log('✅ Dados carregados via API');
        return r.json();
      }
    } catch(_) {}
    try {
      const r = await fetch(`/data/phr/${id}.json`);
      if (r.ok) {
        console.log('✅ Dados carregados via arquivo JSON');
        return r.json();
      }
    } catch(_) {}
    console.log('❌ Falha ao carregar dados PHR');
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

  console.log('🏗️ Construindo interface PHR...');

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

  <section class="card"><div class="hd">Equipe de Saúde</div><div class="bd">${list(p.equipe)||"Nenhuma equipe registrada"}</div></section>
  <section class="card"><div class="hd">Alergias</div><div class="bd">${list(p.alergias)||"Nenhuma alergia conhecida"}</div></section>
  <section class="card"><div class="hd">Patologias Atuais</div><div class="bd">${list(p.patologias)||"Nenhuma patologia registrada"}</div></section>
  <section class="card"><div class="hd">Medicação Atual</div><div class="bd">${list(p.medicacoes)||"Nenhuma medicação em uso"}</div></section>
  <div class="small">* Conteúdo de apoio educacional. Não substitui julgamento clínico.</div>
  `;

  console.log('⚡ Aplicando funcionalidade interativa...');

  // Configurar interações
  function wireInteractions() {
    console.log('🔧 CONFIGURANDO INTERAÇÕES...');
    
    const headers = document.querySelectorAll('.card .hd');
    console.log(`🎯 ENCONTRADOS ${headers.length} HEADERS`);
    
    headers.forEach((hd, index) => {
      console.log(`🔨 Configurando header ${index + 1}: "${hd.textContent}"`);
      
      hd.setAttribute('tabindex', '0');
      hd.setAttribute('role', 'button');
      hd.style.cursor = 'pointer';

      function toggle() {
        const bd = hd.parentElement.querySelector('.bd');
        if (!bd) {
          console.log('❌ Elemento .bd não encontrado');
          return;
        }
        
        const isOpen = !bd.hasAttribute('hidden');
        bd.toggleAttribute('hidden', isOpen);
        hd.classList.toggle('is-open', !isOpen);
        
        const status = isOpen ? 'FECHADA' : 'ABERTA';
        console.log(`🔄 Seção "${hd.textContent}" ${status}`);
      }

      hd.addEventListener('click', (e) => {
        console.log(`👆 CLIQUE no header: "${hd.textContent}"`);
        toggle();
      });

      hd.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          console.log(`⌨️ TECLADO (${e.key}) no header: "${hd.textContent}"`);
          e.preventDefault();
          toggle();
        }
      });
    });

    console.log('✅ INTERAÇÕES CONFIGURADAS COM SUCESSO!');
  }

  wireInteractions();
  console.log('🎉 PHR COMPLETAMENTE CARREGADO E FUNCIONAL!');
})();