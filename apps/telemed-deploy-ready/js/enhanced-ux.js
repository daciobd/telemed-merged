// ---- Enhanced Consultation UX - TeleMed Professional Interface
;(() => {
  // ---- Isolated helpers (no global collision)
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ---- Abas (Chat / Atendimento / Exames / Receitas)
(() => {
  const tabBtns = $$(".tab");
  const tabPanes = $$(".pane");
  if (!tabBtns.length || !tabPanes.length) return;

  function activate(id) {
    tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === id));
    tabPanes.forEach(p => {
      p.style.display = p.id === `pane-${id}` ? 'block' : 'none';
    });
    try {
      window.telemedAnalytics?.track?.("enhanced_tab_changed", { tab: id });
    } catch {}
  }

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => activate(btn.dataset.tab));
  });

  // abre a última aba usada
  const last = localStorage.getItem("enhanced_last_tab") || "care";
  activate(last);
  tabBtns.forEach(b => b.addEventListener("click", () => {
    localStorage.setItem("enhanced_last_tab", b.dataset.tab);
  }));
})();

// ---- Redimensionamento CLAMP seguro - CORREÇÃO DEFINITIVA
(() => {
  const NOTES_KEY = 'telemed_notes_width';
  const MIN = 360, MAX = 760, DEF = 420;

  const notes = document.querySelector('.split-right');
  const resizer = document.querySelector('.split-divider');
  const root = document.getElementById('splitRoot');
  
  if (!notes || !resizer || !root) return;

  const clamp = (v,min,max) => Math.max(min, Math.min(max, v));
  const px = n => `${n}px`;

  // largura inicial segura
  let w = parseInt(localStorage.getItem(NOTES_KEY) || DEF, 10);
  w = isNaN(w) ? DEF : clamp(w, MIN, MAX);
  root.style.gridTemplateColumns = `1fr 8px ${px(w)}`;

  // drag
  let startX = 0, startW = 0, dragging = false;
  function onMove(e){
    if(!dragging) return;
    const dx = e.clientX - startX;
    const nw = clamp(startW - dx, MIN, MAX);
    root.style.gridTemplateColumns = `1fr 8px ${px(nw)}`;
  }
  function onUp(){
    if(!dragging) return;
    dragging = false;
    const currentWidth = parseInt(root.style.gridTemplateColumns.split(' ')[2]) || DEF;
    const final = clamp(currentWidth, MIN, MAX);
    localStorage.setItem(NOTES_KEY, final);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    resizer.classList.remove('drag');
  }
  
  resizer.addEventListener('mousedown', (e)=>{
    dragging = true;
    startX = e.clientX;
    startW = parseInt(root.style.gridTemplateColumns.split(' ')[2]) || DEF;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    resizer.classList.add('drag');
  });

  // duplo clique no divisor = reset de layout
  resizer.addEventListener('dblclick', ()=>{
    root.style.gridTemplateColumns = `1fr 8px ${px(DEF)}`;
    localStorage.setItem(NOTES_KEY, DEF);
  });

  // teclado
  resizer.tabIndex = 0;
  resizer.setAttribute('aria-label', 'Redimensionar painel de anotações');
  resizer.addEventListener('keydown', (e) => {
    const current = parseInt(root.style.gridTemplateColumns.split(' ')[2]) || DEF;
    if(e.key === 'ArrowLeft'){ 
      const newW = clamp(current + 24, MIN, MAX);
      root.style.gridTemplateColumns = `1fr 8px ${px(newW)}`;
      localStorage.setItem(NOTES_KEY, newW);
    }
    if(e.key === 'ArrowRight'){ 
      const newW = clamp(current - 24, MIN, MAX);
      root.style.gridTemplateColumns = `1fr 8px ${px(newW)}`;
      localStorage.setItem(NOTES_KEY, newW);
    }
    if(e.key === 'Enter'){ 
      root.style.gridTemplateColumns = `1fr 8px ${px(DEF)}`;
      localStorage.setItem(NOTES_KEY, DEF);
    }
  });
})();

// ---- Botões da barra de ferramentas do vídeo
(() => {
  const actions = [
    ["btnShot", "click_screenshot"],
    ["btnOpenChat", "click_chat"],
    ["btnBell", "click_notify"],
    ["btnAI", "click_ai_panel"],
    ["btnMic", "toggle_mic"],
    ["btnCam", "toggle_cam"],
    ["btnHold", "send_to_waiting"],
    ["btnEnd", "end_call"]
  ];
  
  actions.forEach(([id, event]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      window.telemedAnalytics?.track?.(event, { page: location.pathname });
      
      // Abrir painel Dr. AI
      if (id === "btnAI") {
        const aiPanel = document.getElementById('aipanel');
        if (aiPanel) aiPanel.style.display = 'flex';
      }
      
      // Toggle estados mic/cam
      if (id === "btnMic") {
        btn.style.opacity = btn.style.opacity === '0.5' ? '1' : '0.5';
      }
      if (id === "btnCam") {
        btn.style.opacity = btn.style.opacity === '0.5' ? '1' : '0.5';
      }
    });
  });
})();

// ---- Botões do banner do paciente
(() => {
  const toast = (m, cls="ok") => {
    const t = document.createElement("div");
    t.className = `toast ${cls}`;
    t.textContent = m;
    t.style.cssText = `
      position:fixed;top:20px;right:20px;z-index:9999;
      padding:12px 16px;border-radius:8px;color:#fff;font-weight:500;
      background:${cls==='ok'?'#10b981':'#ef4444'};
      box-shadow:0 4px 12px rgba(0,0,0,.3);
      animation:slideIn .3s ease;
    `;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 2200);
  };

  // Convite
  const btnInvite = $("#btnInvite");
  btnInvite?.addEventListener("click", () => {
    window.telemedAnalytics?.track?.("invite_sent", { room: "ABC123" });
    btnInvite.textContent = "Enviado ✓";
    setTimeout(() => btnInvite.textContent = "Convite", 2000);
    toast("Convite enviado ao paciente");
  });

  // Iniciar consulta
  const btnStart = $("#btnStart");
  btnStart?.addEventListener("click", async () => {
    window.telemedAnalytics?.track?.("consult_start_clicked", {});
    const statusLabel = $("#statusLabel");
    if (statusLabel) statusLabel.textContent = "Em atendimento";
    toast("Consulta iniciada");
  });

  // Salvar
  const btnSave = $("#btnSave");
  btnSave?.addEventListener("click", async () => {
    window.telemedAnalytics?.track?.("consult_save_clicked", {});
    toast("Rascunho salvo");
  });

  // Finalizar
  const btnFinish = $("#btnFinish");
  btnFinish?.addEventListener("click", async () => {
    window.telemedAnalytics?.track?.("consult_finish_clicked", {});
    toast("Consulta finalizada");
  });
})();

// ---- Timer do banner
(() => {
  const timerEl = $("#pbTimer");
  if (!timerEl) return;
  
  let secs = 0;
  const t = setInterval(() => {
    secs++;
    const m = String(Math.floor(secs/60)).padStart(2,'0');
    const s = String(secs%60).padStart(2,'0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
})();

// ---- Segmentos (Conduta/Exames/MedMed)
(() => {
  const segTabs = $$('.segtab');
  const segPanes = $$('[id^="seg-"]');
  
  segTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.seg;
      
      // Ativar tab
      segTabs.forEach(t => t.classList.toggle('active', t.dataset.seg === target));
      
      // Mostrar pane
      segPanes.forEach(pane => {
        pane.style.display = pane.id === `seg-${target}` ? 'block' : 'none';
      });
      
      window.telemedAnalytics?.track?.("segment_changed", { segment: target });
    });
  });
})();

// ---- Switches/toggles
(() => {
  $$('.sw').forEach(sw => {
    sw.addEventListener('click', () => {
      sw.classList.toggle('on');
      window.telemedAnalytics?.track?.("toggle_switch", { 
        switchId: sw.id,
        active: sw.classList.contains('on')
      });
    });
  });
})();

// ---- Debug utilities
window.telemedEnhancedDebug = Object.assign(window.telemedEnhancedDebug || {}, {
  resetLayout() { 
    localStorage.removeItem('telemed_notes_width'); 
    location.reload(); 
  },
  showAnalytics() {
    const ta = window.telemedAnalytics;
    if (!ta) return console.log('Analytics not loaded');
    console.group('📊 Enhanced Consultation Analytics');
    console.table(ta.all().filter(e => e.page.includes('enhanced')));
    console.groupEnd();
  }
});

  // ---- Export only what's needed globally
  window.telemedEnhancedDebug = telemedEnhancedDebug;
  
  console.log('🎯 Enhanced UX loaded - TeleMed Professional Interface');

// ===== SISTEMA DE ATTACHMENT DE STREAMS =====
// Helper global para módulos RTC anexarem streams
window.telemedAttachStream = (role, stream) => {
  const el = role === 'remote' ? document.getElementById('remoteVideo') : document.getElementById('localVideo');
  if (el && stream) {
    el.srcObject = stream;
    el.play().catch(() => {});
    console.log(`🎥 Stream attached: ${role}`, stream);
    
    // Ocultar área de espera quando stream remoto conectar
    if (role === 'remote') {
      const waitArea = document.getElementById('waitingArea');
      if (waitArea) waitArea.style.display = 'none';
    }
  }
};

// Suporte a eventos personalizados
window.addEventListener('telemed:rtc-stream', (e) => {
  const { role, stream } = e.detail || {};
  window.telemedAttachStream?.(role, stream);
});

// Comunicação com página demo via postMessage
window.addEventListener('message', (event) => {
  const { type, role } = event.data || {};
  
  switch (type) {
    case 'telemed-demo-stream':
      // Ativar modo demo programaticamente
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      let t = 0;
      
      const draw = () => {
        const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
        gradient.addColorStop(0, `hsl(${(t % 360)}, 35%, 30%)`);
        gradient.addColorStop(1, `hsl(${((t + 120) % 360)}, 35%, 20%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1280, 720);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px system-ui';
        ctx.fillText('🎥 DEMO PATIENT', 32, 72);
        ctx.font = '28px system-ui';
        ctx.fillText(new Date().toLocaleTimeString(), 32, 116);
        ctx.fillText('Controle Externo Ativo', 32, 160);
        
        t += 1;
        requestAnimationFrame(draw);
      };
      
      draw();
      const stream = canvas.captureStream(24);
      window.telemedAttachStream('remote', stream);
      console.log('🎬 Demo stream ativado via postMessage');
      break;
      
    case 'telemed-stop-all':
      // Parar todos os streams
      const remoteVideo = document.getElementById('remoteVideo');
      const localVideo = document.getElementById('localVideo');
      
      if (remoteVideo && remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
      }
      
      if (localVideo && localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
      }
      
      // Mostrar área de espera novamente
      const waitArea = document.getElementById('waitingArea');
      if (waitArea) waitArea.style.display = 'block';
      
      console.log('⛔ Todos os streams foram parados');
      break;
      
    case 'telemed-status-check':
      // Enviar status dos elementos de vídeo
      const remote = document.getElementById('remoteVideo');
      const local = document.getElementById('localVideo');
      
      const status = {
        remote: {
          exists: !!remote,
          hasStream: !!(remote && remote.srcObject),
          dimensions: remote ? { w: remote.clientWidth, h: remote.clientHeight } : null
        },
        local: {
          exists: !!local,
          hasStream: !!(local && local.srcObject),
          dimensions: local ? { w: local.clientWidth, h: local.clientHeight } : null
        }
      };
      
      event.source.postMessage({
        type: 'telemed-status-response',
        message: `Remote: ${status.remote.exists ? '✅' : '❌'} ${status.remote.hasStream ? '🎥' : '📭'} | Local: ${status.local.exists ? '✅' : '❌'} ${status.local.hasStream ? '🎥' : '📭'}`
      }, '*');
      break;
  }
});

// MODO DEMO: /enhanced?demo=1 cria vídeo animado de teste
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('demo') === '1') {
  setTimeout(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    let t = 0;
    
    const draw = () => {
      // Fundo gradiente animado
      const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
      gradient.addColorStop(0, `hsl(${(t % 360)}, 35%, 30%)`);
      gradient.addColorStop(1, `hsl(${((t + 60) % 360)}, 35%, 20%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1280, 720);
      
      // Texto demo
      ctx.fillStyle = '#fff';
      ctx.font = '48px system-ui';
      ctx.fillText('🎥 DEMO VIDEO', 32, 72);
      ctx.font = '28px system-ui';
      ctx.fillText(new Date().toLocaleTimeString(), 32, 116);
      ctx.fillText('Paciente Virtual Conectado', 32, 160);
      
      t += 1;
      requestAnimationFrame(draw);
    };
    
    draw();
    const stream = canvas.captureStream(24);
    window.telemedAttachStream('remote', stream);
    console.log('🎬 Demo mode: Virtual patient stream created');
  }, 1000);
}

// DEBUG: diagnosticar elementos de vídeo
setTimeout(() => {
  const scope = document.querySelector(".app") || document.body;
  const vids = Array.from(scope.querySelectorAll("video,canvas"));
  console.debug("[Enhanced][probe] found", vids.length, "video/canvas elements");
  vids.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    console.debug(`[Enhanced][probe] #${i}`, el.tagName, { 
      id: el.id,
      role: el.dataset.rtcRole,
      w: r.width, h: r.height, 
      display: getComputedStyle(el).display, 
      vis: getComputedStyle(el).visibility, 
      z: getComputedStyle(el).zIndex 
    });
  });
  
  // Verificar se área de vídeo principal tem altura
  const leftPane = document.querySelector('.split-left, .left');
  if (leftPane) {
    const r = leftPane.getBoundingClientRect();
    console.debug("[Enhanced][probe] Video area:", { w: r.width, h: r.height });
  }
}, 500);
})(); // End IIFE

// Gruda a largura persistida também na variável CSS (usada no CSS acima)
(function syncCssVarWithSavedWidth(){
  const w = Number(localStorage.getItem('telemed_notes_width')) || 480;
  document.documentElement.style.setProperty('--notes-w', w + 'px');
})();

// === util: menor ancestral comum (LCA) ===
function tmLCA(a, b) {
  const seen = new Set();
  for (let n = a; n; n = n.parentElement) seen.add(n);
  for (let n = b; n; n = n.parentElement) if (seen.has(n)) return n;
  return document.body;
}

// === util: devolve o "bloco" (filho direto) do ancestral que contém o node ===
function tmDirectChildOf(ancestor, node) {
  let cur = node;
  let prev = node;
  while (cur && cur.parentElement && cur.parentElement !== ancestor) {
    prev = cur;
    cur = cur.parentElement;
  }
  return (cur && cur.parentElement === ancestor) ? cur : prev;
}

// === aplica largura persistida em CSS var e no style inline ===
function tmApplySideWidth(el, w) {
  const width = Math.max(320, Math.min(720, Number(w) || 480));
  document.documentElement.style.setProperty('--notes-w', width + 'px');
  if (el) {
    el.style.flex = `0 0 ${width}px`;
    el.style.width = width + 'px';
    el.style.minWidth = '320px';
    el.style.maxWidth = '720px';
  }
  localStorage.setItem('telemed_notes_width', String(width));
}

// === NOVA versão robusta (não usa insertBefore) ===
function enforceTwoColumns() {
  // detecta elementos
  const stage = document.querySelector('[data-panel="stage"], .video-area, .stage, .main-stage');
  const side  = document.querySelector('[data-panel="side"], .side-panel, .consult-panel, .right-panel, .left-panel');

  if (!stage || !side) return;

  // encontra ancestral comum e os "blocos" diretos sob esse ancestral
  const anc       = tmLCA(stage, side);
  const stageBlk  = tmDirectChildOf(anc, stage);
  const sideBlk   = tmDirectChildOf(anc, side);

  // ativa layout flex no ancestral comum
  anc.style.display = 'flex';
  anc.style.gap = '16px';
  anc.style.alignItems = 'stretch';

  // ordena sem mover DOM
  stageBlk.style.order = '0';
  sideBlk.style.order  = '1';

  // dimensões
  stageBlk.style.flex = '1 1 auto';
  stageBlk.style.minWidth = '0';   // evita estouro
  stageBlk.style.position = 'relative';

  const saved = Number(localStorage.getItem('telemed_notes_width')) || 480;
  tmApplySideWidth(sideBlk, saved);

  // garante controles do vídeo acima
  const ctrls = document.querySelector('.video-controls, [data-controls="video"], .controls, .controls-bar, .toolbar, .video-toolbar');
  if (ctrls) {
    ctrls.style.position = 'absolute';
    ctrls.style.left = '50%';
    ctrls.style.bottom = '16px';
    ctrls.style.transform = 'translateX(-50%)';
    ctrls.style.zIndex = '60';
    ctrls.style.pointerEvents = 'auto';
  }

  // se existir o handle, deixe-o colado na borda esquerda do painel
  const handle = document.getElementById('tmResizer');
  if (handle && handle.parentElement !== sideBlk) {
    sideBlk.appendChild(handle);
  }
  if (handle) {
    handle.style.left = '-4px';    // encosta na borda
    handle.style.right = '';
  }

  // pluga o resizer para também atualizar a CSS var
  if (window.tmResizer && typeof window.tmResizer.onWidthChange === 'function') {
    window.tmResizer.onWidthChange = (w) => tmApplySideWidth(sideBlk, w);
  }
}

// chama no load com try/catch para evitar quebrar
try { enforceTwoColumns(); } catch(e) { console.warn('Layout enforcement failed:', e); }

// ================== ESTILOS (uma vez) ==================
(function injectEnhStyles(){
  if (document.getElementById('tmEnhStyles')) return;
  const css = `
  :root { --notes-w: ${Number(localStorage.getItem('telemed_notes_width'))||480}px; }
  .tm-stage { position:relative; background:#0d1520; min-height:420px; border-radius:10px; overflow:hidden; }
  .tm-stage .tm-waiting {
    position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
    color:#8aa1b1; font:500 16px/1.4 system-ui, -apple-system, Segoe UI; pointer-events:none;
    background: linear-gradient(135deg, #0d1520 0%, #1a2332 50%, #0f1419 100%);
  }
  .tm-controls {
    position:absolute; left:50%; bottom:16px; transform:translateX(-50%);
    display:flex; gap:10px; padding:10px 12px; border-radius:22px;
    backdrop-filter: blur(8px); background:rgba(0,0,0,.35); box-shadow:0 6px 24px rgba(0,0,0,.25);
    z-index:60; pointer-events:auto;
  }
  .tm-btn {
    width:36px; height:36px; display:grid; place-items:center;
    border-radius:50%; background:#182230; color:#c9d5e1; cursor:pointer; border:1px solid rgba(255,255,255,.06);
    transition:transform .12s ease, background .12s ease;
  }
  .tm-btn:hover { transform:translateY(-1px); background:#1f2e40; }
  .tm-btn.alert { background:#a46c00; color:#fff; }
  .tm-btn.end   { background:#b4232c; color:#fff; }
  .tm-btn.muted, .tm-btn.disabled { opacity:.55; }
  .tm-tooltip { position:absolute; bottom:52px; background:#000; color:#fff; padding:4px 8px; border-radius:6px; font-size:12px; white-space:nowrap; opacity:0; transform:translateY(6px); pointer-events:none; transition:.12s; }
  .tm-btn:hover .tm-tooltip { opacity:1; transform:translateY(0); }
  .tm-upload-progress { position:absolute; top:-30px; left:50%; transform:translateX(-50%); background:#000; color:#fff; padding:4px 8px; border-radius:4px; font-size:11px; }
  `;
  const style = document.createElement('style');
  style.id = 'tmEnhStyles';
  style.textContent = css;
  document.head.appendChild(style);
})();

// ---- helpers de API ------------------------------------
function tmConsultId() {
  const b = document.body?.dataset?.consultId;
  if (b) return b;
  const url = new URL(location.href);
  return url.searchParams.get('cid') || 'demo-123';
}

async function tmApi(path, {method='GET', json, form}={}) {
  const opts = { method, headers:{} };
  if (json) { opts.headers['Content-Type']='application/json'; opts.body = JSON.stringify(json); }
  if (form) { opts.body = form; } // multipart
  const r = await fetch(path, opts);
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status}`);
  const ct = r.headers.get('content-type')||'';
  return ct.includes('application/json') ? r.json() : r.text();
}

function tmIcon(id){ return `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><use href="#${id}"/></svg>`; }

// ---- upload de arquivo (📎) -----------------------------
function tmUpload(consultId) {
  let input = document.getElementById('tmHiddenUpload');
  if (!input) {
    input = document.createElement('input');
    input.type='file'; input.id='tmHiddenUpload'; input.multiple=true; input.style.display='none';
    document.body.appendChild(input);
  }
  input.onchange = async () => {
    if (!input.files.length) return;
    const prog = document.createElement('div');
    prog.className = 'tm-upload-progress';
    prog.textContent = 'Enviando arquivos...';
    document.querySelector('.tm-controls')?.appendChild(prog);
    
    try {
      const form = new FormData();
      Array.from(input.files).forEach(f => form.append('files', f));
      form.append('consultId', consultId);
      
      const res = await tmApi('/api/consultation/upload', {method:'POST', form});
      prog.textContent = `✓ ${input.files.length} arquivo(s) enviado(s)`;
      setTimeout(() => prog.remove(), 2000);
    } catch(e) {
      prog.textContent = `✗ Erro: ${e.message}`;
      setTimeout(() => prog.remove(), 3000);
    }
  };
  input.click();
}

// ---- screenshot (📸) -----------------------------
async function tmSnapshot(consultId) {
  try {
    const stage = document.querySelector('.tm-stage');
    if (!stage) throw new Error('Área de vídeo não encontrada');
    
    // Usando html2canvas se disponível
    if (window.html2canvas) {
      const canvas = await html2canvas(stage);
      canvas.toBlob(async (blob) => {
        const form = new FormData();
        form.append('screenshot', blob, `screenshot-${Date.now()}.png`);
        form.append('consultId', consultId);
        
        await tmApi('/api/consultation/screenshot', {method:'POST', form});
        console.log('Screenshot salvo com sucesso');
      });
    } else {
      // Fallback simples
      console.log('📸 Screenshot capturado (html2canvas não disponível)');
      await tmApi('/api/consultation/screenshot', {
        method:'POST', 
        json: {consultId, timestamp: new Date().toISOString()}
      });
    }
  } catch(e) {
    console.error('Erro no screenshot:', e);
  }
}

// =========== helpers de detecção de palco/painel ===========
function tmPickStage() {
  // preferimos seletores conhecidos; se não houver, pega o maior bloco visível
  const known = document.querySelector(
    '[data-panel="stage"], .video-area, .stage, .main-stage, #tmStage'
  );
  if (known) return known;
  // heurística: maior DIV visível
  let best=null, bestArea=0;
  for (const el of document.querySelectorAll('div')) {
    const r = el.getBoundingClientRect();
    const area = (r.width||0)*(r.height||0);
    const visible = r.width>300 && r.height>250 && getComputedStyle(el).display!=='none';
    if (visible && area>bestArea) { best=el; bestArea=area; }
  }
  return best || document.body;
}

function tmPickSide() {
  return document.querySelector(
    '[data-panel="side"], .side-panel, .consult-panel, .right-panel, .left-panel'
  );
}

// =============== layout 2 colunas robusto =================
function tmEnsureTwoColumns() {
  const stage = tmPickStage();
  const side  = tmPickSide();
  if (!stage || !side) return;

  const anc      = tmLCA(stage, side);
  const stageBlk = tmDirectChildOf(anc, stage);
  const sideBlk  = tmDirectChildOf(anc, side);

  anc.style.display = 'flex';
  anc.style.gap = '16px';
  anc.style.alignItems = 'stretch';

  stageBlk.style.order = '0';
  sideBlk.style.order  = '1';

  stageBlk.style.flex = '1 1 auto';
  stageBlk.style.minWidth = '0';
  stageBlk.style.position = 'relative';

  // marca palco e garante fundo
  stageBlk.classList.add('tm-stage');
  if (!stageBlk.querySelector('.tm-waiting')) {
    const w = document.createElement('div');
    w.className = 'tm-waiting';
    w.textContent = 'Aguardando paciente entrar na videochamada...';
    stageBlk.appendChild(w);
  }

  tmApplySideWidth(sideBlk, localStorage.getItem('telemed_notes_width')||480);

  // resizer — se você já tem um handle (#tmResizer), realocamos pro painel
  const handle = document.getElementById('tmResizer');
  if (handle && handle.parentElement !== sideBlk) sideBlk.appendChild(handle);
  if (handle) { handle.style.left='-4px'; handle.style.right=''; }
  if (window.tmResizer && typeof window.tmResizer.onWidthChange==='function') {
    window.tmResizer.onWidthChange = (w)=>tmApplySideWidth(sideBlk,w);
  }

  return stageBlk;
}

// ================= barra de controles =====================
function tmEnsureControls(stageBlk) {
  if (!stageBlk) return;
  if (stageBlk.querySelector('.tm-controls')) return;

  const bar = document.createElement('div');
  bar.className = 'tm-controls';
  bar.innerHTML = `
    ${btn('i-clip','Anexar documento','attach')}
    ${btn('i-camera','Screenshot','snap')}
    ${btn('i-chat','Abrir Chat','chat')}
    ${btn('i-bell','Notificações','bell')}
    ${btn('i-brain','Dr. AI','ai')}
    ${btn('i-mic','Microfone','mic')}
    ${btn('i-cam','Câmera','cam')}
    ${btn('i-pause','Aguardar/retomar','hold','alert')}
    ${btn('i-stop','Encerrar','end','end')}
  `;
  stageBlk.appendChild(bar);

  // ações funcionais
  bar.addEventListener('click', async (e)=>{
    const b = e.target.closest('.tm-btn');
    if (!b) return;
    const k = b.dataset.key;
    const consultId = tmConsultId();

    // toggles visuais
    if (k==='mic') { 
      b.classList.toggle('muted'); 
      const icon = b.querySelector('use');
      icon.setAttribute('href', b.classList.contains('muted') ? '#i-mic-off' : '#i-mic');
      await tmApi('/api/consultation/toggle-mic', {method:'POST', json:{consultId, muted:b.classList.contains('muted')}});
      return; 
    }
    if (k==='cam') { 
      b.classList.toggle('muted'); 
      await tmApi('/api/consultation/toggle-camera', {method:'POST', json:{consultId, enabled:!b.classList.contains('muted')}});
      return; 
    }

    // ações diretas
    if (k==='attach') tmUpload(consultId);
    if (k==='snap') await tmSnapshot(consultId);
    if (k==='chat') {
      // tenta múltiplos seletores para o chat
      const chatTab = document.querySelector('[data-tab="chat"], .tab-chat, [role="tab"][aria-controls*="chat"], [data-target="#chat"]');
      if (chatTab) chatTab.click();
      else console.log('Chat tab não encontrada');
    }
    if (k==='bell') {
      await tmApi('/api/consultation/notifications', {method:'GET'});
      console.log('Verificando notificações...');
    }
    if (k==='ai') {
      // abre painel Dr. AI
      const aiPanel = document.getElementById('tmDrAiPanel');
      if (aiPanel) aiPanel.classList.add('open');
      else console.log('Painel Dr. AI não encontrado');
    }
    if (k==='hold') {
      b.classList.toggle('active');
      const onHold = b.classList.contains('active');
      await tmApi('/api/consultation/hold', {method:'POST', json:{consultId, hold:onHold}});
      console.log(onHold ? 'Paciente em espera' : 'Consulta retomada');
    }
    if (k==='end') {
      if (confirm('Tem certeza que deseja encerrar a consulta?')) {
        await tmApi('/api/consultation/end', {method:'POST', json:{consultId}});
        window.location.href = '/dashboard';
      }
    }
  });

  function btn(iconId, tip, key, extra=''){
    return `<div class="tm-btn ${extra}" data-key="${key}" aria-label="${tip}" title="${tip}">
      ${tmIcon(iconId)}<div class="tm-tooltip">${tip}</div>
    </div>`;
  }
}

// =============== bootstrap =================
(function bootstrapEnhanced(){
  const stageBlk = tmEnsureTwoColumns();
  tmEnsureControls(stageBlk);
})();

// ---------- Resizer do painel lateral (flex/width) com persistência ----------
(function initSideResizer(){
  const side =
    document.querySelector('[data-panel="side"]') ||
    document.querySelector('.side-panel') ||
    document.querySelector('.right-panel') ||
    document.querySelector('.left-panel') ||
    document.querySelector('.consult-panel') ||
    document.querySelector('.consult-notes') ||
    document.querySelector('.split-right') ||
    document.querySelector('#rightPane');

  if (!side) return;

  // garante base
  side.style.position = side.style.position || 'relative';
  side.style.overflow = side.style.overflow || 'visible';

  // onde fica o handle? (direita se o painel está à esquerda da tela)
  const rect = side.getBoundingClientRect();
  const isLeft = rect.left < (window.innerWidth / 2);

  // limites e chave de storage
  const KEY = 'telemed_notes_width';
  const MIN = 320, MAX = 720;

  // helper para aplicar largura em qualquer layout
  const applyWidth = (wPx) => {
    const w = Math.min(MAX, Math.max(MIN, Math.round(wPx)));
    side.style.width = w + 'px';
    side.style.flex = '0 0 ' + w + 'px';   // funciona em flex layouts
    side.style.maxWidth = w + 'px';
    localStorage.setItem(KEY, String(w));
    // Sincroniza variável CSS
    document.documentElement.style.setProperty('--notes-w', w + 'px');
    
    // Chama callback do resizer se existir
    if (window.tmResizer && typeof window.tmResizer.onWidthChange === 'function') {
      window.tmResizer.onWidthChange(w);
    }
    
    return w;
  };

  // restaura se existir
  const saved = Number(localStorage.getItem(KEY));
  if (saved) applyWidth(saved);

  // injeta / posiciona handle
  let handle = document.getElementById('tmResizer');
  if (!handle) {
    handle = document.createElement('div');
    handle.id = 'tmResizer';
    side.appendChild(handle);
  }
  handle.style.left  = isLeft ? 'auto' : '-4px';
  handle.style.right = isLeft ? '-4px' : 'auto';

  let dragging = false, startX = 0, startW = parseInt(getComputedStyle(side).width,10)||480;

  const onMove = (e) => {
    if (!dragging) return;
    const x = (e.clientX || e.touches?.[0]?.clientX);
    const dx = x - startX;
    // se o painel está do lado esquerdo, arrastar para a direita aumenta (dx positivo)
    // se está do lado direito, o inverso
    const factor = isLeft ? 1 : -1;
    applyWidth(startW + factor * dx);
  };

  const stop = () => {
    dragging = false;
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', stop);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', stop);
  };

  const start = (e) => {
    dragging = true;
    startX = (e.clientX || e.touches?.[0]?.clientX);
    startW = parseInt(getComputedStyle(side).width,10) || 480;
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', stop);
  };

  handle.addEventListener('mousedown', start);
  handle.addEventListener('touchstart', start, {passive:false});

  // expõe helper no console e passa a RETORNAR o valor aplicado
  window.tmSetNotesWidth = (w) => applyWidth(Number(w)||480);
})();

// ---------- Card do paciente sobre o vídeo ----------
(function mountPatientBanner(){
  // Verificar se já existe um banner (evitar duplicação)
  if (document.getElementById('patientBanner')) return;
  
  // tenta localizar a área de vídeo
  const stage =
    document.querySelector('.video-area') ||
    document.querySelector('#videoStage') ||
    document.querySelector('.call-stage') ||
    document.querySelector('[data-video-stage]') ||
    document.querySelector('.split-left') ||
    document.querySelector('#leftPane');
  if (!stage) return;

  // colete dados já visíveis no cabeçalho/sua UI  
  const name  = (document.querySelector('[data-patient-name]') || document.querySelector('.patient-name') || document.querySelector('#pbName'))?.textContent?.trim() || 'Ana Costa Silva';
  const phone = (document.querySelector('[data-patient-phone]')|| document.querySelector('.patient-phone') || document.querySelector('#pbPhone'))?.textContent?.trim() || '11 98765-4321';
  const age   = (document.querySelector('[data-patient-age]')  || document.querySelector('.patient-age') || document.querySelector('#pbAge'))?.textContent?.trim() || '35 anos';

  const banner = document.createElement('div');
  banner.id = 'patientBanner';
  banner.innerHTML = `
    <div>
      <div class="name">${name}</div>
      <div class="meta">${phone ? '📞 ' + phone : ''}${age ? (phone ? ' • ' : '') + age : ''}</div>
    </div>
    <button id="pbInvite">Convite</button>
  `;
  stage.style.position = stage.style.position || 'relative';
  stage.appendChild(banner);

  // ação do convite
  const inviteBtn = banner.querySelector('#pbInvite');
  inviteBtn?.addEventListener('click', async () => {
    try {
      await fetch('/api/consults/ABC123/invite', { method: 'POST' });
      inviteBtn.textContent = 'Convite enviado';
      setTimeout(()=> inviteBtn.textContent = 'Convite', 2500);
    } catch (e) {
      console.warn('Falha ao enviar convite', e);
    }
  });
})();