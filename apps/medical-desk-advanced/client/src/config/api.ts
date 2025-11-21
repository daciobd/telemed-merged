// API Configuration
const API_BASE_URL = 'https://medical-desk-api.onrender.com';

export const API_ENDPOINTS = {
  stats: `${API_BASE_URL}/api/stats`,
  protocols: `${API_BASE_URL}/api/protocols`,
  automation: {
    pending: `${API_BASE_URL}/api/automation/pending`,
    metrics: `${API_BASE_URL}/api/automation/metrics`,
  },
  careChains: `${API_BASE_URL}/api/care-chains`,
  analytics: `${API_BASE_URL}/api/analytics`,
  populationData: `${API_BASE_URL}/api/population-data`,
  health: `${API_BASE_URL}/api/health`,
};

export default API_BASE_URL;
