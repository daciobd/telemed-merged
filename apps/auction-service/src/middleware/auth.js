import jwt from 'jsonwebtoken';
export function authMiddleware(roles = []){
  return (req,res,next)=>{
    const internal = req.header('X-Internal-Token');
    if(internal && internal === (process.env.INTERNAL_TOKEN || 'change-me-internal')){ req.user={id:'service',role:'service'}; return next(); }
    const h=req.header('Authorization'); if(!h) return res.status(401).json({error:'Missing Authorization'});
    const [t,tk]=h.split(' '); if(t!=='Bearer'||!tk) return res.status(401).json({error:'Invalid Authorization'});
    try{ const p=jwt.verify(tk, process.env.JWT_SECRET||'dev-secret'); if(roles.length && !roles.includes(p.role)) return res.status(403).json({error:'Forbidden'}); req.user={id:p.sub, role:p.role, email:p.email}; next(); }catch{ return res.status(401).json({error:'Invalid token'}); }
  };
}
