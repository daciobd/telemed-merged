# 🏗️ Guia de Build - Medical Desk Advanced

Este guia explica como fazer o build do frontend React antes do deploy no Render.

---

## 📋 **Pré-requisitos**

- Node.js 20+ instalado
- npm ou yarn

---

## 🔨 **Build do Frontend React**

### **Passo 1: Navegar para a pasta do client**

```bash
cd apps/medical-desk-advanced/client
```

### **Passo 2: Instalar dependências**

```bash
npm install
```

**Dependências principais:**
- React 18
- React Router DOM
- TanStack Query
- TypeScript
- Vite
- Tailwind CSS

### **Passo 3: Fazer o build**

```bash
npm run build
```

**O que acontece:**
1. TypeScript compila o código
2. Vite cria o bundle otimizado
3. Arquivos são gerados em `client/dist/`

**Output esperado:**
```
vite v5.3.3 building for production...
✓ 234 modules transformed.
dist/index.html                   2.1 kB │ gzip:  0.8 kB
dist/assets/index-a1b2c3d4.css   12.3 kB │ gzip:  3.2 kB
dist/assets/index-e5f6g7h8.js   145.7 kB │ gzip: 47.2 kB
✓ built in 4.23s
```

### **Passo 4: Verificar o build**

```bash
ls -lh client/dist/
```

**Deve conter:**
- `index.html` - Arquivo principal
- `assets/` - CSS e JS bundleados
- Outros arquivos estáticos

---

## 🚀 **Build para Produção (Render)**

### **Opção 1: Build Automático no Render**

Configure o Render para fazer o build automaticamente:

```yaml
Build Command: cd client && npm install && npm run build && cd ..
```

**Vantagem:** Build sempre atualizado
**Desvantagem:** Deploy mais lento (2-3 minutos extras)

### **Opção 2: Build Local + Commit**

Faça o build localmente e commite a pasta `dist/`:

```bash
# 1. Build local
cd apps/medical-desk-advanced/client
npm install
npm run build

# 2. Verificar
ls -la dist/

# 3. Commit (REMOVER dist/ do .gitignore se necessário)
cd ../../..
git add apps/medical-desk-advanced/client/dist
git commit -m "Build frontend React"
git push

# 4. Deploy no Render
# Build Command: npm install (apenas backend)
```

**Vantagem:** Deploy rápido (30 segundos)
**Desvantagem:** Precisa rebuildar manualmente a cada mudança

---

## 🧪 **Testando o Build Localmente**

### **Método 1: Vite Preview**

```bash
cd apps/medical-desk-advanced/client
npm run build
npm run preview
# Acesse: http://localhost:4173/medicaldesk/
```

### **Método 2: Com o Backend Express**

```bash
# 1. Build do client
cd apps/medical-desk-advanced/client
npm run build

# 2. Iniciar backend
cd ..
npm start

# 3. Acessar
# Standalone: http://localhost:5000/
# Dashboard:  http://localhost:5000/medicaldesk/
```

---

## 📁 **Estrutura Pós-Build**

```
apps/medical-desk-advanced/
├── client/
│   ├── dist/                     ← BUILD GERADO AQUI
│   │   ├── index.html
│   │   └── assets/
│   │       ├── index-[hash].css
│   │       └── index-[hash].js
│   ├── src/                      ← Código fonte React
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── src/
│   └── index.js                  ← Backend Express (serve dist/)
└── ...
```

---

## 🔗 **Como o Backend Serve o Frontend**

No `src/index.js` (linhas 34-35, 168-170):

```javascript
// Servir build do React
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use('/medicaldesk', express.static(clientBuild));

// Fallback SPA routing
app.get('/medicaldesk/*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});
```

**Rotas:**
- `/` → Página standalone (HTML puro)
- `/medicaldesk/` → Dashboard React
- `/api/*` → API REST

---

## ⚙️ **Configuração do Vite**

O `vite.config.ts` está configurado com:

```typescript
export default defineConfig({
  base: "/medicaldesk/",  // ← Base path para o React
  build: {
    outDir: "dist",       // ← Pasta de output
  },
});
```

**Importante:** O `base` precisa ser `/medicaldesk/` para coincidir com a rota do Express!

---

## 🚨 **Problemas Comuns**

### **Erro: "Cannot GET /medicaldesk/"**

**Causa:** Build não foi feito ou pasta `dist/` está vazia.

**Solução:**
```bash
cd apps/medical-desk-advanced/client
npm run build
ls -la dist/  # Verificar se index.html existe
```

---

### **Erro: "Failed to resolve import"**

**Causa:** Dependências não instaladas.

**Solução:**
```bash
cd apps/medical-desk-advanced/client
npm install
npm run build
```

---

### **Erro: Rotas React não funcionam (404)**

**Causa:** Fallback SPA não configurado.

**Solução:** Verifique se `src/index.js` tem:
```javascript
app.get('/medicaldesk/*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});
```

---

### **Erro: CSS não carrega**

**Causa:** Base path incorreto no Vite.

**Solução:** Confirme em `vite.config.ts`:
```typescript
base: "/medicaldesk/",
```

---

## 📊 **Tamanho do Build**

**Estimativa:**
- `index.html`: ~2 KB
- CSS bundleado: ~12 KB (gzipped: ~3 KB)
- JS bundleado: ~145 KB (gzipped: ~47 KB)
- **Total:** ~160 KB (~50 KB gzipped)

---

## ✅ **Checklist de Build**

Antes de fazer deploy, confirme:

- [ ] `npm install` executado em `client/`
- [ ] `npm run build` executado com sucesso
- [ ] Pasta `client/dist/` existe e contém `index.html`
- [ ] Pasta `client/dist/assets/` contém CSS e JS
- [ ] Backend `src/index.js` está configurado para servir `dist/`
- [ ] Testado localmente com `npm start`

---

## 🎯 **Próximos Passos**

1. ✅ Build do frontend concluído
2. ✅ Backend configurado para servir o React
3. ✅ Testado localmente
4. → Deploy no Render (ver `DEPLOY_GUIDE.md`)

---

**TeleMed Platform • Medical Desk Advanced**  
v2.0 • 2025
