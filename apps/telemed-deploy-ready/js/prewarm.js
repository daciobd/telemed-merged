/**
 * Backend prewarming script - Extrated from inline to enable CSP
 */

(function() {
  'use strict';
  
  console.log('🔥 Aquecendo backends...');
  
  const backends = [
    { name: 'telemed-internal', url: 'https://telemed-internal.onrender.com/healthz' },
    { name: 'telemed-auction', url: 'https://auction-service.onrender.com/healthz' },
    { name: 'mda', url: 'https://medical-desk-advanced.onrender.com/healthz' },
    { name: 'receita-certa', url: 'https://receita-certa.onrender.com/healthz' },
    { name: 'telemed-productivity', url: 'https://productivity-service.onrender.com/healthz' }
  ];
  
  backends.forEach(backend => {
    console.log(`🔄 Aquecendo backend: ${backend.name} (pode estar iniciando)`);
    
    fetch(backend.url, { 
      method: 'GET',
      mode: 'no-cors', // Evitar CORS em prewarming
      cache: 'no-cache'
    }).catch(err => {
      // Ignore errors - goal is just to wake up services
      console.log(`⚠️ ${backend.name} não respondeu (normal se cold start)`);
    });
  });
})();