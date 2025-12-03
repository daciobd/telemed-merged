/* Telemetria anônima – instrumentação de CTAs existentes + atalho Alt+T */
;(function(){
  'use strict';
  var FLAGS_KEY='telemed_flags_v1';
  function flags(){ try { return JSON.parse(localStorage.getItem(FLAGS_KEY))||{} } catch(e) { return {} } }
  function enabled(){ var f = flags(); return !!(f.telemetry_enabled && f.telemetry_mode==='anonymous'); }

  // UUID v4 por aba
  function uuidv4(){ return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){ var r=(window.crypto||crypto).getRandomValues(new Uint8Array(1))[0]&15; var v=c==='x'?r:(r&0x3|0x8); return v.toString(16); }); }
  var sessionId = sessionStorage.getItem('telemed_session_id');
  if(!sessionId) { sessionId = uuidv4(); sessionStorage.setItem('telemed_session_id', sessionId); }

  function send(event_name, extra){
    if(!enabled()) return;
    var payload = {
      event_name: event_name,
      ts: new Date().toISOString(),
      session_id: sessionId,
      role: (window.IS_DOCTOR_VIEW?'doctor':'patient'),
      page: location.pathname.slice(0,64),
      version: (window.__BUILD || 'demo').toString().slice(0,32),
      duration_ms: (extra && typeof extra.duration_ms==='number') ? Math.max(0,Math.floor(extra.duration_ms)) : undefined,
      event_props: (extra && extra.event_props) ? extra.event_props : undefined
    };
    fetch('/api/telemetry/event', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(async function(r){ 
        var ct = r.headers.get('content-type') || '';
        var body = ct.includes('application/json') ? await r.json() : await r.text();
        console.debug('[telemetry]', r.status, body);
      })
      .catch(function(err){ console.debug('[telemetry:net]', err); });
  }

  function byTextContains(sel, substr){
    substr = (substr||'').toLowerCase();
    return Array.prototype.slice.call(document.querySelectorAll(sel))
      .filter(function(el){ return (el.textContent||'').toLowerCase().indexOf(substr) !== -1; });
  }

  var targets = [
    { els: byTextContains('a,button,[role="button"]','começar demo'), step: 1 },
    { els: byTextContains('a,button,[role="button"]','assistente dr. ai'), step: 2 },
    { els: byTextContains('a,button,[role="button"]','ver demo de toasts'), step: 3 },
    { els: byTextContains('a,button,[role="button"]','saiba mais'), step: 4 }
  ];
  targets.forEach(function(t){ t.els.forEach(function(el){ el.addEventListener('click', function(){ send('cta_click', { event_props: { step_index: t.step } }); }); }); });

  // Atalho de teste: Alt+T envia 10 cta_click
  window.addEventListener('keydown', function(e){ if(e.altKey && (e.key==='t' || e.key==='T')){ for(var i=0;i<10;i++) send('cta_click', { event_props: { step_index: 9 } }); alert('Disparados 10 eventos de teste (cta_click). Confira em /dashboard-piloto.html'); } });

  // page_view ao abrir
  send('page_view');
})();
