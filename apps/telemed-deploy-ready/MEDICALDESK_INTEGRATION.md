# 🏥 MedicalDesk Integration Guide

Guia completo de integração do MedicalDesk no TeleMed - sistema de consulta médica com JWT, proxy reverso e fallback automático.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Configuração](#configuração)
4. [Como Usar](#como-usar)
5. [APIs](#apis)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O MedicalDesk é uma ferramenta médica integrada que fornece:
- Protocolos clínicos em tempo real
- Suporte diagnóstico
- Ferramentas de decisão clínica

Esta integração oferece:
- ✅ **Autenticação JWT** - Sessões seguras de 15 minutos
- ✅ **Proxy Reverso** - Sem problemas de CORS
- ✅ **Fallback Automático** - Abre página demo se serviço indisponível
- ✅ **Event Delegation** - Funciona com elementos dinâmicos

---

## 🏗️ Arquitetura

```
Frontend (Botão)
    ↓
medical-desk-launch.js
    ↓
POST /api/medicaldesk/session
    ↓
Backend cria JWT token
    ↓
Retorna launchUrl: /medicaldesk/app?token=...
    ↓
Proxy reverso para serviço real
    ↓
MedicalDesk exibido ao médico
```

### Componentes

1. **Backend (Express)** - `apps/telemed-deploy-ready/server.js`
   - Endpoints de API
   - Geração de JWT
   - Proxy reverso

2. **Frontend (Launcher)** - `apps/telemed-deploy-ready/js/medical-desk-launch.js`
   - Lógica de abertura
   - Fallback automático
   - Event delegation

3. **Páginas Integradas:**
   - `/demo-medico.html` - Demo médico
   - `/consulta/index.html` - Consulta ativa
   - `/dashboard-medico.html` - Dashboard

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` e configure:

```bash
# Habilitar/desabilitar integração
FEATURE_MEDICALDESK=true

# URL base do serviço MedicalDesk (sem trailing slash)
MEDICALDESK_URL=https://seu-medicaldesk.exemplo.com

# Chave JWT (gere uma forte!)
# Comando: openssl rand -base64 32
JWT_SECRET=YOUR_STRONG_RANDOM_SECRET_HERE

# Porta do servidor (opcional)
PORT=5000
```

### 2. Configurar no Replit Secrets

Para produção, adicione nos **Replit Secrets**:
- `FEATURE_MEDICALDESK`
- `MEDICALDESK_URL`
- `JWT_SECRET`

### 3. Dependências

Já incluídas no projeto:
- `express` - Servidor HTTP
- `jsonwebtoken` - Geração de JWT
- `http-proxy-middleware` - Proxy reverso

---

## 🚀 Como Usar

### Adicionar Botão em Página HTML

```html
<!-- 1. Adicionar botão com atributos data -->
<button 
  data-open-medicaldesk 
  data-patient-id="paciente-123" 
  data-doctor-id="medico-456"
  data-testid="button-open-medicaldesk">
  🏥 Abrir MedicalDesk
</button>

<!-- 2. Incluir script launcher (antes do </body>) -->
<script src="/js/medical-desk-launch.js" defer></script>
```

### Abrir Programaticamente

```javascript
// Usar função global
window.openMedicalDesk({
  patientId: 'paciente-123',
  doctorId: 'medico-456'
});
```

### Atributos do Botão

| Atributo | Obrigatório | Descrição |
|----------|-------------|-----------|
| `data-open-medicaldesk` | ✅ Sim | Identificador do launcher |
| `data-patient-id` | ⚠️ Opcional | ID do paciente (padrão: 'paciente-test') |
| `data-doctor-id` | ⚠️ Opcional | ID do médico (padrão: 'medico-demo') |
| `data-testid` | ❌ Não | Para testes E2E |

---

## 📡 APIs

### GET `/api/medicaldesk/feature`

Retorna status da feature flag.

**Response:**
```json
{
  "feature": true,
  "hasBase": true
}
```

### POST `/api/medicaldesk/session`

Cria sessão JWT e retorna URL de launch.

**Request Body:**
```json
{
  "patientId": "paciente-123",
  "doctorId": "medico-456"
}
```

**Response (Success - 200):**
```json
{
  "ok": true,
  "launchUrl": "/medicaldesk/app?token=eyJhbGciOi..."
}
```

**Response (Feature Disabled - 503):**
```json
{
  "ok": false,
  "error": "MedicalDesk desabilitado"
}
```

**Response (Missing Params - 400):**
```json
{
  "ok": false,
  "error": "patientId e doctorId são obrigatórios"
}
```

### PROXY `/medicaldesk/*`

Proxy reverso para o serviço MedicalDesk real.

**Exemplo:**
- Request: `GET /medicaldesk/app?token=...`
- Proxied to: `https://seu-medicaldesk.com/app?token=...`

---

## 🔍 Troubleshooting

### Botão não funciona

**Problema:** Click no botão não faz nada

**Soluções:**
1. Verificar se script está carregado:
   ```javascript
   console.log(window.openMedicalDesk); // deve retornar função
   ```

2. Verificar atributos do botão:
   ```html
   <!-- ❌ Errado -->
   <button data-open-medical-desk>...</button>
   
   <!-- ✅ Correto -->
   <button data-open-medicaldesk>...</button>
   ```

3. Verificar console do browser para erros

### Sempre abre página demo

**Problema:** Sempre cai no fallback mesmo com feature habilitada

**Soluções:**
1. Verificar variáveis de ambiente:
   ```bash
   FEATURE_MEDICALDESK=true  # não 'false'
   MEDICALDESK_URL=https://...  # URL válida
   ```

2. Testar endpoint:
   ```bash
   curl http://localhost:5000/api/medicaldesk/feature
   # Deve retornar: {"feature":true,"hasBase":true}
   ```

3. Ver logs do servidor:
   ```
   📊 MedicalDesk feature: ENABLED  # deve aparecer no startup
   ```

### Erro 503 Service Unavailable

**Problema:** API retorna 503

**Causa:** `FEATURE_MEDICALDESK=false` ou `MEDICALDESK_URL` vazio

**Solução:** Configurar variáveis corretamente

### Erro de JWT

**Problema:** Token inválido ou expirado

**Soluções:**
1. Verificar `JWT_SECRET` configurado
2. Token expira em 15 minutos - gerar novo
3. Verificar logs do servidor para erros de assinatura

### Erro de Proxy

**Problema:** 502 Bad Gateway

**Causas possíveis:**
- Serviço MedicalDesk indisponível
- URL incorreta em `MEDICALDESK_URL`
- Problemas de rede/firewall

**Debug:**
```javascript
// Ver logs no servidor
[MedicalDesk Proxy Error] ECONNREFUSED
```

---

## 🧪 Testes

### Testar Manualmente

1. **Feature Flag:**
   ```bash
   curl http://localhost:5000/api/medicaldesk/feature
   ```

2. **Criar Sessão:**
   ```bash
   curl -X POST http://localhost:5000/api/medicaldesk/session \
     -H "Content-Type: application/json" \
     -d '{"patientId":"test","doctorId":"doc"}'
   ```

3. **Abrir no Browser:**
   - Ir para `/demo-medico.html`
   - Click em "🏥 Abrir MedicalDesk"
   - Verificar nova aba

### Testar com Playwright

```javascript
// Exemplo de teste E2E
await page.goto('/demo-medico.html');
await page.click('[data-testid="button-open-medicaldesk"]');
// Verificar popup aberto
```

---

## 📚 Páginas com Integração

| Página | Botão | Contexto |
|--------|-------|----------|
| `/demo-medico.html` | ✅ Sim | Card de ferramentas médicas |
| `/consulta/index.html` | ✅ Sim | Topbar da consulta ativa |
| `/dashboard-medico.html` | ✅ Sim | Topbar do dashboard |

---

## 🔐 Segurança

### JWT Token

- **Algoritmo:** HS256
- **Duração:** 15 minutos
- **Payload:**
  ```json
  {
    "sub": "medico-456",
    "patientId": "paciente-123",
    "role": "doctor",
    "iss": "telemed",
    "exp": 1234567890
  }
  ```

### Boas Práticas

1. **JWT_SECRET:**
   - Mínimo 32 caracteres
   - Gerar com: `openssl rand -base64 32`
   - Nunca commitar no git

2. **URLs:**
   - Sempre usar HTTPS em produção
   - Validar origem das requisições

3. **Proxy:**
   - Header `X-From-TeleMed: true` adicionado
   - Logs de erros no servidor

---

## 📝 Changelog

### v1.0.0 (Oct 10, 2025)
- ✅ Integração inicial completa
- ✅ Backend Express + JWT + Proxy
- ✅ Frontend launcher com fallback
- ✅ Botões em 3 páginas principais
- ✅ Testes E2E validados
- ✅ Documentação completa

---

## 🤝 Suporte

Para problemas ou dúvidas:
1. Verificar este README
2. Ver logs do servidor
3. Testar APIs manualmente
4. Abrir issue no repositório

---

**Desenvolvido com ❤️ pela equipe TeleMed**
