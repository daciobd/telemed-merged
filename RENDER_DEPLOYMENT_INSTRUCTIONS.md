# 🚀 Instruções de Deploy no Render - TeleMed Merged

## Status Atual
✅ Código da raiz está 100% correto:
- `index.js` → importa `./apps/telemed-internal/src/index.js`
- `server.js` → importa `./index.js`  
- `package.json` → scripts: `"start": "node server.js"`

## O Problema Atual
No Render, o serviço ainda está rodando o código **VELHO** (telemed-internal) que tenta importar OpenAI e falha:

```
🚀 Iniciando TeleMed Internal Gateway...
📁 Gateway: /opt/render/project/src/apps/telemed-internal/src/index.js
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'openai'
```

Isso acontece porque o Render aponta para a pasta errada.

## Solução: Opção A (Recomendada) - Novo Serviço

### Passo 1: Criar novo serviço no Render
1. Vá em https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte o repositório (escolha `telemed-merged`)

### Passo 2: Configurar o serviço

**Name:** `telemed-merged` (ou similar)

**Environment:** `Node`

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm run start
```

**Root Directory:** Deixe **EM BRANCO** (é a raiz do repo)

### Passo 3: Adicionar variáveis de ambiente

Clique em **"Environment"** e adicione:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `SERVICE_NAME` | `telemed-merged` |
| `PORT` | `10000` (ou deixar vazio para usar PORT padrão) |
| `DATABASE_URL` | Cole a URL do PostgreSQL do seu banco |
| `JWT_SECRET` | Gere uma string longa e aleatória (ex: `openssl rand -hex 32`) |

### Passo 4: Deploy

Clique em **"Deploy"** e aguarde.

## Como Confirmar que Está Correto

Depois do deploy, abra os **Logs** do serviço. Se vir algo assim = **SUCESSO**:

```
> start
> node server.js
[telemed] listening on 0.0.0.0:5000
✅ Rotas do Consultório Virtual carregadas em /api/consultorio/*
✅ Rotas de Virtual Office carregadas em /api/virtual-office/*
```

**NÃO deve mais aparecer:**
- `Iniciando TeleMed Internal Gateway`
- `Cannot find package 'openai'`

## Solução: Opção B (Rápida) - Modificar Serviço Existente

Se você quer aproveitar o serviço atual que está falhando:

1. Vá em **Settings** do serviço atual
2. Em **Root Directory**: Mude para raiz (deixe **EM BRANCO**)
3. Em **Start Command**: Mude para `npm run start`
4. Redeploy

## Passo Após Novo Deploy

Após criar o novo serviço (Opção A):
- ✅ O novo serviço `telemed-merged` estará rodando na nova URL
- ⚠️ O serviço antigo `telemed-internal` pode ser **suspendido** ou **deletado** se não for mais usado

---

**Resultado Final:** Sistema novo rodando com Consultório Virtual, React Query, Wouter, JWT Auth — tudo 100% funcional! 🎉
