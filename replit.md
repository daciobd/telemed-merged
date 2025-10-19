# TeleMed Platform - Documentação Concisa

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina, consolidando três aplicações existentes em um monorepo com cinco microserviços. Ela oferece workflows de consulta, calculadoras médicas, prescrição digital, automação de documentos médicos com integração AWS S3, um sistema de triagem médica com IA (Dr. AI Medical Triage), e módulos plug-and-play para chat em consulta, gestão de pacientes, agendamento real e um widget de suporte. O projeto está completo e pronto para produção, focado em compliance com as regulamentações brasileiras de telemedicina.

## User Preferences
- **Linguagem**: Português brasileiro
- **Comunicação**: Linguagem simples e cotidiana
- **Contexto**: Telemedicina brasileira com compliance CFM

## System Architecture
A plataforma é composta por um monorepo com cinco microserviços Dockerizados, orquestrados para deploy no Render.

**Microserviços:**
-   **telemed-auth-server**: Autenticação JWT e gestão de usuários.
-   **telemed-calculator-api**: Calculadoras e ferramentas médicas.
-   **telemed-prescription-api**: Sistema de prescrições digitais e verificação farmacêutica.
-   **telemed-deploy-ready**: Frontend unificado em React.
-   **telemed-docs-automation**: Automação de documentos médicos (receitas e atestados CFM-compliant em PDF, com integração AWS S3 para URLs assinadas).

**Frontend:**
-   **Framework**: React com TypeScript, React Router, React Query + Context API.
-   **Estilo**: Tailwind CSS + componentes customizados.
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, filtros de busca, dashboard de métricas em tempo real, e um widget de suporte/ajuda. Inclui um sistema de temas Dark/Light e integração com MedicalDesk. O Dr. AI Medical Triage oferece interface LGPD-compliant, algoritmo de triagem por pattern-matching e sistema de "Red Flags". Integração de leilão/precificação com proxy local e feature flag.

**Backend:**
-   **Framework**: Express.js + TypeScript.
-   **Autenticação**: JWT + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM.
-   **Documentos**: PDFKit + Handlebars para geração de documentos com templates profissionais e QR Codes de verificação.
-   **Validação**: Zod schemas.

**Infraestrutura e Deploys:**
-   **Deploy**: Render (5 serviços configurados via `render.yaml`) com PostgreSQL gerenciado.
-   **Documentação API**: OpenAPI 3.1 Specification.
-   **Testes Automatizados**: Playwright Smoke Tests com 6 cenários críticos.
-   **CI/CD**: GitHub Actions com Playwright para testes E2E em PRs/pushes.

**Funcionalidades Principais:**
-   **Sistema de Prescrição Digital Completo**: Geração de receitas digitais com busca ANVISA, montagem de posologia, emissão de PDF com QR Code e hash de segurança, e página de verificação para farmácias.
-   **Chat na Consulta + CID-10/CIAP**: Chat flutuante com WebSocket e autocomplete de códigos.
-   **Página "Meus Pacientes"**: Gerenciamento de pacientes.
-   **Agendamento Real**: Integração com APIs de mercado.
-   **Widget de Suporte/Ajuda**: FAQ e sistema de tickets.
-   **Gateway Consolidado**: `telemed-internal` serve o frontend estático, atua como proxy para serviços como o de leilão, e gerencia health endpoints.

## External Dependencies
-   **AWS S3**: Armazenamento seguro de documentos médicos (PDFs) e geração de URLs assinadas.
-   **PostgreSQL**: Banco de dados relacional.
-   **Render**: Plataforma de deployment.
-   **PDFKit**: Biblioteca para geração de documentos PDF.
-   **Handlebars**: Para templating de documentos PDF.
-   **Playwright**: Ferramenta para testes de ponta a ponta.
-   **Swagger/OpenAPI**: Para documentação da API.
-   **jsonwebtoken**: Para autenticação JWT no backend.
-   **http-proxy-middleware**: Para proxy reverso no backend.
-   **express-rate-limit**: Para controle de taxa de requisições.

## Recent Updates (Oct 13, 2025)

### Migração para Mock Auction Standalone 🚀

**Status:** ✅ Mock standalone implementado e funcional

**Motivação:**
- Separar mock do gateway para facilitar desenvolvimento independente
- Telemetria melhorada com console.table
- Deploy flexível (web + mock como sidecars)

**Arquitetura:**
```
mock-auction.js (porta 3333)
    ↓
Gateway (porta 5000) → Proxy /api/auction → localhost:3333
```

**Arquivos Criados:**
- `mock-auction.js` - Servidor mock standalone com Express
- `.env.example` (atualizado) - USE_LOCAL_AUCTION_MOCK, MOCK_PORT, AUCTION_URL
- `nodemon.json` - Hot-reload config
- `Procfile` - Deploy Heroku/Render (web + mock)
- `docker-compose.yml` - Orquestração Docker com healthchecks
- `MOCK_AUCTION_STANDALONE.md` - Documentação completa

**Endpoints:** POST /bids, POST /search, PUT /bids/:id/increase, POST /accept

**Regras de Negócio:**
- Valor ≥ R$ 180 → 3 imediatos + 6 agendados
- Valor ≥ R$ 160 → 0 imediatos + 6 agendados
- Valor < R$ 160 → 0 médicos

**Dependências:** concurrently, cross-env, nodemon, cors

### Health Check Visual do MedicalDesk 💚

**Status:** ✅ Implementado e testado via Playwright

- Indicador visual no header (bolinha verde/vermelha)
- Polling automático a cada 60s via /medicaldesk/health
- Tooltip com status detalhado
- Testado via Playwright E2E

Arquivo: `apps/telemed-deploy-ready/index.html`

### MedicalDesk na Página de Consulta 🏥

**Status:** ✅ Implementado com sessão real via proxy

**Funcionalidades:**
- **Selo de Status MDA**: Indicador visual com 3 estados
  - 🟢 "MDA: OK ✅" (< 400ms)
  - 🟡 "MDA: Lento ⚠️" (400-1200ms)
  - 🔴 "MDA: Offline ❌" (indisponível)
- **Botão "Regerar sessão (abrir)"**: 
  - Cria sessão JWT via `/api/medicaldesk/session`
  - Abre MedicalDesk na **raiz do SPA**: `/medicaldesk/?token=...`
  - Popup 900x700px com MedicalDesk Advanced proxeado
  - Token expira em 15min (renovável)
- **Health Check Automático**: Polling a cada 60s via `/medicaldesk/health`

**Implementação:**
- **Proxy Corrigido**: `apps/telemed-internal/src/index.js` (linhas 317-345)
  - pathRewrite como função: `(path) => path.replace(/^\/medicaldesk/, '/')`
  - Ordem correta: Proxy → Static → Fallback SPA
  - onError handler para tratamento de erros
  - Validação FEATURE_MEDICALDESK + MEDICALDESK_URL
- **LaunchUrl**: `/medicaldesk/?token=...` (linha 335 e 1055)
  - Usa rota raiz do SPA MedicalDesk (compatível com servidor upstream)
  - Token JWT válido por 15 minutos
- **Botão com Sessão Real**: `apps/telemed-deploy-ready/consulta.html` (linhas 734-773)
  - POST `/api/medicaldesk/session` com patientId + doctorId
  - Abre launchUrl retornado (JWT válido por 15min)
  - Error handling robusto

**Arquivos Modificados:**
- `apps/telemed-internal/src/index.js` (linhas 317-345: Proxy, linha 1011: LaunchUrl)
- `apps/telemed-deploy-ready/consulta.html` (linhas 79-89: HTML, 734-773: JavaScript)

### BidConnect - Modelos de Precificação 💰

**Status:** ✅ Página standalone integrada com mock/API real

**Funcionalidades:**
- **3 Modelos de Precificação**: Conservador, Sugestivo/IA, Dinâmico
- **Componente React via CDN**: Sem build necessário
- **Integração Mock/Real**: 
  - Mock standalone: `mock-auction.js` (porta 3333)
  - Proxy gateway: `/api/auction` → `localhost:3333`
  - URL params: `?model=conservative`
- **Link na Landing**: Card "BidConnect - Precificação" → `/pricing-models.html`

**Arquivos Criados:**
- `apps/telemed-deploy-ready/pricing-models.html` - Componente React standalone
- `apps/telemed-deploy-ready/index.html` - Link atualizado (linha 322)

## Recent Updates (Oct 15, 2025)

### Modernização da Página de Consulta 🎨

**Status:** ✅ Design moderno mesclado com integração MedicalDesk preservada

**Mudanças Aplicadas:**
- **Design Moderno**: Interface atualizada com Inter font, gradiente elegante, layout responsivo
- **Tabs Funcionais**: Chat, Atendimento, Exames, Receitas com navegação suave
- **UI/UX Aprimorada**: Cards modernos, espaçamento consistente, cores harmoniosas
- **Integração MedicalDesk ELEGANTE**: 
  - **Solução Radical com Redirect 302** (linhas 1015-1054 index.js): Endpoint GET `/go/medicaldesk`
  - **Link Simples** (linha 373-380 consulta.html): `<a href="/go/medicaldesk" target="_blank">`
  - SEM popup, SEM JavaScript complexo, SEM problemas de timing
  - Token fresco gerado no servidor a cada clique
  - Pre-warm opcional do servidor MedicalDesk (health check antes do redirect)
  - Usa `/medicaldesk/?token=...` (compatível com servidor upstream)
  - Aceita query params: `?patientId=...&doctorId=...` para sessões personalizadas
  - data-testid="button-mda-open" mantido para testes E2E

**Gateway Proxy - Configuração Final:**
- **SEM pathRewrite**: Proxy passa paths completos `/medicaldesk/?token=...` para upstream
- **Endpoint Redirect**: GET `/go/medicaldesk` (linha 1016) - Gera token + redirect 302
- **SPA Fallback**: Exclui `/medicaldesk` (linha 370 em index.js)
  - Evita servir index.html do telemed-deploy-ready para rotas MedicalDesk
- **Ordem de Middleware**: Proxy MedicalDesk → Static → Fallback (CORRETO)

**Arquivos Modificados:**
- `apps/telemed-deploy-ready/consulta.html` - Design moderno + integração MedicalDesk
- `apps/telemed-internal/src/index.js` - Proxy sem pathRewrite + SPA fallback corrigido
- `apps/telemed-deploy-ready/consulta.html.backup` - Backup da versão anterior

## Recent Updates (Oct 19, 2025)

### MedicalDesk LaunchUrl - Rota Raiz ✅

**Status:** ✅ Confirmado que servidor upstream usa rota raiz

**Mudanças:**
- **Tentativa de `/medicaldesk/app?token=...`**: Testado mas servidor upstream retornou 404
- **Solução Final**: Voltou para `/medicaldesk/?token=...` (rota raiz compatível)
- **Confirmação via curl**: Ambos endpoints (POST e GET) funcionando corretamente

**Arquivos Modificados:**
- `apps/telemed-internal/src/index.js` (linhas 335 e 1055): LaunchUrl usando rota raiz
- `replit.md` - Documentação atualizada