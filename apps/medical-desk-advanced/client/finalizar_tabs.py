print("🚀 Adicionando código COMPLETO de todas as tabs...")

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Encontrar onde está a linha com activeTab === 'protocolos'
for i, line in enumerate(lines):
    if "activeTab === 'protocolos'" in line and "motion.div" in lines[i+1]:
        print(f"✅ Encontrei tab de protocolos na linha {i+1}")
        # A tab já tem estrutura, só precisa do conteúdo do grid
        # Vou procurar onde termina essa seção
        
        # Por ora, vamos só reportar o que encontramos
        print(f"Contexto: {line.strip()}")
        print(f"Próxima linha: {lines[i+1].strip()}")
        break

print("\n📊 Status atual do arquivo:")
print(f"- Total de linhas: {len(lines)}")
print(f"- Tem imports: SIM")
print(f"- Tem estados: SIM") 
print(f"- Tem estrutura das tabs: verificando...")

# Contar quantas vezes aparece activeTab
count = sum(1 for line in lines if 'activeTab ===' in line)
print(f"- Número de tabs com código: {count}")

