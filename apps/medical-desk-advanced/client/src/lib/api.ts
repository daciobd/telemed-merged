const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://telemed-deploy-ready.onrender.com';

// Types
export interface WellsScoreCriteria {
  clinicalSignsTVP: boolean;
  tepmorelikely: boolean;
  heartRateOver100: boolean;
  immobilizationSurgery: boolean;
  previousTEP: boolean;
  hemoptysis: boolean;
  cancer: boolean;
}

export interface WellsScoreResult {
  score: number;
  interpretation: string;
  recommendation: string;
}

// Mock data fallback
const mockData = {
  stats: {
    protocolosAtivos: 12,
    sugestoesHoje: 45,
    alertasVies: 3,
    taxaAprovacao: 94
  },
  patients: [
    { id: 1, name: 'João Silva', age: 58, condition: 'SCA com dor torácica', status: 'critical' },
    { id: 2, name: 'Maria Costa', age: 72, condition: 'Pneumonia grave (CURB-65=4)', status: 'critical' }
  ],
  protocols: [
    { id: 1, name: 'Protocolo SCA', usage: 245, accuracy: 94 },
    { id: 2, name: 'Protocolo Pneumonia', usage: 189, accuracy: 91 }
  ]
};

export async function fetchFromAPI(endpoint: string, useMock = false) {
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (endpoint === '/api/stats') return mockData.stats;
    if (endpoint === '/api/patients') return mockData.patients;
    if (endpoint === '/api/protocols') return mockData.protocols;
    
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.warn(`API error for ${endpoint}: ${response.status}, falling back to mock data`);
      return fetchFromAPI(endpoint, true);
    }
    
    return await response.json();
  } catch (error) {
    console.warn(`Network error for ${endpoint}, falling back to mock data:`, error);
    return fetchFromAPI(endpoint, true);
  }
}

export async function analyzeSymptoms(data: any) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { symptoms } = data;
  let condition = 'Condição não identificada';
  let confidence = 70;
  let riskLevel = 'medium';
  let recommendations: string[] = [];
  let redFlags: string[] = [];

  const symptomsLower = symptoms.map((s: string) => s.toLowerCase());
  
  if (symptomsLower.some((s: string) => s.includes('dor') && s.includes('torácica'))) {
    condition = 'Síndrome Coronariana Aguda';
    confidence = 85;
    riskLevel = 'high';
    recommendations = [
      'ECG de 12 derivações imediatamente',
      'Troponina seriada (0h, 1h, 3h)',
      'Aspirina 200mg VO imediatamente',
      'Considerar antiagregação dupla',
      'Monitorização contínua'
    ];
    redFlags = [
      'Dor torácica em repouso',
      'Dispneia associada',
      'Fatores de risco cardiovascular'
    ];
  } else if (symptomsLower.some((s: string) => s.includes('dispneia'))) {
    condition = 'Possível Pneumonia ou Insuficiência Cardíaca';
    confidence = 75;
    riskLevel = 'medium';
    recommendations = [
      'Ausculta pulmonar detalhada',
      'Saturação de oxigênio',
      'Raio-X de tórax',
      'Considerar gasometria arterial'
    ];
    redFlags = [
      'Dispneia em repouso',
      'Taquipneia'
    ];
  }

  return {
    condition,
    confidence,
    riskLevel,
    recommendations,
    redFlags,
    analyzedSymptoms: symptoms,
    timestamp: new Date().toISOString()
  };
}

// Calculate Wells Score for Pulmonary Embolism
export function calculateWellsScore(criteria: WellsScoreCriteria): WellsScoreResult {
  let score = 0;
  
  if (criteria.clinicalSignsTVP) score += 3;
  if (criteria.tepmorelikely) score += 3;
  if (criteria.heartRateOver100) score += 1.5;
  if (criteria.immobilizationSurgery) score += 1.5;
  if (criteria.previousTEP) score += 1.5;
  if (criteria.hemoptysis) score += 1;
  if (criteria.cancer) score += 1;

  let interpretation = '';
  let recommendation = '';

  if (score < 2) {
    interpretation = 'Risco BAIXO de TEP (< 2%)';
    recommendation = 'Considerar alta sem teste D-dímero. Reavalie se sintomas pioram.';
  } else if (score < 6) {
    interpretation = 'Risco INTERMEDIÁRIO de TEP (2-30%)';
    recommendation = 'D-dímero é recomendado. Se negativo + risco intermediário = pode descartar TEP.';
  } else {
    interpretation = 'Risco ALTO de TEP (> 30%)';
    recommendation = 'Angiografia pulmonar (CTPA) ou venografia recomendados. Considerar anticoagulação empiricamente.';
  }

  return {
    score,
    interpretation,
    recommendation
  };
}

// Mutations for React Query
export const mutations = {
  calculateWellsScore: (onSuccess?: (data: WellsScoreResult) => void) => ({
    mutationFn: (criteria: WellsScoreCriteria) => Promise.resolve(calculateWellsScore(criteria)),
    onSuccess
  })
};
