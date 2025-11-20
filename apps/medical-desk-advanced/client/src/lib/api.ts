import { queryClient } from "./queryClient";

export interface SymptomAnalysisRequest {
  symptoms: string[];
  age: number;
  gender: "masculino" | "feminino" | "nao_informado";
  location?: string;
  doctorId?: string;
}

export interface ClinicalSuggestion {
  id: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  actions: string[];
  protocolId?: string;
  category: "investigation" | "score" | "checklist" | "treatment";
}

export interface Protocol {
  id: string;
  name: string;
  title: string;
  symptoms?: string[];
  summary?: string;
  url?: string;
  content?: any;
  active: boolean;
  lastUpdated: Date;
}

export interface BiasAlert {
  id: string;
  doctorId: string;
  pattern: string;
  description: string;
  suggestion?: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  createdAt: Date;
}

export interface EpidemiologyContext {
  location: string;
  data: {
    condition: string;
    incidence: number;
    trend: string;
    period: string;
  }[];
}

export interface AnalysisResponse {
  consultationId: string;
  patientId: string;
  suggestions: ClinicalSuggestion[];
  protocols: Protocol[];
  biasAlerts: BiasAlert[];
  epidemiologyContext?: EpidemiologyContext;
}

export interface WellsScoreCriteria {
  clinicalSignsTVP: boolean;
  tepmorelikely: boolean;
  heartRateOver100: boolean;
  immobilizationSurgery: boolean;
  previousTEP: boolean;
  hemoptysis: boolean;
  cancer: boolean;
}

export interface WellsScoreResponse {
  score: number;
  interpretation: string;
  recommendation: string;
  criteria: WellsScoreCriteria;
}

export interface SystemStats {
  activeProtocols: number;
  todaySuggestions: number;
  biasAlerts: number;
  totalConsultations: number;
}

export interface AnalyticsData {
  consultationStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  priorityStats: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  protocolUsage: Array<{
    id: string;
    name: string;
    usage: number;
  }>;
  avgResponseTime: number;
  accuracyMetrics: {
    overallAccuracy: number;
    urgentCaseAccuracy: number;
    falsePositives: number;
    falseNegatives: number;
  };
  systemHealth: {
    uptime: string;
    lastUpdate: string;
    activeUsers: number;
    processingLoad: string;
  };
}

export const api = {
  // Analyze symptoms
  analyzeSymptoms: async (request: SymptomAnalysisRequest): Promise<AnalysisResponse> => {
    const response = await fetch("/api/analyze-symptoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao analisar sintomas");
    }

    return response.json();
  },

  // Calculate Wells Score
  calculateWellsScore: async (criteria: WellsScoreCriteria): Promise<WellsScoreResponse> => {
    const response = await fetch("/api/wells-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criteria),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao calcular escore de Wells");
    }

    return response.json();
  },

  // Get protocols
  getProtocols: async (): Promise<Protocol[]> => {
    const response = await fetch("/api/protocols");
    if (!response.ok) {
      throw new Error("Erro ao buscar protocolos");
    }
    return response.json();
  },

  // Get system stats
  getSystemStats: async (): Promise<SystemStats> => {
    const response = await fetch("/api/stats");
    if (!response.ok) {
      throw new Error("Erro ao buscar estatísticas");
    }
    return response.json();
  },

  // Get advanced analytics
  getAnalytics: async (): Promise<AnalyticsData> => {
    const response = await fetch("/api/analytics");
    if (!response.ok) {
      throw new Error("Erro ao buscar analytics");
    }
    return response.json();
  },

  // Get epidemiology data
  getEpidemiologyData: async (location: string): Promise<EpidemiologyContext> => {
    const response = await fetch(`/api/epidemiology?location=${encodeURIComponent(location)}`);
    if (!response.ok) {
      throw new Error("Erro ao buscar dados epidemiológicos");
    }
    return response.json();
  },

  // Get bias alerts
  getBiasAlerts: async (doctorId: string): Promise<BiasAlert[]> => {
    const response = await fetch(`/api/bias-alerts/${doctorId}`);
    if (!response.ok) {
      throw new Error("Erro ao buscar alertas de viés");
    }
    return response.json();
  },

  // Submit feedback
  submitFeedback: async (feedback: {
    consultationId: string;
    rating: number;
    comments?: string;
    helpful?: boolean;
  }): Promise<void> => {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao enviar feedback");
    }
  },
};

// Mutation functions for React Query
export const mutations = {
  analyzeSymptoms: (onSuccess?: (data: AnalysisResponse) => void) => ({
    mutationFn: api.analyzeSymptoms,
    onSuccess: (data: AnalysisResponse) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      onSuccess?.(data);
    },
  }),

  calculateWellsScore: (onSuccess?: (data: WellsScoreResponse) => void) => ({
    mutationFn: api.calculateWellsScore,
    onSuccess,
  }),

  submitFeedback: (onSuccess?: () => void) => ({
    mutationFn: api.submitFeedback,
    onSuccess,
  }),
};
