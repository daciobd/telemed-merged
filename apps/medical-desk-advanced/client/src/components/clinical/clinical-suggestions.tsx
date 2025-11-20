import { type AnalysisResponse } from "@/lib/api";
import WellsScoreCalculator from "./wells-score-calculator";
import RedFlagsChecklist from "./red-flags-checklist";
import FeedbackSystem from "./feedback-system";

interface ClinicalSuggestionsProps {
  analysisResult: AnalysisResponse | null;
  isAnalyzing: boolean;
  emergencyMode?: boolean;
  sessionDuration?: number; // for fatigue detection
}

export default function ClinicalSuggestions({ analysisResult, isAnalyzing, emergencyMode = false, sessionDuration = 0 }: ClinicalSuggestionsProps) {
  // ANTI-FATIGUE: Adapt visual intensity based on session duration
  const isFatigueRisk = sessionDuration > 1800; // 30+ minutes
  const visualIntensity = emergencyMode 
    ? "high" // Emergency always high intensity
    : isFatigueRisk 
      ? "reduced" // Reduce intensity for long sessions
      : "normal";
  if (isAnalyzing) {
    return (
      <div className="space-y-4">
        <div className="clinical-card p-4 bg-blue-50 border-blue-200" data-testid="processing-status">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full animation-pulse"></div>
            <span className="text-blue-800 font-medium">Processando sintomas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="clinical-card p-8 text-center" data-testid="no-analysis-state">
        <i className="fas fa-stethoscope text-4xl text-muted-foreground mb-4"></i>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aguardando Análise</h3>
        <p className="text-muted-foreground">
          Digite os sintomas do paciente e clique em "Analisar Sintomas" para obter sugestões clínicas.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${emergencyMode ? 'emergency-mode-container' : ''} ${isFatigueRisk ? 'reduced-fatigue-mode' : ''}`} data-testid="clinical-suggestions">
      {/* Suggestions */}
      {analysisResult.suggestions.map((suggestion) => (
        <div 
          key={suggestion.id} 
          className={`clinical-card p-4 priority-${suggestion.priority.toLowerCase()} ${getAdaptiveVisualClass(suggestion.priority, visualIntensity, emergencyMode)}`}
          data-testid={`suggestion-${suggestion.id}`}
        >
          <div className="flex items-start space-x-3">
            <div className={`w-8 h-8 ${getAdaptivePriorityBg(suggestion.priority, visualIntensity, emergencyMode)} rounded-full flex items-center justify-center flex-shrink-0`}>
              <i className={`fas ${getPriorityIcon(suggestion.category)} ${getAdaptivePriorityText(suggestion.priority, visualIntensity, emergencyMode)}`}></i>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-semibold ${getAdaptiveTitleColor(suggestion.priority, visualIntensity, emergencyMode)}`}>
                  {getAdaptiveTitle(suggestion.title, emergencyMode, visualIntensity)}
                </h4>
                <span className={`protocol-badge ${getAdaptiveBadgeColor(suggestion.priority, visualIntensity, emergencyMode)}`}>
                  {suggestion.category.toUpperCase()}
                </span>
              </div>
              <p className={`text-sm ${getPriorityTextColorMedium(suggestion.priority)} mb-3`}>
                {suggestion.description}
              </p>
              
              {/* Special components for specific suggestions */}
              {suggestion.id === "sug-wells" && (
                <WellsScoreCalculator />
              )}
              
              {suggestion.id === "sug-redflags" && (
                <RedFlagsChecklist />
              )}
              
              <div className="space-y-2">
                <h5 className={`font-medium ${getPriorityTextColorDark(suggestion.priority)}`}>
                  Ações Recomendadas:
                </h5>
                <ul className={`text-sm ${getPriorityTextColorMedium(suggestion.priority)} space-y-1`}>
                  {suggestion.actions.map((action, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <i className={`fas fa-check-circle ${getPriorityTextColor(suggestion.priority)} text-xs`}></i>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feedback System */}
              <FeedbackSystem 
                suggestion={suggestion} 
                consultationId={analysisResult.consultationId}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Epidemiological Context */}
      {analysisResult.epidemiologyContext && (
        <div className="clinical-card p-4" data-testid="epidemiology-context">
          <div className="flex items-center space-x-2 mb-3">
            <i className="fas fa-globe-americas text-secondary text-lg"></i>
            <h4 className="font-semibold text-foreground">
              Contexto Epidemiológico - {analysisResult.epidemiologyContext.location}
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {analysisResult.epidemiologyContext.data.map((item, index) => (
              <div key={index} className="text-center p-3 bg-blue-50 rounded-lg" data-testid={`epidemiology-${item.condition}`}>
                <div className="text-2xl font-bold text-blue-600">
                  {item.incidence}
                </div>
                <div className="text-xs text-blue-600">
                  {item.condition}/100k hab
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getTrendIcon(item.trend)} {item.trend === "INCREASING" ? "↑ Aumentando" : 
                   item.trend === "DECREASING" ? "↓ Diminuindo" : "→ Estável"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bias Alerts */}
      {analysisResult.biasAlerts && analysisResult.biasAlerts.length > 0 && (
        <div className="clinical-card p-4 bg-amber-50 border-amber-200" data-testid="bias-alerts">
          {analysisResult.biasAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-brain text-amber-600"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-2">
                  Alerta de Padrão - {alert.pattern}
                </h4>
                <p className="text-sm text-amber-800 mb-2">
                  {alert.description}
                </p>
                {alert.suggestion && (
                  <div className="text-xs text-amber-700">
                    <span className="font-medium">Sugestão:</span> {alert.suggestion}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper functions for priority styling
function getPriorityBgColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "bg-red-100";
    case "HIGH": return "bg-orange-100";
    case "MEDIUM": return "bg-yellow-100";
    case "LOW": return "bg-blue-100";
    default: return "bg-gray-100";
  }
}

function getPriorityTextColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "text-red-600";
    case "HIGH": return "text-orange-600";
    case "MEDIUM": return "text-yellow-600";
    case "LOW": return "text-blue-600";
    default: return "text-gray-600";
  }
}

function getPriorityTextColorDark(priority: string): string {
  switch (priority) {
    case "URGENT": return "text-red-900";
    case "HIGH": return "text-orange-900";
    case "MEDIUM": return "text-yellow-900";
    case "LOW": return "text-blue-900";
    default: return "text-gray-900";
  }
}

function getPriorityTextColorMedium(priority: string): string {
  switch (priority) {
    case "URGENT": return "text-red-800";
    case "HIGH": return "text-orange-800";
    case "MEDIUM": return "text-yellow-800";
    case "LOW": return "text-blue-800";
    default: return "text-gray-800";
  }
}

function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case "URGENT": return "bg-red-100 text-red-800";
    case "HIGH": return "bg-orange-100 text-orange-800";
    case "MEDIUM": return "bg-yellow-100 text-yellow-800";
    case "LOW": return "bg-blue-100 text-blue-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getPriorityIcon(category: string): string {
  switch (category) {
    case "investigation": return "fa-exclamation";
    case "score": return "fa-calculator";
    case "checklist": return "fa-flag";
    case "treatment": return "fa-pills";
    default: return "fa-info";
  }
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case "INCREASING": return "↑";
    case "DECREASING": return "↓";
    case "STABLE": return "→";
    default: return "→";
  }
}

// ANTI-FATIGUE: Adaptive visual functions to reduce eye strain during prolonged use
function getAdaptiveVisualClass(priority: string, intensity: string, emergencyMode: boolean): string {
  if (emergencyMode) {
    return `emergency-enhanced border-l-4 ${priority === "URGENT" ? "border-red-500" : priority === "HIGH" ? "border-orange-500" : "border-blue-500"}`;
  }
  
  if (intensity === "reduced") {
    return "reduced-contrast reduced-shadows";
  }
  
  return "normal-contrast";
}

function getAdaptivePriorityBg(priority: string, intensity: string, emergencyMode: boolean): string {
  if (emergencyMode) {
    switch (priority) {
      case "URGENT": return "bg-red-200 ring-2 ring-red-500";
      case "HIGH": return "bg-orange-200 ring-2 ring-orange-500";
      case "MEDIUM": return "bg-yellow-200 ring-1 ring-yellow-500";
      case "LOW": return "bg-blue-200 ring-1 ring-blue-500";
      default: return "bg-gray-200";
    }
  }
  
  if (intensity === "reduced") {
    // Softer colors for long sessions
    switch (priority) {
      case "URGENT": return "bg-red-50 border border-red-200";
      case "HIGH": return "bg-orange-50 border border-orange-200";
      case "MEDIUM": return "bg-yellow-50 border border-yellow-200";
      case "LOW": return "bg-blue-50 border border-blue-200";
      default: return "bg-gray-50 border border-gray-200";
    }
  }
  
  return getPriorityBgColor(priority);
}

function getAdaptivePriorityText(priority: string, intensity: string, emergencyMode: boolean): string {
  if (emergencyMode) {
    switch (priority) {
      case "URGENT": return "text-red-700 font-bold";
      case "HIGH": return "text-orange-700 font-semibold";
      case "MEDIUM": return "text-yellow-700";
      case "LOW": return "text-blue-700";
      default: return "text-gray-700";
    }
  }
  
  if (intensity === "reduced") {
    // Gentler text colors for eye strain reduction
    switch (priority) {
      case "URGENT": return "text-red-700";
      case "HIGH": return "text-orange-700";
      case "MEDIUM": return "text-yellow-700";
      case "LOW": return "text-blue-700";
      default: return "text-gray-700";
    }
  }
  
  return getPriorityTextColor(priority);
}

function getAdaptiveTitleColor(priority: string, intensity: string, emergencyMode: boolean): string {
  if (emergencyMode) {
    return `text-gray-900 font-bold ${priority === "URGENT" ? "text-red-900" : ""}`;
  }
  
  if (intensity === "reduced") {
    return "text-gray-800"; // Unified softer color for long sessions
  }
  
  return getPriorityTextColorDark(priority);
}

function getAdaptiveBadgeColor(priority: string, intensity: string, emergencyMode: boolean): string {
  if (emergencyMode) {
    switch (priority) {
      case "URGENT": return "bg-red-600 text-white font-bold px-3 py-1";
      case "HIGH": return "bg-orange-600 text-white font-semibold px-3 py-1";
      case "MEDIUM": return "bg-yellow-600 text-white px-3 py-1";
      case "LOW": return "bg-blue-600 text-white px-3 py-1";
      default: return "bg-gray-600 text-white px-3 py-1";
    }
  }
  
  if (intensity === "reduced") {
    // Subtle badges for fatigue reduction
    return "bg-gray-200 text-gray-700 px-2 py-1 text-xs";
  }
  
  return getPriorityBadgeColor(priority);
}

function getAdaptiveTitle(title: string, emergencyMode: boolean, intensity: string): string {
  if (emergencyMode) {
    // Emergency mode adds critical prefix only for truly urgent items
    if (title.includes("Emergência") || title.includes("Crítico") || title.includes("Imediato")) {
      return `🚨 ${title}`;
    }
    return title;
  }
  
  if (intensity === "reduced") {
    // Remove excessive visual noise during long sessions
    return title.replace(/[🚨⚡⚠️]/g, '').trim();
  }
  
  return title;
}
