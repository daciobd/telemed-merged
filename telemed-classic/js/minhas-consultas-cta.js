/*
 * Minhas Consultas — Barra de Ações + CTAs por cartão
 * v2 — integra com window.showModal de dr-ai-integration.js quando presente
 *
 * COMO USAR:
 * 1) Salve em: apps/telemed-deploy-ready/js/minhas-consultas-cta.js
 * 2) Inclua na página de lista de consultas:
 *    <script src="/js/minhas-consultas-cta.js" defer></script>
 */
(function(){
  const CFG = {
    introUrl: '/dr-ai-demo-intro.html',
    demoUrl: '/dr-ai-demo.html?autodemo=1&from=intro',
    scheduleUrl: '/agendamento.html',
    detailBaseUrl: '/consulta-demo.html?id=',
    defaultLimitDays: 30
  };

  const css = `
  .mc-bar{position:sticky;top:0;z-index:999;background:#0f172a;border-bottom:1px solid rgba(148,163,184,.22)}
  .mc-inner{max-width:1100px;margin:0 auto;padding:10px 16px;display:flex;gap:10px;align-items:center;justify-content:space-between}
  .mc-title{font-weight:800;display:flex;gap:8px;align-items:center;color:#e5e7eb}
  .mc-actions{display:flex;gap:8px;flex-wrap:wrap}
  .mc-btn{appearance:none;border:1px solid rgba(148,163,184,.28);background:#111827;color:#fff;padding:8px 12px;border-radius:10px;cursor:pointer;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
  .mc-btn:hover{filter:brightness(1.06)}
  .mc-btn.primary{background:#60a5fa;border-color:transparent;color:#0b1220}
  .mc-cta-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .mc-note{color:#94a3b8;font-size:.95rem}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  function mountBar(){
    const bar = document.createElement('div'); bar.className = 'mc-bar';
    bar.innerHTML = `
      <div class="mc-inner">
        <div class="mc-title">💡 <span>Demonstração do Widget Dr. AI</span></div>
        <div class="mc-actions">
          <a class="mc-btn" href="${CFG.introUrl}">📘 Ver introdução</a>
          <a class="mc-btn primary" href="${CFG.demoUrl}">▶ Iniciar demonstração</a>
        </div>
      </div>`;
    document.body.prepend(bar);
  }

  function parseDate(input){
    if(!input) return null; const m1=/(\d{4})-(\d{2})-(\d{2})/.exec(input); if(m1){return new Date(+m1[1],m1[2]-1,+m1[3]);}
    const m2=/(\d{2})\/(\d{2})\/(\d{4})/.exec(input); if(m2){return new Date(+m2[3],m2[2]-1,+m2[1]);}
    const t = Date.parse(input); return isNaN(t)?null:new Date(t);
  }
  function daysSince(dateStr){ const d=parseDate(dateStr); if(!d) return null; return Math.floor((Date.now()-d.getTime())/86400000); }
  function withinLimit(days, limit){ if(days==null) return true; return days <= (Number(limit)||CFG.defaultLimitDays); }
  function el(tag, cls, txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }

  function enhanceCards(){
    const cards = document.querySelectorAll('[data-consultation-id], .consulta-card, article');
    cards.forEach(card => {
      if(card.dataset.mcAttached==='1') return;
      const ctx = {
        id: card.dataset.consultationId || card.getAttribute('data-id') || card.id || null,
        date: card.dataset.consultationDate || (card.querySelector('[data-date]')?.dataset.date) ||
              (card.textContent.match(/\b(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/)?.[1]) || null,
        specialty: card.dataset.specialty || card.querySelector('[data-specialty]')?.dataset.specialty || null,
        doctor: card.dataset.doctor || (card.querySelector('h3, h4, .title')?.textContent?.trim()) || null,
        limit: Number(card.dataset.limitDays || CFG.defaultLimitDays)
      };
      if(!ctx.id) return;

      const row = el('div','mc-cta-row');

      const det = document.createElement('a'); det.className='mc-btn'; det.href = CFG.detailBaseUrl + encodeURIComponent(ctx.id); det.textContent = '📄 Ver detalhes'; row.appendChild(det);

      const ds = daysSince(ctx.date);
      if(withinLimit(ds, ctx.limit)){
        const doubt = el('button','mc-btn primary','💬 Tirar dúvida');
        doubt.addEventListener('click', () => {
          if(typeof window.showModal === 'function'){
            window.showModal({
              consultationId: ctx.id,
              consultationDate: ctx.date,
              specialty: ctx.specialty,
              doctor: ctx.doctor,
              limitDays: ctx.limit
            });
          } else {
            location.href = CFG.introUrl;
          }
        });
        row.appendChild(doubt);
      } else {
        const ag = document.createElement('a'); ag.className = 'mc-btn primary'; ag.href = CFG.scheduleUrl; ag.textContent = '🗓️ Agendar nova consulta'; row.appendChild(ag);
      }

      const note = el('div','mc-note','Use os botões acima para continuar.');

      if(!card.querySelector('.mc-cta-row')){
        card.appendChild(row); card.appendChild(note);
      }
      card.dataset.mcAttached='1';
    });
  }

  function init(){ mountBar(); enhanceCards(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
