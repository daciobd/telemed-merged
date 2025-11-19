# 🚀 Guia Rápido de Deploy no Render

## ✅ **Checklist Pré-Deploy**

Antes de fazer deploy, confirme:

- [x] Código está em um repositório Git (GitHub, GitLab, etc.)
- [x] Arquivo `src/index.js` serve HTML em `/`
- [x] Arquivo `public/medical-desk-standalone.html` existe
- [x] `package.json` tem script `"start": "node src/index.js"`
- [x] Todos os 5 protocolos estão implementados

---

## 📋 **Passo a Passo Completo**

### **1️⃣ Preparar Repositório**

```bash
# Garantir que está na branch correta
git status

# Adicionar mudanças (se houver)
git add .
git commit -m "Preparar Medical Desk Advanced para deploy"
git push origin main
```

---

### **2️⃣ Criar Serviço no Render**

1. Acesse: https://dashboard.render.com
2. Clique: **"New +"** → **"Web Service"**
3. Conecte: Seu repositório Git
4. Selecione: A branch `main` (ou a que você usa)

---

### **3️⃣ Configurar Serviço**

**Copie e cole estas configurações:**

```yaml
Name: medical-desk-advanced
Environment: Node
Region: São Paulo (South America)  # ou Oregon (US West)
Branch: main
Root Directory: apps/medical-desk-advanced
Build Command: npm install
Start Command: npm start
```

**Advanced Settings (opcional):**

```yaml
Auto-Deploy: Yes
Health Check Path: /api/health
```

**Environment Variables (opcional):**

```
NODE_ENV=production
SERVICE_NAME=medical-desk-advanced
```

---

### **4️⃣ Iniciar Deploy**

1. Clique: **"Create Web Service"**
2. Aguarde: Deploy completar (2-5 minutos)
3. Acompanhe: Logs em tempo real na aba "Logs"

**Mensagens esperadas nos logs:**
```
Running build command 'npm install'...
✓ Dependencies installed
Running 'npm start'
🚀 Starting Medical Desk Advanced Service...
[medical-desk-advanced] listening on :10000
```

---

### **5️⃣ Validar Deploy**

Quando o status mudar para **"Live"**, teste:

#### **A) Interface Web**
Abra: `https://medical-desk-advanced.onrender.com/`

**Deve exibir:**
- ✅ Título: "🏥 Medical Desk Advanced"
- ✅ Badge verde: "✅ Serviço Online"
- ✅ Lista de 5 protocolos
- ✅ Endpoints da API

#### **B) API Health**
```bash
curl https://medical-desk-advanced.onrender.com/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "medical-desk-advanced",
  "time": "2025-11-19T..."
}
```

#### **C) API de Protocolos**
```bash
curl https://medical-desk-advanced.onrender.com/api/protocols/hipertensao
```

**Resposta esperada:**
```json
{
  "success": true,
  "protocol": {
    "name": "Hipertensão Arterial Sistêmica",
    ...
  },
  "source": "medical-desk-advanced"
}
```

---

## 🎯 **URLs Finais**

Após deploy bem-sucedido, você terá:

| Recurso | URL |
|---------|-----|
| **Interface Standalone** | `https://medical-desk-advanced.onrender.com/` |
| **Health Check** | `https://medical-desk-advanced.onrender.com/api/health` |
| **Protocolo Hipertensão** | `https://medical-desk-advanced.onrender.com/api/protocols/hipertensao` |
| **Protocolo Diabetes** | `https://medical-desk-advanced.onrender.com/api/protocols/diabetes` |
| **Protocolo IAM** | `https://medical-desk-advanced.onrender.com/api/protocols/iam` |
| **Protocolo Asma** | `https://medical-desk-advanced.onrender.com/api/protocols/asma` |
| **Protocolo Pneumonia** | `https://medical-desk-advanced.onrender.com/api/protocols/pneumonia` |

---

## 🔄 **Atualizações Futuras**

O Render faz **redeploy automático** quando você faz `git push`.

### **Workflow de atualização:**

```bash
# 1. Fazer mudanças
vim apps/medical-desk-advanced/src/index.js

# 2. Commit
git add .
git commit -m "Adicionar novo protocolo"

# 3. Push → Deploy automático!
git push origin main
```

**Acompanhe:** Dashboard do Render → aba "Events"

---

## 🚨 **Erros Comuns e Soluções**

### **Erro: "Cannot GET /"**

**Causa:** Arquivo HTML não encontrado.

**Solução:**
1. Confirme que `public/medical-desk-standalone.html` existe
2. Verifique `Root Directory: apps/medical-desk-advanced`
3. Faça redeploy: Settings → Manual Deploy → "Deploy latest commit"

---

### **Erro: "Build failed"**

**Causa:** Dependências faltando ou erro no `package.json`.

**Solução:**
1. Teste localmente: `cd apps/medical-desk-advanced && npm install`
2. Confirme que `package.json` tem `"type": "module"`
3. Verifique logs de build no Render

---

### **Erro: "Service Unavailable"**

**Causa:** Servidor não está escutando na porta correta.

**Solução:**
Confirme em `src/index.js`:
```javascript
const port = process.env.PORT || 5000;  // ✅ Usa PORT do Render
app.listen(port, () => { ... });
```

---

### **Erro: API retorna 404**

**Causa:** Rota não registrada ou nome da condição incorreto.

**Solução:**
- Use lowercase: `hipertensao` ✅ (não `Hipertensão` ❌)
- Verifique se o protocolo existe em `src/index.js` linha 47+

---

## 📊 **Monitoramento Pós-Deploy**

### **Logs em Tempo Real**
```
Dashboard → medical-desk-advanced → Logs
```

**Procure por:**
- `[PROTOCOLS] Servindo protocolo:` → Requests de protocolos
- `listening on :10000` → Servidor iniciou
- Erros 404/500 → Problemas

### **Métricas do Render**
```
Dashboard → medical-desk-advanced → Metrics
```

**Visualize:**
- CPU usage
- Memory usage
- Bandwidth

---

## 🌐 **Domínio Customizado (Opcional)**

Quer usar `medicaldesk.seuhospital.com` em vez do Render?

### **Configuração:**

1. **No Render:**
   - Settings → Custom Domain → Add Custom Domain
   - Digite: `medicaldesk.seuhospital.com`
   - Copie o CNAME target

2. **No seu provedor DNS:**
   ```
   Type: CNAME
   Name: medicaldesk
   Target: medical-desk-advanced.onrender.com
   ```

3. **Aguarde:** Propagação DNS (5-30 minutos)

4. **Valide:** Acesse `https://medicaldesk.seuhospital.com/`

---

## ✅ **Checklist Final**

Após deploy, confirme:

- [ ] Interface acessível via link público
- [ ] API `/api/health` retorna `{"status": "ok"}`
- [ ] Todos os 5 protocolos acessíveis
- [ ] Logs do Render sem erros
- [ ] Link salvo para apresentações

---

## 🎉 **Pronto!**

Seu **Medical Desk Advanced** está no ar!

**Link para compartilhar:**
```
https://medical-desk-advanced.onrender.com/
```

Use este link diretamente em demonstrações em hospitais, sem passar pelo TeleMed.

---

**Dúvidas?** Consulte o [README.md](./README.md) completo.

**TeleMed Platform • Medical Desk Advanced**  
v2.0 • 2025
