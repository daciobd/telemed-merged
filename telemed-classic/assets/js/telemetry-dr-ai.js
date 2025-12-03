/* Telemetria anônima – dr-ai-demo (tour + ask) */
;(function(){
  'use strict';
  var FLAGS_KEY='telemed_flags_v1';
  function flags(){ try { return JSON.parse(localStorage.getItem(FLAGS_KEY))||{} } catch(e) { return {} } }
  function enabled(){ var f = flags(); return !!(f.telemetry_enabled && f.telemetry_mode==='anonymous'); }

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

  // page_view ao abrir
  send('page_view');

  // tour_start: tenta detectar botões comuns
  function wireTourStart(){
    var sels = ['#btn-start-tour','[data-tour-start]','[aria-label="Iniciar tour"]','button'];
    var btns = [];
    for (var i=0;i<sels.length;i++){ btns = btns.concat(Array.prototype.slice.call(document.querySelectorAll(sels[i]))); }
    btns = btns.filter(function(b){ return /iniciar\s*tour|start\s*tour/i.test((b.textContent||b.getAttribute('aria-label')||'')); });
    function onStart(){ send('tour_start'); btns.forEach(function(b){ b.removeEventListener('click', onStart); }); }
    btns.forEach(function(b){ b.addEventListener('click', onStart, { once:true }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireTourStart); else wireTourStart();

  // expose helper para etapas
  window.Telemetry = Object.assign({}, window.Telemetry, {
    trackTourStep: function(index){ var i = (isFinite(index)? Number(index) : 0); send('tour_step', { event_props: { step_index: i } }); }
  });

  // Wrap fetch para /api/ai/ask
  var origFetch = window.fetch;
  window.fetch = function(input, init){ 
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    if (url && url.indexOf('/api/ai/ask') !== -1) {
      var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
      return origFetch.apply(this, arguments).then(function(resp){ 
        var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
        send('ask_submitted', { duration_ms: (t1 - t0), event_props: { http_status: resp.status } });
        if (!resp.ok) { send('ask_error', { event_props: { http_status: resp.status, retry_count: (init && init.__retryCount) || 0 } }); }
        return resp;
      }).catch(function(err){ 
        var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
        send('ask_error', { duration_ms: (t1 - t0), event_props: { http_status: 0, retry_count: (init && init.__retryCount) || 0 } });
        throw err;
      });
    }
    return origFetch.apply(this, arguments);
  };
})();
