/**
 * TeleMed Consent Banner
 * Banner de consentimento para o piloto
 */

class ConsentBanner {
  constructor() {
    this.consentGiven = this.checkExistingConsent();
    this.init();
  }

  checkExistingConsent() {
    const consent = localStorage.getItem('telemed_consent');
    if (!consent) return false;
    
    try {
      const parsed = JSON.parse(consent);
      // Verificar se consent ainda é válido (dentro de 30 dias)
      const consentDate = new Date(parsed.timestamp);
      const now = new Date();
      const daysDiff = (now - consentDate) / (1000 * 60 * 60 * 24);
      
      return daysDiff <= 30;
    } catch {
      return false;
    }
  }

  init() {
    // Se consentimento já foi dado, não mostrar banner
    if (this.consentGiven) return;
    
    // Se feature flag estiver desabilitada, não mostrar
    if (window.FeatureFlags && !window.FeatureFlags.isEnabled('pilot-mode')) return;
    
    this.createBanner();
    this.showBanner();
  }

  createBanner() {
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 16px 20px;
        z-index: 10000;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
      ">
        <div style="
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        ">
          <div style="flex: 1; min-width: 300px;">
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;
            ">
              <span style="
                background: #f59e0b;
                color: #000;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 700;
              ">PILOTO</span>
              <span style="color: #eaf0ff; font-weight: 600; font-size: 14px;">
                Ambiente de Testes
              </span>
            </div>
            <p style="
              margin: 0;
              color: #cbd5e1;
              font-size: 14px;
              line-height: 1.4;
            ">
              Este é um ambiente de testes. <strong style="color: #fbbf24;">Não use dados reais.</strong> 
              Ao continuar, você concorda com nossos termos e que seus dados de teste serão descartados em 30 dias.
            </p>
          </div>
          
          <div style="
            display: flex;
            gap: 12px;
            align-items: center;
            flex-shrink: 0;
          ">
            <button id="consent-accept" style="
              background: #1c7bff;
              color: white;
              border: none;
              padding: 10px 18px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
              transition: background 0.2s;
            " onmouseover="this.style.background='#0056d9'" onmouseout="this.style.background='#1c7bff'">
              Aceitar e Continuar
            </button>
            
            <button id="consent-details" style="
              background: transparent;
              color: #94a3b8;
              border: 1px solid #374151;
              padding: 10px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              transition: all 0.2s;
            " onmouseover="this.style.borderColor='#6b7280'" onmouseout="this.style.borderColor='#374151'">
              Ver Detalhes
            </button>
            
            <button id="consent-close" style="
              background: none;
              border: none;
              color: #94a3b8;
              font-size: 18px;
              cursor: pointer;
              padding: 4px;
              line-height: 1;
            " title="Fechar">
              ×
            </button>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          #consent-banner > div > div {
            flex-direction: column !important;
            text-align: center !important;
          }
          
          #consent-banner button {
            width: 100% !important;
            margin: 4px 0 !important;
          }
        }
      </style>
    `;
    
    document.body.appendChild(banner);
    this.attachEvents();
  }

  attachEvents() {
    const acceptBtn = document.getElementById('consent-accept');
    const detailsBtn = document.getElementById('consent-details');
    const closeBtn = document.getElementById('consent-close');
    
    acceptBtn.addEventListener('click', () => this.acceptConsent());
    detailsBtn.addEventListener('click', () => this.showDetails());
    closeBtn.addEventListener('click', () => this.closeBanner());
  }

  acceptConsent() {
    // Salvar consentimento
    localStorage.setItem('telemed_consent', JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      method: 'banner_quick_accept'
    }));

    // Log de auditoria
    if (window.AuditLogger) {
      window.AuditLogger.logAuth('consent_given', {
        success: true,
        method: 'banner',
        consent_version: '1.0'
      });
    }

    // Remover banner
    this.closeBanner();
    this.consentGiven = true;
  }

  showDetails() {
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `/termos-privacidade.html?return=${currentUrl}`;
  }

  closeBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
      banner.style.animation = 'slideDown 0.3s ease-out forwards';
      setTimeout(() => banner.remove(), 300);
      
      // Log de fechamento
      if (window.AuditLogger) {
        window.AuditLogger.log('consent_banner_closed', {
          action: 'closed_without_consent'
        });
      }
    }
  }

  showBanner() {
    // Aguardar um pouco para não interferir com carregamento da página
    setTimeout(() => {
      if (!this.consentGiven && !document.getElementById('consent-banner')) {
        this.createBanner();
      }
    }, 2000);
  }
}

// Auto-inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  // Só mostrar banner se feature flag estiver ativa
  if (window.FeatureFlags && window.FeatureFlags.isEnabled && window.FeatureFlags.isEnabled('pilot-mode')) {
    new ConsentBanner();
  }
});

// Adicionar CSS para animação de saída
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);