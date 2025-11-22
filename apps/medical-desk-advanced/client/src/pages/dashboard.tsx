import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Users, AlertCircle, FileText, Activity, Plus, TrendingUp } from "lucide-react";

interface Stats {
  activePatientsCount: number;
  criticalCasesCount: number;
  protocolsUsedCount: number;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
  protocol: string;
  severity: "critical" | "warning" | "stable";
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats>({
    activePatientsCount: 0,
    criticalCasesCount: 0,
    protocolsUsedCount: 0,
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Carregar dados do backend
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar estatísticas
      const statsResponse = await fetch("/api/stats");
      if (!statsResponse.ok) throw new Error("Erro ao carregar estatísticas");
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Buscar pacientes
      const patientsResponse = await fetch("/api/patients");
      if (!patientsResponse.ok) throw new Error("Erro ao carregar pacientes");
      const patientsData = await patientsResponse.json();
      setPatients(patientsData);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      
      // Dados de demonstração em caso de erro
      setStats({
        activePatientsCount: 0,
        criticalCasesCount: 0,
        protocolsUsedCount: 0,
      });
      setPatients([
        {
          id: 1,
          name: "João Silva",
          age: 58,
          condition: "SCA com dor torácica",
          protocol: "Protocolo SCA",
          severity: "critical",
        },
        {
          id: 2,
          name: "Maria Costa",
          age: 72,
          condition: "Pneumonia grave (CURB-65=4)",
          protocol: "Protocolo Pneumonia",
          severity: "critical",
        },
        {
          id: 3,
          name: "Carlos Lima",
          age: 34,
          condition: "Suspeita meningite",
          protocol: "Protocolo Meningite",
          severity: "warning",
        },
        {
          id: 4,
          name: "Ana Ferreira",
          age: 45,
          condition: "TEP pós-cirúrgico",
          protocol: "Protocolo TEP",
          severity: "warning",
        },
        {
          id: 5,
          name: "Pedro Souza",
          age: 28,
          condition: "Trauma craniano",
          protocol: "Protocolo Trauma",
          severity: "stable",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPatient = () => {
    setLocation("/clinical-analysis");
  };

  const handlePatientClick = (patientId: number) => {
    setLocation(`/patient/${patientId}`);
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "analise":
        setLocation("/clinical-analysis");
        break;
      case "automacao":
        setLocation("/automation");
        break;
      case "protocolos":
        setLocation("/protocols");
        break;
      case "analytics":
        setLocation("/analytics");
        break;
      case "alertas":
        setLocation("/alerts");
        break;
      case "populacao":
        setLocation("/population");
        break;
      case "config":
        setLocation("/settings");
        break;
      default:
        break;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            CRÍTICO
          </span>
        );
      case "warning":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            ATENÇÃO
          </span>
        );
      case "stable":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            ESTÁVEL
          </span>
        );
      default:
        return null;
    }
  };

  const getTrendIndicator = (value: number) => {
    if (value === 0) return "0% vs. ontem";
    return value > 0 ? `+${value}% vs. ontem` : `${value}% vs. ontem`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sistema de Sugestões Clínicas
            </h1>
            <p className="text-gray-600 mt-1">
              Assistência inteligente para tomada de decisões médicas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">
              Sistema Online
            </span>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 px-8">
        <nav className="flex gap-2 -mb-px">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "analise", label: "Análise" },
            { id: "automacao", label: "Automação" },
            { id: "protocolos", label: "Protocolos" },
            { id: "analytics", label: "Analytics" },
            { id: "alertas", label: "Alertas" },
            { id: "populacao", label: "População" },
            { id: "config", label: "Config" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-yellow-600" size={20} />
            <div>
              <p className="text-yellow-800 font-medium">Modo de Demonstração</p>
              <p className="text-yellow-700 text-sm">
                Não foi possível conectar ao backend. Mostrando dados de exemplo.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pacientes Ativos */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Pacientes Ativos
              </h3>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900">
                  {loading ? "..." : stats.activePatientsCount}
                </p>
                <p className="text-sm text-green-600 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp size={14} />
                  {getTrendIndicator(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Casos Críticos */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Casos Críticos
              </h3>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-red-600">
                  {loading ? "..." : stats.criticalCasesCount}
                </p>
                <p className="text-sm text-red-600 font-medium mt-1">
                  Atenção imediata
                </p>
              </div>
            </div>
          </div>

          {/* Protocolos Usados */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Protocolos Usados
              </h3>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <FileText className="text-teal-600" size={24} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900">
                  {loading ? "..." : stats.protocolsUsedCount}
                </p>
                <p className="text-sm text-teal-600 font-medium mt-1">
                  100% conformidade
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Patients Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Pacientes de Demonstração
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {patients.filter((p) => p.severity === "critical").length} casos
                críticos requerem atenção
              </p>
            </div>
            <button
              onClick={handleNewPatient}
              className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Novo Paciente
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="animate-spin mx-auto mb-2" size={32} />
                <p>Carregando pacientes...</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhum paciente cadastrado</p>
                <p className="text-sm mt-2">
                  Clique em "Novo Paciente" para começar
                </p>
              </div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientClick(patient.id)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patient.name} ({patient.age})
                      </h3>
                      {getSeverityBadge(patient.severity)}
                    </div>
                    <p className="text-gray-600 mb-1">{patient.condition}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium">
                      <FileText size={16} />
                      {patient.protocol}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <button
            onClick={() => setLocation("/clinical-analysis")}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200 text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Users className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Análise Clínica
            </h3>
            <p className="text-gray-600 text-sm">
              Iniciar nova análise de paciente
            </p>
          </button>

          <button
            onClick={() => setLocation("/protocols")}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200 text-left group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
              <FileText className="text-teal-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Protocolos</h3>
            <p className="text-gray-600 text-sm">
              Acessar protocolos clínicos
            </p>
          </button>

          <button
            onClick={() => setLocation("/analytics")}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-200 text-left group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Activity className="text-purple-600" size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">
              Ver estatísticas e relatórios
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
