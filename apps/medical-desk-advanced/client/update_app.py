import re

print("🚀 Atualizando App.tsx com todas as tabs...")

# Ler o arquivo atual
with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Adicionar imports após a linha do fetchFromAPI
imports_to_add = """import { protocolosClinicosCompletos } from './data/protocolos'
import { ProtocoloDetalhes } from './components/ProtocoloDetalhes'
import { cadeiasCompletas } from './data/cadeias'
import { CadeiaDetalhes } from './components/CadeiaDetalhes'
import { acessosRapidos, metricas, distribuicaoPrioridade } from './data/emergencia'
import { AcessoRapidoModal } from './components/AcessoRapido'
import { dadosBrasil, tendenciasSazonais, causasMortalidade, alertasEpidemiologicos } from './data/populacao'
"""

if 'protocolosClinicosCompletos' not in content:
    content = content.replace(
        "import { fetchFromAPI, analyzeSymptoms } from './lib/api'",
        "import { fetchFromAPI, analyzeSymptoms } from './lib/api'\n" + imports_to_add
    )
    print("✅ Imports adicionados")
else:
    print("⚠️ Imports já existem")

# 2. Adicionar estados
states_to_add = """  const [protocoloSelecionado, setProtocoloSelecionado] = useState<any>(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  const [cadeiaSelecionada, setCadeiaSelecionada] = useState<any>(null)
  const [acessoSelecionado, setAcessoSelecionado] = useState<any>(null)
  const [regiaoSelecionada, setRegiaoSelecionada] = useState(0)
"""

if 'protocoloSelecionado' not in content:
    # Encontrar onde adicionar (após newSymptom)
    content = re.sub(
        r"(const \[newSymptom, setNewSymptom\] = useState\(''\))",
        r"\1\n" + states_to_add,
        content
    )
    print("✅ Estados adicionados")
else:
    print("⚠️ Estados já existem")

# 3. Adicionar variáveis filtradas após tabs
filtered_vars = """
  const protocolosFiltrados = categoriaFiltro === 'todas' 
    ? protocolosClinicosCompletos
    : protocolosClinicosCompletos.filter(p => p.categoria === categoriaFiltro)
  
  const categorias = ['todas', ...Array.from(new Set(protocolosClinicosCompletos.map(p => p.categoria)))]
"""

if 'protocolosFiltrados' not in content:
    # Adicionar após definição de tabs
    content = re.sub(
        r"(const tabs = \[[\s\S]*?\])",
        r"\1" + filtered_vars,
        content
    )
    print("✅ Variáveis filtradas adicionadas")
else:
    print("⚠️ Variáveis filtradas já existem")

# Salvar
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n🎉 App.tsx atualizado!")
print("📝 Próximo passo: adicionar o código das tabs")
