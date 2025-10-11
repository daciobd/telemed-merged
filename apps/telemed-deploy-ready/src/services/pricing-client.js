/**
 * TeleMed - Pricing/Auction API Client
 * Wrapper para /api/auction (via proxy local)
 */

const API = '/api/auction';

const auth = () => ({ 
  'Authorization': 'Bearer ' + (localStorage.getItem('tm_auth_token') || localStorage.getItem('jwt') || '') 
});

export const PricingClient = {
  /**
   * Health check do serviço de auction
   */
  health: () => fetch(`${API}/health`).then(r => r.json()),

  /**
   * Criar novo bid (lance)
   */
  createBid: (patientId, specialty, amountCents, mode = 'immediate') =>
    fetch(`${API}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ patientId, specialty, amountCents, mode })
    }).then(r => r.json()),

  /**
   * Buscar bid por ID
   */
  getBid: (id) => 
    fetch(`${API}/bids/${id}`, { 
      headers: auth() 
    }).then(r => r.json()),

  /**
   * Buscar médicos disponíveis para um bid
   */
  searchDoctors: (id) => 
    fetch(`${API}/bids/${id}/search`, { 
      method: 'POST', 
      headers: auth() 
    }).then(r => r.json()),

  /**
   * Aumentar valor do bid
   */
  increaseBid: (id, new_value) =>
    fetch(`${API}/bids/${id}/increase`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ new_value })
    }).then(r => r.json()),

  /**
   * Aceitar médico (fechar negociação)
   */
  acceptDoctor: (id, doctorId) =>
    fetch(`${API}/bids/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ doctorId })
    }).then(r => r.json()),
};

export default PricingClient;
