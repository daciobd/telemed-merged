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
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, filtros de busca, dashboard de métricas em tempo real, e um widget de suporte/ajuda.
-   **Dr. AI Medical Triage**: Interface LGPD-compliant, algoritmo de triagem por pattern-matching, sistema de "Red Flags" para urgências, validação médica e dashboard de métricas.
-   **Sistema de Temas**: Suporte a temas Dark/Light com 100% variáveis CSS dinâmicas e persistência via LocalStorage.
-   **MedicalDesk Integration**: Integração com MedicalDesk via JWT e proxy reverso, com fallback para demo.
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

## External Dependencies
-   **AWS S3**: Armazenamento seguro de documentos médicos (PDFs) e geração de URLs assinadas.
-   **PostgreSQL**: Banco de dados relacional.
-   **Render**: Plataforma de deployment.
-   **PDFKit**: Biblioteca para geração de documentos PDF.
-   **Handlebars/Mustache**: Para templating de documentos PDF.
-   **Playwright**: Ferramenta para testes de ponta a ponta.
-   **Swagger/OpenAPI**: Para documentação da API.
-   **jsonwebtoken**: Para autenticação JWT no backend.
-   **http-proxy-middleware**: Para proxy reverso no backend.

## Recent Updates (Oct 11, 2025)

### 💰 TelemedMerged - Sistema Unificado de Precificação/Auction - PRODUÇÃO PRONTA ✅

**Status:** ✅ Implementado e funcionando

**Funcionalidade:** Sistema completo de leilão/precificação com proxy local, feature flag e componentes React + página HTML de demo standalone

**Implementação Completa:**

1. **Backend (Proxy + Feature Flag):**
   - ✅ Proxy reverso: `PROXY /api/auction/*` → `AUCTION_SERVICE_URL`
   - ✅ Endpoint de configuração: `GET /config.js` (expõe feature flags para frontend)
   - ✅ Feature flag: `FEATURE_PRICING` (true/false)
   - ✅ Logging no startup do servidor mostrando status da feature
   - ✅ Dependências: `http-proxy-middleware`

2. **Frontend JavaScript Client:**
   - ✅ Arquivo: `src/services/pricing-client.js`
   - ✅ Funções: `health()`, `createBid()`, `getBid()`, `searchDoctors()`, `increaseBid()`, `acceptDoctor()`
   - ✅ Headers de autenticação unificados (suporta `tm_auth_token` e `jwt`)
   - ✅ Usa `/api/auction` relativo (via proxy local, evita CORS)

3. **Componente React:**
   - ✅ Arquivo: `src/components/TelemedPricingModels.jsx`
   - ✅ Formulário de criação de lance (patientId, specialty, amount, mode)
   - ✅ Busca e exibição de médicos disponíveis
   - ✅ Ação de aceitar médico
   - ✅ Estados: loading, error, result com UI profissional

4. **Rotas Auction Atualizadas:**
   - ✅ Arquivo: `src/routes/auction/shared.ts`
   - ✅ `AUCTION_URL = '/api/auction'` (usa proxy local)
   - ✅ `authHeaders()` - headers unificados com múltiplas chaves de token

5. **Página HTML de Demo Standalone:**
   - ✅ Arquivo: `auction-bid-demo.html`
   - ✅ Interface completa sem bundler (PicoCSS + Vanilla JS)
   - ✅ Cliente de API inline integrado
   - ✅ Slider de valor (R$ 100-300)
   - ✅ Botões: "Buscar médicos" e "Aumentar + R$ 20"
   - ✅ Grid de resultados com badges de disponibilidade (Imediato/Hoje/Amanhã)
   - ✅ Ação de aceitar médico com confirmação
   - ✅ Debug panel com logs de API em tempo real
   - ✅ Link na landing page (index.html) com card "💰 Leilão Conservador"
   - ✅ Integrado ao sistema de lock da landing (não bloqueado)

6. **Configuração (.env.example):**
   ```
   FEATURE_PRICING=true
   AUCTION_SERVICE_URL=http://localhost:5000
   ```

**Validação (Oct 11, 2025):**
- ✅ Servidor exibe: `💰 Pricing/Auction feature: ENABLED`
- ✅ GET `/config.js` retorna `window.TELEMED_CFG` com flags corretas
- ✅ Proxy `/api/auction/*` configurado e funcionando
- ✅ Zero erros JavaScript ou TypeScript
- ✅ Componente React compilado sem erros
- ✅ Página HTML demo acessível em `/auction-bid-demo.html`
- ✅ Card "💰 Leilão Conservador" adicionado na landing page
- ✅ ID `card-auction` na whitelist do lock system

**Como Usar:**
1. Frontend carrega `/config.js` para verificar se `FEATURE_PRICING` está ativo
2. Se ativo, usa `PricingClient`, componente `TelemedPricingModels` ou página HTML standalone
3. Todas as chamadas vão para `/api/auction` (proxy local)
4. Backend faz proxy para `AUCTION_SERVICE_URL`
5. **Acesso direto à demo:** `/auction-bid-demo.html` ou via card na landing page (index.html)

**Arquivos Entregues:**
- `apps/telemed-deploy-ready/auction-bid-demo.html` - Página HTML completa
- `apps/telemed-deploy-ready/src/services/pricing-client.js` - Cliente de API
- `apps/telemed-deploy-ready/src/components/TelemedPricingModels.jsx` - Componente React
- `apps/telemed-deploy-ready/src/routes/auction/shared.ts` - Configurações de rota
- `apps/telemed-deploy-ready/server.js` - Proxy e feature flag configurados
- `apps/telemed-deploy-ready/index.html` - Link para demo adicionado

**Arquivos Atualizados (telemed-internal como Gateway):**
- `apps/telemed-internal/src/index.js` - Proxy /api/auction, endpoint /config.js, rate limiting
- `apps/telemed-internal/package.json` - Dependências http-proxy-middleware e express-rate-limit
- `apps/telemed-internal/.env.example` - Variáveis de ambiente para FEATURE_PRICING e AUCTION_SERVICE_URL

**Arquitetura de Deployment:**
- **telemed-deploy-ready**: Frontend + proxy local (desenvolvimento)
- **telemed-internal**: Gateway principal com proxy consolidado (produção)
- Ambos os serviços compartilham JWT_SECRET para autenticação unificada
- Rate limiting configurado (120 req/min) no gateway principal