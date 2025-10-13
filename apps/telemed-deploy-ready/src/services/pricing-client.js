/**
 * TeleMed - Pricing/Auction API Client
 * Wrapper para /api/auction (via proxy local ou BidConnect direto)
 */

const BASE =
  (globalThis?.window?.TELEMED_CFG?.AUCTION_URL)
  || '/api/auction';

function authHeader() {
  const token =
    localStorage.getItem('tm_auth_token') ||
    sessionStorage.getItem('tm_auth_token') ||
    localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const err = new Error(data?.message || text || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data?.error || `http_${res.status}`;
    err.payload = data || text;
    throw err;
  }
  return data;
}

export const pricing = {
  health: () => http('GET', `/health`),

  createBid: ({ patientId, specialty, amountCents, mode = 'immediate' }) =>
    http('POST', `/bids`, { patientId, specialty, amountCents, mode }),

  getBid: (bidId) => 
    http('GET', `/bids/${encodeURIComponent(bidId)}`),

  searchDoctors: (bidId) => 
    http('POST', `/bids/${encodeURIComponent(bidId)}/search`),

  increaseBid: (bidId, newAmountCents) =>
    http('PUT', `/bids/${encodeURIComponent(bidId)}/increase`, { new_value: newAmountCents }),

  acceptDoctor: (bidId, doctorId) =>
    http('POST', `/bids/${encodeURIComponent(bidId)}/accept`, { doctorId }),
};

// Compatibilidade com código legado
export const PricingClient = {
  health: () => pricing.health(),
  createBid: (patientId, specialty, amountCents, mode) => 
    pricing.createBid({ patientId, specialty, amountCents, mode }),
  getBid: (id) => pricing.getBid(id),
  searchDoctors: (id) => pricing.searchDoctors(id),
  increaseBid: (id, new_value) => pricing.increaseBid(id, new_value),
  acceptDoctor: (id, doctorId) => pricing.acceptDoctor(id, doctorId),
};

export default PricingClient;
