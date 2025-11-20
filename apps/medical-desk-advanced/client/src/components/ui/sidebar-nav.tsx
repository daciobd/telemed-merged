interface SidebarNavProps {
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export default function SidebarNav({ onTabChange, activeTab }: SidebarNavProps) {

  const navigationItems = [
    { 
      id: "dashboard", 
      label: "Dashboard", 
      icon: "fas fa-home", 
      tab: "overview",
      testId: "nav-dashboard"
    },
    { 
      id: "analysis", 
      label: "Análise Clínica", 
      icon: "fas fa-search", 
      tab: "analysis",
      testId: "nav-analysis"
    },
    { 
      id: "automation", 
      label: "Automação", 
      icon: "fas fa-cogs", 
      tab: "automation",
      testId: "nav-automation"
    },
    { 
      id: "protocols", 
      label: "Protocolos", 
      icon: "fas fa-notes-medical", 
      tab: "protocols",
      testId: "nav-protocols"
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: "fas fa-chart-line", 
      tab: "analytics",
      testId: "nav-analytics"
    },
    { 
      id: "bias-alerts", 
      label: "Alertas de Viés", 
      icon: "fas fa-exclamation-triangle", 
      tab: "bias-alerts",
      testId: "nav-bias-alerts"
    },
    { 
      id: "population-data", 
      label: "Dados Populacionais", 
      icon: "fas fa-users", 
      tab: "population",
      testId: "nav-population-data"
    },
    { 
      id: "settings", 
      label: "Configurações", 
      icon: "fas fa-cog", 
      tab: "settings",
      testId: "nav-settings"
    }
  ];

  const handleNavigation = (item: any) => {
    if (onTabChange && item.tab) {
      onTabChange(item.tab);
    }
  };

  const isActive = (item: any) => {
    return activeTab === item.tab;
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-stethoscope text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">TELEMED</h1>
            <p className="text-xs text-muted-foreground">Sistema Inteligente</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className={`w-full text-left flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              isActive(item)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
            data-testid={item.testId}
          >
            <i className={`${item.icon} w-5`}></i>
            <span className={isActive(item) ? "font-medium" : ""}>{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3" data-testid="user-profile">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <i className="fas fa-user-md text-secondary-foreground text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="text-doctor-name">
              Dra. Ana Silva
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-doctor-crm">
              CRM 12345-SP
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
