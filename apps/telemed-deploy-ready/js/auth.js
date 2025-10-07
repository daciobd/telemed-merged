// TeleMedAuth — helper simples para piloto (token em localStorage)
window.TeleMedAuth = (function(){
  const KEY = 'tm_auth_token';
  const UKEY = 'tm_user';

  async function login({id, password, role}){
    // tenta API real
    try{
      const r = await fetch('/api/auth/login', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ id, password, role })
      });
      if (r.ok){
        const data = await r.json();
        if (data && data.ok){
          localStorage.setItem(KEY, data.token);
          localStorage.setItem(UKEY, JSON.stringify(data.user||{id,role}));
          return { ok:true, from:'api' };
        }
        return { ok:false, error: data.error || 'Credenciais inválidas' };
      }
    }catch(_){} // cai no mock

    // MOCK local (piloto): aceita qualquer id/senha/role
    const mockUser = {
      id, role, name: role==='medico' ? 'Dr(a). Teste' : 'Paciente Teste'
    };
    const token = 'pilot-' + btoa(JSON.stringify({ sub:id, role, ts:Date.now() }));
    localStorage.setItem(KEY, token);
    localStorage.setItem(UKEY, JSON.stringify(mockUser));
    return { ok:true, from:'mock' };
  }

  function logout(){
    localStorage.removeItem(KEY);
    localStorage.removeItem(UKEY);
  }

  function getUser(){
    try{ return JSON.parse(localStorage.getItem(UKEY)||'null'); }catch{ return null; }
  }

  function isAuthenticated(){ return !!localStorage.getItem(KEY); }

  function requireAuth(role){
    const u = getUser();
    if (!isAuthenticated() || !u || (role && u.role!==role)){
      const base = location.pathname.replace(/\/app\/[^/]+\.html$/,'/auth/login.html');
      location.href = base + (role ? ('?role=' + role) : '');
    }
  }

  return { login, logout, getUser, isAuthenticated, requireAuth };
})();
