import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import {
  Activity, TrendingUp, AlertTriangle, Users, FileText, Settings,
  BarChart3, Bell, Moon, Sun, Search, Plus, X, Check,
  Heart, Stethoscope, Brain, Zap, Clock, CheckCircle, XCircle,
  TrendingDown, MapPin, Shield, Download
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { fetchFromAPI, analyzeSymptoms } from './lib/api'

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
      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} className={`${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-teal-600 to-teal-700'} text-white shadow-xl`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TELEMED Clinical AI</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-teal-100'}`}>Sistema Inteligente de Suporte à Decisão Clínica</p>
              </div>
            </motion.div>
            <div className="flex items-center space-x-4">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-teal-500'} transition-colors`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>
              <div className="flex items-center space-x-2">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-3 h-3 bg-green-400 rounded-full" />
                <span className="text-sm font-medium">Sistema Online</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 shadow-sm`}>
        <div className="container mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              return (
                <motion.button key={tab.id} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -2 }} onClick={() => { setActiveTab(tab.id); toast.success(`${tab.label} ativado`) }} className={`flex items-center space-x-2 px-4 py-3 border-b-2 whitespace-nowrap transition-all ${activeTab === tab.id ? `border-teal-600 ${darkMode ? 'text-teal-400 bg-gray-700' : 'text-teal-600 bg-teal-50'}` : `border-transparent ${darkMode ? 'text-gray-400 hover:text-teal-400 hover:bg-gray-700' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-50'}`}`}>
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Funcional - Em Breve Conteúdo Completo</p>
            </motion.div>
          )}
          {activeTab === 'analise' && (
            <motion.div key="analise" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl p-8`}>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Análise Clínica</h2>
                <button onClick={handleAnalyze} disabled={loading} className="w-full py-4 bg-teal-600 text-white rounded-lg">
                  {loading ? 'Analisando...' : 'Analisar Sintomas'}
                </button>
              </div>
            </motion.div>
          )}
          {['automacao', 'protocolos', 'analytics', 'alertas', 'populacao', 'config'].includes(activeTab) && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-12 text-center`}>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tabs.find(t => t.id === activeTab)?.label}</h3>
              <p className={`mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Módulo em desenvolvimento</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
