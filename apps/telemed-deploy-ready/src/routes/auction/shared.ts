export const AUCTION_URL = (import.meta as any).env?.VITE_AUCTION_URL || 'https://telemed-auction.onrender.com'; 
export const authToken=()=>localStorage.getItem('jwt')||'';

// Patch 6: Função para incluir headers de segurança
export const getSecureHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + authToken(),
  'X-Internal-Token': localStorage.getItem('INTERNAL_TOKEN') || ''
});