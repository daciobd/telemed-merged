import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, CheckCircle, XCircle, Activity, Zap, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

interface CareChain {
  id: string;
  name: string;
  protocolId: string;
  trigger: {
    symptoms: string[];
    conditions: string[];
    scores?: Record<string, number>;
  };
  actions: Array<{
    id: string;
    type: string;
    priority: string;
    description: string;
    parameters: Record<string, any>;
    estimatedTime: string;
    prerequisites?: string[];
    contraindications?: string[];
    approvalRequired: boolean;
  }>;
  timeSequence: string;
  totalEstimatedTime: string;
  medicalApprovalRequired: boolean;
  emergencyOverride?: boolean;
  criticalTiming?: boolean;
  timeWindow?: string;
}

interface AutomationRequest {
  id: string;
  patientId: string;
  doctorId: string;
  careChainId: string;
  selectedActions: string[];
  urgencyLevel: string;
  medicalJustification: string;
  approvalStatus: string;
  createdAt: string;
  timeElapsed: number;
  urgencyIndicator: string;
  careChainDetails: CareChain;
}

const CareChainDashboard: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState<CareChain | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Fetch care chains
  const { data: chainsData, isLoading: chainsLoading } = useQuery<any>({
    queryKey: ['/api/care-chains'],
    select: (data: any) => data
  });

  // Fetch pending approvals
  const { data: pendingData, isLoading: pendingLoading } = useQuery<any>({
    queryKey: ['/api/automation/pending'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch automation metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery<any>({
    queryKey: ['/api/automation/metrics']
  });

  // Create automation request mutation
  const createRequestMutation = useMutation({
    mutationFn: (requestData: any) => 
      fetch('/api/automation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/pending'] });
      setSelectedChain(null);
      setSelectedActions([]);
    }
  });

  // Approve automation request mutation
  const approveRequestMutation = useMutation({
    mutationFn: ({ approvalId, approvedBy, selectedActions }: any) =>
      fetch(`/api/automation/approve/${approvalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy, selectedActions })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automation/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/metrics'] });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'STAT': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'URGENT': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case '🚨 CRÍTICO': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case '⚡ URGENTE': return <Zap className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const handleCreateRequest = () => {
    if (!selectedChain || selectedActions.length === 0) return;

    createRequestMutation.mutate({
      patientId: 'patient_001',
      doctorId: 'doc_001',
      careChainId: selectedChain.id,
      selectedActions,
      urgencyLevel: selectedChain.emergencyOverride ? 'EMERGENCY' : 'URGENT',
      medicalJustification: `Cadeia ${selectedChain.name} indicada conforme protocolo clínico`
    });
  };

  const handleApproveRequest = (request: AutomationRequest, actions: string[]) => {
    approveRequestMutation.mutate({
      approvalId: request.id,
      approvedBy: 'doc_senior_001',
      selectedActions: actions
    });
  };

  if (chainsLoading || pendingLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-chains">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="care-chain-dashboard">
      {/* Header with Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cadeias Ativas</p>
                <p className="text-2xl font-bold text-blue-600">{chainsData?.totalChains || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aprovações Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{pendingData?.totalPending || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Aprovação</p>
                <p className="text-2xl font-bold text-green-600">{metricsData?.approvalRate || 0}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Casos Críticos</p>
                <p className="text-2xl font-bold text-red-600">{pendingData?.urgentCount || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chains" data-testid="automation-tabs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chains" data-testid="tab-chains">Cadeias de Cuidado</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Aprovações Pendentes {pendingData?.totalPending > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingData.totalPending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="chains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Cadeias de Cuidado Disponíveis
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {chainsData?.disclaimer}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(chainsData?.chains?.chains || []).map((chain: CareChain) => (
                  <Card 
                    key={chain.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedChain?.id === chain.id ? 'ring-2 ring-blue-500' : ''
                    } ${chain.emergencyOverride ? 'border-red-500' : ''}`}
                    onClick={() => setSelectedChain(chain)}
                    data-testid={`chain-${chain.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{chain.name}</CardTitle>
                        {chain.emergencyOverride && (
                          <Badge variant="destructive" className="text-xs">EMERGÊNCIA</Badge>
                        )}
                        {chain.criticalTiming && (
                          <Badge variant="outline" className="text-xs">TIMING CRÍTICO</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>Tempo estimado:</strong> {chain.totalEstimatedTime}
                        </div>
                        {chain.timeWindow && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            <strong>Janela terapêutica:</strong> {chain.timeWindow}
                          </div>
                        )}
                        <div className="text-xs">
                          <strong>Ações:</strong> {chain.actions.length} procedimentos
                        </div>
                        <div className="text-xs">
                          <strong>Execução:</strong> {chain.timeSequence.toLowerCase()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedChain && (
            <Card data-testid="selected-chain-details">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedChain.emergencyOverride && <AlertTriangle className="w-5 h-5 text-red-600" />}
                  {selectedChain.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Selecione as ações a serem executadas:
                  </div>
                  <div className="space-y-2">
                    {selectedChain.actions && selectedChain.actions.length > 0 && selectedChain.actions.map((action) => (
                      <div key={action.id} className="flex items-center space-x-2 p-3 border rounded">
                        <input
                          type="checkbox"
                          id={action.id}
                          checked={selectedActions.includes(action.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedActions([...selectedActions, action.id]);
                            } else {
                              setSelectedActions(selectedActions.filter(id => id !== action.id));
                            }
                          }}
                          data-testid={`action-${action.id}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{action.description}</span>
                            <Badge className={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                            {action.approvalRequired && (
                              <Badge variant="outline">Requer Aprovação</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Tempo: {action.estimatedTime}
                          </div>
                          {action.contraindications && action.contraindications.length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              Contraindicações: {action.contraindications.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedChain(null);
                        setSelectedActions([]);
                      }}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateRequest}
                      disabled={selectedActions.length === 0 || createRequestMutation.isPending}
                      data-testid="button-request-automation"
                    >
                      {createRequestMutation.isPending ? 'Solicitando...' : 'Solicitar Automação'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Aprovações Pendentes
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {pendingData?.reminderText}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingData?.pendingApprovals?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500" data-testid="no-pending-approvals">
                    Nenhuma aprovação pendente no momento
                  </div>
                ) : (
                  pendingData?.pendingApprovals && pendingData.pendingApprovals.length > 0 ? pendingData.pendingApprovals.map((request: AutomationRequest) => (
                    <Card key={request.id} className="border-l-4 border-l-orange-500" data-testid={`pending-${request.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getUrgencyIcon(request.urgencyIndicator)}
                            {request.careChainDetails?.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {request.timeElapsed}min atrás
                            </Badge>
                            <Badge className={
                              request.urgencyLevel === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                              request.urgencyLevel === 'URGENT' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {request.urgencyLevel}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-sm">
                            <strong>Justificativa:</strong> {request.medicalJustification}
                          </div>
                          <div className="text-sm">
                            <strong>Ações Solicitadas:</strong> {(request.selectedActions && request.selectedActions.length) || 0} de {(request.careChainDetails?.actions && request.careChainDetails.actions.length) || 0} ações
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {request.selectedActions && request.selectedActions.length > 0 && request.selectedActions.map((actionId) => {
                              const action = request.careChainDetails?.actions && request.careChainDetails.actions.length > 0 ? request.careChainDetails.actions.find(a => a.id === actionId) : null;
                              return action ? (
                                <div key={actionId} className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <div className="font-medium">{action.description}</div>
                                  <div className="text-gray-500">{action.estimatedTime}</div>
                                </div>
                              ) : null;
                            })}
                          </div>
                          <Separator />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              data-testid={`reject-${request.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                            <Button
                              onClick={() => handleApproveRequest(request, request.selectedActions)}
                              disabled={approveRequestMutation.isPending}
                              size="sm"
                              data-testid={`approve-${request.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {approveRequestMutation.isPending ? 'Aprovando...' : 'Aprovar'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma aprovação pendente
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Métricas de Automação (Em Desenvolvimento)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded border-l-4 border-yellow-400">
                    <div className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      ⚠️ {metricsData?.clinicalValidationStatus?.status}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Total de solicitações:</span>
                    <span className="font-bold">{metricsData?.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de aprovação:</span>
                    <span className="font-bold text-orange-600">{metricsData?.approvalRate}%</span>
                    <div className="text-xs text-gray-500 ml-2">↓ Realista</div>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo médio de aprovação:</span>
                    <span className="font-bold">{metricsData?.averageApprovalTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sucesso de integração:</span>
                    <span className="font-bold text-yellow-600">{metricsData?.systemIntegrationSuccess}%</span>
                    <div className="text-xs text-gray-500 ml-2">Sistemas legados</div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-red-600">Desafios do Mundo Real:</div>
                    <div className="text-xs space-y-1">
                      <div>• Falhas de integração: {metricsData?.realWorldChallenges?.integrationFailures}%</div>
                      <div>• Downtime mensal: {metricsData?.realWorldChallenges?.systemDowntime}</div>
                      <div>• Problemas de sistemas legados: {metricsData?.realWorldChallenges?.legacySystemIssues}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análise de Tempo (Com Ressalvas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Redução mediana:</span>
                    <span className="font-bold text-blue-600">{metricsData?.timeAnalysis?.medianTimeReduction}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Variação:</strong> {metricsData?.timeAnalysis?.rangeTimeImpact}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-orange-600">⚠️ Ressalvas Importantes:</div>
                    <div className="text-xs space-y-1">
                      {metricsData?.timeAnalysis?.caveats && metricsData.timeAnalysis.caveats.length > 0 && metricsData.timeAnalysis.caveats.map((caveat: any, index: number) => (
                        <div key={index}>• {caveat}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs">
                    <strong>Contexto clínico:</strong> {metricsData?.timeAnalysis?.clinicalContext}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Segurança Clínica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Contraindicações detectadas:</span>
                    <span className="font-bold text-green-600">{metricsData?.clinicalSafety?.contraindicationsDetected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ações críticas bloqueadas:</span>
                    <span className="font-bold text-red-600">{metricsData?.clinicalSafety?.criticalActionsBlocked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Falsos positivos:</span>
                    <span className="font-bold text-orange-600">{metricsData?.clinicalSafety?.falsePositives}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Near miss events:</span>
                    <span className="font-bold text-yellow-600">{metricsData?.clinicalSafety?.nearMissEvents}</span>
                  </div>
                  
                  <div className="p-2 bg-red-50 dark:bg-red-900 rounded text-xs text-red-700 dark:text-red-300">
                    <strong>Disclaimer:</strong> {metricsData?.clinicalSafety?.disclaimer}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cadeias Mais Utilizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metricsData?.mostUsedChains && metricsData.mostUsedChains.length > 0 && metricsData.mostUsedChains.map((chain: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{chain.name}</div>
                          <div className="text-sm text-gray-600">Uso: {chain.usage} casos</div>
                        </div>
                        <Badge variant="outline">{chain.successRate}% sucesso</Badge>
                      </div>
                      {chain.challenges && (
                        <div className="text-xs text-orange-600 mt-2">
                          <strong>Desafio:</strong> {chain.challenges}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gargalos do Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Aprovações pendentes:</span>
                    <span className="font-bold text-orange-600">{metricsData?.workflowBottlenecks?.pendingApprovals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo médio na fila:</span>
                    <span className="font-bold">{metricsData?.workflowBottlenecks?.averageQueueTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atrasos nos picos:</span>
                    <span className="font-bold text-red-600">{metricsData?.workflowBottlenecks?.peakHourDelays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escalações necessárias:</span>
                    <span className="font-bold text-yellow-600">{metricsData?.workflowBottlenecks?.escalationRequired}</span>
                  </div>
                  
                  <div className="p-2 bg-orange-50 dark:bg-orange-900 rounded text-xs">
                    <strong>Desafio principal:</strong> {metricsData?.workflowBottlenecks?.prioritizationChallenges}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                Validação Clínica Necessária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-red-600 mb-2">⚠️ Questões Identificadas:</div>
                    <div className="text-xs space-y-1">
                      {metricsData?.validationNeeded && metricsData.validationNeeded.length > 0 && metricsData.validationNeeded.map((issue: any, index: number) => (
                        <div key={index} className="p-2 bg-red-50 dark:bg-red-900 rounded">
                          • {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-blue-600 mb-2">📋 Próximos Passos:</div>
                    <div className="text-xs space-y-1">
                      {metricsData?.clinicalValidationStatus?.nextSteps && metricsData.clinicalValidationStatus.nextSteps.length > 0 && metricsData.clinicalValidationStatus.nextSteps.map((step: any, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900 rounded">
                          {index + 1}. {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900 rounded border border-yellow-300">
                  <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Status Atual: {metricsData?.clinicalValidationStatus?.status}
                  </div>
                  <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    {metricsData?.clinicalValidationStatus?.warnings && metricsData.clinicalValidationStatus.warnings.length > 0 && metricsData.clinicalValidationStatus.warnings.map((warning: any, index: number) => (
                      <div key={index}>⚠️ {warning}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CareChainDashboard;