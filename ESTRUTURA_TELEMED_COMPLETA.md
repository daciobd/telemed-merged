# 🏥 **TeleMed Platform - Estrutura Completa (DEZ 2024)**

## 📊 **Visão Geral da Arquitetura**

```
┌─────────────────────────────────────────────────────────────────┐
│                   CAMADA DE APRESENTAÇÃO                        │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │ Consultório      │    │ Frontend         │                 │
│  │ Virtual (React)  │    │ Existente        │                 │
│  │ - SPA            │    │ (React Router)   │                 │
│  │ - Autenticado    │    │ - Marketplace    │                 │
│  │ - Tema Teal      │    │ - Prescrição     │                 │
│  │ - JWT            │    │ - Chat           │                 │
│  └──────────────────┘    └──────────────────┘                 │
│         ↓                         ↓                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              EXPRESS GATEWAY UNIFICADO (index.js)               │
│                                                                 │
│  ✅ Root entry point na raiz                                   │
│  ✅ Serve client/dist/ (Frontend Consultório Virtual)         │
│  ✅ Proxy para Medical Desk                                    │
│  ✅ Proxy para Auction Service (Mock)                         │
│  ✅ Health checks                                              │
│  ✅ OpenAI condicional                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│                    API ROUTES (Backend)                           │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ CONSULTÓRIO VIRTUAL  │  │ VIRTUAL OFFICE       │             │
│  │                      │  │                      │             │
│  │ POST /api/consultorio/auth/login               │             │
│  │ GET  /api/consultorio/auth/me                  │             │
│  │ PATCH /api/doctor/account-type                 │             │
│  │ GET  /api/doctor/dashboard                     │             │
│  │ GET  /api/virtual-office/settings              │             │
│  │ POST /api/virtual-office/settings              │             │
│  │ GET  /api/virtual-office/:customUrl            │             │
│  │ POST /api/virtual-office/appointments          │             │
│  │ GET  /api/virtual-office/:id/slots             │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ MARKETPLACE          │  │ PRESCRIPTIONS        │             │
│  │                      │  │                      │             │
│  │ GET  /api/bids       │  │ POST /api/prescription               │
│  │ POST /api/bids/:id   │  │ GET  /api/prescriptions              │
│  │ GET  /api/consults   │  │ ANVISA Validation    │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ DOCUMENTOS           │  │ MEDICAL DESK         │             │
│  │                      │  │                      │             │
│  │ POST /api/generate-pdf      (Proxy)                          │
│  │ AWS S3 Integration   │  │ /medicaldesk/       │             │
│  │ URLs Assinadas       │  │ Protocolos clínicos  │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ AUDIT & LOGS         │  │ HEALTH CHECKS        │             │
│  │                      │  │                      │             │
│  │ POST /api/logs       │  │ GET /healthz         │             │
│  │ POST /api/events     │  │ GET /health          │             │
│  │ GET  /api/metrics    │  │ GET /status.json     │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📁 **Estrutura de Diretórios**

```
telemed-merged/ (RAIZ)
│
├── 🎨 FRONTEND - Consultório Virtual
│   ├── client/
│   │   ├── src/
│   │   │   ├── App.tsx                    (Router + Layout principal)
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx          (Autenticação JWT)
│   │   │   │   ├── DoctorDashboard.tsx    (Métricas + toggle modo)
│   │   │   │   ├── VirtualOfficeSetup.tsx (Config: preço, dias, URL)
│   │   │   │   ├── MyPatients.tsx         (Gestão de pacientes)
│   │   │   │   └── PublicDoctorPage.tsx   (Calendário + agendamento)
│   │   │   ├── components/
│   │   │   │   ├── ui/                    (shadcn components)
│   │   │   │   ├── ProtectedRoute.tsx     (JWT check)
│   │   │   │   └── ApiFetch.tsx           (Bearer auto)
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts             (JWT + user context)
│   │   │   │   └── use-toast.ts
│   │   │   ├── lib/
│   │   │   │   └── queryClient.ts         (React Query v5)
│   │   │   └── index.css                  (Tema teal #2BB3A8)
│   │   ├── dist/ ✅                       (Buildado - pronto)
│   │   ├── vite.config.ts
│   │   └── postcss.config.js
│   │
│
├── ⚙️ BACKEND - Express Unificado (RAIZ)
│   │
│   ├── index.js ⭐ ENTRY POINT PRINCIPAL
│   │   ├── Consultório Virtual routes
│   │   ├── Virtual Office routes
│   │   ├── Marketplace routes
│   │   ├── Medical Desk proxy
│   │   ├── Auction proxy
│   │   ├── Health endpoints
│   │   └── Static serve (client/dist)
│   │
│   ├── server.js                         (Wrapper → import index.js)
│   │
│   ├── apps/ (Microsserviços legados - podem descontinuar)
│   │   ├── telemed-internal/
│   │   ├── medical-desk-advanced/
│   │   ├── telemed-deploy-ready/
│   │   ├── auction-service/
│   │   ├── telemed-docs-automation/
│   │   └── ...
│   │
│   ├── db/
│   │   └── migrate.mjs
│   │
│   └── scripts/
│
├── 📋 CONFIGURAÇÃO
│   ├── package.json ✅                   (Com build script)
│   ├── render.yaml ✅                    (Novo serviço telemed-unified)
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .replit
│   └── Procfile
│
└── 📚 DOCUMENTAÇÃO
    ├── replit.md
    ├── ESTRUTURA_TELEMED_COMPLETA.md
    └── ...
```

---

## 🔗 **Fluxos Principais**

### **1. Login & Autenticação**
```
React Component (LoginPage)
    ↓
POST /api/consultorio/auth/login { email, password }
    ↓
Backend:
    ├─ Valida credenciais
    ├─ Gera JWT token (bcryptjs + jsonwebtoken)
    └─ Retorna { token, user, role }
    ↓
Frontend:
    ├─ localStorage.setItem('authToken', token)
    ├─ useAuth hook gerencia estado
    └─ Redireciona para /doctor/dashboard
```

### **2. Virtual Office - Agendamento Direto**
```
Paciente acessa: https://telemed.com/dr/seu-medico
    ↓
GET /api/virtual-office/seu-medico
    ↓
Backend:
    ├─ Busca doctor settings
    ├─ Gera slots (calendário dinâmico)
    └─ Retorna horários + preço
    ↓
Frontend exibe calendário + botão "Agendar"
    ↓
POST /api/virtual-office/appointments
    ├─ Valida disponibilidade
    ├─ Cria appointment no BD
    └─ Retorna confirmação
    ↓
Email confirmação → Paciente + Médico
```

### **3. Marketplace - Leilão Reverso**
```
Paciente cria consulta (preço inicial)
    ↓
Médicos recebem notificação
    ↓
Médico faz lance (preço menor)
    ↓
Backend calcula:
    ├─ Doctor earnings: 80%
    ├─ Platform fee: 20%
    └─ Atualiza banco
    ↓
Dashboard mostra ganhos
```

---

## 🔐 **Segurança & Autenticação**

```
REQUEST:
Header: Authorization: Bearer eyJhbGc...
    ↓
MIDDLEWARE (authMiddleware):
    ├─ Decodifica JWT
    ├─ Valida assinatura
    ├─ Extrai user + role
    ├─ Rejeita sem token (401)
    ├─ Rejeita token expirado (401)
    └─ Rejeita role inválido (403)
    ↓
req.user = { id, email, role, ... }
    ↓
ROTA PROTEGIDA processada com segurança
```

---

## 🚀 **Deployment - Render**

**render.yaml (NOVO):**
```yaml
telemed-unified:
  type: web
  name: telemed-unified
  rootDir: .
  buildCommand: npm install && cd client && npm install && npm run build
  startCommand: node server.js
  healthCheckPath: /healthz
  
  Envs:
    RENDER: "true"              (Ativa porta dinâmica)
    PORT: 10000                 (Auto by Render)
    NODE_ENV: production
    DATABASE_URL: postgres://...
    FEATURE_PRICING: "true"
    FEATURE_MEDICALDESK: "true"
    OPENAI_API_KEY: (opcional)
```

**Fluxo:**
```
git push
    ↓
Render build: npm install + npm run build (React)
    ↓
Render start: node server.js
    ↓
index.js usa PORT env (10000 no Render)
    ↓
Express serve client/dist + rotas API
    ↓
🟢 Live em https://telemed-unified.onrender.com
```

---

## 📊 **Endpoints Principais**

**Autenticação:**
- `POST /api/consultorio/auth/login` → { email, password }
- `GET /api/consultorio/auth/me` → Retorna user atual

**Médico:**
- `GET /api/doctor/dashboard` → Métricas + modo
- `PATCH /api/doctor/account-type` → Trocar modo

**Virtual Office:**
- `GET /api/virtual-office/settings` → Lê config
- `POST /api/virtual-office/settings` → Atualiza config
- `GET /api/virtual-office/:customUrl` → Página pública
- `GET /api/virtual-office/:id/slots` → Slots disponíveis
- `POST /api/virtual-office/appointments` → Agendar

**Marketplace:**
- `GET /api/consultations` → Listas abertas
- `POST /api/consultations` → Novo lance
- `POST /api/bids/:id/accept` → Aceita (calcula fees)

**Prescrições:**
- `POST /api/prescription` → Criar
- `GET /api/prescriptions/:id` → Visualizar

**Documentos:**
- `POST /api/generate-pdf` → Gerar receita/atestado
- `GET /api/documents/:id` → Download (URL assinada)

**Health:**
- `GET /healthz` → Status básico
- `GET /health` → Status detalhado
- `GET /status.json` → Monitoramento externo

---

## ✅ **Status Atual**

| Componente | Status |
|-----------|--------|
| Frontend Consultório Virtual | ✅ Pronto |
| Backend Unificado | ✅ Pronto |
| Autenticação JWT | ✅ Pronto |
| Database (PostgreSQL) | ✅ Pronto |
| Virtual Office | ✅ Pronto |
| Marketplace | ✅ Pronto |
| Prescrições | ✅ Pronto |
| Documentos + S3 | ✅ Pronto |
| Medical Desk Proxy | ✅ Pronto |
| OpenAI (condicional) | ✅ Pronto |
| Render Deploy | ✅ Pronto |

---

## 🎯 **Versão Consolidada (Nov 2024)**

**De:** 6 microsserviços separados em diferentes portas  
**Para:** 1 entry point unificado (telemed-unified)

**Benefícios:**
- ✅ Deploy mais simples
- ✅ Melhor observabilidade
- ✅ Latência reduzida
- ✅ Facilita CI/CD
- ✅ Compliance CFM centralizado
