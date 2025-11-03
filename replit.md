# TeleMed Platform - Documentação Concisa

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina que consolida três aplicações existentes em um monorepo com cinco microserviços. Ela oferece workflows de consulta, calculadoras médicas, prescrição digital, automação de documentos médicos com integração AWS S3, um sistema de triagem médica com IA (Dr. AI Medical Triage), e módulos plug-and-play para chat em consulta, gestão de pacientes, agendamento e um widget de suporte. O projeto está completo e pronto para produção, focado em compliance com as regulamentações brasileiras de telemedicina. Seu objetivo é otimizar a experiência de telemedicina e ser um produto líder no mercado brasileiro.

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
-   **telemed-docs-automation**: Automação de documentos médicos (receitas e atestados CFM-compliant em PDF, com integração AWS S3).

**Frontend:**
-   **Tecnologias**: React com TypeScript, React Router, React Query + Context API.
-   **Estilo**: Tailwind CSS + componentes customizados.
-   **UI/UX**: Componentes responsivos, modal de prescrição ANVISA, chat flutuante, filtros de busca, dashboard de métricas em tempo real, e um widget de suporte/ajuda. Inclui um sistema de temas Dark/Light e integração com MedicalDesk. O Dr. AI Medical Triage oferece interface LGPD-compliant, algoritmo de triagem por pattern-matching e sistema de "Red Flags". Integração de leilão/precificação com proxy local e feature flag.
-   **Página de Consulta Modernizada**: Design atualizado com interface responsiva, tabs funcionais (Chat, Atendimento, Exames, Receitas) e integração elegante do MedicalDesk via redirecionamento 302 para uma sessão real.
-   **BidConnect Integration**: Páginas React dedicadas (`/pricing`, `/bidconnect`) com 3 modelos de precificação (Conservador, Sugestivo/IA, Dinâmico), integração API real com fallback para mock local e deep-linking.

**Backend:**
-   **Tecnologias**: Express.js + TypeScript.
-   **Autenticação**: JWT + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM.
-   **Documentos**: PDFKit + Handlebars para geração de documentos com templates profissionais e QR Codes de verificação.
-   **Validação**: Zod schemas.
-   **Gateway Consolidado (`telemed-internal`)**: Serve o frontend estático, atua como proxy para serviços externos (como o de leilão/precificação e MedicalDesk) e gerencia health endpoints.

**Infraestrutura e Deploys:**
-   **Deploy**: Render (5 serviços configurados via `render.yaml`) com PostgreSQL gerenciado.
-   **Documentação API**: OpenAPI 3.1 Specification.
-   **Testes Automatizados**: Playwright Smoke Tests com 6 cenários críticos.
-   **CI/CD**: GitHub Actions com Playwright para testes E2E em PRs/pushes.
-   **Mock Auction Standalone**: Serviço mock independente para leilão/precificação, melhorando telemetria e flexibilidade de deploy.
-   **Guia Interativo do Testador**: Mini-plataforma QA em `apps/telemed-deploy-ready/public/tester-guide.html` com checklist persistente (localStorage), progresso gamificado, busca global, filtros avançados (Paciente/Médico/Integrações/Prioridade/Não Testado), dark mode, bug report com export JSON, dados de teste pré-configurados com copy-to-clipboard, e modo apresentação fullscreen.

## BidConnect - Precificação Dinâmica
-   **3 Modelos Implementados**: Conservador (azul), Sugestivo com IA (roxo), Dinâmico (verde)
-   **Mock Standalone**: 100% embutido, zero network, dados previsíveis para demos
-   **Toggle Mock ↔ Real**: Alternância instantânea via `USE_LOCAL_AUCTION_MOCK` (30 segundos)
-   **Documentação**:
    -   `ROTEIRO-DEMO.md`: Script passo a passo para apresentações (8-10 min)
    -   `TOGGLES-MOCK-REAL.md`: Guia completo de comandos mock/real + fallback de emergência
    -   `GUIA-TESTES-COMPLETO.md`: Manual de testes QA com 25+ cenários e screenshots ASCII
    -   `apps/telemed-deploy-ready/public/bem-vindo.html`: **[NOVO - APRIMORADO]** Página de Boas-Vindas redesenhada com branding TeleMed - hero section com gradientes, 6 cards de features principais (BidConnect, MedicalDesk, Dr. AI), 4 estatísticas visuais (15+ Features, 3 Modelos, 100% Offline, 2 Jornadas), jornadas completas do Paciente e Médico com deep-linking para tester-guide.html via query params (?filter=patient|doctor), dicas de teste eficaz, e CTAs para guia interativo. Design moderno com animações flutuantes, scroll suave e responsividade mobile-first. **Primeiro ponto de entrada recomendado** para novos testadores.
    -   `apps/telemed-deploy-ready/public/welcome.html`: Página de Boas-Vindas original - onboarding completo para testadores com hero section animado, explicação das features, público-alvo, fluxos recomendados (Paciente vs Médico), guia "Como Funciona", dicas de testes e estatísticas da plataforma.
    -   `apps/telemed-deploy-ready/public/tour.html`: **[V3.0 - PÁGINAS CANÔNICAS]** Guia estático completo (324 linhas) com 27 cards, toggle Paciente/Médico, badges coloridos e navegação por papel. **TODOS OS LINKS APONTAM PARA PÁGINAS REAIS CANÔNICAS** - Links do fluxo Paciente: `/sala-de-espera.html`, `/phr.html`, `/consulta.html`, `/bidconnect-standalone.html`. Links do fluxo Médico: `/dashboard-piloto.html`, `/agenda.html`, `/consulta.html`. **Redirects 301 configurados** no servidor (apps/telemed-internal/src/index.js) para garantir que stubs antigos redirecionem para páginas canônicas: `/patient/waiting-room.html` → `/sala-de-espera.html`, `/patient/phr.html` → `/phr.html`, `/medicaldesk-demo/index.html` → `/dashboard-piloto.html`, `/medicaldesk-demo/agenda.html` → `/agenda.html`
    -   `apps/telemed-deploy-ready/public/test-tour-links.html`: **[NOVO]** Ferramenta de QA automatizada - testa todos os 15 links críticos do tour.html com HEAD requests, exibe progresso em tempo real, summary cards (✅ sucesso/❌ falhas/tempo), tabela de resultados e export JSON. Interface dark moderna com validação instantânea
    -   `apps/telemed-deploy-ready/public/smoke-test.html`: **[NOVO - V1.0]** Interface visual de smoke test - valida automaticamente 11 endpoints (6 páginas reais + 4 redirects 301 + landing). Botão "Executar Testes", resultados com badges coloridos (✅ pass / ❌ fail), summary com percentual de sucesso, e verificação de Location headers para redirects. Complementa o test-tour-links.html com foco em páginas canônicas e redirects
    -   `apps/telemed-deploy-ready/public/smoke-test.js`: **[NOVO]** Script Node.js para smoke testing via console ou CLI. Testa páginas canônicas e redirects 301 com fetch manual (redirect: 'manual'), exibe resultados tabelados e retorna taxa de sucesso
    -   `apps/telemed-deploy-ready/public/MAPA-COMPLETO.md`: **[ATUALIZADO]** Documentação completa com **TABELA CANÔNICA** - mapeia URLs reais, aliases de stubs e redirects 301. Legenda clara (✅ REAL / 🔧 STUB / → 301). Guia de teste via console e referência de arquitetura (40+ páginas reais, 5 stubs, 2 proxies)
    -   `scripts/check-pages.sh`: **[NOVO - CI/CD]** Script bash para verificação automática de páginas canônicas em pipelines CI/CD. Testa 7 URLs principais (consulta, sala-de-espera, phr, dashboard-piloto, agenda, bidconnect, landing), retorna exit 0 se OK ou exit 1 se falhar. Integrável com GitHub Actions ou qualquer CI
    -   `apps/telemed-deploy-ready/public/tour-quick.html`: Versão compacta dark (14KB) para testes rápidos com links diretos no topo
    -   `apps/telemed-deploy-ready/public/tester-guide.html`: Guia Interativo do Testador - mini-plataforma QA com 15 cards testáveis, checklist persistente, progresso visual, busca em tempo real, filtros avançados (Paciente/Médico/Integrações/Prioridade/Não Testado), dark mode, bug report com JSON export, dados de teste copy-to-clipboard, modo apresentação fullscreen, e **suporte a filtro por URL** (?filter=patient ou ?filter=doctor) para navegação direta por papel desde a página de boas-vindas
    -   `apps/telemed-deploy-ready/public/pitchdeck.html`: **[APRIMORADO - V2.0 INVESTOR EDITION]** Pitch Deck Profissional para Investidores - apresentação one-pager nível investidor sério com 13 seções: **navbar fixa** com quick links, hero section com **social proof** (Top 10 Healthtech LATAM, prêmios), problema/solução, produto (3 modelos BidConnect), **tração quantitativa** (6 métricas-chave: 500+ pacientes, 50 médicos, NPS 72, retenção M2 68%, match 3.8min, MRR R$27k + gráfico de crescimento), mercado/TAM, modelo de negócio com **comparativo competitivo expandido** (8 linhas: comissões, custos, IA, B2B), unit economics (R$19.10 margem/consulta, CAC R$45, payback 1.7 meses), **riscos & mitigações** (6 riscos: regulatório, unit economics, oferta médica, segurança, competição, churn), roadmap (M0-M12), **ask & use of funds** (R$1.5M-2M, valuation R$12M pre-money, alocação visual 40% marketing/30% produto/20% ops/10% reserva, milestones M6/M12/M18), time/governança, **FAQ investidores** (4 perguntas estratégicas), e **CTA final com urgência** (barra progresso 60% rodada, últimos R$800k disponíveis). Design moderno com gradientes azul/roxo, seções navegáveis por âncoras, responsividade mobile e **analytics tracking** (scroll depth, tempo página, CTA clicks). **Link no menu dropdown** da landing page para acesso direto.
-   **Testes E2E**: Playwright validando os 3 modelos (Conservador R$140→R$180, Sugestivo com card de sugestão IA, Dinâmico com grid de faixas)
-   **Diferenciação Visual**: Badges coloridos, botões temáticos, emojis (sem Lucide Icons - compatibilidade React 18)
-   **Navegação**: Dropdown menu na landing com 2 opções de tour (Completo + Rápido), banner roxo visível com ambos os links

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
-   **MedicalDesk**: Plataforma externa de gestão clínica, integrada via proxy e sessão JWT.