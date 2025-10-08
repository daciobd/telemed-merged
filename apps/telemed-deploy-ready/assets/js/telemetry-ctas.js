// Não atrapalhar navegação quando houver href real
(function() {
  function setupCTATelemetry() {
    document.querySelectorAll('a.tile,a.tm-card,a.chip,button.tile,button.tm-card,button.chip').forEach(el => {
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
          console.log('🚫 CTA bloqueado (sem href real):', name);
          return;
        }

        // Se é link real, previne navegação padrão e usa window.location.assign
        // para garantir que telemetria seja enviada
        e.preventDefault();
        setTimeout(() => { window.location.assign(href); }, 0);
        console.log('✅ CTA navegando para:', href);
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
