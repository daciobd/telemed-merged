// Script de teste para rodar no Console da página
// Copie e cole no DevTools Console

console.log('=== TESTE DE CTAs MÉDICOS ===\n');

const ctas = [...document.querySelectorAll('#cta-med-dashboard,#cta-med-kit,#cta-med-dr-ai')];

console.log('CTAs encontrados:', ctas.length);
console.log('\n📊 Detalhes dos CTAs:\n');

const details = ctas.map(a => ({
  id: a.id,
  href: a.getAttribute('href'),
  resolved: a.href,
  hasOnClick: !!a.onclick,
  classList: [...a.classList],
  isLocked: a.classList.contains('tm-locked'),
  dataLockMsg: a.getAttribute('data-lock-msg')
}));

console.table(details);

console.log('\n🔍 Verificando listeners:');
ctas.forEach(cta => {
  const listeners = getEventListeners(cta);
  console.log(`${cta.id}:`, {
    click: listeners.click?.length || 0,
    capture: listeners.click?.some(l => l.useCapture) || false
  });
});

console.log('\n💡 Diagnóstico:');
if (details.some(d => d.isLocked)) {
  console.warn('❌ Alguns CTAs estão travados (tm-locked)');
} else if (details.some(d => d.hasOnClick)) {
  console.warn('⚠️ Alguns CTAs têm onclick inline');
} else {
  console.log('✅ CTAs parecem OK, mas podem ter listeners problemáticos');
}
