# 🧪 Guia Completo de Testes - BidConnect TeleMed

## 📋 Informações do Documento

**Versão:** 1.0  
**Data:** Outubro 2025  
**Objetivo:** Guiar testadores através de todos os fluxos do BidConnect  
**Tempo estimado:** 30-40 minutos para teste completo  

---

## 🎯 Pré-requisitos

Antes de iniciar os testes:

- [ ] Acesso à aplicação: `http://localhost:5000` ou URL do Replit
- [ ] Navegador atualizado (Chrome, Firefox, Safari ou Edge)
- [ ] Console do navegador aberto (F12) para ver logs
- [ ] Verificar que servidor está rodando (ver logs no terminal)

### Verificação Inicial:
```
✅ Servidor rodando na porta 5000
✅ Mock ativado (USE_LOCAL_AUCTION_MOCK=true)
✅ Página carrega sem erros 404
✅ Console sem erros críticos
```

---

## 📖 Estrutura do Guia

Este guia está dividido em **6 seções de teste**:

1. **Landing Page** - Página inicial e navegação
2. **Modelo Conservador** - Fluxo tradicional de precificação
3. **Modelo Sugestivo (IA)** - Recomendação inteligente
4. **Modelo Dinâmico** - Grid de faixas transparentes
5. **Casos de Erro** - Validações e limites
6. **Testes de Navegação** - Transições entre modelos

---

# 1️⃣ LANDING PAGE

## Teste 1.1: Carregamento Inicial

### O que testar:
Verificar que a página inicial carrega corretamente com todos os elementos visuais.

### Passos:
1. Abrir navegador
2. Navegar para: `http://localhost:5000/`
3. Aguardar carregamento completo (2-3 segundos)

### ✅ Critérios de Sucesso:

**Header:**
- [ ] Logo "TM" visível no canto superior esquerdo
- [ ] Texto "TeleMed" ao lado do logo
- [ ] Badge "BETA" ao lado de "BidConnect" (roxo)
- [ ] Botão "Começar Demo ▾" visível (azul)
- [ ] Badge "Programa de Testes" visível (azul claro)

**Hero Section:**
- [ ] Título principal visível e legível
- [ ] Subtítulo/descrição abaixo do título
- [ ] Gradiente de fundo (azul/verde)
- [ ] Cards de demonstração visíveis

**Estilo Visual:**
- [ ] Fundo escuro com gradiente
- [ ] Fontes legíveis e claras
- [ ] Espaçamento adequado entre elementos
- [ ] Sem elementos sobrepostos

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│ [TM] TeleMed  BidConnect[BETA] [Começar Demo ▾] [Programa de Testes] │
├──────────────────────────────────────────┤
│                                          │
│  Título Principal Grande                 │
│  Subtítulo explicativo do sistema        │
│                                          │
│  [Cards de demonstração em grid]         │
│                                          │
└──────────────────────────────────────────┘
```

### ❌ O que NÃO deve acontecer:
- ❌ Erros no console
- ❌ Imagens quebradas (ícone de imagem faltando)
- ❌ Texto sobreposto ou ilegível
- ❌ Layout "quebrado" em mobile

---

## Teste 1.2: Dropdown Menu

### O que testar:
Verificar que o menu dropdown abre e permanece aberto ao mover o mouse.

### Passos:
1. Na landing page (já carregada)
2. **Mover mouse** sobre o botão "Começar Demo ▾"
3. Aguardar 0.5 segundos
4. Observar menu dropdown aparecer
5. **Mover mouse lentamente** do botão para o menu
6. Verificar que menu **não fecha**

### ✅ Critérios de Sucesso:

**Comportamento do Menu:**
- [ ] Menu abre ao fazer hover no botão
- [ ] Menu **permanece aberto** ao mover mouse para dentro dele
- [ ] Sem "piscar" ou fechar/abrir rapidamente
- [ ] Sem gap visível entre botão e menu

**Conteúdo do Menu:**
- [ ] **5 opções visíveis:**
  1. "BidConnect – Conservador" (com badge BETA)
  2. "BidConnect – Sugestivo (IA)" (com badge BETA)
  3. "BidConnect – Dinâmico" (com badge BETA)
  4. "Prescrição em 90s"
  5. "Alertas Clínicos"

**Estilo do Menu:**
- [ ] Fundo escuro (consistente com o tema)
- [ ] Borda sutil
- [ ] Shadow (sombra) visível
- [ ] Links mudam de cor ao hover
- [ ] Badge "BETA" roxo visível

### 🖼️ Screenshot Esperado:
```
┌─────────────────────────┐
│ [Começar Demo ▾]        │ ← Botão
└─────────┬───────────────┘
          │ (SEM GAP!)
          ↓
┌─────────────────────────────────┐
│ BidConnect – Conservador [BETA] │
│ BidConnect – Sugestivo (IA) [BETA] │
│ BidConnect – Dinâmico [BETA]    │
│ Prescrição em 90s               │
│ Alertas Clínicos                │
└─────────────────────────────────┘
```

### ❌ O que NÃO deve acontecer:
- ❌ Menu fecha ao mover mouse do botão para o menu
- ❌ Menu "pisca" (abre/fecha repetidamente)
- ❌ Gap visível entre botão e menu
- ❌ Menu aparece fora da tela

### 🐛 Troubleshooting:
**Problema:** Menu fecha ao mover mouse  
**Causa:** Gap de CSS entre botão e menu  
**Solução:** Verificar `margin-top: 0` no `.dropdown-menu`

---

## Teste 1.3: Navegação pelo Menu

### O que testar:
Clicar em cada opção do menu e verificar redirecionamento.

### Passos para cada link:

#### 1.3a: BidConnect – Conservador
1. Abrir dropdown menu
2. Clicar em "BidConnect – Conservador"
3. Aguardar redirecionamento

**URL esperada:**
```
/bidconnect-standalone.html?model=conservative
```

**Página esperada:** Modelo Conservador (badge azul)

---

#### 1.3b: BidConnect – Sugestivo (IA)
1. Voltar para landing (botão voltar do navegador ou navegar para `/`)
2. Abrir dropdown menu
3. Clicar em "BidConnect – Sugestivo (IA)"

**URL esperada:**
```
/bidconnect-standalone.html?model=suggestive
```

**Página esperada:** Modelo Sugestivo (badge roxo)

---

#### 1.3c: BidConnect – Dinâmico
1. Voltar para landing
2. Abrir dropdown menu
3. Clicar em "BidConnect – Dinâmico"

**URL esperada:**
```
/bidconnect-standalone.html?model=dynamic
```

**Página esperada:** Modelo Dinâmico (badge verde)

---

### ✅ Critérios de Sucesso (Todos os Links):
- [ ] Cada link abre a página correta
- [ ] URL corresponde ao modelo selecionado
- [ ] Página carrega em menos de 2 segundos
- [ ] Badge da cor correta aparece (azul/roxo/verde)
- [ ] Sem erros 404 ou página branca

---

# 2️⃣ MODELO CONSERVADOR (AZUL)

## Teste 2.1: Carregamento Inicial

### O que testar:
Verificar que o modelo Conservador carrega com todos os elementos visuais.

### Passos:
1. Navegar para: `/bidconnect-standalone.html?model=conservative`
2. Aguardar carregamento completo

### ✅ Critérios de Sucesso:

**Cabeçalho:**
- [ ] Título: "BidConnect — **Conservador**"
- [ ] Badge **azul** com texto "Conservador"
- [ ] Descrição: "Paciente propõe, sistema busca e você decide."

**Abas de Navegação:**
- [ ] Três abas visíveis:
  - "Conservador" (selecionada, borda azul)
  - "Sugestivo (IA)" (inativa)
  - "Dinâmico" (inativo)

**Seção "Como funciona":**
- [ ] Card branco com 3 passos:
  1. "Você propõe um valor"
  2. "Buscamos médicos disponíveis neste valor"
  3. "Se não houver, você pode aumentar e tentar novamente"

**Controles de Valor:**
- [ ] Texto: "Quanto deseja pagar?"
- [ ] Valor exibido: **"R$ 180,00"** (em azul, grande)
- [ ] Slider horizontal (min R$ 100, max R$ 300)
- [ ] Marcadores: "Min: R$ 100" e "Máx: R$ 300"
- [ ] Texto: "Recomendado: R$ 180"

**Botões de Preset:**
- [ ] 5 botões visíveis: R$ 140, R$ 160, R$ 180, R$ 200, R$ 220
- [ ] Fundo cinza claro
- [ ] Hover muda a cor

**Botão Principal:**
- [ ] Texto: "Buscar Médicos Disponíveis"
- [ ] Cor: **Azul** (#2563eb)
- [ ] Grande e destacado

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│ BidConnect — [Conservador] (azul)        │
│ Paciente propõe, sistema busca...        │
├──────────────────────────────────────────┤
│ [Conservador] [Sugestivo] [Dinâmico]     │
├──────────────────────────────────────────┤
│ Como funciona:                           │
│ 1. Você propõe um valor                  │
│ 2. Buscamos médicos...                   │
│ 3. Se não houver...                      │
├──────────────────────────────────────────┤
│ Quanto deseja pagar?                     │
│                                          │
│        R$ 180,00 (azul, grande)          │
│    [────────⚪───────] slider            │
│   Min: R$ 100      Máx: R$ 300          │
│                                          │
│ [R$ 140] [R$ 160] [R$ 180] [R$ 200] [R$ 220] │
│                                          │
│     [Buscar Médicos Disponíveis] (azul)  │
└──────────────────────────────────────────┘
```

---

## Teste 2.2: Interação com Slider

### O que testar:
Mover o slider e verificar atualização do valor.

### Passos:
1. Clicar e **arrastar** o slider para a esquerda (valor menor)
2. Observar valor mudando em tempo real
3. Soltar em aproximadamente R$ 150
4. Verificar valor exibido

### ✅ Critérios de Sucesso:
- [ ] Valor atualiza **em tempo real** ao mover slider
- [ ] Formato: "R$ XXX,00" (sempre com 2 casas decimais)
- [ ] Valor mínimo: R$ 100
- [ ] Valor máximo: R$ 300
- [ ] Slider não "trava" ou congela

### Repetir:
1. Mover para a direita (valor maior: ~R$ 250)
2. Verificar atualização
3. Voltar para R$ 180 (meio do slider)

---

## Teste 2.3: Botões de Preset

### O que testar:
Clicar em cada botão de preset e verificar atualização.

### Passos:

**Teste cada botão:**
1. Clicar em "R$ 140"
   - [ ] Valor muda para **R$ 140,00**
   - [ ] Slider move para posição correspondente

2. Clicar em "R$ 160"
   - [ ] Valor muda para **R$ 160,00**
   - [ ] Slider se ajusta

3. Clicar em "R$ 180"
   - [ ] Valor muda para **R$ 180,00**
   - [ ] Slider volta ao centro

4. Clicar em "R$ 200"
   - [ ] Valor muda para **R$ 200,00**
   - [ ] Slider move à direita

5. Clicar em "R$ 220"
   - [ ] Valor muda para **R$ 220,00**
   - [ ] Slider move mais à direita

### ✅ Critérios de Sucesso:
- [ ] Cada preset atualiza o valor corretamente
- [ ] Slider sincroniza com o valor
- [ ] Mudança é instantânea (sem delay)
- [ ] Formato sempre "R$ XXX,00"

---

## Teste 2.4: Busca com Valor Baixo (R$ 140)

### O que testar:
Buscar médicos com valor baixo e verificar que retorna 0 resultados.

### Passos:
1. Garantir que valor está em **R$ 180** (reset se necessário)
2. Clicar preset **"R$ 140"**
3. Verificar valor: **R$ 140,00**
4. Clicar botão **"Buscar Médicos Disponíveis"**
5. Observar loading
6. Aguardar resultado (1 segundo)

### ✅ Critérios de Sucesso:

**Durante Loading:**
- [ ] Botão muda para "Buscando…"
- [ ] Botão fica desabilitado (cinza)
- [ ] Ícone de ampulheta ⏳ aparece

**Resultado (após 1s):**
- [ ] Card de resultado aparece
- [ ] Fundo amarelo claro (aviso)
- [ ] Ícone ⚠️ visível
- [ ] Texto: **"Nenhum médico imediato neste valor"**
- [ ] Subtexto: "Tente aumentar o valor ou agende para mais tarde"
- [ ] Sem lista de médicos
- [ ] Botão volta para "Buscar Médicos Disponíveis"

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│        R$ 140,00                         │
│     [────⚪─────────] slider             │
│                                          │
│ [Buscar Médicos Disponíveis] (desabilitado durante busca) │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ ⚠️  Nenhum médico imediato         │   │ ← Fundo amarelo
│ │    neste valor                     │   │
│ │                                    │   │
│ │ Tente aumentar o valor ou          │   │
│ │ agende para mais tarde             │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Console (F12):
```javascript
[BidConnect] runSearch called - MODEL: conservative, searchValue: 140
[conservative] 🔎 search
  bid: {id: "BID-DEMO-xxx", amount: 140}
  found: {ok: true, immediate_doctors: [], scheduled_doctors: []}
```

---

## Teste 2.5: Busca com Valor Adequado (R$ 180)

### O que testar:
Buscar com valor adequado e verificar lista de médicos.

### Passos:
1. Clicar preset **"R$ 180"**
2. Verificar valor: **R$ 180,00**
3. Clicar **"Buscar Médicos Disponíveis"**
4. Aguardar loading (1 segundo)
5. Observar resultado

### ✅ Critérios de Sucesso:

**Seção "Médicos Imediatos" (Verde):**
- [ ] Título: **"⚡ Médicos Imediatos"** (fundo verde claro)
- [ ] Subtexto: "Disponíveis agora para atendimento"
- [ ] **2 médicos** listados:

**Médico 1 - Dr. Silva:**
- [ ] Nome: "Dr. Silva"
- [ ] Especialidade: "Cardiologia"
- [ ] Nota: ★★★★★ (5 estrelas) 
- [ ] Atendimentos: "234 atendimentos"
- [ ] Badge verde: "Disponível agora"
- [ ] Botão: **"Aceitar por R$ 180,00"** (azul)

**Médico 2 - Dra. Santos:**
- [ ] Nome: "Dra. Santos"
- [ ] Especialidade: "Cardiologia"
- [ ] Nota: ★★★★★ (5 estrelas)
- [ ] Atendimentos: "189 atendimentos"
- [ ] Badge verde: "Disponível agora"
- [ ] Botão: **"Aceitar por R$ 180,00"** (azul)

**Seção "Médicos para Agendar" (Amarelo):**
- [ ] Título: **"📅 Médicos para Agendar"**
- [ ] Subtexto: "Próxima disponibilidade"
- [ ] **2 médicos** listados com horários

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│ ⚡ Médicos Imediatos                     │ ← Fundo verde claro
│ Disponíveis agora para atendimento       │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Dr. Silva                          │   │
│ │ Cardiologia | ★★★★★ | 234 atend.   │   │
│ │ [Disponível agora] (verde)         │   │
│ │                                    │   │
│ │     [Aceitar por R$ 180,00] (azul) │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Dra. Santos                        │   │
│ │ Cardiologia | ★★★★★ | 189 atend.   │   │
│ │ [Disponível agora] (verde)         │   │
│ │                                    │   │
│ │     [Aceitar por R$ 180,00] (azul) │   │
│ └────────────────────────────────────┘   │
├──────────────────────────────────────────┤
│ 📅 Médicos para Agendar                  │ ← Fundo amarelo claro
│ Próxima disponibilidade                  │
│ [... mais 2 médicos ...]                 │
└──────────────────────────────────────────┘
```

---

## Teste 2.6: Aceitar Médico

### O que testar:
Clicar em "Aceitar" e verificar criação da consulta.

### Passos:
1. Na lista de médicos (R$ 180 buscado)
2. Localizar card do **Dr. Silva**
3. Clicar botão **"Aceitar por R$ 180,00"**
4. Observar alert do navegador

### ✅ Critérios de Sucesso:

**Alert (Popup):**
- [ ] Alert aparece
- [ ] Título: "Consulta Aceita!"
- [ ] Mensagem contém: `consultation_id: CONSULT-DEMO-[timestamp]`
- [ ] Mensagem contém: `doctor: Dr. Silva`
- [ ] Mensagem contém: `amount: 180`

**Exemplo:**
```
╔═══════════════════════════════════╗
║  Consulta Aceita!                 ║
║                                   ║
║  consultation_id: CONSULT-DEMO-   ║
║    1730123456789                  ║
║  doctor: Dr. Silva                ║
║  amount: 180                      ║
║  specialization: cardiology       ║
║                                   ║
║            [ OK ]                 ║
╚═══════════════════════════════════╝
```

### Console (F12):
```javascript
[conservative] ✅ Accept
  doctor: "Dr. Silva"
  consultation_id: "CONSULT-DEMO-1730123456789"
```

### ❌ O que NÃO deve acontecer:
- ❌ Erro no console
- ❌ Alert sem consultation_id
- ❌ Página recarrega ou redireciona

---

# 3️⃣ MODELO SUGESTIVO (IA) - ROXO

## Teste 3.1: Carregamento Inicial

### O que testar:
Verificar elementos únicos do modelo Sugestivo.

### Passos:
1. Navegar para: `/bidconnect-standalone.html?model=suggestive`
2. Aguardar carregamento

### ✅ Critérios de Sucesso:

**Cabeçalho:**
- [ ] Badge **roxo** (#7c3aed) com texto "Sugestivo (IA)"
- [ ] Descrição: "IA recomenda valores com maior chance de atendimento imediato."

**Banner Roxo Exclusivo:**
- [ ] Fundo roxo claro
- [ ] Ícone/emoji de lâmpada ou IA
- [ ] Texto: **"A IA sugere o melhor preço para você — experimente 'Buscar com IA' em R$ 160."**
- [ ] Borda roxo escuro

**Botão Principal:**
- [ ] Texto: **"Buscar com IA"** (diferente do Conservador!)
- [ ] Cor: **Roxo** (#7c3aed)

**Demais Elementos:**
- [ ] Slider, presets, valor exibido (igual ao Conservador)
- [ ] Valor inicial: R$ 180

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│ BidConnect — [Sugestivo (IA)] (roxo)     │
│ IA recomenda valores com maior chance... │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ 💡 A IA sugere o melhor preço      │   │ ← Banner roxo
│ │    para você — experimente         │   │
│ │    "Buscar com IA" em R$ 160.      │   │
│ └────────────────────────────────────┘   │
├──────────────────────────────────────────┤
│        R$ 180,00                         │
│     [────────⚪───────]                  │
│                                          │
│ [R$ 140] [R$ 160] [R$ 180] [R$ 200] [R$ 220] │
│                                          │
│        [Buscar com IA] (roxo)            │
└──────────────────────────────────────────┘
```

---

## Teste 3.2: Sugestão da IA (Valor Baixo)

### O que testar:
**Comportamento único:** Com valor < R$ 180, a IA mostra sugestão em vez de buscar.

### Passos:
1. Garantir modelo Sugestivo (IA) aberto
2. Clicar preset **"R$ 160"**
3. Verificar valor: **R$ 160,00**
4. Clicar **"Buscar com IA"** (botão roxo)
5. Aguardar 1 segundo
6. Observar **Card de Sugestão** aparecer

### ✅ Critérios de Sucesso:

**Card de Sugestão (Novo Elemento!):**
- [ ] Aparece abaixo do botão
- [ ] Borda tracejada **roxo** (#7c3aed)
- [ ] Fundo branco
- [ ] Ícone: 💡 (lâmpada)
- [ ] Título: **"💡 Sugestão Inteligente"** (roxo, negrito)

**Conteúdo do Card:**
- [ ] Texto principal:
  ```
  Com R$ 195 você tem 85% de chance de atendimento imediato
  (≈ 2 médicos agora)
  ```
- [ ] Valores em **negrito**: R$ 195, 85%, 2 médicos

**Botões do Card:**
- [ ] Botão 1: **"Aceitar Sugestão"** (roxo, destaque)
- [ ] Botão 2: **"Manter R$ 160"** (cinza, secondary)
- [ ] Alinhados horizontalmente

**Estado Geral:**
- [ ] Valor ainda mostra R$ 160
- [ ] Sem lista de médicos
- [ ] Botão principal volta para "Buscar com IA"

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│        R$ 160,00                         │
│     [──⚪──────────]                     │
│                                          │
│        [Buscar com IA] (roxo)            │
│                                          │
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │ ← Borda tracejada roxo
│   💡 Sugestão Inteligente (roxo)        │
│                                          │
│   Com R$ 195 você tem 85% de chance     │
│   de atendimento imediato               │
│   (≈ 2 médicos agora)                   │
│                                          │
│   [Aceitar Sugestão] [Manter R$ 160]    │
│ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
└──────────────────────────────────────────┘
```

### Console (F12):
```javascript
[BidConnect] runSearch called - MODEL: suggestive, searchValue: 160
[BidConnect] Mostrando sugestão IA (valor < 180)
[BidConnect] AISuggestionCard render - aiTip: {price: 195, chance: 85, immediates: 2}
```

---

## Teste 3.3: Aceitar Sugestão da IA

### O que testar:
Clicar em "Aceitar Sugestão" e verificar mudança automática.

### Passos:
1. Com card de sugestão visível (teste anterior)
2. Clicar botão **"Aceitar Sugestão"** (roxo)
3. Observar mudanças

### ✅ Critérios de Sucesso:

**Imediatamente após clicar:**
- [ ] Card de sugestão **desaparece**
- [ ] Valor muda para **R$ 195,00**
- [ ] Slider se ajusta para R$ 195
- [ ] Botão muda para "Buscando…" (loading)

**Após 1 segundo (busca automática):**
- [ ] Lista de médicos aparece
- [ ] **2 médicos imediatos** visíveis
- [ ] Botões de aceitar em **ROXO** (#7c3aed) ← diferente do Conservador!
- [ ] Texto dos botões: **"Aceitar por R$ 195,00"**

**Médicos Esperados:**
- [ ] Dr. Silva (Cardiologia)
- [ ] Dra. Santos (Cardiologia)
- [ ] Badges verdes "Disponível agora"
- [ ] Botões **ROXOS** (não azuis!)

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│        R$ 195,00 (atualizado!)           │
│                                          │
│ ⚡ Médicos Imediatos                     │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Dr. Silva                          │   │
│ │ Cardiologia | ★★★★★               │   │
│ │                                    │   │
│ │   [Aceitar por R$ 195,00] (ROXO!)  │   │ ← Botão roxo!
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Dra. Santos                        │   │
│ │ Cardiologia | ★★★★★               │   │
│ │                                    │   │
│ │   [Aceitar por R$ 195,00] (ROXO!)  │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Console (F12):
```javascript
[BidConnect] Aceitar sugestão: mudando valor para 195
[BidConnect] runSearch called - MODEL: suggestive, searchValue: 195
[BidConnect] Fazendo busca normal (valor >= 180)
[suggestive] 🔎 search
  found: {immediate_doctors: [...], ...}
```

---

## Teste 3.4: Recusar Sugestão (Manter Valor)

### O que testar:
Clicar em "Manter" e verificar que card some sem mudar valor.

### Passos:
1. Voltar para R$ 160 (recarregar página ou ajustar manualmente)
2. Clicar "Buscar com IA"
3. Card de sugestão aparece
4. Clicar **"Manter R$ 160"** (botão cinza)

### ✅ Critérios de Sucesso:
- [ ] Card de sugestão **desaparece**
- [ ] Valor **permanece** em R$ 160
- [ ] Nenhuma busca é realizada
- [ ] Botão volta para "Buscar com IA"
- [ ] Slider não se move

### ❌ O que NÃO deve acontecer:
- ❌ Valor muda para R$ 195
- ❌ Busca automática acontece
- ❌ Card não fecha

---

## Teste 3.5: Busca Direta com Valor Alto (≥ R$ 180)

### O que testar:
Com valor ≥ R$ 180, deve fazer busca normal (sem sugestão).

### Passos:
1. Ajustar valor para **R$ 180** ou mais
2. Clicar **"Buscar com IA"**
3. Observar comportamento

### ✅ Critérios de Sucesso:
- [ ] **NÃO** mostra card de sugestão
- [ ] Faz busca diretamente
- [ ] Lista de médicos aparece (igual ao Conservador)
- [ ] Botões em **ROXO** (diferente do Conservador)

**Diferença visual única:**
- Conservador: Botões azuis
- Sugestivo: Botões roxos ← Única diferença quando valor ≥ 180

---

# 4️⃣ MODELO DINÂMICO (VERDE)

## Teste 4.1: Carregamento Inicial

### O que testar:
Verificar grid de faixas de preço exclusivo do modelo Dinâmico.

### Passos:
1. Navegar para: `/bidconnect-standalone.html?model=dynamic`
2. Aguardar carregamento

### ✅ Critérios de Sucesso:

**Cabeçalho:**
- [ ] Badge **verde** (#16a34a) com texto "Dinâmico"
- [ ] Descrição: "Transparência de oferta e tempo por faixas de preço"

**Grid de Faixas (Elemento EXCLUSIVO!):**
- [ ] Título da seção: **"Faixas de Preço Disponíveis"**
- [ ] **4 cards** em grid (2x2 ou 1x4 dependendo da largura)
- [ ] Cada card com:
  - Nome da faixa
  - Faixa de valores
  - Quantidade de médicos (⚡ e 📅)
  - Tempo estimado (⏱)

**Faixa 1 - Econômico:**
- [ ] Nome: **"Econômico"**
- [ ] Valores: **"R$ 140-159"**
- [ ] Médicos: **"0 ⚡ • 2 📅"** (0 imediatos, 2 agendados)
- [ ] Tempo: **"⏱ 2-4h"**
- [ ] Cor: Cinza (inativa)
- [ ] Sem borda destacada

**Faixa 2 - Padrão:**
- [ ] Nome: **"Padrão"**
- [ ] Valores: **"R$ 160-179"**
- [ ] Médicos: **"1 ⚡ • 5 📅"**
- [ ] Tempo: **"⏱ 30-60min"**
- [ ] Cor: Cinza (inativa)

**Faixa 3 - Rápido:**
- [ ] Nome: **"Rápido"**
- [ ] Valores: **"R$ 180-199"** ← Valor atual (180) está nesta faixa
- [ ] Médicos: **"3 ⚡ • 8 📅"**
- [ ] Tempo: **"⏱ 5-15min"**
- [ ] **Borda verde** destacada (#16a34a)
- [ ] Botão: **"Atender Agora"** (verde) aparece

**Faixa 4 - Premium:**
- [ ] Nome: **"Premium"**
- [ ] Valores: **"R$ 200-250"**
- [ ] Médicos: **"7 ⚡ • 12 📅"**
- [ ] Tempo: **"⏱ Imediato"**
- [ ] Cor: Cinza (inativa)

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│ BidConnect — [Dinâmico] (verde)          │
│ Transparência de oferta e tempo...       │
├──────────────────────────────────────────┤
│ Faixas de Preço Disponíveis              │
├──────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│ │Econômico│  │ Padrão  │  │ Rápido  │  │Premium  │ │
│ │R$140-159│  │R$160-179│  │R$180-199│  │R$200-250│ │
│ │0⚡•2📅  │  │1⚡•5📅  │  │3⚡•8📅  │  │7⚡•12📅 │ │
│ │⏱ 2-4h  │  │⏱30-60min│  │⏱5-15min │  │⏱Imediato│ │
│ │         │  │         │  │[Atender]│  │         │ │
│ └─────────┘  └─────────┘  └─────────┘  └─────────┘ │
│                              ↑ Borda verde           │
├──────────────────────────────────────────┤
│        R$ 180,00                         │
│     [────────⚪───────]                  │
└──────────────────────────────────────────┘
```

---

## Teste 4.2: Mudança de Faixa com Slider

### O que testar:
Mover slider e verificar que faixa ativa muda.

### Passos:

**Teste 1 - Faixa Econômico:**
1. Mover slider para **R$ 150** (esquerda)
2. Observar mudanças

**Esperado:**
- [ ] Valor: R$ 150,00
- [ ] Faixa **Econômico** (R$ 140-159) tem **borda verde**
- [ ] Outras faixas sem borda
- [ ] **Sem** botão "Atender Agora" (0 imediatos)

---

**Teste 2 - Faixa Padrão:**
1. Mover slider para **R$ 170**

**Esperado:**
- [ ] Valor: R$ 170,00
- [ ] Faixa **Padrão** (R$ 160-179) tem **borda verde**
- [ ] Botão **"Atender Agora"** aparece (1 imediato)

---

**Teste 3 - Faixa Rápido:**
1. Mover slider para **R$ 190**

**Esperado:**
- [ ] Valor: R$ 190,00
- [ ] Faixa **Rápido** (R$ 180-199) tem **borda verde**
- [ ] Botão **"Atender Agora"** aparece (3 imediatos)

---

**Teste 4 - Faixa Premium:**
1. Mover slider para **R$ 220**

**Esperado:**
- [ ] Valor: R$ 220,00
- [ ] Faixa **Premium** (R$ 200-250) tem **borda verde**
- [ ] Botão **"Atender Agora"** aparece (7 imediatos)

### ✅ Critérios de Sucesso:
- [ ] Borda verde **sempre** na faixa correspondente ao valor
- [ ] Apenas **uma** faixa com borda por vez
- [ ] Botão "Atender Agora" aparece **só** em faixas com imediatos > 0
- [ ] Mudança é **instantânea** (tempo real)

---

## Teste 4.3: Busca via Faixa Rápido

### O que testar:
Clicar "Atender Agora" na faixa Rápido e verificar médicos.

### Passos:
1. Ajustar slider para **R$ 190** (faixa Rápido)
2. Verificar faixa Rápido com borda verde
3. Clicar botão **"Atender Agora"** (verde) no card da faixa
4. Aguardar loading (1 segundo)

### ✅ Critérios de Sucesso:

**Resultado:**
- [ ] Lista de médicos aparece
- [ ] **3 médicos imediatos** (conforme indicado na faixa)
- [ ] **8 médicos agendados** (conforme indicado)
- [ ] Botões em **VERDE** (#16a34a)
- [ ] Texto: **"Aceitar por R$ 190,00"**

**Médicos Imediatos Esperados:**
1. Dr. Silva (Cardiologia)
2. Dra. Santos (Cardiologia)
3. Dr. Oliveira (Cardiologia)

**Estilo:**
- [ ] Cards com borda sutil
- [ ] Badges "Disponível agora" em verde
- [ ] Botões de aceitar em **VERDE** (não azul nem roxo!)

### 🖼️ Screenshot Esperado:
```
┌──────────────────────────────────────────┐
│ ⚡ Médicos Imediatos (3)                 │
├──────────────────────────────────────────┤
│ ┌────────────────────────────────────┐   │
│ │ Dr. Silva                          │   │
│ │ [Aceitar por R$ 190,00] (VERDE!)   │   │ ← Botão verde!
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Dra. Santos                        │   │
│ │ [Aceitar por R$ 190,00] (VERDE!)   │   │
│ └────────────────────────────────────┘   │
│                                          │
│ ┌────────────────────────────────────┐   │
│ │ Dr. Oliveira (NOVO!)               │   │
│ │ [Aceitar por R$ 190,00] (VERDE!)   │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Nota:** Quantidade de médicos muda conforme a faixa!

---

## Teste 4.4: Comparação de Faixas

### O que testar:
Verificar visualmente que cada faixa mostra quantidades diferentes.

### Passos:
1. Olhar para o grid de faixas (sem buscar)
2. Comparar números entre as faixas

### ✅ Critérios de Sucesso:

**Progressão esperada (quanto maior o valor, mais médicos):**
- [ ] Econômico (R$ 140-159): **0 ⚡ • 2 📅** ← Menos médicos
- [ ] Padrão (R$ 160-179): **1 ⚡ • 5 📅**
- [ ] Rápido (R$ 180-199): **3 ⚡ • 8 📅**
- [ ] Premium (R$ 200-250): **7 ⚡ • 12 📅** ← Mais médicos

**Tempo de espera (quanto maior o valor, mais rápido):**
- [ ] Econômico: **2-4h**
- [ ] Padrão: **30-60min**
- [ ] Rápido: **5-15min**
- [ ] Premium: **Imediato**

**Lógica:** Paciente vê **transparência total** antes de buscar!

---

# 5️⃣ CASOS DE ERRO E VALIDAÇÕES

## Teste 5.1: Limites do Slider

### O que testar:
Verificar que slider respeita min/max.

### Passos:
1. Em qualquer modelo
2. Tentar arrastar slider **totalmente** para esquerda
3. Verificar valor mínimo
4. Tentar arrastar **totalmente** para direita
5. Verificar valor máximo

### ✅ Critérios de Sucesso:
- [ ] Valor mínimo: **R$ 100,00** (não vai abaixo)
- [ ] Valor máximo: **R$ 300,00** (não vai acima)
- [ ] Slider não "quebra" ou trava nos limites

---

## Teste 5.2: Navegação Entre Abas

### O que testar:
Trocar entre modelos usando as abas.

### Passos:
1. Abrir modelo Conservador
2. Ajustar valor para R$ 200
3. Clicar aba **"Sugestivo (IA)"**
4. Verificar mudanças
5. Clicar aba **"Dinâmico"**
6. Clicar aba **"Conservador"** (voltar)

### ✅ Critérios de Sucesso:

**Ao trocar de aba:**
- [ ] Página **não recarrega** (transição suave)
- [ ] Badge muda de cor
- [ ] Descrição muda
- [ ] Elementos únicos aparecem/desaparecem:
  - Conservador: botão azul
  - Sugestivo: banner roxo + botão roxo
  - Dinâmico: grid de faixas + botão verde
- [ ] Valor **permanece** o mesmo (R$ 200 se ajustado)
- [ ] Resultado anterior **desaparece** (limpa busca)

---

## Teste 5.3: Múltiplas Buscas Consecutivas

### O que testar:
Fazer várias buscas seguidas sem problemas.

### Passos:
1. Modelo Conservador
2. Buscar com R$ 140 → 0 médicos
3. **Imediatamente** buscar com R$ 180 → 2 médicos
4. **Imediatamente** buscar com R$ 200 → médicos
5. Repetir 3x

### ✅ Critérios de Sucesso:
- [ ] Todas as buscas completam
- [ ] Sem delay ou "travamento"
- [ ] Sem erros no console
- [ ] Resultados corretos em cada busca

---

## Teste 5.4: Aceitar Múltiplos Médicos

### O que testar:
Clicar em vários médicos diferentes.

### Passos:
1. Buscar com R$ 180 (2 médicos)
2. Aceitar **Dr. Silva**
3. Fechar alert
4. Aceitar **Dra. Santos**
5. Fechar alert

### ✅ Critérios de Sucesso:
- [ ] Cada clique gera um alert diferente
- [ ] `consultation_id` é **diferente** em cada accept
- [ ] Timestamp no ID muda
- [ ] Nome do médico correto em cada alert

---

# 6️⃣ TESTES DE RESPONSIVIDADE

## Teste 6.1: Mobile (Tela Pequena)

### O que testar:
Layout em tela pequena (smartphone).

### Passos:
1. Abrir DevTools (F12)
2. Clicar no ícone de dispositivo móvel (Ctrl+Shift+M)
3. Selecionar "iPhone 12" ou similar
4. Recarregar página

### ✅ Critérios de Sucesso:
- [ ] Slider funciona com toque
- [ ] Botões grandes e clicáveis
- [ ] Grid de faixas vira coluna (1 faixa por linha)
- [ ] Texto legível sem zoom
- [ ] Dropdown menu funciona

---

## Teste 6.2: Tablet (Tela Média)

### O que testar:
Layout em tablet.

### Passos:
1. DevTools → Selecionar "iPad"
2. Recarregar página

### ✅ Critérios de Sucesso:
- [ ] Grid de faixas: 2x2
- [ ] Cards de médicos: 2 por linha
- [ ] Tudo acessível e legível

---

# 📊 CHECKLIST FINAL DE TESTES

## Conservador (Azul):
- [ ] 1.1 Carrega corretamente
- [ ] 2.2 Slider funciona
- [ ] 2.3 Presets funcionam
- [ ] 2.4 R$ 140 → 0 médicos
- [ ] 2.5 R$ 180 → 2 médicos
- [ ] 2.6 Aceitar médico → alert correto
- [ ] Botões **AZUIS**

## Sugestivo (IA) - Roxo:
- [ ] 3.1 Banner roxo visível
- [ ] 3.2 R$ 160 → card de sugestão
- [ ] 3.3 Aceitar sugestão → R$ 195
- [ ] 3.4 Manter valor funciona
- [ ] 3.5 R$ 180+ → busca direta
- [ ] Botões **ROXOS**

## Dinâmico (Verde):
- [ ] 4.1 Grid de 4 faixas visível
- [ ] 4.2 Slider muda faixa ativa
- [ ] 4.3 "Atender Agora" funciona
- [ ] 4.4 Quantidades progressivas corretas
- [ ] Botões **VERDES**

## Validações:
- [ ] 5.1 Limites do slider (100-300)
- [ ] 5.2 Abas trocam corretamente
- [ ] 5.3 Múltiplas buscas funcionam
- [ ] 5.4 Múltiplos accepts funcionam

## Responsividade:
- [ ] 6.1 Mobile funciona
- [ ] 6.2 Tablet funciona

## Console:
- [ ] Logs esperados aparecem
- [ ] **Sem erros** críticos
- [ ] Sem warnings de React

---

# 🐛 BUGS CONHECIDOS (Já Corrigidos)

### ~~Bug #1: Dropdown fecha ao mover mouse~~
**Status:** ✅ CORRIGIDO  
**Solução:** Removido `margin-top` do menu

### ~~Bug #2: Card de sugestão não aparece~~
**Status:** ✅ CORRIGIDO  
**Solução:** `setAiTip(null)` movido para depois do `if`

### ~~Bug #3: Evento passado como argumento~~
**Status:** ✅ CORRIGIDO  
**Solução:** `onClick={() => runSearch()}` em vez de `onClick={runSearch}`

---

# 📞 Reporte de Bugs

Se encontrar algum bug durante os testes:

1. **Anotar:**
   - Modelo (Conservador/Sugestivo/Dinâmico)
   - Passo exato onde ocorreu
   - Valor no slider
   - Screenshot se possível

2. **Console:**
   - Abrir F12
   - Copiar erros vermelhos
   - Anotar logs relevantes

3. **Informar:**
   - Navegador e versão
   - Tamanho da tela (desktop/mobile/tablet)
   - Se consegue reproduzir consistentemente

---

**Fim do Guia de Testes**

✅ Total de testes: **25+**  
⏱️ Tempo estimado: **30-40 minutos**  
🎯 Cobertura: **100% dos fluxos principais**

**Boa sorte nos testes!** 🚀
