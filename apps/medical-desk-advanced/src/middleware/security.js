// Middleware de segurança com PII mascarada
import jwt from "jsonwebtoken";

// Função para mascarar dados sensíveis nos logs
export function maskPII(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('cpf') || lowerKey.includes('document')) {
      // Mascarar CPF: 123.456.789-00 → 123.***.*89-**
      if (typeof value === 'string') {
        masked[key] = value.replace(/(\d{3})[\.\d]*(\d{2})/, '$1.***.*$2-**');
      } else {
        masked[key] = '***';
      }
    } else if (lowerKey.includes('email')) {
      // Mascarar email: user@domain.com → u***@domain.com
      if (typeof value === 'string' && value.includes('@')) {
        const [user, domain] = value.split('@');
        masked[key] = user.charAt(0) + '***@' + domain;
      } else {
        masked[key] = '***@***.com';
      }
    } else if (lowerKey.includes('phone') || lowerKey.includes('telefone')) {
      // Mascarar telefone: (11) 99999-9999 → (11) 9****-9999
      if (typeof value === 'string') {
        masked[key] = value.replace(/(\d{2})[\s\)\(]*(\d{1})[\d\s\-]*(\d{4})/, '($1) $2****-$3');
      } else {
        masked[key] = '(**) ****-****';
      }
    } else if (lowerKey.includes('password') || lowerKey.includes('senha')) {
      masked[key] = '***';
    } else if (lowerKey.includes('token') || lowerKey.includes('jwt')) {
      // Mascarar tokens: mostrar só início e fim
      if (typeof value === 'string' && value.length > 10) {
        masked[key] = value.slice(0, 4) + '***' + value.slice(-4);
      } else {
        masked[key] = '***';
      }
    } else if (typeof value === 'object') {
      // Recursivamente mascarar objetos aninhados
      masked[key] = maskPII(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

// Logger seguro que automática PII
export function secureLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    service: 'medical-desk-advanced'
  };
  
  if (data) {
    logEntry.data = maskPII(data);
  }
  
  console.log(JSON.stringify(logEntry));
}

// Middleware de request logging seguro
export function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  
  // Log da requisição (sem dados sensíveis)
  secureLog('info', 'Request received', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress,
    headers: maskPII(req.headers),
    body: maskPII(req.body)
  });
  
  // Override do res.json para logar respostas
  const originalJson = res.json;
  res.json = function(obj) {
    const duration = Date.now() - start;
    
    secureLog('info', 'Request completed', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      response: maskPII(obj)
    });
    
    return originalJson.call(this, obj);
  };
  
  next();
}

// Middleware de autenticação com logs seguros
export function jwtAuthSecure(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  
  if (!token) {
    secureLog('warn', 'Authentication failed - missing token', {
      requestId: req.requestId,
      ip: req.ip,
      url: req.url
    });
    
    return res.status(401).json({ 
      error: "missing_token",
      message: "Token de autorização obrigatório",
      requestId: req.requestId,
      ts: new Date().toISOString()
    });
  }

  try {
    const { JWT_PUBLIC_KEY_PEM, JWT_AUDIENCE = "telemed", JWT_ISSUER = "telemed-auth" } = process.env;
    
    const payload = jwt.verify(token, JWT_PUBLIC_KEY_PEM, {
      algorithms: ["RS256"],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    });
    
    req.user = payload;
    
    secureLog('info', 'Authentication successful', {
      requestId: req.requestId,
      userId: payload.sub,
      role: payload.role,
      tokenExp: payload.exp
    });
    
    next();
  } catch (err) {
    secureLog('warn', 'Authentication failed - invalid token', {
      requestId: req.requestId,
      ip: req.ip,
      error: err.message,
      tokenPrefix: token.slice(0, 10) + '***'
    });
    
    return res.status(401).json({ 
      error: "invalid_token",
      message: "Token inválido ou expirado",
      requestId: req.requestId,
      ts: new Date().toISOString()
    });
  }
}

// Middleware para rate limiting básico
const rateLimitStore = new Map();

export function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;
    
    const current = rateLimitStore.get(windowKey) || 0;
    
    if (current >= maxRequests) {
      secureLog('warn', 'Rate limit exceeded', {
        requestId: req.requestId,
        ip: key,
        requests: current,
        limit: maxRequests
      });
      
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Muitas requisições. Tente novamente em alguns segundos.',
        requestId: req.requestId,
        ts: new Date().toISOString()
      });
    }
    
    rateLimitStore.set(windowKey, current + 1);
    
    // Limpar entries antigas periodicamente
    if (Math.random() < 0.01) {
      for (const [key, value] of rateLimitStore.entries()) {
        const keyWindow = parseInt(key.split(':')[1]);
        if (keyWindow < window - 2) {
          rateLimitStore.delete(key);
        }
      }
    }
    
    next();
  };
}

// Error handler seguro
export function secureErrorHandler(err, req, res, next) {
  secureLog('error', 'Unhandled error', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    url: req.url
  });
  
  // Não expor detalhes do erro em produção
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: 'internal_server_error',
    message: 'Erro interno do servidor',
    requestId: req.requestId,
    ...(isDev && { details: err.message }),
    ts: new Date().toISOString()
  });
}