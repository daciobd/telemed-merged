import jwt from 'jsonwebtoken';

// Middleware original (compatibilidade)
export function authMiddleware(roles = []){
  return (req,res,next)=>{
    const internal = req.header('X-Internal-Token');
    if(internal && internal === (process.env.INTERNAL_TOKEN || 'change-me-internal')){ 
      req.user={id:'service',role:'service'}; 
      return next(); 
    }
    const h=req.header('Authorization'); 
    if(!h) return res.status(401).json({error:'Missing Authorization'});
    const [t,tk]=h.split(' '); 
    if(t!=='Bearer'||!tk) return res.status(401).json({error:'Invalid Authorization'});
    try{ 
      const p=jwt.verify(tk, process.env.JWT_SECRET||'dev-secret'); 
      if(roles.length && !roles.includes(p.role)) return res.status(403).json({error:'Forbidden'}); 
      req.user={id:p.sub, role:p.role, email:p.email}; 
      next(); 
    }catch{ 
      return res.status(401).json({error:'Invalid token'}); 
    }
  };
}

// Nova função requireAuth (para compatibilidade com o patch)
export function requireAuth(req, res, next) {
  try {
    // Verificar se JWT_SECRET está configurado em produção
    const JWT_SECRET = process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
      console.error('FATAL: JWT_SECRET não configurado em produção!');
      return res.status(500).json({ error: 'server_misconfigured' });
    }

    // DEV ONLY: permitir sem token em desenvolvimento
    if (!req.headers.authorization && process.env.NODE_ENV !== 'production') {
      req.user = { sub: 'test-patient', role: 'paciente' };
      return next();
    }

    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'missing_token' });
    }
    const token = auth.slice(7);
    
    // Usar secret com fallback apenas em dev
    const secret = JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'telemed-dev-secret-2025' : null);
    if (!secret) {
      return res.status(500).json({ error: 'jwt_secret_missing' });
    }
    
    req.user = jwt.verify(token, secret);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
