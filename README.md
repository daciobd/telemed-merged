# Telemed Merge — Caio (Monorepo)

Repositório de trabalho **isolado** para o Caio, espelhando o Telemed Merge e permitindo evolução sem afetar o original.

## Sumário
- [Arquitetura](#arquitetura)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Execução (dev)](#execução-dev)
- [Healthcheck](#healthcheck)
- [Testes](#testes)
- [Build/Prod](#buildprod)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Padrões de Branch/PR](#padrões-de-branchpr)
- [Deploy (Replit/Render/Vercel)](#deploy-replitrendervercel)
- [Troubleshooting](#troubleshooting)

---

## Arquitetura

Monorepo **Node.js/TypeScript** com múltiplos serviços em `apps/`:

```
apps/
├─ auction-service/            # Leilões / gerenciamento de bids & agendamentos
├─ medical-desk-advanced/      # Atendimento médico (desk avançado)
├─ productivity-service/       # Produtividade (tarefas, agendas, etc.)
├─ telemed-deploy-ready/       # Frontend principal
├─ telemed-docs-automation/    # Automação de documentos (receitas, laudos)
├─ telemed-gateway/            # API Gateway / BFF
└─ telemed-internal/           # Serviços internos
```

> Observação: alguns serviços possuem `package.json` próprio. O repositório raiz também possui `package.json` e *lockfile*.

Arquivos de apoio na raiz:
- `.replit` / `replit.md` — configuração/guia Replit
- `render.yaml` — config de deploy no Render (se aplicável)
- `production.js` — script auxiliar para modo produção (quando usado)
- `tests/` e `test results/` — base de testes e relatórios
- `attached_assets/` — assets úteis para docs/guias
- `.github/workflows/` — CI (GitHub Actions)

---

## Pré-requisitos
- **Node.js** LTS (≥ 18)  
- **Gerenciador de pacotes:** `npm` (ou `pnpm` / `yarn`, de acordo com o lockfile presente)
- **Git**
- (Opcional) Docker

> **Importante:** use o **mesmo gerenciador** do lockfile presente (`package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn).

---

## Instalação

Na raiz do repositório:

```bash
# npm
npm ci

# ou pnpm
# pnpm install --frozen-lockfile

# ou yarn
# yarn install --frozen-lockfile
```

Se algum serviço exigir instalação adicional, entre na pasta do serviço e rode o gerenciador correspondente.

---

## Execução (dev)

Execute a aplicação (root) em modo desenvolvimento:

```bash
# Exemplo usando npm scripts do root
npm run dev
```

Para subir **um serviço específico**:

```bash
# Exemplo (ajuste conforme scripts dos apps)
cd apps/telemed-gateway
npm run dev
```

Front-end principal (exemplo):

```bash
cd apps/telemed-deploy-ready
npm run dev
```

---

## Healthcheck

- Endpoint padrão sugerido: `GET /health` retornando `200 OK` com payload simples.  
- Se houver script no root:
```bash
npm run healthcheck
```

---

## Testes

```bash
# todos os testes
npm test

# teste de um serviço
cd apps/telemed-internal
npm test
```

Relatórios (se configurados) ficam em `test results/`.

---

## Build/Prod

```bash
# build de todos (ajuste para o seu monorepo)
npm run build

# iniciar produção (exemplo)
npm start
# ou node production.js
```

Cada serviço pode possuir seus próprios scripts de build/start. Verifique o `package.json` do serviço.

---

## Variáveis de Ambiente

Crie seu `.env` **a partir** de `.env.example`:

```bash
cp .env.example .env
# preencha as chaves conforme seu ambiente
```

Principais chaves (resumo):
- **PORT**, **NODE_ENV**, **APP_BASE_URL**
- **DATABASE_URL** e **REDIS_URL** (se usados)
- **JWT_SECRET** / **SESSION_SECRET**
- **SMTP_*** para e-mail
- **ANVISA_*** / **E_PRESCRIPTION_*** (quando integrar a receitas digitais)
- Prefixos por serviço (ex.: `GATEWAY_`, `INTERNAL_`, `AUCTION_`, `PRODUCTIVITY_`, `FRONTEND_`, `DOCS_AUTOMATION_`)

> Veja o arquivo **.env.example** com todos os placeholders.

---

## Padrões de Branch/PR

- Branches:
  - `feature/<nome-curto>`
  - `fix/<ticket>`
  - `chore/<tarefa>`
- PRs para `main` com:
  - descrição clara
  - checklist de testes/healthcheck
  - **opcional:** link de preview (deploy)

Proteções recomendadas para `main`: exigir PR + 1 review + status checks.

---

## Deploy (Replit/Render/Vercel)

### Replit
1. Configure **Secrets** com as variáveis do `.env`.
2. Verifique `.replit` (run command) e `replit.nix` (se usado).
3. Rode e compartilhe o URL público.

### Render
- Use `render.yaml` ou crie Web Service apontando para este repo.
- Defina as **Environment Variables** com base no `.env.example`.
- *Optional:* ativar auto-deploy em push para `main` e *PR Previews*.

### Vercel/Netlify (frontend)
- Conectar ao repo, selecionar `apps/telemed-deploy-ready` como *framework root* (se aplicável).
- Definir variáveis e habilitar *Preview Deployments*.

---

## Troubleshooting

- **Porta em uso** → ajuste `PORT` no `.env` ou nos scripts de start.  
- **Falha em build** → confirme versão do Node e lockfile/gerenciador correto.  
- **Receitas digitais/ANVISA** → verifique as chaves `ANVISA_*`/`E_PRESCRIPTION_*` e endpoints.  
- **CORS** no gateway → confira `GATEWAY_CORS_ORIGINS`.  
- **Timeouts** → aumente `REQUEST_TIMEOUT_MS` e revise o proxy do gateway.

---

**Owner:** @daciobd  
**Repo de trabalho do Caio:** telemed-merge-caio