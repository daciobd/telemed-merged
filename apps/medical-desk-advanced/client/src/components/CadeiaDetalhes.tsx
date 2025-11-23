import { motion } from 'framer-motion';
import { X, Clock, AlertTriangle, CheckCircle, Zap, Activity } from 'lucide-react';
import { CadeiaCuidado } from '../data/cadeias';

interface Props {
  cadeia: CadeiaCuidado;
  onClose: () => void;
  darkMode: boolean;
}

export function CadeiaDetalhes({ cadeia, onClose, darkMode }: Props) {
  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'emergencia': return 'red';
      case 'timing-critico': return 'orange';
      case 'urgente': return 'yellow';
      default: return 'blue';
    }
  };

  const prioridadeColor = getPrioridadeColor(cadeia.prioridade);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r from-${prioridadeColor}-600 to-${prioridadeColor}-700 text-white p-6 rounded-t-xl`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="w-8 h-8" />
                <h2 className="text-2xl font-bold">{cadeia.nome}</h2>
              </div>
              <p className="text-white/90 mb-3">{cadeia.descricao}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 bg-white/20 rounded-full text-sm font-medium uppercase`}>
                  {cadeia.prioridade.replace('-', ' ')}
                </span>
                {cadeia.janelaOtima && (
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{cadeia.janelaOtima}</span>
                  </span>
                )}
                <span className="text-sm">⏱️ {cadeia.tempoEstimado}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Indicadores */}
          {cadeia.indicadores && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} p-4 rounded-lg`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Pacientes Ativos</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{cadeia.indicadores.pacientesAtivos}</p>
              </div>
              <div className={`${darkMode ? 'bg-teal-900/20' : 'bg-teal-50'} p-4 rounded-lg`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tempo Médio</span>
                </div>
                <p className="text-3xl font-bold text-teal-600">{cadeia.indicadores.tempoMedio}</p>
              </div>
              <div className={`${darkMode ? 'bg-green-900/20' : 'bg-green-50'} p-4 rounded-lg`}>
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Taxa Sucesso</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{cadeia.indicadores.taxa_sucesso}%</p>
              </div>
            </div>
          )}

          {/* Passos */}
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
              <CheckCircle className="w-6 h-6 text-teal-600" />
              <span>Passos da Cadeia</span>
            </h3>
            <div className="space-y-3">
              {cadeia.passos.map((passo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-lg ${
                    passo.critico 
                      ? `border-2 ${darkMode ? 'border-red-500 bg-red-900/10' : 'border-red-300 bg-red-50'}`
                      : darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    passo.critico ? 'bg-red-600' : 'bg-teal-600'
                  }`}>
                    {passo.ordem}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {passo.nome}
                      </p>
                      {passo.critico && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded uppercase">
                          Crítico
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Tempo: {passo.tempo}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
              <Zap className="w-6 h-6 text-blue-600" />
              <span>Ações Essenciais</span>
            </h3>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-4`}>
              <ul className="space-y-2">
                {cadeia.acoes.map((acao, index) => (
                  <li key={index} className={`flex items-start space-x-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="text-blue-600 mt-1">✓</span>
                    <span>{acao}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Alertas */}
          <div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span>Sinais de Alerta</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cadeia.alertas.map((alerta, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 p-3 rounded-lg border-2 ${
                    darkMode ? 'border-red-500 bg-red-900/10' : 'border-red-300 bg-red-50'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{alerta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-t p-4`}>
          <button
            onClick={onClose}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
