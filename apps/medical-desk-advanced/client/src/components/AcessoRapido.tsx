import { motion } from 'framer-motion';
import { X, AlertCircle, Activity, Pill, Calculator } from 'lucide-react';
import { AcessoRapido } from '../data/emergencia';

interface Props {
  acesso: AcessoRapido;
  onClose: () => void;
  darkMode: boolean;
}

export function AcessoRapidoModal({ acesso, onClose, darkMode }: Props) {
  const getIcon = () => {
    switch (acesso.icon) {
      case 'AlertCircle': return <AlertCircle className="w-8 h-8" />;
      case 'Activity': return <Activity className="w-8 h-8" />;
      case 'Pill': return <Pill className="w-8 h-8" />;
      case 'Calculator': return <Calculator className="w-8 h-8" />;
      default: return <AlertCircle className="w-8 h-8" />;
    }
  };

  const getCategoriaColor = () => {
    switch (acesso.categoria) {
      case 'triagem': return 'red';
      case 'abcde': return 'blue';
      case 'drogas': return 'purple';
      case 'scores': return 'teal';
      default: return 'gray';
    }
  };

  const color = getCategoriaColor();

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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r from-${color}-600 to-${color}-700 text-white p-6 rounded-t-xl`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <div>
                <h2 className="text-2xl font-bold">{acesso.nome}</h2>
                <p className="text-white/90">{acesso.descricao}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Triagem Manchester */}
          {acesso.id === 'triagem-manchester' && acesso.conteudo.niveis && (
            <div className="space-y-3">
              {acesso.conteudo.niveis.map((nivel: any, index: number) => {
                const corClasses = {
                  'Vermelho': 'bg-red-600',
                  'Laranja': 'bg-orange-600',
                  'Amarelo': 'bg-yellow-500',
                  'Verde': 'bg-green-600',
                  'Azul': 'bg-blue-600'
                };
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${darkMode ? 'bg-gray-700' : 'bg-white'} border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${corClasses[nivel.cor as keyof typeof corClasses]} rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
                        {nivel.cor.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {nivel.prioridade}
                          </h3>
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            ({nivel.tempo})
                          </span>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          Exemplos:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {nivel.exemplos.map((ex: string, i: number) => (
                            <span key={i} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ABCDE */}
          {acesso.id === 'abcde-primary' && acesso.conteudo.passos && (
            <div className="space-y-4">
              {acesso.conteudo.passos.map((passo: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${darkMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg p-5`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {passo.letra}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                        {passo.nome}
                      </h3>
                      <div className="mb-3">
                        <p className={`text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-700'} mb-2`}>
                          Ações:
                        </p>
                        <ul className="space-y-1">
                          {passo.acoes.map((acao: string, i: number) => (
                            <li key={i} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-start space-x-2`}>
                              <span className="text-blue-600">✓</span>
                              <span>{acao}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'} mb-2`}>
                          Sinais de Alerta:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {passo.sinais_alerta.map((sinal: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                              {sinal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Drogas */}
          {acesso.id === 'drogas-emergency' && acesso.conteudo.drogas && (
            <div className="space-y-4">
              {acesso.conteudo.drogas.map((droga: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${darkMode ? 'bg-gray-700' : 'bg-purple-50'} rounded-lg p-5`}
                >
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                    {droga.nome}
                  </h3>
                  <div className="mb-3">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-700'} mb-2`}>
                      Indicações:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {droga.indicacoes.map((ind: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Doses:
                    </p>
                    <div className="space-y-1">
                      {Object.entries(droga.doses).map(([key, value], i) => (
                        <div key={i} className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <span className="font-semibold capitalize">{key}:</span> {value as string}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Scores */}
          {acesso.id === 'scores-rapidos' && acesso.conteudo.scores && (
            <div className="space-y-4">
              {acesso.conteudo.scores.map((score: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${darkMode ? 'bg-gray-700' : 'bg-teal-50'} rounded-lg p-5`}
                >
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                    {score.nome}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-teal-400' : 'text-teal-700'} mb-3`}>
                    {score.descricao}
                  </p>
                  <div className="mb-3">
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Uso: {score.uso}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Parâmetros:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {score.parametros.map((param: string, i: number) => (
                        <span key={i} className={`px-2 py-1 ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-white text-gray-700'} text-xs rounded border ${darkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                          {param}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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
