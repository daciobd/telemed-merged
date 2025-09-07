// Sistema de feature flags com controle percentual
import { secureLog } from '../middleware/security.js';

// Configurações de feature flags
const featureFlags = {
  mda_enabled: {
    enabled: process.env.MDA_ENABLED === 'true',
    percentage: parseInt(process.env.MDA_PERCENTAGE) || 0,
    groups: (process.env.MDA_GROUPS || '').split(',').filter(Boolean),
    users: (process.env.MDA_USERS || '').split(',').filter(Boolean)
  },
  ai_analysis: {
    enabled: process.env.AI_ANALYSIS_ENABLED !== 'false',
    percentage: parseInt(process.env.AI_ANALYSIS_PERCENTAGE) || 100,
    groups: (process.env.AI_ANALYSIS_GROUPS || '').split(',').filter(Boolean)
  },
  intelligent_prescription: {
    enabled: process.env.INTELLIGENT_PRESCRIPTION_ENABLED !== 'false',
    percentage: parseInt(process.env.INTELLIGENT_PRESCRIPTION_PERCENTAGE) || 100,
    groups: (process.env.INTELLIGENT_PRESCRIPTION_GROUPS || '').split(',').filter(Boolean)
  },
  advanced_telemedicine: {
    enabled: process.env.ADVANCED_TELEMEDICINE_ENABLED !== 'false',
    percentage: parseInt(process.env.ADVANCED_TELEMEDICINE_PERCENTAGE) || 100,
    groups: (process.env.ADVANCED_TELEMEDICINE_GROUPS || '').split(',').filter(Boolean)
  },
  real_time_monitoring: {
    enabled: process.env.REAL_TIME_MONITORING_ENABLED !== 'false',
    percentage: parseInt(process.env.REAL_TIME_MONITORING_PERCENTAGE) || 100,
    groups: (process.env.REAL_TIME_MONITORING_GROUPS || '').split(',').filter(Boolean)
  }
};

// Hash determinístico para consistência de usuário
function hashUserId(userId) {
  let hash = 0;
  if (userId.length === 0) return hash;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Verificar se feature está habilitada para usuário
export function isFeatureEnabled(featureName, userId, userGroups = [], metadata = {}) {
  const flag = featureFlags[featureName];
  
  if (!flag) {
    secureLog('warn', 'Unknown feature flag', { featureName, userId });
    return false;
  }
  
  // Feature completamente desabilitada
  if (!flag.enabled) {
    return false;
  }
  
  // Verificar se usuário está na lista específica (override)
  if (flag.users.includes(userId)) {
    secureLog('info', 'Feature enabled by user whitelist', { featureName, userId });
    return true;
  }
  
  // Verificar se usuário está em grupo específico
  const hasGroupAccess = userGroups.some(group => flag.groups.includes(group));
  if (hasGroupAccess) {
    secureLog('info', 'Feature enabled by group access', { featureName, userId, userGroups });
    return true;
  }
  
  // Verificar percentual (rollout gradual)
  if (flag.percentage === 100) {
    return true;
  }
  
  if (flag.percentage === 0) {
    return false;
  }
  
  // Usar hash do userId para determinar se está no percentual
  const userHash = hashUserId(userId);
  const userPercentile = userHash % 100;
  const enabled = userPercentile < flag.percentage;
  
  secureLog('debug', 'Feature flag percentage check', {
    featureName,
    userId,
    percentage: flag.percentage,
    userPercentile,
    enabled
  });
  
  return enabled;
}

// Middleware para injetar feature flags no request
export function featureFlagsMiddleware(req, res, next) {
  const userId = req.user?.sub || 'anonymous';
  const userGroups = req.user?.groups || [];
  
  // Avaliar todas as features para o usuário
  req.features = {};
  
  Object.keys(featureFlags).forEach(featureName => {
    req.features[featureName] = isFeatureEnabled(featureName, userId, userGroups, {
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  });
  
  // Log das features ativas (só em debug)
  if (process.env.DEBUG_FEATURES === 'true') {
    secureLog('debug', 'User features evaluated', {
      userId,
      userGroups,
      features: req.features
    });
  }
  
  next();
}

// Endpoint para gerenciar feature flags (admin only)
export function getFeatureFlagsAdmin(req, res) {
  // Verificar se usuário é admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Acesso restrito a administradores',
      ts: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    featureFlags,
    ts: new Date().toISOString()
  });
}

// Endpoint para atualizar feature flag (admin only)
export function updateFeatureFlagAdmin(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'forbidden',
      message: 'Acesso restrito a administradores',
      ts: new Date().toISOString()
    });
  }
  
  const { featureName } = req.params;
  const { enabled, percentage, groups, users } = req.body;
  
  if (!featureFlags[featureName]) {
    return res.status(404).json({
      error: 'feature_not_found',
      message: `Feature flag '${featureName}' não encontrada`,
      ts: new Date().toISOString()
    });
  }
  
  // Validações
  if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
    return res.status(400).json({
      error: 'invalid_percentage',
      message: 'Percentage deve estar entre 0 e 100',
      ts: new Date().toISOString()
    });
  }
  
  // Atualizar flag
  const oldFlag = { ...featureFlags[featureName] };
  
  if (enabled !== undefined) featureFlags[featureName].enabled = enabled;
  if (percentage !== undefined) featureFlags[featureName].percentage = percentage;
  if (groups !== undefined) featureFlags[featureName].groups = groups;
  if (users !== undefined) featureFlags[featureName].users = users;
  
  secureLog('info', 'Feature flag updated by admin', {
    featureName,
    adminId: req.user.sub,
    oldFlag,
    newFlag: featureFlags[featureName]
  });
  
  res.json({
    success: true,
    featureName,
    flag: featureFlags[featureName],
    updatedBy: req.user.sub,
    ts: new Date().toISOString()
  });
}

// Endpoint público para verificar features do usuário atual
export function getUserFeatures(req, res) {
  const userId = req.user?.sub || 'anonymous';
  const userGroups = req.user?.groups || [];
  
  const userFeatures = {};
  
  Object.keys(featureFlags).forEach(featureName => {
    userFeatures[featureName] = isFeatureEnabled(featureName, userId, userGroups);
  });
  
  res.json({
    success: true,
    userId,
    features: userFeatures,
    ts: new Date().toISOString()
  });
}

// Utilitário para rollback de emergência
export function emergencyDisableFeature(featureName) {
  if (featureFlags[featureName]) {
    const oldFlag = { ...featureFlags[featureName] };
    featureFlags[featureName].enabled = false;
    featureFlags[featureName].percentage = 0;
    
    secureLog('warn', 'Emergency feature disable', {
      featureName,
      oldFlag,
      newFlag: featureFlags[featureName]
    });
    
    return true;
  }
  return false;
}

// Stats de feature flags para dashboard
export function getFeatureFlagsStats() {
  const stats = {};
  
  Object.entries(featureFlags).forEach(([name, flag]) => {
    stats[name] = {
      enabled: flag.enabled,
      percentage: flag.percentage,
      hasGroups: flag.groups.length > 0,
      hasUsers: flag.users.length > 0,
      rolloutType: flag.percentage === 100 ? 'full' :
                  flag.percentage === 0 ? 'disabled' : 'gradual'
    };
  });
  
  return stats;
}

// Inicializar sistema de feature flags
export function initializeFeatureFlags() {
  secureLog('info', 'Feature flags initialized', {
    flags: Object.keys(featureFlags),
    config: getFeatureFlagsStats()
  });
  
  // Log das configurações atuais
  Object.entries(featureFlags).forEach(([name, flag]) => {
    secureLog('info', `Feature flag: ${name}`, {
      enabled: flag.enabled,
      percentage: flag.percentage,
      groups: flag.groups.length,
      users: flag.users.length
    });
  });
}

export default {
  isFeatureEnabled,
  featureFlagsMiddleware,
  getFeatureFlagsAdmin,
  updateFeatureFlagAdmin,
  getUserFeatures,
  emergencyDisableFeature,
  getFeatureFlagsStats,
  initializeFeatureFlags
};