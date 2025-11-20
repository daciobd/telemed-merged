import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SpecialtyDashboard, SymptomTrend, PerformanceMetric } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TrendChart from './trend-chart';
import PerformanceChart from './performance-chart';
import MobileView from './mobile-view';

interface SpecialtyDashboardProps {
  specialty: string;
  userId: string;
  nightMode?: boolean;
  isMobile?: boolean;
}

export default function SpecialtyDashboard({ 
  specialty, 
  userId, 
  nightMode = false, 
  isMobile = false 
}: SpecialtyDashboardProps) {
  const [layout, setLayout] = useState<'compact' | 'detailed' | 'visual'>('detailed');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard/specialty', specialty, userId, timeRange],
    enabled: !!specialty && !!userId,
  });

  const { data: trends } = useQuery({
    queryKey: ['/api/analytics/trends', specialty, timeRange],
    enabled: !!specialty,
  });

  const { data: performance } = useQuery({
    queryKey: ['/api/analytics/performance', userId, timeRange],
    enabled: !!userId,
  });

  if (isMobile) {
    return (
      <MobileView 
        specialty={specialty}
        userId={userId}
        nightMode={nightMode}
        dashboardData={dashboardData}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse" data-testid={`loading-card-${i}`}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${nightMode ? 'dashboard-night-mode' : ''}`} data-testid="specialty-dashboard">
      {/* Header com controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Dashboard {getSpecialtyDisplayName(specialty)}
          </h2>
          <p className="text-muted-foreground">
            Análise especializada e métricas de performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={layout} 
            onChange={(e) => setLayout(e.target.value as any)}
            className="px-3 py-2 border rounded-lg"
            data-testid="layout-selector"
          >
            <option value="compact">Compacto</option>
            <option value="detailed">Detalhado</option>
            <option value="visual">Visual</option>
          </select>
          
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-lg"
            data-testid="time-range-selector"
          >
            <option value="24h">24 horas</option>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Tendências</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
          <TabsTrigger value="protocols" data-testid="tab-protocols">Protocolos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Access Cards */}
            <Card data-testid="quick-access-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getSpecialtyQuickAccess(specialty).map((item, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      data-testid={`quick-access-${index}`}
                    >
                      <i className={`fas ${item.icon} mr-2`}></i>
                      {item.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <Card data-testid="cases-today-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Casos Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {dashboardData?.todayCases || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{dashboardData?.casesIncrease || 0}% vs ontem
                </p>
              </CardContent>
            </Card>

            <Card data-testid="avg-time-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData?.averageTime || 0}min
                </div>
                <p className="text-xs text-muted-foreground">
                  por análise clínica
                </p>
              </CardContent>
            </Card>

            <Card data-testid="accuracy-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Precisão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {dashboardData?.accuracy || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  concordância diagnóstica
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card data-testid="recent-activity-card">
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dashboardData?.recentCases || []).slice(0, 5).map((case_, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={getPriorityVariant(case_.priority)}>
                        {case_.priority}
                      </Badge>
                      <div>
                        <p className="font-medium">{case_.symptoms?.slice(0, 2).join(', ')}</p>
                        <p className="text-sm text-muted-foreground">{case_.timeAgo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{case_.duration}min</p>
                      <p className="text-xs text-muted-foreground">{case_.outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <TrendChart 
            data={trends}
            specialty={specialty}
            timeRange={timeRange}
            nightMode={nightMode}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceChart 
            data={performance}
            userId={userId}
            specialty={specialty}
            timeRange={timeRange}
            nightMode={nightMode}
          />
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Most Used Protocols */}
            <Card data-testid="most-used-protocols">
              <CardHeader>
                <CardTitle>Protocolos Mais Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dashboardData?.topProtocols || []).map((protocol, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{protocol.name}</p>
                        <p className="text-sm text-muted-foreground">{protocol.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{protocol.usage}x</p>
                        <p className="text-sm text-green-600">{protocol.accuracy}% precisão</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Underutilized Protocols */}
            <Card data-testid="underutilized-protocols">
              <CardHeader>
                <CardTitle>Protocolos Subutilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(dashboardData?.underutilizedProtocols || []).map((protocol, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div>
                        <p className="font-medium">{protocol.name}</p>
                        <p className="text-sm text-muted-foreground">{protocol.reason}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        data-testid={`protocol-review-${index}`}
                      >
                        Revisar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getSpecialtyDisplayName(specialty: string): string {
  const names = {
    'cardiologia': 'Cardiologia',
    'emergencia': 'Emergência',
    'clinica_geral': 'Clínica Geral',
    'pneumologia': 'Pneumologia',
    'neurologia': 'Neurologia',
    'pediatria': 'Pediatria'
  };
  return names[specialty as keyof typeof names] || specialty;
}

function getSpecialtyQuickAccess(specialty: string) {
  const quickAccess = {
    'cardiologia': [
      { name: 'ECG Básico', icon: 'fa-heartbeat' },
      { name: 'Framingham', icon: 'fa-calculator' },
      { name: 'ACS Protocol', icon: 'fa-exclamation-triangle' }
    ],
    'emergencia': [
      { name: 'Triagem', icon: 'fa-triage' },
      { name: 'ABCDE', icon: 'fa-clipboard-check' },
      { name: 'Drogas Emergency', icon: 'fa-syringe' }
    ],
    'clinica_geral': [
      { name: 'Anamnese', icon: 'fa-clipboard' },
      { name: 'Exame Físico', icon: 'fa-user-check' },
      { name: 'Prescrição', icon: 'fa-prescription' }
    ],
    'pneumologia': [
      { name: 'Espirometria', icon: 'fa-lungs' },
      { name: 'Gasometria', icon: 'fa-vial' },
      { name: 'Wells Score', icon: 'fa-calculator' }
    ]
  };
  
  return quickAccess[specialty as keyof typeof quickAccess] || [];
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'URGENT': return 'destructive';
    case 'HIGH': return 'default';
    case 'MEDIUM': return 'secondary';
    case 'LOW': return 'outline';
    default: return 'outline';
  }
}