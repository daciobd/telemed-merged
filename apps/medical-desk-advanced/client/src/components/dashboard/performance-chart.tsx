import { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { PerformanceMetric } from '@shared/schema';

interface PerformanceChartProps {
  data: PerformanceMetric | undefined;
  userId: string;
  specialty: string;
  timeRange: string;
  nightMode?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PerformanceChart({ 
  data, 
  userId, 
  specialty, 
  timeRange, 
  nightMode = false 
}: PerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'speed' | 'protocols'>('accuracy');

  if (!data) {
    return (
      <Card data-testid="performance-chart-empty">
        <CardHeader>
          <CardTitle>Métricas de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-chart-pie text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">
              Dados de performance insuficientes para o período selecionado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare radar chart data for overall performance
  const radarData = [
    { subject: 'Precisão Diagnóstica', value: data.diagnosticAccuracy.overall, fullMark: 100 },
    { subject: 'Velocidade de Análise', value: getSpeedScore(data.analysisTime.average), fullMark: 100 },
    { subject: 'Uso de Protocolos', value: getProtocolScore(data.protocolUsage), fullMark: 100 },
    { subject: 'Consistência', value: getConsistencyScore(data.analysisTime), fullMark: 100 },
    { subject: 'Especialização', value: getSpecializationScore(specialty, data), fullMark: 100 }
  ];

  // Protocol usage pie chart data
  const protocolPieData = data.protocolUsage.slice(0, 5).map((protocol, index) => ({
    name: protocol.protocolId.replace('protocol-', '').replace('-', ' '),
    value: protocol.frequency,
    accuracy: protocol.accuracy,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className={`space-y-6 ${nightMode ? 'chart-night-mode' : ''}`} data-testid="performance-chart-container">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="overall-accuracy">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Precisão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.diagnosticAccuracy.overall.toFixed(1)}%
            </div>
            <div className="flex items-center mt-2">
              <i className={`fas ${getTrendIcon(data.analysisTime.trend)} mr-2`}></i>
              <span className="text-xs text-muted-foreground">
                {getTrendLabel(data.analysisTime.trend)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="avg-analysis-time">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.analysisTime.average.toFixed(1)}min
            </div>
            <div className="text-xs text-muted-foreground">
              Mediana: {data.analysisTime.median.toFixed(1)}min
            </div>
          </CardContent>
        </Card>

        <Card data-testid="protocols-used">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Protocolos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.protocolUsage.length}
            </div>
            <div className="text-xs text-muted-foreground">
              protocolos utilizados
            </div>
          </CardContent>
        </Card>

        <Card data-testid="shift-performance">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Turno Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {getShiftLabel(data.shift)}
            </div>
            <div className="text-xs text-muted-foreground">
              {getShiftPerformanceNote(data.shift)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart - Overall Performance */}
        <Card data-testid="performance-radar">
          <CardHeader>
            <CardTitle>Análise Multidimensional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Protocol Usage Distribution */}
        <Card data-testid="protocol-distribution">
          <CardHeader>
            <CardTitle>Distribuição de Protocolos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {protocolPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-blue-600">Uso: {data.value}x</p>
                            <p className="text-green-600">Precisão: {data.accuracy}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics by Category */}
      <Card data-testid="category-metrics">
        <CardHeader>
          <CardTitle>Performance por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.diagnosticAccuracy.byCategory.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{category.category}</span>
                  <span className="text-sm font-semibold">{category.accuracy.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={category.accuracy} 
                  className="h-2"
                  data-testid={`category-progress-${index}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{getCategoryInsight(category.category, category.accuracy)}</span>
                  <Badge variant={getAccuracyBadgeVariant(category.accuracy)}>
                    {getAccuracyLabel(category.accuracy)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Protocols */}
      <Card data-testid="top-protocols">
        <CardHeader>
          <CardTitle>Protocolos com Melhor Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.protocolUsage
              .sort((a, b) => b.accuracy - a.accuracy)
              .slice(0, 5)
              .map((protocol, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getProtocolIconBg(protocol.accuracy)}`}>
                      <i className="fas fa-clipboard-check text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="font-medium">{formatProtocolName(protocol.protocolId)}</p>
                      <p className="text-sm text-muted-foreground">
                        Usado {protocol.frequency}x no período
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{protocol.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">precisão</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function getSpeedScore(avgTime: number): number {
  // Convert average time to score (lower time = higher score)
  const maxTime = 30; // 30 minutes max
  return Math.max(0, ((maxTime - avgTime) / maxTime) * 100);
}

function getProtocolScore(protocols: any[]): number {
  const avgAccuracy = protocols.reduce((sum, p) => sum + p.accuracy, 0) / protocols.length;
  return avgAccuracy || 0;
}

function getConsistencyScore(analysisTime: any): number {
  // Lower variance = higher consistency
  const variance = Math.abs(analysisTime.average - analysisTime.median);
  return Math.max(0, 100 - (variance * 10));
}

function getSpecializationScore(specialty: string, data: any): number {
  // Mock calculation based on specialty-specific metrics
  return 85 + Math.random() * 15;
}

function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'improving': return 'fa-arrow-up text-green-500';
    case 'declining': return 'fa-arrow-down text-red-500';
    case 'stable': return 'fa-minus text-blue-500';
    default: return 'fa-minus text-gray-500';
  }
}

function getTrendLabel(trend: string): string {
  switch (trend) {
    case 'improving': return 'Melhorando';
    case 'declining': return 'Em declínio';
    case 'stable': return 'Estável';
    default: return 'Indefinido';
  }
}

function getShiftLabel(shift: string): string {
  switch (shift) {
    case 'diurno': return 'Diurno';
    case 'noturno': return 'Noturno';
    case 'plantao': return 'Plantão';
    default: return shift;
  }
}

function getShiftPerformanceNote(shift: string): string {
  switch (shift) {
    case 'noturno': return 'Performance noturna';
    case 'plantao': return 'Regime de plantão';
    default: return 'Turno regular';
  }
}

function getCategoryInsight(category: string, accuracy: number): string {
  if (accuracy >= 90) return 'Excelente performance';
  if (accuracy >= 80) return 'Boa performance';
  if (accuracy >= 70) return 'Performance moderada';
  return 'Requer atenção';
}

function getAccuracyBadgeVariant(accuracy: number) {
  if (accuracy >= 90) return 'default';
  if (accuracy >= 80) return 'secondary';
  return 'destructive';
}

function getAccuracyLabel(accuracy: number): string {
  if (accuracy >= 90) return 'Excelente';
  if (accuracy >= 80) return 'Bom';
  if (accuracy >= 70) return 'Regular';
  return 'Baixo';
}

function getProtocolIconBg(accuracy: number): string {
  if (accuracy >= 90) return 'bg-green-500';
  if (accuracy >= 80) return 'bg-blue-500';
  if (accuracy >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
}

function formatProtocolName(protocolId: string): string {
  return protocolId
    .replace('protocol-', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}