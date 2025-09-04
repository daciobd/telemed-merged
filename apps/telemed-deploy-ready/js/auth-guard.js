// Auth Guard - TeleMed
// Sistema de proteção com whitelist para demo pages

(function () {
  // 1) Flag para desligar guard em páginas específicas
  const noGuard =
    window.NO_AUTH_GUARD === true ||
    document.querySelector('meta[name="telemed-no-guard"][content="1"]');

  if (noGuard) return;

  // 2) Whitelist: páginas que NUNCA devem ser redirecionadas para /consulta/
  const WHITELIST = [
    '/demo.html',
    '/example-integration.html',
    '/cadastro.html',
    '/gestao-avancada/',
    '/sala-de-espera/',
    '/medico/',
    '/meus-pacientes/',
    '/como-funciona/',
    '/centro-de-testes/',
    '/consulta/',          // deixa a própria "home" passar
    '/',                   // raiz do site
    '/index.html',
    '/demo-ativo/',
    '/enhanced/',
    '/preview/',
    '/lp.html',
    '/404.html'
  ];

  const p = location.pathname;
  const isWhitelisted = WHITELIST.some(w => p === w || p.startsWith(w));

  // 3) Regra antiga, agora respeitando whitelist
  const hasJWT =
    !!localStorage.getItem('jwt') ||
    !!sessionStorage.getItem('jwt') ||
    document.cookie.includes('jwt=');

  if (hasJWT && !isWhitelisted) {
    location.replace('/consulta/');
  }
})();