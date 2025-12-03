/**
 * Backend prewarming script - Extracted from inline to enable CSP
 */

(function() {
  'use strict';
  
  // Only run if prewarm is enabled
  const flags = (function(){
    try { return JSON.parse(localStorage.getItem('telemed_flags_v1')) || {}; }
    catch { return {}; }
  })();
  
  if (flags.prewarm === false) return;
  
  // Silenciar em desenvolvimento (localhost/replit)
  if (location.hostname === 'localhost' || location.hostname.includes('replit')) {
    console.debug('🔥 Prewarm desabilitado em dev');
    return;
  }
  
  console.debug('🔥 Aquecendo backends...');
  
  const backends = [
    { name: 'telemed-internal', url: 'https://telemed-internal.onrender.com/healthz' },
    { name: 'telemed-auction', url: 'https://auction-service.onrender.com/healthz' },
    { name: 'mda', url: 'https://medical-desk-advanced.onrender.com/healthz' },
    { name: 'receita-certa', url: 'https://receita-certa.onrender.com/healthz' },
    { name: 'telemed-productivity', url: 'https://productivity-service.onrender.com/healthz' }
  ].filter(b => b.url); // Only valid URLs
  
  backends.forEach(backend => {
    fetch(backend.url, { 
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store'
    })
    .then(r => console.debug(`✓ Prewarm ${backend.name}`, r.status))
    .catch(() => console.debug(`⚠ Prewarm skip ${backend.name} (cold start ou 404)`));
  });
})();