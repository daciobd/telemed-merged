(function () {
  if (window.__DR_AI_BADGE__) return; window.__DR_AI_BADGE__ = true;

  // -------- Config persistida --------
  const KEY_URL = 'DR_AI_HEALTH_URL';
  const KEY_HDR = 'DR_AI_HEADER';
  const KEY_TKN = 'DR_AI_TOKEN';

  const DEF_URL = '/api/dr-ai/health';
  const DEF_HDR = 'X-Internal-Token';

  const get = (k, d) => (window[k] || localStorage.getItem(k) || d);
  const set = (k, v) => (v!=null && (window[k]=v, localStorage.setItem(k, v)));

  function getUrl() { return get(KEY_URL, DEF_URL); }
  function getHdr() { return get(KEY_HDR, DEF_HDR); }
  function getTkn() { return get(KEY_TKN, ''); }

  // -------- UI --------
  const wrap = document.createElement('div');
  wrap.id = 'dr-ai-badge';
  Object.assign(wrap.style, { position:'fixed', top:'10px', right:'12px', zIndex:9999,
    fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Helvetica, Arial, sans-serif' });

  const pill = document.createElement('div');
  pill.setAttribute('title','Dr. AI');
  Object.assign(pill.style, { display:'inline-flex', alignItems:'center', gap:'6px',
    padding:'6px 10px', borderRadius:'999px', border:'1px solid #e5e7eb',
    background:'#ffffff', fontSize:'13px', boxShadow:'0 1px 2px rgba(0,0,0,.06)', cursor:'pointer' });

  const dot = document.createElement('span');
  Object.assign(dot.style,{ width:'8px', height:'8px', borderRadius:'999px', display:'inline-block', background:'#9ca3af' });

  const label = document.createElement('span'); label.textContent='Dr. AI: verificando…';

  const gear = document.createElement('a'); gear.textContent='⚙'; gear.href='javascript:void(0)';
  gear.setAttribute('aria-label','Configurar URL/Token'); Object.assign(gear.style,{ marginLeft:'8px', textDecoration:'none', fontSize:'14px' });

  pill.appendChild(dot); pill.appendChild(label); wrap.appendChild(pill); wrap.appendChild(gear); document.body.appendChild(wrap);

  function setStatus(kind, details, ts) {
    let bg='#fff', border='#e5e7eb', dotc='#9ca3af', text='';
    if (kind==='loading'){ text='Dr. AI: verificando…'; dotc='#9ca3af'; }
    else if (kind==='ok'){ text='Dr. AI: OK'; bg='#ecfdf5'; border='#a7f3d0'; dotc='#10b981'; }
    else { text='Dr. AI: Falha'; bg='#fef2f2'; border='#fecaca'; dotc='#ef4444'; }
    pill.title = details ? String(details) : 'Dr. AI';
    label.textContent = text + (ts ? (' · ' + new Date(ts).toLocaleString()) : '');
    pill.style.background=bg; pill.style.borderColor=border; dot.style.background=dotc;
  }

  function withTimeout(exec, ms) {
    const ctl = new AbortController(); const t=setTimeout(()=>ctl.abort('timeout'), ms);
    return exec(ctl.signal).finally(()=>clearTimeout(t));
  }

  async function check(signal) {
    const url = getUrl(); const hdr = getHdr(); const tkn = getTkn();
    const headers = {};
    if (tkn) headers[hdr] = tkn; // ex.: X-Internal-Token: <token>
    const res = await fetch(url, { signal, headers, credentials:'omit' });
    const ct = res.headers.get('content-type') || '';
    if (!res.ok) throw new Error('HTTP ' + res.status);
    if (ct.includes('application/json')) {
      const j = await res.json().catch(()=> ({}));
      if ((j.status && String(j.status).toLowerCase()==='ok') || j.ok===true) return { status:'ok', ts:j.ts||new Date().toISOString() };
      if (j.status && String(j.status).toLowerCase()==='fail') return { status:'fail', details:j.details||'status=fail', ts:j.ts||new Date().toISOString() };
      return { status:'ok', details:'200 JSON sem status', ts:new Date().toISOString() };
    }
    return { status:'ok', details:'200 não-JSON', ts:new Date().toISOString() };
  }

  async function run(){ setStatus('loading'); try{
    const r = await withTimeout((sig)=>check(sig), 6000);
    if (r.status==='ok') setStatus('ok', r.details, r.ts); else setStatus('fail', r.details, r.ts);
  } catch(e){ setStatus('fail', (e&&e.message)?e.message:String(e)); } }

  pill.addEventListener('click', run);

  // Config por UI: clique na engrenagem → pergunta URL, Header e Token
  gear.addEventListener('click', function() {
    const nextUrl = prompt('URL do health do Dr. AI:', getUrl()); if (nextUrl && nextUrl.trim()) set(KEY_URL, nextUrl.trim());
    const nextHdr = prompt('Nome do header p/ auth (ex.: X-Internal-Token ou Authorization):', getHdr()); if (nextHdr && nextHdr.trim()) set(KEY_HDR, nextHdr.trim());
    const nextTkn = prompt('Valor do token (ex.: abc123 ou Bearer ...):', getTkn()); if (nextTkn!=null) set(KEY_TKN, nextTkn);
    run();
  });

  run();
})();
