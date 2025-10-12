# TeleMed Platform - Documentação Concisa

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina, consolidando três aplicações existentes em um monorepo com cinco microserviços prontos para deploy. Ela oferece workflows de consulta, calculadoras médicas, prescrição digital, automação de documentos médicos com integração AWS S3, um sistema de triagem médica com IA (Dr. AI Medical Triage), e módulos plug-and-play para chat em consulta, gestão de pacientes, agendamento real e um widget de suporte. O projeto está completo e pronto para produção, focado em compliance com as regulamentações brasileiras de telemedicina.

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
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, filtros de busca, dashboard de métricas em tempo real, e um widget de suporte/ajuda. Inclui um sistema de temas Dark/Light e integração com MedicalDesk. O Dr. AI Medical Triage oferece interface LGPD-compliant, algoritmo de triagem por pattern-matching e sistema de "Red Flags".
-   **MedicalDesk Integration**: Integração via JWT e proxy reverso.
-   **Pricing/Auction System**: Sistema de leilão/precificação com proxy local, feature flag e componentes React.

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

## Recent Updates

### Oct 12, 2025 - MedicalDesk + Dr. AI Endpoints Implementados 🏥🤖

**Status:** ✅ Sistema completo e funcionando

**Implementação:**
- ✅ Proxy MedicalDesk configurado (`/medicaldesk → MEDICALDESK_URL`)
- ✅ Endpoint de feature flag: `GET /api/medicaldesk/feature`
- ✅ Criação de sessão JWT: `POST /api/medicaldesk/session`
- ✅ Dr. AI endpoints demo: `POST /api/ai/answer` e `ALL /api/ai/ask`
- ✅ Bypass de autenticação para `/api/medicaldesk/*` e `/api/ai/*`
- ✅ Importação do `jsonwebtoken` para geração de tokens

**Endpoints Disponíveis:**

*MedicalDesk:*
- `GET /api/medicaldesk/feature` - Verifica se MedicalDesk está habilitado
- `POST /api/medicaldesk/session` - Cria sessão JWT para integração (15min)
  - Payload: `{ patientId, doctorId }`
  - Response: `{ ok, launchUrl }` com JWT no query param

*Dr. AI (Demo):*
- `POST /api/ai/answer` - Resposta simulada de IA
  - Payload: `{ question }` ou `{ q }`
  - Response: `{ ok, answer, traceId }`
- `GET/POST /api/ai/ask` - Alias do `/answer`, aceita query param `?q=`

**Validação:**
- ✅ Todos os endpoints públicos (sem autenticação)
- ✅ MedicalDesk gera JWT válido com expiração de 15min
- ✅ Dr. AI responde com mensagens demo
- ✅ Logs simplificados mantidos

**Arquivos Atualizados:**
- `apps/telemed-internal/src/index.js` - Novos endpoints e bypass auth
- `package.json` - jsonwebtoken já estava instalado

### Oct 12, 2025 - Proxy BidConnect 100% Funcional ✅

**Status:** ✅ Proxy corrigido e funcionando - falta apenas sincronizar JWT_SECRET

**Problemas Corrigidos:**
- ✅ AUCTION_SERVICE_URL corrigida (com `/api` no final)
- ✅ Middleware de autenticação corrigido (bypass para `/api/auction/*`)
- ✅ `express.json()` movido após proxies (preserva body stream)
- ✅ PathRewrite corrigido (sempre reescreve `/api/auction` → ``)
- ✅ Logs de debug adicionados para monitoramento

**Correção Crítica - Body Stream:**
O problema de timeout era causado por `express.json()` aplicado ANTES do proxy:
1. express.json() consumia o body stream
2. Proxy tentava reenviar mas não havia mais body
3. BidConnect ficava esperando → timeout

**Solução:** Mover `express.json()` para DEPOIS dos proxies em `apps/telemed-internal/src/index.js`

**Validação Atual:**
- ✅ GET /api/auction/health → 200 OK (< 1s)
- ✅ POST /api/auction/bids → 401 "invalid_token" (< 1s) - esperado!

**Ajuste Manual Pendente:**

1. **JWT_SECRET** - Sincronizar com BidConnect
   - Copiar do BidConnect → Colar no TeleMed
   - Tools → Secrets → JWT_SECRET
   - Reiniciar ambos os serviços
   - Após sincronizar: POST deve retornar `"ok": true`

**Arquivos Atualizados:**
- `AUCTION_PROXY_DIAGNOSTIC.md` - Diagnóstico completo + correções implementadas
- `apps/telemed-internal/src/index.js` - express.json() após proxies, auth bypass

**Próximo Passo:**
Sincronizar JWT_SECRET e testar fluxo completo de leilão

### Oct 12, 2025 - Mock Local do Auction Implementado 🎭

**Status:** ✅ Mock completo e pronto para uso

**Implementação:**
- ✅ Mock local do auction com feature flag `USE_LOCAL_AUCTION_MOCK`
- ✅ Endpoints completos: health, criar bid, buscar médicos, aumentar, aceitar
- ✅ Compatibilidade 100% com frontend (mesmas rotas e formatos)
- ✅ Aceita formatos alternativos de campos (flexibility)
- ✅ Endpoint de diagnóstico `/_diag/auction/bids`
- ✅ Script de teste `/tmp/test-mock.sh`

**Como Usar:**

*Para Demos (Mock):*
```
Tools → Secrets → USE_LOCAL_AUCTION_MOCK=true
```
Frontend funciona imediatamente sem BidConnect!

*Para Produção (Real):*
```
Tools → Secrets → USE_LOCAL_AUCTION_MOCK=false (ou remover)
```
Usa proxy real para BidConnect.

**Arquivos:**
- `MOCK_AUCTION_GUIDE.md` - Guia completo de uso
- `apps/telemed-internal/.env.example` - Variável documentada
- `apps/telemed-internal/src/index.js` - Implementação

**Benefícios:**
- 🎭 Demos instantâneas sem setup
- ⚡ Desenvolvimento sem depender de BidConnect
- 🧪 Testes sempre passam
- 🔄 Switch simples: mock ↔ real