# 🏥 Medical Desk Advanced - Protocolos Clínicos

Serviço standalone de protocolos clínicos para demonstrações em hospitais.

## 📋 **Visão Geral**

Este serviço fornece:
- ✅ **Dashboard React interativo** em `/medicaldesk/` (frontend moderno)
- ✅ **Interface standalone** em `/` para apresentações rápidas
- ✅ **API de protocolos clínicos** com 5 condições médicas
- ✅ **Zero dependências externas** - dados MOCK integrados
- ✅ **Pronto para deploy no Render** - configurado para produção

### **Duas Interfaces:**

1. **Standalone HTML** (`/`) - Lista simples de protocolos para demos rápidas
2. **Dashboard React** (`/medicaldesk/`) - Interface completa e interativa

---

## 🎯 **Link de Demonstração**

Após deploy no Render, o serviço estará disponível em:

```
https://medical-desk-advanced.onrender.com/
```

Este link pode ser usado diretamente em apresentações em hospitais, **sem passar pelo TeleMed**.

---

## 🚀 **Deploy no Render (Passo a Passo)**

### **Pré-requisitos**
- Conta no [Render.com](https://render.com)
- Repositório Git com este código (ex: GitHub, GitLab)

### **Passo 1: Build do Frontend React**

⚠️ **IMPORTANTE:** Antes de fazer deploy, você precisa buildar o frontend React!

```bash
# Entrar na pasta client
cd apps/medical-desk-advanced/client

# Instalar dependências
npm install

# Fazer build
npm run build

# Verificar
ls -la dist/
```

**Leia o guia completo:** [`BUILD_GUIDE.md`](./BUILD_GUIDE.md)

### **Passo 2: Criar Web Service no Render**

1. Acesse o [Dashboard do Render](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git (ex: `telemed-merged`)
4. Configure o serviço:

   ```yaml
   Name: medical-desk-advanced
   Environment: Node
   Region: Oregon (US West) ou São Paulo (South America)
   Branch: main
   Root Directory: apps/medical-desk-advanced
   Build Command: cd client && npm install && npm run build && cd .. && npm install
   Start Command: npm start
   Instance Type: Free (ou superior)
   ```

   **Observação:** O Build Command faz o build do React e instala as dependências do backend.

5. **Variáveis de Ambiente** (opcional):
   - `NODE_ENV=production`
   - `SERVICE_NAME=medical-desk-advanced`
   - `PORT=10000` (automático no Render)

6. Clique em **"Create Web Service"**

### **Passo 3: Aguardar Deploy**

O Render irá:
1. Fazer clone do repositório
2. Executar `npm install`
3. Iniciar o serviço com `npm start`
4. Gerar o URL público (ex: `https://medical-desk-advanced.onrender.com`)

**Tempo estimado:** 3-6 minutos (inclui build do React)

### **Passo 4: Validar Deploy**

Acesse:
- **Standalone:** `https://medical-desk-advanced.onrender.com/`
- **Dashboard React:** `https://medical-desk-advanced.onrender.com/medicaldesk/`
- **API Health:** `https://medical-desk-advanced.onrender.com/api/health`

Você deve ver ambas as interfaces funcionando.

---

## 🔗 **Endpoints da API**

### **1. Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "medical-desk-advanced",
  "time": "2025-11-19T18:00:00.000Z"
}
```

### **2. Buscar Protocolo**
```http
GET /api/protocols/:condition
```

**Parâmetros:**
- `condition` (string): Nome da condição clínica (lowercase)

**Condições disponíveis:**
- `hipertensao` - Hipertensão Arterial Sistêmica
- `diabetes` - Diabetes Mellitus Tipo 2
- `iam` - Infarto Agudo do Miocárdio
- `asma` - Asma Brônquica
- `pneumonia` - Pneumonia Comunitária

**Exemplo:**
```bash
curl https://medical-desk-advanced.onrender.com/api/protocols/hipertensao
```

**Response (200 OK):**
```json
{
  "success": true,
  "protocol": {
    "name": "Hipertensão Arterial Sistêmica",
    "description": "...",
    "diagnosis": { "criteria": "...", "exams": [...] },
    "treatment": { "lifestyle": [...], "medications": [...] },
    "followup": { "frequency": "...", "monitoring": [...] }
  },
  "source": "medical-desk-advanced",
  "timestamp": "2025-11-19T18:00:00.000Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Protocolo não encontrado",
  "message": "Condições disponíveis: hipertensao, diabetes, iam, asma, pneumonia",
  "available": ["hipertensao", "diabetes", "iam", "asma", "pneumonia"],
  "source": "medical-desk-advanced"
}
```

### **3. MDA Routes (Alias)**
```http
GET /api/mda/health
GET /api/mda/protocols/:condition
```

Rotas alternativas para compatibilidade com integrações existentes.

---

## 🧪 **Testes Locais**

Para testar localmente antes do deploy:

### **1. Instalar dependências**
```bash
cd apps/medical-desk-advanced
npm install
```

### **2. Iniciar servidor**
```bash
npm start
```

O serviço rodará em `http://localhost:5000`

### **3. Testar API**
```bash
# Health check
curl http://localhost:5000/api/health

# Protocolo de hipertensão
curl http://localhost:5000/api/protocols/hipertensao | jq

# Todos os protocolos
for cond in hipertensao diabetes iam asma pneumonia; do
  echo "▶ $cond:"
  curl -s "http://localhost:5000/api/protocols/$cond" | jq -r '.protocol.name'
done
```

### **4. Abrir interface**
```
http://localhost:5000/
```

---

## 📁 **Estrutura de Arquivos**

```
apps/medical-desk-advanced/
├── src/
│   ├── index.js              # Servidor Express + API de protocolos
│   ├── features/
│   │   └── featureFlags.js   # Configuração de feature flags
│   ├── monitoring/
│   │   └── metrics.js        # Sistema de métricas
│   └── routes/
│       └── mda.js            # Rotas MDA adicionais
├── public/
│   └── medical-desk-standalone.html  # Interface web standalone
├── package.json              # Dependências e scripts
└── README.md                 # Este arquivo
```

---

## 🔧 **Configuração CORS**

O serviço aceita requests de:
- `https://telemed-deploy-ready.onrender.com` (produção TeleMed)
- `http://localhost:5000` (desenvolvimento local)

Para adicionar novos origins:

```javascript
// src/index.js
app.use(cors({ 
  origin: [
    'https://telemed-deploy-ready.onrender.com',
    'http://localhost:5000',
    'https://seu-novo-dominio.com'  // ← Adicionar aqui
  ],
  credentials: true
}));
```

---

## 🌐 **Domínio Customizado (Opcional)**

Para usar um domínio profissional (ex: `medicaldesk.seuhospital.com`):

1. No Render, acesse o serviço → aba **"Settings"**
2. Role até **"Custom Domain"**
3. Clique em **"Add Custom Domain"**
4. Configure o DNS do seu domínio:
   ```
   CNAME medicaldesk  →  medical-desk-advanced.onrender.com
   ```
5. Aguarde propagação DNS (5-30 minutos)

---

## 📊 **Monitoramento**

### **Logs do Render**
- Acesse o serviço → aba **"Logs"**
- Visualize requests em tempo real
- Procure por `[PROTOCOLS] Servindo protocolo:` para ver buscas

### **Métricas Disponíveis**
O serviço inclui sistema de métricas básico:
- Contadores de requests por endpoint
- Logs estruturados em JSON
- Feature flags configuráveis

---

## 🚨 **Troubleshooting**

### **Problema: "Cannot GET /"**
**Causa:** O arquivo `public/medical-desk-standalone.html` não foi encontrado.

**Solução:**
1. Verifique se o arquivo existe em `apps/medical-desk-advanced/public/`
2. Confirme que o `Root Directory` no Render está correto: `apps/medical-desk-advanced`
3. Faça commit + push de qualquer mudança
4. Aguarde redeploy automático

### **Problema: API retorna 404 para protocolo válido**
**Causa:** Nome da condição não está em lowercase ou tem espaços.

**Solução:**
Use nomes exatos em lowercase:
- ✅ `hipertensao` 
- ❌ `Hipertensão` ou `hipertensão arterial`

### **Problema: CORS error no frontend**
**Causa:** Origin do request não está na whitelist.

**Solução:**
Adicione o origin em `src/index.js` (linha 16) e faça redeploy.

---

## 📝 **Atualizações e Deploy Contínuo**

O Render faz redeploy automático quando você faz `git push` na branch configurada.

### **Workflow recomendado:**
```bash
# 1. Fazer mudanças
vim apps/medical-desk-advanced/src/index.js

# 2. Testar localmente
cd apps/medical-desk-advanced
npm start

# 3. Commit e push
git add .
git commit -m "feat: adicionar novo protocolo clínico"
git push origin main

# 4. Acompanhar deploy no Render
# Dashboard → medical-desk-advanced → Events
```

---

## 🎉 **Conclusão**

Este serviço está **100% pronto para produção** no Render!

**Próximos passos sugeridos:**
1. ✅ Deploy no Render seguindo o passo-a-passo acima
2. ✅ Validar URL público funcionando
3. ✅ Compartilhar link em apresentações: `https://medical-desk-advanced.onrender.com/`
4. (Opcional) Configurar domínio customizado
5. (Opcional) Adicionar mais protocolos clínicos em `src/index.js`

---

**TeleMed Platform • Medical Desk Advanced Service**  
v2.0 • 2025
