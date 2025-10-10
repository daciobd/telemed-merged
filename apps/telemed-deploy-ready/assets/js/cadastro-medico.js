// TeleMed — Cadastro de Médico (robusto)
// - Não quebra se algum seletor não existir
// - Garante a presença dos botões essenciais
// - Funciona mesmo sem <form>; usa #cadastro-medico ou <main> como escopo

(function () {
  // Evita rodar duas vezes
  if (window.__cadastroMedicoInit) return;
  window.__cadastroMedicoInit = true;

  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  ready(() => {
    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const on = (target, type, handler, opts) => {
      const el = typeof target === 'string' ? $(target) : target;
      if (!el) { console.warn('[cadastro-medico] Elemento não encontrado:', target); return; }
      el.addEventListener(type, handler, opts);
    };

    // Escopo visual principal
    const scope =
      $('#cadastro-medico') ||
      $('main.card') ||
      $('main') ||
      document.body;

    // Container de ações (cria se faltar)
    let actions =
      $('#actions', scope) ||
      $('[data-actions]', scope) ||
      $('.actions-row', scope) ||
      $('.form-actions', scope);

    if (!actions) {
      actions = document.createElement('div');
      actions.id = 'actions';
      actions.className = 'actions-row';
      scope.appendChild(actions);
      console.info('[cadastro-medico] Criado container #actions');
    }

    // Helpers de garantia
    const ensure = (id, html) => {
      if (!document.getElementById(id)) {
        actions.insertAdjacentHTML('beforeend', html);
      }
    };

    // Garante botões essenciais
    ensure('btn-salvar',
      `<button type="button" id="btn-salvar" class="btn btn-primary">Salvar cadastro</button>`);
    ensure('btn-limpar',
      `<button type="button" id="btn-limpar" class="btn btn-ghost">Limpar</button>`);
    ensure('btn-demo-medico',
      `<a id="btn-demo-medico" class="btn btn-success" href="/public/medico-demo.html">Ir para Demo Médico</a>`);
    ensure('btn-ja-tenho-cadastro',
      `<a id="btn-ja-tenho-cadastro" class="btn btn-secondary" href="/public/medico-login.html">Já tenho cadastro</a>`);

    // Campos do cadastro (limitamos o escopo para não afetar a página toda)
    const fieldSelector = '#cadastro-medico input, #cadastro-medico textarea, #cadastro-medico select, main.card input, main.card textarea, main.card select';

    // Listeners seguros
    on('#btn-salvar', 'click', () => {
      // DEMO: coleta campos por name/id e salva no localStorage
      const data = {};
      $$(fieldSelector).forEach((el) => {
        const key = el.name || el.id || '';
        if (!key) return;
        if (el.type === 'checkbox') data[key] = !!el.checked;
        else if (el.type === 'radio') { if (el.checked) data[key] = el.value; }
        else data[key] = el.value || '';
      });

      try {
        const now = new Date().toISOString();
        const payload = { data, savedAt: now, source: 'cadastro-medico-demo' };
        localStorage.setItem('telemed.medico', JSON.stringify(payload));
        alert('✅ Cadastro salvo (DEMO). Redirecionando para o Demo do Médico...');
        // Redireciona para a demo do médico
        setTimeout(() => {
          location.href = '/public/medico-demo.html';
        }, 1000);
      } catch (e) {
        console.error('[cadastro-medico] Falha ao salvar demo:', e);
        alert('Não foi possível salvar (DEMO). Veja o console.');
      }
    });

    on('#btn-limpar', 'click', () => {
      $$(fieldSelector).forEach((el) => {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
      });
    });

    // Back opcional
    on('#cta-voltar', 'click', () => history.back());

    // Telemetria leve (não bloqueante)
    try {
      window.Telemetry?.event?.({event_name:'page_view',meta:{page:'/public/cadastro-medico.html'}});
      console.debug('[cadastro-medico] pageview', {
        path: location.pathname,
        ts: Date.now()
      });
    } catch {}

    // Segurança: nunca quebre por falta de elementos
    // Se houver handlers adicionais, use sempre `on(selector, ...)`
  });
})();
