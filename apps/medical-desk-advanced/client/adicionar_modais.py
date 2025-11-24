print("🔧 Adicionando modais no final do arquivo...")

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Verificar se já tem os modais
if 'protocoloSelecionado && (' in content:
    print("⚠️ Modais já existem!")
else:
    # Encontrar onde está o fechamento (antes do último </div> e do export)
    # Procurar por </AnimatePresence> e adicionar os modais antes
    
    modal_code = '''
      {/* Modais */}
      <AnimatePresence>
        {protocoloSelecionado && (
          <ProtocoloDetalhes
            protocolo={protocoloSelecionado}
            onClose={() => setProtocoloSelecionado(null)}
            darkMode={darkMode}
          />
        )}
        {cadeiaSelecionada && (
          <CadeiaDetalhes
            cadeia={cadeiaSelecionada}
            onClose={() => setCadeiaSelecionada(null)}
            darkMode={darkMode}
          />
        )}
        {acessoSelecionado && (
          <AcessoRapidoModal
            acesso={acessoSelecionado}
            onClose={() => setAcessoSelecionado(null)}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>'''
    
    # Adicionar antes do fechamento final
    if '</AnimatePresence>\n      </main>\n    </div>' in content:
        content = content.replace(
            '</AnimatePresence>\n      </main>\n    </div>',
            '</AnimatePresence>\n      </main>\n' + modal_code + '\n    </div>'
        )
        
        with open('src/App.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Modais adicionados!")
    else:
        print("❌ Não encontrei o local correto para adicionar modais")
        print("Procurando alternativas...")

