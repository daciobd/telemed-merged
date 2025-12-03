/*
 * TeleMed — Dr. AI Integration Widget (vanilla JS)
 * v2 — expõe window.showModal e window.renderAnswer para outras páginas/scripts
 *
 * COMO USAR:
 * 1) Salve este arquivo em: apps/telemed-deploy-ready/js/dr-ai-integration.js
 * 2) Inclua nas páginas que exibem consultas ou o detalhe da consulta:
 *    <script src="/js/dr-ai-integration.js" defer></script>
 *    (ajuste o path conforme seu servidor estático)
 *
 * Data-attributes esperados (em cada card, ou no <body> no detalhe):
 *   data-consultation-id, data-consultation-date (AAAA-MM-DD ou DD/MM/AAAA),
 *   data-specialty, data-doctor, data-limit-days (padrão 30), data-patient-id
 */
(function(){
  const CONFIG = {
    apiUrl: '/api/ai/answer',
    scheduleUrl: '/agendamento.html',
    emergencyUrl: '/pronto-atendimento.html'
  };

  const styles = `
  .drai-btn{appearance:none;border:1px solid rgba(148,163,184,.28);background:#111827;color:#fff;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:8px}
  .drai-btn:hover{filter:brightness(1.06)}
  .drai-btn.primary{background:#60a5fa;border-color:transparent;color:#0b1220}
  .drai-pill{display:inline-flex;gap:6px;align-items:center;padding:4px 8px;border-radius:999px;background:rgba(2,6,23,.55);border:1px solid rgba(148,163,184,.22);color:#cbd5e1;font-weight:600;font-size:.85rem}

  .drai-modal-backdrop{position:fixed;inset:0;background:rgba(2,6,23,.65);backdrop-filter:saturate(130%) blur(2px);z-index:2147483000;display:none}
  .drai-modal{position:fixed;inset:auto auto 24px 24px;max-width:560px;width:calc(100% - 48px);z-index:2147483001;display:none}
  .drai-card{background:#0f172a;border:1px solid rgba(148,163,184,.22);border-radius:14px;box-shadow:0 20px 40px rgba(2,6,23,.45);overflow:hidden}
  .drai-card header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.16)}
  .drai-title{display:flex;gap:10px;align-items:center;font-weight:800}
  .drai-title small{color:#94a3b8;font-weight:600}
  .drai-x{appearance:none;background:transparent;border:0;color:#cbd5e1;font-size:18px;cursor:pointer}
  .drai-body{padding:12px 14px;display:grid;gap:10px}
  .drai-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .drai-info{display:flex;gap:8px;flex-wrap:wrap}
  .drai-input{display:flex;gap:8px}
  .drai-input textarea{flex:1;min-height:76px;background:#0b1220;color:#e2e8f0;border:1px solid rgba(148,163,184,.26);border-radius:10px;padding:10px}
  .drai-send{white-space:nowrap}
  .drai-status{font-size:.92rem;color:#94a3b8}
  .drai-answer{background:#0b1220;border:1px solid rgba(148,163,184,.22);border-radius:10px;padding:10px;color:#e2e8f0}
  .drai-ctas{display:flex;gap:8px;flex-wrap:wrap}
  .drai-hidden{display:none!important}

  .drai-fab{position:fixed;right:20px;bottom:20px;background:#60a5fa;color:#0b1220;border:0;border-radius:999px;padding:12px 14px;font-weight:800;box-shadow:0 12px 24px rgba(2,6,23,.35);cursor:pointer;z-index:2147482999}
  @media (max-width:640px){.drai-modal{left:12px;right:12px;bottom:12px;width:auto}}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = styles; document.head.appendChild(styleEl);

  function parseDate(input){
    if(!input) return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(input)){
      const [y,m,d] = input.split('-').map(Number); return new Date(y, m-1, d);
    }
    if(/^\d{2}\/\d{2}\/\d{4}$/.test(input)){
      const [d,m,y] = input.split('/').map(Number); return new Date(y, m-1, d);
    }
    const t = Date.parse(input); return isNaN(t) ? null : new Date(t);
  }
  function daysSince(dateStr){
    const d = parseDate(dateStr); if(!d) return null;
    const ms = Date.now() - d.getTime(); return Math.floor(ms / 86400000);
  }
  function withinLimit(days, limit){
    if(days==null) return true;
    const lim = Number(limit || 30); return days <= lim;
  }
  function el(tag, cls, text){
    const e = document.createElement(tag); if(cls) e.className = cls; if(text!=null) e.textContent = text; return e;
  }

  let modal, backdrop, ta, sendBtn, answerBox, statusEl, ctasWrap; let currentCtx = null;
  function ensureModal(){
    if(modal) return;
    backdrop = el('div','drai-modal-backdrop');
    modal = el('div','drai-modal');
    const card = el('div','drai-card');
    const header = el('header');
    const left = el('div','drai-title');
    left.append('🤖 Dr. AI ', el('small','', 'Esclarecimentos pós-consulta'));
    const close = el('button','drai-x','✕'); close.addEventListener('click', hideModal);
    header.append(left, close);

    const body = el('div','drai-body');
    const info = el('div','drai-info'); info.id = 'drai-info';
    const inputRow = el('div','drai-input');
    ta = document.createElement('textarea'); ta.placeholder = 'Escreva sua dúvida de forma simples...';
    sendBtn = el('button','drai-btn primary','Enviar');
    sendBtn.classList.add('drai-send');
    sendBtn.addEventListener('click', onSend);
    inputRow.append(ta, sendBtn);

    statusEl = el('div','drai-status');
    answerBox = el('div','drai-answer drai-hidden');
    ctasWrap = el('div','drai-ctas');

    body.append(info, inputRow, statusEl, answerBox, ctasWrap);
    card.append(header, body); modal.append(card);
    document.body.append(backdrop, modal);

    backdrop.addEventListener('click', hideModal);
  }
  function showModal(ctx){ ensureModal(); currentCtx = ctx; fillInfo(ctx); answerBox.classList.add('drai-hidden'); ctasWrap.innerHTML=''; statusEl.textContent=''; ta.value='';
    backdrop.style.display='block'; modal.style.display='block'; ta.focus(); }
  function hideModal(){ if(backdrop) backdrop.style.display='none'; if(modal) modal.style.display='none'; }

  function pill(text){ return `<span class="drai-pill">${text}</span>`; }
  function fillInfo(ctx){
    const inf = document.getElementById('drai-info'); if(!inf) return; inf.innerHTML = '';
    const days = daysSince(ctx.consultationDate);
    const lim = Number(ctx.limitDays || 30);
    inf.insertAdjacentHTML('beforeend', pill(`👩‍⚕️ ${ctx.doctor||'Médico'}`));
    inf.insertAdjacentHTML('beforeend', pill(`🏷️ ${ctx.specialty||'Especialidade'}`));
    if(ctx.consultationDate) inf.insertAdjacentHTML('beforeend', pill(`📅 ${ctx.consultationDate}`));
    if(days!=null) inf.insertAdjacentHTML('beforeend', pill(`⏱️ ${days} dia(s) desde a consulta`));
    inf.insertAdjacentHTML('beforeend', pill(`🔒 Limite: ${lim} dia(s)`));
  }

  async function onSend(){
    const q = (ta.value||'').trim(); if(!q) { ta.focus(); return; }
    sendBtn.disabled = true; statusEl.textContent = 'Enviando...'; answerBox.classList.add('drai-hidden'); ctasWrap.innerHTML='';
    try{
      const payload = {
        question: q,
        patient_id: currentCtx?.patientId || 'pac_demo',
        consultation_id: currentCtx?.consultationId,
        specialty: currentCtx?.specialty,
        channel: 'web',
        locale: 'pt-BR',
        context: { last_prescription_id: currentCtx?.prescriptionId || null }
      };
      const res = await fetch(CONFIG.apiUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await res.json();
      renderAnswer(data);
    } catch(e){
      renderAnswer({ ok:false, tipo:'erro', mensagem:'Não foi possível obter a resposta agora. Tente novamente em instantes.', metadados:{ error: String(e) }});
    } finally {
      sendBtn.disabled = false; statusEl.textContent = '';
    }
  }

  function renderAnswer(data){
    const t = (data && data.tipo) || 'esclarecimento';
    const msg = (data && (data.mensagem || data.message)) || 'Resposta recebida.';
    const md = (data && data.metadados) || {};
    let header = '';
    if(t==='esclarecimento') header = '✅ Esclarecimento';
    else if(t==='fora_escopo') header = '🚫 Fora de escopo';
    else if(t==='consulta_expirada') header = '⏰ Consulta expirada';
    else if(t==='escala_emergencia') header = '🚑 Emergência';
    else header = 'ℹ️ Resposta';

    answerBox.innerHTML = `<div style="font-weight:800;margin-bottom:6px">${header}</div><div>${escapeHtml(msg).replace(/\n/g,'<br>')}</div>`;
    answerBox.classList.remove('drai-hidden');

    ctasWrap.innerHTML = '';
    if(t==='esclarecimento'){
      const ok = el('button','drai-btn','👍 Isso ajudou');
      const no = el('button','drai-btn','👎 Ainda tenho dúvida');
      ok.addEventListener('click', ()=>{ ok.disabled = no.disabled = true; statusEl.textContent = 'Obrigado pelo retorno!'; });
      no.addEventListener('click', ()=>{ ta.focus(); });
      ctasWrap.append(ok,no);
    }
    if(t==='fora_escopo' || t==='consulta_expirada'){
      const ag = el('a','drai-btn primary','🗓️ Agendar consulta'); ag.href = CONFIG.scheduleUrl;
      ctasWrap.append(ag);
    }
    if(t==='escala_emergencia'){
      const call = el('a','drai-btn primary','📞 Ligar 192'); call.href = 'tel:192';
      const map = el('a','drai-btn','🗺️ Unidades de emergência'); map.href = CONFIG.emergencyUrl;
      ctasWrap.append(call, map);
    }

    if(md && (md.traceId || md.tracking_id)){
      const tr = el('div','drai-status',''); tr.textContent = `trace: ${md.traceId || md.tracking_id}`; answerBox.append(tr);
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }

  function mountInlineButtons(){
    const nodes = document.querySelectorAll('[data-consultation-id]');
    nodes.forEach(node => {
      if(node.dataset.draiAttached==='1') return;
      const ctx = ctxFrom(node);
      const ds = daysSince(ctx.consultationDate);
      if(withinLimit(ds, ctx.limitDays)){
        const b = el('button','drai-btn'); b.textContent = '💬 Tirar dúvida desta consulta';
        b.addEventListener('click', ()=> showModal(ctx));
        node.appendChild(b);
      } else {
        const info = el('div','drai-status'); info.textContent = 'Consulta fora do prazo para esclarecimentos.'; node.appendChild(info);
        const ag = el('a','drai-btn','🗓️ Agendar nova consulta'); ag.href = CONFIG.scheduleUrl; node.appendChild(ag);
      }
      node.dataset.draiAttached='1';
    });
  }

  function mountFabIfNeeded(){
    const body = document.body;
    if(body.dataset.consultationId && !document.querySelector('.drai-fab')){
      const ctx = ctxFrom(body);
      const ds = daysSince(ctx.consultationDate);
      if(withinLimit(ds, ctx.limitDays)){
        const fab = el('button','drai-fab','💬 Tirar dúvida');
        fab.addEventListener('click', ()=> showModal(ctx));
        document.body.appendChild(fab);
      }
    }
  }

  function ctxFrom(node){
    return {
      consultationId: node.dataset.consultationId,
      consultationDate: node.dataset.consultationDate,
      specialty: node.dataset.specialty,
      doctor: node.dataset.doctor,
      limitDays: node.dataset.limitDays,
      patientId: node.dataset.patientId,
      prescriptionId: node.dataset.prescriptionId
    };
  }

  function init(){
    mountInlineButtons();
    mountFabIfNeeded();
    const obs = new MutationObserver(() => { mountInlineButtons(); mountFabIfNeeded(); });
    obs.observe(document.documentElement, { childList:true, subtree:true });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.showModal = showModal;
  window.renderAnswer = renderAnswer;
})();
