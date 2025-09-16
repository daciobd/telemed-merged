/**
 * TeleMed Audit Logger
 * Sistema de logs estruturados para auditoria do piloto
 */

class AuditLogger {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.userRole = null;
    this.startTime = Date.now();
  }

  /**
   * Gera um ID único para a sessão
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Gera um trace_id único para cada operação
   */
  generateTraceId() {
    return 'trc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Define o usuário atual
   */
  setUser(userId, role) {
    this.userId = userId;
    this.userRole = role;
    this.log('user_session_started', {
      user_id: userId,
      role: role,
      session_duration: Date.now() - this.startTime
    });
  }

  /**
   * Log estruturado principal
   */
  log(event, data = {}, level = 'INFO') {
    const traceId = this.generateTraceId();
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      event: event,
      trace_id: traceId,
      session_id: this.sessionId,
      user_id: this.userId,
      user_role: this.userRole,
      url: window.location.href,
      user_agent: navigator.userAgent,
      data: { ...data }
    };

    // Remover informações sensíveis
    this.sanitizeLog(logEntry);

    // Log no console para desenvolvimento
    if (window.FeatureFlags && window.FeatureFlags.isEnabled('debug-mode')) {
      console.group(`🔍 [${level}] ${event}`);
      console.log('Trace ID:', traceId);
      console.log('Data:', data);
      console.groupEnd();
    }

    // Enviar para endpoint de logs (se configurado)
    this.sendToServer(logEntry);

    // Enviar para analytics se disponível
    if (window.TelemedAnalytics && typeof window.TelemedAnalytics.track === 'function') {
      window.TelemedAnalytics.track(event, {
        trace_id: traceId,
        session_id: this.sessionId,
        ...data
      });
    }

    return traceId;
  }

  /**
   * Remove informações sensíveis dos logs
   */
  sanitizeLog(logEntry) {
    const sensitiveFields = ['password', 'cpf', 'rg', 'email', 'phone'];
    
    const sanitize = (obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          if (typeof obj[key] === 'string' && obj[key].length > 0) {
            obj[key] = '*'.repeat(Math.min(obj[key].length, 8));
          }
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      });
    };

    sanitize(logEntry.data);
  }

  /**
   * Envia logs para o servidor (com fallback para localStorage)
   */
  async sendToServer(logEntry) {
    try {
      // Tentar enviar para servidor centralizado primeiro
      const serverUrl = this.getLogServerUrl();
      
      if (serverUrl) {
        const success = await this.sendToLogServer(logEntry, serverUrl);
        if (success) {
          return; // Sucesso no servidor, não precisar armazenar localmente
        }
      }
      
      // Fallback: armazenar localmente
      this.storeLocalLog(logEntry);
      
    } catch (error) {
      console.warn('Falha ao enviar log para servidor:', error.message);
      this.storeLocalLog(logEntry);
    }
  }
  
  /**
   * Determina URL do servidor de logs
   */
  getLogServerUrl() {
    // Environment-agnostic: sempre tentar gateway primeiro
    
    // Produção: qualquer domínio 
    if (window.location.protocol === 'https:' || window.location.hostname.includes('onrender.com')) {
      // Tentar gateway relativo primeiro (se frontpage gateway), senão absoluto
      return window.location.hostname.includes('telemed-gateway') 
        ? '/api/logs' 
        : 'https://telemed-gateway.onrender.com/api/logs';
    }
    
    // Desenvolvimento: localhost/replit
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
      return null; // Usar localStorage em desenvolvimento
    }
    
    // Fallback: tentar gateway mesmo em domínios customizados
    return 'https://telemed-gateway.onrender.com/api/logs';
  }
  
  /**
   * Envia logs para servidor via POST
   */
  async sendToLogServer(logEntry, serverUrl) {
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Token adicionado pelo gateway, não pelo cliente
        },
        body: JSON.stringify({
          logs: [{
            traceId: logEntry.trace_id,
            eventType: logEntry.event,
            category: this.getCategoryFromEvent(logEntry.event),
            level: logEntry.level,
            userId: logEntry.user_id,
            sessionId: logEntry.session_id,
            payload: logEntry.data,
            timestamp: logEntry.timestamp
          }]
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          console.log(`📋 Log enviado para servidor: ${logEntry.event}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('Erro ao enviar log para servidor:', error.message);
      return false;
    }
  }
  
  /**
   * Determina categoria do evento
   */
  getCategoryFromEvent(eventType) {
    if (eventType.startsWith('signup_') || eventType.includes('auth') || eventType.includes('login')) {
      return 'auth';
    }
    if (eventType.startsWith('consult_') || eventType.includes('consultation')) {
      return 'consultation';
    }
    if (eventType.startsWith('ai_') || eventType.includes('ai_specialty')) {
      return 'ai';
    }
    if (eventType.includes('feedback_') || eventType.includes('rating')) {
      return 'feedback';
    }
    if (eventType.includes('system_') || eventType.includes('health')) {
      return 'system';
    }
    return 'general';
  }
  
  /**
   * Armazena log localmente como fallback
   */
  storeLocalLog(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('telemed_audit_logs') || '[]');
      logs.push(logEntry);
      
      // Manter apenas últimos 100 logs localmente
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('telemed_audit_logs', JSON.stringify(logs));
      
    } catch (error) {
      console.error('Falha ao salvar log de auditoria:', error);
    }
  }

  // Eventos específicos de auditoria

  /**
   * Login/Cadastro de usuário
   */
  logAuth(action, data = {}) {
    return this.log(`auth_${action}`, {
      action: action,
      success: data.success || false,
      method: data.method || 'unknown',
      ...data
    });
  }

  /**
   * Eventos de consulta
   */
  logConsultation(action, data = {}) {
    return this.log(`consultation_${action}`, {
      action: action,
      appointment_id: data.appointmentId || null,
      specialty: data.specialty || null,
      duration: data.duration || null,
      ...data
    });
  }

  /**
   * Eventos do Dr. AI
   */
  logAI(action, data = {}) {
    return this.log(`ai_${action}`, {
      action: action,
      input_symptoms: data.symptoms ? data.symptoms.length : 0,
      suggestions: data.suggestions || [],
      safety_flags: data.safetyFlags || false,
      ...data
    });
  }

  /**
   * Eventos de sistema/erro
   */
  logSystem(action, data = {}, level = 'INFO') {
    return this.log(`system_${action}`, {
      action: action,
      component: data.component || 'unknown',
      error_code: data.errorCode || null,
      ...data
    }, level);
  }

  /**
   * Feedback e avaliações
   */
  logFeedback(data = {}) {
    return this.log('feedback_submitted', {
      nps: data.nps || null,
      rating: data.rating || null,
      role: data.role || this.userRole,
      appointment_id: data.appointmentId || null,
      has_comments: Boolean(data.comments && data.comments.trim()),
      ...data
    });
  }
  
  // ===== EVENTOS PADRONIZADOS =====
  
  /**
   * Eventos de cadastro padronizados
   */
  logSignupAttempt(role, data = {}) {
    return this.log('signup_attempt', {
      role: role,
      step: data.step || 'initial',
      method: data.method || 'form',
      has_validation_errors: Boolean(data.errors),
      ...data
    });
  }
  
  logSignupSuccess(role, userId, data = {}) {
    return this.log('signup_success', {
      role: role,
      user_id: userId,
      verification_required: Boolean(data.verificationRequired),
      onboarding_flow: data.onboardingFlow || 'default',
      ...data
    });
  }
  
  logSignupFailure(role, errorType, data = {}) {
    return this.log('signup_failure', {
      role: role,
      error_type: errorType,
      step: data.step || 'unknown',
      ...data
    });
  }
  
  /**
   * Eventos de consulta padronizados
   */
  logConsultRequestCreated(appointmentId, data = {}) {
    return this.log('consult_request_created', {
      appointment_id: appointmentId,
      specialty: data.specialty || null,
      urgency: data.urgency || 'normal',
      bid_amount: data.bidAmount || null,
      patient_age_range: data.patientAgeRange || null,
      symptoms_count: data.symptoms ? data.symptoms.length : 0,
      ...data
    });
  }
  
  logConsultStarted(appointmentId, physicianId, data = {}) {
    return this.log('consult_started', {
      appointment_id: appointmentId,
      physician_id: physicianId,
      start_time: new Date().toISOString(),
      connection_quality: data.connectionQuality || 'unknown',
      platform: data.platform || 'web',
      ...data
    });
  }
  
  logConsultEnded(appointmentId, data = {}) {
    return this.log('consult_ended', {
      appointment_id: appointmentId,
      duration_minutes: data.durationMinutes || null,
      end_reason: data.endReason || 'completed',
      prescription_generated: Boolean(data.prescriptionGenerated),
      followup_scheduled: Boolean(data.followupScheduled),
      technical_issues: Boolean(data.technicalIssues),
      ...data
    });
  }
  
  /**
   * Eventos do Dr. AI padronizados
   */
  logAISpecialtySuggestionShown(suggestions, data = {}) {
    return this.log('ai_specialty_suggestion_shown', {
      suggestions_count: suggestions.length,
      top_suggestion: suggestions[0] || null,
      confidence_scores: suggestions.map(s => s.confidence || 0),
      symptoms_analyzed: data.symptoms || [],
      response_time_ms: data.responseTime || null,
      ...data
    });
  }
  
  logAISpecialtySuggestionAccepted(selectedSuggestion, data = {}) {
    return this.log('ai_specialty_suggestion_accepted', {
      selected_specialty: selectedSuggestion.specialty || null,
      confidence_score: selectedSuggestion.confidence || null,
      user_confirmed: Boolean(data.userConfirmed),
      alternative_suggestions: data.alternatives || [],
      ...data
    });
  }
  
  logAISpecialtySuggestionRejected(rejectedSuggestion, data = {}) {
    return this.log('ai_specialty_suggestion_rejected', {
      rejected_specialty: rejectedSuggestion.specialty || null,
      rejection_reason: data.rejectionReason || 'user_choice',
      user_selected_alternative: data.userSelectedAlternative || null,
      ...data
    });
  }

  /**
   * Obtém logs salvos localmente
   */
  getLogs(filter = {}) {
    const logs = JSON.parse(localStorage.getItem('telemed_audit_logs') || '[]');
    
    if (!Object.keys(filter).length) {
      return logs;
    }

    return logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => {
        if (key === 'event' && typeof value === 'string') {
          return log.event.includes(value);
        }
        return log[key] === value;
      });
    });
  }

  /**
   * Exporta logs para análise
   */
  exportLogs() {
    const logs = this.getLogs();
    const csv = this.logsToCSV(logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemed_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    this.log('logs_exported', { total_logs: logs.length });
  }

  /**
   * Converte logs para CSV
   */
  logsToCSV(logs) {
    if (!logs.length) return '';
    
    const headers = ['timestamp', 'level', 'event', 'trace_id', 'session_id', 'user_id', 'user_role', 'url'];
    const csv = [headers.join(',')];
    
    logs.forEach(log => {
      const row = headers.map(header => {
        const value = log[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csv.push(row.join(','));
    });
    
    return csv.join('\n');
  }

  /**
   * Limpa logs antigos
   */
  clearOldLogs(daysOld = 7) {
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const logs = this.getLogs();
    
    const recentLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).getTime();
      return logDate > cutoffDate;
    });
    
    localStorage.setItem('telemed_audit_logs', JSON.stringify(recentLogs));
    
    this.log('logs_cleaned', { 
      removed: logs.length - recentLogs.length,
      remaining: recentLogs.length 
    });
  }
}

// Instância global
const auditLogger = new AuditLogger();

// Interceptar eventos de página automaticamente
document.addEventListener('DOMContentLoaded', function() {
  auditLogger.log('page_loaded', {
    page: document.title,
    pathname: window.location.pathname,
    referrer: document.referrer
  });
});

window.addEventListener('beforeunload', function() {
  auditLogger.log('page_unload', {
    page: document.title,
    time_on_page: Date.now() - auditLogger.startTime
  });
});

// Interceptar erros JavaScript
window.addEventListener('error', function(e) {
  auditLogger.logSystem('js_error', {
    message: e.message,
    filename: e.filename,
    line: e.lineno,
    column: e.colno,
    stack: e.error?.stack
  }, 'ERROR');
});

// Interceptar cliques em elementos importantes
document.addEventListener('click', function(e) {
  const element = e.target;
  
  // Log cliques em botões/links importantes
  if (element.matches('[data-audit]') || 
      element.matches('button[data-testid]') || 
      element.matches('a[data-testid]')) {
    
    auditLogger.log('ui_interaction', {
      element_type: element.tagName.toLowerCase(),
      element_id: element.id,
      element_class: element.className,
      test_id: element.getAttribute('data-testid'),
      text_content: element.textContent?.trim().substring(0, 50)
    });
  }
});

// Interceptar submissões de formulário
document.addEventListener('submit', function(e) {
  const form = e.target;
  
  auditLogger.log('form_submitted', {
    form_id: form.id,
    form_class: form.className,
    form_action: form.action,
    field_count: form.elements.length
  });
});

// Instrumentar eventos automáticos nas páginas
function instrumentPage() {
  // Log de formulário de cadastro
  const signupForms = document.querySelectorAll('form[id*="cadastro"], form[id*="signup"]');
  signupForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const formData = new FormData(form);
      const role = formData.get('tipo') || 'unknown';
      auditLogger.logAuth('signup_attempt', { role, form_id: form.id });
    });
  });
  
  // Log de pedido de consulta
  const consultationButtons = document.querySelectorAll('[data-testid*="consultation"], [onclick*="pedido"]');
  consultationButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      auditLogger.logConsultation('request_initiated', {
        button_text: btn.textContent.trim()
      });
    });
  });
  
  // Log de feedback
  const feedbackForms = document.querySelectorAll('form[id="f"], form[action*="feedback"]');
  feedbackForms.forEach(form => {
    form.addEventListener('submit', function() {
      const formData = new FormData(form);
      auditLogger.logFeedback({
        nps: formData.get('nps'),
        role: formData.get('role'),
        appointmentId: formData.get('appointmentId')
      });
    });
  });
  
  // Log de interação com Dr.AI
  const drAIElements = document.querySelectorAll('[href*="dr-ai"], [data-testid*="ai"]');
  drAIElements.forEach(el => {
    el.addEventListener('click', function() {
      auditLogger.logAI('interface_accessed', {
        element_type: el.tagName.toLowerCase(),
        href: el.href || null
      });
    });
  });
}

// Instrumentar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(instrumentPage, 500); // Aguardar carregamento completo
  
  // Confirmar que audit está disponível
  if (window.audit) {
    console.log('✅ window.audit disponível');
  } else {
    console.warn('⚠️ window.audit não encontrado');
  }
});

// Exportar globalmente ANTES dos event listeners
window.AuditLogger = auditLogger;
window.audit = auditLogger; // Alias mais curto

console.log('📋 Audit Logger inicializado globalmente');