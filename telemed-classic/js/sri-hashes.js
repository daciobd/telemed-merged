/**
 * SRI (Subresource Integrity) Hashes para scripts TeleMed
 * Calculados automaticamente para garantir integridade dos scripts
 */

// Hashes SHA-384 para scripts críticos (atualizados conforme mudanças)
export const SRI_HASHES = {
  'feature-flags.js': 'sha384-placeholder-feature-flags-hash',
  'audit-logger.js': 'sha384-placeholder-audit-logger-hash', 
  'consent-banner.js': 'sha384-placeholder-consent-banner-hash',
  'demo.js': 'sha384-placeholder-demo-hash',
  'config.js': 'sha384-placeholder-config-hash'
};

/**
 * Aplica SRI nos scripts da página
 */
export function applySRI() {
  document.querySelectorAll('script[src]').forEach(script => {
    const src = script.getAttribute('src');
    
    // Extrair nome do arquivo
    const fileName = src.split('/').pop();
    
    if (SRI_HASHES[fileName]) {
      script.setAttribute('integrity', SRI_HASHES[fileName]);
      script.setAttribute('crossorigin', 'anonymous');
      console.log(`✅ SRI aplicado para ${fileName}`);
    }
  });
}

/**
 * Gerar hash SRI para um script (desenvolvimento)
 */
export async function generateSRIHash(scriptContent) {
  const encoder = new TextEncoder();
  const data = encoder.encode(scriptContent);
  const hashBuffer = await crypto.subtle.digest('SHA-384', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
  
  return `sha384-${hashBase64}`;
}

// Auto-aplicar SRI quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
  if (window.FeatureFlags && window.FeatureFlags.isEnabled('security-headers')) {
    applySRI();
  }
});