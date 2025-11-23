import { motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, BookOpen, Clock } from 'lucide-react';
import { Protocolo } from '../data/protocolos';

interface Props {
  protocolo: Protocolo;
  onClose: () => void;
  darkMode: boolean;
}

export function ProtocoloDetalhes({ protocolo, onClose, darkMode }: Props) {
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
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{protocolo.nome}</h2>
              <div className="flex items-center space-x-4 text-sm">
                <span className="px-3 py-1 bg-white/20 rounded-full">{protocolo.categoria}</span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{protocolo.ultimaAtualizacao}</span>
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="mt-3 text-teal-50">{protocolo.descricao}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Passos */}
          {protocolo.passos && (
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                <CheckCircle className="w-5 h-5 text-teal-600" />
                <span>Passos do Protocolo</span>
              </h3>
              <div className="space-y-2">
                {protocolo.passos.map((passo, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start space-x-3 p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 w-7 h-7 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{passo}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Critérios */}
          {protocolo.criterios && (
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span>Critérios Clínicos</span>
              </h3>
              {Object.entries(protocolo.criterios).map(([titulo, items]) => (
                <div key={titulo} className="mb-4">
                  <h4 className={`font-semibold ${darkMode ? 'text-teal-400' : 'text-teal-700'} mb-2`}>
                    {titulo}
                  </h4>
                  <ul className="space-y-2">
                    {(Array.isArray(items) ? items : [items]).map((item, index) => (
                      <li
                        key={index}
                        className={`flex items-start space-x-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                      >
                        <span className="text-teal-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Scoring */}
          {protocolo.scoring && (
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center space-x-2`}>
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Sistema de Pontuação</span>
              </h3>
              
              {protocolo.scoring.criterios && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} mb-4`}>
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-blue-200'}`}>
                        <th className={`text-left py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Critério</th>
                        <th className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pontos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocolo.scoring.criterios.map((c: any, index: number) => (
                        <tr key={index} className={`border-b ${darkMode ? 'border-gray-600' : 'border-blue-100'}`}>
                          <td className={`py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{c.item || c.resposta}</td>
                          <td className="text-right py-2 font-bold text-teal-600">{c.pontos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {protocolo.scoring.interpretacao && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                  <h4 className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-800'} mb-2`}>Interpretação</h4>
                  <ul className="space-y-1">
                    {Object.entries(protocolo.scoring.interpretacao).map(([key, value]) => (
                      <li key={key} className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        <strong>{key}:</strong> {value as string}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Escalas específicas (Glasgow) */}
              {protocolo.scoring.abertura_ocular && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                    <h5 className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-800'} mb-2`}>Abertura Ocular</h5>
                    <ul className="space-y-1 text-sm">
                      {protocolo.scoring.abertura_ocular.map((item: any, i: number) => (
                        <li key={i} className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {item.resposta}: <strong>{item.pontos}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                    <h5 className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-800'} mb-2`}>Resposta Verbal</h5>
                    <ul className="space-y-1 text-sm">
                      {protocolo.scoring.resposta_verbal.map((item: any, i: number) => (
                        <li key={i} className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {item.resposta}: <strong>{item.pontos}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                    <h5 className={`font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-800'} mb-2`}>Resposta Motora</h5>
                    <ul className="space-y-1 text-sm">
                      {protocolo.scoring.resposta_motora.map((item: any, i: number) => (
                        <li key={i} className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {item.resposta}: <strong>{item.pontos}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Referências */}
          {protocolo.referencias && (
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Referências
              </h3>
              <ul className="space-y-1">
                {protocolo.referencias.map((ref, index) => (
                  <li key={index} className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    • {ref}
                  </li>
                ))}
              </ul>
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
