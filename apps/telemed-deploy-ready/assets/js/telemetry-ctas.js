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
          console.log('🚫 CTA bloqueado (sem href real):', name);
          return;
        }

        // Se é link real, DEIXA O NAVEGADOR FAZER O TRABALHO DELE
        // Não faz preventDefault() - deixa a navegação acontecer naturalmente
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
