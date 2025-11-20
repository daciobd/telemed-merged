import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface MobileViewProps {
  specialty: string;
  userId: string;
  nightMode: boolean;
  dashboardData: any;
}

export default function MobileView({ specialty, userId, nightMode, dashboardData }: MobileViewProps) {
  const [quickAccessMode, setQuickAccessMode] = useState(true);
  const [swipeGestures, setSwipeGestures] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [batteryOptimized, setBatteryOptimized] = useState(false);

  // Auto-detect device orientation and battery
  useEffect(() => {
    // Auto-enable battery optimization on mobile
    if (navigator.userAgent.includes('Mobile')) {
      setBatteryOptimized(true);
    }
  }, []);

  return (
    <div 
      className={`mobile-dashboard ${nightMode ? 'mobile-night-mode' : ''} ${emergencyMode ? 'mobile-emergency' : ''}`}
      data-testid="mobile-dashboard"
    >
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{getSpecialtyShortName(specialty)}</h2>
            <p className="text-xs text-muted-foreground">Plantão móvel</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={emergencyMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => setEmergencyMode(!emergencyMode)}
              data-testid="mobile-emergency-toggle"
            >
              <i className="fas fa-exclamation-triangle mr-1"></i>
              {emergencyMode ? 'ATIVO' : 'SOS'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-testid="mobile-settings"
            >
              <i className="fas fa-cog"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="p-4 bg-muted/50">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div data-testid="mobile-stat-cases">
            <div className="text-lg font-bold text-primary">{dashboardData?.todayCases || 0}</div>
            <div className="text-xs text-muted-foreground">Casos</div>
          </div>
          <div data-testid="mobile-stat-time">
            <div className="text-lg font-bold text-green-600">{dashboardData?.averageTime || 0}m</div>
            <div className="text-xs text-muted-foreground">Tempo</div>
          </div>
          <div data-testid="mobile-stat-accuracy">
            <div className="text-lg font-bold text-blue-600">{dashboardData?.accuracy || 0}%</div>
            <div className="text-xs text-muted-foreground">Precisão</div>
          </div>
          <div data-testid="mobile-stat-alerts">
            <div className="text-lg font-bold text-orange-600">{dashboardData?.alerts || 0}</div>
            <div className="text-xs text-muted-foreground">Alertas</div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          {getMobileQuickAccess(specialty).map((item, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-2"
              data-testid={`mobile-quick-${index}`}
            >
              <i className={`fas ${item.icon} text-xl`}></i>
              <span className="text-xs font-medium">{item.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Recent Cases - Swipeable */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Casos Recentes</h3>
          <Badge variant="outline" className="text-xs">
            Deslize →
          </Badge>
        </div>
        <div className="flex space-x-3 overflow-x-auto pb-3">
          {(dashboardData?.recentCases || []).slice(0, 5).map((case_, index) => (
            <Card key={index} className="min-w-[200px] flex-shrink-0" data-testid={`mobile-case-${index}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={getMobilePriorityVariant(case_.priority)} className="text-xs">
                    {case_.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{case_.timeAgo}</span>
                </div>
                <p className="text-sm font-medium mb-1">
                  {case_.symptoms?.slice(0, 2).join(', ')}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{case_.duration}min</span>
                  <span className="text-xs text-green-600">{case_.outcome}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mobile Settings Panel */}
      <Card className="m-4" data-testid="mobile-settings-panel">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Configurações Móveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Modo Noturno</p>
              <p className="text-xs text-muted-foreground">Reduz brilho da tela</p>
            </div>
            <Switch 
              checked={nightMode} 
              disabled 
              data-testid="mobile-night-mode-switch"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Gestos Rápidos</p>
              <p className="text-xs text-muted-foreground">Navegação por deslize</p>
            </div>
            <Switch 
              checked={swipeGestures}
              onCheckedChange={setSwipeGestures}
              data-testid="mobile-gestures-switch"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Economia de Bateria</p>
              <p className="text-xs text-muted-foreground">Reduz atualizações</p>
            </div>
            <Switch 
              checked={batteryOptimized}
              onCheckedChange={setBatteryOptimized}
              data-testid="mobile-battery-switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Quick Actions */}
      {emergencyMode && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Card className="bg-red-50 border-red-200" data-testid="mobile-emergency-panel">
            <CardContent className="p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-3">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Modo Emergência
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="destructive" size="sm" data-testid="mobile-emergency-call">
                  <i className="fas fa-phone mr-2"></i>
                  Chamar
                </Button>
                <Button variant="outline" size="sm" data-testid="mobile-emergency-protocol">
                  <i className="fas fa-clipboard-list mr-2"></i>
                  Protocolo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Navigation Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2">
        <div className="grid grid-cols-4 gap-1">
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" data-testid="mobile-nav-home">
            <i className="fas fa-home"></i>
            <span className="text-xs mt-1">Início</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" data-testid="mobile-nav-cases">
            <i className="fas fa-clipboard"></i>
            <span className="text-xs mt-1">Casos</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" data-testid="mobile-nav-protocols">
            <i className="fas fa-book-medical"></i>
            <span className="text-xs mt-1">Protocolos</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center py-2" data-testid="mobile-nav-profile">
            <i className="fas fa-user"></i>
            <span className="text-xs mt-1">Perfil</span>
          </Button>
        </div>
      </div>

      {/* Spacer for bottom navigation */}
      <div className="h-16"></div>
    </div>
  );
}

// Helper functions
function getSpecialtyShortName(specialty: string): string {
  const shortNames = {
    'cardiologia': 'Cardio',
    'emergencia': 'Emergência',
    'clinica_geral': 'Clínica',
    'pneumologia': 'Pneumo',
    'neurologia': 'Neuro',
    'pediatria': 'Pediatria'
  };
  return shortNames[specialty as keyof typeof shortNames] || specialty;
}

function getMobileQuickAccess(specialty: string) {
  const quickAccess = {
    'cardiologia': [
      { name: 'ECG', icon: 'fa-heartbeat' },
      { name: 'Pressão', icon: 'fa-tachometer-alt' },
      { name: 'Troponina', icon: 'fa-vial' },
      { name: 'Holter', icon: 'fa-clock' }
    ],
    'emergencia': [
      { name: 'Triagem', icon: 'fa-triage' },
      { name: 'ABCDE', icon: 'fa-clipboard-check' },
      { name: 'Drogas', icon: 'fa-syringe' },
      { name: 'Trauma', icon: 'fa-user-injured' }
    ],
    'clinica_geral': [
      { name: 'Consulta', icon: 'fa-stethoscope' },
      { name: 'Receita', icon: 'fa-prescription' },
      { name: 'Exames', icon: 'fa-clipboard-list' },
      { name: 'Retorno', icon: 'fa-calendar-check' }
    ],
    'pneumologia': [
      { name: 'Spirometria', icon: 'fa-lungs' },
      { name: 'Gasometria', icon: 'fa-vial' },
      { name: 'RX Tórax', icon: 'fa-x-ray' },
      { name: 'Wells Score', icon: 'fa-calculator' }
    ]
  };
  
  return quickAccess[specialty as keyof typeof quickAccess] || [];
}

function getMobilePriorityVariant(priority: string) {
  switch (priority) {
    case 'URGENT': return 'destructive';
    case 'HIGH': return 'default';
    case 'MEDIUM': return 'secondary';
    case 'LOW': return 'outline';
    default: return 'outline';
  }
}