// Smoke Test - Validação de Páginas Reais e Redirects
// Usage: node smoke-test.js ou cole no DevTools Console

(async () => {
  console.log('🧪 SMOKE TEST - Validação de Páginas e Redirects\n');
  console.log('═'.repeat(70));
  
  const pages = [
    { url: '/consulta.html', desc: '💊 Consulta Médica (REAL)', expected: 200 },
    { url: '/sala-de-espera.html', desc: '⏳ Sala de Espera (REAL)', expected: 200 },
    { url: '/phr.html', desc: '📋 PHR (REAL)', expected: 200 },
    { url: '/dashboard-piloto.html', desc: '📊 Dashboard Piloto (REAL)', expected: 200 },
    { url: '/agenda.html', desc: '📅 Agenda (REAL)', expected: 200 },
    { url: '/bidconnect-standalone.html?model=conservative', desc: '💰 BidConnect (REAL)', expected: 200 },
    { url: '/index.html', desc: '🏠 Landing (REAL)', expected: 200 },
    // Stubs (devem redirecionar 301)
    { url: '/patient/waiting-room.html', desc: '🔁 Stub → Sala Espera', expected: 301, redirect: '/sala-de-espera.html' },
    { url: '/patient/phr.html', desc: '🔁 Stub → PHR', expected: 301, redirect: '/phr.html' },
    { url: '/medicaldesk-demo/index.html', desc: '🔁 Stub → Dashboard', expected: 301, redirect: '/dashboard-piloto.html' },
    { url: '/medicaldesk-demo/agenda.html', desc: '🔁 Stub → Agenda', expected: 301, redirect: '/agenda.html' },
  ];

  const results = [];
  
  for (const page of pages) {
    try {
      const response = await fetch(page.url, { 
        method: 'GET', 
        redirect: 'manual' // Importante para capturar 301
      });
      
      const status = response.status;
      const location = response.headers.get('location') || '';
      const icon = status === page.expected ? '✅' : '❌';
      
      let statusText = `${icon} ${status}`;
      if (page.expected === 301) {
        const redirectOk = location === page.redirect;
        statusText += redirectOk ? ` → ${location}` : ` → ${location} ⚠️ ESPERADO: ${page.redirect}`;
      }
      
      console.log(`${statusText.padEnd(60)} ${page.desc}`);
      
      results.push({
        url: page.url,
        status,
        expected: page.expected,
        ok: status === page.expected && (!page.redirect || location === page.redirect),
        location
      });
    } catch (error) {
      console.log(`❌ ERR ${page.desc.padEnd(50)} → ${page.url} (${error.message})`);
      results.push({ url: page.url, status: 'ERROR', expected: page.expected, ok: false });
    }
  }
  
  console.log('═'.repeat(70));
  
  const total = results.length;
  const passed = results.filter(r => r.ok).length;
  const failed = total - passed;
  
  console.log(`\n📊 RESUMO:`);
  console.log(`   Total: ${total}`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   Taxa de Sucesso: ${Math.round((passed/total)*100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM - Veja acima para detalhes');
  }
  
  return results;
})();
