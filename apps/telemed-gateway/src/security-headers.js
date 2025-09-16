/**
 * TeleMed Security Headers Middleware
 * Implementa headers de segurança conforme boas práticas
 */

export function securityHeaders(req, res, next) {
  // Content Security Policy (CSP) - Tightened for production
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'sha384-JGQ8tZep6h1EgdRvdrxP1Cr21q8cF4syP8yW6sScr2ihS5+dag9Dx7T8JXL0ZOGV' 'sha384-foJDXv2dglOU7f/y+Zw/9ToZauWO3GRaP4h5UWBS8B39us76noGPN7kSl2n0c/ZI' 'sha384-DueXrOkyGHT+zxLTZuqfQGhmPSkqEy2OKK4m4nGrngnwxP6L/u3jRjvuXjhqUpjk' 'sha384-roqs9QoffllRtPyCCfiFai1ecwBEM4ZeYYSlXcsXm8sqIkDdvT3IwTRpW2RSMF39'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://telemed-internal.onrender.com https://telemed-auction.onrender.com https://telemed-productivity.onrender.com https://medical-desk-advanced.onrender.com https://telemed-docs-automation.onrender.com https://telemed-gateway.onrender.com wss: ws:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  // HTTP Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // XSS Protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Prevent caching of sensitive content
  if (req.path.includes('/api/') || req.path.includes('/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
}

/**
 * CSP específico para modo de desenvolvimento
 */
export function developmentCSP(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    const devCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*",
      "img-src 'self' data: http: https:",
      "font-src 'self' data:",
      "object-src 'none'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', devCSP);
  }
  
  next();
}

/**
 * Headers específicos para API
 */
export function apiSecurityHeaders(req, res, next) {
  // JSON-specific headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // API-specific CSP
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  
  next();
}

/**
 * Rate limiting headers (informativo)
 */
export function rateLimitHeaders(limit = 100, windowMs = 900000) {
  return (req, res, next) => {
    // Headers informativos sobre rate limiting
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Window', Math.floor(windowMs / 1000));
    
    // TODO: Implementar rate limiting real com Redis/memória
    res.setHeader('X-RateLimit-Remaining', limit - 1);
    
    next();
  };
}