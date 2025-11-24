print("🔧 Consertando erros de sintaxe...")

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Remover linha 725 (index 724) que tem </div> duplicado
if len(lines) > 724 and '</div>' in lines[724] and lines[724].strip() == '</div>':
    print(f"✅ Removendo </div> extra na linha 725")
    lines.pop(724)

# 2. Corrigir todas as linhas com className=` (falta o {)
fixed_count = 0
for i in range(len(lines)):
    if 'className=`' in lines[i] and 'className={`' not in lines[i]:
        lines[i] = lines[i].replace('className=`', 'className={`')
        # Corrigir o fechamento também
        if '`}>' not in lines[i] and '`>' in lines[i]:
            lines[i] = lines[i].replace('`>', '`}>')
        fixed_count += 1
        print(f"✅ Corrigindo className na linha {i+1}")

print(f"✅ Total de {fixed_count} correções feitas!")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("✅ Arquivo salvo!")

