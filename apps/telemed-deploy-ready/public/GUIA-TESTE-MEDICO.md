# 🧪 Guia de Teste Completo — Jornada do Médico

**Última atualização:** 10 de Novembro de 2025  
**Versão:** 2.0 — Com Jitsi Real Integrado

---

## 📋 **Índice**

1. [Visão Geral da Jornada](#visão-geral)
2. [Página 1: Login](#página-1-login)
3. [Página 2: Dashboard Principal](#página-2-dashboard)
4. [Página 3: Consulta com Jitsi](#página-3-consulta)
5. [Páginas Complementares](#páginas-complementares)
6. [Onde Deixar Feedback](#feedback)
7. [Checklist de Testes](#checklist)

---

## 🗺️ **Visão Geral da Jornada** {#visão-geral}

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUXO COMPLETO DO MÉDICO                      │
└─────────────────────────────────────────────────────────────────┘

1️⃣  LOGIN                    (/auth/login.html)
    ↓
    📝 Credenciais mockadas: dr@teste.com / 123456
    ↓
2️⃣  DASHBOARD PRINCIPAL      (/dashboard/)
    ↓
    ⚡ Widget "Atendimentos Pendentes" aparece
    ↓
3️⃣  ACEITAR BID              (Clique no widget)
    ↓
    🎥 Redirect automático em 300ms
    ↓
4️⃣  CONSULTA COM JITSI       (/consulta/)
    ↓
    🎬 Sala de vídeo conferência real
    ↓
5️⃣  ATENDIMENTO              (Tabs: Chat, Atendimento, Exames, Receitas)
    ↓
    📋 Finalizar e voltar ao Dashboard
```

**⏱️ Tempo estimado:** 8-12 minutos por teste completo

---

## 📄 **PÁGINA 1: Login** {#página-1-login}

### 🔗 **URL:** `/auth/login.html`

### 🎯 **Objetivo desta página:**
Autenticar o médico e redirecionar para o dashboard principal.

---

### 👀 **O QUE OBSERVAR:**

#### **Elementos Visuais:**
- [ ] Formulário centralizado com fundo gradiente
- [ ] 3 campos visíveis:
  - [ ] **Dropdown "Entrar como"** → Médico/Paciente
  - [ ] **Campo "ID"** → Aceita e-mail, CPF ou CRM
  - [ ] **Campo "Senha"** → Tipo password (****)
- [ ] Botão azul "Entrar"
- [ ] Aviso: "Ambiente de testes — não use dados reais"

#### **Comportamento:**
- [ ] Query param `?role=medico` pré-seleciona "Médico" no dropdown
- [ ] Campos obrigatórios (mostra erro se vazio)
- [ ] Feedback de erro aparece abaixo do botão em vermelho

---

### 🧠 **O QUE ENTENDER DO PROCESSO:**

1. **Autenticação Mock Local:**
   - Backend tentado primeiro via `/api/auth/login`
   - Se falhar (offline), usa mock local em `js/auth.js`
   - Token JWT salvo em `localStorage` após sucesso

2. **Credenciais de Teste:**
   ```
   📧 E-mail: dr@teste.com
   🔑 Senha: 123456
   👤 Papel: Médico
   ```

3. **Redirect Automático:**
   - ✅ Se papel = **"medico"** → `/dashboard/`
   - ❌ Se papel = **"paciente"** → `/app/paciente.html`

---

### ➡️ **PARA ONDE SEGUIR:**

Após clicar em "Entrar" com sucesso:
- **Destino:** `/dashboard/` (Dashboard principal com sidebar)
- **Tempo de transição:** < 500ms
- **Indicador:** URL muda, página carrega com animação

---

### 📝 **OBSERVAÇÕES ESPERADAS:**

**✅ Funcionando corretamente:**
- Login aceita as credenciais mockadas
- Redirect vai para `/dashboard/` sem erros
- Nenhum erro no console do navegador (F12)

**❌ Bugs possíveis:**
- Erro "Failed to fetch" (backend offline — OK, usa mock)
- Redirect para página errada
- Console mostra erros JavaScript

---

### 💬 **ONDE DEIXAR IMPRESSÕES:**

Documente nesta seção:

**🔹 Usabilidade (1-5):** ⭐⭐⭐⭐⭐  
**🔹 Clareza das mensagens:** ⭐⭐⭐⭐⭐  
**🔹 Velocidade do login:** ⭐⭐⭐⭐⭐  

**Comentários:**
```
[Escreva aqui suas impressões sobre o login]
Exemplo: "Campo de ID aceita múltiplos formatos, mas poderia ter placeholder mais claro"
```

**Bugs encontrados:**
```
[Liste bugs, prints ou comportamentos estranhos]
Exemplo: "Ao clicar Enter, não submete o formulário"
```

---

---

## 📄 **PÁGINA 2: Dashboard Principal** {#página-2-dashboard}

### 🔗 **URL:** `/dashboard/`

### 🎯 **Objetivo desta página:**
Mostrar visão consolidada do médico com métricas, pacientes e o **Widget de Atendimentos Pendentes**.

---

### 👀 **O QUE OBSERVAR:**

#### **Layout Geral:**
- [ ] **Sidebar lateral esquerda** (fixa, menu de navegação)
- [ ] **Header superior** com nome do médico e notificações
- [ ] **Tema claro** (fundo branco/cinza claro)
- [ ] **4 Cards de métricas** no topo:
  - [ ] Pacientes Atendidos (847)
  - [ ] Consultas Hoje (12)
  - [ ] Satisfação (4.7⭐)
  - [ ] Avaliação (4.5⭐)

#### **Widget de Atendimentos Pendentes:** ⭐ **FOCO DO TESTE**
- [ ] Seção destacada abaixo dos cards
- [ ] Título: "⚡ Atendimentos Pendentes"
- [ ] Link "Ver todos os pacientes →" no header
- [ ] **Grid de BIDs** (2 cards mockados):

**Card 1 — NOVA OFERTA:**
```
┌────────────────────────────────────────┐
│  [NOVA OFERTA]         ← Badge verde   │
│  📋 Karina Pinheiro · 31 anos          │
│  Especialidade: Pediatria              │
│  Valor: R$ 150,00                      │
│  Queixa: Dor de cabeça persistente     │
│  [✅ Aceitar Consulta] [Ver mais]      │
└────────────────────────────────────────┘
```

**Card 2 — AGENDADO:**
```
┌────────────────────────────────────────┐
│  [AGENDADO 17:00]      ← Badge azul    │
│  📋 Solange Vicentini · 55 anos        │
│  Horário: Hoje às 17:00                │
│  Motivo: Consulta de rotina            │
│  [🎥 Entrar em Consulta] [📋 Ver PHR]  │
└────────────────────────────────────────┘
```

#### **Comportamento Interativo:**
- [ ] Hover nos cards → Elevação e sombra azul
- [ ] Badge "NOVA OFERTA" → Animação de pulso (opacidade)
- [ ] Botões com ícones e cores diferenciadas
- [ ] Footer do widget com link "🧪 Criar paciente demo"

---

### 🧠 **O QUE ENTENDER DO PROCESSO:**

1. **Widget Auto-Refresh:**
   - JavaScript atualiza lista a cada **30 segundos**
   - Dados vêm do array `bidsDisponiveis` (mock local)
   - Renderização dinâmica via função `renderizarBids()`

2. **Estados Visuais:**
   - **Empty State:** Mensagem "Nenhum atendimento pendente no momento"
   - **Loaded State:** Grid com 2 BIDs mockados
   - **Hover State:** Card se eleva e ganha borda azul

3. **Ações Disponíveis:**
   
   **Para BID NOVO (Karina):**
   - `✅ Aceitar Consulta` → `aceitarBid('bid-001')`
   - `Ver mais` → `verDetalhes('bid-001')`
   
   **Para BID AGENDADO (Solange):**
   - `🎥 Entrar em Consulta` → `iniciarConsulta('bid-002')`
   - `📋 Ver PHR` → `verProntuario('bid-002')`

4. **Data Attributes:**
   - Todos os botões têm `data-testid` para testes E2E
   - Exemplo: `data-testid="button-aceitar-bid-001"`

---

### ➡️ **PARA ONDE SEGUIR:**

#### **Fluxo Principal — Aceitar BID:**

**Ação:** Clicar em **"✅ Aceitar Consulta"** no card de Karina

**O que acontece:**
1. Console log: `✅ Aceitando BID: bid-001`
2. sessionStorage salva:
   ```javascript
   bidAceito: "bid-001"
   consultaIniciada: "2025-11-10T12:47:00.000Z"
   ```
3. **Animação visual:**
   - Card diminui (scale 0.95)
   - Opacidade reduz para 0.7
4. **Delay de 300ms**
5. **Redirect:**
   - Destino: `/consulta/?bid=bid-001&source=dashboard`
   - Tipo: Consulta com **Jitsi real**

---

### 📝 **OBSERVAÇÕES ESPERADAS:**

**✅ Funcionando corretamente:**
- Widget renderiza com 2 BIDs mockados
- Badge "NOVA OFERTA" tem animação de pulso
- Hover nos cards funciona (elevação e sombra)
- Botão "Aceitar" redireciona para `/consulta/` com parâmetros
- Console não mostra erros

**🔍 Detalhes técnicos esperados:**
```javascript
// Console logs esperados:
📋 Audit Logger inicializado globalmente
✅ BidConnect desbloqueado (10 elementos)
✅ Navegação BidConnect forçada
```

**❌ Bugs possíveis:**
- Widget não aparece (JS não carregou)
- Cards sem dados (array vazio)
- Botões não redirecionam
- Console mostra `ReferenceError: aceitarBid is not defined`

---

### 💬 **ONDE DEIXAR IMPRESSÕES:**

**🔹 Design do Widget (1-5):** ⭐⭐⭐⭐⭐  
**🔹 Clareza das informações:** ⭐⭐⭐⭐⭐  
**🔹 Facilidade para aceitar BID:** ⭐⭐⭐⭐⭐  
**🔹 Performance (carregamento):** ⭐⭐⭐⭐⭐  

**Comentários:**
```
[Suas impressões sobre o dashboard e widget]

Exemplo positivo:
"Widget destaca bem os BIDs urgentes, badges coloridos ajudam a priorizar"

Exemplo negativo:
"Botões muito pequenos em mobile, dificulta clique"
```

**Sugestões de melhoria:**
```
[O que você mudaria ou adicionaria]

Exemplo:
- Adicionar filtro por especialidade
- Mostrar tempo de espera do paciente
- Badge de prioridade (urgente/normal)
```

---

---

## 📄 **PÁGINA 3: Consulta com Jitsi** {#página-3-consulta}

### 🔗 **URL:** `/consulta/?bid=bid-001&source=dashboard`

### 🎯 **Objetivo desta página:**
Realizar atendimento de telemedicina com vídeo conferência real via Jitsi Meet.

---

### 👀 **O QUE OBSERVAR:**

#### **Layout da Página:**
- [ ] **Header superior:**
  - [ ] Nome do paciente (Karina Pinheiro, 31 anos)
  - [ ] CRM do médico
  - [ ] Botões: "Abrir MedicalDesk", "Abrir ReceitaCerta", "Voltar", "Formulário", "Fase Jr", "Avaliação", "Sair"
- [ ] **Barra de Tabs horizontal:**
  - [ ] 💬 Chat
  - [ ] 🩺 Atendimento
  - [ ] 🔬 Exames
  - [ ] 💊 Receitas
- [ ] **Área principal:** Split em 2 colunas

#### **Coluna Esquerda — Jitsi Meet:** 🎥
```
┌───────────────────────────────────┐
│                                   │
│   🎬 Jitsi Meet Interface         │
│                                   │
│   "Pedir para participar          │
│    na reunião..."                 │
│                                   │
│   [Recusar reunião] (botão X)     │
│                                   │
│   Controles de vídeo:             │
│   🎤 Mic  📷 Câmera  ☎️ Desligar  │
│                                   │
└───────────────────────────────────┘
```

**Características do Jitsi:**
- [ ] Sala nomeada: `telemed-demo` ou `bid-bid-001`
- [ ] Interface em inglês (Jitsi padrão)
- [ ] Botão vermelho "Desligar" (hang up)
- [ ] Ícone de configurações (⚙️)
- [ ] Estado inicial: "Aguardando moderador" ou "Sala vazia"

#### **Coluna Direita — Tabs de Atendimento:**

**Tab "Chat" (ativa por padrão):**
- [ ] Campo "Digite uma mensagem..."
- [ ] Botão "💾 Salvar" no canto superior direito
- [ ] Placeholder: "Mensagens do chat aparecerão aqui"

**Tab "Atendimento":**
- [ ] Formulário completo de anamnese:
  - [ ] Queixa principal
  - [ ] História da doença atual
  - [ ] Hipótese diagnóstica
  - [ ] Conduta terapêutica
  - [ ] Sinais de alerta
  - [ ] Complexidade (Mental/Clínica/Inconsistência)
- [ ] Botões: "Conduta" | "Exames"

**Tab "Exames":**
- [ ] Lista de exames solicitados
- [ ] Botão para adicionar novo exame

**Tab "Receitas":**
- [ ] Lista de prescrições
- [ ] Botão "Nova Receita"

---

### 🧠 **O QUE ENTENDER DO PROCESSO:**

1. **Carregamento do Jitsi:**
   - Script externo: `https://meet.jit.si/external_api.js`
   - API inicializa em `<div id="jitsi">`
   - Domínio: `meet.jit.si` (servidor público)
   - Configurações:
     ```javascript
     {
       roomName: 'telemed-demo',
       parentNode: document.querySelector('#jitsi'),
       width: '100%',
       height: '100%'
     }
     ```

2. **URL Parameters:**
   - `bid` → ID do BID aceito (ex: `bid-001`)
   - `source` → Origem do redirect (`dashboard`)
   - `appointmentId` → ID da consulta (opcional)
   - `room` → Nome customizado da sala (opcional)

3. **SessionStorage:**
   ```javascript
   bidAceito: "bid-001"
   consultaIniciada: "2025-11-10T12:47:00.000Z"
   ```

4. **Navegação entre Tabs:**
   - Clique nos botões muda conteúdo da coluna direita
   - Tab ativa destacada (fundo azul)
   - Conteúdo renderizado via JavaScript

5. **Integração MedicalDesk:**
   - Botão "Abrir MedicalDesk" → Proxy reverso `/medicaldesk/`
   - JWT token gerado com:
     ```javascript
     { sub: doctorId, patientId, role: 'doctor' }
     ```
   - Redirect 302 para plataforma externa

---

### ➡️ **PARA ONDE SEGUIR:**

#### **Opções de Navegação:**

1. **Durante a Consulta:**
   - Alternar entre tabs (Chat → Atendimento → Exames → Receitas)
   - Preencher formulário de anamnese
   - Solicitar exames
   - Prescrever medicamentos

2. **Após Finalizar:**
   - **Botão "Voltar"** → Retorna para `/dashboard/`
   - **Botão "Sair"** → Encerra consulta e volta ao dashboard
   - **Link do header** → Navegação manual

3. **Integrações Externas:**
   - **"Abrir MedicalDesk"** → `/medicaldesk/` (gestão clínica)
   - **"Abrir ReceitaCerta"** → `/receita-certa/` (prescrição digital)

---

### 📝 **OBSERVAÇÕES ESPERADAS:**

**✅ Funcionando corretamente:**

**Jitsi:**
- [ ] Script carrega sem erros (network tab do DevTools)
- [ ] Interface do Jitsi aparece na coluna esquerda
- [ ] Mensagem "Pedir para participar..." ou "You are the only one..."
- [ ] Controles de mic/câmera funcionam (permissões do navegador)
- [ ] Sala criada com nome correto (`telemed-demo`)

**Tabs:**
- [ ] 4 tabs visíveis e clicáveis
- [ ] Conteúdo muda ao clicar em cada tab
- [ ] Tab "Chat" ativa por padrão
- [ ] Formulário de "Atendimento" completo e editável

**Navegação:**
- [ ] Botão "Voltar" redireciona para `/dashboard/`
- [ ] URL contém parâmetros corretos (`?bid=bid-001&source=dashboard`)

**Console (F12):**
```javascript
// Logs esperados:
✅ Jitsi API loaded
✅ Room created: telemed-demo
🎥 Iniciando consulta: bid-001
```

---

**❌ Bugs possíveis:**

**Jitsi não carrega:**
- [ ] Erro 404 no script `external_api.js`
- [ ] Bloqueio de CORS (mixed content HTTP/HTTPS)
- [ ] Div `#jitsi` não encontrada no DOM
- [ ] Console: `ReferenceError: JitsiMeetExternalAPI is not defined`

**Tabs não funcionam:**
- [ ] Clique não muda conteúdo
- [ ] JavaScript não carregou
- [ ] Console: `TypeError: Cannot read property 'addEventListener' of null`

**Navegação quebrada:**
- [ ] Botão "Voltar" não redireciona
- [ ] URL sem parâmetros (`/consulta/` vazio)
- [ ] 404 ao tentar voltar para dashboard

---

### 💬 **ONDE DEIXAR IMPRESSÕES:**

**🔹 Integração Jitsi (1-5):** ⭐⭐⭐⭐⭐  
**🔹 Qualidade de vídeo/áudio:** ⭐⭐⭐⭐⭐  
**🔹 Usabilidade das Tabs:** ⭐⭐⭐⭐⭐  
**🔹 Formulário de Atendimento:** ⭐⭐⭐⭐⭐  
**🔹 Performance geral:** ⭐⭐⭐⭐⭐  

**Teste de Vídeo/Áudio:**
```
[Documente se conseguiu ativar mic/câmera]

Exemplo:
✅ Navegador pediu permissão de mic/câmera
✅ Vídeo local apareceu no Jitsi
❌ Áudio com eco (possível problema de configuração)
```

**Usabilidade:**
```
[Como foi a experiência de navegação]

Exemplo positivo:
"Tabs intuitivas, fácil alternar entre Chat e Atendimento"

Exemplo negativo:
"Formulário de Atendimento muito longo, campos obrigatórios não destacados"
```

**Sugestões:**
```
[O que melhoraria a experiência]

Exemplo:
- Adicionar botão "Finalizar Consulta" mais visível
- Auto-save do formulário a cada 30s
- Notificação quando paciente entra na sala
- Atalho de teclado para alternar tabs (Ctrl+1, Ctrl+2...)
```

**Bugs/Problemas:**
```
[Liste qualquer comportamento inesperado]

Exemplo:
- Jitsi não carregou no Chrome (OK no Firefox)
- Console mostra erro: "Failed to load external_api.js"
- Tab "Exames" em branco (não renderiza conteúdo)
```

---

---

## 📚 **PÁGINAS COMPLEMENTARES** {#páginas-complementares}

### 🔗 **Dashboard Operacional** — `/dashboard-medico.html`

**Objetivo:** Dashboard dark minimalista para uso rápido diário.

**Quando testar:**
- Acesse manualmente ou pelo link "Ver todos" do widget
- Compare com `/dashboard/` (versão light com sidebar)

**O que observar:**
- [ ] Tema dark (fundo escuro, texto claro)
- [ ] Lista de consultas do dia
- [ ] Fila de atendimento
- [ ] Métricas simples (sem gráficos avançados)

---

### 🔗 **Agenda Simples** — `/agenda.html`

**Objetivo:** Visualizar fila de pacientes em tabela simples.

**O que observar:**
- [ ] Tabela dark com lista de pacientes
- [ ] Colunas: Nome, Horário, Status, Ações
- [ ] Botões para iniciar consulta

---

### 🔗 **Agenda PRO** — `/agenda/`

**Objetivo:** Calendário visual + gestão avançada de agendamento.

**O que observar:**
- [ ] Calendário tipo Google Calendar
- [ ] Drag & drop para reagendar
- [ ] Fila lateral com próximos pacientes

---

### 🔗 **Métricas Básicas** — `/dashboard-piloto.html`

**Objetivo:** KPIs e funil de conversão.

**O que observar:**
- [ ] Cards de métricas (NPS, retenção, match time)
- [ ] Gráfico de funil
- [ ] Estatísticas consolidadas

---

### 🔗 **PHR (Prontuário)** — `/phr.html`

**Objetivo:** Histórico completo do paciente.

**O que observar:**
- [ ] Dados demográficos
- [ ] Histórico de consultas
- [ ] Exames anteriores
- [ ] Prescrições passadas

---

---

## 💬 **ONDE DEIXAR FEEDBACK GERAL** {#feedback}

### **📍 Formulário Online:**
[Link do Google Forms ou Typeform aqui]

### **📧 E-mail para bugs críticos:**
`bugs@telemed.com.br`

### **💬 Chat de Suporte:**
Widget flutuante no canto inferior direito de todas as páginas.

### **🐛 Reportar Bug Estruturado:**

Use este template:

```markdown
## 🐛 Bug Report

**Página:** /consulta/
**Navegador:** Chrome 120 (Windows 11)
**Data/Hora:** 2025-11-10 14:30

**Descrição:**
Jitsi não carrega, fica tela preta.

**Passos para reproduzir:**
1. Login como dr@teste.com
2. Dashboard → Aceitar BID "Karina"
3. Página /consulta/ carrega
4. Coluna esquerda fica preta

**Console logs:**
```
Failed to load external_api.js (404)
CORS error: mixed content blocked
```

**Screenshot:**
[Anexar print]

**Criticidade:**
🔴 Alta | 🟡 Média | 🟢 Baixa
```

---

---

## ✅ **CHECKLIST DE TESTES COMPLETO** {#checklist}

### **1️⃣ LOGIN (/auth/login.html)**
- [ ] Credenciais mockadas funcionam (dr@teste.com / 123456)
- [ ] Dropdown "Médico" selecionável
- [ ] Mensagem de erro aparece se campos vazios
- [ ] Redirect para `/dashboard/` após sucesso
- [ ] Token JWT salvo no localStorage
- [ ] Console sem erros

**⏱️ Tempo:** 1 minuto

---

### **2️⃣ DASHBOARD (/dashboard/)**
- [ ] Sidebar lateral visível
- [ ] 4 cards de métricas renderizados
- [ ] Widget "Atendimentos Pendentes" aparece
- [ ] 2 BIDs mockados exibidos (Karina + Solange)
- [ ] Badge "NOVA OFERTA" com animação de pulso
- [ ] Hover nos cards funciona (elevação)
- [ ] Botão "✅ Aceitar Consulta" clicável
- [ ] Console mostra logs de inicialização

**⏱️ Tempo:** 2 minutos

---

### **3️⃣ WIDGET — Aceitar BID**
- [ ] Clicar em "✅ Aceitar Consulta" (card Karina)
- [ ] Animação visual (card diminui e escurece)
- [ ] Console log: `✅ Aceitando BID: bid-001`
- [ ] sessionStorage salva `bidAceito` e `consultaIniciada`
- [ ] Redirect automático após 300ms
- [ ] URL destino: `/consulta/?bid=bid-001&source=dashboard`

**⏱️ Tempo:** 30 segundos

---

### **4️⃣ CONSULTA (/consulta/)**

**4.1 — Carregamento da Página:**
- [ ] Header com nome do paciente visível
- [ ] Barra de tabs (Chat, Atendimento, Exames, Receitas)
- [ ] Split em 2 colunas (Jitsi + Tabs)
- [ ] URL contém parâmetros `?bid=bid-001&source=dashboard`

**4.2 — Jitsi Meet:**
- [ ] Script `external_api.js` carrega (Network tab OK)
- [ ] Interface Jitsi aparece na coluna esquerda
- [ ] Sala criada: `telemed-demo` ou `bid-bid-001`
- [ ] Mensagem "Pedir para participar..." ou "You are the only one..."
- [ ] Controles de mic/câmera visíveis
- [ ] Navegador pede permissão de mic/câmera
- [ ] Vídeo local aparece (se permissão concedida)

**4.3 — Tabs de Atendimento:**
- [ ] Tab "Chat" ativa por padrão
- [ ] Campo de mensagem editável
- [ ] Clicar em "Atendimento" muda conteúdo
- [ ] Formulário de anamnese completo
- [ ] Tabs "Exames" e "Receitas" acessíveis

**4.4 — Navegação:**
- [ ] Botão "Voltar" redireciona para `/dashboard/`
- [ ] Botão "Abrir MedicalDesk" funciona (proxy)
- [ ] Console sem erros críticos

**⏱️ Tempo:** 4-6 minutos

---

### **5️⃣ TESTE COMPLETO END-TO-END**
- [ ] Login → Dashboard → Aceitar BID → Consulta Jitsi
- [ ] Preencher formulário de atendimento
- [ ] Adicionar exame
- [ ] Criar receita (se possível)
- [ ] Voltar ao dashboard
- [ ] Aceitar segundo BID (Solange)
- [ ] Repetir fluxo

**⏱️ Tempo:** 10-12 minutos

---

---

## 📊 **TEMPLATE DE RELATÓRIO FINAL**

Após completar os testes, preencha:

```markdown
# 📋 Relatório de Testes — Jornada do Médico

**Testador:** [Seu nome]
**Data:** 2025-11-10
**Navegador:** Chrome 120 (Windows 11)
**Ambiente:** https://seu-repl.replit.dev

---

## ✅ Testes Bem-Sucedidos

- [x] Login com credenciais mockadas
- [x] Dashboard renderiza com widget
- [x] Aceitar BID redireciona corretamente
- [x] Jitsi carrega e funciona
- [x] Tabs de atendimento navegáveis
- [x] Formulário de anamnese completo

---

## ❌ Problemas Encontrados

1. **Jitsi não pediu permissão de câmera**
   - Navegador: Chrome
   - Console: "Permission denied"
   - Criticidade: 🟡 Média

2. **Tab "Exames" em branco**
   - Cliquei mas não renderizou conteúdo
   - Console: "TypeError: Cannot read property..."
   - Criticidade: 🔴 Alta

---

## 💡 Sugestões de Melhoria

1. Adicionar contador de tempo na consulta
2. Botão "Finalizar" mais visível
3. Auto-save do formulário
4. Notificação quando paciente entra na sala

---

## ⭐ Avaliação Geral

**Design:** ⭐⭐⭐⭐⭐ (5/5)
**Usabilidade:** ⭐⭐⭐⭐☆ (4/5)
**Performance:** ⭐⭐⭐⭐⭐ (5/5)
**Jitsi Integration:** ⭐⭐⭐⭐☆ (4/5)

**Comentário Final:**
Plataforma muito bem desenvolvida, fluxo intuitivo. 
Jitsi funciona bem mas precisa melhorar feedback visual 
quando sala está vazia.
```

---

---

## 🎯 **CONCLUSÃO**

Este guia cobre **100% da jornada do médico** na plataforma TeleMed:

✅ Login autenticado  
✅ Dashboard com widget de BIDs  
✅ Aceitar consulta em 1 clique  
✅ Vídeo conferência real com Jitsi  
✅ Formulários de atendimento  
✅ Navegação entre seções  

**⏱️ Tempo total estimado de teste:** 15-20 minutos

**📧 Dúvidas?** Entre em contato via chat de suporte ou `suporte@telemed.com.br`

---

**Última atualização:** 10 de Novembro de 2025  
**Versão do documento:** 2.0
