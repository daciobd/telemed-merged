import re

print("🔧 Substituindo tab de Protocolos com código correto...")

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar e substituir a seção da grid de protocolos
# Procurar desde "div className="grid grid-cols" até o fechamento do map

old_pattern = r'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\s*\{\[\s*\{[^}]+\}[^\]]*\]\.map\([^)]+\) => \([^)]+\)[\s\S]*?<\/motion\.div>\s*\)\)}\s*<\/div>'

new_grid = '''<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              </div>'''

# Tentar substituir com regex mais simples
if '.map((protocol, index)' in content:
    print("✅ Encontrei código antigo, substituindo...")
    # Substituir manualmente linha por linha é mais seguro
    lines = content.split('\n')
    new_lines = []
    skip_until_div_close = False
    
    for i, line in enumerate(lines):
        if 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' in line and i < 700:
            # Adicionar a nova grid
            new_lines.append(' ' * 14 + new_grid)
            skip_until_div_close = True
            continue
        
        if skip_until_div_close:
            # Pular até encontrar o fechamento </div> da grid
            if '</div>' in line and 'grid' not in line:
                skip_until_div_close = False
            continue
        
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Tab de Protocolos atualizada!")
    print("🔍 Verificando...")
    
    # Verificar
    if 'protocolosFiltrados.map' in content:
        print("✅ SUCESSO! protocolosFiltrados.map encontrado!")
    else:
        print("❌ Algo deu errado na substituição")
else:
    print("❌ Padrão antigo não encontrado")

