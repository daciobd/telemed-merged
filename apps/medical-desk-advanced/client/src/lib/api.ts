const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://telemed-deploy-ready.onrender.com';

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
    // Simular delay da rede
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
  // Simular análise
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const { symptoms } = data;
  let condition = 'Condição não identificada';
  let confidence = 70;
  let riskLevel = 'medium';
  let recommendations: string[] = [];
  let redFlags: string[] = [];

  // Análise baseada em sintomas
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
  } else if (symptomsLower.some((s: string) => s.includes('dispneia') || s.includes('falta de ar'))) {
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
