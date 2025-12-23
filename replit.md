# TeleMed Platform - Documentação Concisa

## Overview
A Plataforma TeleMed é uma solução unificada de telemedicina que consolida três aplicações existentes em um monorepo com cinco microserviços. Ela oferece workflows de consulta com leilão reverso e comissão de 20%, calculadoras médicas, prescrição digital, automação de documentos médicos com integração AWS S3, um sistema de triagem médica com IA (Dr. AI Medical Triage), e módulos plug-and-play para chat em consulta, gestão de pacientes, agendamento e um widget de suporte. **Nova fase: Consultório Virtual (Virtual Office) totalmente operacional com React SPA, autenticação JWT, calendário dinâmico e agendamento direto**. O projeto está completo e pronto para produção, focado em compliance com as regulamentações brasileiras de telemedicina. Seu objetivo é otimizar a experiência de telemedicina e ser um produto líder no mercado brasileiro.

## User Preferences
- **Linguagem**: Português brasileiro
- **Comunicação**: Linguagem simples e cotidiana
- **Contexto**: Telemedicina brasileira com compliance CFM
- **Preferência Tech**: React + Wouter + React Query + TypeScript + Zod + Drizzle ORM
- **Deploy**: SEMPRE fornecer comandos git ao final de cada tarefa para deploy no Render

## System Architecture
A plataforma é composta por um monorepo com seis microserviços Dockerizados, orquestrados para deploy no Render.

**Microserviços:**
-   **telemed-auth-server**: Autenticação JWT e gestão de usuários.
-   **telemed-calculator-api**: Calculadoras e ferramentas médicas.
-   **telemed-prescription-api**: Sistema de prescrições digitais e verificação farmacêutica.
-   **telemed-deploy-ready**: Frontend unificado em React.
-   **telemed-docs-automation**: Automação de documentos médicos (receitas e atestados CFM-compliant em PDF, com integração AWS S3).
-   **medical-desk-advanced**: Serviço standalone de protocolos clínicos para demonstrações em hospitais.

**Root Entry Point (Novo - Nov 2025):**
-   **index.js + server.js (raiz)**: Orquestra o TeleMed Internal Gateway que serve Frontend SPA + todas as rotas API (consultório virtual, marketplace, etc.)

**Frontend - Consultório Virtual (Nov 2025 - NOVO):**
-   **Tecnologias**: React 19 com TypeScript, Wouter (Switch/Route), React Query v5, React Hook Form + Zod, Tailwind CSS + shadcn/ui.
-   **Páginas Implementadas**:
    - `/login` – Autenticação JWT com email/senha
    - `/doctor/dashboard` – Métricas, toggle de modo (marketplace/virtual_office/hybrid)
    - `/doctor/virtual-office-setup` – Configurar preços, dias de trabalho, URL customizada
    - `/doctor/my-patients` – Busca e tabela de pacientes
    - `/dr/:customUrl` – Página pública do médico + calendário + agendamento direto
-   **UI/UX**: Loading skeletons, error states, empty states, toasts shadcn, tema teal #2BB3A8, `data-testid` em elementos interativos.
-   **Componentes Reutilizáveis**: ProtectedRoute (JWT + role check), apiFetch (Bearer token automático), useAuth hook.

**Frontend - Existente:**
-   **Tecnologias**: React com TypeScript, React Router, React Query + Context API, Tailwind CSS.
-   **UI/UX**: Modal de prescrição ANVISA, chat flutuante, dashboard de métricas (marketplace), widget de suporte, temas Dark/Light. Dr. AI Medical Triage com interface LGPD-compliant. Integração BidConnect com 3 modelos de precificação. Página de consulta modernizada com tabs (Chat, Atendimento, Exames, Receitas) e integração MedicalDesk.
-   **Ferramentas de Teste/Onboarding**: Guia Interativo do Testador, página de Boas-Vindas, ferramentas de QA automatizadas, Pitch Deck, guia de testes para médicos.

**Backend - Consultório Virtual (Nov 2025 - NOVO):**
-   **Tecnologias**: Express.js + JavaScript (ESM).
-   **Autenticação**: JWT (Bearer token) + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM.
-   **Endpoints Implementados** (10+ rotas):
    - Auth: `POST /api/consultorio/auth/login`, `GET /api/consultorio/auth/me`
    - Doctor: `GET /api/doctor/dashboard`, `PATCH /api/doctor/account-type`
    - Virtual Office: `GET/POST /api/virtual-office/settings`, `GET /api/virtual-office/:customUrl`, slots dinâmicos, agendamento
-   **Validação**: Zod schemas + middleware de validação.
-   **Autenticação Middleware**: Verifica JWT, extrai user/role, rejeita sem token.

**Backend - Existente:**
-   **Tecnologias**: Express.js + TypeScript.
-   **Autenticação**: JWT + bcrypt.
-   **Banco de Dados**: PostgreSQL com Drizzle ORM. Tabelas `bids` e `consultations` com `platform_fee` (20%) e `doctor_earnings` (80%) para auditoria marketplace.
-   **Documentos**: PDFKit + Handlebars com templates profissionais e QR Codes.
-   **Validação**: Zod schemas.
-   **Lógica Marketplace**: Cálculo automático de fees ao aceitar lance.
-   **Gateway Consolidado (`telemed-internal`)**: Serve frontend estático + proxies + health endpoints.

**Infraestrutura e Deploys:**
-   **Deploy**: Render (5 serviços configurados via `render.yaml`) com PostgreSQL gerenciado.
-   **Documentação API**: OpenAPI 3.1 Specification.
-   **Testes Automatizados**: Playwright Smoke Tests com cenários críticos.
-   **CI/CD**: GitHub Actions com Playwright para testes E2E.
-   **Mock Auction Standalone**: Serviço mock independente para leilão/precificação.

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

## Recent Changes (15 Dez 2025)

### Refatoração da Tela de Consulta (ConsultaDetails.tsx)
Nova arquitetura modular com layout grid 2 colunas:

**Novos Componentes em `client/src/features/consultorio/components/`:**
1. **AtendimentoForm.tsx** - Queixa principal + Anamnese grande (campos controlados via props)
2. **DiagnosticoCID.tsx** - Autocomplete CID offline com chips removíveis (25+ CIDs mais comuns)
3. **ClinicalTabs.tsx** - 5 abas clínicas: Exames, Prescrição, Encaminhamento, Arquivos, Notas privadas

**Layout Grid:**
- Linha 1: VideoPanel | AtendimentoForm
- Linha 2: DrAiPanel + ScribeMedicalPanel | DiagnosticoCID
- Linha 3: ClinicalTabs | Paciente & Consulta

**Integração IA → Campos:**
- Dr. AI "Aplicar ao prontuário" → preenche campo Anamnese
- Scribe Medical "Aplicar" → preenche campo Anamnese
- Estados controlados no ConsultaDetails para sincronização

**Componentes Existentes Mantidos:**
- DrAiPanel.tsx (Anamnese Inicial com IA)
- ScribeMedicalPanel.tsx (Documentação automática por áudio)

### Upgrade Scribe Medical - JSON Estruturado (15 Dez 2025)
O Scribe Medical foi atualizado para retornar JSON estruturado, permitindo aplicar cada seção do prontuário separadamente:

**Backend:**
- `apps/telemed-internal/src/config/scribePrompt.js` - Prompt atualizado para retornar JSON com campos estruturados
- `apps/telemed-internal/src/consultorio-routes.js` - Endpoint `/scribe/processar` faz parse do JSON e retorna `{ texto, structured }`
- Campos retornados: queixa_principal, hda, antecedentes_medicacoes_alergias, revisao_sistemas_exame, avaliacao_hipoteses[], exames_sugeridos[], plano_conduta, prescricao_mencionada, encaminhamentos, alertas_seguranca, seguimento, observacao

**Frontend:**
- ScribeMedicalPanel.tsx agora exibe botões por seção: Anamnese, Prescrição, Encaminhamento, Exames
- ConsultaDetails.tsx conecta callbacks para preencher cada campo automaticamente
- Fallback para texto legado se JSON não for parseado