# 🚀 TeleMed Monorepo - Instruções de Deploy

## ✅ Configuração Completada

### 1. Config.js Frontend (✅ Criado)
- **Arquivo**: `apps/telemed-deploy-ready/js/config.js`
- **Conteúdo**: URLs dos serviços auction e productivity
- **Uso**: Importar antes dos scripts que fazem chamadas para APIs

```html
<script src="/js/config.js"></script>
<script src="/js/seu-script.js"></script>
```

### 2. CORS Configurado (✅ Implementado)
Todos os serviços Node.js agora têm CORS configurado:

- ✅ `apps/auction-service/src/index.js`
- ✅ `apps/telemed-internal/src/index.js` 
- ✅ `apps/productivity-service/src/index.js`

**Configuração aplicada:**
```javascript
const ORIGINS = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: ORIGINS.length ? ORIGINS : true,
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Internal-Token"]
}));
```

### 3. Dependências Atualizadas (✅ Feito)
- ✅ `cors` adicionado ao `telemed-internal/package.json`
- ✅ Todos os serviços têm as dependências necessárias

### 4. Render.yaml Atualizado (✅ Configurado)
- ✅ Variável `FRONTEND_ORIGIN` adicionada a todos os serviços
- ✅ URLs corretas dos serviços
- ✅ PostgreSQL database configurado para criação manual

## 🎯 Próximos Passos para Deploy

### 1. Criar PostgreSQL no Render Dashboard
```
Nome: telemed-db
Plano: Starter ou superior
Copiar DATABASE_URL após criação
```

### 2. Atualizar Secrets no render.yaml
```yaml
JWT_SECRET: [gerar secret forte - 32+ caracteres]
INTERNAL_TOKEN: [gerar token interno único]
OPENAI_API_KEY: [sua chave da OpenAI]
```

### 3. Deploy
```bash
git add .
git commit -m "Setup TeleMed monorepo with CORS"
git push origin main
```

### 4. Conectar no Render
- Conectar repositório GitHub
- Usar arquivo `render.yaml` para deploy automático
- Todos os 4 serviços serão deployados automaticamente

## 🔗 URLs dos Serviços (Após Deploy)
- **Frontend**: `https://telemed-deploy-ready.onrender.com`
- **Auction**: `https://telemed-auction.onrender.com`
- **Internal**: `https://telemed-internal.onrender.com`
- **Productivity**: `https://telemed-productivity.onrender.com`
- **Docs Automation**: `https://telemed-docs-automation.onrender.com`

## 📋 Estrutura Final
```
/
├── apps/
│   ├── telemed-deploy-ready/     # Frontend principal
│   │   └── js/config.js          # ✅ Config dos serviços
│   ├── auction-service/          # ✅ CORS configurado
│   ├── telemed-internal/         # ✅ CORS configurado  
│   ├── productivity-service/     # ✅ CORS configurado
│   └── telemed-docs-automation/  # ✅ NOVO: Geração de documentos
├── render.yaml                   # ✅ Deploy configurado
└── README.md
```

## 🧪 Teste Local (Exemplo)
Arquivo de exemplo criado: `apps/telemed-deploy-ready/example-integration.html`

**Tudo pronto para deploy!** 🎉