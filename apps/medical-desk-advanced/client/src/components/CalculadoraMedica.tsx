import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calculator, TrendingUp } from 'lucide-react';
import { Calculadora } from '../data/calculadoras';

interface Props {
  calculadora: Calculadora;
  onClose: () => void;
  darkMode: boolean;
}

export function CalculadoraMedica({ calculadora, onClose, darkMode }: Props) {
  const [valores, setValores] = useState<any>({});
  const [resultado, setResultado] = useState<any>(null);

  const handleChange = (id: string, value: any) => {
    setValores({ ...valores, [id]: value });
  };

  const calcular = () => {
    // Verificar se todos os campos estão preenchidos
    const todosPreenchidos = calculadora.campos.every(campo => valores[campo.id]);
    if (!todosPreenchidos) {
      alert('Preencha todos os campos!');
      return;
    }

    const res = calculadora.formula(valores);
    setResultado(res);
  };

  const limpar = () => {
    setValores({});
    setResultado(null);
  };

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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Calculator className="w-8 h-8" />
                <h2 className="text-2xl font-bold">{calculadora.nome}</h2>
              </div>
              <p className="text-teal-100">{calculadora.descricao}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-teal-500/30 rounded-full text-sm">
                {calculadora.categoria}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Campos de Input */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Dados do Paciente
            </h3>
            {calculadora.campos.map((campo) => (
              <div key={campo.id}>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {campo.label}
                  {campo.unidade && <span className="text-teal-600 ml-2">({campo.unidade})</span>}
                </label>
                {campo.tipo === 'number' ? (
                  <input
                    type="number"
                    min={campo.min}
                    max={campo.max}
                    placeholder={campo.placeholder}
                    value={valores[campo.id] || ''}
                    onChange={(e) => handleChange(campo.id, parseFloat(e.target.value))}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                ) : (
                  <select
                    value={valores[campo.id] || ''}
                    onChange={(e) => handleChange(campo.id, e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-teal-500 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {campo.opcoes?.map((opcao) => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={calcular}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Calculator className="w-5 h-5" />
              <span>Calcular</span>
            </button>
            <button
              onClick={limpar}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Limpar
            </button>
          </div>

          {/* Resultado */}
          {resultado && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-xl border-2 border-teal-200 dark:border-teal-700"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-teal-600 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Resultado
                  </h4>
                  <div className="text-3xl font-bold text-teal-600 mb-2">
                    {resultado.valor} {resultado.unidade}
                  </div>
                  {resultado.formula && (
                    <p className={`text-sm mb-3 font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {resultado.formula}
                    </p>
                  )}
                  <div className={`text-base font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {calculadora.interpretacao(resultado.valor)}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
