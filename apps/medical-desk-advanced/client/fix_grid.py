print("🔧 Substituindo grid de protocolos...")

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

# Encontrar linha com a grid (linha 682, index 681)
start = None
for i, line in enumerate(lines):
    if 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' in line and i > 650:
        start = i
        print(f"Grid encontrada na linha {i+1}")
        break

if start:
    # Encontrar onde termina (próximo })] depois de motion.div)
    end = None
    for i in range(start + 1, min(start + 100, len(lines))):
        if '))}' in lines[i] and 'motion.div' in lines[i-1]:
            end = i
            print(f"Grid termina na linha {i+1}")
            break
    
    if end:
        # Nova grid
        nova_grid = '''              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {protocolosFiltrados.map((protocolo, index) => (
                  <motion.div
                    key={protocolo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => setProtocoloSelecionado(protocolo)}
                    className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 cursor-pointer border-2 ${darkMode ? 'border-gray-700 hover:border-teal-500' : 'border-gray-100 hover:border-teal-500'} transition-all`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        protocolo.categoria === 'Cardiologia' ? 'bg-red-100 text-red-800' :
                        protocolo.categoria === 'Pneumologia' ? 'bg-blue-100 text-blue-800' :
                        protocolo.categoria === 'Neurologia' ? 'bg-purple-100 text-purple-800' :
                        protocolo.categoria === 'Trauma' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {protocolo.categoria}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {protocolo.nome}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      {protocolo.descricao}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {protocolo.passos.length} passos
                      </div>
                      <button className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center space-x-1">
                        <span>Ver detalhes</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
'''
        
        # Reconstruir arquivo
        novo_arquivo = lines[:start] + [nova_grid] + lines[end+1:]
        
        with open('src/App.tsx', 'w') as f:
            f.writelines(novo_arquivo)
        
        print(f"✅ Substituído {end-start+1} linhas!")
        print("✅ Grid de protocolos atualizada com protocolosFiltrados.map()!")

