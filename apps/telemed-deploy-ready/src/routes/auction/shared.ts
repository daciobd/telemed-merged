// TelemedMerged: Usa proxy local /api/auction (evita CORS)
export const AUCTION_URL = '/api/auction'; 

// Suporta múltiplas chaves de token (compatibilidade)
export const authToken = () => 
  localStorage.getItem('tm_auth_token') || 
  localStorage.getItem('jwt') || 
  '';

// Headers de autenticação unificados
export const authHeaders = () => ({
  'Authorization': 'Bearer ' + authToken(),
  'X-Internal-Token': localStorage.getItem('INTERNAL_TOKEN') || ''
});

// Função para incluir headers de segurança completos
export const getSecureHeaders = () => ({
  'Content-Type': 'application/json',
  ...authHeaders()
});