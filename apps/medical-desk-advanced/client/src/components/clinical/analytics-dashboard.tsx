import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import ProtocolInsights from "@/components/analytics/protocol-insights";
import SpecialtyDashboard from "@/components/dashboard/specialty-dashboard";
import TrendChart from "@/components/dashboard/trend-chart";

interface AnalyticsData {
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

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics");
      if (!response.ok) {
        throw new Error("Erro ao carregar analytics");
      }
      return response.json();
    },
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <p>Erro ao carregar métricas do sistema</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const totalPriority = analytics.priorityStats.urgent + analytics.priorityStats.high + 
                       analytics.priorityStats.medium + analytics.priorityStats.low;

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-consultations-today">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consultas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-primary">{analytics.consultationStats.today}</div>
              <i className="fas fa-calendar-day text-primary"></i>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.consultationStats.thisWeek} esta semana
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-response-time">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio de Resposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-green-600">{analytics.avgResponseTime}s</div>
              <i className="fas fa-clock text-green-600"></i>
            </div>
            <p className="text-xs text-green-600 mt-1">
              {analytics.avgResponseTime < 3 ? "Excelente" : "Bom"} desempenho
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-accuracy">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Acurácia Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-blue-600">{analytics.accuracyMetrics.overallAccuracy}%</div>
              <i className="fas fa-bullseye text-blue-600"></i>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {analytics.accuracyMetrics.urgentCaseAccuracy}% em casos urgentes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-system-health">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saúde do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-green-600">{analytics.systemHealth.uptime}</div>
              <i className="fas fa-server text-green-600"></i>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Carga: {analytics.systemHealth.processingLoad}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Prioridades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-priority-distribution">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <i className="fas fa-chart-pie text-primary mr-2"></i>
              Distribuição por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Urgente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{analytics.priorityStats.urgent}</span>
                  <div className="w-20">
                    <Progress 
                      value={totalPriority > 0 ? (analytics.priorityStats.urgent / totalPriority) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">Alta</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{analytics.priorityStats.high}</span>
                  <div className="w-20">
                    <Progress 
                      value={totalPriority > 0 ? (analytics.priorityStats.high / totalPriority) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Média</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{analytics.priorityStats.medium}</span>
                  <div className="w-20">
                    <Progress 
                      value={totalPriority > 0 ? (analytics.priorityStats.medium / totalPriority) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Baixa</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{analytics.priorityStats.low}</span>
                  <div className="w-20">
                    <Progress 
                      value={totalPriority > 0 ? (analytics.priorityStats.low / totalPriority) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Protocolos Mais Utilizados */}
        <Card data-testid="card-protocol-usage">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <i className="fas fa-file-medical text-primary mr-2"></i>
              Protocolos Mais Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.protocolUsage.map((protocol, index) => (
                <div key={protocol.id} className="flex items-center justify-between" data-testid={`protocol-usage-${index}`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{protocol.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{protocol.usage}</span>
                    <i className="fas fa-chart-bar text-xs text-muted-foreground"></i>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Qualidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-quality-metrics">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <i className="fas fa-award text-primary mr-2"></i>
              Métricas de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.accuracyMetrics.urgentCaseAccuracy}%
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Acurácia Casos Urgentes
                </div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {analytics.accuracyMetrics.falsePositives}%
                </div>
                <div className="text-xs text-red-600 mt-1">
                  Falsos Positivos
                </div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.accuracyMetrics.falseNegatives}%
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Falsos Negativos
                </div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.consultationStats.total}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Total de Casos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tendências Temporais */}
        <Card data-testid="card-temporal-trends">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <i className="fas fa-chart-line text-primary mr-2"></i>
              Tendências de Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-blue-900">Hoje</div>
                  <div className="text-xs text-blue-600">Consultas realizadas</div>
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {analytics.consultationStats.today}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-green-900">Esta Semana</div>
                  <div className="text-xs text-green-600">Total semanal</div>
                </div>
                <div className="text-xl font-bold text-green-600">
                  {analytics.consultationStats.thisWeek}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-purple-900">Este Mês</div>
                  <div className="text-xs text-purple-600">Total mensal</div>
                </div>
                <div className="text-xl font-bold text-purple-600">
                  {analytics.consultationStats.thisMonth}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Specialty-Specific Dashboard */}
        <SpecialtyDashboard 
          specialty="emergencia" 
          userId="doc-1" 
          className="xl:col-span-1"
        />
        
        {/* Symptom Trends */}
        <TrendChart 
          specialty="emergencia" 
          timeRange="7d"
          className="xl:col-span-1"
        />
      </div>

      {/* Protocol Insights - Full Width */}
      <ProtocolInsights 
        specialty="emergencia"
        className="w-full"
        isNightMode={false}
        isMobileView={false}
      />
    </div>
  );
}