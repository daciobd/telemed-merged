import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Award,
  Brain,
  Activity,
  Target,
  BookOpen,
  Users,
  Clock,
  BarChart3,
  Eye,
  Moon,
  Sun
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ProtocolInsight {
  name: string;
  usage: number;
  accuracy: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  reason?: string;
  recommendation?: string;
}

interface ProtocolInsightsProps {
  className?: string;
  isNightMode?: boolean;
  isMobileView?: boolean;
  specialty?: string;
}

export default function ProtocolInsights({ 
  className = "", 
  isNightMode = false,
  isMobileView = false,
  specialty = "emergencia"
}: ProtocolInsightsProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'recommendations'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<'most-used' | 'underutilized' | 'all'>('all');
  
  const { data: insights, isLoading } = useQuery({
    queryKey: ['/api/analytics/protocol-insights'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/protocol-insights');
      if (!response.ok) throw new Error('Failed to fetch protocol insights');
      return response.json();
    },
    refetchInterval: 300000 // Refresh every 5 minutes
  });
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  
  const themeClasses = isNightMode 
    ? (isMobileView ? 'mobile-night-mode' : 'dashboard-night-mode')
    : '';

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className} ${themeClasses}`} data-testid="protocol-insights-loading">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className} ${themeClasses}`} data-testid="protocol-insights">
      {/* Header with View Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Insights de Protocolos
          </h2>
          <Badge variant="outline" className="text-xs">
            {specialty}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('overview')}
            data-testid="button-view-overview"
          >
            <Eye className="w-4 h-4 mr-1" />
            Visão Geral
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('detailed')}
            data-testid="button-view-detailed"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            Detalhado
          </Button>
          <Button
            variant={viewMode === 'recommendations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('recommendations')}
            data-testid="button-view-recommendations"
          >
            <Target className="w-4 h-4 mr-1" />
            Recomendações
          </Button>
        </div>
      </div>

      {/* Night Mode Indicator for Medical Safety */}
      {isNightMode && (
        <Card className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Moon className="w-4 h-4" />
            <span className="text-sm font-medium">
              Modo Noturno Ativo - Interface otimizada para ambientes hospitalares escuros
            </span>
          </div>
        </Card>
      )}

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Used Protocols */}
          <Card className="p-6 clinical-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Protocolos Mais Utilizados
              </h3>
              <Badge variant="secondary">{insights?.mostUsedProtocols?.length || 0}</Badge>
            </div>
            
            <div className="space-y-3">
              {insights?.mostUsedProtocols?.slice(0, 5).map((protocol: ProtocolInsight, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {protocol.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {protocol.usage} usos • {protocol.accuracy}% precisão
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(protocol.trend)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Underutilized Protocols */}
          <Card className="p-6 clinical-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Protocolos Subutilizados
              </h3>
              <Badge variant="outline">{insights?.underutilizedProtocols?.length || 0}</Badge>
            </div>
            
            <div className="space-y-3">
              {insights?.underutilizedProtocols?.map((protocol: ProtocolInsight, index: number) => (
                <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {protocol.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {protocol.usage} usos • {protocol.accuracy}% precisão
                      </div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                        <strong>Razão:</strong> {protocol.reason}
                      </div>
                      {protocol.recommendation && (
                        <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          <strong>Recomendação:</strong> {protocol.recommendation}
                        </div>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-learn-${protocol.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Treinar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Detailed Mode */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          <Card className="p-6 clinical-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Análise Detalhada de Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">92%</div>
                <div className="text-sm text-green-600 dark:text-green-400">Precisão Média Geral</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  +2.1% vs mês anterior
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">8.5min</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">Tempo Médio de Análise</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  -0.3min vs mês anterior
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">156</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Protocolos Ativos</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Sistema abrangente
                </div>
              </div>
            </div>
          </Card>

          {/* Specialty Performance */}
          <Card className="p-6 clinical-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Performance por Especialidade
            </h3>
            
            <div className="space-y-4">
              {[
                { specialty: 'Cardiologia', accuracy: 94, volume: 245, trend: 'increasing' },
                { specialty: 'Emergência', accuracy: 91, volume: 378, trend: 'stable' },
                { specialty: 'Pneumologia', accuracy: 93, volume: 189, trend: 'increasing' },
                { specialty: 'Neurologia', accuracy: 89, volume: 156, trend: 'stable' }
              ].map((spec, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      spec.accuracy >= 93 ? 'bg-green-500' : 
                      spec.accuracy >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium">{spec.specialty}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {spec.volume} casos analisados
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">{spec.accuracy}%</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">precisão</div>
                    </div>
                    {getTrendIcon(spec.trend)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations Mode */}
      {viewMode === 'recommendations' && (
        <div className="space-y-6">
          <Card className="p-6 clinical-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Recomendações Prioritárias
            </h3>
            
            <div className="space-y-4">
              {insights?.recommendedImprovements?.map((improvement: any, index: number) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getPriorityColor(improvement.priority)}>
                        {improvement.priority}
                      </Badge>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {improvement.category}
                      </h4>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {improvement.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="default"
                      data-testid={`button-implement-${improvement.category.toLowerCase()}`}
                    >
                      Implementar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      data-testid={`button-details-${improvement.category.toLowerCase()}`}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 clinical-card bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Activity className="w-5 h-5" />
              Ações Rápidas Sugeridas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 text-left justify-start"
                data-testid="button-schedule-training"
              >
                <div>
                  <div className="font-medium">Agendar Treinamento</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Para protocolos subutilizados
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 text-left justify-start"
                data-testid="button-update-protocols"
              >
                <div>
                  <div className="font-medium">Atualizar Protocolos</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Baseado em evidências recentes
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 text-left justify-start"
                data-testid="button-generate-report"
              >
                <div>
                  <div className="font-medium">Gerar Relatório</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Para supervisão médica
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 text-left justify-start"
                data-testid="button-export-analytics"
              >
                <div>
                  <div className="font-medium">Exportar Analytics</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Para análise externa
                  </div>
                </div>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Mobile Emergency Mode Button */}
      {isMobileView && (
        <div className="fixed bottom-4 right-4">
          <Button 
            size="lg" 
            className="mobile-emergency shadow-lg"
            data-testid="button-mobile-emergency"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            EMERGÊNCIA
          </Button>
        </div>
      )}
    </div>
  );
}