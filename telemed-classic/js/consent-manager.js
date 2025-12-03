/**
 * TeleMed Consent Manager - Hardened TTL Implementation
 * Gerencia consentimento com expiração automática
 */

class ConsentManager {
  constructor() {
    this.CONSENT_TTL_DAYS = 30;
    this.STORAGE_KEY = 'telemed_consent';
  }
  
  /**
   * Verificar se consentimento é válido (não expirado)
   */
  isConsentValid() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;
      
      const consent = JSON.parse(stored);
      const now = Date.now();
      
      // Verificar se não expirou
      if (consent.expiresAt && now > consent.expiresAt) {
        console.log('🕒 Consentimento expirado - removendo');
        this.clearConsent();
        return false;
      }
      
      return consent.accepted === true;
    } catch (error) {
      console.warn('Erro ao verificar consentimento:', error.message);
      this.clearConsent();
      return false;
    }
  }
  
  /**
   * Salvar consentimento com TTL
   */
  setConsent(accepted, metadata = {}) {
    const now = Date.now();
    const expiresAt = now + (this.CONSENT_TTL_DAYS * 24 * 60 * 60 * 1000);
    
    const consent = {
      accepted,
      timestamp: now,
      expiresAt,
      version: '1.0',
      metadata: {
        userAgent: navigator.userAgent.substring(0, 100),
        url: window.location.href,
        ...metadata
      }
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consent));
      console.log(`✅ Consentimento salvo - expira em ${this.CONSENT_TTL_DAYS} dias`);
      
      // Log para auditoria
      if (window.audit) {
        window.audit.log('consent_updated', {
          accepted,
          expires_in_days: this.CONSENT_TTL_DAYS,
          version: consent.version
        });
      }
    } catch (error) {
      console.error('Falha ao salvar consentimento:', error.message);
    }
  }
  
  /**
   * Limpar consentimento
   */
  clearConsent() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ Consentimento removido');
  }
  
  /**
   * Obter detalhes do consentimento
   */
  getConsentDetails() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const consent = JSON.parse(stored);
      const now = Date.now();
      const daysUntilExpiry = Math.floor((consent.expiresAt - now) / (24 * 60 * 60 * 1000));
      
      return {
        ...consent,
        isValid: now <= consent.expiresAt,
        daysUntilExpiry: Math.max(0, daysUntilExpiry)
      };
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Validar em cada page load (chamar no DOMContentLoaded)
   */
  validateOnPageLoad() {
    const isValid = this.isConsentValid();
    
    if (!isValid) {
      // Mostrar banner de consentimento
      console.log('📋 Consentimento necessário ou expirado');
      this.showConsentBanner();
    } else {
      const details = this.getConsentDetails();
      if (details && details.daysUntilExpiry <= 7) {
        console.log(`⏰ Consentimento expira em ${details.daysUntilExpiry} dias`);
      }
    }
    
    return isValid;
  }
  
  /**
   * Mostrar banner de consentimento (integração com consent-banner.js)
   */
  showConsentBanner() {
    // Integrar com sistema de banner existente
    if (window.ConsentBanner) {
      window.ConsentBanner.show();
    } else {
      console.warn('ConsentBanner não disponível');
    }
  }
}

// Inicializar globalmente
window.ConsentManager = new ConsentManager();

// Auto-validar em page load
document.addEventListener('DOMContentLoaded', function() {
  window.ConsentManager.validateOnPageLoad();
});