import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import {
  Activity, TrendingUp, AlertTriangle, Users, FileText, Settings,
  BarChart3, Bell, Moon, Sun, Search, Filter, Plus, X, Check,
  Heart, Stethoscope, Brain, Zap, Clock, CheckCircle, XCircle,
  TrendingDown, Calendar, MapPin, Shield, Download, Upload
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchFromAPI, analyzeSymptoms } from './lib/api'

import { protocolosClinicosCompletos } from './data/protocolos'
import { ProtocoloDetalhes } from './components/ProtocoloDetalhes'

// Chart data
const trendData = [
  { month: 'Jan', sugestoes: 120, aprovadas: 112 },
  { month: 'Fev', sugestoes: 145, aprovadas: 138 },
  { month: 'Mar', sugestoes: 167, aprovadas: 159 },
  { month: 'Abr', sugestoes: 189, aprovadas: 178 },
  { month: 'Mai', sugestoes: 201, aprovadas: 195 },
  { month: 'Jun', sugestoes: 234, aprovadas: 224 },
]

const conditionsData = [
  { name: 'SCA', value: 35, color: '#ef4444' },
  { name: 'Pneumonia', value: 25, color: '#3b82f6' },
  { name: 'AVC', value: 20, color: '#8b5cf6' },
  { name: 'Outros', value: 20, color: '#10b981' },
]

const performanceData = [
  { day: 'Seg', tempo: 45, pacientes: 12 },
  { day: 'Ter', tempo: 38, pacientes: 15 },
  { day: 'Qua', tempo: 42, pacientes: 14 },
  { day: 'Qui', tempo: 35, pacientes: 18 },
  { day: 'Sex', tempo: 40, pacientes: 16 },
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [symptoms, setSymptoms] = useState<string[]>(['Dor torácica', 'Dispneia'])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newSymptom, setNewSymptom] = useState('')

  const [protocoloSelecionado, setProtocoloSelecionado] = useState<any>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  
  const protocolosFiltrados = categoriaFiltro === 'todas' 
    ? protocolosClinicosCompletos
    : protocolosClinicosCompletos.filter(p => p.categoria === categoriaFiltro)
  
  const categorias = ['todas', ...Array.from(new Set(protocolosClinicosCompletos.map(p => p.categoria)))]

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchFromAPI('/api/stats', true)
      setStats(data)
    } catch (error) {
      toast.error('Erro ao carregar estatísticas')
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'analise', label: 'Análise Clínica', icon: Stethoscope },
    { id: 'automacao', label: 'Automação', icon: Zap },
    { id: 'protocolos', label: 'Protocolos', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alertas', label: 'Alertas', icon: Bell },
    { id: 'populacao', label: 'População', icon: Users },
    { id: 'config', label: 'Config', icon: Settings },
  ]

  const handleAnalyze = async () => {
    if (symptoms.length === 0) {
      toast.error('Adicione pelo menos um sintoma')
      return
    }

    setLoading(true)
    toast.loading('Analisando sintomas...', { id: 'analyze' })
    
    try {
      const data = await analyzeSymptoms({ symptoms })
      setResult(data)
      toast.success('Análise concluída!', { id: 'analyze' })
    } catch (error) {
      toast.error('Erro na análise', { id: 'analyze' })
    } finally {
      setLoading(false)
    }
  }

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()])
      setNewSymptom('')
      toast.success('Sintoma adicionado')
    }
  }

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index))
    toast.success('Sintoma removido')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-teal-600 to-teal-700'} text-white shadow-xl`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TELEMED Clinical AI</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-teal-100'}`}>
                  Sistema Inteligente de Suporte à Decisão Clínica
                </p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-teal-500'} transition-colors`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-3 h-3 bg-green-400 rounded-full"
                />
                <span className="text-sm font-medium">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 shadow-sm`}>
        <div className="container mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    setActiveTab(tab.id)
                    toast.success(`${tab.label} ativado`)
                  }}
                  className={`
                    flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? `border-teal-600 ${darkMode ? 'text-teal-400 bg-gray-700' : 'text-teal-600 bg-teal-50'}`
                      : `border-transparent ${darkMode ? 'text-gray-400 hover:text-teal-400 hover:bg-gray-700' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-50'}`
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Protocolos Ativos', value: stats?.protocolosAtivos || 12, icon: FileText, color: 'teal', trend: '+12%' },
                  { label: 'Sugestões Hoje', value: stats?.sugestoesHoje || 45, icon: TrendingUp, color: 'blue', trend: '+8%' },
                  { label: 'Alertas de Viés', value: stats?.alertasVies || 3, icon: AlertTriangle, color: 'orange', trend: '-5%' },
                  { label: 'Taxa de Aprovação', value: `${stats?.taxaAprovacao || 94}%`, icon: Check, color: 'green', trend: '+3%' },
                ].map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                        <span className={`text-sm font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.trend}
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{stat.value}</p>
                    </motion.div>
                  )
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
                >
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Sugestões vs Aprovadas
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="sugestoes" stroke="#14b8a6" strokeWidth={2} />
                      <Line type="monotone" dataKey="aprovadas" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
                >
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Distribuição por Condição
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={conditionsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {conditionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analise' && (
            <motion.div
              key="analise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-8`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                  </div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Análise Clínica Inteligente
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Idade
                      </label>
                      <input
                        type="number"
                        defaultValue="45"
                        className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Sexo
                      </label>
                      <select className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}>
                        <option>Masculino</option>
                        <option>Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Município (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo, SP"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                      Sintomas Relatados
                    </label>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <AnimatePresence>
                        {symptoms.map((symptom, index) => (
                          <motion.span
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800"
                          >
                            {symptom}
                            <button
                              onClick={() => removeSymptom(index)}
                              className="ml-2 text-teal-600 hover:text-teal-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                        placeholder="Digite um sintoma"
                        className={`flex-1 px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addSymptom}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Adicionar</span>
                      </motion.button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-lg rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
                        />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-6 h-6" />
                        <span>Analisar Sintomas com IA</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Results */}
              <AnimatePresence>
                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-teal-50 to-white'} rounded-xl shadow-2xl p-8 border-2 border-teal-200`}
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Análise Concluída
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Baseado em {symptoms.length} sintoma(s) relatado(s)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                          Condição Sugerida
                        </p>
                        <p className="text-2xl font-bold text-teal-700">{result.condition}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                          result.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          result.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Risco: {result.riskLevel === 'high' ? 'Alto' : result.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Nível de Confiança
                          </p>
                          <span className="text-2xl font-bold text-teal-700">{result.confidence}%</span>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 flex items-center space-x-2`}>
                          <FileText className="w-5 h-5 text-teal-600" />
                          <span>Recomendações Clínicas</span>
                        </h4>
                        <ul className="space-y-2">
                          {result.recommendations.map((rec: string, index: number) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-start space-x-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg`}
                            >
                              <Check className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{rec}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {result.redFlags && (
                        <div>
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 flex items-center space-x-2`}>
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span>Sinais de Alerta Identificados</span>
                          </h4>
                          <ul className="space-y-2">
                            {result.redFlags.map((flag: string, index: number) => (
                              <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start space-x-3 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-red-800">{flag}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'automacao' && (
            <motion.div
              key="automacao"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Cadeias Ativas
                    </h3>
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-4xl font-bold text-blue-600">0</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                    0% vs. ontem
                  </p>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Aprovações Pendentes
                    </h3>
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-4xl font-bold text-orange-600">0</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                    Média: 2.5h
                  </p>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Taxa de Aprovação
                    </h3>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-4xl font-bold text-green-600">0%</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                    +4% esta semana
                  </p>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Tarefas Pendentes
                </h3>
                <div className="space-y-3">
                  {[
                    { patient: 'João Silva', task: 'Revisar ECG', priority: 'high', due: '2h' },
                    { patient: 'Maria Costa', task: 'Avaliar Raio-X', priority: 'medium', due: '4h' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg flex items-center justify-between`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-12 rounded-full ${
                          item.priority === 'high' ? 'bg-red-500' :
                          item.priority === 'medium' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.task}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Paciente: {item.patient}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Vence em {item.due}
                        </p>
                        <button className="mt-1 text-teal-600 hover:text-teal-700 text-sm font-medium">
                          Revisar →
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'protocolos' && (
            <motion.div
              key="protocolos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Protocolos Clínicos
                </h2>
                <div className="flex items-center space-x-3">
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className={`px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'todas' ? 'Todas as Categorias' : cat}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar protocolos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 pr-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocolosFiltrados
                  .filter(p => 
                    searchQuery === '' || 
                    p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.descricao.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((protocolo, index) => (
                    <motion.div
                      key={protocolo.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => setProtocoloSelecionado(protocolo)}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 cursor-pointer border-2 border-transparent hover:border-teal-500 transition-all`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                            {protocolo.nome}
                          </h3>
                          <span className="inline-block px-3 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
                            {protocolo.categoria}
                          </span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          protocolo.status === 'ativo' ? 'bg-green-500' :
                          protocolo.status === 'revisao' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`} />
                      </div>
                      
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-2`}>
                        {protocolo.descricao}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className={`flex items-center space-x-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Clock className="w-4 h-4" />
                          <span>{protocolo.ultimaAtualizacao}</span>
                        </span>
                        <button className="text-teal-600 hover:text-teal-700 font-medium flex items-center space-x-1">
                          <span>Ver detalhes</span>
                          <span>→</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {protocolosFiltrados.filter(p => 
                searchQuery === '' || 
                p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.descricao.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhum protocolo encontrado</p>
                </div>
              )}

              {/* Modal de Detalhes */}
              <AnimatePresence>
                {protocoloSelecionado && (
                  <ProtocoloDetalhes
                    protocolo={protocoloSelecionado}
                    onClose={() => setProtocoloSelecionado(null)}
                    darkMode={darkMode}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}port { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import {
  Activity, TrendingUp, AlertTriangle, Users, FileText, Settings,
  BarChart3, Bell, Moon, Sun, Search, Filter, Plus, X, Check,
  Heart, Stethoscope, Brain, Zap, Clock, CheckCircle, XCircle,
  TrendingDown, Calendar, MapPin, Shield, Download, Upload
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchFromAPI, analyzeSymptoms } from './lib/api'

import { protocolosClinicosCompletos } from './data/protocolos'
import { ProtocoloDetalhes } from './components/ProtocoloDetalhes'

// Chart data
const trendData = [
  { month: 'Jan', sugestoes: 120, aprovadas: 112 },
  { month: 'Fev', sugestoes: 145, aprovadas: 138 },
  { month: 'Mar', sugestoes: 167, aprovadas: 159 },
  { month: 'Abr', sugestoes: 189, aprovadas: 178 },
  { month: 'Mai', sugestoes: 201, aprovadas: 195 },
  { month: 'Jun', sugestoes: 234, aprovadas: 224 },
]

const conditionsData = [
  { name: 'SCA', value: 35, color: '#ef4444' },
  { name: 'Pneumonia', value: 25, color: '#3b82f6' },
  { name: 'AVC', value: 20, color: '#8b5cf6' },
  { name: 'Outros', value: 20, color: '#10b981' },
]

const performanceData = [
  { day: 'Seg', tempo: 45, pacientes: 12 },
  { day: 'Ter', tempo: 38, pacientes: 15 },
  { day: 'Qua', tempo: 42, pacientes: 14 },
  { day: 'Qui', tempo: 35, pacientes: 18 },
  { day: 'Sex', tempo: 40, pacientes: 16 },
]

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(false)
  const [symptoms, setSymptoms] = useState<string[]>(['Dor torácica', 'Dispneia'])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newSymptom, setNewSymptom] = useState('')

  const [protocoloSelecionado, setProtocoloSelecionado] = useState<any>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  
  const protocolosFiltrados = categoriaFiltro === 'todas' 
    ? protocolosClinicosCompletos
    : protocolosClinicosCompletos.filter(p => p.categoria === categoriaFiltro)
  
  const categorias = ['todas', ...Array.from(new Set(protocolosClinicosCompletos.map(p => p.categoria)))]

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await fetchFromAPI('/api/stats', true)
      setStats(data)
    } catch (error) {
      toast.error('Erro ao carregar estatísticas')
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'analise', label: 'Análise Clínica', icon: Stethoscope },
    { id: 'automacao', label: 'Automação', icon: Zap },
    { id: 'protocolos', label: 'Protocolos', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alertas', label: 'Alertas', icon: Bell },
    { id: 'populacao', label: 'População', icon: Users },
    { id: 'config', label: 'Config', icon: Settings },
  ]

  const handleAnalyze = async () => {
    if (symptoms.length === 0) {
      toast.error('Adicione pelo menos um sintoma')
      return
    }

    setLoading(true)
    toast.loading('Analisando sintomas...', { id: 'analyze' })
    
    try {
      const data = await analyzeSymptoms({ symptoms })
      setResult(data)
      toast.success('Análise concluída!', { id: 'analyze' })
    } catch (error) {
      toast.error('Erro na análise', { id: 'analyze' })
    } finally {
      setLoading(false)
    }
  }

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()])
      setNewSymptom('')
      toast.success('Sintoma adicionado')
    }
  }

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index))
    toast.success('Sintoma removido')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster position="top-right" />
      
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-teal-600 to-teal-700'} text-white shadow-xl`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TELEMED Clinical AI</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-teal-100'}`}>
                  Sistema Inteligente de Suporte à Decisão Clínica
                </p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-teal-500'} transition-colors`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-3 h-3 bg-green-400 rounded-full"
                />
                <span className="text-sm font-medium">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation */}
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 shadow-sm`}>
        <div className="container mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              return (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    setActiveTab(tab.id)
                    toast.success(`${tab.label} ativado`)
                  }}
                  className={`
                    flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? `border-teal-600 ${darkMode ? 'text-teal-400 bg-gray-700' : 'text-teal-600 bg-teal-50'}`
                      : `border-transparent ${darkMode ? 'text-gray-400 hover:text-teal-400 hover:bg-gray-700' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-50'}`
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Protocolos Ativos', value: stats?.protocolosAtivos || 12, icon: FileText, color: 'teal', trend: '+12%' },
                  { label: 'Sugestões Hoje', value: stats?.sugestoesHoje || 45, icon: TrendingUp, color: 'blue', trend: '+8%' },
                  { label: 'Alertas de Viés', value: stats?.alertasVies || 3, icon: AlertTriangle, color: 'orange', trend: '-5%' },
                  { label: 'Taxa de Aprovação', value: `${stats?.taxaAprovacao || 94}%`, icon: Check, color: 'green', trend: '+3%' },
                ].map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                        </div>
                        <span className={`text-sm font-medium ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.trend}
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{stat.value}</p>
                    </motion.div>
                  )
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
                >
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Sugestões vs Aprovadas
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="sugestoes" stroke="#14b8a6" strokeWidth={2} />
                      <Line type="monotone" dataKey="aprovadas" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
                >
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Distribuição por Condição
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={conditionsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {conditionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analise' && (
            <motion.div
              key="analise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-8`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                  </div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Análise Clínica Inteligente
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Idade
                      </label>
                      <input
                        type="number"
                        defaultValue="45"
                        className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Sexo
                      </label>
                      <select className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}>
                        <option>Masculino</option>
                        <option>Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Município (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo, SP"
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                      Sintomas Relatados
                    </label>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <AnimatePresence>
                        {symptoms.map((symptom, index) => (
                          <motion.span
                            key={index}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800"
                          >
                            {symptom}
                            <button
                              onClick={() => removeSymptom(index)}
                              className="ml-2 text-teal-600 hover:text-teal-800 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                        placeholder="Digite um sintoma"
                        className={`flex-1 px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addSymptom}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Adicionar</span>
                      </motion.button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold text-lg rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-6 h-6 border-4 border-white border-t-transparent rounded-full"
                        />
                        <span>Analisando...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-6 h-6" />
                        <span>Analisar Sintomas com IA</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Results */}
              <AnimatePresence>
                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className={`${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-teal-50 to-white'} rounded-xl shadow-2xl p-8 border-2 border-teal-200`}
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Análise Concluída
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Baseado em {symptoms.length} sintoma(s) relatado(s)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4`}>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                          Condição Sugerida
                        </p>
                        <p className="text-2xl font-bold text-teal-700">{result.condition}</p>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                          result.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                          result.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Risco: {result.riskLevel === 'high' ? 'Alto' : result.riskLevel === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Nível de Confiança
                          </p>
                          <span className="text-2xl font-bold text-teal-700">{result.confidence}%</span>
                        </div>
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 flex items-center space-x-2`}>
                          <FileText className="w-5 h-5 text-teal-600" />
                          <span>Recomendações Clínicas</span>
                        </h4>
                        <ul className="space-y-2">
                          {result.recommendations.map((rec: string, index: number) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex items-start space-x-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} p-3 rounded-lg`}
                            >
                              <Check className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{rec}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {result.redFlags && (
                        <div>
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 flex items-center space-x-2`}>
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span>Sinais de Alerta Identificados</span>
                          </h4>
                          <ul className="space-y-2">
                            {result.redFlags.map((flag: string, index: number) => (
                              <motion.li
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start space-x-3 bg-red-50 p-3 rounded-lg border border-red-200"
                              >
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-red-800">{flag}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'automacao' && (
            <motion.div
              key="automacao"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Cadeias Ativas
                    </h3>
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-4xl font-bold text-blue-600">0</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                    0% vs. ontem
                  </p>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Aprovações Pendentes
                    </h3>
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-4xl font-bold text-orange-600">0</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                    Média: 2.5h
                  </p>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Taxa de Aprovação
                    </h3>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-4xl font-bold text-green-600">0%</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                    +4% esta semana
                  </p>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Tarefas Pendentes
                </h3>
                <div className="space-y-3">
                  {[
                    { patient: 'João Silva', task: 'Revisar ECG', priority: 'high', due: '2h' },
                    { patient: 'Maria Costa', task: 'Avaliar Raio-X', priority: 'medium', due: '4h' },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg flex items-center justify-between`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-2 h-12 rounded-full ${
                          item.priority === 'high' ? 'bg-red-500' :
                          item.priority === 'medium' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {item.task}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Paciente: {item.patient}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Vence em {item.due}
                        </p>
                        <button className="mt-1 text-teal-600 hover:text-teal-700 text-sm font-medium">
                          Revisar →
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'protocolos' && (
            <motion.div
              key="protocolos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Protocolos Clínicos
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar protocolos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-10 pr-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    <Plus className="w-5 h-5" />
                    <span>Novo Protocolo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Síndrome Coronariana Aguda', usage: 245, accuracy: 94, category: 'Cardiologia' },
                  { name: 'Pneumonia Adquirida na Comunidade', usage: 189, accuracy: 91, category: 'Pneumologia' },
                  { name: 'AVC Isquêmico', usage: 156, accuracy: 96, category: 'Neurologia' },
                  { name: 'Sepse', usage: 134, accuracy: 89, category: 'Infectologia' },
                  { name: 'Insuficiência Cardíaca', usage: 98, accuracy: 92, category: 'Cardiologia' },
                  { name: 'DPOC Exacerbado', usage: 87, accuracy: 88, category: 'Pneumologia' },
                ].map((protocol, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {protocol.name}
                        </h3>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded">
                          {protocol.category}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Utilizações
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {protocol.usage}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Acurácia
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {protocol.accuracy}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${protocol.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <button className="mt-4 w-full py-2 text-teal-600 hover:bg-teal-50 rounded-lg font-medium transition-colors">
                      Ver Detalhes →
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Analytics & Performance
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Tempo Médio por Consulta
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="day" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px'
                        }}
                      />
                      <Area type="monotone" dataKey="tempo" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    Pacientes por Dia
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="day" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="pacientes" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total de Pacientes', value: '234', icon: Users, color: 'blue' },
                  { label: 'Tempo Médio', value: '3.2 dias', icon: Clock, color: 'teal' },
                  { label: 'Satisfação', value: '4.6/5', icon: Heart, color: 'pink' },
                ].map((metric, index) => {
                  const Icon = metric.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-8 h-8 text-${metric.color}-600`} />
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {metric.label}
                      </p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>
                        {metric.value}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'alertas' && (
            <motion.div
              key="alertas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Alertas de Viés Cognitivo
                </h2>
                <div className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-teal-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Sistema de detecção ativo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    type: 'Viés de Confirmação',
                    description: 'Detectado em 2 casos esta semana',
                    severity: 'medium',
                    cases: 2,
                    color: 'orange'
                  },
                  {
                    type: 'Viés de Ancoragem',
                    description: 'Possível viés em diagnósticos de pneumonia',
                    severity: 'low',
                    cases: 1,
                    color: 'yellow'
                  },
                  {
                    type: 'Viés de Disponibilidade',
                    description: 'Diagnósticos recentes influenciando decisões',
                    severity: 'low',
                    cases: 1,
                    color: 'yellow'
                  },
                ].map((alert, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border-l-4 ${
                      alert.severity === 'high' ? 'border-red-500' :
                      alert.severity === 'medium' ? 'border-orange-500' :
                      'border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertTriangle className={`w-6 h-6 text-${alert.color}-600`} />
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {alert.type}
                          </h3>
                        </div>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                          {alert.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Casos afetados: <strong>{alert.cases}</strong>
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {alert.severity === 'high' ? 'Alta' :
                             alert.severity === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                        </div>
                      </div>
                      <button className="text-teal-600 hover:text-teal-700 font-medium">
                        Revisar →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'populacao' && (
            <motion.div
              key="populacao"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Dados Populacionais & Epidemiologia
                </h2>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-6 h-6 text-teal-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    São Paulo - SP
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'População Total', value: '12.4M', icon: Users },
                  { label: 'Diabetes', value: '8.4%', icon: TrendingUp },
                  { label: 'Hipertensão', value: '24.1%', icon: Heart },
                  { label: 'Obesidade', value: '19.8%', icon: AlertTriangle },
                ].map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}
                    >
                      <Icon className="w-8 h-8 text-teal-600 mb-3" />
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.label}
                      </p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1`}>
                        {stat.value}
                      </p>
                    </motion.div>
                  )
                })}
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Tendências Sazonais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Respiratórias', current: 15, trend: 'up', color: 'blue' },
                    { name: 'Cardiovasculares', current: 24, trend: 'stable', color: 'teal' },
                    { name: 'Infecciosas', current: 8, trend: 'down', color: 'green' },
                  ].map((trend, index) => (
                    <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {trend.name}
                        </span>
                        {trend.trend === 'up' && <TrendingUp className="w-5 h-5 text-red-500" />}
                        {trend.trend === 'stable' && <div className="w-5 h-0.5 bg-gray-400" />}
                        {trend.trend === 'down' && <TrendingDown className="w-5 h-5 text-green-500" />}
                      </div>
                      <p className={`text-2xl font-bold text-${trend.color}-600`}>
                        {trend.current}%
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                        da população
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Configurações do Sistema
              </h2>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Preferências Gerais
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Modo Escuro
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Ativar tema escuro na interface
                      </p>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        darkMode ? 'bg-teal-600' : 'bg-gray-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: darkMode ? 28 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notificações
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Receber alertas de casos críticos
                      </p>
                    </div>
                    <button className="relative w-14 h-7 rounded-full bg-teal-600">
                      <motion.div
                        initial={{ x: 28 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Sons
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Alertas sonoros para notificações
                      </p>
                    </div>
                    <button className="relative w-14 h-7 rounded-full bg-gray-300">
                      <motion.div
                        initial={{ x: 2 }}
                        className="absolute top-1 w-5 h-5 bg-white rounded-full"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Perfil do Usuário
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Nome
                    </label>
                    <input
                      type="text"
                      defaultValue="Dra. Ana Silva"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      CRM
                    </label>
                    <input
                      type="text"
                      defaultValue="12345-SP"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Especialidade
                    </label>
                    <select className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}>
                      <option>Clínica Médica</option>
                      <option>Cardiologia</option>
                      <option>Neurologia</option>
                      <option>Emergência</option>
                    </select>
                  </div>
                  <button className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
                    Salvar Alterações
                  </button>
                </div>
              </div>

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  Dados & Privacidade
                </h3>
                <div className="space-y-3">
                  <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Download className="w-5 h-5 text-teal-600" />
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        Exportar Dados
                      </span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                  <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-teal-600" />
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        Política de Privacidade
                      </span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                  <button className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors">
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-5 h-5" />
                      <span>Excluir Conta</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
