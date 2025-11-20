import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SymptomTrend } from '@shared/schema';

interface TrendChartProps {
  data: SymptomTrend[] | undefined;
  specialty: string;
  timeRange: string;
  nightMode?: boolean;
}

export default function TrendChart({ data, specialty, timeRange, nightMode = false }: TrendChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return (
      <Card data-testid="trend-chart-empty">
        <CardHeader>
          <CardTitle>Tendências de Sintomas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-chart-line text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">
              Dados insuficientes para análise de tendências no período selecionado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const chartData = data.map((trend, index) => ({
    name: trend.symptom,
    frequency: trend.frequency,
    relevance: trend.specialtyRelevance * 100,
    trend: trend.trend,
    seasonality: trend.seasonality === 'alta' ? 100 : trend.seasonality === 'media' ? 60 : 30,
    index
  }));

  const topTrends = data
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  return (
    <div className={`space-y-6 ${nightMode ? 'chart-night-mode' : ''}`} data-testid="trend-chart-container">
      {/* Chart Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Tendências de Sintomas - {getSpecialtyName(specialty)}</h3>
          <p className="text-sm text-muted-foreground">
            Análise epidemiológica dos últimos {timeRange}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
            data-testid="chart-type-line"
          >
            <i className="fas fa-chart-line mr-2"></i>
            Linha
          </Button>
          <Button
            variant={chartType === 'area' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('area')}
            data-testid="chart-type-area"
          >
            <i className="fas fa-chart-area mr-2"></i>
            Área
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
            data-testid="chart-type-bar"
          >
            <i className="fas fa-chart-bar mr-2"></i>
            Barras
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2" data-testid="main-trend-chart">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Frequência de Sintomas
              <Badge variant="outline">
                {chartData.length} sintomas analisados
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'line' && (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className={nightMode ? 'opacity-30' : ''} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-blue-600">Frequência: {data.frequency}</p>
                              <p className="text-green-600">Relevância: {data.relevance.toFixed(1)}%</p>
                              <p className="text-orange-600">
                                Tendência: {getTrendLabel(data.trend)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="frequency" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                    />
                  </LineChart>
                )}
                
                {chartType === 'area' && (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className={nightMode ? 'opacity-30' : ''} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="frequency" 
                      stroke="#2563eb" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                )}
                
                {chartType === 'bar' && (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className={nightMode ? 'opacity-30' : ''} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#3b82f6" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trend Insights */}
        <Card data-testid="trend-insights">
          <CardHeader>
            <CardTitle>Insights de Tendências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Top Growing Symptoms */}
              <div>
                <h4 className="font-medium text-sm mb-2">Em Crescimento</h4>
                <div className="space-y-2">
                  {topTrends
                    .filter(trend => trend.trend === 'increasing')
                    .slice(0, 3)
                    .map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="text-sm font-medium">{trend.symptom}</span>
                        <div className="flex items-center">
                          <i className="fas fa-arrow-up text-red-500 mr-1"></i>
                          <span className="text-sm text-red-600">{trend.frequency}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Stable Trends */}
              <div>
                <h4 className="font-medium text-sm mb-2">Estáveis</h4>
                <div className="space-y-2">
                  {topTrends
                    .filter(trend => trend.trend === 'stable')
                    .slice(0, 3)
                    .map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm font-medium">{trend.symptom}</span>
                        <div className="flex items-center">
                          <i className="fas fa-minus text-blue-500 mr-1"></i>
                          <span className="text-sm text-blue-600">{trend.frequency}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Declining Trends */}
              <div>
                <h4 className="font-medium text-sm mb-2">Em Declínio</h4>
                <div className="space-y-2">
                  {topTrends
                    .filter(trend => trend.trend === 'decreasing')
                    .slice(0, 3)
                    .map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm font-medium">{trend.symptom}</span>
                        <div className="flex items-center">
                          <i className="fas fa-arrow-down text-green-500 mr-1"></i>
                          <span className="text-sm text-green-600">{trend.frequency}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Seasonality Alert */}
              <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                <h4 className="font-medium text-sm text-amber-800 mb-1">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Alerta Sazonal
                </h4>
                <p className="text-xs text-amber-700">
                  {getSeasonalityInsight(data, specialty)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Age Distribution Chart */}
      <Card data-testid="age-distribution-chart">
        <CardHeader>
          <CardTitle>Distribuição por Faixa Etária</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getAgeDistributionData(data)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageRange" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getSpecialtyName(specialty: string): string {
  const names = {
    'cardiologia': 'Cardiologia',
    'emergencia': 'Emergência', 
    'clinica_geral': 'Clínica Geral',
    'pneumologia': 'Pneumologia'
  };
  return names[specialty as keyof typeof names] || specialty;
}

function getTrendLabel(trend: string): string {
  switch (trend) {
    case 'increasing': return 'Crescendo';
    case 'decreasing': return 'Diminuindo';
    case 'stable': return 'Estável';
    default: return trend;
  }
}

function getSeasonalityInsight(data: SymptomTrend[], specialty: string): string {
  const highSeasonal = data.filter(t => t.seasonality === 'alta').length;
  
  if (highSeasonal > data.length * 0.3) {
    return `${highSeasonal} sintomas com alta sazonalidade detectados. Considere protocolos específicos para o período atual.`;
  }
  
  return 'Padrões sazonais dentro da normalidade para a especialidade.';
}

function getAgeDistributionData(data: SymptomTrend[]) {
  // Aggregate age distribution across all symptoms
  const ageRanges = ['0-18', '19-35', '36-50', '51-65', '65+'];
  const distribution = ageRanges.map(range => ({
    ageRange: range,
    percentage: Math.random() * 30 + 10 // Mock data - replace with real aggregation
  }));
  
  return distribution;
}