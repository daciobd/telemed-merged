/**
 * TeleMed Feature Flags System
 * Sistema básico de feature flags para o piloto
 */

// Configuração de flags (em produção viria de API/DB)
const FEATURE_FLAGS = {
  // Dr. AI Features
  'dr-ai-enabled': true,
  'dr-ai-specialty-suggestions': true,  
  'dr-ai-symptom-checker': true,
  'dr-ai-safety-flags': true,
  
  // Onboarding & Access Control
  'restricted-signup': false, // Se true, só usuários na whitelist podem se cadastrar
  'pilot-mode': true, // Modo piloto ativo
  'doctor-verification': false, // Verificação de CRM obrigatória
  'patient-cpf-validation': false, // Validação real de CPF
  
  // UI/UX Features  
  'feedback-banner': true, // Banner de feedback na sala de espera
  'status-page': true, // Página de status pública
  'advanced-metrics': false, // Dashboard detalhado de métricas
  
  // Notifications & Communication
  'email-notifications': false, // Notificações por email
  'whatsapp-notifications': false, // Notificações por WhatsApp
  'push-notifications': false, // Notificações push
  
  // Debugging & Development  
  'debug-mode': false, // Logs detalhados no console
  'test-data-visible': true, // Exibir dados de teste na UI
};

// Whitelist para acesso restrito (quando restricted-signup = true)
const PILOT_WHITELIST = [
  // E-mails de médicos do piloto
  'medico1@teste.com',
  'medico2@teste.com', 
  'dr.teste@piloto.com',
  // E-mails de pacientes de teste
  'paciente1@teste.com',
  'paciente2@teste.com'
];

/**
 * Verifica se uma feature flag está habilitada
 * @param {string} flagName - Nome da flag
 * @returns {boolean} - Se a flag está ativa
 */
function isFeatureEnabled(flagName) {
  const enabled = FEATURE_FLAGS[flagName];
  
  if (typeof enabled === 'undefined') {
    console.warn(`Feature flag '${flagName}' não encontrada. Assumindo como desabilitada.`);
    return false;
  }
  
  // Log debug se debug-mode estiver ativo
  if (FEATURE_FLAGS['debug-mode']) {
    console.log(`[FF] ${flagName}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  return Boolean(enabled);
}

/**
 * Verifica se usuário está na whitelist do piloto
 * @param {string} email - Email do usuário
 * @returns {boolean} - Se está autorizado
 */
function isUserAllowed(email) {
  if (!isFeatureEnabled('restricted-signup')) {
    return true; // Acesso aberto
  }
  
  const allowed = PILOT_WHITELIST.includes(email.toLowerCase());
  
  if (isFeatureEnabled('debug-mode')) {
    console.log(`[FF] Whitelist check for ${email}: ${allowed ? 'ALLOWED' : 'DENIED'}`);
  }
  
  return allowed;
}

/**
 * Obtém todas as flags e seus estados
 * @returns {object} - Objeto com todas as flags
 */
function getAllFlags() {
  return { ...FEATURE_FLAGS };
}


/**
 * Helper para mostrar/ocultar elementos baseado em flags
 * @param {string} selector - Seletor CSS
 * @param {string} flagName - Nome da flag
 */
function toggleElementByFlag(selector, flagName) {
  const elements = document.querySelectorAll(selector);
  const show = isFeatureEnabled(flagName);
  
  elements.forEach(el => {
    el.style.display = show ? '' : 'none';
    if (show) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', 'true');
    }
  });
}

/**
 * Aplica flags automaticamente baseado em data-attributes
 * Uso: <div data-feature-flag="dr-ai-enabled">Conteúdo</div>
 */
function applyAutoFlags() {
  const elements = document.querySelectorAll('[data-feature-flag]');
  
  elements.forEach(el => {
    const flagName = el.getAttribute('data-feature-flag');
    const enabled = isFeatureEnabled(flagName);
    
    if (!enabled) {
      el.style.display = 'none';
      el.setAttribute('hidden', 'true');
    }
  });
}

/**
 * Configura banner do modo piloto
 */
function setupPilotBanner() {
  if (!isFeatureEnabled('pilot-mode')) return;
  
  // Só adiciona se não existir já
  if (document.getElementById('pilot-banner')) return;
  
  const banner = document.createElement('div');
  banner.id = 'pilot-banner';
  banner.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; background: #f59e0b; color: #000; text-align: center; padding: 8px; font-size: 14px; z-index: 10000; font-weight: 600;">
      🧪 AMBIENTE DE PILOTO - Não use dados reais. Este é um ambiente de testes.
      <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>
    </div>
  `;
  banner.style.display = 'block';
  
  // Adicionar margem ao body para compensar o banner fixo
  document.body.style.marginTop = '40px';
  
  document.body.appendChild(banner);
}

/**
 * Logs estruturados para analytics
 * @param {string} flagName - Flag que foi verificada
 * @param {boolean} result - Resultado da verificação
 */
function logFeatureFlagUsage(flagName, result) {
  // Enviar para sistema de analytics se disponível
  if (window.TelemedAnalytics && typeof window.TelemedAnalytics.track === 'function') {
    window.TelemedAnalytics.track('feature_flag_checked', {
      flag_name: flagName,
      result: result,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
  }
}

/**
 * Carregar flags do localStorage
 */
function loadFlagsFromStorage() {
  try {
    const stored = localStorage.getItem('telemed_feature_flags');
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.assign(FEATURE_FLAGS, parsed);
    }
  } catch (e) {
    console.warn('Falha ao carregar feature flags do localStorage:', e);
  }
}

/**
 * Salvar flags no localStorage
 */
function saveFlagsToStorage() {
  try {
    localStorage.setItem('telemed_feature_flags', JSON.stringify(FEATURE_FLAGS));
  } catch (e) {
    console.warn('Falha ao salvar feature flags no localStorage:', e);
  }
}

/**
 * Atualiza uma flag e salva
 */
function setFeatureFlag(flagName, value) {
  FEATURE_FLAGS[flagName] = Boolean(value);
  saveFlagsToStorage();
  
  if (isFeatureEnabled('debug-mode')) {
    console.log(`[FF] Flag '${flagName}' atualizada para: ${value}`);
  }
  
  // Disparar evento personalizado para componentes que escutam
  window.dispatchEvent(new CustomEvent('feature-flag-changed', {
    detail: { flagName, value }
  }));
}

// Exportar funções globalmente ANTES do DOMContentLoaded
window.FeatureFlags = {
  isEnabled: isFeatureEnabled,
  isUserAllowed: isUserAllowed,
  getAll: getAllFlags,
  set: setFeatureFlag,
  toggleElement: toggleElementByFlag,
  applyAuto: applyAutoFlags,
  save: saveFlagsToStorage,
  load: loadFlagsFromStorage
};

// Auto-inicialização quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  // Carregar flags do storage primeiro
  loadFlagsFromStorage();
  
  // Aplicar flags automáticas
  applyAutoFlags();
  
  // Configurar banner do piloto
  setupPilotBanner();
  
  // Debug: mostrar todas as flags ativas no console
  if (isFeatureEnabled('debug-mode')) {
    console.group('🏁 Feature Flags Status');
    Object.entries(FEATURE_FLAGS).forEach(([flag, enabled]) => {
      console.log(`${enabled ? '✅' : '❌'} ${flag}`);
    });
    console.groupEnd();
  }
});

// Já exportado acima