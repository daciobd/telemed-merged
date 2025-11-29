# 📋 Guia de Verificação - TeleMed Consultório Virtual

## ✅ Status de Implementação

### FASE 1: BANCO DE DADOS ✅ **COMPLETO**
```
✅ Schema atualizado com:
   - accountTypeEnum: 'marketplace', 'virtual_office', 'hybrid'
   - monthlyPlanEnum: 'basic', 'professional', 'premium'
   - Tabela: virtual_office_settings
   - Campos: customUrl, consultationPricing, monthlyPlan
   
✅ Dados de seed implementados:
   - Dra. Ana Silva (virtual_office)
   - Dr. João Santos (hybrid)
   - Dr. Carlos Mendes (virtual_office)
```

---

## 🔴 O Que FALTA Implementar

### FASE 2: BACKEND - Endpoints (⏳ PENDENTE)
```
❌ POST /api/virtual-office/setup
   → Médico cria/configura seu consultório
   
❌ GET /api/virtual-office/:customUrl
   → Página pública do médico (dados)
   
❌ POST /api/virtual-office/:customUrl/book
   → Paciente agenda consulta direto
   
❌ GET /api/virtual-office/my-patients
   → Lista pacientes do médico
   
❌ PATCH /api/virtual-office/settings
   → Atualizar configurações do consultório
   
❌ POST /api/billing/subscribe
   → Criar assinatura mensal
```

### FASE 3: FRONTEND - Páginas (⏳ PENDENTE)
```
❌ /doctor/virtual-office-setup.tsx (NOVA)
   → Configuração de consultório
   - URL personalizada
   - Preços fixos
   - Horários disponíveis
   - Escolher plano
   
❌ /doctor/dashboard.tsx (MODIFICAR)
   → Adicionar toggle "Modo Consultório" vs "Marketplace"
   → Se Consultório: mostrar calendário de agendamentos
   
❌ /dr/[customUrl].tsx (NOVA - página pública)
   → telemed.com.br/dr-anasilva
   - Perfil do médico
   - Preços e especialidades
   - Calendário de agendamento
   - Botão "Agendar Consulta"
   
❌ /pricing.tsx (NOVA)
   → Planos: Básico (R$97), Profissional (R$197), Premium (R$397)
   
❌ /doctor/my-patients.tsx (NOVA)
   → Lista de pacientes recorrentes
   → Histórico de consultas
```

### FASE 4: INTEGRAÇÃO (⏳ PENDENTE)
```
❌ Google Calendar Sync
❌ WhatsApp/Email Notificações
❌ Stripe/Mercado Pago para assinaturas
```

---

## 🎯 ROTEIRO DE TESTES

### 1️⃣ Teste: Seed + Dados
**Endpoint:** `POST /api/seed`
```bash
curl -X POST http://localhost:5000/api/seed

✅ Esperado:
- Retorna 2 médicos criados (Dra. Ana Silva + Dr. João Santos)
- Ambos com accountType = 'virtual_office'
- Ambos com customUrl definidas
- virtualOfficeSettings criadas para ambos
```

**Verificar no Banco:**
```sql
SELECT id, email, account_type, custom_url, monthly_plan 
FROM doctors 
LIMIT 5;
```

---

### 2️⃣ Teste: Dashboard do Médico (ATUAL)
**Página:** `http://localhost:5000/medicaldesk`
```
✅ JÁ FUNCIONA - mostra dashboard atual

🔄 PRECISA ADICIONAR:
   - Toggle "Marketplace" ↔️ "Consultório"
   - Se Consultório:
     * Mostrar link personalizado: /dr/[customUrl]
     * Mostrar calendário de agendamentos
     * Mostrar próximas consultas
```

---

### 3️⃣ Teste: Página Pública do Médico (NOVA)
**URL:** `http://localhost:5000/dr/dra-anasilva`
```
❌ NÃO EXISTE AINDA

🎯 DEVE MOSTRAR:
   ✅ Perfil da Dra. Ana Silva
   ✅ Especialidade: Cardiologia
   ✅ Tabela de preços:
      - Primeira consulta: R$ 300
      - Retorno: R$ 200
      - Urgente: R$ 450
      - Check-up: R$ 250
   ✅ Calendário com horários disponíveis
   ✅ Botão "Agendar Consulta"
   
🎨 DESIGN: Cards com fundo teal (#2BB3A8), texto em português
```

---

### 4️⃣ Teste: Agendamento Direto (NOVO)
**Fluxo:** Paciente → Agendar na página pública
```
❌ ENDPOINT NÃO EXISTE:
   POST /api/virtual-office/dr-anasilva/book
   
{
  "patientId": 123,
  "consultationType": "primeira_consulta",
  "scheduledFor": "2025-02-10T14:00:00",
  "consultationDuration": 45
}

✅ ESPERADO:
   - Criar consulta com isMarketplace = false
   - Calcular preço do consultório (não leilão)
   - Enviar notificação ao médico
   - Retornar confirmação ao paciente
```

---

### 5️⃣ Teste: Setup do Consultório (NOVO)
**URL:** `http://localhost:5000/doctor/virtual-office-setup`
```
❌ PÁGINA NÃO EXISTE AINDA

🎯 FORMULÁRIO DEVE TER:
   1️⃣ URL Personalizada
      Input: "dra-anasilva"
      Validação: unique, lowercase, sem espaços
   
   2️⃣ Preços Fixos
      - Primeira consulta: R$ 300
      - Retorno: R$ 200
      - Urgente: R$ 450
      - Check-up: R$ 250
   
   3️⃣ Horários Disponíveis
      Calendário com seleção de horários por dia
   
   4️⃣ Escolher Plano
      [ ] Básico R$97/mês (30 consultas)
      [ ] Profissional R$197/mês (ilimitado)
      [ ] Premium R$397/mês (white-label)
   
   5️⃣ Botão "Salvar Consultório"
      → Chama POST /api/virtual-office/setup
      → Redireciona para /dr/[customUrl]
```

---

### 6️⃣ Teste: Painel de Pacientes (NOVO)
**URL:** `http://localhost:5000/doctor/my-patients`
```
❌ PÁGINA NÃO EXISTE

🎯 DEVE MOSTRAR:
   ✅ Lista de pacientes que agendaram no consultório
   ✅ Filtro por data/status
   ✅ Histórico de consultas por paciente
   ✅ Botão "Enviar Lembrete"
   ✅ Botão "Follow-up"
```

---

### 7️⃣ Teste: Exportação PDF (JÁ EXISTE)
**Calculadora:** Medical Desk Wells Score
```
✅ JÁ FUNCIONA

VERIFICAR:
   1. Ir em: http://localhost:5000/medicaldesk
   2. Calcular Wells Score
   3. Clicar "📄 Exportar PDF"
   4. Deve abrir documento com:
      - Logo TeleMed
      - Escore em destaque
      - Interpretação
      - Recomendação clínica
```

---

### 8️⃣ Teste: Histórico de Cálculos (JÁ EXISTE)
**Calculadora:** Medical Desk Wells Score
```
✅ JÁ FUNCIONA

VERIFICAR:
   1. Calcular Wells Score (exemplo: score=5)
   2. Clicar botão "📋 Histórico (1)"
   3. Deve mostrar painel com cálculos anteriores
   4. Cada item deve ter botão "🔄 Usar"
   5. Clicar "🔄 Usar" deve recarregar critérios
   6. Máximo 5 itens salvos
```

---

### 9️⃣ Teste: Notificações/Toasts (JÁ EXISTE)
**Calculadora:** Medical Desk Wells Score
```
✅ JÁ FUNCIONA

VERIFICAR:
   ✅ Ao calcular → Toast verde: "✅ Escore calculado: 5 pontos"
   ✅ Sem critérios → Toast vermelho: "⚠️ Selecione pelo menos um critério"
   ✅ Carregar histórico → Toast azul: "🔄 Critérios carregados de [data]"
```

---

## 🚀 PRIORIDADES PARA IMPLEMENTAR

### PRÓXIMAS 2 SEMANAS:

**Semana 1: Backend**
```
1. GET /api/virtual-office/:customUrl (buscar dados do médico)
2. POST /api/virtual-office/setup (criar/atualizar consultório)
3. POST /api/virtual-office/:customUrl/book (agendar consulta)
```

**Semana 2: Frontend**
```
1. Página /dr/[customUrl].tsx (pública)
2. Página /doctor/virtual-office-setup.tsx
3. Modificar dashboard para toggle mode
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

```
BANCO DE DADOS:
☑️ Schema inclui account_type enum
☑️ Tabela virtual_office_settings existe
☑️ Campo custom_url é unique
☑️ Seed cria médicos com virtual_office

BACKEND:
☐ Endpoints GET/POST /api/virtual-office/* criados
☐ Lógica condicional de marketplace vs consultório
☐ Sistema de billing integrado

FRONTEND:
☐ Página pública /dr/[customUrl] funciona
☐ Setup do consultório funciona
☐ Dashboard mostra toggle de modo
☐ Agendamento direto funciona

INTEGRAÇÕES:
☐ Google Calendar sync (opcional)
☐ Notificações de email (opcional)
```

---

## 🔗 LINKS PARA TESTAR

```
Desenvolvimento Local (http://localhost:5000):

✅ Já Funciona:
   - Medical Desk: http://localhost:5000/medicaldesk
   - Wells Score Export: clique "📄 Exportar PDF"
   - Seed: POST http://localhost:5000/api/seed

❌ Não Existe Ainda:
   - Página pública: http://localhost:5000/dr/dra-anasilva
   - Setup: http://localhost:5000/doctor/virtual-office-setup
   - Pacientes: http://localhost:5000/doctor/my-patients
```

---

## 📝 NOTAS

- Arquivo de seed atual: `/home/runner/workspace/apps/telemed-internal/src/routes/seed.routes.js`
- Schema do banco: `/home/runner/workspace/db/schema.ts`
- Servidor: `apps/telemed-internal/src/index.js`
- Medical Desk: `apps/medical-desk-advanced/client/src`

---

**Status Geral:** ✅ 30% Completo | 🔄 70% em Desenvolvimento
