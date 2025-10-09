// apps/telemed-deploy-ready/assets/js/fix-medico-flow.js
(function () {
  const log = (...a) => console.debug('[fix-medico-flow]', ...a);
  const tEvent = (name, meta={}) => {
    try { window.Telemetry?.event?.({ event_name: name, meta }); } catch {}
  };

  // Util
  const byText = (tag, txt) =>
    [...document.querySelectorAll(tag)]
      .find(el => (el.textContent||'').toLowerCase().includes(txt.toLowerCase()));

  const ensureBtn = (parent, label, href, cta, secondary=false) => {
    let a = byText('a', label);
    if (!a) {
      a = document.createElement('a');
      a.textContent = label;
      a.className = 'btn' + (secondary ? ' btn-secondary' : '');
      parent.appendChild(a);
    }
    a.href = href;
    a.dataset.cta = cta;
    a.addEventListener('click', ()=>tEvent('cta_click',{name:cta}));
    return a;
  };

  const path = location.pathname;

  // 1) Landing – rolagem suave para âncoras
  if (/\/index\.html$/.test(path) || path.endsWith('/')) {
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{
        const tgt = document.querySelector(a.getAttribute('href'));
        if (!tgt) return;
        e.preventDefault();
        tgt.scrollIntoView({behavior:'smooth',block:'start'});
        tEvent('cta_click',{name:'anchor_'+a.getAttribute('href')});
      });
    });
    log('landing anchors wired');
  }

  // 2) Como funciona — Médico
  if (/comofunciona/i.test(path) || /como-funciona-medico/i.test(path)) {
    const container =
      document.querySelector('.actions')
      || document.querySelector('main')
      || document.body;

    // Garante três ações principais:
    ensureBtn(container, 'Fazer cadastro de médico', '/public/cadastro-medico.html', 'med_flow_cadastro');
    ensureBtn(container, 'Ir para Demo Médico', '/public/medico-demo.html', 'med_flow_demo');
    ensureBtn(container, 'Já tenho cadastro', '/public/medico-login.html', 'med_flow_login', true);

    // Esconde/Move o Hub de Integração para não confundir
    const hub = byText('a','Hub');
    if (hub) {
      // move para bloco "opções avançadas"
      let det = byText('details','Opções avançadas')
             || document.querySelector('details');
      if (!det) {
        det = document.createElement('details');
        const sum = document.createElement('summary');
        sum.textContent = 'Opções avançadas (para equipes técnicas)';
        sum.className = 'muted';
        det.appendChild(sum);
        container.appendChild(det);
      }
      const p = document.createElement('p');
      p.appendChild(hub);
      det.appendChild(p);
    }

    tEvent('page_view',{page:path});
    log('como-funciona médico corrigido');
  }

  // 3) Cadastro do médico – corrige botões e adiciona "Já tenho cadastro"
  if (/cadastro-medico/i.test(path)) {
    const wrap =
      document.querySelector('.actions')
      || document.querySelector('form')
      || document.body;

    // Mantém SALVAR e LIMPAR (botões de form), apenas concatena os de navegação:
    ensureBtn(wrap, 'Ir para Demo Médico', '/public/medico-demo.html', 'med_cad_ir_demo');
    ensureBtn(wrap, 'Já tenho cadastro', '/public/medico-login.html', 'med_cad_login', true);

    tEvent('page_view',{page:path});
    log('cadastro médico corrigido');
  }

  // 4) Agenda do médico – corrige links Nome / Informações / Iniciar consulta
  if (/medico-agenda|agenda-medico|agenda\/medico/i.test(path)) {
    const getPid = (el) =>
      el?.dataset?.patientId
      || el?.getAttribute?.('data-patient-id')
      || el?.closest?.('[data-patient-id]')?.dataset?.patientId
      || '';

    // Nome do paciente
    document.querySelectorAll('a, button').forEach(el=>{
      const txt = (el.textContent||'').toLowerCase();
      if (txt.includes('informações do paciente')) {
        el.addEventListener('click', (e)=>{
          e.preventDefault();
          const id = getPid(e.currentTarget);
          location.href = '/phr.html' + (id?('?patient='+encodeURIComponent(id)):'');
        });
      }
    });
    // Links de nome em células
    document.querySelectorAll('[data-patient-id] a').forEach(a=>{
      a.addEventListener('click', (e)=>{
        const id = getPid(e.currentTarget);
        if (!id) return; // deixa seguir se já está certo
        e.preventDefault();
        location.href = '/phr.html?patient='+encodeURIComponent(id);
      });
    });
    // Iniciar consulta (ícone câmera / botão verde)
    const startSelectors = [
      '[data-route="start-consult"]',
      '.btn-start-consult',
      'a,button'
    ];
    document.querySelectorAll(startSelectors.join(',')).forEach(el=>{
      const txt = (el.textContent||'').toLowerCase();
      const isStart = el.matches('[data-route="start-consult"]')
                   || el.classList?.contains('btn-start-consult')
                   || txt.includes('iniciar consulta');
      if (!isStart) return;
      el.addEventListener('click', (e)=>{
        e.preventDefault();
        const id = getPid(e.currentTarget);
        const url = '/consulta/index.html?role=medico'
                  + (id?('&pid='+encodeURIComponent(id)):'')
                  + '&room=auto';
        location.href = url;
      });
    });

    log('agenda: rotas corrigidas');
  }

  // 5) Tela da consulta – MedicalDesk / Receita Certa / Voltar / Faixa
  if (/\/consulta\/index\.html$/i.test(path)) {
    const qs = new URLSearchParams(location.search);
    const pid = qs.get('pid') || '';

    const on = (sel, fn) => document.querySelector(sel)?.addEventListener('click', fn);

    const openBlank = (url) => window.open(url, '_blank', 'noopener');

    // "Abrir Medical Desk"
    let mdBtn = byText('button','Medical Desk') || byText('a','Medical Desk');
    if (mdBtn) {
      mdBtn.addEventListener('click', e=>{
        e.preventDefault();
        const url = '/medical-desk-advanced/index.html' + (pid?('?pid='+encodeURIComponent(pid)):'');
        openBlank(url);
      });
    }

    // "Abrir ReceitaCerta"
    let rcBtn = byText('button','Receita') || byText('a','Receita');
    if (rcBtn) {
      rcBtn.addEventListener('click', e=>{
        e.preventDefault();
        const url = '/public/receita-certa-demo.html' + (pid?('?pid='+encodeURIComponent(pid)):'');
        openBlank(url);
      });
    }

    // "Voltar"
    let backBtn = byText('button','Voltar') || byText('a','Voltar');
    if (backBtn) {
      backBtn.addEventListener('click', e=>{
        e.preventDefault();
        if (document.referrer) history.back(); else location.href = '/public/medico-agenda.html';
      });
    }

    // "Faixa" (abre/fecha notas/soap)
    let faixaBtn = byText('button','Faixa') || byText('a','Faixa');
    if (faixaBtn) {
      faixaBtn.addEventListener('click', e=>{
        e.preventDefault();
        const notes = document.querySelector('.soap-notes') || document.getElementById('faixa-notas');
        if (!notes) return;
        notes.toggleAttribute('data-open');
        notes.scrollIntoView({behavior:'smooth', block:'center'});
      });
    }

    log('consulta: ações da top-bar corrigidas');
  }
})();
