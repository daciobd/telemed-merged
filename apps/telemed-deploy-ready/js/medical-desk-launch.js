/**
 * TeleMed - MedicalDesk Launcher
 * Abre o MedicalDesk real ou fallback para demo local
 */

async function openMedicalDesk({ patientId, doctorId }) {
  // Fallback local (demo) se o real falhar
  const fallback = () => {
    console.log('[MedicalDesk] Abrindo página demo (fallback)');
    window.open(
      `/public/medical-desk-demo.html?pid=${encodeURIComponent(patientId)}`, 
      '_blank', 
      'noopener,noreferrer'
    );
  };

  try {
    // Tenta criar sessão no serviço real
    const r = await fetch('/api/medicaldesk/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, doctorId })
    });

    const data = await r.json().catch(() => ({}));

    if (r.ok && data?.ok && data?.launchUrl) {
      console.log('[MedicalDesk] Abrindo sessão autenticada:', data.launchUrl);
      window.open(data.launchUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('[MedicalDesk] Sessão indisponível:', data?.error || r.statusText);
      fallback();
    }
  } catch (e) {
    console.warn('[MedicalDesk] Erro de rede:', e);
    fallback();
  }
}

// Event delegation para botões com data-open-medicaldesk
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-open-medicaldesk]');
  if (!btn) return;
  
  ev.preventDefault();
  
  const patientId = btn.getAttribute('data-patient-id') || 'paciente-test';
  const doctorId  = btn.getAttribute('data-doctor-id')  || 'medico-demo';
  
  openMedicalDesk({ patientId, doctorId });
});

// Expor função globalmente para uso direto
window.openMedicalDesk = openMedicalDesk;

console.log('✅ MedicalDesk launcher carregado');
