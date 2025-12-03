// Script de tour corrigido para Replit
(function(){
  const $ = (s)=>document.querySelector(s);
  const overlay = $("#tourOverlay"), spot = $("#tourSpot"), tip = $("#tourTip");
  const tipTitle = $("#tourTitle"), tipText = $("#tourText");
  const btnNext = $("#tourNext"), btnSkip = $("#tourSkip");
  const QS = new URLSearchParams(location.search);

  // --- Auto-detecção de prefixo (/preview/) e extensão (.html)
  const path = location.pathname;
  const prefix = path.startsWith('/preview/') ? '/preview/' : '/';
  const usesHtml = /\.html?$/.test(path);

  // Monta URL segura para um token de página (ex.: 'dashboard', 'agenda'...)
  function urlFor(token){
    if (usesHtml) return prefix + token + '.html';
    return prefix + token;
  }

  // Checa se estou "nesta página" por token (tolerante a /preview e .html)
  function isOn(token){
    return location.pathname.includes(token);
  }

  // Espera elemento existir (evita overlay sem alvo)
  function waitForElement(selector, {tries=30, interval=200}={}){
    return new Promise((resolve,reject)=>{
      let n = 0;
      const iv = setInterval(()=>{
        const el = document.querySelector(selector);
        if (el){ clearInterval(iv); resolve(el); }
        else if (++n>=tries){ clearInterval(iv); reject(new Error('Elemento não encontrado: '+selector)); }
      }, interval);
    });
  }

  function place(el, title, text){
    const r = el.getBoundingClientRect();
    overlay.style.display = 'block';
    spot.style.display = 'block';
    tip.style.display  = 'block';
    spot.style.left = (window.scrollX + r.left - 6) + "px";
    spot.style.top  = (window.scrollY + r.top  - 6) + "px";
    spot.style.width  = (r.width + 12) + "px";
    spot.style.height = (r.height + 12) + "px";
    tipTitle.textContent = title;
    tipText.textContent = text;
    tip.style.left = (window.scrollX + r.left) + "px";
    tip.style.top  = (window.scrollY + r.bottom + 12) + "px";
  }

  // === DEFINIÇÃO DOS TOURS USANDO TOKENS DE ROTA ===
  // use seletores tolerantes: [href*="agenda"] etc.
  const tours = {
    paciente: [
      { token:'dashboard',     sel:'a[href*="agenda"]',           t:'Agenda',            d:'Confira seus horários e próximas consultas.' },
      { token:'agenda',        sel:'a[href*="sala-de-espera"]',   t:'Sala de Espera',    d:'Teste câmera/microfone e aguarde o chamado.' },
      { token:'sala-de-espera',sel:'a[href*="consulta"]',         t:'Consulta Online',   d:'Entre com 1 clique na sala de vídeo segura.' },
      { token:'consulta',      sel:'a[href*="registro-saude"]',   t:'Registro de Saúde', d:'Envie exames e veja seu histórico organizado.' },
      { token:'registro-saude',sel:'a[href*="paciente"]',         t:'Área do Paciente',  d:'Gerencie documentos, prescrições e dados.' }
    ],
    medico: [
      { token:'dashboard',     sel:'a[href*="dashboard"]',        t:'Dashboard',         d:'Visão geral, atalhos para pacientes e laudos.' },
      { token:'dashboard',     sel:'a[href*="agenda"]',           t:'Agenda',            d:'Gerencie horários, confirmações e atendimentos.' },
      { token:'agenda',        sel:'a[href*="medico"]',           t:'Perfil Médico',     d:'Ajuste dados profissionais e configurações.' },
      { token:'medico',        sel:'a[href*="consulta"]',         t:'Atendimento',       d:'Inicie teleconsulta com chat e prescrição.' },
      { token:'consulta',      sel:'a[href*="centro-de-testes"]', t:'Centro de Testes',  d:'Aplique GAD‑7/PHQ‑9 e gere relatórios.' }
    ]
  };

  // Storage/Query para retomar passo
  const K_FLAG='telemed_autotour', K_ROLE='telemed_autotour_role', K_IDX='telemed_autotour_step';

  function saveState(role, idx){
    try { localStorage.setItem(K_FLAG,'1'); localStorage.setItem(K_ROLE,role); localStorage.setItem(K_IDX,String(idx)); } catch(e){}
  }
  function loadState(){
    try {
      return {
        has: localStorage.getItem(K_FLAG)==='1',
        role: localStorage.getItem(K_ROLE),
        idx: Number(localStorage.getItem(K_IDX)||'0')||0
      };
    } catch(e){ return {has:false,role:null,idx:0}; }
  }
  function clearState(){
    try { localStorage.removeItem(K_FLAG); localStorage.removeItem(K_ROLE); localStorage.removeItem(K_IDX); } catch(e){}
  }

  let role=null, steps=[], idx=0;

  async function showStep(){
    const s = steps[idx];
    if (!s){ endTour(); return; }

    // Se estou em outra página, navegar e retomar
    if (!isOn(s.token)){
      overlay.style.display='none'; spot.style.display='none'; tip.style.display='none';
      saveState(role, idx);
      const url = urlFor(s.token) + '?autotour='+encodeURIComponent(role)+'&tourStep='+idx;
      location.assign(url);
      return;
    }

    // Espera alvo
    try {
      const el = await waitForElement(s.sel, {tries:30, interval:200});
      el.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(()=> place(el, s.t, s.d), 250);
      btnNext.textContent = (idx === steps.length-1) ? 'Concluir' : 'Próximo';
    } catch(e){
      // Se não achou, pula para o próximo passo
      idx++;
      showStep();
    }
  }

  function next(){
    idx++;
    if (idx >= steps.length){ endTour(); return; }
    showStep();
  }

  function endTour(){
    overlay.style.display='none'; spot.style.display='none'; tip.style.display='none';
    clearState();
  }

  function startTour(requestedRole, startIndex=0){
    role=requestedRole; steps=(tours[role]||[]);
    if (!steps.length){ alert('Tour não encontrado para: '+role); return; }
    idx=Math.max(0, Math.min(startIndex, steps.length-1));
    saveState(role, idx);
    showStep();
  }

  // Expor para outros scripts
  window._telemedStartTour = (r)=> startTour(r, 0);

  // Botões manuais no guia (se existirem)
  $("#startTourPaciente")?.addEventListener('click', ()=> startTour('paciente', 0));
  $("#startTourMedico")?.addEventListener('click',  ()=> startTour('medico', 0));

  // Botão "Começar Agora" → grava flag (guia)
  $("#btnComecarAgora")?.addEventListener('click', ()=>{
    try { localStorage.setItem(K_FLAG,'1'); localStorage.setItem(K_ROLE,'paciente'); localStorage.setItem(K_IDX,'0'); } catch(e){}
  });

  // ESC para sair
  document.addEventListener('keydown', (ev)=>{ if (ev.key==='Escape') endTour(); });

  btnNext?.addEventListener('click', next);
  btnSkip?.addEventListener('click', endTour);

  // Retomar automaticamente quando a página carrega
  window.addEventListener('load', ()=>{
    const qRole = QS.get('autotour');
    const qStep = Number(QS.get('tourStep')||'0')||0;
    const s = loadState();

    if (qRole){ startTour(qRole, qStep); return; }
    if (s.has && s.role){ startTour(s.role, s.idx); }
  });
})();