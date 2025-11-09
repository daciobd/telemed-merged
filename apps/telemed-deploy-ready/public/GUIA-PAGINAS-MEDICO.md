# 📚 Guia Completo: Páginas do Médico — Quando Usar Cada Uma

Este documento explica **exatamente quando e como** usar cada uma das 6 páginas diferentes disponíveis para médicos na plataforma TeleMed.

---

## 🗺️ **MAPA VISUAL DAS PÁGINAS**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        JORNADA DO MÉDICO                                │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣  LOGIN → PRIMEIRA VEZ
    ↓
    /dashboard/                    ← Dashboard completo com SIDEBAR
    (versão PRO, light theme)

2️⃣  LOGIN → DIA A DIA DE TRABALHO
    ↓
    /dashboard-medico.html         ← Dashboard operacional (dark, MVP)
    (consultas do dia, fila, métricas simples)

3️⃣  VER FILA DE ATENDIMENTO
    ↓
    /agenda.html                   ← Agenda simples (tabela dark)
    /agenda/                       ← Agenda PRO (calendário visual)

4️⃣  MÉTRICAS E PERFORMANCE
    ↓
    /dashboard-piloto.html         ← Métricas básicas (KPIs, funil)
    /gestao-avancada/              ← Métricas AVANÇADAS (gráficos, $$$)

5️⃣  GERENCIAR PACIENTES
    ↓
    /meus-pacientes.html           ← Histórico de pacientes
```

---

## 📊 **1. DASHBOARDS (3 versões diferentes)**

### **A) `/dashboard/` — Dashboard PRO com Sidebar** ⭐ **RECOMENDADO PARA PRODUÇÃO**

**🎨 Design:**
- Light theme (fundo branco/cinza claro)
- Sidebar lateral fixa com menu de navegação
- Visual moderno tipo SaaS profissional
- Gráficos avançados (Chart.js)

**👤 Quando usar:**
- **Primeira vez** que o médico acessa após login
- **Versão profissional** para uso diário
- Quando o médico quer **navegar entre seções** (métricas, pacientes, agenda)

**🔧 Características:**
- 📊 Métricas consolidadas
- 📈 Gráficos de performance
- 👥 Gestão de pacientes
- 📅 Calendário integrado
- 🧭 Menu de navegação lateral

**💡 Use para:**
- Médicos em ambiente de clínica/hospital
- Interface principal do sistema
- Usuários que preferem tema claro

---

### **B) `/dashboard-medico.html` — Dashboard Operacional (MVP)** ⚡ **MAIS RÁPIDO**

**🎨 Design:**
- Dark theme (fundo escuro)
- Interface minimalista e compacta
- Foco em **ação rápida**

**👤 Quando usar:**
- **Dia a dia de atendimento** (modo operacional)
- Médico precisa **ver rapidamente** quem está na fila
- Plantão noturno (dark theme confortável)

**🔧 Características:**
- 🏥 4 métricas principais (fila, agendados, concluídos, prescrições)
- 📋 Lista de consultas em 3 seções: **Fila Agora**, **Agendados**, **Histórico Recente**
- 🔄 Filtros por especialidade e janela de tempo
- 🏥 Botão direto para MedicalDesk

**💡 Use para:**
- Médicos em atendimento ativo
- Plantões noturnos
- Precisa de resposta rápida ("quem está esperando?")

---

### **C) `/dashboard-piloto.html` — Dashboard de Métricas Básicas** 📈 **PARA ANÁLISE**

**🎨 Design:**
- Dark theme
- Foco em **KPIs e métricas**
- Visual moderno com cards coloridos

**👤 Quando usar:**
- Médico quer **analisar performance**
- Reuniões de revisão mensal
- Acompanhar NPS e disponibilidade

**🔧 Características:**
- 📊 4 KPIs principais (usuários, consultas, NPS, uptime)
- 🔄 Funil de conversão (landing → cadastro → match → consulta → prescrição)
- 📈 Gráficos visuais
- 📋 Logs de atividade

**💡 Use para:**
- Análise de desempenho
- Relatórios gerenciais
- Monitoramento de qualidade (NPS)

---

## 📅 **2. AGENDAS (2 versões diferentes)**

### **A) `/agenda.html` — Agenda Simples (Tabela)** ⚡ **MAIS SIMPLES**

**🎨 Design:**
- Dark theme
- Tabela limpa e direta
- Foco em **lista de consultas**

**👤 Quando usar:**
- Ver rapidamente **quem está na fila**
- Após aceitar um BID (consulta aparece aqui)
- Modo "fila de atendimento"

**🔧 Características:**
- 📊 3 estatísticas (Aguardando, Em Consulta, Finalizadas)
- 📋 Tabela com status, paciente, especialidade, ID, data
- 🔄 Botão para adicionar consulta teste
- 🗑️ Limpar fila (demo)

**💡 Use para:**
- Ver rapidamente quem está esperando
- Interface minimalista sem distrações
- Plantões com muitas consultas

---

### **B) `/agenda/` — Agenda PRO (Calendário Visual)** 📆 **MAIS COMPLETA**

**🎨 Design:**
- Dark theme premium
- **Calendário visual** + lista de consultas
- Layout em 2 colunas (calendário | lista)

**👤 Quando usar:**
- Médico precisa **planejar a semana**
- Ver consultas agendadas para dias futuros
- Interface visual de calendário

**🔧 Características:**
- 📆 Calendário mensal navegável
- 📋 Lista de consultas do dia selecionado
- 🎨 Indicadores coloridos por status
- 🔄 Navegação entre dias

**💡 Use para:**
- Planejamento semanal/mensal
- Médicos que preferem visualização em calendário
- Gestão de agenda com múltiplos dias

---

## 💼 **3. GESTÃO AVANÇADA**

### `/gestao-avancada/` — Dashboard Financeiro/Gerencial** 💰 **NÍVEL EXECUTIVO**

**🎨 Design:**
- Dark theme premium com gradientes
- **Gráficos avançados** (Chart.js)
- Visual profissional nível C-Level

**👤 Quando usar:**
- **Diretor médico** ou gestor de clínica
- Análise financeira e operacional
- Relatórios mensais/trimestrais
- Apresentações para investidores

**🔧 Características:**
- 📊 Métricas avançadas (receita, custos, margens)
- 📈 Gráficos de tendência (consultas ao longo do tempo)
- 💰 Análise financeira detalhada
- 📑 Relatórios exportáveis
- 🎯 Metas e objetivos

**💡 Use para:**
- Gestão de clínica/hospital
- Análise financeira
- Reuniões executivas
- Planejamento estratégico

---

## 👥 **4. GESTÃO DE PACIENTES**

### `/meus-pacientes.html` — Histórico de Pacientes** 📋

**🎨 Design:**
- Dark theme
- Tabela simples com filtros
- Foco em **busca e histórico**

**👤 Quando usar:**
- Médico precisa **buscar histórico** de um paciente
- Verificar última consulta de alguém
- Filtrar por especialidade

**🔧 Características:**
- 🔍 Filtros por ID, nome, especialidade
- 📋 Tabela com ID, nome, última especialidade, última consulta
- 🔗 Ações (ver prontuário, histórico)
- 🆘 Widget de ajuda/suporte

**💡 Use para:**
- Consultar histórico de pacientes
- Antes de uma consulta (ver prontuário)
- Relatórios de pacientes recorrentes

---

## 🎯 **RESUMO: QUAL USAR QUANDO?**

| **SITUAÇÃO** | **PÁGINA RECOMENDADA** | **POR QUÊ?** |
|--------------|------------------------|--------------|
| 🏥 **Atendimento diário** | `/dashboard-medico.html` | Mais rápido, foca em fila |
| 🏢 **Uso profissional completo** | `/dashboard/` | Interface completa com sidebar |
| 📊 **Analisar métricas** | `/dashboard-piloto.html` | KPIs e funil de conversão |
| 💰 **Gestão financeira** | `/gestao-avancada/` | Gráficos avançados, receita |
| 📅 **Ver fila agora** | `/agenda.html` | Tabela simples e rápida |
| 📆 **Planejar semana** | `/agenda/` | Calendário visual |
| 👤 **Buscar histórico** | `/meus-pacientes.html` | Filtros e busca de pacientes |
| 🌙 **Plantão noturno** | `/dashboard-medico.html` ou `/agenda.html` | Dark theme confortável |
| 👔 **Apresentação executiva** | `/gestao-avancada/` | Visual profissional, gráficos |

---

## 🔗 **LINKS DIRETOS (TESTE AGORA!)**

```
✅ https://seu-dominio/dashboard/                    (Dashboard PRO com Sidebar)
✅ https://seu-dominio/dashboard-medico.html         (Dashboard Operacional MVP)
✅ https://seu-dominio/dashboard-piloto.html         (Métricas e KPIs)
✅ https://seu-dominio/gestao-avancada/              (Gestão Financeira Avançada)
✅ https://seu-dominio/agenda.html                   (Agenda Simples - Tabela)
✅ https://seu-dominio/agenda/                       (Agenda PRO - Calendário)
✅ https://seu-dominio/meus-pacientes.html           (Histórico de Pacientes)
```

---

## 💡 **DICA PROFISSIONAL**

**Para a MAIORIA dos médicos, recomendamos:**

1. **Login inicial** → `/dashboard/` (versão PRO completa)
2. **Durante plantão** → `/dashboard-medico.html` (mais rápido)
3. **Fim do dia** → `/gestao-avancada/` (analisar métricas)

**Para gestores de clínica:**

1. **Segunda-feira** → `/gestao-avancada/` (planejar semana)
2. **Reunião mensal** → `/dashboard-piloto.html` (KPIs e NPS)
3. **Relatório financeiro** → `/gestao-avancada/` (receitas e custos)

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Teste todas as páginas** usando os links acima
2. **Escolha a favorita** para cada situação
3. **Configure atalhos** no navegador para acesso rápido
4. **Treine sua equipe** usando este guia

---

**Criado por:** TeleMed Platform  
**Atualizado em:** Novembro 2025  
**Versão:** 1.0
