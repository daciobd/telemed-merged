import { useState } from 'react';

/**
 * MedicalDesk Dashboard - Versão Premium
 * Design System Médico Profissional
 */

interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
  severity: 'critical' | 'warning' | 'stable';
  protocol?: string;
}

const MedicalDeskDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeNav, setActiveNav] = useState('Dashboard');

  // Dados de demonstração
  const demoPatients: Patient[] = [
    {
      id: 1,
      name: 'João Silva',
      age: 58,
      condition: 'SCA com dor torácica',
      severity: 'critical',
      protocol: 'Protocolo SCA'
    },
    {
      id: 2,
      name: 'Maria Costa',
      age: 72,
      condition: 'Pneumonia grave (CURB-65=4)',
      severity: 'critical',
      protocol: 'Protocolo Pneumonia'
    },
    {
      id: 3,
      name: 'Carlos Lima',
      age: 34,
      condition: 'Suspeita meningite',
      severity: 'warning',
      protocol: 'Protocolo Meningite'
    },
    {
      id: 4,
      name: 'Ana Ferreira',
      age: 45,
      condition: 'TEP pós-cirúrgico',
      severity: 'warning',
      protocol: 'Protocolo TEP'
    },
    {
      id: 5,
      name: 'Pedro Souza',
      age: 28,
      condition: 'Trauma craniano',
      severity: 'critical',
      protocol: 'Protocolo Trauma'
    }
  ];

  const stats = {
    activePacientes: 0,
    criticalCases: 0,
    protocolsUsed: 0
  };

  const navigationItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Análise Clínica', icon: '🔍' },
    { name: 'Automação', icon: '⚡' },
    { name: 'Protocolos', icon: '📋' },
    { name: 'Analytics', icon: '📈' },
    { name: 'Alertas de Viés', icon: '⚠️' },
    { name: 'Dados Populacionais', icon: '👥' },
    { name: 'Configurações', icon: '⚙️' }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analise', label: 'Análise' },
    { id: 'automacao', label: 'Automação' },
    { id: 'protocolos', label: 'Protocolos' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'alertas', label: 'Alertas' },
    { id: 'populacao', label: 'População' },
    { id: 'config', label: 'Config' }
  ];

  const getSeverityBadge = (severity: string) => {
    const badges = {
      critical: { icon: '🔴', label: 'Crítico', class: 'critical' },
      warning: { icon: '🟡', label: 'Atenção', class: 'warning' },
      stable: { icon: '🟢', label: 'Estável', class: 'stable' }
    };
    return badges[severity as keyof typeof badges] || badges.stable;
  };

  return (
    <div className="medical-desk-container">
      {/* Sidebar */}
      <aside className="medical-desk-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">TELEMED</h1>
          <p className="sidebar-subtitle">Sistema Inteligente</p>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <div
              key={item.name}
              className={`nav-item ${activeNav === item.name ? 'active' : ''}`}
              onClick={() => setActiveNav(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.name}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-name">Dra. Ana Silva</div>
          <div className="user-role">CRM 12345-SP</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="medical-desk-main">
        {/* Header */}
        <header className="main-header">
          <div className="header-title-section">
            <h1 className="header-title">Sistema de Sugestões Clínicas</h1>
            <p className="header-subtitle">
              Assistência inteligente para tomada de decisões médicas
            </p>
          </div>
          <div className="header-actions">
            <div className="system-status">
              <span className="status-indicator"></span>
              Sistema Online
            </div>
          </div>
        </header>

        {/* Tabs Navigation */}
        <div className="tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="dashboard-grid">
              {/* Pacientes Ativos */}
              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-label">Pacientes Ativos</div>
                    <div className="stat-value">{stats.activePacientes}</div>
                  </div>
                  <div className="card-icon">
                    👥
                  </div>
                </div>
                <div className="stat-change positive">
                  <span>↑ 0%</span>
                  <span>vs. ontem</span>
                </div>
              </div>

              {/* Casos Críticos */}
              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-label">Casos Críticos</div>
                    <div className="stat-value error">{stats.criticalCases}</div>
                  </div>
                  <div className="card-icon" style={{ background: 'var(--color-error-50)', color: 'var(--color-error-600)' }}>
                    🚨
                  </div>
                </div>
                <div className="stat-change negative">
                  <span>Atenção imediata</span>
                </div>
              </div>

              {/* Protocolos Utilizados */}
              <div className="stat-card">
                <div className="stat-header">
                  <div>
                    <div className="stat-label">Protocolos Usados</div>
                    <div className="stat-value success">{stats.protocolsUsed}</div>
                  </div>
                  <div className="card-icon" style={{ background: 'var(--color-success-50)', color: 'var(--color-success-600)' }}>
                    ✅
                  </div>
                </div>
                <div className="stat-change positive">
                  <span>100% conformidade</span>
                </div>
              </div>
            </div>

            {/* Patients List */}
            <div className="patient-list">
              <div className="patient-list-header">
                <div>
                  <h2 className="card-title">Pacientes de Demonstração</h2>
                  <p className="card-subtitle">
                    {demoPatients.filter(p => p.severity === 'critical').length} casos críticos requerem atenção
                  </p>
                </div>
                <button className="btn btn-primary">
                  ➕ Novo Paciente
                </button>
              </div>

              <div>
                {demoPatients.map((patient) => {
                  const badge = getSeverityBadge(patient.severity);
                  return (
                    <div key={patient.id} className="patient-item">
                      <div className="patient-info">
                        <div className="patient-name">
                          {patient.name} ({patient.age})
                        </div>
                        <div className="patient-condition">
                          {patient.condition}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        {patient.protocol && (
                          <div className="protocol-badge">
                            <span className="protocol-icon">📋</span>
                            {patient.protocol}
                          </div>
                        )}
                        <div className={`patient-badge ${badge.class}`}>
                          <span>{badge.icon}</span>
                          {badge.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Cards */}
            <div className="dashboard-grid" style={{ marginTop: 'var(--spacing-2xl)' }}>
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Análise Clínica</h3>
                    <p className="card-subtitle">
                      IA para suporte à decisão
                    </p>
                  </div>
                  <div className="card-icon">🔍</div>
                </div>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-neutral-600)' }}>
                  Utilize IA para analisar casos complexos e receber sugestões baseadas em evidências.
                </p>
                <button className="btn btn-ghost">
                  Iniciar Análise →
                </button>
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Protocolos Clínicos</h3>
                    <p className="card-subtitle">
                      Biblioteca atualizada
                    </p>
                  </div>
                  <div className="card-icon">📋</div>
                </div>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-neutral-600)' }}>
                  Acesse protocolos clínicos atualizados e orientações baseadas em guidelines.
                </p>
                <button className="btn btn-ghost">
                  Ver Protocolos →
                </button>
              </div>

              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">Analytics Médicos</h3>
                    <p className="card-subtitle">
                      Insights e métricas
                    </p>
                  </div>
                  <div className="card-icon">📈</div>
                </div>
                <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-neutral-600)' }}>
                  Visualize métricas de atendimento e indicadores de qualidade assistencial.
                </p>
                <button className="btn btn-ghost">
                  Ver Analytics →
                </button>
              </div>
            </div>
          </>
        )}

        {/* Outros Tabs (Placeholders) */}
        {activeTab !== 'dashboard' && (
          <div className="card" style={{ padding: 'var(--spacing-3xl)', textAlign: 'center' }}>
            <div className="card-icon" style={{ margin: '0 auto var(--spacing-xl)', width: '80px', height: '80px', fontSize: 'var(--font-size-4xl)' }}>
              🚧
            </div>
            <h2 className="card-title" style={{ marginBottom: 'var(--spacing-md)' }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="card-subtitle">
              Esta seção está em desenvolvimento. Em breve você terá acesso a todas as funcionalidades.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MedicalDeskDashboard;
