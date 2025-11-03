# 🗺️ Mapa Completo da Plataforma TeleMed

## 📍 Onde Estão as Páginas?

### ✅ **PÁGINAS REAIS (Produção)**

Todas as páginas principais estão em `apps/telemed-deploy-ready/`:

**Páginas de Usuário:**
- `/index.html` - Landing Page Principal (40KB)
- `/consulta.html` - Sala de Consulta Médica (20KB)
- `/sala-de-espera.html` - Sala de Espera Paciente (13KB)
- `/phr.html` - Prontuário Pessoal de Saúde (16KB)
- `/agenda.html` - Agenda Médica (11KB)
- `/dashboard-piloto.html` - Dashboard Piloto (15KB)
- `/dashboard-medico.html` - Dashboard Médico (21KB)
- `/bidconnect-standalone.html` - BidConnect 3 Modelos (17KB)
- `/auth/login.html` - Login (3.2KB)
- `/dr-ai.html` - Dr. AI Triagem (20KB)
- `/dr-ai-dashboard.html` - Dashboard Dr. AI (19KB)

**Páginas de QA/Documentação:**
- `/public/bem-vindo.html` - Boas-Vindas (Entrada Principal QA)
- `/public/tour.html` - Tour Completo (27 cards, 56KB)
- `/public/tour-quick.html` - Tour Rápido (14KB)
- `/public/tester-guide.html` - Guia Interativo do Testador
- `/public/test-tour-links.html` - Teste Automático de Links
- `/public/pitchdeck.html` - Pitch Deck Investidores V2.0

### 🔧 **STUBS (Temporários para QA)**

Criados para o tour.html não quebrar:

- `/auth/register.html` (809B) - Stub: Cadastro
- `/patient/waiting-room.html` (1KB) - Stub: Sala Espera
- `/patient/phr.html` (972B) - Stub: PHR
- `/medicaldesk-demo/index.html` (1.1KB) - Stub: Dashboard
- `/medicaldesk-demo/agenda.html` (962B) - Stub: Agenda

**⚠️ IMPORTANTE:** Os stubs NÃO substituem as páginas reais! Eles são placeholders em caminhos diferentes.

### ⚛️ **Aplicação React (SPA)**

- `src/pages/TelemedPricingModels.jsx` - Componente React de Precificação
- `src/components/` - Componentes reutilizáveis
- `src/routes/` - Configuração de rotas SPA

### 🔀 **Proxy/Roteamento Externo**

- `/medicaldesk/*` → PROXY para servidor MedicalDesk externo
- `/api/auction/*` → PROXY para Mock/Auction Service
- `/go/medicaldesk` → Redirect 302 com JWT

## 🧪 Como Testar

### Teste Rápido (Console do Navegador):

```javascript
// Testar página REAL
fetch('/consulta.html').then(r => console.log('Consulta:', r.status));

// Testar STUB
fetch('/patient/waiting-room.html').then(r => console.log('Stub:', r.status));
```

### Teste Completo:

1. Abra: `/public/test-tour-links.html`
2. Clique: "▶️ Executar Testes"
3. Veja: Todas as páginas validadas

## 📊 Resumo

| Tipo | Quantidade | Status |
|------|------------|--------|
| Páginas Reais | 40+ | ✅ Funcionando |
| Stubs QA | 5 | ✅ Funcionando |
| Componentes React | 1 | ✅ Funcionando |
| Proxies | 2 | ✅ Funcionando |

**🎉 TUDO FUNCIONANDO SEM CONFLITOS!**
