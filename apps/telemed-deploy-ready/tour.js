// ==========================================
// TeleMed Interactive Tour System
// Auto-start, multi-page navigation, pause on interaction
// ==========================================

// === Config ===
const TOUR_KEY = "telemed_tour_progress";
const PAUSE_ON_USER_INPUT = true;

const cfg = {
  autoplay: false,
  intervalMs: 2800
};

let i = 0;
let paused = false;
let timer = null;
let overlay = null;
let tooltip = null;

// === Aliases de Rotas ===
const PAGE_ALIASES = {
  "/meus-pacientes/": ["/meus-pacientes/", "/meus-pacientes/index.html"],
};

// === Helpers ===
function normalizePath(p) {
  try {
    const u = new URL(p, location.origin);
    let path = u.pathname;
    if (path.endsWith("/index.html")) path = path.replace(/\/index\.html$/, "/");
    return path;
  } catch { return p; }
}

function samePage(targetPage, currentPathname) {
  const t = normalizePath(targetPage);
  const c = normalizePath(currentPathname);
  if (t === c) return true;
  const aliases = PAGE_ALIASES[t] || [];
  return aliases.map(normalizePath).includes(c);
}

function resolveStepEl(step) {
  if (step.selector) return document.querySelector(step.selector);
  if (typeof step.find === "function") return step.find();
  return null;
}

function shouldAutoStart() {
  const url = new URL(location.href);
  return url.searchParams.get("autodemo") === "1" || url.searchParams.get("tour") === "1";
}

function armPauseOnUserInput() {
  if (!PAUSE_ON_USER_INPUT) return;
  const pause = () => { paused = true; clearTimeout(timer); };
  window.addEventListener("keydown", pause, { once: true, capture: true });
  window.addEventListener("mousedown", pause, { once: true, capture: true });
  window.addEventListener("touchstart", pause, { once: true, capture: true });
}

// === Element Finder Helpers ===
function getButtonByText(txt) {
  return [...document.querySelectorAll('button')].find(b => b.textContent.trim().includes(txt));
}

function firstPatientRow() {
  return document.querySelector('#patients-table tbody tr:first-child');
}

function rowButtonByText(row, txt) {
  if (!row) return null;
  return [...row.querySelectorAll('button')].find(b => b.textContent.trim().includes(txt));
}

function dispatchInput(el, value) {
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

// === LocalStorage ===
function saveIdx(idx) {
  try { localStorage.setItem(TOUR_KEY, String(idx)); } catch {}
}

function loadIdx() {
  try {
    const v = localStorage.getItem(TOUR_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}

function clearIdx() {
  try { localStorage.removeItem(TOUR_KEY); } catch {}
}

// === Tour Steps ===
const steps = [
  /* =========================== /toast-demo.html =========================== */
  {
    page: "/toast-demo.html",
    find: () => getButtonByText("✅ Success Toast"),
    title: "Toasts de sucesso",
    text: "Clique para ver um toast de sucesso com visual consistente.",
    pos: "bottom",
    action: () => setTimeout(() => getButtonByText("✅ Success Toast")?.click(), 300)
  },
  {
    page: "/toast-demo.html",
    find: () => document.querySelector(".toast-item.toast-success") || document.querySelector(".toast-item"),
    title: "Feedback visível",
    text: "Os toasts aparecem no container dedicado e somem sozinhos ou no X.",
    pos: "right"
  },
  {
    page: "/toast-demo.html",
    find: () => getButtonByText("❌ Error Toast"),
    title: "Erros bem comunicados",
    text: "Erro com contraste e ícone evidentes para reduzir ambiguidade.",
    pos: "bottom",
    action: () => setTimeout(() => getButtonByText("❌ Error Toast")?.click(), 300)
  },
  {
    page: "/toast-demo.html",
    find: () => document.querySelector(".toast-item.toast-error") || document.querySelector(".toast-item"),
    title: "Toast de erro",
    text: "Mensagens críticas chamam atenção imediata.",
    pos: "left"
  },
  {
    page: "/toast-demo.html",
    find: () => getButtonByText("⚠️ Warning Toast"),
    title: "Avisos (warning)",
    text: "Usados para riscos não fatais, prevenindo falhas do usuário.",
    pos: "bottom",
    action: () => setTimeout(() => getButtonByText("⚠️ Warning Toast")?.click(), 300)
  },
  {
    page: "/toast-demo.html",
    find: () => getButtonByText("ℹ️ Info Toast"),
    title: "Informações neutras",
    text: "Informam sem bloquear o fluxo (não-intrusivas).",
    pos: "bottom",
    action: () => setTimeout(() => getButtonByText("ℹ️ Info Toast")?.click(), 300)
  },
  {
    page: "/toast-demo.html",
    find: () => getButtonByText("🚀 Mostrar Múltiplos Toasts"),
    title: "Vários toasts empilhados",
    text: "Demonstra estabilidade visual com múltiplas notificações simultâneas.",
    pos: "bottom",
    action: () => setTimeout(() => getButtonByText("🚀 Mostrar Múltiplos Toasts")?.click(), 300)
  },
  {
    page: "/toast-demo.html",
    find: () => document.querySelector("#toast-container") || document.querySelector(".toast-item"),
    title: "Container de toasts",
    text: "Centraliza empilhamento e animações (id: #toast-container).",
    pos: "right"
  },

  /* =========================== /meus-pacientes/ =========================== */
  {
    page: "/meus-pacientes/",
    selector: "#filter-nome",
    title: "Busca por Nome",
    text: "Filtro reativo por nome. Vamos preencher automaticamente 'Maria'.",
    pos: "bottom",
    action: () => dispatchInput(document.querySelector("#filter-nome"), "Maria")
  },
  {
    page: "/meus-pacientes/",
    selector: "#filter-identificacao",
    title: "Filtro por Identificação",
    text: "Aceita CPF/ID. Auto-preenchemos um exemplo.",
    pos: "bottom",
    action: () => dispatchInput(document.querySelector("#filter-identificacao"), "123.456.789-00")
  },
  {
    page: "/meus-pacientes/",
    selector: "#filter-especialidade",
    title: "Especialidade com autocomplete/seleção",
    text: "Escolha uma especialidade para reduzir o escopo.",
    pos: "bottom",
    action: () => dispatchInput(document.querySelector("#filter-especialidade"), "Cardiologia")
  },
  {
    page: "/meus-pacientes/",
    selector: ".filter-btn",
    title: "Aplicar filtros",
    text: "Clique em '🔍 Filtrar' para atualizar a lista.",
    pos: "left",
    action: () => setTimeout(() => document.querySelector(".filter-btn")?.click(), 300)
  },
  {
    page: "/meus-pacientes/",
    selector: "#patients-table",
    title: "Tabela de Pacientes",
    text: "Dados realistas e linha com hover para melhor leitura.",
    pos: "top"
  },
  {
    page: "/meus-pacientes/",
    selector: "#patients-table tbody tr:first-child",
    title: "Primeira linha",
    text: "Foco rápido no primeiro resultado filtrado.",
    pos: "right"
  },
  {
    page: "/meus-pacientes/",
    find: () => rowButtonByText(firstPatientRow(), "📋 Ver PHR"),
    title: "Acessar PHR",
    text: "Clique para abrir o prontuário do paciente.",
    pos: "left",
    action: () => setTimeout(() => rowButtonByText(firstPatientRow(), "📋 Ver PHR")?.click(), 350)
  },

  /* =========================== /phr.html =========================== */
  {
    page: "/phr.html",
    selector: ".topbar",
    title: "Prontuário do Paciente (PHR)",
    text: "Cabeçalho claro e hierarquia de informação.",
    pos: "bottom"
  },
  {
    page: "/phr.html",
    selector: ".container",
    title: "Área de conteúdo",
    text: "Sistema de PHR integrado com toasts para feedback.",
    pos: "top"
  }
];

// === UI Layers ===
function ensureLayers() {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "tour-overlay";
    document.body.appendChild(overlay);
  }
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tour-tooltip";
    document.body.appendChild(tooltip);
  }
}

function highlight(el) {
  const rect = el.getBoundingClientRect();
  overlay.innerHTML = `
    <div class="tour-spotlight" style="
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: none;
      border-radius: 8px;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.6), 0 0 0 9999px rgba(0, 0, 0, 0.7);
      z-index: 10000;
      transition: all 0.3s ease;
    "></div>
  `;
}

function renderTip(idx, total, step) {
  tooltip.innerHTML = `
    <div class="tour-tip-content">
      <div class="tour-tip-header">
        <strong>${step.title}</strong>
        <span class="tour-counter">${idx + 1}/${total}</span>
      </div>
      <p>${step.text}</p>
      <div class="tour-tip-actions">
        <button onclick="tourPrev()" ${idx === 0 ? 'disabled' : ''}>← Anterior</button>
        <button onclick="tourNext()">${idx === total - 1 ? 'Finalizar' : 'Próximo →'}</button>
        <button onclick="tourEnd()" class="tour-close">✕</button>
      </div>
    </div>
  `;
}

function placeTooltip(el, pos = "bottom") {
  const rect = el.getBoundingClientRect();
  const tipRect = tooltip.getBoundingClientRect();
  const gap = 12;

  let top, left;
  switch (pos) {
    case "top":
      top = rect.top - tipRect.height - gap;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.right + gap;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tipRect.height / 2;
      left = rect.left - tipRect.width - gap;
      break;
    case "bottom":
    default:
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - tipRect.width / 2;
  }

  // Bounds check
  if (top < 0) top = gap;
  if (left < 0) left = gap;
  if (left + tipRect.width > window.innerWidth) {
    left = window.innerWidth - tipRect.width - gap;
  }

  tooltip.style.top = top + "px";
  tooltip.style.left = left + "px";
}

function cleanup() {
  if (overlay) overlay.remove();
  if (tooltip) tooltip.remove();
  overlay = null;
  tooltip = null;
}

// === Navigation ===
function goTo(idx) {
  i = idx;
  if (i < 0) i = 0;
  if (i >= steps.length) return end();
  saveIdx(i);

  const step = steps[i];

  // Cross-page navigation
  if (!samePage(step.page, location.pathname)) {
    const nav = new URL(step.page, location.origin);
    nav.searchParams.set("tour", "1");
    location.href = nav.toString();
    return;
  }

  ensureLayers();
  const el = resolveStepEl(step);
  if (!el) return next();

  // Execute action
  if (typeof step.action === "function") {
    try { step.action(); } catch (e) { console.warn("Tour action error:", e); }
  }

  highlight(el);
  renderTip(i, steps.length, step);
  requestAnimationFrame(() => placeTooltip(el, step.pos));

  if (cfg.autoplay && !paused) schedule();
}

function next() {
  clearTimeout(timer);
  goTo(i + 1);
}

function prev() {
  clearTimeout(timer);
  paused = true;
  goTo(i - 1);
}

function end() {
  cleanup();
  clearIdx();
  clearTimeout(timer);
  console.log("✅ Tour concluído!");
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(next, cfg.intervalMs);
}

// === Global Controls ===
window.tourNext = next;
window.tourPrev = prev;
window.tourEnd = end;

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("start-demo");
  if (btn) {
    btn.addEventListener("click", () => {
      cfg.autoplay = true;
      armPauseOnUserInput();
      goTo(0);
      const url = new URL(location.href);
      url.searchParams.set("tour", "1");
      history.replaceState({}, "", url);
    });
  }

  if (shouldAutoStart()) {
    cfg.autoplay = true;
    armPauseOnUserInput();
    const idx = loadIdx();
    goTo(Number.isFinite(idx) && idx > 0 ? idx : 0);
  }
});

console.log("🎯 TeleMed Interactive Tour carregado!");
