// Não atrapalhar a navegação quando o link é real
(function() {
  function setupCTATelemetry() {
    document.querySelectorAll('a.tile,button.tile').forEach(el => {
      const name = el.dataset.cta || el.id || 'cta';
      el.addEventListener('click', (e) => {
        const href = el.getAttribute('href');
        const isRealLink = href && href !== '#' && !href.startsWith('javascript:');

        // Telemetria primeiro (não bloqueante)
        try {
          window.Telemetry?.event?.({ event_name: 'cta_click', meta: { name } });
        } catch (_) {}

        // Só bloqueia se NÃO houver link real
        if (!isRealLink) {
          e.preventDefault();
          return;
        }

        // Deixa o navegador navegar para o href real
        // (pequeno setTimeout para não competir com logs)
        e.preventDefault();
        setTimeout(() => { window.location.assign(href); }, 0);
      }, false);
    });
  }

  // Garantir que o DOM está pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCTATelemetry);
  } else {
    setupCTATelemetry();
  }
})();
