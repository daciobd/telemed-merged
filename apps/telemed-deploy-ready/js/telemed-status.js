/**
 * TeleMed Status Component
 * Mostra status público simples + painel dev oculto
 * Uso: <div id="telemed-status" data-endpoints='["/api/health"]'></div>
 */

(function() {
  function initTeleMedStatus() {
    const root = document.getElementById('telemed-status');
    if (!root) return;

    // Configuração
    const endpoints = (() => {
      try { return JSON.parse(root.dataset.endpoints || '[]'); }
      catch { return []; }
    })();
    const hubUrl = root.dataset.hubUrl || '/hub.html';
    const scribeUrl = root.dataset.scribeUrl || '/scribe-demo.html';
    
    // Estado do modo dev
    const devOn = new URLSearchParams(location.search).get('dev') === '1' 
                  || localStorage.getItem('tm_dev') === 'on';

    // Ping de endpoints com timeout
    async function ping(url) {
      const t0 = performance.now();
      try {
        const response = await fetch(url, { 
          cache: 'no-store', 
          signal: AbortSignal.timeout(8000) 
        });
        return { 
          ok: response.ok, 
          ms: Math.round(performance.now() - t0) 
        };
      } catch (error) {
        return { ok: false, ms: null, error: error.message };
      }
    }

    // Helper para criar elementos
    function el(tag, className, textContent) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (textContent) element.textContent = textContent;
      return element;
    }

    // Renderizar componente
    async function render() {
      const results = await Promise.all(endpoints.map(ping));
      const upCount = results.filter(r => r.ok).length;
      
      // Limpar container
      root.innerHTML = '';

      // 1) Status público (sempre visível)
      const publicStatus = el('div', 'tm-status');
      
      if (endpoints.length === 0) {
        publicStatus.classList.add('tm-warn');
        publicStatus.textContent = '🟡 Status: sem endpoints configurados';
      } else if (upCount === endpoints.length) {
        publicStatus.classList.add('tm-ok');
        publicStatus.textContent = '✅ Sistema pronto para uso';
      } else if (upCount > 0) {
        publicStatus.classList.add('tm-warn'); 
        publicStatus.textContent = '🟡 Serviço parcialmente disponível — tente novamente em instantes';
      } else {
        publicStatus.classList.add('tm-down');
        publicStatus.textContent = '🔴 Indisponível no momento — estamos ajustando';
      }
      
      root.appendChild(publicStatus);

      // 2) Painel técnico (dev only)
      const devPanel = el('section', 'tm-dev-panel');
      devPanel.hidden = !devOn;

      // Header do painel dev
      const devHeader = el('div', 'tm-row');
      const devTitle = el('strong', null, 'Console técnico');
      const toggleBtn = el('a', 'tm-btn tm-btn-ghost', devOn ? 'Ocultar (Ctrl+Alt+D)' : 'Mostrar (Ctrl+Alt+D)');
      toggleBtn.href = '#';
      toggleBtn.onclick = (e) => {
        e.preventDefault();
        window.TeleMedDev?.toggle(!devPanel.hidden);
      };

      devHeader.appendChild(devTitle);
      devHeader.appendChild(toggleBtn);
      devPanel.appendChild(devHeader);

      // Badges de health check
      if (endpoints.length > 0) {
        const badgesContainer = el('div', 'tm-badges-row');
        
        endpoints.forEach((url, i) => {
          const result = results[i];
          const badge = el('span', `tm-badge ${result.ok ? 'tm-badge--ok' : 'tm-badge--down'}`);
          const status = result.ok ? 'OK' : 'FALHA';
          const timing = result.ms ? ` (${result.ms}ms)` : '';
          const domain = url.replace(/^https?:\/\/([^\/]+).*/, '$1');
          
          badge.textContent = `${status} — ${domain}${timing}`;
          badgesContainer.appendChild(badge);
        });
        
        devPanel.appendChild(badgesContainer);
      }

      // Links de navegação dev
      const actionsRow = el('div', 'tm-row tm-actions');
      
      if (hubUrl) {
        const hubLink = el('a', 'tm-btn tm-btn-primary');
        hubLink.href = hubUrl;
        hubLink.textContent = 'Voltar ao Hub';
        actionsRow.appendChild(hubLink);
      }
      
      if (scribeUrl) {
        const scribeLink = el('a', 'tm-btn tm-btn-ghost');
        scribeLink.href = scribeUrl;
        scribeLink.target = '_blank';
        scribeLink.textContent = 'Abrir Scribe/CIDs';
        actionsRow.appendChild(scribeLink);
      }

      const refreshBtn = el('button', 'tm-btn tm-btn-ghost');
      refreshBtn.textContent = '🔄 Atualizar Status';
      refreshBtn.onclick = render;
      actionsRow.appendChild(refreshBtn);
      
      devPanel.appendChild(actionsRow);
      root.appendChild(devPanel);

      // Aplicar visibilidade a todos elementos .dev-only
      document.querySelectorAll('.dev-only, [data-dev-only]').forEach(el => {
        el.hidden = !devOn;
      });
    }

    // API global para controle do modo dev
    window.TeleMedDev = {
      toggle(on) {
        localStorage.setItem('tm_dev', on ? 'on' : 'off');
        location.reload();
      }
    };

    // Atalho de teclado Ctrl+Alt+D
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
        const current = localStorage.getItem('tm_dev') === 'on';
        window.TeleMedDev.toggle(!current);
      }
    });

    // Renderizar
    render();
  }

  // Auto-inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeleMedStatus);
  } else {
    initTeleMedStatus();
  }
})();