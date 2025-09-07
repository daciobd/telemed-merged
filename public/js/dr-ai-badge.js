(function () {
  if (window.__DR_AI_BADGE__) return;
  window.__DR_AI_BADGE__ = true;

  // ------------- Config -------------
  const DEFAULT_URL = '/api/dr-ai/health';
  function getUrl() {
    return (window.DR_AI_HEALTH_URL || localStorage.getItem('DR_AI_HEALTH_URL') || DEFAULT_URL);
  }
  function setUrl(u) {
    if (!u) return;
    window.DR_AI_HEALTH_URL = u;
    localStorage.setItem('DR_AI_HEALTH_URL', u);
  }

  // ------------- UI -------------
  const wrap = document.createElement('div');
  wrap.id = 'dr-ai-badge';
  Object.assign(wrap.style, {
    position: 'fixed', top: '10px', right: '12px', zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Helvetica, Arial, sans-serif'
  });

  const pill = document.createElement('div');
  pill.setAttribute('title', 'Dr. AI');
  Object.assign(pill.style, {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 10px', borderRadius: '999px', border: '1px solid #e5e7eb',
    background: '#ffffff', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,.06)', cursor: 'pointer'
  });

  const dot = document.createElement('span');
  Object.assign(dot.style, {
    width: '8px', height: '8px', borderRadius: '999px', display: 'inline-block', background: '#9ca3af'
  });

  const label = document.createElement('span');
  label.textContent = 'Dr. AI: verificando…';

  const gear = document.createElement('a');
  gear.textContent = '⚙';
  gear.href = 'javascript:void(0)';
  gear.setAttribute('aria-label', 'Configurar URL de health');
  Object.assign(gear.style, { marginLeft: '8px', textDecoration: 'none', fontSize: '14px' });

  pill.appendChild(dot);
  pill.appendChild(label);
  wrap.appendChild(pill);
  wrap.appendChild(gear);
  document.body.appendChild(wrap);

  function setStatus(kind, details, ts) {
    let bg = '#ffffff', border = '#e5e7eb', dotc = '#9ca3af', text = '';
    if (kind === 'loading') {
      text = 'Dr. AI: verificando…';
      dotc = '#9ca3af';
    } else if (kind === 'ok') {
      text = 'Dr. AI: OK';
      bg = '#ecfdf5'; border = '#a7f3d0'; dotc = '#10b981';
    } else {
      text = 'Dr. AI: Falha';
      bg = '#fef2f2'; border = '#fecaca'; dotc = '#ef4444';
    }
    pill.title = details ? String(details) : 'Dr. AI';
    label.textContent = text + (ts ? ` · ${new Date(ts).toLocaleString()}` : '');
    pill.style.background = bg;
    pill.style.borderColor = border;
    dot.style.background = dotc;
  }

  function withTimeout(promise, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort('timeout'), ms);
    return promise(ctl.signal).finally(() => clearTimeout(t));
  }

  async function check(signal) {
    const url = getUrl();
    const res = await fetch(url, { signal, credentials: 'omit' });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (contentType.includes('application/json')) {
      const j = await res.json().catch(() => ({}));
      // aceita formas flexíveis: {status:'ok'} | {ok:true} | {status:'fail'}
      if ((j.status && String(j.status).toLowerCase() === 'ok') || j.ok === true) {
        return { status: 'ok', ts: j.ts || new Date().toISOString() };
      }
      if (j.status && String(j.status).toLowerCase() === 'fail') {
        return { status: 'fail', details: j.details || 'status=fail', ts: j.ts || new Date().toISOString() };
      }
      return { status: 'ok', details: 'health sem status padronizado', ts: new Date().toISOString() };
    } else {
      // qualquer 200 não-JSON consideramos OK
      return { status: 'ok', details: '200 não-JSON', ts: new Date().toISOString() };
    }
  }

  async function run() {
    setStatus('loading');
    try {
      const r = await withTimeout((signal) => check(signal), 5000);
      if (r.status === 'ok') setStatus('ok', r.details, r.ts);
      else setStatus('fail', r.details, r.ts);
    } catch (e) {
      setStatus('fail', String(e && e.message ? e.message : e));
    }
  }

  // Clique no badge reexecuta o teste
  pill.addEventListener('click', run);

  // Engrenagem para configurar a URL
  gear.addEventListener('click', function () {
    const current = getUrl();
    const next = prompt(
      'URL do health do Dr. AI (ex.: /api/dr-ai/health ou https://seu-backend/api/dr-ai/health):',
      current
    );
    if (next && next.trim()) {
      setUrl(next.trim());
      run();
    }
  });

  // roda ao carregar
  run();
})();
