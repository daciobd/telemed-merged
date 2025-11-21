import { useState } from "react";
import SidebarNav from "@/components/ui/sidebar-nav";
import SymptomInputPanel from "@/components/clinical/symptom-input-panel";
import ClinicalSuggestions from "@/components/clinical/clinical-suggestions";
import ProtocolsPanel from "@/components/clinical/protocols-panel";
import AnalyticsDashboard from "@/components/clinical/analytics-dashboard";
import CareChainDashboard from "@/components/automation/care-chain-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { api, type AnalysisResponse } from "@/lib/api";

export default function Dashboard() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Get system stats
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.getSystemStats,
  });

  const handleAnalysisComplete = (result: AnalysisResponse) => {
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
  };

  return (
    <div className="min-h-screen flex bg-muted">
      <SidebarNav onTabChange={setActiveTab} activeTab={activeTab} />
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Sistema de Sugestões Clínicas</h2>
              <p className="text-sm text-muted-foreground">Assistência inteligente para tomada de decisões médicas</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sistema Online</span>
              </div>
              <button 
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                data-testid="button-notifications"
              >
                <i className="fas fa-bell text-lg"></i>
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" data-testid="dashboard-tabs">
            <TabsList className="grid w-full grid-cols-8 h-auto p-1 gap-1">
              <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs p-2">
                <i className="fas fa-home mr-1"></i>
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="analysis" data-testid="tab-analysis" className="text-xs p-2">
                <i className="fas fa-search mr-1"></i>
                Análise
              </TabsTrigger>
              <TabsTrigger value="automation" data-testid="tab-automation" className="text-xs p-2">
                <i className="fas fa-cogs mr-1"></i>
                Automação
              </TabsTrigger>
              <TabsTrigger value="protocols" data-testid="tab-protocols" className="text-xs p-2">
                <i className="fas fa-file-medical mr-1"></i>
                Protocolos
              </TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics" className="text-xs p-2">
                <i className="fas fa-chart-bar mr-1"></i>
                Analytics
              </TabsTrigger>
              <TabsTrigger value="bias-alerts" data-testid="tab-bias-alerts" className="text-xs p-2">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Alertas
              </TabsTrigger>
              <TabsTrigger value="population" data-testid="tab-population" className="text-xs p-2">
                <i className="fas fa-users mr-1"></i>
                População
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings" className="text-xs p-2">
                <i className="fas fa-cog mr-1"></i>
                Config
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Symptom Input Panel */}
                <div className="lg:col-span-1">
                  <SymptomInputPanel 
                    onAnalysisStart={handleAnalysisStart}
                    onAnalysisComplete={handleAnalysisComplete}
                    stats={stats}
                  />
                </div>

                {/* Clinical Suggestions */}
                <div className="lg:col-span-2">
                  <ClinicalSuggestions 
                    analysisResult={analysisResult}
                    isAnalyzing={isAnalyzing}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="automation" className="mt-6">
              <CareChainDashboard />
            </TabsContent>

            <TabsContent value="protocols" className="mt-6">
              <ProtocolsPanel />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dashboard Principal</h3>
                  <div className="bg-card p-4 rounded-lg border">
                    <h4 className="font-medium mb-2">Estatísticas do Sistema</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Pacientes ativos</p>
                        <p className="text-2xl font-bold text-primary">{(stats as any)?.totalPatients || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Casos críticos</p>
                        <p className="text-2xl font-bold text-red-600">{(stats as any)?.criticalCases || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Pacientes de Demonstração</h3>
                  <div className="bg-card p-4 rounded-lg border">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Casos críticos</p>
                          <p className="text-lg font-bold text-red-600">{(stats as any)?.criticalCases || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Protocolos usados</p>
                          <p className="text-lg font-bold text-green-600">{(stats as any)?.completedProtocols || 0}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>• João Silva (58): SCA com dor torácica</p>
                        <p>• Maria Costa (72): Pneumonia grave (CURB-65=4)</p>
                        <p>• Carlos Lima (34): Suspeita meningite</p>
                        <p>• Ana Ferreira (45): TEP pós-cirúrgico</p>
                        <p>• Pedro Souza (28): Trauma craniano</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bias-alerts" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Alertas de Viés Cognitivo</h3>
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-muted-foreground">Sistema de detecção de padrões de viés cognitivo em desenvolvimento.</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Viés de confirmação detectado em 2 casos esta semana</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Sistema funcionando normalmente</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="population" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados Epidemiológicos</h3>
                <div className="bg-card p-4 rounded-lg border">
                  <p className="text-muted-foreground">Dados populacionais e epidemiológicos contextuais.</p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">São Paulo - SP</h4>
                      <div className="space-y-1 text-sm">
                        <p>População: 12.4M habitantes</p>
                        <p>Incidência DM: 8.4%</p>
                        <p>Incidência HAS: 24.1%</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tendências Sazonais</h4>
                      <div className="space-y-1 text-sm">
                        <p>Respiratórias: ↑ 15% (inverno)</p>
                        <p>Cardiovasculares: Estável</p>
                        <p>Infectocontagiosas: ↓ 8%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
                <div className="bg-card p-4 rounded-lg border">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Perfil do Usuário</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Nome</p>
                          <p>Dra. Ana Silva</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">CRM</p>
                          <p>12345-SP</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Especialidade</p>
                          <p>Emergência</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Instituição</p>
                          <p>Hospital Geral</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Preferências</h4>
                      <div className="space-y-2 text-sm">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked />
                          <span>Notificações de alertas críticos</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked />
                          <span>Sugestões baseadas em guidelines</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span>Modo desenvolvimento (dados simulados)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
 
