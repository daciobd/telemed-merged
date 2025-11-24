# 🚀 TeleMed Backend - Fase 2A

## 📦 Conteúdo do Pacote

Este ZIP contém a **estrutura completa do backend** (Fase 2A):

- ✅ **Servidor Express** configurado
- ✅ **4 Middlewares** (auth, error, validation, not-found)
- ✅ **3 Utilitários** (JWT, password, response)
- ✅ **Package.json** completo
- ✅ **Documentação**

**Total:** 12 arquivos | 12 KB

---

## 🎯 O Que Está Incluso

### Servidor (`server/index.ts`)
- Express configurado
- CORS, Helmet, Morgan
- Health check
- Rotas base definidas
- Error handling

### Middlewares (`server/middleware/`)
- **auth.middleware.ts** - JWT + roles (doctor/patient/admin)
- **error.middleware.ts** - Tratamento global de erros
- **validation.middleware.ts** - Validação Zod (10+ schemas)
- **not-found.middleware.ts** - 404 handler

### Utilitários (`server/utils/`)
- **jwt.util.ts** - Geração/verificação JWT
- **password.util.ts** - Hash bcrypt
- **response.util.ts** - Respostas padronizadas

### Configuração
- **package-backend.json** - Todas as dependências

### Documentação
- **ESTRUTURA_BACKEND.md** - Arquitetura completa
- **FASE_2A_COMPLETA.txt** - Resumo visual

---

## 🚀 Setup Rápido

### 1. Extrair e copiar
```bash
# Extrair ZIP
unzip telemed-backend-fase2a.zip

# Copiar para seu projeto TeleMed
cp -r server/ /caminho/do/seu/projeto/
cp package-backend.json /caminho/do/seu/projeto/package.json
```

### 2. Instalar dependências
```bash
cd /caminho/do/seu/projeto
npm install
```

### 3. Configurar .env
Crie um arquivo `.env` com:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/telemed

# JWT
JWT_SECRET=seu-secret-super-seguro-aqui-troque-isso
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=development
PORT=3000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://telemed.com.br
```

### 4. Rodar servidor
```bash
npm run dev
```

✅ Servidor rodando em `http://localhost:3000`

---

## 📁 Estrutura Após Setup

```
seu-projeto/
├── server/
│   ├── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── not-found.middleware.ts
│   │   └── validation.middleware.ts
│   └── utils/
│       ├── jwt.util.ts
│       ├── password.util.ts
│       └── response.util.ts
├── db/                    # (da Fase 1)
│   ├── schema.ts
│   ├── index.ts
│   └── ...
├── package.json
├── .env
└── tsconfig.json          # (criar se necessário)
```

---

## 🔐 Schemas de Validação Incluídos

Já prontos em `validation.middleware.ts`:

✅ **registerPatient** - Cadastro paciente  
✅ **registerDoctor** - Cadastro médico  
✅ **login** - Login  
✅ **createMarketplaceConsultation** - Consulta marketplace  
✅ **createDirectConsultation** - Agendamento direto  
✅ **createBid** - Fazer lance  
✅ **updateVirtualOfficeSettings** - Config consultório  
✅ **updateDoctorProfile** - Atualizar perfil  

---

## 📊 Endpoints Preparados

O servidor está configurado para estas rotas (controllers a implementar):

### Autenticação
- `POST /api/auth/register`
- `POST /api/auth/register/doctor`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Médicos
- `GET /api/doctors`
- `GET /api/doctors/marketplace`
- `PATCH /api/doctors/me`

### Consultório Virtual
- `GET /api/dr/:customUrl` (página pública)
- `GET /api/virtual-office/settings`
- `PATCH /api/virtual-office/settings`

### Consultas
- `POST /api/consultations/marketplace`
- `POST /api/consultations/direct`
- `GET /api/consultations`

### Lances
- `POST /api/consultations/:id/bid`
- `GET /api/consultations/:id/bids`

---

## ✅ Funcionalidades Implementadas

✅ Autenticação JWT completa  
✅ Proteção por role (doctor/patient/admin)  
✅ Validação automática com Zod  
✅ Tratamento de erros global  
✅ Respostas padronizadas  
✅ Health check (`GET /health`)  
✅ CORS configurado  
✅ Segurança (Helmet)  
✅ Logging (Morgan)  

---

## 🧪 Testar o Setup

Após rodar `npm run dev`:

### 1. Health Check
```bash
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-11-24T...",
  "environment": "development"
}
```

### 2. Root
```bash
curl http://localhost:3000/
```

Resposta esperada:
```json
{
  "message": "TeleMed API - Consultório Virtual",
  "version": "1.0.0",
  "docs": "/api/docs"
}
```

---

## 📦 Dependências Incluídas

### Produção
- express
- cors
- helmet
- morgan
- dotenv
- drizzle-orm
- pg
- bcryptjs
- jsonwebtoken
- zod

### Desenvolvimento
- @types/express
- @types/cors
- @types/morgan
- typescript
- tsx
- drizzle-kit

---

## 🎯 Próximos Passos (Fase 2B)

Agora você pode criar:

1. **Routes** (`server/routes/`)
2. **Controllers** (`server/controllers/`)
3. **Services** (`server/services/`)

Exemplos já estão preparados na estrutura!

---

## 🆘 Troubleshooting

**Erro: "Cannot find module 'drizzle-orm'"**
→ Rode `npm install`

**Erro: "DATABASE_URL is not defined"**
→ Crie arquivo `.env` com a URL do PostgreSQL

**Porta 3000 já em uso**
→ Mude no `.env`: `PORT=3001`

**CORS error no frontend**
→ Adicione a URL do frontend no `.env`: `ALLOWED_ORIGINS=http://localhost:5173`

---

## 📚 Documentação Extra

Incluída no ZIP:

- **ESTRUTURA_BACKEND.md** - Arquitetura detalhada
- **FASE_2A_COMPLETA.txt** - Resumo visual com checklist

---

## ✨ Status do Projeto

- **Fase 1**: ✅ Banco de dados completo
- **Fase 2A**: ✅ Estrutura backend (este ZIP)
- **Fase 2B**: ⏳ Rotas + Controllers (próximo)
- **Fase 3**: ⏳ Frontend
- **Fase 4**: ⏳ Integrações

---

**Pronto para começar!** 🚀

Se tiver dúvidas, consulte `ESTRUTURA_BACKEND.md`
