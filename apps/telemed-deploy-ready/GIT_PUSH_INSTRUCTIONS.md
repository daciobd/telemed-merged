# 📤 Instruções para Git Push

## ✅ Arquivos Adicionados/Modificados

### Novos Arquivos (prontos para commit):
```
apps/telemed-deploy-ready/
├── dr-ai-demo.html                          # ✨ Demo automática web
├── .env.example                              # Template de variáveis de ambiente
├── QUICKSTART.md                             # Guia de início rápido
├── DEMO_GUIDE.md                             # Guia detalhado de demonstração
├── IMPLEMENTATION_SUMMARY.md                 # Sumário executivo
├── GIT_PUSH_INSTRUCTIONS.md                  # Este arquivo
├── routes/demo.js                            # Rotas de demonstração
├── migrations/002_add_specialty_to_encounters.sql  # Nova migration
└── public/dr-ai-demo.html                    # Cópia da demo (backup)
```

### Arquivos Modificados:
```
apps/telemed-deploy-ready/
├── server.js                                 # Adicionadas rotas /demo/*
└── replit.md (raiz)                          # Documentação atualizada
```

## 🚀 Como Fazer Push para seu Repositório

### 1. Verificar Status
```bash
git status
```

### 2. Adicionar Arquivos Novos
```bash
cd apps/telemed-deploy-ready

# Adicionar arquivos específicos
git add dr-ai-demo.html
git add .env.example
git add QUICKSTART.md
git add DEMO_GUIDE.md
git add IMPLEMENTATION_SUMMARY.md
git add GIT_PUSH_INSTRUCTIONS.md
git add routes/demo.js
git add migrations/002_add_specialty_to_encounters.sql
git add public/dr-ai-demo.html
git add server.js
```

### 3. Adicionar Documentação Atualizada
```bash
cd ../../  # Voltar para raiz
git add replit.md
```

### 4. Commit
```bash
git commit -m "feat: Add Dr. AI automated demo with load testing

- Add automated demo page (dr-ai-demo.html) with 6 test scenarios
- Add /demo/seed and /demo/spike endpoints for testing
- Add specialty column to encounters table (migration 002)
- Add comprehensive documentation (QUICKSTART, DEMO_GUIDE)
- Add Prometheus metrics and observability features
- Update server.js with demo routes
- Add .env.example template for environment variables

Features:
✅ Automated demo with autoplay
✅ LGPD-compliant logging (truncation + SHA-256 hash)
✅ Rate limiting with Redis/in-memory fallback
✅ 9 custom Prometheus metrics
✅ Grafana dashboard ready
✅ Load testing with k6 support
✅ Security policies (37 emergency keywords, 16 new symptoms)"
```

### 5. Push para Repositório
```bash
git push origin main
```

Ou se você usa uma branch específica:
```bash
git push origin sua-branch
```

## 📋 Checklist Pré-Push

Antes de fazer push, verifique:

- [ ] `.env` **NÃO** está sendo commitado (só `.env.example`)
- [ ] Todos os testes estão passando
- [ ] Demo automática funcionando em `/dr-ai-demo.html?autoplay=1`
- [ ] Métricas Prometheus acessíveis em `/metrics`
- [ ] Sem credenciais hardcoded no código
- [ ] Logs não contêm dados sensíveis
- [ ] Migrations SQL estão validadas

## 🔒 Arquivos que NÃO devem ser commitados

**IMPORTANTE**: Adicione ao `.gitignore` se ainda não estiver:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Secrets
*.pem
*.key
secrets/

# Database
*.db
*.sqlite

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

## 🎯 Próximos Passos (Após Push)

### 1. Configurar CI/CD
Se você quer automatizar deploys, configure GitHub Actions:
- O bundle incluía workflows em `.github/workflows/`
- Adapte para seu ambiente (Render, Vercel, etc.)

### 2. Configurar Secrets no GitHub
No repositório GitHub, vá em **Settings** → **Secrets and variables** → **Actions**:

Adicione:
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL` (opcional)
- `AWS_ACCESS_KEY_ID` (se usar S3)
- `AWS_SECRET_ACCESS_KEY` (se usar S3)

### 3. Deploy em Staging/Produção

**Render.com** (recomendado):
```bash
# 1. Conecte seu repositório no Render
# 2. Configure as variáveis de ambiente
# 3. Deploy automático a cada push
```

**Replit** (desenvolvimento):
```bash
# Já está rodando!
# URL: https://seu-repl.repl.co
```

### 4. Configurar Grafana

1. Importe o dashboard: `observability/grafana-telemed-dr-ai-dashboard.json`
2. Configure datasource apontando para `/metrics`
3. Copie a URL do dashboard
4. Acesse demo com: `/dr-ai-demo.html?autoplay=1&grafana=URL_GRAFANA`

## 📊 Validação Pós-Deploy

Após fazer push e deploy, valide:

1. **Demo Automática**:
   ```bash
   curl https://seu-dominio.com/dr-ai-demo.html
   ```

2. **Endpoints**:
   ```bash
   # Seed
   curl -X POST https://seu-dominio.com/demo/seed
   
   # AI Answer
   curl -X POST https://seu-dominio.com/api/ai/answer \
     -H "Content-Type: application/json" \
     -d '{"patientId": 1, "question": "test"}'
   ```

3. **Métricas**:
   ```bash
   curl https://seu-dominio.com/metrics | grep ai_
   ```

## 🆘 Troubleshooting

### Erro: "Migrations não aplicadas"
```bash
# Aplicar manualmente
psql $DATABASE_URL -f migrations/001_ai_interactions.sql
psql $DATABASE_URL -f migrations/002_add_specialty_to_encounters.sql
```

### Erro: "OPENAI_API_KEY não definida"
```bash
# Verificar variável de ambiente
echo $OPENAI_API_KEY

# Se vazio, adicionar ao .env ou secrets do Replit
```

### Erro: "Rate limit ativo mas sem Redis"
```bash
# Normal! O sistema usa fallback in-memory
# Para usar Redis, configure REDIS_URL
```

## 📞 Suporte

- **Documentação**: `QUICKSTART.md`, `DEMO_GUIDE.md`
- **Implementação**: `IMPLEMENTATION_SUMMARY.md`
- **Issues**: Abra issue no GitHub com logs e descrição

---

**Pronto para Push!** 🚀  
Execute os comandos acima para enviar ao seu repositório.
